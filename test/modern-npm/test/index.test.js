
var should = require('chai').should()
  , detect = require('..')
  , promise = require('laissez-faire')
  , series = require('../series')
  , async = require('../async')

function delay(fn){
	var args = Array.prototype.slice.call(arguments, 1)
	setTimeout(function () {
		fn.apply(null, args)
	}, Math.round(Math.random() * 10))
}

function dprom(val, method){
	var p = promise()
	setTimeout(function () {
		p[method || 'fulfill'](val)
	}, Math.round(Math.random() * 10))
	return p
}

describe('sync', function () {
	it('should return the first item that passes the test', function () {
		detect([1,2,3], function(item){
			return item == 2
		}).should.equal(2)
	})

	it('should return undefined otherwise', function () {
		should.not.exist(detect([1,2,3], function(item){
			return item == 4
		}))
	})
})

describe('async', function () {
	it('should resolve to the first passing item', function (done) {
		async([1,2,3], function(item, cb){
			delay(cb, item == 2)
		}).then(function(item){
			item.should.equal(2)
		}).node(done)
	})

	it('should reject if no input items available', function (done) {
		async([], function(){}).then(null, function(reason){
			reason.should.be.an.instanceOf(Error)
		}).node(done)
	})

	it('should reject if nothing passes', function (done) {
		async([1,2,3], function(_, cb){ 
			delay(cb, false) 
		}).then(null, function(reason){
			reason.should.be.an.instanceOf(Error)
		}).node(done)
	})

	it('should have an optional promise based API', function (done) {
		async([1,2,3], function(item){
			return dprom(item == 2)
		}).then(function(val){
			val.should.equal(2)
		}).node(done)
	})

	it('should handle immediate resolution', function (done) {
		async([1,2,3], function(item){
			if (item == 2) return promise().resolve(true)
			return dprom(false)
		}).then(function(val){
			val.should.equal(2)
		}).node(done)
	})

	it('should propagate rejection', function (done) {
		async([1,2,3], function(item){
			if (item == 2) return dprom(2, 'reject')
			return dprom(false)
		}).then(null, function(val){
			val.should.equal(2)
			done()
		})
	})
})

describe('series', function () {
	it('should return the first passing item by position', function (done) {
		series([1,2,3], function(item, cb){
			delay(cb, true)
		}).then(function(item){
			item.should.equal(1)
		}).node(done)
	})

	it.skip('should implement an optional promise API', function (done) {
		
	})
})
