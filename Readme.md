
# packin

  All you need a package manager to do is download your dependencies and stick them in a folder. Packin does just this and understands several meta data formats including [package.json](https://npmjs.org) and [component.json](https://github.com/component/component) so you can consume a wider selection of dependencies.

Here is a few interesting design decisions:

+ Everything symlinked  
  Symlinks carry semantic value which other tools can leverage. It also means you don't end up copying dependencies all over your file system.
+ Caching  
  Once a package is installed it never needs to be installed again.

## Installation

_With npm_  

    $ npm install packin --global

## Programmatic API

### install(directory, [options])

  install all dependecies of `directory`

```js
var install = require('packin');
install(__dirname, {
  files: [
    'package.json', 
    'component.json', 
    'deps.json'
  ],                     // files to check for dependency data
  folder: 'node_modules' // install to __dirname/node_modules
  development: false,    // don't install development deps
  production: true,      // install production deps
  retrace: true          // update cached deps
}); // => Promise<log>
```

The returned log contains a dependency graph of all the install dependencies.

## CLI

    Usage: packin [options] [command]
    
    Commands:
    
      add [options] <key:url> add a package to this packages dependencies
      url <shorthand>        expand shorthand to a full url
      ls [options]           display this packages dependencies
      rm [options] <key>     remove a package from this packages dependencies
      install [options]      install this packages dependencies
      links                  list packages available for linking to
      link [options] [name]  link to a local package or register this one
      unlink [options] [name] unlink a local package or unregister this one
    
    Options:
    
      -h, --help     output usage information
      -V, --version  output the version number
      -v, --verbose  turn up the logging
