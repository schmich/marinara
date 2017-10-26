# Create Chrome extension package (.zip).
package:
	ruby -Iscripts scripts/make-package.rb

# Run Chrome under a different locale.
run-loc:
	ruby -Iscripts scripts/run-localized.rb

# Run Chrome with psuedo-localized messages.
run-pseudo:
	ruby -Iscripts scripts/run-pseudo-localized.rb

# Sanity check all messages.json files.
validate-messages:
	ruby -Iscripts scripts/validate-messages.rb

# Sycn en messages into another locale.
sync-locale:
	ruby -Iscripts scripts/sync-locale.rb
