'use strict'

const { Pool } = require('pg')
const pool = new Pool()

async function execute (executables) {
  const client = await pool.connect()
  if (!Array.isArray(executables)) {
    executables = [executables]
  }
  let i = 0, len = executables.length
  for (; i < len; i++) {
    let {query, values} = executables[i]
    let response = await client.query(query, values)
  }
  await client.release()
  return response
}

module.exports = { execute }