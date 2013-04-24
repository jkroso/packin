
var graph = require('..')

var ib = graph({
	inc: function(a){
		return a + 1
	},
	bang: function(inc){
		return inc + '!'
	}
})

console.log(ib(1))
