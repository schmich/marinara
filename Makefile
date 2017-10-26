version := $(shell git tag | tail -n1)

# Create extension packages (.zip).
package: package-chrome package-firefox

# Chrome package.
package-chrome: marinara-chrome-$(version).zip

# Firefox package.
package-firefox: marinara-firefox-$(version).zip

marinara-chrome-$(version).zip: dev-chrome
	ruby -Iscripts scripts/make-package.rb $@

marinara-firefox-$(version).zip: dev-firefox
	ruby -Iscripts scripts/make-package.rb $@

# Update manifest.json for Chrome development.
dev-chrome: manifest/common.json manifest/chrome.json
	m4 -DVERSION="$(version)" $< | jq -s ".[0] * .[1]" - manifest/chrome.json > src/manifest.json

# Update manifest.json for Firefox development.
dev-firefox: manifest/common.json manifest/firefox.json
	m4 -DVERSION="$(version)" $< | jq -s ".[0] * .[1]" - manifest/firefox.json > src/manifest.json

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

# Sync en messages into another locale.
sync-locale:
	ruby -Iscripts scripts/sync-locale.rb
