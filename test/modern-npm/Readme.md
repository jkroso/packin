
# detect

  find the first item within an array that passes a predicate test. (async, sync, or series)

## Getting Started

_With component_  

	$ component install jkroso/detect

_With npm_  

	$ npm install jkroso/detect --save

then in your app:

```js
var detect = require('detect')
// optional variations
detect.sync = require('detect/sync')
detect.series = require('detect/series')
```

## API

- [detect()](#detectarrayarraypredfunction)

### detect(array:Array, pred:Function)

  find the first item that passes the `pred` test

## Running the tests

```bash
$ npm install
$ make
```
Then open your browser to the `./test` directory.

_Note: these commands don't work on windows._ 

## License 

[MIT](License)