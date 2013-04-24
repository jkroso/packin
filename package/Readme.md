
# when-all

  normalize an object/array where some values might be boxed within a promise

## Getting Started

_With component_  

    $ component install jkroso/when-all

_With npm_  

    $ npm install --save when-all

then in your app:

```js
var all = require('when-all')
```

## API

  - [all()](#all)

### all(x)

  Create a Promsie for a new `x` with all values lifted out of their promise proxies 
  
```js
all([
  getPage('google.com'),
  getPage('google.co.nz')
]).then(compare)
```

```js
all({
  usa: getPage('google.com'),
  nz: getPage('google.co.nz')
}).then(compare)
```

The functions this module uses to handle objects and arrays are actually implemented differently and you can also access the specific handlers with `require('when-all/{type}')`. I recommend you do this whenever possible to avoid unnecessary duck typing.

## Example

You could decorate a function so it can optionally take promised values as arguments.

```js
var all = require('when-all/array')

function decorate(fn) {
  return function(){
    var self = this
    return all(arguments).then(function(args){
      return fn.apply(self, args)
    })
  }
}

var asyncCompare = decorate(compare)
asyncCompare(
  getPage('google.com'),
  getPage('google.co.nz')
)
```

## Running the tests

```bash
$ npm install
$ make
```
Then open your browser to the `./test` directory.

_Note: these commands don't work on windows._ 

## License 

[MIT](License)