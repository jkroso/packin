
var exec = require('child_process').exec
var get = require('solicit/node').get
var defer = require('result/defer')
var lift = require('lift-result')
var log = require('./logger')
var untar = require('untar')
var zlib = require('zlib')

/**
 * download a repo to a directory
 *
 * @param {String} url
 * @param {String} dir
 * @return {Promise} nil
 */

module.exports = function(url, dir){
	var protocol = url.match(/^(\w+):\/\//)[1]
	log.info('fetching', url)
	if (protocol in handlers) return handlers[protocol](url, dir)
	throw new Error('unsupported protocol '+protocol)
}

var handlers = Object.create(null)

/**
 * fetch a tar file and unpack to `dir`
 *
 * @param {String} url
 * @param {String} dir
 * @return {Result}
 * @api private
 */

handlers.https =
handlers.http = function(url, dir){
	return untar(dir, inflate(get(url).response, url))
}

/**
 * some servers don't tell you their encodings properly
 *
 * @param {IncomingMessage} res
 * @return {Stream}
 * @api private
 */

var inflate = lift(function(res, url){
	var meta = res.headers
	if (/(deflate|gzip)$/.test(meta['content-type'])
	|| (/registry\.npmjs\.org/).test(url)) {
		return res.pipe(zlib.createGunzip()).on('error', function(e){
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

handlers.git = function(url, dir){ return defer(function(write, error){
	var cmd = 'git clone --depth 1 '
	var m = /#([^\/]+)$/.exec(url)
	if (m) {
		cmd += url.slice(0, m.index) + ' ' + dir + ' --branch ' + m[1]
	} else {
		cmd	+= url + ' ' + dir
	}
	log.warn('exec', '%s', cmd)
	exec(cmd, function(e, so, se){
		if (e) error(new Error(e.message))
		else write()
	})
})}