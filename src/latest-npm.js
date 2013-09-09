
var get = require('solicit/node').get

/**
 * get the latest tag from npm.org that matches `vSpec`
 *
 * @param {String} name
 * @param {String} spec
 * @return {Result} string
 */

exports.tag = function(name, spec){
	return get('http://registry.npmjs.org/' + name + '/' + spec)
		.type('json')
		.then(getVersion, function(){
			throw new Error(name + '@' + spec + ' not in npm')
		})
}

exports.url = function(name, spec){
	return get('http://registry.npmjs.org/' + name + '/' + spec)
		.type('json')
		.then(getDist, function(){
			throw new Error(name + '@' + spec + ' not in npm')
		})
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