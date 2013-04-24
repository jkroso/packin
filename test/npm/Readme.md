
# action

  dynamically composable functions

## Getting Started

_With component_  

	$ component install jkroso/action

_With npm_  

	$ npm install jkroso/action --save

then in your app:

```js
var action = require('action')
```

## API

- [action()](#action)

### action()

```js
var a = action(function(){
	// do stuff
	// then send it out
	this.stdout(result)
})
var b = action()
// connect to another action
a.then('stdout=>stdin', b)
```

## Why
Because I'm sick of creating everything out of functions. Functions compose well and perform well but the fact that they hide their internals offers no benefit 99.9% of the time. When you compose functions you are forming a process tree of sorts. Each function you call from another function can be thought of as a child process. However, the trees you form are not available at run-time. You can set break points and step through your code to verify the shape is as you intended but you can't simply inspect it from the top the way you would a chunk of data. The only benefit hiding internals offers is security but you only need to hide everything once to get that.

This is an experiment to see what it might be like to program without hiding anything. I want to try replacing "black boxes" with "White boxes". If your program is run time inspect-able it will be easier to:

+ debug  
its easier just to take a look at the shape than walk through it with a debugger ticking potential problems off one at a time.

+ test  
you can reach in and grab a child process and test that. Your not limited to just testing the top level API.

+ understand  
The style of programming I have in mind might mean the static representation of your program suffers a little but you will at least _have_ a run-time representation. This representation will enable many developer tools not feasible to run over static code.

+ change  
if your program is represented using ordinary data you can use your ordinary tricks on your program. This is what makes lisp powerful.

## What
What I have come up with is pretty much just streams minus back pressure management and plus more powerful connections between streams. My main areas of concern are error handling.

## Stability

Experimental: Expect the unexpected. Please provide feedback on api and your use-case.

## Running the tests

```bash
$ npm install
$ make
```
Then open your browser to the `./test` directory.

_Note: these commands don't work on windows._ 

## License 

[MIT](License)