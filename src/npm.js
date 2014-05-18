
var get = require('solicit/node').get

/**
 * get the latest tag for `name` which matches `spec`
 *
 * @param {String} name
 * @param {String} spec
 * @return {Result} string
 * @api public
 */

exports.tag = function(name, spec){
  return latest(name, spec).then(getVersion, function(res){
    throw new Error(res.message + ' ' + name)
  })
}

function getVersion(json){
  return json.version
}

/**
 * get the latest tarball url for name@spec
 *
 * @param {String} name
 * @param {String} spec
 * @return {Result} string
 * @api public
 */

exports.url = function(name, spec){
  return latest(name, spec).then(getDist, function(r){
    throw new Error(r.message + ' - while querying npm for "' + name + '"')
  })
}

function getDist(json){
  if (typeof json.dist.tarball != 'string') {
    throw new Error('invalid npm response')
  }
  return json.dist.tarball
}

/**
 * get name@spec's latest package.json from npm.org
 *
 * @param {String} name
 * @param {String} spec
 * @return {Result}
 * @api private
 */

function latest(name, spec){
  return get('http://registry.npmjs.org/' + name + '/' + spec)
}
