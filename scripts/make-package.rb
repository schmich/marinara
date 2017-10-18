unversioned = `git ls-files -o src`.strip
if !unversioned.empty?
  puts "Error: Unversioned files in tree, exiting.\n#{unversioned}"
  exit 1
end

version = `jq -r .version src/manifest.json`.strip
if version.empty?
  puts 'Error: Package version not found in manifest.json, exiting.'
  exit 1
end

`(cd src && zip -r - . -x '*.swp' -x '*.DS_Store') > marinara-#{version}.zip`
