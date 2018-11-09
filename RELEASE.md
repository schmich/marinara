# Releasing

- Bump `version` in `src/manifest.json`
- Commit: `git commit -a`
- Create package: `make package`
- Tag release: `git tag -s x.y.z -m 'Release x.y.z.'`
- Push changes: `git push && git push --tags`
- Publish package at https://chrome.google.com/webstore/devconsole
  - Upload updated package
  - Update descriptions for each language
