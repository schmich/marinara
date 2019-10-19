# Releasing

- Sync with origin: `git pull --ff-only`
- Bump `version` in `package/manifest.json`
- Run tests: `make test`
- Create package: `make release`
- Publish package at https://chrome.google.com/webstore/devconsole
  - Upload updated package
  - Update descriptions for each language: `make show-descriptions`
- Commit: `git commit -a`
- Tag release: `git tag -s xx -m "Release xx."`
- Push changes: `git push && git push --tags`
