
var array = require('./array')
  , object = require('./object')

/**
 * dispatch to the appropriate module
 *
 * @param {Object|Arraylike} x
 * @return {Promise} new x
 */

module.exports = function(obj){
	return obj.length === +obj.length
		? array(obj)
		: object(obj)
}