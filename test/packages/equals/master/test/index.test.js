
var should = require('chai').should()
  , equal = require('..')

describe('Object strucures', function () {
	it('when structures match', function () {
		equal(
			{ a : [ 2, 3 ], b : [ 4 ] },
			{ a : [ 2, 3 ], b : [ 4 ] }
		).should.be.true
	})

   it('when structures don\'t match', function () {
		equal(
			{ x : 5, y : [6] },
			{ x : 5, y : 6 }
		).should.be.false
   })

   it('should handle nested nulls', function () {
   	equal([ null, null, null ], [ null, null, null ]).should.be.true
   	equal([ null, null, null ], [ null, 'null', null ]).should.be.false
   })

   it('should handle nested NaNs', function () {
   	equal([ NaN, NaN, NaN ], [ NaN, NaN, NaN ]).should.be.true
   	equal([ NaN, NaN, NaN ], [ NaN, 'NaN', NaN ]).should.be.false
   })
})

describe('Comparing arguments', function () {
	var a = (function a(a,b,c) {return arguments}(1,2,3))
	var b = (function b(a,b,c) {return arguments}(1,2,3))
	var c = (function c(a,b,c) {return arguments}(2,2,3))

	it('should not consider the callee', function () {
		equal(a,b).should.be.true
		equal(a,c).should.be.false
	})
	
	it('should be comparable to an Array', function () {
		equal(a,[1,2,3]).should.be.true
		equal(a,[1,2,4]).should.be.false
		equal(a,[1,2]).should.be.false
	})

	it.skip('should be comparable to an Object', function () {
		equal(a, {0:1,1:2,2:3,length:3}).should.be.true
		equal(a, {0:1,1:2,2:3,length:4}).should.be.false
		equal(a, {0:1,1:2,2:4,length:3}).should.be.false
		equal(a, {0:1,1:2,length:2}).should.be.false
	})
})

describe('export.object(a,b)', function () {
	it('should work just the same as equal for objects', function () {
		equal.object(
			{ a : [ 2, 3 ], b : [ 4 ] },
			{ a : [ 2, 3 ], b : [ 4 ] }
		).should.be.true
	})
	it.skip('should work when comparing with Arrays', function () {
		equal.object(
			{0:'first', 1: 'second', length:2},
			['first', 'second']
		).should.be.true
	})
})

describe('Numbers', function () {
	it('should not coerce strings', function () {
		equal('1', 1).should.equal(false)
	})
	it('-0 should equal +0', function () {
		equal(-0, +0).should.be.true
	})
	describe('NaN', function () {
		it('should equal Nan', function () {
			equal(NaN, NaN).should.be.true
		})
		it('NaN should not equal undefined', function () {
			equal(NaN, undefined).should.be.false
		})
		it('NaN should not equal null', function () {
			equal(NaN, null).should.be.false
		})
		it('NaN should not equal empty string', function () {
			equal(NaN, '').should.be.false
		})
		it('should not equal zero', function () {
			equal(NaN, 0).should.be.false
		})
	})
})

describe('Strings', function () {
	it('should be case sensitive', function () {
		equal('hi', 'Hi').should.equal(false)
		equal('hi', 'hi').should.equal(true)
	})

	it('empty string should equal empty string', function () {
		equal('', "").should.be.true
	})
})

describe('undefined', function () {
	it('should equal only itself', function () {
		equal(undefined, null).should.be.false
		equal(undefined, '').should.be.false
		equal(undefined, 0).should.be.false
		equal(undefined, []).should.be.false
		equal(undefined, undefined).should.be.true
		equal(undefined, NaN).should.be.false
	})
})

describe('null', function () {
	it('should equal only itself', function () {
		equal(null, undefined).should.be.false
		equal(null, '').should.be.false
		equal(null, 0).should.be.false
		equal(null, []).should.be.false
		equal(null, null).should.be.true
		equal(null, NaN).should.be.false
	})
})

describe('Cyclic structures', function () {
	it('should not go into an infinite loop', function () {
		var a = {}
		var b = {}
		a.self = a
		b.self = b
		equal(a, b).should.equal(true)
	})
})

describe('functions', function () {
	it('should fail if they have different names', function () {
		equal(function a() {}, function b() {}).should.be.false
	})

	it('should pass if they are both anonamous', function () {
		equal(function () {}, function () {}).should.be.true
	})

	it.skip('handle the case where they have different argument names', function () {
		equal(function (b) {return b}, function (a) {return a}).should.be.true
	})

	it('should compare them as objects', function () {
		var a = function () {}
		var b = function () {}
		a.title = 'sometitle'
		equal(a, b).should.be.false
	})

	it('should compare their prototypes', function () {
		var a = function () {}
		var b = function () {}
		a.prototype.a = 1
		equal(a,b).should.be.false
	})

	it('should be able to compare object methods', function () {
		equal(
			{noop: function () {}},
			{noop: function () {}}
		).should.be.true
		equal(
			{noop: function (a) {}},
			{noop: function () {}}
		).should.be.false
	})
})

describe('many arguments', function () {
	it('should handle no values', function () {
		equal().should.be.true
	})

	it('should handle one value', function () {
		equal({}).should.be.true
	})

	it('should handle many values', function () {
		var vals = []
		for (var i = 0; i < 1000; i++) {
			vals.push({1:'I', 2:'am', 3:'equal'})
		}
		equal.apply(null, vals).should.be.true
	})

	it('should handle an odd number of values', function () {
		equal([1], {}, {}).should.be.false
	})
})

// Don't run these in the browser
if (typeof Buffer != 'undefined') {
	describe.skip('Buffer', function () {
		it('should compare on content', function () {
			equal(new Buffer('abc'), new Buffer('abc')).should.be.true
			equal(new Buffer('a'), new Buffer('b')).should.be.false
			equal(new Buffer('a'), new Buffer('ab')).should.be.false
		})

		it('should fail against anything other than a buffer', function () {
			equal(new Buffer('abc'), [97,98,99]).should.be.false
			equal(new Buffer('abc'), {0:97,1:98,2:99,length:3}).should.be.false
			equal([97,98,99], new Buffer('abc')).should.be.false
			equal({0:97,1:98,2:99,length:3}, new Buffer('abc')).should.be.false
		})
	})
}

describe.skip('configurable property exclusion', function () {
	it('should ignore properties that match the given regex', function () {
		var eq = equal.custom(/^_/)
		eq({_b:2}, {_b:3}).should.be.true
	})

	it('should default to not excluding any properties', function () {
		var eq = equal.custom()
		eq({a:1},{a:1}).should.be.true
		eq({"":1},{}).should.be.false
		eq({a:1},{}).should.be.false
		eq({b:1},{}).should.be.false
		eq({"!":1},{}).should.be.false
		eq({"~":1},{}).should.be.false
		eq({"#":1},{}).should.be.false
		eq({"$":1},{}).should.be.false
		eq({"%":1},{}).should.be.false
		eq({"^":1},{}).should.be.false
		eq({"&":1},{}).should.be.false
		eq({"*":1},{}).should.be.false
		eq({"(":1},{}).should.be.false
		eq({")":1},{}).should.be.false
		eq({"-":1},{}).should.be.false
		eq({"+":1},{}).should.be.false
		eq({"=":1},{}).should.be.false
	})
})

describe('possible regressions', function () {
	it('should handle objects with no constructor property', function () {
		var a = Object.create(null)
		equal(a, {}).should.be.true
		equal({}, a).should.be.true
		equal(a, {a:1}).should.be.false
		equal({a:1}, a).should.be.false
	})

	it('when comparing primitives to composites', function () {
		equal({}, undefined).should.be.false
		equal(undefined, {}).should.be.false

		equal(new String, {}).should.be.false
		equal({}, new String).should.be.false

		equal({}, new Number).should.be.false
		equal(new Number, {}).should.be.false

		equal(new Boolean, {}).should.be.false
		equal({}, new Boolean).should.be.false

		equal(new Date, {}).should.be.false
		equal({}, new Date).should.be.false

		equal(new RegExp, {}).should.be.false
		equal({}, new RegExp).should.be.false
	})
})