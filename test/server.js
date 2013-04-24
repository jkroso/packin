
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path')
  , spawn = require('child_process').spawn
  , zlib = require('zlib')

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
// app.use(express.compress({
// 	filter: function(req, res){
// 	  return true
// 	}
// }))
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/:package/:version', function(req, res){
	var pkg = req.params.package
	var version = req.params.version
	var dir = path.join(__dirname, 'packages', pkg, version)
	spawn('tar', ['c', dir]).stdout
		.pipe(zlib.createGzip())
		.pipe(res)
})

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
