EXPORT= graph
GRAPH= node_modules/.bin/sourcegraph.js src/index.js -p javascript,nodeish
BIGFILE= node_modules/.bin/bigfile.js -p javascript --export $(EXPORT)
REPORTER= spec

all: test/built.js test

browser: dist dist/graph.js
	@du -bah dist/*

dist:
	@mkdir -p dist

dist/%.js: dist
	@$(GRAPH) | $(BIGFILE) > $@

test:
	@node_modules/.bin/mocha test/*.test.js -R $(REPORTER)

clean:
	@rm -rf dist
	@rm -rf tests/built.js

test/built.js: src/* test/*
	@node_modules/.bin/sourcegraph.js test/browser.js \
		--plugins mocha,nodeish,javascript \
		| node_modules/.bin/bigfile.js \
		 	--export null \
		 	--plugins nodeish,javascript > $@

.PHONY: all test clean browser
