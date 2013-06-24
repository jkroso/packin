
var parseJSON = require('JSONStream').parse
  , download = require('./download').get
  , decorate = require('when/decorate')
  , concat = require('concat-stream')
  , reduce = require('reduce/series')
  , filter = require('filter/async')
  , lift = require('when-all/deep')
  , each = require('foreach/async')
  , defer = require('result/defer')
  , fs = require('resultify/fs')
  , join = require('path').join
  , Result = require('result')
  , semver = require('semver')
  , log = require('./logger')
  , map = require('map')

module.exports = deps

/**
 * get a normalized deps.json
 *
 * @param {String} path to the package
 * @return {Result} deps
 */

function deps(dir, opts){
	return filter(opts.files, function(file){
		return fs.exists(join(dir, file))
	}).then(function(files){
		if (!files.length) throw new Error('no meta file detected for '+dir)
		log.debug('%p uses %j for meta data', dir, files)
		var deps = reduce(files, function(deps, file){
			var json = readJSON(join(dir, file))
			json = normalize[file](json, opts)
			return combineDeps(deps, json, opts)
		}, {})
		return lift(deps)
	})
}

var combineDeps = decorate(function(a, b, opts){
	if (opts.dev) merge('development')
	if (true) merge('production')
	function merge(key){
		if (a[key]) {
			var deps = a[key]
			b = b[key]
			for (var key in b) {
				if (!(key in deps)) deps[key] = b[key]
			}
		} else {
			a[key] = b[key]
		}
	}
	return a
})

/**
 * JSON normalizers
 * 
 * @param {Object} json
 * @return {Object}
 */

var normalize = map({
	'deps.json': function(json){
		return json
	},
	'component.json': function(json, opts){
		return {
			production: normalizeComponent(json.dependencies),
			development: normalizeComponent(json.development)
		}
	},
	'package.json': function(json, opts){
		return {
			production: normalizeNpm(json.dependencies),
			development: normalizeNpm(json.devDependencies)
		}
	}
}, decorate)

function normalizeComponent(deps){
	if (!deps) return
	var res = {}
	for (var name in deps) {
		var short = name.split('/')[1]
		res[short] = componentUrl(name, deps[name]);
	}
	return res
}

function componentUrl(name, version){
	if (version == '*') version = 'master'
	return 'http://github.com/'+name+'/tarball/'+version 
	// for some reason this 404s with hyperquest but not curl(1)
	// return 'https://api.github.com/repos/'+name+'/tarball/'+version 
}

function normalizeNpm(deps){
	if (!deps) return
	for (var name in deps) {
		deps[name] = npmUrl(name, deps[name])
	}
	return deps
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
	return defer(function(write, fail){
		download('http://registry.npmjs.org/'+name).then(function(response){
			response
				.pipe(parseJSON(['versions', match(version)]))
				.pipe(concat(function(e, versions){
					if (e) return fail(e)
					if (!versions || !versions.length) {
						return fail(new Error(name+'@'+version+' not in npm'))
					}
					var latest = versions.sort(function(a,b){
						return semver.rcompare(a.version, b.version)
					})[0]
					write(latest.dist.tarball)
				}))
		})
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
