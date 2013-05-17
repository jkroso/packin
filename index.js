
var install = require('./src/install')

var defaultPriority = ['deps.json', 'component.json', 'package.json']

module.exports = function(dir, opts){
	if (typeof dir != 'string') opts = dir, dir = opts.target
	opts || (opts = {})
	opts.folder || (opts.folder = 'deps')
	opts.priority || (opts.priority = defaultPriority)
	return install(dir, opts)
}