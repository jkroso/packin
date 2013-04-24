
var action = require('..')

var dom = action()

var dispatch = action({
	keyup: function(e){
		this.state = 'up'
	},
	keydown: function(e){
		this.state = 'down'
	}
})

dom
	.on('keydown=>keydown', dispatch)
	.on('keyup=>keyup', dispatch)

dom.dispatch('keydown')
console.log('dispatcher state: "%s"', dispatch.state)
dom.dispatch('keyup')
console.log('dispatcher state: "%s"', dispatch.state)
