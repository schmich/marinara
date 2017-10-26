require 'locales'
require 'json'
require 'set'

def validate(id, file)
  print "#{id}: "

  content = File.read(file)
  begin
    JSON.parse(content)
  rescue => e
    puts "invalid JSON: #{e}"
    return
  end

  names = content.scan(/^  \"(.*?)\":/m).flatten

  unique = Set.new
  duplicates = Set.new
  names.each do |name|
    if !unique.add?(name)
      duplicates.add(name)
    end
  end

  if duplicates.any?
    puts "Found duplicate message names:\n" + duplicates.to_a.map { |n| "\t#{n}" }.join("\n")
    return
  end

  puts 'OK.'
end

all_locales.each do |id, file|
  validate(id, file)
end
