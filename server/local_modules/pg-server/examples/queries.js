const Connection = require('../lib/sql-commands')
const definitions = require('./table-definitions.json')

const connection = new Connection(definitions)

const query1 = new connection.Select('"tenant-{{tenantId}}".client AS c')

const query2 = new connection.Select('(SELECT * FROM "tenant-{{tenantId}}".client) AS c')

const query3 = new connection.Select('(SELECT * FROM client) AS c')

const query4 = new connection.Select({
  from: {
    table: 'client',
    alias: 'c',
    schema: 'tenant-{{tenantId}}'
  }
})

const incoming = {tenantId: 2}

// console.log(query1.resolve(new connection.Incoming(incoming)))
// console.log(query2.resolve(new connection.Incoming(incoming)))
// console.log(query3.resolve(new connection.Incoming(incoming)))
// console.log(query4.resolve(new connection.Incoming(incoming)))