
var exec = require('child_process').exec
  , promise = require('laissez-faire')
  , request = require('hyperquest')
  , log = require('./logger')
  , untar = require('untar')
  , zlib = require('zlib')

module.exports = download
download.get = response

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
	if (protocol in handlers) return handlers[protocol](url, dir)
	throw new Error('unsupported protocol '+protocol)
}

var handlers = Object.create(null)
var opts = { headers: {'Accept-encoding': 'gzip'}}

handlers.https =
handlers.http = function(url, dir){
	return response(url, opts).then(function(res){
		var headers = res.response.headers
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

handlers.git = function(url, dir){
	return promise(function(fulfill, reject){
		var cmd = 'git clone --depth 1 '
		var m = /#([^\/]+)$/.exec(url)
		if (m) {
			cmd += url.slice(0, m.index) + ' ' + dir + ' --branch ' + m[1] 
		} else {
			cmd	+= url + ' ' + dir
		}
		log.warn('exec', '%s', cmd)
		exec(cmd, function(e, so, se){
			if (e) reject(new Error(e.message))
			else fulfill()
		})
	})
}

/**
 * handle http/https requests
 * 
 * @param  {String} url
 * @return {Promise} response
 */

function response(url, opts){
	return promise(function(fulfill, reject){
		function get(url){
			var stream = request(url, opts)
			stream.on('response', function(res){
				var status = res.statusCode
				if (status > 300 && status < 308) {
					get(res.headers.location)
				} else if (status != 200) {
					reject(new Error(url + ' -> ' + status))
				} else {
					stream.removeListener('error', reject)
					fulfill(stream)
				}
			})
			stream.on('error', reject)
		}
		get(url)
	})
}
