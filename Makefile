# Create Chrome extension package (.zip).
package:
	ruby scripts/make-package.rb

# Run Chrome with psuedo-localized messages.
loc:
	ruby scripts/run-pseudo-localized.rb
