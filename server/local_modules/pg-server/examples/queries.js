const Connection = require('../lib/sql-commands')
const definitions = require('./table-definitions.json')

const connection = new Connection(definitions)

const queries = [
  new connection.Select('"tenant-{{tenantId}}".client AS c'),
  new connection.Select('(SELECT * FROM "tenant-{{tenantId}}".client) AS c'),
  new connection.Select('(SELECT * FROM client) AS c'),
  // new connection.Select({
  //   fields: [
  //     'COUNT(*) AS value',
  //     '{{metric}} AS key'
  //   ],
  //   from: [{
  //     table: 'client',
  //     schema: 'tenant-{{tenantId}}',
  //     alias: 'c'
  //   },
  //   'LEFT JOIN lk_client_tenant lk ON lk.client_id = c.client_id',
  //   {
  //     table: 'tenant',
  //     alias: 't',
  //     type: 'left join',
  //     on: [
  //       't.tenant_id = lk.tenant_id'
  //     ]
  //   }
  //   ],
  //   groupBy: '{{metric}}'
  // }),
  // new connection.Select({
  //   fields: 'COUNT(*) AS cnt',
  //   from: {
  //     table: {
  //       from: 'client'
  //     },
  //     alias: 'c'
  //   }
  // })
  new connection.Select({
    with: {
      recursive: true,
      queries: {
        alias: 'employee_recursive',
        columns: 'distance, employee_name, manager_name',
        query: {
          queryType: 'multiple',
          type: 'UNION ALL',
          queries: [{
            fields: '1, employee_name, manager_name',
            from: 'employee',
            where: ['manager_name = {{value manager}}']
          }, {
            fields: 'er.distance + 1, e.employee_name, e.manager_name',
            from: [
              'employee_recursive er',
              'employee e'
            ],
            where: ['er.employee_name = e.manager_name']
          }]
        }
      }
    },
    fields: 'distance, employee_name',
    from: 'employee_recursive'
  })
]

const incoming = {tenantId: 2, metric: 'my_group_field', manager: 'Mary'}

queries.forEach(query => console.log(query.resolve(new connection.Incoming(incoming))))