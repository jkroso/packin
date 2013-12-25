
var Package = require('./src/package')
var log = require('./src/logger')
var each = require('foreach')
var rm = require('rm-r/sync')
var fs = require('fs')

module.exports = install

/**
 * wrap internals with a simple function
 *
 * @param {String} dir
 * @param {Object} [opts]
 * @return {Promise<Package>}
 */

function install(url, to, opts){
	if (typeof to != 'string') opts = to, to = url
	if (!opts) opts = {}

	// configure
	Package.cache = Object.create(null)
	Package.prototype.retrace = opts.retrace !== false
	Package.prototype.folder = opts.folder || 'deps'
	Package.prototype.possibleFiles = opts.files || defaultFiles
	Package.prototype.development = opts.development === true
	Package.prototype.production = opts.production !== false
	var pkg = Package.create(url)
	if (pkg.local) pkg.loaded = true
	pkg.retrace = true // always step into first level
	pkg.development = opts.development == null && opts.production == null

	return pkg.installed.then(function(){
		if (url != to) return pkg.link(to).then(function(){ return pkg })
		return pkg
	}, undo)
}

var defaultFiles = Package.prototype.possibleFiles

/**
 * undo everything
 *
 * @param {Error} e
 * @throws {e}
 */

function undo(e){
	log.warn('failed', '%s', e.message)
	each(Package.cache, function(dep, location){
		if (!dep.isNew) return
		if (!fs.existsSync(location)) return
		log.warn('removing', '%p', location)
		rm(dep.location)
	})
	throw e
}
