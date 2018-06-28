'use strict'

const _ = require('lodash')
const Handlebars = require('handlebars')
const objectPath = require('object-path')
const fs = require('fs')

const wordRegEx = /^\w+$/i
const tableRegEx = /^(?:(?:(\w+)|"(.+)")\.)?(?:(\w+)|"(.+)")/i
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

const resolve = (item, context, join) => {
  if (!item) {
    return item
  } else if (typeof item === 'function') {
    context.$begin()
    try {
      item = item(context)
      if (!item) {
        context.$rollback()
      }
      return item
    } catch (e) {
      context.$rollback()
      return null
    }
  } else if (typeof item.resolve === 'function') {
    return item.resolve(context)
  } else if (Array.isArray(item)) {
    return resolveArray(item, context, join)
  } else {
    return item
  }
}

const resolveArray = (array, context, join = ',') => {
  let i = 0, len = array.length
  let str = '', toAdd
  for (; i < len; i++) {
    toAdd = resolve(array[i], context)
    if (toAdd) {
      if (str) str += join
      str += toAdd
    }
  }
  return str
}

const createValues = (values, columns, context) => `(${columns.map(column => column in values ? context.$value(values[column]) : 'DEFAULT')})`

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

Handlebars.registerHelper('values', function (valuesArray) {
  if (valuesArray === undefined) throw new Error('No values object found')
  if (typeof valuesArray !== 'object') throw new Error('Values must be an object')
  if (!Array.isArray(valuesArray)) {
    valuesArray = [valuesArray]
  }
  return valuesArray.map(values => createValues(values, this.$getExpected(), this))
})

// const getRelation = table => tables[table]// || (tables[table] = new Relation(table))

class Context {
  constructor (data) {
    Object.assign(this, data)
    this.$values = []
    this.$expected = []
  }
  $value (value) {
    let values = this.$values
    values.push(value)
    return `$${values.length}`
  }
  $create (query) {
    this.$query = query.resolve(this)
  }
  $begin () {
    this.$count = this.$values.length
  }
  $rollback () {
    let {$count, $values} = this
    let len = $values.length
    if (len > $count) {
      $values.splice($count, len - $count)
    }
  }
  $pushExpected (expected) {
    this.$expected.push(expected)
  }
  $popExpected () {
    this.$expected.pop()
  }
  $getExpected () {
    let expected = this.$expected
    return expected[expected.length - 1]
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
      let type = definition.qt || defaultType
      delete definition.qt
      type = type.toLowerCase()
      type = type[0].toUpperCase() + type.slice(1)
      if (this[type]) {
        return new this[type](definition)
      } else {
        throw new Error(`No query of type '${type}' detected.`)
      }
    }

    const getRelation = table => {
      let result = tableRegEx.exec(table.trim())
      if (result) {
        let [, schema1, schema2, table1, table2] = result
        return this.database.getRelation(table1 || table2, schema1 || schema2)
      } else {
        throw new Error(`Malformed table '${table}'`)
      }
    }

    class Logic extends Base {
      prepare (definition) {
        if (Array.isArray(definition)) {
          definition = {array: definition}
        } else if (!definition.array) {
          definition = {array: [definition]}
        }
        if (!definition.join) {
          definition.join = 'AND'
        }
        let join = definition.join.toLowerCase()
        definition.array.map(item => {
          if (typeof item === 'string') {
            return item
          } else if (Array.isArray(item)) {
            return {
              array: item,
              join: join === 'and' ? 'OR' : 'AND'
            }
          }
        })
        return definition
      }
      resolve (context) {
        let { array, join } = this.definition
        return resolveArray(array, context, ` ${join} `)
      }
    }

    class Table extends Base {
      resolve (context) {
        let definition = this.definition
        if (stringOrFn(definition)) {
          return resolve(definition, context)
        }
        let { table, schema, alias } = definition
        let sql = resolve(table, context)
        if (schema) {
          sql = `${resolve(schema, context)}.${sql}`
        }
        if (alias) {
          sql += ` AS ${alias}`
        }
        return sql
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
      resolve (context) {
        let definition = this.definition
        if (stringOrFn(definition)) {
          return resolve(definition, context)
        }
        let { table, schema, alias } = definition
        let sql
        if (table) {
          table = resolve(table, context)
          sql = wordRegEx.test(table) ? table : `(${table})`
          if (schema) {
            sql = `${resolve(schema, context)}.${sql}`
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
      resolve (context) {
        let sql = super.resolve(context)
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
      resolve (context) {
        let definition = this.definition
        if (stringOrFn(definition)) {
          return resolve(definition, context)
        }
        let {queries, recursive} = definition
        let sql = recursive ? 'RECURSIVE ' : ''
        sql += resolveArray(queries, context)
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
      resolve (context) {
        let definition = this.definition
        if (stringOrFn(definition)) {
          return resolve(definition, context)
        }
        let {alias, columns, query} = definition
        let sql = alias
        if (columns) {
          sql += ` (${resolve(columns, context)})`
        }
        sql += ` AS (${resolve(query, context)})`
        return sql
      }
    }

    class Raw extends Base {
      resolve (context) {
        return resolve(this.definition, context)
      }
    }

    class Select extends Base {
      prepare (definition) {
        if (stringOrFn(definition)) {
          definition = {from: definition}
        }
        let {from, with: withClause, where, having} = definition
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
        if (having) {
          definition.having = ensure(having, Logic)
        }
        return definition
      }
      resolve (context) {
        let {from, with: withClause, distinct, fields, where, groupBy, having, orderBy, limit, offset} = this.definition
        let sql = 'SELECT'
        if (withClause) {
          sql = `WITH ${withClause.resolve(context)} ${sql}`
        }
        if (distinct) {
          sql += ' DISTINCT'
          if (distinct !== true) {
            sql += ` ON (${distinct})`
          }
        }
        sql += ` ${resolve(fields, context) || '*'}`
        if (from) {
          sql += ` FROM ${resolveArray(from, context, '')}`
        }
        if (where) {
          where = where.resolve(context)
          if (where) sql += ` WHERE ${where}`
        }
        if (groupBy) {
          groupBy = resolve(groupBy, context)
          sql += ` GROUP BY ${groupBy}`
        }
        if (having) {
          having = having.resolve(context)
          if (having) sql += ` HAVING ${having}`
        }
        if (orderBy) {
          orderBy = resolve(orderBy, context)
          if (orderBy) sql += ` ORDER BY ${orderBy}`
        }
        if (limit) {
          limit = resolve(limit, context)
          if (limit) sql += ` LIMIT ${limit}`
        }
        if (offset) {
          offset = resolve(offset, context)
          if (offset) sql += ` OFFSET ${offset}`
        }
        return sql
      }
    }
    class Insert extends Base {
      prepare (definition) {
        if (stringOrFn(definition)) {
          definition = {into: definition}
        }
        let {into, with: withClause, values} = definition
        if (into) {
          definition.into = ensure(into, Table)
        }
        if (withClause) {
          definition.with = ensure(withClause, WithClause)
        }
        if (values && typeof values === 'object') {
          definition.values = createQuery(values, 'select')
        }
        return definition
      }
      resolve (context) {
        let {into, columns, with: withClause, values, returning} = this.definition
        into = resolve(into, context)
        let sql = `INSERT INTO ${into}`
        if (withClause) {
          sql = `WITH ${withClause.resolve(context)} ${sql}`
        }
        if (!columns) {
          columns = _.keys(getRelation(into).columns)
        }
        sql += ` (${resolve(columns, context)})`
        context.$pushExpected(columns)
        if (stringOrFn(values)) {
          sql += ` VALUES ${resolve(values, context)}`
        } else {
          sql += ` ${values.resolve(context)}`
        }
        context.$popExpected()
        if (returning) {
          sql += ` RETURNING ${resolve(returning, context)}`
        }
        return sql
      }
    }
    class Each extends Base {
      prepare (definition) {
        definition.query = createQuery(definition.query, 'select')
        return definition
      }
      resolve (context) {
        let {path, query} = this.definition
        let array = objectPath.get(context, path)
        if (!Array.isArray(array)) {
          throw new Error(`Object at path '${path}' is not an array`)
        }
        return array.map(item => {
          let itemContext = new Context(item)
          itemContext.$parentContext = context
          itemContext.$create(query)
          return itemContext
        })
      }
    }
    // class Values extends Base {
    //   prepare (definition) {
    //     if (!Array.isArray(definition)) {
    //       definition = [definition]
    //     }
    //     if (!Array.isArray(definition)[0]) {
    //       definition = [definition]
    //     }
    //   }
    //   resolve (context) {
    //     return this.definition.map(values => `(${resolve(values, context)})`).join()
    //   }
    // }
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
      resolve (context) {
        let {type = 'UNION', queries} = this.definition
        return `(${resolveArray(queries, context, `) ${type} (`)})`
      }
    }

    this.Base = Base
    this.Select = Select
    this.Insert = Insert
    this.Each = Each
    this.Multiple = Multiple
    this.Raw = Raw
    this.Context = Context
    this.createQuery = createQuery
  }
}

module.exports = Connection