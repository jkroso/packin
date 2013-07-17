REPORTER=dot

test: node_modules
	@node_modules/.bin/mocha test/*.test.js \
		--reporter $(REPORTER) \
		--bail \
		--timeout 5s \
		--slow 3s

node_modules: package.json
	@npm install
	@touch node_modules

clean:
	rm -r node_modules

.PHONY: test clean
