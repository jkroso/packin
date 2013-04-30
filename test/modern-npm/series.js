
var Promise = require('laissez-faire')

/**
 * find the first item in `array` by position that doesn't
 * fail the `pred` test
 * 
 * @param {Array} array
 * @param {Function} pred (item, callback)
 * @return {Promise} for first passing value
 */

module.exports = function(array, pred){
	var i = 0
	var pending = array.length
	var p = new Promise
	function next(yes){
		if (yes) return p.fulfill(array[i - 1])
		if (i < pending) {
			pred(array[i++], next)
		} else {
			p.reject(new Error('none passed'))
		}
	}
	next(false)
	return p
}
