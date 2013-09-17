require 'sanitize'
require 'erb'

class Typeout < String
  VERSION = '1.4.5'

  include ERB::Util

  def self.convert(text, sanitize = true)
    self.new(text.to_s).to_html(sanitize)
  end

  def to_html(sanitize = true)
    @sanitize = sanitize

    text = self.dup

    text = clean_whitespace text
    text = "\n\n#{text}\n\n" # a few guaranteed newlines

    @archive = []

    text = archive_html text

    text = html_escape text

    text = archive_code text
    text = archive_blockquotes text

    text = make_headings text
    text = make_lists text
    text = make_paragraphs text
    text = make_inlines text

    text = remove_excess_newlines text

    text = retrieve_archive text

    text
  end

  def sanitize_html(text)
    if @sanitize
      Sanitize.clean(text, Sanitize::Config::RELAXED)
    else
      text
    end
  end

  def clean_whitespace(text)
    text.gsub(/\r\n/, "\n").
      gsub(/\r/, "\n").
      gsub(/^ +$/, '')
  end

  def remove_excess_newlines(text)
    text.gsub(/\n{3,}/, "\n\n")
  end

  def archive_html(text)
    text.gsub(/\[html\](.*?)\[\/html\]/mi) { archive(sanitize_html($1)) }
  end

  def archive_code(text)
    text = text.gsub(/^-{3,}\n(.+?)\n-{3,}$/m) { archive("<pre><code>#{$1}</code></pre>") }
    text.gsub(/`(?!\s)((?:\s*\S)+?)`/) { archive("<code>#{$1}</code>") }
  end

  def archive_blockquotes(text)
    text.gsub(/^~{3,}\n(.+?)\n~{3,}$/m) do
      content = remove_excess_newlines(make_paragraphs(make_lists("\n\n#{$1}\n\n"))) # blockquotes support paragraphs and lists
      archive("<blockquote>#{content}</blockquote>")
    end
  end

  def archive(text)
    @archive << text
    "!a!r!c!h!i!v!e!#{@archive.length-1}!a!r!c!h!i!v!e!" # nobody's going to type that!
  end

  def retrieve_archive(text)
    @archive.each_with_index do |content, index|
      text = text.sub("!a!r!c!h!i!v!e!#{index}!a!r!c!h!i!v!e!") { content } # the block is so gsub won't substitute \&
    end
    text
  end

  def make_headings(text)
    text.gsub(/^(={1,6})(.+?)=*?$/) do
      depth = $1.length
      "\n\n<h#{depth}>#{$2.strip}</h#{depth}>\n\n"
    end
  end

  def make_lists(text, base_level = nil)
    text.gsub(/^(#{Regexp.escape(base_level.to_s)}[\*\#])[\*\#]* [^\n]+?\n(?:\1[\*\#]* (?:[^\n])+?\n)*/m) do |content|
      level = $1

      content = make_lists(content, level)
      content = content.gsub(/^#{Regexp.escape(level)} (.+)$/, '<li>\1</li>')
      content = content.gsub(/<\/li>\n<([uo])l>/m, '<\1l>')

      if level.last == "*" # its an unordered list
        content = "<ul>\n#{content}</ul>"
      else
        content = "<ol>\n#{content}</ol>"
      end

      if base_level
        content += "</li>\n"
      else
        content += "\n"
      end
      content
    end
  end

  def make_paragraphs(text)
    text.gsub(/^(?!<|!a!r!c!h!i!v!e!)([^\n]+\n)+\n/m) { |content| "\n\n<p>\n#{make_breaks(content.strip)}</p>\n\n" }
  end

  def make_breaks(text)
    text.gsub(/([^\n])\n(?!\n)/m, "\\1<br />\n")
  end

  def make_inlines(text)
    text = text.
      gsub(/^((?: ?[\w\(\)']){3,}:) (?!\s*$)/, '<b>\1</b> '). # spaces are not allowed directly in front of the colon, there must be a space after it, and the rest of the line can't be blank
      gsub(/!\((.+?)\)(?:\:([a-zA-Z0-9\_]+))?/) do
        if $2
          "<img src=\"#{archive($1)}\" class=\"#{$2}\" />"
        else
          "<img src=\"#{archive($1)}\" />"
        end
      end.
      gsub(/\[(.+?)\]\((.+?)\)(?:\:([a-zA-Z0-9\_]+))?/) do
        if $3
          "<a href=\"#{archive($2)}\" class=\"#{$3}\">#{archive($1)}</a>"
        else
          "<a href=\"#{archive($2)}\">#{archive($1)}</a>"
        end
      end.
      gsub(/([a-z0-9\.\-\_\+]+)@((?:[a-z0-9\-]{2,}\.)*)([a-z0-9\-]+\.)(com|org|net|biz|edu|info|gov|co\.uk|co\.us)/i) do
        "<a href=\"mailto:#{archive($1 + '@' + $2 + $3 + $4)}\">#{archive($1 + '@' + $2 + $3 + $4)}</a>"
      end.
      gsub(/(https?:\/\/)?((?:[a-z0-9\-]{2,}\.)*)([a-z0-9\-]+\.)(com|org|net|biz|edu|info|gov|co\.uk|co\.us)((?:\/(?:\.?[a-z0-9\-_=\?&;\%#]+)+)*\/?)/i) do # some of the magic in here is to not grab periods at the end of URLs
        if $1.nil?
          protocol = 'http://'
        else
          protocol = $1
        end
        "<a href=\"#{archive(protocol + $2 + $3 + $4 + $5)}\">#{archive(protocol + $2 + $3 + $4 + $5)}</a>"
      end

    inlines = [
      ['*', 'strong'],
      ['_', 'em'],
      ['`', 'code'],
      ['^', 'sup'],
      ['~', 'sub']
    ]

    inlines.each do |char, tag|
      char = Regexp.escape(char)
      re = /#{char}         # the opening character
           (?!\s)           # no spaces directly after the char
           (                # main capture group
           (?:\s*\S)+?      # because of no lookbehinds, every space must be followed by a non-space
           )                # with lookbehinds, the whole regex is: \*(?! )(.+?)(?<! )\*
           #{char}/x        # closing character, no spaces directly before it
      #re = /#{char}(.+?)#{char}/
      text.gsub!(re, "<#{tag}>\\1</#{tag}>")
    end

    text
  end
end
