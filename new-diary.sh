#!/bin/bash
set -euo pipefail
export DIARY_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
exec ruby - "$@" <<'RUBY'
require 'date'
require 'json'
require 'optparse'

# 与默认 _config.yml 一致；迁移时区时可通过 TZ=... 覆盖。
ENV['TZ'] = ENV.fetch('TZ', 'Asia/Singapore')
options = { date: Date.today.iso8601, slug: 'diary', tags: ['生活'], draft: false }
parser = OptionParser.new do |o|
  o.banner = '用法：bash new-diary.sh [标题] [--date YYYY-MM-DD] [--slug english-name] [--tags 生活,学习] [--draft]'
  o.on('--date DATE', '日记日期，默认今天') { |v| options[:date] = v }
  o.on('--slug SLUG', '文件名后缀，默认 diary') { |v| options[:slug] = v }
  o.on('--tags TAGS', '逗号分隔的标签') { |v| options[:tags] = v.split(/[,，]/).map(&:strip).reject(&:empty?).uniq }
  o.on('--draft', '设置 published: false，暂不发布') { options[:draft] = true }
  o.on('-h', '--help', '显示帮助') { puts o; exit }
end

begin
  parser.parse!
  raise ArgumentError, '标题包含空格时，请用引号包起来。' if ARGV.length > 1
  raise ArgumentError, '日期必须是 YYYY-MM-DD。' unless options[:date].match?(/\A\d{4}-\d{2}-\d{2}\z/)
  Date.iso8601(options[:date])
  raise ArgumentError, 'slug 只能包含小写英文字母、数字和中间的短横线。' unless options[:slug].match?(/\A[a-z0-9]+(?:-[a-z0-9]+)*\z/)
  title = ARGV.first || "#{options[:date]} · 今日小记"
  raise ArgumentError, '标题不能为空或包含换行。' if title.strip.empty? || title.match?(/[\r\n]/)
  path = File.join(ENV.fetch('DIARY_ROOT'), '_posts', "#{options[:date]}-#{options[:slug]}.md")
  text = <<~MARKDOWN
    ---
    title: #{JSON.generate(title)}
    date: #{options[:date]} 00:00:00
    tags: #{JSON.generate(options[:tags])}
    published: #{!options[:draft]}
    ---

    今天值得记住的是……

    ## 今天做了什么

    -

    ## 今天想到的事情


    ## 留给明天

    -
  MARKDOWN
  File.open(path, File::WRONLY | File::CREAT | File::EXCL, 0644) { |file| file.write(text) }
  puts "已创建：#{path}"
  puts '这是草稿；写好后将 published 改为 true。' if options[:draft]
rescue Errno::EEXIST
  warn '文件已存在，没有覆盖。可用 --slug 换一个名字。'
  exit 1
rescue OptionParser::ParseError, ArgumentError, SystemCallError => error
  warn "创建失败：#{error.message}"
  exit 1
end
RUBY
