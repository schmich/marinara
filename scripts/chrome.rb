require 'tmpdir'
require 'os'

def run_chrome(language)
  if OS.mac?
    run_chrome_macos(language)
  elsif OS.windows?
    run_chrome_windows(language)
  else
    $stderr.puts "Launching Chrome on this OS (#{RUBY_PLATFORM}) is not implemented."
  end
end

def run_chrome_windows(language)
  user_data_dir = Dir.mktmpdir('marinara')
  extension_dir = File.join(Dir.pwd, 'package')

  args = [
    '--no-first-run',
    "--lang=#{language}",
    "--user-data-dir=#{user_data_dir}",
    "--load-extension=#{extension_dir}",
    'about:blank'
  ]

  puts "Running Chrome with locale #{language}."
  system('\Program Files (x86)\Google\Chrome\Application\chrome.exe', *args)
end

def run_chrome_macos(language)
  user_data_dir = Dir.mktmpdir('marinara')
  extension_dir = File.join(Dir.pwd, 'package')

  orig = `defaults read com.google.Chrome AppleLanguages 2>&1`
  if $?.success?
    languages = orig.lines.slice(1, orig.lines.length - 2).map { |s| s.strip.tr(',', ' ') }
    restore = -> { `defaults write com.google.Chrome AppleLanguages '(#{languages.join(',')})'` }
  else
    restore = -> { `defaults delete com.google.Chrome AppleLanguages` }
  end

  `defaults write com.google.Chrome AppleLanguages '("#{language}")'`

  begin
    args = [
      '--new',
      '-a',
      'Google Chrome',
      '--args',
      '--no-first-run',
      "--user-data-dir=#{user_data_dir}",
      "--load-extension=#{extension_dir}",
      'about:blank'
    ]

    puts "Running Chrome with locale #{language}."
    system('open', *args)
  ensure
    restore.call
  end
end
