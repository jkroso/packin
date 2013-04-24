
# equals

  compare values of any complexity for equivalence

## Getting Started

_With component_  

	$ component install jkroso/equals

_With npm_  

	$ npm install jkroso/equals --save

then in your app:

```js
var equals = require('equals')
```

## API

  - [equals()](#equals)

### equals(...)

equals takes as many arguments as you like of any type you like and returns a boolean result. Primitive types are equal if they are equal. While composite types, i.e. Objects and Arrays, are considered equal if they have both the same structure and the same content. Specifically that means the same set of keys each pointing to the same values. Composite structures can be as big as you like and and circular references are perfectly safe.

Same structure:
```js
equals(
  { a : [ 2, 3 ], b : [ 4 ] },
  { a : [ 2, 3 ], b : [ 4 ] }
) // => true
```

Different Structure:
```js
equals(
  { x : 5, y : [6] },
  { x : 5}
) // => false
```

Same structure, different values:

```js
equal(
  { a: [ 1, 2 ], b : [ 4 ]},
  { a: [ 2, 3 ], b : [ 4 ]}
) // => false
```
  
Primitives:

```js
equal(new Date(0), new Date(0), new Date(1)) // => false
```
    
Some possible gotchas:
- `null` __is not__ equal to `undefined`.
- `NaN` __is__ equal to `NaN` (normally not the case).  
- `-0` __is__ equal to `+0`.
- Strings will __not__ coerce to numbers.
- Non enumerable properties will not be checked. They can't be.
- `arguments.callee` is not considered when comparing arguments

## Running the tests

```bash
$ npm install
$ make
```
Then open your browser to the `./test` directory.

_Note: these commands don't work on windows._ 

## License 

[MIT](License)