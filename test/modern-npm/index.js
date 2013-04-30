
/**
 * find the first item that passes the `pred` test
 * 
 * @param {Array} array
 * @param {Function} pred (item)
 * @return {Any} the first passing value
 */

module.exports = function(array, pred){
	for (var i = 0, len = array.length; i < len; i++) {
		if (pred(array[i])) return array[i]
	}
}
