var mocha = require('mocha')

mocha.setup('bdd')

require('./index.test.js')

mocha.run(function () {
	console.log('Done!')
})
