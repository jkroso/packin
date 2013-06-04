
var install = require('./src/install')
  , each = require('foreach/series')
  , fs = require('fs')
  , rmdir = require('rmdir')
  , log = require('./src/logger')

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
	return install(dir, opts).then(function(){
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
		return each(options.log, function(dep, _, done){
			if (dep.isNew) fs.exists(dep.location, function(exists){
				log.warn('removing', '%p [%s]', dep.location, exists)
				if (exists) return rmdir(dep.location, done)
			})
			else done()
		}).then(function(){
			throw e
		})
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

var defaultPriority = ['deps.json', 'component.json', 'package.json']

/**
 * hydrate `opts` with default values
 * 
 * @param {Object} opts
 * @api private
 */

function addDefaults(opts){
	opts.folder || (opts.folder = 'deps')
	opts.priority || (opts.priority = defaultPriority)
	opts.log || (opts.log = Object.create(null))
}