
var install = require('./src/install')

var defaultPriority = ['deps.json', 'component.json', 'package.json']

module.exports = function(dir, opts){
	if (typeof dir != 'string') opts = dir, dir = opts.target
	opts || (opts = {})
	addDefaults(opts)
	return install(dir, opts)
}

module.exports.one = function(url, dir, opts){
	opts || (opts = {})
	addDefaults(opts)
	return install.one(url, dir, opts)
}

function addDefaults(opts){
	opts.folder || (opts.folder = 'deps')
	opts.priority || (opts.priority = defaultPriority)
}