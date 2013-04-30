
var fs = require('fs')
  , promise = require('laissez-faire')
  , download = require('./download')
  , zlib = require('zlib')
  , path = require('path')
  , all = require('when-all/naked')
  , each = require('foreach/async/promise')
  , promisify = require('promisify')
  , mkdirp = promisify(require('mkdirp'))
  , link = promisify(fs.symlink)
  , readLink = promisify(fs.readlink)
  , rmfile = promisify(fs.unlink)
  , rmdir = promisify(require('rmdir'))
  , getDeps = require('./get-deps')
  , untar = require('untar')
  , debug = require('debug')('packin')

var cacheDir = process.env.HOME + '/.packin/cache'

module.exports = install

/**
 * link dependencies to a package. Install new packages as 
 * necessary.
 * (String) -> Promise nil 
 */

function install(dir, opts){
	var depsDir = dir + '/' + opts.folder
	return all(getDeps(dir, opts), mkdirp(depsDir)).spread(function(env){
		var deps = env.production || {}
		// disable dev after the first iteration
		if (opts.dev) {
			opts = Object.create(opts)
			opts.dev = false
			deps = merge(deps, env.development)
		}
		return each(deps, function(url, name){
			var pkg = path.join(cacheDir, encodeURIComponent(url))
			return exists(pkg)
				.then(function(yes){
					debug('%p already installed? %s', pkg, yes)
					if (!yes) return download(url)
						.then(unzip)
						.then(untar.bind(null, pkg))
				})
				.then(install.bind(null, pkg, opts))
				// link to dep
				.then(function(){
					var sym = path.join(depsDir, name)
					return readLink(sym).then(function(dest){
						if (dest != pkg) {
							debug('correcting symlink %p', sym)
							return rmfile(sym).then(link.bind(null, pkg, sym))
						}
					}, function(e){
						if (e.code != 'ENOENT') throw new Error(e.message)
						return link(pkg, sym)
					})
				})
				// fail tidily
				.otherwise(function(e){
					return rmdir(pkg).always(function(){ throw e })
				})
		})
	})
}

/**
 * check if the file/dir exists
 * (String) -> Promise Boolean
 */

function exists(path){
	return promise(function(fulfill){
		fs.exists(path, fulfill)
	})
}

function unzip(pkg){
	return pkg.pipe(zlib.createGunzip())
}

function merge(a, b){
	if (b) for (var k in b) if (!(k in a)) {
		a[k] = b[k]
	}
	return a
}
