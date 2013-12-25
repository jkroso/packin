
var path = require('path')

exports.error = 
exports.warn = 
exports.info =
exports.debug = function(){}
exports.format = fmt

/**
 * format `msg` with a `type` header
 *
 * @param {String} type
 * @param {String} msg
 * @param {String} [color=36]
 */

function space(type, msg, color){
	color = color || '36'
	var w = 12
	var len = Math.max(0, w - type.length)
	var pad = Array(len + 1).join(' ')
	return '\033[' + color + 'm  ' + type + '\033[m: \033[90m' + msg + '\033[m\n'
}

/**
 * write to stdout
 * 
 * @param {String} type
 * @param {String} msg
 */

function out(type, msg){
	msg = fmt.apply(this, [].slice.call(arguments, 1))
	process.stdout.write(space(type, msg))
}

/**
 * write to stderr
 * 
 * @param {String} type
 * @param {String} msg
 */

function error(type, msg){
	msg = fmt.apply(this, [].slice.call(arguments, 1))
	process.stderr.write(space(type, msg))
}



/**
 * log a formated string
 * @param {String} str
 */

function debug(str){
	var args = [].slice.call(arguments)
	args.unshift('debug')
	error.apply(null, args)
}


/**
 * progressivly enable logging types
 * @param {String} level
 */

exports.enable = function(level){
	switch (level) {
		case 'debug': exports.debug = debug
		case 'error': exports.error = error
		case 'warn': exports.warn = error
		case 'info': exports.info = out
	}
}

/**
 * replace tokens with formated values
 * 
 * @param {String} str
 * @param {Arguments} args
 * @param {Number} i
 * @return {String}
 */

function fmt(str){
	var i = 1
	var args = arguments
	return str.replace(/%([a-z])/g, function(_, type){
		return typeof fmt[type] == 'function'
			? fmt[type](args[i++])
			: _
	})
}

fmt.s = String

fmt.p = function(p){
	if (p[0] != '/') return p
	var rel = path.relative(process.cwd(), p)
	// parent directory
	if (rel[0] == '.') return p.replace(process.env.HOME, '~')
	// child directory
	return './' + rel
}

fmt.u = function uri(uri){
	return decodeURIComponent(uri)
}

fmt.j = function json(obj){
	return JSON.stringify(obj, null, 2).replace(/\n/g, '\n  ')
}

fmt.d = function number(n){
	n = String(n).split('.')
	n[0] = n[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + ',')
	return n.join('.')
}
