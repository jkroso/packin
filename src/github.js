var username = process.env.GITHUB_USERNAME
var password = process.env.GITHUB_PASSWORD
var semver = require('semver-compare')
var get = require('solicit/node').get

var request = get('https://api.github.com')

if (username && password) request.auth(username, password)

function findLatest(tags){ return tags.map(getName).sort(semver).pop() }
function getName(tag){ return tag.name }

function latestVersion(user, repo) {
  return request.clone()
    .path('repos', user, repo, 'tags')
    .then(findLatest)
}

/**
 * get the latest tag for `name` which matches `spec`
 *
 * @param {String} name
 * @param {String} spec
 * @return {Result} string
 * @api public
 */

exports.tag = function(user, repo){
  return latestVersion(user, repo).then(function(tag){
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
  return latestVersion(user, repo).then(function(tag){
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
  return request.clone()
    .path('repos', user, repo, '/git/refs/heads/master')
    .then(function(body){
      return 'http://github.com/'
        + user + '/' + repo
        + '/tarball/' + body.object.sha.slice(0, 7)
    })
}
