
var chai = require('chai')

global.should = chai.should()
global.expect = chai.expect
// chai.use(require('chai-spies'))

chai.config.includeStack = true

module.exports = chai