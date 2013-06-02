
var install = require('./src/install')

var defaultPriority = ['deps.json', 'component.json', 'package.json']

module.exports = function(dir, opts){
	if (typeof dir != 'string') opts = dir, dir = opts.target
	addDefaults(opts || (opts = {}))
	return install(dir, opts).then(function(){
		return opts.installed
	})
}

module.exports.one = function(url, dir, opts){
	addDefaults(opts || (opts = {}))
	return install.one(url, dir, opts).then(function(){})
}

function addDefaults(opts){
	opts.folder || (opts.folder = 'deps')
	opts.priority || (opts.priority = defaultPriority)
	opts.installed || (opts.installed = Object.create(null))
}