
var lift = require('lift-result/cps')
var latest = lift(require('github-latest'))

/**
 * get the latest tag for `name` which matches `spec`
 *
 * @param {String} name
 * @param {String} spec
 * @return {Result} string
 * @api public
 */

exports.tag = function(user, repo){
  return latest(user, repo).then(function(tag){
    return tag == null ? 'master' : tag
  })
}

/**
 * get the latest tarball url for name@spec
 *
 * @param {String} name
 * @param {String} spec
 * @return {Result} string
 * @api public
 */

exports.url = function(user, repo){
  return latest(user, repo).then(function(tag){
    return 'http://github.com/' 
      + user + '/' 
      + repo + '/tarball/'
      + (tag || 'master')
  })
}