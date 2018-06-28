const Connection = require('../lib/sql-commands')
const definitions = require('./definitions.json')
let connection

definitions.forEach((definition, outerIndex) => {
  connection = new Connection(definition.database)
  definition.examples.forEach((example, innerIndex) => {
    let query = connection.createQuery(example.query, 'select')
    let context = new connection.Context(example.incoming)
    context.$create(query)
    console.log(`\n------- Example ${outerIndex+1}.${innerIndex+1}`)
    if (query instanceof connection.Each) {
      context.$query.forEach((context, index) => {
        console.log(`---------- Query ${index+1}`)
        console.log(`QUERY:  ${context.$query}`)
        console.log(`VALUES: ${context.$values}`)
      })
    } else {
      console.log(`QUERY:  ${context.$query}`)
      console.log(`VALUES: ${context.$values}`)
    }
  })
})
console.log()