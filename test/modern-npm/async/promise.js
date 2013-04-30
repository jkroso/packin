
var Promise = require('laissez-faire/full')
  , when = require('when/read')

/**
 * find the first item that passes the `pred` test
 * 
 * @param {Array} array
 * @param {Function} pred (item) -> Promise Boolean
 * @return {Promise} for first passing value
 */

module.exports = function(array, pred){
	var i = array.length
	var pending = i
	var p = new Promise
	if (!i) fail()
	else do block(array[--i]); while(i)
	function block(item){
		when(pred(item), function(yes){
			if (yes) p.fulfill(item), i = 1
			else if (--pending < 1) fail()
		}, fail)
	}
	function fail(e){
		p.reject(e || new Error('none passed'))
	}
	return p
}
