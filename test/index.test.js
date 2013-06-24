
var exec = require('child_process').exec
  , equal = require('fs-equals/assert')
  , log = require('../src/logger')
  , chai = require('./chai')
  , install = require('..')
  , fs = require('fs')
  , exists = fs.existsSync
  , readLink = fs.readlinkSync

// log.enable('debug')

var cache = process.env.HOME + '/.packin/-'

var filterOpts = {
	name: function(name){
		return !(/deps|node_modules/).test(name)
	}
}

afterEach(function(){
	// install uses an internal cache so it needs to be reloaded
	// between tests since we are deleting files between runs
	delete require.cache[require.resolve('..')]
	delete require.cache[require.resolve('../src/install')]
	install = require('..')
})

function rmdir(dir, cb){
	exec('rm -rf '+dir, cb)
}

afterEach(function(done){
	rmdir(cache+'/localhost:3000', done)
})

describe('install', function(){
	var dir = __dirname+'/simple'
	afterEach(function(done){
		rmdir(__dirname+'/simple/deps', done)
	})

	it('should install dependencies', function(done){
		install(dir).then(function(){
			return equal(
				__dirname+'/simple/deps/equals',
				__dirname+'/packages/equals/master',
				filterOpts
			)
		}).node(done)
	})

	it('should install subdependencies', function(done){
		install(__dirname+'/simple').then(function(){
			return equal(
				__dirname+'/simple/deps/equals/deps/type',
				__dirname+'/packages/type/master',
				filterOpts
			)
		}).node(done)
	})

	it('should be able to ignore development dependencies', function(done){
		install(__dirname+'/simple', {
			production:true
		}).then(function(){
			exists(__dirname+'/simple/deps/type').should.be.false
		}).node(done)
	})

	it('but should include them by default', function(done){
		install(__dirname+'/simple').then(function(){
			exists(__dirname+'/simple/deps/type').should.be.true
		}).node(done)
	})

	it('should fix misdirected symlinks', function(done){
		install(dir).then(function(){
			fs.unlinkSync(dir+'/deps/equals')
			fs.symlinkSync('/some/path/that/probably/no/good.coffee', dir+'/deps/equals')
			return install(dir).then(function(){
				fs.readlinkSync(dir+'/deps/equals').should.not.include('no/good.coffe')
			})
		}).node(done)
	})

	it('should return a list of installed deps', function(done){
		install(dir).then(function(deps){
			expect(deps).to.be.an('object')
				.and.include.keys(
					'http://localhost:3000/equals/master',
					'http://localhost:3000/type/master'
				)
		}).node(done)
	})

	it('should pick the meta data file with the most data', function(done){
		var dir = __dirname + '/priority'
		install(dir).read(function(log){
			exists(dir+'/deps/mocha').should.be.true
			exists(dir+'/deps/mocha/deps/equals').should.be.true
			exists(dir+'/deps/mocha/deps/type').should.be.true
			rmdir(dir+'/deps', done)
		})
	})
})

describe('cleanup', function(){
	var dir = __dirname+'/error'
	afterEach(function(done){
		rmdir(__dirname+'/error/deps', done)
	})
	// localhost install directory
	var lh = cache + '/localhost:3000'
	it('should remove all new dependencies', function(done){
		install(__dirname+'/simple').then(function(logA){
			exists(lh+'/equals/master').should.be.true
			exists(lh+'/type/master').should.be.true
			return install(dir).then(null, function(e){
				expect(e).to.be.an.instanceOf(Error)
				exists(lh+'/equals/master').should.be.true
				exists(lh+'/type/master').should.be.true
				exists(lh+'/fail/master').should.be.false
				exists(lh+'/failing/master').should.be.false
			})
		}).node(done)
	})
})

describe('merging', function(){
	var dir = __dirname+'/merging'
	afterEach(function(done){
		rmdir(__dirname+'/merging/deps', done)
	})

	it('should merge dependencies from different files', function(done){
		install(dir, {
			files: ['deps.json', 'package.json']
		}).then(function(log){
			exists(dir+'/deps/equals').should.be.true
			exists(dir+'/deps/type').should.be.true
		}).node(done)
	})

	it('should respect priority', function(done){
		install(dir, {
			files: ['deps.json', 'package.json']
		}).then(function(log){
			exists(dir+'/deps/equals').should.be.true
			exists(dir+'/deps/type').should.be.true
			readLink(dir+'/deps/equals').should.not.equal(dir+'/deps/type')
		}).node(done)
	})
})

describe('custom install folders', function(){
	afterEach(function(done){
		rmdir(__dirname+'/simple/node_modules', done)
	})

	it('should work', function(done){
		install(__dirname+'/simple', {folder: 'node_modules'}).then(function(){
			return equal(
				__dirname+'/simple/node_modules/equals',
				__dirname+'/packages/equals/master',
				filterOpts
			).then(function(){
				return equal(
					__dirname+'/simple/node_modules/equals/node_modules/type',
					__dirname+'/packages/type/master',
					filterOpts
				)
			})
		}).node(done)
	})
	
	it('should be able to install packages for node', function(done){
		install(__dirname+'/simple', {folder: 'node_modules'}).then(function(){
			var simple = require('./simple')
			simple.should.be.a('function')
		}).node(done)
	})
})

describe('component.json', function(){
	this.timeout(false)
	var dir = __dirname+'/component'
	afterEach(function(done){
		rmdir(__dirname+'/component/node_modules', done)
	})

	it('should install subdependencies', function(done){
		install(dir, {folder: 'node_modules'}).then(function(){
			exists(dir+'/node_modules/toposort').should.be.true
			require(dir).should.be.a('function')
			exec('node '+__dirname+'/component/examples/basic', function(e, out, err){
				if (e) return done(e)
				out.toString().should.equal('2!\n')
				done()
			})
		})
	})
})

describe('package.json', function(){
	this.timeout(false)
	var dir = __dirname+'/npm'
	afterEach(function(done){
		rmdir(dir + '/node_modules', done)
	})

	it('should install production dependencies', function(done){
		install(dir, {
			files: ['package.json'],
			folder: 'node_modules',
			production: true
		}).then(function(){
			exists(dir+'/node_modules/sliced').should.be.true
			require(dir).should.be.a('function')
			exec('node '+__dirname+'/npm/examples/basic', function(e, out, err){
				if (e) return done(e)
				out.toString().should.equal('up 3\ndown 1\n')
				done()
			})
		})
	})

	it('should install devDependencies', function(done){
		install(dir, {
			files: ['package.json'],
			folder: 'node_modules'
		}).then(function(){
			exists(dir+'/node_modules/sliced').should.be.true
			exists(dir+'/node_modules/mocha').should.be.true
			require(dir+'/node_modules/mocha').should.be.a('function')
		}).node(done)
	})
})

describe('modern-npm', function(){
	this.timeout(false)
	var dir = __dirname+'/modern-npm'

	beforeEach(function(done){
		rmdir(cache+'/github.com/component/find', done)
	})

	beforeEach(function(done){
		rmdir(cache+'/github.com/Raynos/readable-stream#read-stream', done)
	})

	afterEach(function(done){
		rmdir(dir+'/node_modules', done)
	})

	it('should love it', function(done){
		install(dir, {
			files: ['package.json'],
			folder: 'node_modules',
			production: true
		}).then(function(){
			exists(dir+'/node_modules/when').should.be.true
			exists(dir+'/node_modules/laissez-faire').should.be.true
			exists(dir+'/node_modules/find').should.be.true
			exists(dir+'/node_modules/readable-stream').should.be.true
			require(dir+'/async').should.be.a('function')
		}).node(done)
	})
})

describe('invalid npm deps', function(){
	this.timeout(false)
	var dir = __dirname+'/bad-npm/invalid-version'
	afterEach(function(done){
		rmdir(dir+'/node_modules', done)
	})

	it('should error', function(done){
		install(dir, {
			files: ['package.json'],
			folder: 'node_modules',
			production: true
		}).then(null, function(e){
			e.should.be.an.instanceOf(Error)
			e.message.should.include('not in npm')
			done()
		})
	})
})

describe('install.one(url, dest, opts)', function(){
	var pkg = 'http://localhost:3000/equals/master'
	var dir = __dirname + '/equals'
	afterEach(function(done){
		exec('rm '+dir, done)
	})

	it('should install `url` to `dest`', function(done){
		install.one(pkg, dir).then(function(){
			return equal(
				__dirname+'/equals',
				__dirname+'/packages/equals/master',
				filterOpts
			)
		}).node(done)
	})
})