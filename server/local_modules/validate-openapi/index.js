/* jshint esversion: 6 */

const $RefParser = require('json-schema-ref-parser')
const { validate } = require('jsonschema')

const defaultIsWildcard = link => link === '*'
const pathIsWildcard = link => link.startsWith('{') && link.endsWith('}')

const comparePaths = (originalPath, newPath, isWildcard) => {
  if (originalPath.length !== newPath.length) {
    return false
  }
  let i, link
  for (i = 0; i < originalPath.length; i++) {
    link = newPath[i]
    if (!isWildcard(link) && link !== originalPath[i]) {
      return false
    }
  }
  return true
}

const getRoutes = (paths, pathname, isWildcard = defaultIsWildcard) => {
  pathname = pathname.split('/')
  let k
  for (k in paths) {
    if (comparePaths(pathname, k.split('/'), isWildcard)) {
      return paths[k]
    }
  }
}

const getSchema = (definition, contentType) => {
  let schema = definition.schema
  if (schema) {
    return schema
  }
  let content = getRoutes(definition.content, contentType)
  return content && content.schema
}

const validateParameter = (parameter, locations, contentType) => {
  let value = locations[parameter.in][parameter.name]
  let schema = getSchema(parameter, contentType)
}

class Validator {
  constructor (config) {
    $RefParser.dereference(config.api)
      .then(api => this.api = api)
  }

  validate () {
    return (req, res, next) => {
      let routes = getRoutes(this.api.paths, req._parsedUrl.pathname, pathIsWildcard)
      if (!routes) {
        return next(new Error(`No matching path found.`))
      }
      let route = routes[req.method.toLowerCase()]
      if (!route) {
        return next(new Error(`No ${req.method} route defined for this path.`))
      }
      let { parameters = [] } = routes
      let { requestBody } = route
      let { query, params: path, body, headers } = req
      let locations = {query, path, headers}
      let contentType = headers['content-type']
      parameters = parameters.concat(route.parameters || [])
      for (let i = 0; i < parameters.length; i++) {
        validateParameter(parameters[i], locations, contentType)
        
      }
      // next()
    }
  }
}

module.exports = Validator