REPORTER=dot

test:
	@node_modules/.bin/mocha test/*.test.js \
		--reporter $(REPORTER) \
		--bail \
		--timeout 15s \
		--slow 3s

clean:
	rm -rf test/npm/node_modules
	rm -rf test/component/node_modules

.PHONY: all test
