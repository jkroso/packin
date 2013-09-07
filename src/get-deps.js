
var latestNPM = require('./latest-npm').url
var whenAll = require('when-all/deep')
var reduce = require('reduce/series')
var filter = require('filter/async')
var fs = require('lift-result/fs')
var lift = require('lift-result')
var join = require('path').join
var semver = require('semver')
var log = require('./logger')
var map = require('map')

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
		return whenAll(deps)
	})
}

var combineDeps = lift(function(deps, json, opts){
	if (opts.development) merge(json.development)
	if (opts.production) merge(json.production)
	function merge(json){
		if (json) for (var key in json) {
			if (!(key in deps)) deps[key] = json[key]
		}
	}
	return deps
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
}, lift)

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
	if (/\//.test(name)) throw new Error('invalid package ' + name)
	// semver magic
	return latestNPM(name, version)
}

function readJSON(file){
	return fs.readFile(file, 'utf-8').then(JSON.parse)
}
