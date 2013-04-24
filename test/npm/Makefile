EXPORT= action
GRAPH= node_modules/.bin/sourcegraph.js src/index.js -p javascript,nodeish
BIGFILE= node_modules/.bin/bigfile.js -x $(EXPORT) -p javascript,nodeish
REPORTER= spec

all: test/built.js browser

browser: dist dist/action.js
	@du -bah dist/*

dist:
	@mkdir -p dist

dist/action.js: dist
	@$(GRAPH) | $(BIGFILE) > $@

test:
	@node_modules/.bin/mocha test/*.test.js \
		-R $(REPORTER)

clean:
	@rm -rf dist
	@rm -rf test/built.js

test/built.js: src/* test/*
	@node_modules/.bin/sourcegraph.js test/browser.js \
		--plugins mocha,nodeish,javascript \
		| node_modules/.bin/bigfile.js \
			--export null \
			--plugins nodeish,javascript > $@

.PHONY: all test clean browser
