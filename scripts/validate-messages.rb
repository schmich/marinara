require 'locales'
require 'json'
require 'set'

class ValidationError < StandardError
  def initialize(message, file, message_id = nil)
    super(message)
    @file = file
    @message_id = message_id
  end

  attr_reader :file, :message_id
end

def validate_json(file, messages)
  messages.each do |id, obj|
    message = obj['message']
    referenced = Set.new(message.scan(/\$.*?\$/))
    defined = Set.new(obj['placeholders']&.map(&:first)&.map { |name| "$#{name}$" })
    missing = referenced - defined
    unless missing.empty?
      error = "Placeholder referenced but not defined: #{missing.to_a.join(', ')}"
      raise ValidationError.new(error, file, id)
    end
  end
end

def validate(id, file)
  content = File.read(file)
  begin
    messages = JSON.parse(content)
  rescue => e
    raise ValidationError.new("Invalid JSON: #{e}", file)
  end

  validate_json(file, messages)

  names = content.scan(/^  \"(.*?)\":/m).flatten

  unique = Set.new
  duplicates = Set.new
  names.each do |name|
    if !unique.add?(name)
      duplicates.add(name)
    end
  end

  if duplicates.any?
    error = "Found duplicate message names:\n" + duplicates.to_a.map { |n| "\t#{n}" }.join("\n")
    raise ValidationError.new(error, file)
  end
end

begin
  all_locales.each do |id, file|
    validate(id, file)
  end
  puts 'OK.'
rescue ValidationError => e
  location = [e.file, e.message_id].compact.join(', ')
  puts "Error in #{location}:\n#{e}"
end
