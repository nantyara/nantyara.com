require 'pathname'
require 'erb'
require 'yaml'

path = Pathname.new(__FILE__)

expire_time = Time.now - 60*60*12

schedules =
  YAML.load_file(path + '../../data/schedules.yml').
    select { |s| s['date'] < expire_time }.
    sort_by { |s| s['date'] }.reverse

current = false

File.open(path + '../../dist/past.html', 'w') do |f|
  f.puts ERB.new(File.read(path + '../index.html.erb')).result(binding)
end
