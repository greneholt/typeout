var regexpEscape = function(text) {
    return text.replace(/([\{\}\(\)\[\]\*\+\?\$\^\.\#\\])/g, '\\$1')
};

var Typeout = new Class({
    initialize: function(content) {
        var self = this;

        self.content = content;
    },

    toHTML: function() {
        var self = this;

        var text = self.content;

        text = self.cleanWhitespace(text);
        text = '\n\n' + text + '\n\n'; // a few guaranteed newlines

        self.archive = [];

        text = self.archiveHtml(text);

        text = self.htmlEscape(text);

        text = self.archiveCode(text);

        text = self.makeBlockquotes(text);
        text = self.makeHeadings(text);
        text = self.makeLists(text);
        text = self.makeParagraphs(text);
        text = self.makeInlines(text);

        text = self.removeExcessNewlines(text);

        text = self.retrieveArchive(text);

        return text;
    },

    htmlEscape: function(text) {
        return text.
            replace(/&/g, '&amp;').
            replace(/</g, '&lt;').
            replace(/>/g, '&gt;').
            replace(/"/g, '&quot;')
    },

    cleanWhitespace: function(text) {
        return text.
            replace(/\r\n/g, '\n').
            replace(/\r/g, '\n').
            replace(/^ +$/gm, '');
    },

    removeExcessNewlines: function(text) {
        return text.replace(/\n{3,}/g, '\n\n');
    },

    archiveHtml: function(text) {
        var self = this;

        return text.replace(/\[html\]([\s\S]*?)\[\/html\]/gmi, function(wholeMatch, m1) {
            return self.addToArchive(m1);
        });
    },

    archiveCode: function(text) {
        var self = this;

        text = text.replace(/^-{3,}\n([\s\S]+?)\n-{3,}$/gm, function(wholeMatch, m1) {
            return self.addToArchive('<pre><code>' + m1 +'</code></pre>');
        });

        return text.replace(/`(?!\s)((?:\s*\S)+?)`/g, function(wholeMatch, m1) {
            return self.addToArchive('<code>' + m1 + '</code>');
        });
    },

    addToArchive: function(text) {
        var self = this;

        var index = self.archive.push(text) - 1;
        return '!a!r!c!h!i!v!e!' + index + '!a!r!c!h!i!v!e!'; // nobody's going to type that!
    },

    retrieveArchive: function(text) {
        var self = this;

        self.archive.each(function(content, index) {
            text = text.replace(new RegExp('!a!r!c!h!i!v!e!' + index + '!a!r!c!h!i!v!e!'), content); // the block is so gsub won't substitute \&
        });
        return text;
    },

    makeBlockquotes: function(text) {
        return text.replace(/^~{3,}\n([\s\S]+?)\n~{3,}$/gm, '\n\n<blockquote>\n\n$1\n\n</blockquote>\n\n');
    },

    makeHeadings: function(text) {
        return text.replace(/^(={1,6})(.+?)=*?$/gm, function(wholeMatch, m1, m2) {
            var depth = m1.length;
            return '\n\n<h' + depth + '>' + m2.trim() + '</h' + depth + '>\n\n';
        });
    },

    makeLists: function(text, baseLevel) {
        var self = this;

        if (baseLevel == undefined) {
            baseLevel = '';
        }

        return text.replace(new RegExp('^(' + regexpEscape(baseLevel) + '[\\*\\#])[\\*\\#]* [^\n]+?\n(?:\\1[\\*\\#]* (?:[^\n])+?\n)*', 'gm'), function(content, level) {
            content = self.makeLists(content, level);
            content = content.replace(new RegExp('^' + regexpEscape(level) + ' (.+)$', 'gm'), '<li>$1</li>');
            content = content.replace(/<\/li>\n<([uo])l>/gm, '<$1l>');

            if (level.slice(-1) == '*') { // its an unordered list
                content = '<ul>\n' + content + '</ul>';
            } else {
                content = '<ol>\n' + content + '</ol>';
            }

            if (baseLevel) {
                content += '</li>\n';
            } else {
                content += '\n';
            }
            return content;
        });
    },

    makeParagraphs: function(text) {
        var self = this;

        return text.replace(/^(?!<|!a!r!c!h!i!v!e!)([^\n]+\n)+\n/gm, function(content) {
            return '\n\n<p>\n' + self.makeBreaks(content.trim()) + '</p>\n\n';
        });
    },

    makeBreaks: function(text) {
        return text.replace(/([^\n])\n(?!\n)/gm, '$1<br />\n');
    },

    makeInlines: function(text) {
        var self = this;

        text = text.
            replace(/^((?: ?[\w\(\)']){3,}:) (?!\s*$)/gm, '<b>$1</b> '). // spaces are not allowed directly in front of the colon, there must be a space after it, and the rest of the line can't be blank
            replace(/!\((.+?)\)(?:\:([a-zA-Z0-9\_]+))?/g, function(wholeMatch, m1, m2) {
                if (m2) {
                    return '<img src="' + self.addToArchive(m1.trim()) + '" class="' + m2 + '" />';
                } else {
                    return '<img src="' + self.addToArchive(m1.trim()) + '" />';
                }
            }).
            replace(/\[(.+?)\]\((.+?)\)(?:\:([a-zA-Z0-9\_]+))?/g, function(wholeMatch, m1, m2, m3) {
                if (m3) {
                    return '<a href="' + self.addToArchive(m2.trim()) + '" class="' + m3 + '">' + self.addToArchive(m1) + '</a>';
                } else {
                    return '<a href="' + self.addToArchive(m2.trim()) + '">' + self.addToArchive(m1) + '</a>';
                }
            }).
            replace(/([a-z0-9\.\-\_\+]+)@((?:[a-z0-9\-]{2,}\.)*)([a-z0-9\-]+\.)(com|org|net|biz|edu|info|gov|co\.uk|co\.us)/gi, function(wholeMatch, address, subdomain, domain, tld) {
                return '<a href="mailto:' + self.addToArchive(address + '@' + subdomain + domain + tld) + '">' + self.addToArchive(address + '@' + subdomain + domain + tld) + '</a>';
            }).
            replace(/(https?:\/\/)?((?:[a-z0-9\-]{2,}\.)*)([a-z0-9\-]+\.)(com|org|net|biz|edu|info|gov|co\.uk|co\.us)((?:\/(?:\.?[a-z0-9\-_=\?&;\%#]+)+)*\/?)/gi, function(wholeMatch, protocol, subdomain, domain, tld, file) {
                if (!protocol) {
                    protocol = 'http://';
                }
                return '<a href="' + self.addToArchive(protocol + subdomain + domain + tld + file) + '">' + self.addToArchive(protocol + subdomain + domain + tld + file) + '</a>';
            });

        var inlines = [
            ['*', 'strong'],
            ['_', 'em'],
            ['`', 'code'],
            ['^', 'sup'],
            ['~', 'sub']
        ];

        inlines.each(function(pair) {
            var char = regexpEscape(pair[0]);
            var tag = pair[1];
            text = text.replace(new RegExp(char + '(?!\\s)((?:\\s*\\S)+?)' + char, 'g'), '<' + tag + '>$1</' + tag + '>');
        });

        return text;
    }
});

var TypeoutPreview = new Class({
    Implements: Options,

    options: {
        frequency: 500
    },

    initialize: function(textArea, previewDiv, options) {
        var self = this;

        self.textArea = $(textArea);
        self.previewDiv = $(previewDiv);

        self.setOptions(options);

        self.typeOut = new Typeout;
        self.dirty = true;
        self.ready = false;

        self.textArea.addEvent('keyup', self.setDirty.bind(self));
        self.setReady();
    },

    setDirty: function() {
        var self = this;

        self.dirty = true;
        if (self.ready) {
            self.setUnReady();
            self.preview();
        }
    },

    setUnReady: function() {
        var self = this;

        self.ready = false;
        self.setReady.delay(self.options.frequency, self);
    },

    setReady: function() {
        var self = this;

        self.ready = true;
        if (self.dirty) {
            self.setUnReady();
            self.preview();
        }
    },

    render: function(text) {
        var self = this;

        self.typeOut.content = text;
        return self.typeOut.toHTML();
    },

    preview: function() {
        var self = this;

        self.previewDiv.set('html', self.render(self.textArea.value));
        self.dirty = false;
    }
});

TypeoutTemplatePreview = new Class({
    Extends: TypeoutPreview,

    initialize: function(textArea, previewDiv, template, options) {
        var self = this;

        self.template = template;
        self.parent(textArea, previewDiv, options);
    },

    render: function(content) {
        var self = this;

        self.template.tags.each(function(tag) {
            content = content.replace(RegExp(regexpEscape(tag.name), 'gi'), tag.example);
        });
        return self.parent(content);
    }
});
