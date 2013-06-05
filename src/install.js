
var fs = require('fs')
  , promise = require('laissez-faire')
  , download = require('./download')
  , path = require('path')
  , join = path.join
  , all = require('when-all/naked')
  , each = require('foreach/async')
  , promisify = require('promisify')
  , fs = require('promisify/fs')
  , mkdirp = promisify(require('mkdirp'))
  , getDeps = require('./get-deps')
  , log = require('./logger')

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
	return all(
		getDeps(dir, opts),
		mkdirp(folder)
	).then(function(all){
		var deps = all[0].production || {}
		
		// disable dev after the first iteration
		if (opts.dev) {
			opts.dev = false
			deps = merge(deps, all[0].development)
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
			opts.log[url].isNew = !yes
			if (!yes) return download(url, dest).then(function(){
				log.info('installed', uri)
			})
			log.info('exists', uri)
		})
		.then(function(){
			return install(dest, opts)
		})
}

var seen = Object.create(null)

function merge(a, b){
	if (b) for (var k in b) if (!(k in a)) {
		a[k] = b[k]
	}
	return a
}
