
var download = require('./download')
var filter = require('filter/async')
var each = require('foreach/async')
var lazy = require('lazy-property')
var fs = require('lift-result/fs')
var lift = require('lift-result')
var when = require('result').when
var deps = require('./get-deps')
var join = require('path').join
var map = require('map/async')
var log = require('./logger')

var ns = process.env.HOME + '/.packin/-'

module.exports = Package

function Package(){}

Package.cache = Object.create(null)

/**
 * create a package unless one has already been created
 *
 * @param {String} url
 * @return {Package}
 */

Package.create = function(url){
	var location = /^\w+:\//.test(url)  // remote?
		? ns + url.replace(/^\w+:\//, '') // remove protocol
		: url                             // local filesystem
	var pkg = Package.cache[location]
	if (!pkg) {
		pkg = Package.cache[location] = new Package
		pkg.local = url == location
		pkg.location = location
		pkg.url = url
	}
	return pkg
}

/**
 * default config
 */

Package.prototype.possibleFiles = ['deps.json', 'component.json', 'package.json']
Package.prototype.development = false
Package.prototype.production = true
Package.prototype.retrace = true
Package.prototype.folder = 'deps'

/**
 * a map of `this` packages dependencies
 * @type {Promise<Object>}
 */

lazy(Package.prototype, 'dependencies', function(){
	return map(
		deps(this.location, this.files, this.production, this.development),
		Package.create)
}, 'enumerable')

/**
 * a list of files `this` package uses for meta data
 * @type {Promise<Array>}
 */

lazy(Package.prototype, 'files', function(){
	var files = this.possibleFiles
	var dir = this.location
	return when(this.loaded, function(){
		return filter(files, function(file){
			return fs.exists(join(dir, file))
		}).then(function(files){
			log.debug('%p uses %j for meta data', dir, files)
			return files
		})
	})
}, 'enumerable')

/**
 * the package iself is available
 * @type {Promise}
 */

lazy(Package.prototype, 'loaded', function(){
	var self = this
	return if_(fs.exists(this.location),
		function(){
			log.info('exists', '%p', self.url)
			self.isNew = false
		},
		function(){
			if (self.local) throw new Error('missing: ' + self.location)
			self.isNew = true
			return download(self.url, self.location).then(function(){
				log.info('installed', self.url)
			})
		})
})

/**
 * installed `this` package and its dependencies
 * @type {Promise}
 */

lazy(Package.prototype, 'installed', function(){
	return when.call(this, this.loaded, function(){
		if (!(this.isNew || this.retrace)) return // don't recur
		var folder = this.location + '/' + this.folder
		var deps = this.dependencies
		return mkdir(folder).then(function(){
			return each(deps, function(dep, name){
				return dep.link(join(folder, name))
			})
		})
	})
})

/**
 * the packages version tag
 * @type {String}
 */

lazy(Package.prototype, 'version', function(){
	var m = (/github\.com\/(?:[^\/]+\/){2}tarball\/(.+)/.exec(this.url))
		|| (/registry\.npmjs\.org\/[^\/]+\/-\/.*-(.*)\.tgz/.exec(this.url))
	if (m) return m[1]
	return '*'
})

/**
 * create a link to this package
 *
 * @param {String} from
 * @return {Promise}
 */

Package.prototype.link = function(from){
	var to = this.location
	return when(this.installed, function(){
		return fs.readlink(from).then(function(path){
			if (path != to) {
				log.debug('correcting symlink %p', from)
				fs.unlinkSync(from)
				fs.symlinkSync(to, from)
			}
		}, function(e){
			switch (e.code) {
				case 'ENOENT': // no file
					return fs.symlink(to, from).then(null, function(e){
						if (e.code == 'EEXIST') return // must be a race going on
						throw new Error(e.stack)
					})
				case 'EINVAL': // not a symlink
					log.info('warning', 'not linking %p since its a hard file', from)
					break
				default: throw new Error(e.stack)
			}
		})
	})
}

var if_ = lift(function(bool, a, b){
	return bool ? a() : b()
})

function mkdir(folder){
	var er = new Error()
	return fs.mkdir(folder).then(null, function(e){
		er.message = e.message
		if (e.code != 'EEXIST') throw er
	})
}
