
var get = require('solicit/node').get
var defer = require('result/defer')

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
		.then(getVersion, function(e){
			throw new Error(name + '@' + spec + ' not in npm')
		})
}

function getVersion(json){
	return json.version
}

exports.url = function(name, spec){ return defer(function(){
	return exports.tag(name, spec).then(function(tag){
		return 'http://registry.npmjs.org/'+name+'/-/'+name+'-'+tag+'.tgz'
	})
})}