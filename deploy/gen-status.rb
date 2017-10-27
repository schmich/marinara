require 'json'
require 'set'

$locales  = {
  'ar' => 'Arabic',
  'am' => 'Amharic',
  'bg' => 'Bulgarian',
  'bn' => 'Bengali',
  'ca' => 'Catalan',
  'cs' => 'Czech',
  'da' => 'Danish',
  'de' => 'German',
  'el' => 'Greek',
  'en' => 'English',
  'en_GB' => 'English (Great Britain)',
  'en_US' => 'English (USA)',
  'es' => 'Spanish',
  'es_419' => 'Spanish (LatAm/Carib)',
  'et' => 'Estonian',
  'fa' => 'Persian',
  'fi' => 'Finnish',
  'fil' => 'Filipino',
  'fr' => 'French',
  'gu' => 'Gujarati',
  'he' => 'Hebrew',
  'hi' => 'Hindi',
  'hr' => 'Croatian',
  'hu' => 'Hungarian',
  'id' => 'Indonesian',
  'it' => 'Italian',
  'ja' => 'Japanese',
  'kn' => 'Kannada',
  'ko' => 'Korean',
  'lt' => 'Lithuanian',
  'lv' => 'Latvian',
  'ml' => 'Malayalam',
  'mr' => 'Marathi',
  'ms' => 'Malay',
  'nl' => 'Dutch',
  'nb' => 'Norwegian',
  'pl' => 'Polish',
  'pt_PT' => 'Portuguese (Portugal)',
  'pt_BR' => 'Portuguese (Brazil)',
  'ro' => 'Romanian',
  'ru' => 'Russian',
  'sk' => 'Slovak',
  'sl' => 'Slovenian',
  'sr' => 'Serbian',
  'sv' => 'Swedish',
  'sw' => 'Swahili',
  'ta' => 'Tamil',
  'te' => 'Telugu',
  'th' => 'Thai',
  'tr' => 'Turkish',
  'uk' => 'Ukrainian',
  'vi' => 'Vietnamese',
  'zh_CN' => 'Chinese (China)',
  'zh_TW' => 'Chinese (Taiwan)'
}

def messages_file(locale)
  locales_path = ENV['LOCALES_PATH']
  raise 'LOCALES_PATH is not defined.' if locales_path.nil?
  root = `git rev-parse --show-toplevel`.strip
  File.join(root, locales_path, locale, 'messages.json')
end

def message_ordinals(locale, commits)
  json = load_messages(locale)
  return {} if json.nil?

  file = messages_file(locale)
  lines = `git blame -c #{file}`.lines

  keys = json.keys
  cur = keys.shift

  ordinals = {}
  lines.each do |line|
    break if cur.nil?
    if line =~ /^(.*?)\s+\(.*?\)\s+\"(#{cur})\":.*/
      commit = $1.strip.slice(0, 7)
      ordinals[$2.strip] = commits.index(commit)
      cur = keys.shift
    end
  end

  ordinals
end

def load_messages(locale)
  file = messages_file(locale)
  return nil if !File.exist?(file)
  JSON.parse(File.read(file))
end

def commits_by_age
  `git log --pretty=%h`.lines.map(&:strip).select { |line| !line.empty? }.reverse
end

def translation_status
  status = {}
  commits = commits_by_age

  en_messages = load_messages('en')
  en_ordinals = message_ordinals('en', commits)

  $locales.each do |locale, name|
    next if ['en', 'en_GB', 'en_US'].include?(locale)

    ordinals = message_ordinals(locale, commits)
    messages = load_messages(locale)

    exists = !messages.nil?
    messages ||= {}

    outdated = messages.select { |id, _| ordinals[id] < en_ordinals[id] }.map(&:first)
    missing = (Set.new(en_messages.keys) - Set.new(messages.keys)).to_a
    identical = en_messages.merge(messages) { |_, l, r| l == r }.select { |_, v| v.is_a?(TrueClass) }.keys

    status[locale] = {
      name: $locales[locale],
      exists: exists,
      missing: missing,
      outdated: outdated,
      identical: identical,
      messages: messages
    }
  end

  status['en'] = {
    name: $locales['en'],
    messages: en_messages
  }

  status
end

puts JSON.pretty_generate(translation_status)
