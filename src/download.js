
var exec = require('child_process').exec
var get = require('solicit/node').get
var defer = require('result/defer')
var lift = require('lift-result')
var log = require('./logger')
var untar = require('untar')
var zlib = require('zlib')

module.exports = download

/**
 * download a repo to a directory
 *
 * @param {String} url
 * @param {String} dir
 * @return {Promise} nil
 */

function download(url, dir){
  var protocol = url.match(/^(\w+):\/\//)[1]
  log.info('fetching', url)
  if (protocol in download) return download[protocol](url, dir)
  throw new TypeError('unsupported protocol ' + protocol)
}

download.http = download.https = http
download.git = git

/**
 * fetch a tar file and unpack to `dir`
 *
 * @param {String} url
 * @param {String} dir
 * @return {Promise}
 * @api private
 */

function http(url, dir){
  var res = get(url).response.then(function(res){
    if (res.statusType <3) return res
    throw new Error('http ' + res.status + ' ' + url)
  })
  return untar(dir, inflate(res, url))
}

/**
 * some servers don't tell you their encodings properly
 *
 * @param {IncomingMessage} res
 * @return {Promise<Stream>}
 * @api private
 */

var inflate = lift(function(res, url){
  var meta = res.headers
  if (/(deflate|gzip)$/.test(meta['content-type'])
  || (/registry\.npmjs\.org/).test(url)) {
    return res.pipe(zlib.createGunzip()).on('error', function(){
      throw new Error('gzip fucked up on ' + url)
    })
  }
  return res
})

/**
 * git clone
 *
 * @param {String} url
 * @param {String} dir
 * @return {Deferred}
 * @api private
 */

 function git(url, dir){ return defer(function(cb){
  var m = /#([^\/]+)$/.exec(url)
  var cmd = 'git clone --depth 1 '
  cmd += m != null
    ? url.slice(0, m.index) + ' ' + dir + ' --branch ' + m[1]
    : url + ' ' + dir
  log.warn('exec', '%s', cmd)
  exec(cmd, cb)
})}
