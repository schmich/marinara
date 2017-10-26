require 'chrome'
require 'locales'

id, _ = choose_locale('Run Chrome under which locale?')
language = id.gsub('_', '-')
run_chrome(language)
