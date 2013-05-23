
var detect = require('detect/series')
  , fs = require('fs')
  , promisify = require('promisify')
  , parseJSON = require('JSONStream').parse
  , Promise = require('laissez-faire/full')
  , semver = require('semver')
  , read = promisify(fs.readFile)
  , concat = require('concat-stream')
  , path = require('path')
  , all = require('when-all/object')
  , download = require('./download').get
  , log = require('./logger')

module.exports = deps

/**
 * get a normalized deps.json
 *
 * @param {String} path to the package
 * @return {Promise} deps
 */

function deps(dir, opts){
	return detect(opts.priority, function(file, cb){
		fs.exists(path.join(dir, file), cb)
	}).then(function(file){
		log.warn('deps', '%p uses %s for meta data', dir, file)
		return deps[file](dir, opts)
	}, function(e){
		throw new Error('no meta file detected for '+dir)
	})
}

deps['deps.json'] = function(dir){
	return readJSON(dir+'/deps.json')
}

deps['component.json'] = function(dir, opts){
	return readJSON(dir+'/component.json').then(function(json){
		return all({
			production: normalizeComponent(json.dependencies),
			development: opts.dev && normalizeComponent(json.development)
		})
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
	return read(file, 'utf-8').then(JSON.parse)
}
