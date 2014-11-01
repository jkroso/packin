
var get = require('solicit/node').get
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

/**
 * Get a url for the latest commit
 *
 * @param {String} user
 * @param {String} repo
 * @return {Result} String
 */

exports.head = function(user, repo){
  return get('https://api.github.com')
    .path('repos', user, repo, '/git/refs/heads/master')
    .then(function(body){
      return 'http://github.com/'
        + user + '/' + repo
        + '/tarball/' + body.object.sha.slice(0, 7)
    })
}
