require('dotenv').config()
const Connection = require('../lib/sql-commands')
const {execute} = require('../lib/execute')
let connection = new Connection({
  public: {
    client: {
      columns: {
        id: 'integer',
        string_col: 'text',
        date_col: 'timestamp(0) with time zone',
        json_col: 'json',
        array_col: 'text[]',
        int_col: 'integer',
        the_geom: 'geometry'
      },
      privateKey: {
        name: 'test_pkey',
        columns: [
          'id'
        ]
      }
    }
  }
})

let query = connection.createQuery({
  qt: 'series',
  transaction: true,
  queries: [
    {
      query: {
        fields: 'FLOOR(COUNT(*)) AS cnt',
        from: 'client'
      },
      options: {
        singleValue: 'cnt'
      },
      name: 'half'
    },
    {
      query: {
        from: 'client',
        limit: '{{returned.half}}'
      }
    }
  ]
})

let context = new connection.Context()

execute(context.$create(query), context)