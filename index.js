
var install = require('./src/install')
  , each = require('foreach/series')
  , resultify = require('resultify')
  , log = require('./src/logger')
  , fs = require('resultify/fs')
  , rmdir = require('rmdir')

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
		return each(options.log, function(dep){
			if (dep.isNew) {
				return fs.exists(dep.location).then(function(exists){
					if (exists) {
						log.warn('removing', '%p', dep.location)
						return rmdir(dep.location)
					}
				})
			}
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
	opts.dev = opts.dev === true
}