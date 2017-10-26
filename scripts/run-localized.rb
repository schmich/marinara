require 'locales'

id, _ = choose_locale('Run Chrome under which locale?')
language = id.gsub('_', '-')

puts "Running Chrome with locale #{language}."
`defaults write com.google.Chrome.canary AppleLanguages '("#{language}")'`
`open -a "Google Chrome Canary"`
`defaults delete com.google.Chrome.canary AppleLanguages`
