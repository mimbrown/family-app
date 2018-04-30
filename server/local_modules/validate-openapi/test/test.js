const Validator = require('../index.js')
const express = require('express')
const bodyParser = require('body-parser')

const validator = new Validator({api: 'test-api.json'})
const app = express()

app.use(bodyParser.json())
app.use(validator.validate())

app.route('/test')
  .get((req, res) => res.json(req.query))

app.route('/test/:id')
  .put((req, res) => res.json(req.query))

app.listen(3001, () => console.log('Server listening on port 3001'))