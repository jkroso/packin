
var get = require('solicit/node').get

/**
 * get `name`'s latest tag which matches `spec`
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

/**
 * get the latest tarball url for name@spec
 *
 * @param {String} name
 * @param {String} spec
 * @return {Result} string
 * @api public
 */

exports.url = function(name, spec){
	return latest(name, spec).then(getDist, function(res){
		throw new Error(res.message + ' ' + name)
	})
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

function getDist(json){
	if (typeof json.dist.tarball != 'string') {
		throw new Error('invalid npm response')
	}
	return json.dist.tarball
}

function getVersion(json){
	return json.version
}