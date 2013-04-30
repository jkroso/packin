
var detect = require('detect/series')
  , fs = require('fs')
  , promisify = require('promisify')
  , parseJSON = require('JSONStream').parse
  , Promise = require('laissez-faire/full')
  , semver = require('semver')
  , valid = semver.valid
  , read = promisify(fs.readFile)
  , concat = require('concat-stream')
  , path = require('path')
  , all = require('when-all/object')
  , download = require('./download')
  , debug = require('debug')('packin:get-deps')

module.exports = deps

/**
 * get an object representing the packages dependencies
 *
 * @param {String} path to the package
 * @return {Promise} deps
 */

function deps(dir, opts){
	return detect(opts.priority, function(file, cb){
		fs.exists(path.join(dir, file), cb)
	}).then(function(file){
		debug('%p uses %s for meta data', dir, file)
		return deps[file](dir, opts).read(function(d){
			debug('%p depends on %j', dir, d)
		})
	})
}

deps['env.json'] = function(dir){
	return readJSON(dir+'/env.json')
}

deps['component.json'] = function(dir, opts){
	return readJSON(dir+'/component.json').then(function(json){
		var deps = {
			production: normalizeComponent(json.dependencies),
			development: opts.dev && normalizeComponent(json.development)
		}
		return all(deps)
	})
}

function normalizeComponent(deps){
	var res = {}
	if (deps) for (var name in deps) {
		var short = name.split('/')[1]
		res[short] = componentUrl(name, deps[name]);
	}
	return all(res)
}

function componentUrl(name, version){
	if (version == '*') version = 'master'
	return 'https://github.com/'+name+'/tarball/'+version 
	// for some reason this 404s with hyperquest but not curl(1)
	// return 'https://api.github.com/repos/'+name+'/tarball/'+version 
}

deps['package.json'] = function(dir, opts){
	return readJSON(dir+'/package.json').then(function(json){
		return all({
			production: normalizeNpm(json.dependencies),
			development: opts.dev && normalizeNpm(json.devDependencies)
		})
	})
}

function normalizeNpm(deps){
	if (deps) for (var name in deps) {
		deps[name] = npmUrl(name, deps[name])
	}
	return all(deps || {})
}

function npmUrl(name, version){
	// if (!valid(version)) throw new Error('invalid semver: '+name+'@'+version)
	// explicit version
	if (/^\d+\.\d+\.\d+$/.test(version)) {
		return 'http://registry.npmjs.org/'+name+'/-/'+name+'-'+version+'.tgz'
	}
	// straight up url
	if (/^\w+:\/\//.test(version)) {
		return version
	}
	// github shorthand
	if (/^(\w+\/[\w\-]+)(?:@(\d+\.\d+\.\d))?/.test(version)) {
		return 'http://github.com/'+RegExp.$1+'/tarball/'+(RegExp.$2 || 'master')
	}
	// semver magic
	return download('http://registry.npmjs.org/'+name).then(function(response){
		var p = new Promise
		response
			.pipe(parseJSON(['versions', true]))
			.pipe(concat(done))

		function done(e, versions){
			if (e) return p.reject(e)
			if (!versions.length) {
				return p.reject(Error('nothing in npm.org matching '+name+'@'+version))
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
	return read(file, 'utf-8').then(JSON.parse)
}
