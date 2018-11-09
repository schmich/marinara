require 'json'
require 'clipboard'

Dir['src/_locales/*'].sort.each do |path|
  locale = File.basename(path)
  messages = JSON.parse(File.read(File.join(path, 'messages.json')).force_encoding('UTF-8'))
  description = messages['chrome_web_store_description']['message'] rescue nil

  puts '-' * 80
  puts locale
  if description
    puts description
    Clipboard.copy(description)
    puts "\nCopied to clipboard."
  else
    puts "No description available."
  end

  gets
end
