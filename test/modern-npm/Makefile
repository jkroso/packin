EXPORT= detect
GRAPH= node_modules/.bin/sourcegraph.js index.js -p javascript,nodeish
BIGFILE= node_modules/.bin/bigfile.js -x $(EXPORT) -p javascript,nodeish
REPORTER= spec
SRC = index.js sync.js series.js

all: test/built.js browser

browser: dist dist/detect.js
	@du -ah dist/*

dist:
	@mkdir -p dist

dist/detect.js: dist
	@$(GRAPH) | $(BIGFILE) > $@

test:
	@node_modules/.bin/mocha test/*.test.js \
		--bail \
		-R $(REPORTER)

clean:
	@rm -rf dist
	@rm -rf test/built.js

test/built.js: $(SRC) test/*
	@node_modules/.bin/sourcegraph.js test/browser.js \
		--plugins mocha,nodeish,javascript \
		| node_modules/.bin/bigfile.js \
			--export null \
			--plugins nodeish,javascript > $@

.PHONY: all test clean browser
