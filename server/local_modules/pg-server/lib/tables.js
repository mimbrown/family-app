'use strict'

const _ = require('lodash')
const { execute } = require('./query.js')

const tables = {}

const tableQuery = 
`SELECT DISTINCT
a.attname as name,
format_type(a.atttypid, a.atttypmod) as type,
-- a.attnotnull as notnull,
coalesce(i.indisprimary,false) as primary_key,
def.adsrc as default
FROM pg_attribute a
JOIN pg_class pgc ON pgc.oid = a.attrelid
LEFT JOIN pg_index i ON
(pgc.oid = i.indrelid AND i.indkey[0] = a.attnum)
LEFT JOIN pg_description com on
(pgc.oid = com.objoid AND a.attnum = com.objsubid)
LEFT JOIN pg_attrdef def ON
(a.attrelid = def.adrelid AND a.attnum = def.adnum)
WHERE a.attnum > 0 AND pgc.oid = a.attrelid
AND pg_table_is_visible(pgc.oid)
AND NOT a.attisdropped
AND pgc.relname = $1`

class Relation {
  constructor (name, columns) {
    this.name = name
    this.define(columns)
    // execute(tableQuery, [name]).then(res => this.define(res.rows))
  }
  define (columns) {
    if (!columns.length) {
      throw `Relation '${this.name}' does not exist or does not contain any columns.`
    }
    let pkeys = [],
      cols = {},
      i, len, col
    for (i = 0, len = columns.length; i < len; i++) {
      col = columns[i]
      if (col.primary_key) {
        pkeys.push(col.name)
      }
      cols[col.name] = col.type
    }
    this.primary_key = pkeys
    this.columns = cols
  }
  resolve () {return this.name}
  getFields () {
    return _.keys(this.columns)
    // let fields = _.keys(this.columns)
    // return fields.length ? `${alias}.${fields.join(`${alias}.`)}` : null
  }
}

const resolveRelation = table => {
  let currentRelation = tables[table]
  if (currentRelation) {
    if (currentRelation instanceof Promise) {
      return currentRelation
    } else {
      return Promise.resolve(currentRelation)
    }
  } else {
    return tables[table] = execute(tableQuery, [table]).then(res => {
      if (!res.rows.length) {
        return Promise.reject(`Relation '${table}' does not exist or does not contain any columns.`)
      }
      tables[table] = new Relation(table, res.rows)
      return Promise.resolve(tables[table])
    })
  }
}

module.exports = {
  Relation, resolveRelation
}