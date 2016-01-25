# packin

`packin` replaces `npm install`. It is way faster, way simpler, and it uses symlinks so you can edit local modules without having to reinstall them all the time. Presumably then npm stands for No-good Phucking Mess.

## Installation

1. Install [Julia](//github.com/JuliaLang/julia)
2. Install [Kip.jl](//github.com/jkroso/Kip.jl)
3. `echo '@require "github.com/jkroso/Jest.jl"' >> ~/.juliarc.jl`
4. `git clone https://github.com/jkroso/packin && make -C packin install`

Then to update it you just need to run `cd ./packin && git pull origin master`

## Usage

`packin` is designed as a drop in replacement for `npm install`. It takes no arguments and has no options.

I did a quick benchmark comparing the two on a project. Both times are with a "warm" cache. `packin` took 23 seconds and `npm install` took 1m 27s. And I could shave a good 10 seconds off `packin` just by precompiling the script. Some extra caching and improving the HTTP library could probably gain a few seconds too.

So `packin` is way faster but [there are already alternatives](//github.com/alexanderGugel/ied) that are pretty fast. The reason I wrote it though was to make working with local packages easier. So if you don't know the syntax for that take a look at [this](https://docs.npmjs.com/files/package.json#local-paths)

### Overwriting dependecies

If you have a dependency which depends on a buggy or in development package you can overwrite this package by adding a `.packinrc.jl` file to your project which looks like this:

```julia
spec_cache = Dict{Pair,Any}(
  ("mana" => "jkroso/mana") => "/Users/jkroso/projects/mana"
  ("babel-runtime" => "6") => "http://registry.npmjs.org/babel-runtime/-/babel-runtime-6.1.3.tgz"
)
```

Where the keys of `spec_cache` are `key => value` pairs like you would find in a `package.json` file and the values are the URI to the local folder or remote tarbal/git-repo
