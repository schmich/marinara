require 'json'

messages_filename = ARGV.first
if messages_filename.nil?
  puts 'Expected path to messages.json.'
  exit 1
end

# Do not translate line endings.
$stdout.binmode

puts "class Messages\n{"

locale = JSON.load(File.read(messages_filename))
locale.sort_by(&:first).each do |name, value|
  message, description, placeholders = value['message'], value['description'], value['placeholders']
  if placeholders.nil? || placeholders.empty?
    puts "  get #{name}() {\n    return chrome.i18n.getMessage('#{name}', []);\n  }"
  else
    params = placeholders.keys.join(', ')
    puts "  #{name}(#{params}) {\n    return chrome.i18n.getMessage('#{name}', [#{params}]);\n  }"
  end
end

puts "}\n\nexport default new Messages();"
