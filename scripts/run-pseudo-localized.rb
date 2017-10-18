require 'json'

def pseudolocalize(string)
  out = ''
  in_var = false
  string.each_char do |c|
    if !in_var
      in_var = (c == '%' || c == '$')
    else
      in_var = !!(c =~ /[-_0-9A-Za-z%$]/)
    end
    if in_var
      out += c
    else
      out += c.tr('a-zA-Z', "ăɓĉɗȅƒɠɧɨĵķļɱƞǒρƣɾšƭʊʋɯϰɣʐĂßĈĎƩƑƓĤĨĵЌ£ʍƝǑƤǬƦЅҬǓѶƜЖ¥Ƶ")
    end
  end
  return "<#{out}>"
end

messages = JSON.parse(File.read('src/_locales/en/messages.json'))

messages.each do |k, v|
  item = messages[k]
  item['message'] = pseudolocalize(item['message'])
end

Dir.mkdir('src/_locales/en_GB') rescue Errno::EEXIST

File.open('src/_locales/en_GB/messages.json', 'w') do |file|
  file.puts(JSON.pretty_generate(messages))
end

`defaults write com.google.Chrome.canary AppleLanguages '("en-GB")'`
`open -a "Google Chrome Canary"`
`defaults delete com.google.Chrome.canary AppleLanguages`
