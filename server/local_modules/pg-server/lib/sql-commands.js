'use strict'

// const _ = require('lodash')
const Handlebars = require('handlebars')
const fs = require('fs')

const wordRegEx = /^\w+$/i
// const fieldRegEx = /^(?:"?(\w+)"?\.)?("?\w+"?)(?:(?:\s+as)?\s+"?(\w+)"?)?$/i
// const firstWord = /^(\w+)/
// const lastWord = /(\w+)$/
const joinRegEx = /^(?:natural\s+)?(?:(?:left|right|full|cross)\s+)?(?:(?:inner|outer)\s+)?join/i
// const sorterRegEx = /^(\w+)(?:\s+(asc|desc))?$/i

const ensure = (definition, Class) => definition instanceof Class ? definition : new Class(definition)

const stringOrFn = item => {
  let type = typeof item
  return type === 'string' || type === 'function'
}

// const compilable = str => str.includes('{{')

const compileStrings = item => {
  if (typeof item === 'string') {
    return item.includes('{{') ? Handlebars.compile(item) : item
  } else if (typeof item === 'object' && !(item instanceof Base)) {
    for (let k in item) {
      item[k] = compileStrings(item[k])
    }
  }
  return item
}

const resolve = (item, incoming, join) => {
  if (!item) {
    return item
  } else if (typeof item === 'function') {
    incoming.$begin()
    try {
      item = item(incoming)
      if (!item) {
        incoming.$rollback()
      }
      return item
    } catch (e) {
      incoming.$rollback()
      return null
    }
  } else if (typeof item.resolve === 'function') {
    return item.resolve(incoming)
  } else if (Array.isArray(item)) {
    return resolveArray(item, incoming, join)
  } else {
    return item
  }
}

const resolveArray = (array, incoming, join = ',') => {
  let i = 0, len = array.length
  let str = '', toAdd
  for (; i < len; i++) {
    toAdd = resolve(array[i], incoming)
    if (toAdd) {
      if (str) str += join
      str += toAdd
    }
  }
  return str
}

// const parseField = (string, asString) => {
//   let result = fieldRegEx.exec(string.trim())
//   if (result) {
//     let [, table, field, alias] = result
//     return {
//       table,
//       field,
//       alias
//     }
//   } else {
//     throw new Error(`Malformed field '${string}'`)
//   }
// }

// const getRawFieldName = string => {
//   let result = lastWord.exec(string)
//   if (result) {
//     return result[1]
//   }
//   result = firstWord.exec(string)
//   if (result) {
//     return result[1]
//   }
//   return '?column?'
// }

// const parseTable = string => {
//     let result = parseField(string)
//     result.schema = result.table
//     result.table = result.field
//     delete result.field
//     return result
// }

// const parseSorter = string => {
//   string = string.trim()
//   let result = sorterRegEx.exec(string)
//   if (result) {
//     let [, field, direction] = result
//     return {
//       field,
//       direction
//     }
//   } else {
//     throw new Error(`Malformed sorter '${string}'`)
//   }
// }

// const handlebarOptions = {
//   strict: true
// }

Handlebars.registerHelper('value', function (value) {
  if (value === undefined) throw new Error('Missing value detected')
  return this.$value(value)
})

// const getRelation = table => tables[table]// || (tables[table] = new Relation(table))

class Incoming {
  constructor (data) {
    Object.assign(this, data)
    this.values = []
  }
  $value (value) {
    let values = this.values
    values.push(value)
    return `$${values.length}`
  }
  $begin () {
    this.count = this.values.length
  }
  $rollback () {
    let {count, values} = this
    let len = values.length
    if (len > count) {
      values.splice(count, len - count)
    }
  }
}

class Relation {
  constructor (definition) {
    Object.assign(this, definition)
  }
}

class Database {
  constructor (definitions) {
    Object.assign(this, definitions)
    let schema, schemaName, table
    for (schemaName in definitions) {
      schema = definitions[schemaName]
      for (table in schema) {
        schema[table] = new Relation(schema[table])
      }
    }
  }
  getRelation (table, schema) {
    return this[schema][table]
  }
}

class Base {
  constructor (definition) {
    if (!definition) {
      throw new Error('Queries require a definition to be instantiated')
    }
    this.definition = compileStrings(this.prepare ? this.prepare(definition) : definition)
  }
}

class Connection {
  constructor (definitions) {
    if (typeof definitions === 'string') {
      definitions = fs.readFileSync(definitions)
    }
    this.database = new Database(definitions)
    this.instanciateQueries()
  }

  instanciateQueries () {
    // const getRelation = (table, schema = 'public') => this.database.getRelation(table, schema)

    const createQuery = (definition, defaultType) => {
      if (definition instanceof Base) {
        return definition
      }
      if (stringOrFn(definition)) {
        return new this.Raw(definition)
      }
      let type = definition.queryType || defaultType
      delete definition.queryType
      type = type.toLowerCase()
      type = type[0].toUpperCase() + type.slice(1)
      if (this[type]) {
        return new this[type](definition)
      } else {
        throw new Error(`No query of type '${type}' detected.`)
      }
    }

    class List {
      constructor (items) {
        this.init(items)
      }
      init (items) {
        this.array = []
        this.addAll(items)
      }
      add (...items) {
        let {array} = this
        let i, len
        for (i = 0, len = items.length; i < len; i++) {
          array.push(this.prepare(items[i]))
        }
      }
      addAll (items) {
        return this.add.apply(this, items)
      }
    }

    class Logic extends List {
      constructor (items, join = 'AND') {
        super(items)
        this.join = join
      }
      resolve (incoming) {
        return resolveArray(this.array, incoming, ` ${this.join} `)
      }
      prepare (item) {
        if (item instanceof Array) {
          return new Logic (item, this.join === 'AND' ? 'OR' : 'AND')
        // } else if (typeof item === 'string' && compilable(item)) {
        //   return Handlebars.compile(item)
        } else {
          return item
        }
      }
    }

    class From extends Base {
      prepare (definition) {
        let table = definition.table
        if (typeof table === 'object') {
          definition.table = createQuery(table, 'select')
        }
        return definition
      }
      resolve (incoming) {
        let definition = this.definition
        if (stringOrFn(definition)) {
          return resolve(definition, incoming)
        }
        let { table, schema, alias } = definition
        let sql
        if (table) {
          table = resolve(table, incoming)
          sql = wordRegEx.test(table) ? table : `(${table})`
          if (schema) {
            sql = `${resolve(schema, incoming)}.${sql}`
          }
          if (alias) {
            sql += ` AS ${alias}`
          }
          return sql
        } else {
          throw new Error('Expected a table in the from statement, but no table was provided')
        }
      }
    }

    class Join extends From {
      resolve (incoming) {
        let sql = super.resolve(incoming)
        let definition = this.definition
        if (typeof definition === 'object') {
          let { type, on } = definition
          if (type === ',') {
            return `,${sql}`
          }
          if (on) {
            sql += ` ON ${on}`
          }
          return ` ${type} ${sql}`
        } else {
          sql = sql.trim()
          if (joinRegEx.test(sql)) {
            return ` ${sql}`
          } else {
            return `,${sql}`
          }
        }
      }
      getType (definition) {return definition.type || (definition.on ? 'JOIN' : ',')}
      set type (v) {this._type = v}
    }

    class WithClause extends Base {
      prepare (definition) {
        if (typeof definition === 'object') {
          if (!('queries' in definition)) {
            definition = {queries: definition}
          }
          let queries = definition.queries
          if (!Array.isArray(queries)) {
            definition.queries = queries = [queries]
          }
          definition.queries = queries.map(query => ensure(query, WithQuery))
        }
        return definition
      }
      resolve (incoming) {
        let definition = this.definition
        if (stringOrFn(definition)) {
          return resolve(definition, incoming)
        }
        let {queries, recursive} = definition
        let sql = recursive ? 'RECURSIVE ' : ''
        sql += resolveArray(queries, incoming)
        return sql
      }
    }

    class WithQuery extends Base {
      prepare (definition) {
        if (typeof definition === 'object') {
          let query = definition.query
          if (query && typeof query === 'object') {
            definition.query = createQuery(query, 'select')
          }
        }
        return definition
      }
      resolve (incoming) {
        let definition = this.definition
        if (stringOrFn(definition)) {
          return resolve(definition, incoming)
        }
        let {alias, columns, query} = definition
        let sql = alias
        if (columns) {
          sql += ` (${resolve(columns, incoming)})`
        }
        sql += ` AS (${resolve(query, incoming)})`
        return sql
      }
    }

    class Raw extends Base {
      resolve (incoming) {
        return resolve(this.definition, incoming)
      }
    }

    class Select extends Base {
      prepare (definition) {
        if (stringOrFn(definition)) {
          definition = {from: definition}
        }
        let {from, with: withClause, where} = definition
        if (withClause) {
          definition.with = ensure(withClause, WithClause)
        }
        if (from) {
          from = Array.isArray(from) ? from : [from]
          if (from.length === 0) {
            delete definition.from
          } else {
            definition.from = from.map((fromInstance, index) => ensure(fromInstance, index ? Join : From))
          }
        }
        if (where) {
          definition.where = ensure(where, Logic)
        }
        return definition
      }
      resolve (incoming) {
        let {from, with: withClause, distinct, fields, where, groupBy, orderBy} = this.definition
        let sql = 'SELECT'
        if (withClause) {
          sql = `WITH ${withClause.resolve(incoming)} ${sql}`
        }
        if (distinct) {
          sql += ' DISTINCT'
          if (distinct !== true) {
            sql += ` ON (${distinct})`
          }
        }
        sql += ` ${resolve(fields, incoming) || '*'}`
        if (from) {
          sql += ` FROM ${resolveArray(from, incoming, '')}`
        }
        if (where) {
          where = where.resolve(incoming)
          if (where) sql += ` WHERE ${where}`
        }
        if (groupBy) {
          sql += ` GROUP BY ${resolve(groupBy, incoming)}`
        }
        if (orderBy) {
          sql += ` ORDER BY ${resolve(orderBy, incoming)}`
        }
        return sql
      }
    }
    class Insert extends Base {
      prepare (definition) {
        if (stringOrFn(definition)) {
          definition = {into: definition}
        }
        return definition
      }
    }
    class Multiple extends Base {
      prepare (definition) {
        if (Array.isArray(definition)) {
          definition = {queries: definition}
        }
        let queries = definition.queries
        if (queries) {
          definition.queries = queries.map(query => createQuery(query, 'select'))
        } else {
          throw new Error('\'queries\' is required for class Multiple')
        }
        return definition
      }
      resolve (incoming) {
        let {type = 'UNION', queries} = this.definition
        return `(${resolveArray(queries, incoming, `) ${type} (`)})`
      }
    }

    this.Base = Base
    this.Select = Select
    this.Insert = Insert
    this.Multiple = Multiple
    this.Raw = Raw
    this.Incoming = Incoming
  }
}


module.exports = Connection