
var apply = require('lift-result/apply')
var getDeps = require('./src/get-deps')
var install = require('./src/install')
var each = require('foreach/series')
var fs = require('lift-result/fs')
var log = require('./src/logger')
var rmdir = require('rmdir/sync')
var join = require('path').join
var mkdir = install.mkdir

/**
 * install all dependecies of `dir`
 *
 * @param {String} dir
 * @param {Object} [opts]
 * @return {Promise} log
 */

module.exports = function(dir, opts){
	if (typeof dir != 'string') opts = dir, dir = opts.target
	addDefaults(opts || (opts = {}))

	if (opts.development == null && opts.production == null) {
		opts.development = opts.production = true
		var folder = dir + '/' + opts.folder
		var result = apply(getDeps(dir, opts), mkdir(folder), function(deps){
			// disable after first level
			opts.development = false
			log.debug('%p depends on %j', dir, deps)
			return each(deps, function(url, name){
				return install.one(url, join(folder, name), opts)
			})
		})
	} else {
		var result = install(dir, opts)
	}

	return result.then(function(){
		return opts.log
	}, cleanup(opts))
}

/**
 * generate a cleanup handler which removes all
 * new downloads leaving the cache in the same
 * state it started
 *
 * @param {Object} options
 * @return {Function}
 */

function cleanup(options){
	return function(e){
		log.warn('failed', '%s', e.message)
		each(options.log, function(dep, p){
			if (dep.isNew && fs.existsSync(dep.location)) {
				log.warn('removing', '%p', dep.location)
				rmdir(dep.location)
			}
		})
		throw e
	}
}

/**
 * install `url` to `dir`
 *
 * @param {String} url
 * @param {String} dir
 * @param {Object} [opts]
 * @return {Promise} log
 */

module.exports.one = function(url, dir, opts){
	addDefaults(opts || (opts = {}))
	return install.one(url, dir, opts).then(function(){
		return opts.log
	}, cleanup(opts))
}

var defaultFiles = ['deps.json', 'component.json', 'package.json']

/**
 * hydrate `opts` with default values
 *
 * @param {Object} opts
 * @api private
 */

function addDefaults(opts){
	opts.folder || (opts.folder = 'deps')
	opts.files || (opts.files = defaultFiles)
	opts.log || (opts.log = Object.create(null))
	opts.retrace = opts.retrace !== false
}