
var fs = require('fs')
  , promise = require('laissez-faire')
  , download = require('./download')
  , path = require('path')
  , join = path.join
  , all = require('when-all/naked')
  , each = require('foreach/series/promise')
  , promisify = require('promisify')
  , mkdirp = promisify(require('mkdirp'))
  , link = promisify(fs.symlink)
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
	var depsDir = dir + '/' + opts.folder
	return all(getDeps(dir, opts), mkdirp(depsDir)).spread(function(env){
		debug('%p depends on %j', dir, env)
		var deps = env.production || {}
		// disable dev after the first iteration
		if (opts.dev) {
			opts = Object.create(opts)
			opts.dev = false
			deps = merge(deps, env.development)
		}
		return each(deps, function(url, name){
			var path = url.replace(/^\w+:\/\//, '')
			var pkg = join(cache, encodeURIComponent(path))
			return exists(pkg)
				.then(function(yes){
					if (!yes) return download(url, pkg)
					debug('%p is already installed', url)
				})
				.then(install.bind(null, pkg, opts))
				// fail tidily
				.then(null, function(e){
					return rmdir(pkg).always(function(){ throw e })
				})
				// link to dep
				.then(function(){
					var sym = join(depsDir, name)
					return readLink(sym).then(function(dest){
						if (dest != pkg) {
							debug('correcting symlink %p', sym)
							return rmfile(sym).then(link.bind(null, pkg, sym))
						}
					}, function(e){
						switch (e.code) {
							case 'ENOENT': return link(pkg, sym)
							case 'EINVAL': debug('skipping %p since might be important', sym); break
							throw new Error(e.message)
						}
					})
				})
		})
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
