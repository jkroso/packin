
var get = require('solicit/node').get
var defer = require('result/defer')
var semver = require('semver')

/**
 * get the latest tag from npm.org that matches `vSpec`
 *
 * @param {String} name
 * @param {String} vSpec
 * @return {DeferredResult} string
 */

exports.tag = function(name, vSpec){
	return get('http://registry.npmjs.org/' + name).then(function(json){
		var tags = Object.keys(json.versions).filter(function(tag){
			return semver.valid(tag) && semver.satisfies(tag, vSpec)
		})
		if (!tags.length) {
			throw new Error(name + '@' + vSpec + ' not in npm')
		}
		return tags.sort(semver.rcompare)[0]
	})
}

exports.url = function(name, vSpec){ return defer(function(){
	return exports.tag(name, vSpec).then(function(tag){
		return 'http://registry.npmjs.org/'+name+'/-/'+name+'-'+tag+'.tgz'
	})
})}