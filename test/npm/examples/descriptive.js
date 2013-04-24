
var action = require('../src')

var through = action()

through
	.then({
		description: 'increment input by 1',
		stdin: function(v){
			this.dispatch('stdout', v + 1)
		}
	})
	.on({
		description: 'assert input is 6',
		stdin: function(v){
			console.assert(v === 6, 'input should equal 6')
		}
	})
	.then({
		description: 'log input to console',
		stdin: function(v){
			console.log(v)
		} 
	})

console.log(JSON.stringify(through, null, 2))
console.log('Run with input of %d results in:', 5)
through.stdin(5)
