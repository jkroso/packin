
var Package = require('./src/package')
var each = require('foreach/async')
var fs = require('lift-result/fs')
var log = require('./src/logger')
var join = require('path').join
var rm = require('rm-r/sync')

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
  if (opts.development == null && opts.production == null) {
    pkg.development = true
  }

  // install
  return pkg.install().then(function(){
    if (url == to) return addLinks(pkg, {})
    return pkg.link(to).then(addLinks.bind(null, pkg, {}))
  }, undo).yeild(pkg)
}

function mkdir(folder){
  return fs.mkdir(folder).then(null, function(e){
    if (e.code != 'EEXIST') throw e
  })
}

var defaultFiles = Package.prototype.possibleFiles

/**
 * recursively symlink to dependencies
 *
 * @param {Package} pkg
 * @param {Object} seen
 * @return {Promise}
 */

function addLinks(pkg, seen){
  if (seen[pkg.location]) return
  seen[pkg.location] = true
  var folder = join(pkg.location, pkg.folder)
  return mkdir(folder).then(function(){
    return each(pkg.dependencies, function(dep, name){
      return dep
        .link(join(folder, name))
        .then(addLinks.bind(null, dep, seen))
    })
  })
}

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
