
var action = require('..')

var start = action(function(v){
	this.stdout(v)
})

var up = action(function(v){
	this.stdout('up', v + 1)
})

var down = action(function(v){
	this.stdout('down', v - 1)
})

var log = action(function(){
	console.log.apply(console, arguments)
})

start.then(up).then(log)
start.then(down).then(log)

start.stdin(2)