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

    undefined = referenced - defined
    unless undefined.empty?
      error = "Placeholder referenced but not defined: #{undefined.to_a.join(', ')}"
      raise ValidationError.new(error, file, id)
    end

    unreferenced = defined - referenced
    unless unreferenced.empty?
      error = "Placeholder defined but not referenced: #{unreferenced.to_a.join(', ')}"
      raise ValidationError.new(error, file, id)
    end

    contents = obj['placeholders']&.map(&:last)&.map { |p| p['content'] } || []
    if contents.length != contents.uniq.length
      error = "Placeholders use the same positions: #{contents}."
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
  locales = all_locales
  if locales.empty?
    raise 'No locales found.'
  end
  locales.each do |id, file|
    validate(id, file)
  end
  puts 'OK.'
rescue ValidationError => e
  location = [e.file, e.message_id].compact.join(', ')
  puts "Error in #{location}:\n\t#{e}"
  exit 1
end
