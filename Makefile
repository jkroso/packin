REPORTER=dot

test:
	@node_modules/.bin/mocha test/*.test.js \
		--reporter $(REPORTER) \
		--bail \
		--timeout 5s \
		--slow 3s

.PHONY: test
