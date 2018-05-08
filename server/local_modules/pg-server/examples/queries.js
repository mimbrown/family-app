const Connection = require('../lib/sql-commands')
const definitions = require('./table-definitions.json')

const connection = new Connection(definitions)

const queries = [
  new connection.Select('"tenant-{{tenantId}}".client AS c'),
  new connection.Select('(SELECT * FROM "tenant-{{tenantId}}".client) AS c'),
  new connection.Select('(SELECT * FROM client) AS c'),
  new connection.Select({
    fields: [
      'COUNT(*) AS value',
      '{{metric}} AS key'
    ],
    from: [{
      table: 'client',
      schema: 'tenant-{{tenantId}}',
      alias: 'c'
    },
    'LEFT JOIN lk_client_tenant lk ON lk.client_id = c.client_id',
    {
      table: 'tenant',
      alias: 't',
      type: 'left join',
      on: [
        't.tenant_id = lk.tenant_id'
      ]
    }
    ],
    groupBy: '{{metric}}'
  }),
  new connection.Select({
    fields: 'COUNT(*) AS cnt',
    from: {
      table: {
        from: 'client'
      },
      alias: 'c'
    }
  })
]

const incoming = {tenantId: 2, metric: 'my_group_field'}

queries.forEach(query => console.log(query.resolve(new connection.Incoming(incoming))))