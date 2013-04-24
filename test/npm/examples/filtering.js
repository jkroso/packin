
var action = require('../src')

function filter(exp){
	var pred = Function('v', 'return v '+exp)
	return action(function(v){
		if (pred(v)) this.dispatch('stdout', v)
		else this.dispatch('fail', v)
	})
}

var through = module.exports = action()

through.on(log('% is '))
	.then(filter('> 5'))
	.on(log('> 5 '))
	.on('fail', log('<= 5\n'))
	.then(filter('< 10'))
		.on(log('and <= 9\n'))
		.on('fail', log('and > 9\n'))

for (var i = 0, len = 15; i < len; i++) {
	through.stdin(i)
}

function log(msg){
	return action(function(v){
		process.stdout.write(msg.replace(/%/, v))
	})
}
