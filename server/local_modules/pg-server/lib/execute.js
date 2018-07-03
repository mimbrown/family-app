'use strict'

const { Pool } = require('pg')
const pool = new Pool()

function configureReturn (response, options = {}) {
  if (options.metadata) {
    return response
  } else {
    let rows = response.rows
    if (options.singleValue) {
      return rows[0] && rows[0][options.singleValue]
    } else if (options.singleRow) {
      return rows[0]
    }
    return rows
  }
}

async function executeSimple (query, values, options) {
  const client = await pool.connect()
  let response = await client.query(query, values)
  await client.release()
  return configureReturn(response, options)
}

async function executeParallel (executables) {
  return Promise.all(executables.map(executable => executeSimple(executable.query, executable.values, executable.options)))
}

async function executeSeries (query, context) {
  const client = await pool.connect()
  // console.log(query)
  let {transaction, queries} = query.definition
  let executable
  queries.forEach(item => {
    executable = context.$create(item.query)
    
  })
  await client.release()
}

async function execute (first, second, third) {
  if (typeof first === 'string') { // Simple query
    return executeSimple(first, second, third)
  } else if (Array.isArray(first)) { // Parallel queries
    return executeParallel(first)
  } else { // Series of queries
    return executeSeries(first, second)
  }
  // const client = await pool.connect()
  // if (!Array.isArray(executables)) {
  //   executables = [executables]
  // }
  // let i = 0, len = executables.length
  // for (; i < len; i++) {
  //   let {query, values} = executables[i]
  //   let response = await client.query(query, values)
  // }
  // await client.release()
  // return response
}

module.exports = { execute }