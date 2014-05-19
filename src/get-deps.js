
var reduce = require('reduce/series')
var github = require('./github').url
var defer = require('result/defer')
var fs = require('lift-result/fs')
var lift = require('lift-result')
var join = require('path').join
var npm = require('./npm').url
var semver = require('semver')
var each = require('foreach')
var map = require('map')

module.exports = lift(deps)

/**
 * get a normalized deps.json
 *
 * @param {String} dir
 * @param {Array} files
 * @param {Boolean} production
 * @param {Boolean} development
 * @return {Result} deps
 */

function deps(dir, files, p, d){
  return reduce(files, function(depsA, file){
    var json = readJSON(join(dir, file))
    var depsB = normalize[file](json)
    return merge(depsA, depsB, p, d)
  }, {})
}

/**
 * merge the keys from json which are already on `deps`
 *
 * @param {Object} deps
 * @param {Object} json
 * @param {Object} options
 * @api private
 */

var merge = lift(function(deps, json, p, d){
  d && softMerge(deps, json.development)
  p && softMerge(deps, json.production)
  return deps
})

function softMerge(a, b){
  for (var k in b) {
    if (!(k in a)) a[k] = b[k]
  }
}

/**
 * JSON normalizers
 *
 * @param {Object} json
 * @return {Object}
 */

var normalize = map({
  'deps.json': function(json){ return json },
  'component.json': function(json){
    return {
      production: normalizeComponent(json.dependencies),
      development: normalizeComponent(json.development)
    }
  },
  'package.json': function(json){
    return {
      production: normalizeNpm(json.dependencies),
      development: normalizeNpm(json.devDependencies)
    }
  }
}, lift)

/**
 * convert component.json format to the more explicit
 * deps.json format.
 *
 *   "jkroso/emitter": "1.0.0" -> "emitter": "http://..."
 *
 * @param {Object} deps
 * @return {Object}
 * @api private
 */

function normalizeComponent(deps){
  if (!deps) return null
  var res = {}
  each(deps, function(tag, name){
    var parts = name.split('/')
    var user = parts[0]
    var repo = parts[1]
    if (!repo) throw new Error('invalid component.json entry "' + name + '"')
    res[repo] = tag == '*'
      ? defer(function(){ return github(user, repo) })
      : 'http://github.com/' + name + '/tarball/' + tag
  })
  return res
}

function normalizeNpm(deps){
  if (!deps) return
  for (var name in deps) {
    deps[name] = npmUrl(name, deps[name])
  }
  return deps
}

function npmUrl(name, version){
  // explicit version
  if (semver.valid(version)) {
    return 'http://registry.npmjs.org/'+name+'/-/'+name+'-'+version+'.tgz'
  }
  // straight up url
  if (/^\w+:\/\//.test(version)) {
    return version
  }
  // github shorthand
  if (/^([^\/#]+\/[^\/#]+)(?:#(.+))?/.test(version)) {
    var version = RegExp.$2
    var name = RegExp.$1
    return version
      ? 'http://github.com/' + name + '/tarball/' + version
      : defer(function(){ return github.apply(null, name.split('/')) })
  }

  // validate name
  if (/\//.test(name)) {
    throw new Error('invalid package name ' + name)
  }

  // resolve semver lazily
  return defer(function(){
    return npm(name, version)
  })
}

function readJSON(file){
  return fs.readFile(file, 'utf-8').then(JSON.parse)
}
