#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")/.."
ruby - <<'RUBY'
require 'tmpdir'
require 'fileutils'
require 'open3'
require 'yaml'
require 'date'

# 在临时目录检查新建、特殊字符、日期校验和拒绝覆盖，不改动你的日记。
Dir.mktmpdir('diary-check') do |root|
  FileUtils.cp('new-diary.sh', root)
  Dir.mkdir(File.join(root, '_posts'))
  run = ->(*args) { Open3.capture3('bash', File.join(root, 'new-diary.sh'), *args) }
  title = '今天的 "想法": #小事'
  _, error, status = run.call(title, '--date', '2024-02-29', '--tags', '生活,思考', '--draft')
  abort error unless status.success?
  path = File.join(root, '_posts', '2024-02-29-diary.md')
  before = File.read(path)
  data = YAML.safe_load(before.split('---', 3)[1], permitted_classes: [Date, Time])
  abort '标题或标签转义错误' unless data['title'] == title && data['tags'] == ['生活', '思考'] && data['published'] == false
  abort '重复日记未被拒绝' if run.call('--date', '2024-02-29')[2].success?
  abort '已有日记被修改' unless File.read(path) == before
  abort '错误日期未被拒绝' if run.call('--date', '2025-02-29')[2].success?
  abort '不安全的文件名未被拒绝' if run.call('--slug', '../outside')[2].success?
  abort '空标题未被拒绝' if run.call(' ')[2].success?
  abort '默认日期无法创建' unless run.call('今天', '--slug', 'today')[2].success?
end
puts '日记脚本检查通过。'
RUBY
bundle exec jekyll build --strict_front_matter
