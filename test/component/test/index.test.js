
var should = require('chai').should()
  , graph = require('../src')

describe('graph', function () {
	it('should compile a graph with no input', function () {
		var inc = graph({
			a: function(b){
				return b + 1
			},
			b: function(){
				return 1
			}
		})
		inc().should.equal(2)
	})

	it('should compile a graph with one input', function () {
		var inc = graph({
			b: function(a){
				return a + 1
			},
			c: function(b){
				return b + '!'
			}
		})
		inc(1).should.equal('2!')
	})

	describe('with multiple input args', function () {
		it('should work', function () {
			var add = graph({
				c: function(a,b){
					return a + b
				}
			})
			add(1,2).should.equal(3)
		})

		it('should maintain order', function () {
			var divide = graph({
				c: function(a,b){
					return a / b
				}
			})
			divide(2,1).should.equal(2)
		})

		it('should maintain order when input split over several functions', function () {
			var inc_divide = graph({
				c: function(a, d){
					return d / a
				},
				d: function(b){
					return b + 1
				}
			})
			inc_divide(3,2).should.equal(1)
		})
	})

	describe('context', function () {
		it('`this` should be useful', function () {
			var obj = {
				inc: graph({
					result: function(by){
						return this.value + by
					}
				}),
				value: 1
			}
			obj.inc(5).should.equal(6)
		})
	})
})
