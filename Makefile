package:
	(cd src && zip -r - . -x Makefile -x '*.swp' -x '*.DS_Store') > marinara-`jq -r .version src/manifest.json`.zip
