
var fs = require('fs')
  , promise = require('laissez-faire')
  , download = require('./download')
  , path = require('path')
  , join = path.join
  , all = require('when-all/naked')
  , each = require('foreach/series/promise')
  , promisify = require('promisify')
  , mkdirp = promisify(require('mkdirp'))
  , symlink = promisify(fs.symlink)
  , readLink = promisify(fs.readlink)
  , rmfile = promisify(fs.unlink)
  , rmdir = promisify(require('rmdir'))
  , getDeps = require('./get-deps')
  , debug = require('debug')('packin')

var cache = process.env.HOME + '/.packin/cache'

module.exports = install

/**
 * link dependencies to a package. Install new packages as 
 * necessary
 * 
 * @param {String} dir
 * @param {Object} opts
 * @return {Promise}
 */

function install(dir, opts){
	var folder = dir + '/' + opts.folder
	return all(getDeps(dir, opts), mkdirp(folder)).spread(function(env){
		debug('%p depends on %j', dir, env)
		var deps = env.production || {}
		// disable dev after the first iteration
		if (opts.dev) {
			opts.dev = false
			deps = merge(deps, env.development)
		}
		return each(deps, function(url, name){
			var path = url.replace(/^\w+:\/\//, '')
			var pkg = join(cache, encodeURIComponent(path))
			return ensureExists(url, pkg, opts).then(function(){
				return link(join(folder, name), pkg)
			})
		})
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
	return readLink(from).then(function(path){
		if (path != to) {
			debug('correcting symlink %p', from)
			return rmfile(from).then(function(){
				return symlink(to, from)
			})
		}
	}, function(e){
		switch (e.code) {
			case 'ENOENT': return symlink(to, from)
			case 'EINVAL': debug('skipping %p since might be important', from); break
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
	return exists(dest)
		.then(function(yes){
			if (!yes) return download(url, dest)
			debug('%p is already installed', url)
		})
		.then(function(){
			return install(dest, opts)
		})
		// fail tidily
		.then(null, function(e){
			return rmdir(dest).always(function(){ throw e })
		})
}

/**
 * check if the file/dir exists
 * 
 * @param {String} path
 * @return {Promise}
 */

function exists(path){
	return promise(function(fulfill){
		fs.exists(path, fulfill)
	})
}

function merge(a, b){
	if (b) for (var k in b) if (!(k in a)) {
		a[k] = b[k]
	}
	return a
}
