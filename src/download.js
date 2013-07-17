
var exec = require('child_process').exec
	, defer = require('result/defer')
	, get = require('./http-get')
	, log = require('./logger')
	, untar = require('untar')
	, zlib = require('zlib')

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
var headers = {'Accept-encoding': 'gzip'}

handlers.https =
handlers.http = function(url, dir){
	return get(url, headers).then(function(res){
		var headers = res.headers
		if (/(deflate|gzip)$/.test(headers['content-encoding'])
		|| (/(deflate|gzip)$/).test(headers['content-type'])
		|| (/registry\.npmjs\.org/).test(url)) {
			res = res.pipe(zlib.createGunzip()).on('error', function(e){
				throw new Error('gzip fucked up on ' + url)
			})
		}
		return untar(dir, res)
	})
}

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
