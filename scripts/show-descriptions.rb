require 'json'
require 'clipboard'

def load_messages(locale)
  JSON.parse(File.read(File.join('package', '_locales', locale, 'messages.json')).force_encoding('UTF-8'))
end

$en = load_messages('en')
def message(messages, name)
  if messages[name]
    messages[name]['message']
  else
    $en[name]['message']
  end
end

Dir['package/_locales/*'].sort.each do |path|
  locale = File.basename(path)
  messages = load_messages(locale)
  parts = [
    message(messages, 'chrome_web_store_description'),
    'https://github.com/schmich/marinara',
    message(messages, 'disclaimer')
  ]

  puts '-' * 80
  puts locale

  description = parts.join("\n\n")
  puts description
  Clipboard.copy(description)
  puts "\nCopied to clipboard."

  gets
end
