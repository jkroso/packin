
var promise = require('laissez-faire')
  , request = require('hyperquest')

module.exports = download

/**
 * Get a response stream
 * (String) -> Promise stream
 */

function download(url){
	return promise(function(fulfill, reject){
		getURL(url, function(e, res){
			if (e) reject(e)
			else fulfill(res)
		})
	})
}

/**
 * send request
 * (String, (error, response) -> nil) -> nil
 */

function getURL(url, cb){
	var stream = request(url)
	stream.on('response', function response(response){
		var status = response.statusCode
		if (status > 300 && status < 308) {
			getURL(response.headers.location, cb)
		} else if (status != 200) {
			cb(new Error(url + ' -> ' + status))
		} else {
			stream.removeListener('error', cb)
			cb(null, stream)
		}
	})
	stream.on('error', cb)
}
