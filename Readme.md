
# packin

  Its a simple package manager but by focusing on the consumption perspective of package management it is more effective, for me at least. From a comsumption perspective all package managers do is map names to urls and install those urls. Pretty simple and actually when you realise this is all a package installer needs to do you will realise there is no reason why packages published with one manager can't be consumed by another. Tools like [npm](https://npmjs.org) and [component](https://github.com/component/component) have plenty of features to help package producers but don't really have their consumption story well sorted. component expects full buy in and while npm is more general it wasn't really designed that way from the start and has many subtle bugs. Heres a list of reasons why I felt the need to create another package manager.

+ everything symlinked  
  symlinks carry semantic value which is valueable for things like build tools. Also this means you don't have copious copies of common dependencies copied through your projects. Also it gives you npm's dedupe feature for free.
+ less requests  
  code storage services like github and npm.org are immutable by default so there is no reason to ever invalidate your local cache.
+ real user defined names  
  if you add a dependency key to your meta file that key should be the same one you `require` in your code. Furthermore, choosing a different name should not affect the run time code loading cost. Thats why I say the symantic calue of symlinks is important. This is a problem [bower](https://github.com/twitter/bower) and modern features of npm suffer from.

And besides it was fun to write and only small (the core algorithm fits on one screen)

## Installation

_With npm_  

    $ npm install packin -g

## Usage

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

## Running the tests

```bash
$ npm install
$ node test/server & make test
```