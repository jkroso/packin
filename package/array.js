
var Promise = require('laissez-faire/full')
  , fulfilled = Promise.fulfilled
  , read = require('when/read')

/**
 * await the arrival of all values in `array`
 * 
 * @param {Array} array
 * @return {Promise} for an new array
 */

module.exports = function(array){
	var res = []
	var len = array.length
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
		read(array[len], receiver(len), fail)
	}

	return p
}
