
var Promise = require('laissez-faire/full')
  , fulfilled = Promise.fulfilled
  , read = require('when/read')

/**
 * await the arrival of all values in `obj`
 * 
 * @param {Object} obj
 * @return {Promise} for a new Object
 */

module.exports = function(obj){
	var res = {}
	var keys = []
	for (var k in obj) keys.push(k)
	var len = keys.length
	if (!len) return fulfilled(res)
	var pending = len
	var p = new Promise
	var receiver = function(i){
		return function(value){
			res[i] = value
			if (--pending === 0) p.fulfill(res)
		}
	}
	var fail = function(e){
		// break loop if it hasn't already finished
		p.reject(e), len = 0
	}
	
	while (len--) {
		read(obj[k = keys[len]], receiver(k), fail)
	}

	return p
}
