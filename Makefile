.PHONY: dev

# Run development environment.
dev:
	npm run dev

.PHONY: release package

# Create Chrome extension package (.zip).
release: production
	ruby -Iscripts scripts/create-package.rb

production: messages
	npm run build

.PHONY: messages validate-messages

# Create Messages.js.
messages: validate-messages src/Messages.js

# Sanity check all messages.json files.
validate-messages:
	ruby -Iscripts scripts/validate-messages.rb

# JS bindings for messages in messages.json.
src/Messages.js: package/_locales/en/messages.json
	ruby -Iscripts scripts/create-messages.rb "$<" > "$@"

.PHONY: test

# Run tests.
test:
	npm run test:unit

.PHONY: run run-loc run-pseudo show-descriptions

# Run Chrome with a new (temporary) user profile with Marinara loaded.
run:
	ruby -Iscripts scripts/run.rb

# Run Chrome under a different locale.
run-loc:
	ruby -Iscripts scripts/run-localized.rb

# Run Chrome with psuedo-localized messages.
run-pseudo:
	ruby -Iscripts scripts/run-pseudo-localized.rb

# Show and copy descriptions for Chrome Web Store.
show-descriptions:
	ruby -Iscripts scripts/show-descriptions.rb
