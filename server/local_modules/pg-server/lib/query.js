'use strict'

const { Pool } = require('pg')
const pool = new Pool()

async function execute (query, values) {
  const client = await pool.connect()
  const response = await client.query(query, values)
  await client.release()
  return response
}

module.exports = { execute }