
var Promise = require('laissez-faire/full')

/**
 * find the first item that passes the `pred` test
 * 
 * @param {Array} array
 * @param {Function} pred (item, callback)
 * @return {Promise} for first passing value
 */

module.exports = function(array, pred){
	var i = 0
	var pending = array.length
	var len = pending
	var p = new Promise
	if (!pending) fail(p)
	else do block(array[i]); while(++i < len)
	function block(item){
		pred(item, function(yes){
			if (yes) p.fulfill(item), len = 0
			else if (--pending < 1) fail(p)
		})
	}
	return p
}

function fail(promise){
	promise.reject(new Error('none passed'))
}
