
var array = require('./array')

/**
 * The same as array.js but with arguments passed 
 * directly rather than inside an array
 * 
 * @param {...} ...
 * @return {Promise} for an array of values
 */

module.exports = function(){
	return array(arguments)
}