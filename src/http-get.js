
var parseURL = require('url').parse
	, Result = require('result')

var types = {
	'http:': require('http').request,
	'https:': require('https').request
}

/**
 * handle http/https requests
 * 
 * @param  {String} url
 * @return {DeferredResult} response
 */

module.exports = function(url, headers){
	var result = new Result
	
	function get(url){
		types[url.protocol]({
			method: 'GET',
			host: url.hostname,
			port: Number(url.port),
			path: url.path,
			agent: false,
			headers: headers
		}, function(res){
			var status = res.statusCode
			if (status > 300 && status < 308) {
				var link = res.headers.location
				if (/^\//.test(link)) {
					url.path = link
					return get(url)
				}
				return get(parseURL(link))
			}
			if (status != 200) {
				return result.error(new Error(url + ' -> ' + status))
			}
			result.write(res)
		}).on('error', function(e){
			result.error(e)
		}).end()
	}

	get(parseURL(url))

	return result
}