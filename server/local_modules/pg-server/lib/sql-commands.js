'use strict'

// const _ = require('lodash')
const Handlebars = require('handlebars')

// const wordRegEx = /\w+/i
const fieldRegEx = /^(?:(\w+)\.)?(\w+)(?:(?:\s+as)?\s+(\w+))?$/i
const firstWord = /^(\w+)/
const lastWord = /(\w+)$/
// const sorterRegEx = /^(\w+)(?:\s+(asc|desc))?$/i

const ensure = (definition, Class) => definition instanceof Class ? definition : new Class(definition)

const resolveArray = (array, incoming, join = ',') => {
  let i = 0, len = array.length
  let str = '', toAdd, item
  for (; i < len; i++) {
    item = array[i]
    if (typeof item === 'function') {
      incoming.begin()
      try {
        toAdd = item(incoming)
      } catch (e) {
        toAdd = null
        incoming.rollback()
      }
    } else if (item.resolve) {
      toAdd = item.resolve(incoming)
    } else {
      toAdd = item
    }
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

const getRawFieldName = string => {
  let result = lastWord.exec(string)
  if (result) {
    return result[1]
  }
  result = firstWord.exec(string)
  if (result) {
    return result[1]
  }
  return '?column?'
}

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

const resolveValue = (value, incoming) => {
  let values = incoming.values
  values.push(value)
  return `$${values.length}`
}

Handlebars.registerHelper('value', function (value) {
  if (value === undefined) throw new Error('Missing value detected')
  return resolveValue(value, this)
})

// const getRelation = table => tables[table]// || (tables[table] = new Relation(table))

class Incoming {
  constructor (data) {
    Object.assign(this, data)
    this.values = []
  }
  begin () {
    this.count = this.values.length
  }
  rollback () {
    let {count, values} = this
    let len = values.length
    if (len > count) {
      values.splice(count, len - count)
    }
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
    } else if (typeof item === 'string' && item.includes('{{')) {
      return Handlebars.compile(item)
    } else {
      return item
    }
  }
}

class Fields extends List {
  // constructor (items) {
  //     super(items)
  //     this.names = []
  // }
  init (items) {
    this.names = []
    super.init(items)
  }
  prepare (item) {
    let sql, name
    switch (typeof item) {
    case 'function': 
      sql = item
      name = null
      break
    case 'string':
      item = item.trim()
      sql = fieldRegEx.exec(item)
      if (sql) {
        name = sql[3] || sql[2]
        sql = sql[0]
      } else {
        name = getRawFieldName(item)
        sql = item
      }
      break
    }
    if (name) {
      this.names.push(name)
    }
    return sql
  }
}

class From {
  constructor (definition) {
    if (typeof definition === 'string') {
      definition = From.parse(definition)
    }
    Object.assign(this, definition)
    let { table, alias, fields } = this
    // let i, len, field
    if (table) {
      this.table = table = Select.prepareTable(table)
      // if (fields) {
      //     this.fields = []
      //     for (i = 0, len = fields.length i < len i++) {
      //         try {
      //             this.fields[i] = parseField(fields[i])
      //         } catch (e) {
      //             this.fields[i] = fields[i]
      //         }
      //     }
      // }
      // console.log(this.fields)
    } else {
      throw new Error('Expected a table in the from statement, but no table was provided')
    }
    if (fields && !Array.isArray(fields)) {
      this.fields = [fields]
    }
  }
  static parse (string) {
    let result = fieldRegEx.exec(string.trim())
    if (result) {
      let [, schema, table, alias] = result
      return {
        schema,
        table,
        alias
      }
    } else {
      throw new Error(`Malformed table '${string}'`)
    }
    // let result = parseField(string)
    // result.schema = result.table
    // result.table = result.field
    // delete result.field
    // return result
  }
  getFields () {
    return this.fields || []
    // let {fields, ignore, alias} = this
    // let tableFields = this.table.getFields()
    // // let i, len
    // if (fields) {
    //   return fields.map(col => {
    //     col = fieldRegEx.exec(col.trim())
    //     if (col) {
    //       let [, , field, fieldAlias] = col
    //       field = `${alias}.${field}`
    //       if (fieldAlias) {
    //         field += ` AS ${fieldAlias}`
    //       }
    //       return field
    //     }
    //     throw new Error(`Malformed field '${col}'`)
    //   })
    // } else if (ignore) {
    //   if (ignore === '*') {
    //     return []
    //   }
    //   return tableFields
    //     .filter(col => !ignore.includes(col))
    //     .map(col => `${alias}.${col}`)
    // } else {
    //   return tableFields.map(col => `${alias}.${col}`)
    // }
  }
  resolveTable (incoming) {
    let { table, schema } = this
    let sql = typeof table === 'string' ? table : table.resolve(incoming)
    if (schema) {
      sql = `${schema}.${sql}`
    }
    // if (!(table instanceof Relation)) {
    //   sql = `(${sql})`
    // }
    return sql
  }
  resolve (incoming) {
    return `${this.resolveTable(incoming)} AS ${this.alias}`
  }
  // resolveFields (alias) {
  //     let {table, fields, ignore} = this
  //     let retFields = []
  //     let i, len, field
  //     if (!fields) {
  //         fields = table.getFields()
  //         if (table instanceof Relation) {
  //             if (ignore) {
  //                 fields = fields.filter(item => ignore.indexOf(item) === -1)
  //             }
  //             return `${alias}.${fields.join(`,${alias}.`)}`
  //         }
  //     }
  //     return fields.map(field => typeof field === 'string' ? field : `${field.table || alias}.${field.field}${field.alias ? ` AS ${field.alias}`: ''}`)
  // }
  // resolve (incoming) {
  //     let alias = this.resolveAlias(incoming)
  //     let from = this.resolveFrom(incoming, alias)
  //     if (ignoreFields) {
  //         return from
  //     }
  //     let ret = {from}
  //     ret.fields = this.resolveFields(alias)
  //     return ret
  // }
}

class Join extends From {
  resolve (incoming) {
    let sql = super.resolve(incoming)
    let { type, on } = this
    if (type !== ',') {
      type = ` ${type}`
    }
    if (on) {
      sql += ` ON ${on}`
    }
    return `${type} ${sql}`
  }
  get type () {return this._type || (this.on ? 'JOIN' : ',')}
  set type (v) {this._type = v}
}

// class Field {
//     constructor (definition, defaultTable) {
//         if (typeof definition === 'string') {
//             definition = parseField(definition)
//         }
//         Object.assign(this, definition)
//         if (!this.table && defaultTable) {
//             this.table = defaultTable
//         }
//     }
//     resolve () {
//         let {table, field, alias} = this
//         if (table) {
//             field = `${table}.${field}`
//         }
//         if (alias) {
//             field += ` AS ${alias}`
//         }
//     }
//     static parse (string) {
//         let result = fieldRegEx.exec(string.trim())
//         if (result) {
//             let [match, table, field, alias] = result
//             return {
//                 table,
//                 field,
//                 alias
//             }
//         } else {
//             throw new Error(`Malformed field '${string}'`)
//         }
//     }
// }

class Query {
  constructor (definition) {
    if (!definition) {
      throw new Error('Queries require a definition to be instantiated')
    }
    this.prepare(definition)
  }
}

class Raw extends Query {
  prepare (definition) {
    if (definition.includes('{{')) {
      this.rawQuery = Handlebars.compile(definition)
    } else {
      this.rawQuery = definition
    }
  }
  resolve (incoming) {
    let rawQuery = this.rawQuery
    return typeof rawQuery === 'string' ? rawQuery : rawQuery(incoming)
  }
}

class Select extends Query {
  prepare (definition) {
    if (typeof definition === 'string') {
      this.from = definition
    } else {
      Object.assign(this, definition)
    }
    this._aliasNum = 0
    let {from, with: withClause, fields, where} = this
    // let i, len
    this.fields = fields = new Fields(fields)
    if (from) {
      from = Array.isArray(from) ? from : [from]
      if (from.length === 0) {
        delete this.from
      } else {
        this.from = from.map((fromInstance, index) => {
          fromInstance = ensure(fromInstance, index ? Join : From)
          if (!fromInstance.alias) {
            fromInstance.alias = this.nextAlias()
          }
          fields.addAll(fromInstance.getFields())
          return fromInstance
        })
      }
    }
    if (where) {
      this.where = new Logic(where)
    }
  }
  resolve (incoming) {
    let {from, with: withClause, distinct, fields, where, groupBy, orderBy} = this
    let sql = 'SELECT'
    // let fromClause = []
    // let fields = []
    // let i, len
    // let fromFields
    if (distinct) {
      sql += ' DISTINCT'
      if (distinct !== true) {
        sql += ` ON (${distinct})`
      }
    }
    // sql += ` ${this.fields}`
    // if (from) {
    //     fromFields = from.resolve(incoming)
    //     fields = fields.concat(fromFields.fields)
    //     fromClause.push(fromFields.from)
    //     // sql += ` FROM ${from.resolve(incoming)}`
    //     if (joins) {
    //         for (i = 0, len = joins.length i < len i++) {
    //             fromFields = joins[i].resolve(incoming)
    //             fields = fields.concat(fromFields.fields)
    //             fromClause.push(fromFields.from)
    //             // sql += ` ${joins[i].resolve(incoming)}`
    //         }
    //     }
    // }
    // sql += ` ${fields}`
    sql += ` ${resolveArray(fields.array, incoming)}`
    // if (fromClause.length) {
    //     sql += ` FROM ${fromClause}`
    // }
    if (from) {
      sql += ` FROM ${resolveArray(from, incoming, '')}`
      // if (joins) {
      //   sql += ` ${joins.map(join => join.resolve(incoming)).join(' ')}`
      // }
    }
    if (where) {
      where = where.resolve(incoming)
      if (where) sql += ` WHERE ${where}`
    }
    if (groupBy) {
      sql += ` GROUP BY ${groupBy}`
    }
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`
    }
    // console.log(sql)
    return sql
  }
  getFields () {
    return this.fields.names
  }
  nextAlias () {
    return `_t${++this._aliasNum}`
  }
  // static prepareFrom (from) {
  //     from = new From(from)
  //     if (!from.alias) {
  //         from.alias = this.nextAlias()
  //     }
  //     return from
  // }
  static prepareTable (table) {
    if (typeof table === 'string') {
      // return getRelation(table)
      return table
    } else if (table instanceof Query) {
      return table
    } else {
      return new Select(table)
    }
  }
  // static prepareJoin (join) {
  //     join = new Join(join)
  //     if (!join.alias) {
  //         join.alias = this.nextAlias()
  //     }
  //     return join
  // }
}
class Insert extends Query {
  constructor (definition) {
    super(definition)
  }
}

module.exports = {Query, Select, Insert, Fields, Raw, Incoming}