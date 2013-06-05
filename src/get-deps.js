
var Promise = require('laissez-faire/full')
  , parseJSON = require('JSONStream').parse
  , download = require('./download').get
  , concat = require('concat-stream')
  , all = require('when-all/object')
  , each = require('foreach/series')
  , fs = require('promisify/fs')
  , join = require('path').join
  , semver = require('semver')
  , log = require('./logger')

module.exports = deps

/**
 * get a normalized deps.json
 *
 * @param {String} path to the package
 * @return {Promise} deps
 */

function deps(dir, opts){
	var winner
	var biggest = 0
	var json
	return each(opts.priority, function(file){
		var path = join(dir, file)
		return fs.exists(path).then(function(yes){
			if (yes) return readJSON(path).then(function(object){
				var deps = count[file](object)
				if (deps > biggest) {
					winner = file
					biggest = deps
					json = object
				} else if (!winner) {
					winner = file
					json = object
				}
			})
		})
	}).then(function(){
		if (!winner) throw new Error('no meta file detected for '+dir)
		log.warn('deps', '%p uses %s for meta data', dir, winner)
		return deps[winner](json, opts)
	})
}

function keys(obj){
	return (obj && Object.keys(obj).length) || 0
}

/**
 * count dependency entries
 * 
 * @param {Object} json
 * @return {Number}
 * @api private
 */

var count = {
	'deps.json': function(json){
		return keys(json.production)
	},
	'component.json': function(json){
		return keys(json.dependencies)
	},
	'package.json': function(json){
		return keys(json.dependencies)
	}
}


/**
 * normalise json data
 * 
 * @param {Object} json
 * @return {Object}
 */

deps['deps.json'] = function(json){
	return json
}

deps['component.json'] = function(json, opts){
	return all({
		production: normalizeComponent(json.dependencies),
		development: opts.dev && normalizeComponent(json.development)
	})
}

function normalizeComponent(deps){
	if (!deps) return
	var res = {}
	for (var name in deps) {
		var short = name.split('/')[1]
		res[short] = componentUrl(name, deps[name]);
	}
	return all(res)
}

function componentUrl(name, version){
	if (version == '*') version = 'master'
	return 'http://github.com/'+name+'/tarball/'+version 
	// for some reason this 404s with hyperquest but not curl(1)
	// return 'https://api.github.com/repos/'+name+'/tarball/'+version 
}

deps['package.json'] = function(json, opts){
	return all({
		production: normalizeNpm(json.dependencies),
		development: opts.dev && normalizeNpm(json.devDependencies)
	})
}

function normalizeNpm(deps){
	if (!deps) return
	for (var name in deps) {
		deps[name] = npmUrl(name, deps[name])
	}
	return all(deps)
}

function npmUrl(name, version){
	// explicit version
	if (semver.valid(version)) {
		return 'http://registry.npmjs.org/'+name+'/-/'+name+'-'+version+'.tgz'
	}
	// straight up url
	if (/^\w+:\/\//.test(version)) {
		return version
	}
	// github shorthand
	if (/^(\w+\/[\w\-]+)(?:@(\d+\.\d+\.\d+))?/.test(version)) {
		return 'http://github.com/'+RegExp.$1+'/tarball/'+(RegExp.$2 || 'master')
	}
	// semver magic
	return download('http://registry.npmjs.org/'+name).then(function(response){
		var p = new Promise
		response
			.pipe(parseJSON(['versions', match(version)]))
			.pipe(concat(done))

		function done(e, versions){
			if (e) return p.reject(e)
			if (!versions || !versions.length) {
				return p.reject(new Error(name+'@'+version+' not in npm'))
			}
			var latest = versions.sort(function(a,b){
				return semver.rcompare(a.version, b.version)
			})[0]
			p.fulfill(latest.dist.tarball)
		}

		return p
	})
}

function match(version){
	return function(compare){
		return semver.satisfies(compare, version)
	}
}

function readJSON(file){
	return fs.readFile(file, 'utf-8').then(JSON.parse)
}
