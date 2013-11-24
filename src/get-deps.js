
var whenAll = require('when-all/deep')
var reduce = require('reduce/series')
var filter = require('filter/async')
var github = require('./github').url
var defer = require('result/defer')
var fs = require('lift-result/fs')
var lift = require('lift-result')
var join = require('path').join
var npm = require('./npm').url
var semver = require('semver')
var log = require('./logger')
var each = require('foreach')
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
			var fn = normalize[file]
			var json = readJSON(join(dir, file))
			var json = fn(json, opts)
			return merge(deps, json, opts)
		}, {})
		return whenAll(deps)
	})
}

/**
 * merge the keys from json which are already on `deps`
 *
 * @param {Object} deps
 * @param {Object} json
 * @param {Object} options
 * @api private
 */

var merge = lift(function(deps, json, opts){
	opts.development && softMerge(deps, json.development)
	opts.production  && softMerge(deps, json.production)
	return deps
})

function softMerge(a, b){
	for (var k in b) {
		if (!(k in a)) a[k] = b[k]
	}
}

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

/**
 * convert component.json format to the more explicit
 * deps.json format.
 *
 *   "jkroso/emitter": "1.0.0" -> "emitter": "http://..."
 *
 * @param {Object} deps
 * @return {Object}
 * @api private
 */

function normalizeComponent(deps){
	if (!deps) return null
	var res = {}
	each(deps, function(tag, name){
		var parts = name.split('/')
		var user = parts[0]
		var repo = parts[1]
		res[repo] = tag == '*'
			? defer(function(){ return github(user, repo) })
			: 'http://github.com/' + name + '/tarball/' + tag
	})
	return res
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
	if (/^(\w+\/[\w\-]+)(?:#(\d+\.\d+\.\d+))?/.test(version)) {
		var version = RegExp.$2
		var name = RegExp.$1
		return version
			? 'http://github.com/' + name + '/tarball/' + version
			: defer(function(){ return github.apply(null, name.split('/')) })
	}

	// validate name
	if (/\//.test(name)) {
		throw new Error('invalid package name ' + name)
	}

	// resolve semver lazily
	return defer(function(){
		return npm(name, version)
	})
}

function readJSON(file){
	return fs.readFile(file, 'utf-8').then(JSON.parse)
}