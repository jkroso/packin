
var install = require('..')
  , fs = require('fs')
  , exists = fs.existsSync
  , equal = require('fs-equals/assert')
  , should = require('chai').should()
  , exec = require('child_process').exec

var filterOpts = {
	name: function(name){
		return !(/deps|node_modules/).test(name)
	}
}

// afterEach(function (done) {
// 	exec('rm -rf ~/.packin/cache', done)
// })

function rmdir(dir, cb){
	exec('rm -rf '+dir, cb)
}

describe('install', function () {
	var dir = __dirname+'/simple'
	afterEach(function (done) {
		rmdir(__dirname+'/simple/deps', done)
	})

	it('should install dependencies', function (done) {
		install(dir).then(function(){
			return equal(
				__dirname+'/simple/deps/equals',
				__dirname+'/packages/equals/master',
				filterOpts
			)
		}).node(done)
	})

	it('should install subdependencies', function (done) {
		install(__dirname+'/simple').then(function(){
			return equal(
				__dirname+'/simple/deps/equals/deps/type',
				__dirname+'/packages/type/master',
				filterOpts
			)
		}).node(done)
	})

	it('should ignore development dependencies', function (done) {
		install(__dirname+'/simple').then(function(){
			exists(__dirname+'/simple/deps/type').should.be.false
		}).node(done)
	})

	it('unless told to include them', function (done) {
		install(__dirname+'/simple', {dev: true}).then(function(){
			exists(__dirname+'/simple/deps/type').should.be.true
		}).node(done)
	})

	it('should fix misdirected symlinks', function (done) {
		install(dir).then(function(){
			fs.unlinkSync(dir+'/deps/equals')
			fs.symlinkSync('/some/path/that/probably/no/good.coffee', dir+'/deps/equals')
			return install(dir).then(function(){
				fs.readlinkSync(dir+'/deps/equals').should.not.include('no/good.coffe')
			})
		}).node(done)
	})
})

describe('custom install folders', function () {
	afterEach(function (done) {
		rmdir(__dirname+'/simple/node_modules', done)
	})

	it('should work', function (done) {
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
	
	it('should be able to install packages for node', function (done) {
		install(__dirname+'/simple', {folder: 'node_modules'}).then(function(){
			var simple = require('./simple')
			simple.should.be.a('function')
		}).node(done)
	})
})

describe('component.json', function () {
	var dir = __dirname+'/component'
	afterEach(function (done) {
		rmdir(__dirname+'/component/node_modules', done)
	})

	it('should install subdependencies', function (done) {
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

describe('package.json', function () {
	var dir = __dirname+'/npm'
	afterEach(function (done) {
		rmdir(__dirname+'/npm/node_modules', done)
	})

	it('should install subdependencies', function (done) {
		install(dir, {folder: 'node_modules'}).then(function(){
			exists(dir+'/node_modules/sliced').should.be.true
			require(dir).should.be.a('function')
			exec('node '+__dirname+'/npm/examples/basic', function(e, out, err){
				if (e) return done(e)
				out.toString().should.equal('up 3\ndown 1\n')
				done()
			})
		})
	})

	it('should optionally install devDependencies', function (done) {
		install({
			target: dir,
			priority: ['env.json', 'package.json', 'component.json'],
			folder: 'node_modules',
			dev: true
		}).then(function(){
			exists(dir+'/node_modules/sliced').should.be.true
			exists(dir+'/node_modules/mocha').should.be.true
			require(dir+'/node_modules/mocha').should.be.a('function')
		}).node(done)
	})
})

describe('modern-npm', function () {
	var dir = __dirname+'/modern-npm'
	afterEach(function (done) {
		rmdir(dir+'/node_modules', done)
	})

	it('should love it', function (done) {
		install(dir, {
			priority: ['package.json'],
			folder: 'node_modules'
		}).then(function(){
			exists(dir+'/node_modules/when').should.be.true
			exists(dir+'/node_modules/laissez-faire').should.be.true
			exists(dir+'/node_modules/find').should.be.true
			require(dir+'/async').should.be.a('function')
		}).node(done)
	})
})

describe('invalid npm deps', function () {
	var dir = __dirname+'/bad-npm/invalid-version'
	afterEach(function (done) {
		rmdir(dir+'/node_modules', done)
	})

	it('should error', function (done) {
		install(dir, {
			priority: ['package.json'],
			folder: 'node_modules'
		}).otherwise(function(e){
			e.should.be.an.instanceOf(Error)
			e.message.should.include('not in npm')
			done()
		})
	})
})
