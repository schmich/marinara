require 'json'
require 'set'

locales_dir = 'src/_locales'

locales = Dir["#{locales_dir}/*"]
  .select { |f| File.directory?(f) }
  .map { |d| d.split(/[\\\/]/).last }
  .select { |n| n != 'en' }

puts 'Merge en into which locale?'
locales.each_with_index do |locale, i|
  puts "#{i + 1}. #{locale}"
end

print '> '
locale = locales[gets.strip.to_i - 1]
puts
if locale.nil?
  puts 'Invalid choice. Exiting.'
  exit
end

en_file = File.join(locales_dir, 'en', 'messages.json')
to_file = File.join(locales_dir, locale, 'messages.json')

en = JSON.parse(File.read(en_file))
to = JSON.parse(File.read(to_file))

en_names = Set.new(en.keys)
to_names = Set.new(to.keys)

en.each do |name, info|
  to_info = to[name] || {}
  en[name]['message'] = to_info['message'] || 'FIXME'
end

removed = to_names - en_names
if removed.any?
  puts "These messages will be removed from #{locale}:\n" + removed.to_a.map { |name| "\t#{name}" }.join("\n")
  puts
end

added = en_names - to_names
if added.any?
  puts "These messages will be added to #{locale}:\n" + added.to_a.map { |name| "\t#{name}" }.join("\n")
  puts
end

if !removed.any? && !added.any?
  puts 'Nothing to merge. Exiting.'
  exit
end

print "Do you want to merge en into #{locale} (y/n)? "
if gets.strip.downcase[0] != 'y'
  puts 'Canceled. Exiting.'
  exit
end

File.open(to_file, 'w') do |file|
  file.write(JSON.pretty_generate(en))
end

puts "Merged en into #{locale} at #{to_file}.\nUntranslated messages will be marked FIXME."
