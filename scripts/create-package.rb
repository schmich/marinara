require 'json'
require 'zip'
require 'set'

this_dir = File.expand_path(File.dirname(__FILE__))
package_dir = File.expand_path(File.join(this_dir, '..', 'package'))

# Ensure the files we're about to package match the predefined manifest.
# If a file is added or removed, package-manifest.json must be updated.
expected_files = Set.new(JSON.parse(File.read(File.join(this_dir, 'package-manifest.json'))))
actual_files = Set.new(Dir[File.join(package_dir, '**/*')].select { |f| File.file?(f) }.map { |f| f.sub(package_dir + '/', '') })

unexpected_files = actual_files - expected_files
missing_files = expected_files - actual_files

if unexpected_files.any?
  puts "Unexpected files in package: #{unexpected_files.to_a.join(', ')}"
  exit 1
elsif missing_files.any?
  puts "Files missing from package: #{missing_files.to_a.join(', ')}"
  exit 1
end

version = JSON.load(File.read(File.join(package_dir, 'manifest.json')))['version']
out = "marinara-#{version}.zip"

if File.exist?(out)
  puts "#{out} already exists."
  exit 1
end

Zip::File::open(out, 'w') do |zip|
  Dir[File.join(package_dir, '**/*')].each do |path|
    zip.add(path.sub(package_dir + '/', ''), path)
  end
end

puts "Package created: #{out}."
