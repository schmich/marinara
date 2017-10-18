require 'json'
require 'set'

en = File.read('src/_locales/en/messages.json')
names = en.scan(/^  \"(.*?)\":/m).flatten

unique = Set.new
duplicates = Set.new
names.each do |name|
  if !unique.add?(name)
    duplicates.add(name)
  end
end

if duplicates.any?
  puts "Found duplicate message names:\n" + duplicates.to_a.map { |n| "\t#{n}" }.join("\n")
else
  puts 'OK.'
end
