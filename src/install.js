
var download = require('./download')
  , all = require('when-all/naked')
  , each = require('foreach/async')
  , getDeps = require('./get-deps')
  , fs = require('promisify/fs')
  , log = require('./logger')
  , path = require('path')
  , join = path.join

var cache = process.env.HOME + '/.packin/-'

module.exports = install
install.one = linkPackage

/**
 * install all dependecies of `dir`
 * 
 * @param {String} dir
 * @param {Object} opts
 * @return {Promise}
 */

function install(dir, opts){
	var folder = dir + '/' + opts.folder
	return all(getDeps(dir, opts), mkdir(folder)).then(function(arr){
		var json = arr[0]
		var deps = json.production || {}
		
		// disable dev after the first iteration
		if (opts.dev) {
			opts.dev = false
			log.debug('including development dependencies for %p', dir)
			deps = merge(deps, json.development)
		}

		log.debug('%p depends on %j', dir, deps)

		return each(deps, function(url, name){
			return linkPackage(url, join(folder, name), opts)
		})
	})
}

/**
 * ensure `url` is registered as installed
 * 
 * @param {Object} log
 * @param {String} url
 */

function addInstalled(log, url){
	var dep = log[url]
	if (!dep) {
		dep = log[url] = {
			parents: [],
			aliases: [],
			url: url
		}
	}
	return dep
}

/**
 * link to a package. will install it if necessary
 * 
 * @param {String} url
 * @param {String} name
 * @param {Object} opts
 * @return {Promise}
 */

function linkPackage(url, from, opts){
	var pkg = join(cache, url.replace(/^\w+:\/\//, ''))
	var dep = addInstalled(opts.log, url)
	dep.location = pkg
	dep.aliases.push(from)
	return ensureExists(url, pkg, opts).then(function(){
		return link(from, pkg)
	})
}

/**
 * ensure a symlink exists
 * 
 * @param {String} from
 * @param {String} to
 * @return {Promise}
 */

function link(from, to){
	return fs.readlink(from).then(function(path){
		if (path != to) {
			log.debug('correcting symlink %p', from)
			return fs.unlink(from).then(function(){
				return fs.symlink(to, from)
			})
		}
	}, function(e){
		switch (e.code) {
			case 'ENOENT': return fs.symlink(to, from)
			case 'EINVAL':
				log.info('warning', 'not linking %p since its a hard file', from)
				break
			throw new Error(e.message)
		}
	})
}

/**
 * ensure a package is properly installed
 * 
 * @param {String} url
 * @param {String} dest
 * @param {Object} opts
 * @return {Promise}
 */

function ensureExists(url, dest, opts){
	var uri = url.replace(/\w+:\/\//, '')
	if (uri in seen) return seen[uri]
	return seen[uri] = fs.exists(dest)
		.then(function(yes){
			if (opts.log[url].isNew = !yes) {
				return download(url, dest).then(function(){
					log.info('installed', uri)
					return install(dest, opts)
				})
			}
			log.info('exists', uri)
			if (opts.retrace) return install(dest, opts)
		})
}

function mkdir(folder){
	return fs.mkdir(folder).then(null, function(e){
		if (e.code != 'EEXIST') throw e
	})
}

var seen = Object.create(null)

function merge(a, b){
	if (b) for (var k in b) if (!(k in a)) {
		a[k] = b[k]
	}
	return a
}
