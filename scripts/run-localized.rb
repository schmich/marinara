locales_dir = 'src/_locales'

locales = Dir["#{locales_dir}/*"]
  .select { |f| File.directory?(f) }
  .map { |d| d.split(/[\\\/]/).last }
  .select { |n| n != 'en' }

puts 'Run Chrome under which locale?'
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

language = locale.gsub('_', '-')

`defaults write com.google.Chrome.canary AppleLanguages '("#{language}")'`
`open -a "Google Chrome Canary"`
`defaults delete com.google.Chrome.canary AppleLanguages`
