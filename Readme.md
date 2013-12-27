
# packin

  All you need a package manager to do is download your dependencies and stick them in a folder. Packin does just this and understands several meta data formats including [package.json](https://npmjs.org) and [component.json](https://github.com/component/component) so you can consume a wider selection of dependencies.

Here is a few interesting design decisions:

+ Everything symlinked  
  Symlinks carry semantic value which other tools can leverage. It also means you don't end up copying dependencies all over your file system.
+ Caching  
  Once a package is installed it never needs to be installed again. This makes it super fast and can help you work offline.

## Installation

_With npm_  

    $ npm install packin --global

## API

Packin provides an [executable](bin/packin) designed primarily to be used via [make](//github.com/jkroso/move/blob/master/Makefile) but also provides a few nice commands to help you _manage_ your dependencies.

## `packin-add deps... [-d]`

The add command helps you add dependencies to you `./deps.json` file. It takes a list of dependencies in their shorthand form. If the dependecy is just a plain word it is assumed to come from [npm.org](http://npm.org). If it has one slash its assumed to come from [github](//github.com). If it starts with a `.` or a `/` then its assumed to be in the local filesystem. All three cases are demonstrated below:

![animation](images/packin-add.gif)

## `packin-install [-tpdmfRc]`

The install command will recursively walk through all dependencies downloading them if necessary as it goes then add symlinks between all of them under the alias each package expects. Thats right __you__ get to deside the names of the packages you consume __not__ the person who wrote it. Also dependency cycles are fine unlike with `npm-install(1)`. A further difference from `npm-install(1)` is that it does have some important configuration options so if you project depends on `packin-install(1)` and is going to be published you should document your configuration in a Makefile.

![animation](images/packin-install.gif)

Notice how the second call returns almost immediatly. This is thanks to packins caching mechanism. Also this cache is global, so the first time install of your projects gets __faster__ the more projects you have previously installed with packin.

## `packin-update`

Iterate through each dependency and query their respective registries for the latest release tag. If the latest one is different from the current one the dep is swapped for the new one.

![animation](images/packin-update.gif)

## `packin-rm deps... [-d]`

This is the undo for `packin-add`

![animation](images/packin-rm.gif)

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
}); // => Promise<Package>
```

The returned `Package` gives you access to your whole dependency graph.