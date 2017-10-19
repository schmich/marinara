# Create Chrome extension package (.zip).
package:
	ruby scripts/make-package.rb

# Run Chrome under a different locale.
run-loc:
	ruby scripts/run-localized.rb

# Run Chrome with psuedo-localized messages.
run-pseudo:
	ruby scripts/run-pseudo-localized.rb

# Validate (sanity check) en localized messages.
validate-en:
	ruby scripts/validate-en-messages.rb

# Sycn en messages into another locale.
sync-locale:
	ruby scripts/sync-locale.rb
