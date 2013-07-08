
var parseJSON = require('JSONStream').parse
  , download = require('./download').get
  , concat = require('concat-stream')
  , semver = require('semver')
  , defer = require('result/defer')

exports.tag = latestTag

/**
 * get the latest tag from npm.org that matches `vSpec`
 * 
 * @param {String} name
 * @param {String} vSpec
 * @return {DeferredResult} string
 */

function latestTag(name, vSpec){ return defer(function(write, fail){
	download('http://registry.npmjs.org/'+name).then(function(resp){
		resp.pipe(parseJSON(['versions', match(vSpec)]))
			.pipe(concat(function(e, versions){
				if (e) return fail(e)
				if (!versions || !versions.length) {
					return fail(new Error(name+'@'+vSpec+' not in npm'))
				}
				var latest = versions
					.map(getVersion)
					.sort(semver.rcompare)[0]
				write(latest)
			}))
	})
})}

exports.url = function(name, vSpec){
	return latestTag(name, vSpec).then(function(tag){
		return 'http://registry.npmjs.org/'+name+'/-/'+name+'-'+tag+'.tgz'
	})
}

function getVersion(obj){
	return obj.version
}

function match(spec){
	return function(version){
		return semver.valid(version) && semver.satisfies(version, spec)
	}
}