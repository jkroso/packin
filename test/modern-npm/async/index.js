
var cb = require('./cb')
  , promise = require('./promise')

/**
 * Dispatch to what looks like the correct API
 */

module.exports = function(obj, pred){
	return pred.length > 1
		? cb(obj, pred) 
		: promise(obj, pred)
}