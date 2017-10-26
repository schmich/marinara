require 'locales'
require 'json'
require 'set'

en_file = all_locales['en']
locale, to_file = choose_locale('Sync en messages into which locale?')

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
  puts 'Nothing to sync. Exiting.'
  exit
end

print "Do you want to sync en messages into #{locale} (y/n)? "
if gets.strip.downcase[0] != 'y'
  puts 'Canceled. Exiting.'
  exit
end

File.open(to_file, 'w') do |file|
  file.write(JSON.pretty_generate(en))
end

puts "Updated #{locale} at #{to_file}.\nUntranslated messages will be marked FIXME."
