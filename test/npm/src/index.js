
/**
 * Module dependencies
 */

var slice = require('sliced')

function Action(fn){
	if (typeof fn == 'function') {
		this.stdin = this.action = this.send = fn
	} else {
		for (var f in fn) this[f] = fn[f]
	}
	this.pins = {}
	this.pin('stdout')
}

Action.prototype.on = function(pin, action){
	this.then(pin, action)
	return this
}

// (string) -> object
function parseConnection(str){
	if (typeof str != 'string' || !str) return {from: 'stdout', to: 'stdin'}
	str = str.split('=>')
	return {
		from: str[0],
		to: str[1] || 'stdin'
	}
}

/**
 * connect an action to one of `this`'s output pin
 *
 * @param {String} [pin] "from=>to"
 * @param {Function|Action} action
 * @return {Action}
 */

Action.prototype.then = function(pin, action){
	if (typeof pin != 'string') action = pin, pin = action.name
	var con = parseConnection(pin)
	pin = con.from;
	(this.pins[pin] || (this.pins[pin] = [])).push(con)
	return con.action = toAction(action)
}

Action.prototype.pin = function(name){
	this[name] = this.dispatch.bind(this, name)
	return this
}

Action.prototype.dispatch = function(pin){
	var args = slice(arguments, 1)
	var cons = this.pins[pin]
	cons && cons.forEach(function(c){
		c.action[c.to].apply(c.action, args)
	})
	return this
}

// (function|object|action) -> action
function toAction(x){
	if (typeof x == 'function') return new Action(x)
	if (x instanceof Action) return x
	if (x.pins == null) x.pins = {}
	if (x.on == null) x.on = Action.prototype.on
	if (x.then == null) x.then = Action.prototype.then
	if (x.dispatch == null) x.dispatch = Action.prototype.dispatch
	return x
}

// set exports
module.exports = function(fn){
	return new Action(fn || forward)
}

function forward(){
	this.stdout.apply(this, arguments)
}

module.exports.Action = Action
module.exports.force = toAction

// aliases
Action.prototype.connect = Action.prototype.then
