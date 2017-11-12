# Create Chrome extension package (.zip).
package: validate-messages
	ruby -Iscripts scripts/make-package.rb

# Run Chrome with a new (temporary) user profile with Marinara loaded.
run:
	ruby -Iscripts scripts/run.rb

# Run Chrome under a different locale.
run-loc:
	ruby -Iscripts scripts/run-localized.rb

# Run Chrome with psuedo-localized messages.
run-pseudo:
	ruby -Iscripts scripts/run-pseudo-localized.rb

# Sanity check all messages.json files.
validate-messages:
	ruby -Iscripts scripts/validate-messages.rb
