def all_locales
  locales = Dir["package/_locales/*"]
    .select { |f| File.directory?(f) }
    .map { |d| [d.split(/[\\\/]/).last, File.join(d, 'messages.json')] }
    .to_h
end

def choose_locale(prompt)
  puts prompt
  all_locales.each_with_index do |(id, file), i|
    puts "#{(i + 1).to_s(36)}. #{id}"
  end

  print '> '
  locale = all_locales.to_a[gets.strip.to_i(36) - 1]
  if locale.nil?
    puts 'Invalid choice. Exiting.'
    exit
  end

  locale
end
