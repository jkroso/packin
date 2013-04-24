EXPORT = equals
GRAPH = node_modules/.bin/sourcegraph.js index.js -p javascript,nodeish
BIGFILE = node_modules/.bin/bigfile -p nodeish,javascript --export $(EXPORT)

all: test/built.js dist/equals.js

browser: dist/equals.js

dist:
	@mkdir -p dist

dist/equals.js: dist index.js
	@$(GRAPH) | $(BIGFILE) > dist/equals.js

test:
	@node_modules/.bin/mocha -R spec test/*.test.js

test/built.js: index.js test/*
	@node_modules/.bin/sourcegraph.js test/browser.js \
		--plugins mocha,nodeish,javascript \
		| node_modules/.bin/bigfile.js \
			--export null \
			--plugins nodeish,javascript > $@

clean:
	@rm -rf dist test/built.js components build

.PHONY: all build test clean
