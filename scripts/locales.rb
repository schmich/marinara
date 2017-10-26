def all_locales
  locales = Dir["src/_locales/*"]
    .select { |f| File.directory?(f) }
    .map { |d| [d.split(/[\\\/]/).last, File.join(d, 'messages.json')] }
end
