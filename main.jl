@require "github.com/jkroso/parse-json@4d9f46b" parse => parseJSON
@require "github.com/coiljl/URI@f8831bc" encode encode_component
@require "github.com/JuliaWeb/Requests.jl@9797063" => Requests

# Some packages don't declare all their dependencies
const known_fuckups = Dict(
  "pg-cursor" => Dict("pg" => "latest"),
  "pg-then" => Dict("pg" => "latest"))

function install(dir::AbstractString, progress, spec_cache=Dict(), uri_cache=Dict(); development=false)
  haskey(uri_cache, dir) && return nothing
  uri_cache[dir] = dir
  progress.pending += 1

  json = open(parseJSON, joinpath(dir, "package.json"))
  dependencies = merge(get(json, "dependencies", Dict()),
                       get(json, "peerDependencies", Dict()))
  development && merge!(dependencies, get(json, "devDependencies", Dict()))
  haskey(known_fuckups, json["name"]) && merge!(dependencies, known_fuckups[json["name"]])

  @sync for spec in dependencies
    @async begin
      uri = need(resolve_spec(spec, dir, spec_cache))
      path = need(isabspath(uri) ? uri : download(uri, uri_cache))
      install(path, progress, spec_cache, uri_cache)
      linkpackage(dir, path)
    end
  end

  # unofficially its possible for modules to depend on themselves.
  # Some numskulls take advantage of this (babel-runtime) so we need
  # to replicate that feature
  link = joinpath(dir, "node_modules", json["name"])
  mkpath(dirname(link))
  islink(link) || symlink(dir, link)

  run_install_script(json, dir)
  progress.pending -= 1
end

function resolve_spec(spec, dir, cache)
  haskey(cache, spec) && return cache[spec]
  cache[spec] = @schedule(ismatch(r"^file:", spec[2])
                            ? joinpath(dir, spec[2][6:end])
                            : toURL(spec...))
end

need(value) = value
need(t::Task) = wait(t)

# spec at docs.npmjs.com/misc/scripts
# TODO: support config
function run_install_script(json, dir)
  scripts = get(json, "scripts", nothing)
  isa(scripts, Associative) || return nothing
  hook = get(scripts, "install", (ispath(joinpath(dir, "binding.gyp"))
                                    ? "node-gyp rebuild"
                                    : ""))
  hook == "" && return nothing
  PATH = ENV["PATH"] * ":" * joinpath(dir, "node_modules", ".bin")
  env = Dict("PATH" => PATH,
             "npm_package_name" => json["name"],
             "npm_package_version" => json["version"],
             "npm_lifecycle_event" => "install")
  cmd = setenv(@eval(@cmd $hook), merge(ENV, env))
  cd(()-> run(pipeline(cmd, stderr=DevNull, stdout=DevNull)), dir)
end

function linkpackage(from, to)
  json = open(parseJSON, joinpath(to, "package.json"))
  path = joinpath(from, "node_modules", json["name"])
  mkpath(dirname(path))
  islink(path) && rm(path)
  ispath(path) || symlink(to, path)
  # add its binaries to $from/node_modules/.bin
  for (name, script) in getbin(json, to)
    name = joinpath(from, "node_modules", ".bin", name)
    islink(name) && continue
    mkpath(dirname(name))
    symlink(joinpath(to, script), name)
  end
end

# spec at docs.npmjs.com/files/package.json#bin
function getbin(json, dir)
  if haskey(json, "bin")
    (isa(json["bin"], AbstractString)
      ? Dict(json["name"] => json["bin"])
      : json["bin"])
  else
    directories = get(json, "directories", Dict())
    name = get(directories, "bin", nothing)
    name == nothing && return Dict()
    foldl(Dict(), readdir(joinpath(dir, name))) do dict,filename
      push!(dict, filename => joinpath(dir, name, filename))
    end
  end
end

function download(url, cache)
  haskey(cache, url) && return cache[url]
  cache[url] = @schedule begin
    path = joinpath(tempdir(), replace(url, r"^.*://", ""))
    if !ispath(path)
      if ismatch(r"^git(?:\+ssh|https?)?://", url)
        m = match(r"#([^/]+)$", url)
        branch = "master"
        if m != nothing
          branch = m[1]
          url = url[1:m.offset - 1]
        end
        run(pipeline(`git clone $url $path --depth 1 --branch $branch`, stderr=DevNull))
      else
        data = GET(url)
        mkpath(path)
        stdin, proc = open(`tar --strip-components 1 -xmpf - -C $path`, "w")
        write(stdin, data)
        close(stdin)
        wait(proc)
      end
    end
    path
  end
end

const gh_shorthand = r"^([^/]+/[^#/]+)(?:#(.+))?$"
const npm_scoped = r"^@([^/]+)/(.+)$"
const full_url = r"^\w+://"

function toURL(name, spec)
  if spec == "latest" || spec == "" spec = "*" end

  if ismatch(full_url, spec)
    return spec
  end

  if ismatch(gh_shorthand, spec)
    name,tag = match(gh_shorthand, spec).captures
    if tag == nothing; tag = latest_gh_commit(name) end
    return "https://codeload.github.com/$name/legacy.tar.gz/$tag"
  end

  if ismatch(npm_scoped, name)
    name = replace(name, r"/", "%2f")
    spec = encode_component(spec)
  end

  parseJSON(GET("http://registry.npmjs.com/$name/$spec"))["dist"]["tarball"]
end

const headers = Dict(
  "Authorization" => "Basic $(base64encode(ENV["GITHUB_USERNAME"] * ":" * ENV["GITHUB_PASSWORD"]))")

function latest_gh_commit(name)
  head = GET("https://api.github.com/repos/$name/git/refs/heads/master", meta=headers)
  parseJSON(head)["object"]["sha"]
end

function GET(url; meta=Dict())
  response = Requests.get(encode(url); headers=meta)
  if response.status >= 400
    error("status $(response.status) for $(encode(url))")
  else
    response.data
  end
end
