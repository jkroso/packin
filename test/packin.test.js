
var exec = require('child_process').exec
var equal = require('fs-equals/assert')
var Package = require('../src/package')
var log = require('../src/logger')
var chai = require('./chai')
var install = require('..')
var path = require('path')
var zlib = require('zlib')
var fs = require('fs')
var exists = fs.existsSync
var readLink = fs.readlinkSync

require('express')()
  // .use(require('express').logger('dev'))
  .get('/:package/:version', function(req, res){
    var version = req.params.version
    var pkg = req.params.package
    var dir = path.join(__dirname, 'packages', pkg, version)
    var out = zlib.createGzip()
    out.pipe(res)
    exec('tar -c ' + dir, function(e, tar, stderr){
      if (e) return res.send(500, stderr)
      res.status(200)
      res.set('content-encoding', 'gzip')
      out.end(tar)
    })
  })
  .listen(3000)
  .on('error', function(e){ console.error(e.stack) })

// log.enable('debug')

var cache = process.env.HOME + '/.packin/-'

var filterOpts = {
  name: function(name){
    return !(/deps|node_modules/).test(name)
  }
}

function rmdir(dir, cb){
  exec('rm -rf ' + dir, cb)
}

beforeEach(function(done){
  rmdir(cache + '/localhost:3000', done)
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
      fs.unlinkSync(dir + '/deps/equals')
      fs.symlinkSync('/some/no/good/path.coffee', dir + '/deps/equals')
      return install(dir).then(function(){
        fs.readlinkSync(dir + '/deps/equals').should.not.include('no/good')
      })
    }).node(done)
  })

  it('should return the top level Package', function(done){
    install(dir).read(function(pkg){
      pkg.should.be.an.instanceOf(require('../src/package'))
      pkg.dependencies.value.should.include.keys('equals', 'type')
      rmdir(dir + '/deps', done)
    })
  })

  it('should pick the meta data file with the most data', function(done){
    var dir = __dirname + '/priority'
    install(dir).read(function(log){
      exists(dir + '/deps/mocha').should.be.true
      exists(dir + '/deps/mocha/deps/equals').should.be.true
      exists(dir + '/deps/mocha/deps/type').should.be.true
      rmdir(dir + '/deps', done)
    })
  })

  it('should link local packages', function(done){
    var dir = __dirname + '/local-packages'
    install(dir).read(function(log){
      var files = fs.readdirSync(dir + '/deps')
      files.should.include('equals')
      files.should.include('type')
      files.should.include('local')
      rmdir(dir + '/deps', done)
    })
  })

  it('should handle cyclic dependency graphs', function(done){
    var dir = __dirname + '/cyclic'
    install(dir).read(function(pkg){
      fs.readdirSync(dir + '/deps').should.eql(['a'])
      fs.readdirSync(dir + '/deps/a/deps').should.eql(['b'])
      fs.readdirSync(dir + '/deps/a/deps/b/deps').should.eql(['a'])
      rmdir(dir + '/deps', done)
    }, done)
  })
})

describe('cleanup', function(){
  // localhost install directory
  var lh = cache + '/localhost:3000'
  var dir = __dirname+'/error'
  after(function(done){
    rmdir(__dirname+'/error/deps', done)
  })

  after(function(done){
    rmdir(__dirname+'/simple/deps', done)
  })

  it('should remove all new dependencies', function(done){
    install(__dirname+'/simple').then(function(logA){
      exists(lh + '/equals/master').should.be.true
      exists(lh + '/type/master').should.be.true
      exists(lh + '/failing/master').should.be.false
      return install(dir).then(null, function(e){
        expect(e).to.be.an.instanceOf(Error)
        exists(lh + '/equals/master').should.be.true
        exists(lh + '/type/master').should.be.true
        exists(lh + '/fail/master').should.be.false
        exists(lh + '/failing/master').should.be.false
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
      exists(dir + '/deps/equals').should.be.true
      exists(dir + '/deps/type').should.be.true
    }).node(done)
  })

  it('should respect priority', function(done){
    install(dir, {
      files: ['deps.json', 'package.json']
    }).then(function(log){
      exists(dir + '/deps/equals').should.be.true
      exists(dir + '/deps/type').should.be.true
      readLink(dir + '/deps/equals').should.not.equal(dir + '/deps/type')
    }).node(done)
  })
})

describe('custom install folders', function(){
  afterEach(function(done){
    rmdir(__dirname+'/simple/node_modules', done)
  })

  it('should work', function(done){
    install(__dirname + '/simple', {folder: 'node_modules'}).then(function(){
      return equal(
        __dirname + '/simple/node_modules/equals',
        __dirname + '/packages/equals/master',
        filterOpts
      ).then(function(){
        return equal(
          __dirname + '/simple/node_modules/equals/node_modules/type',
          __dirname + '/packages/type/master',
          filterOpts)
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
    install(dir, {
      folder: 'node_modules',
      files: ['component.json']
    }).read(function(){
      exists(dir + '/node_modules/toposort').should.be.true
      require(dir).should.be.a('function')
      exec('node '+__dirname+'/component/examples/basic', function(e, out, err){
        if (e) return done(e)
        String(out).should.equal('2!\n')
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
    }).read(function(){
      exists(dir + '/node_modules/sliced').should.be.true
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
      exists(dir + '/node_modules/sliced').should.be.true
      exists(dir + '/node_modules/mocha').should.be.true
      require(dir + '/node_modules/mocha').should.be.a('function')
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
    rmdir(dir + '/node_modules', done)
  })

  it('should love it', function(done){
    install(dir, {
      files: ['package.json'],
      folder: 'node_modules',
      production: true
    }).then(function(){
      require(dir + '/node_modules/lift-result/package').should.have.property('version', '0.1.3')
      require(dir + '/node_modules/laissez-faire/package').should.have.property('version', "0.4.4")
      exists(dir + '/node_modules/find').should.be.true
      exists(dir + '/node_modules/readable-stream').should.be.true
      require(dir + '/series').should.be.a('function')
    }).node(done)
  })
})

describe('npm errors', function(){
  var dir
  var opts = {
    files: ['package.json'],
    folder: 'node_modules',
    production: true
  }
  afterEach(function(done){
    rmdir(dir + '/node_modules', done)
  })
  this.timeout(false)

  describe('invalid npm deps', function(){
    before(function(){
      dir = __dirname+'/bad-npm/invalid-version'
    })

    it('should error', function(done){
      install(dir, opts).read(null, function(e){
        e.should.be.an.instanceOf(Error)
        e.message.should.include('Not Found')
        done()
      })
    })
  })

  describe('invalid formatting', function(){
    before(function(){
      dir = __dirname+'/bad-npm/misformating'
    })

    it('should error', function(done){
      install(dir, opts).read(null, function(e){
        e.should.be.an.instanceOf(Error)
        done()
      })
    })
  })
})

describe('copy', function(){
  after(function(done){
    rmdir(__dirname + '/simple/node_modules', done)
  })

  it('should copy deps rather than symlink', function(done){
    install(__dirname + '/simple', {
      folder: 'node_modules',
      copy: true,
    }).then(function(){
      var file = require.resolve('./simple')
      delete require.cache[file]
      require(file)({},{}).should.be.true
      var s = fs.lstatSync(__dirname + '/simple/node_modules/equals')
      s.isSymbolicLink().should.be.false
    }).node(done)
  })
})

describe('install(url, to, opts)', function(){
  var pkg = 'http://localhost:3000/equals/master'
  var dir = __dirname + '/equals'
  afterEach(function(done){
    exec('rm '+dir, done)
  })

  it('should install `url` to `to`', function(done){
    install(pkg, dir, {production: true}).then(function(){
      return equal(
        __dirname+'/equals',
        __dirname+'/packages/equals/master',
        filterOpts)
    }).node(done)
  })
})
