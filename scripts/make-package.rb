require 'json'
require 'zip/zip'

unversioned = `git ls-files -o src`.strip
if !unversioned.empty?
  puts "Error: Unversioned files in tree, exiting.\n#{unversioned}"
  exit 1
end

version = JSON.load(File.read('src/manifest.json'))['version']
out = "marinara-#{version}.zip"

if File.exist?(out)
  puts "#{out} already exists."
  exit 1
end

Zip::ZipFile::open(out, 'w') do |zip|
  Dir['src/**/*'].each do |path|
    zip.add(path.sub(/^src\//, ''), path)
  end
end

puts "Package created: #{out}."
