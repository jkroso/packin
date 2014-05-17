
var Package = require('./src/package')
var each = require('foreach/async')
var fs = require('lift-result/fs')
var log = require('./src/logger')
var join = require('path').join
var rm = require('rm-r/sync')
var copy = require('cp-r')

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
    if (opts.copy) return copyDeps(pkg, pkg.location, {})
    if (url == to) return addLinks(pkg, {})
    return pkg.link(to).then(addLinks.bind(null, pkg, {}))
  }, undo).yield(pkg)
}

function mkdir(folder){
  return fs.mkdir(folder).then(null, function(e){
    if (e.code != 'EEXIST') throw e
  })
}

var defaultFiles = Package.prototype.possibleFiles

/**
 * recursively symlink to dependencies to their
 * proper location
 *
 * @param {Package} pkg
 * @param {Object} seen
 * @return {Promise}
 */

function addLinks(pkg, seen){
  if (seen[pkg.location]) return
  seen[pkg.location] = true
  if (!pkg.isNew && !pkg.retrace) return
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
 * cp -r dependencies to their proper location
 *
 * @param {Package} pkg
 * @param {String} location
 * @param {Object} seen
 * @return {Promise}
 */

function copyDeps(pkg, location, seen){
  // avoid mutating parents
  seen = Object.create(seen)
  var folder = join(location, pkg.folder)
  return each(pkg.dependencies, function(dep, name){
    if (seen[dep.location]) return
    seen[dep.location] = true
    var path = join(folder, name)
    return fs.lstat(path)
      .then(function(s){
        if (s.isSymbolicLink()) rm.file(path)
      }, function ignoreErr(){})
      .then(function(){
        return copy(dep.location, path).then(function(){
          return copyDeps(dep, path, seen)
        })
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
