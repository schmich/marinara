output = ARGV[0]
if output.nil?
  puts "Error: Output file name not specified."
  exit 1
end

unversioned = `git ls-files --others --exclude=src/manifest.json src`.strip
unless unversioned.empty?
  puts "Error: Unversioned files in tree, exiting.\n#{unversioned}"
  exit 1
end

`(cd src && zip -r - .) > #{output}`

puts "Package created: #{output}."
