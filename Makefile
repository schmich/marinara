# Create Chrome extension package (.zip).
package:
	ruby scripts/make-package.rb

# Run Chrome with psuedo-localized messages.
run-loc:
	ruby scripts/run-pseudo-localized.rb

# Validate (sanity check) en localized messages.
validate-en:
	ruby scripts/validate-en-messages.rb

# Merge en messages into another locale.
merge-locale:
	ruby scripts/merge-locale.rb
