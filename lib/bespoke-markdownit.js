const bespokeMarkdownit = require('./bespoke-markdownit-base');
const hljs = require('highlight.js');

hljs.registerLanguage('php', require('highlight.js/lib/languages/php'));
hljs.registerLanguage('css', require('highlight.js/lib/languages/css'));
hljs.registerLanguage('cpp', require('highlight.js/lib/languages/cpp'));
hljs.registerLanguage('sql', require('highlight.js/lib/languages/sql'));
hljs.registerLanguage('xml', require('highlight.js/lib/languages/xml'));
hljs.registerLanguage('bash', require('highlight.js/lib/languages/bash'));
hljs.registerLanguage('java', require('highlight.js/lib/languages/java'));
hljs.registerLanguage('json', require('highlight.js/lib/languages/json'));
hljs.registerLanguage('dust', require('highlight.js/lib/languages/dust'));
hljs.registerLanguage('glsl', require('highlight.js/lib/languages/glsl'));
hljs.registerLanguage('http', require('highlight.js/lib/languages/http'));
hljs.registerLanguage('less', require('highlight.js/lib/languages/less'));
hljs.registerLanguage('scss', require('highlight.js/lib/languages/scss'));
hljs.registerLanguage('apache', require('highlight.js/lib/languages/apache'));
hljs.registerLanguage('python', require('highlight.js/lib/languages/python'));
hljs.registerLanguage('gherkin', require('highlight.js/lib/languages/gherkin'));
hljs.registerLanguage('markdown', require('highlight.js/lib/languages/markdown'));
hljs.registerLanguage('makefile', require('highlight.js/lib/languages/makefile'));
hljs.registerLanguage('handlebars', require('highlight.js/lib/languages/handlebars'));
hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'));
hljs.registerLanguage('typescript', require('highlight.js/lib/languages/typescript'));

// Factory function to create config - receives md instance
const createMdConfig = (md) => ({
  // enable HTML tags in source
  html: true,
  // do not use '/' to close single tags (<br />)
  xhtmlOut: false,

  // do not convert '\n' in paragraphs into <br>
  breaks: false,

  // CSS language prefix for fenced blocks
  langPrefix: 'language-',
  // autoconvert URL-like text to links
  linkify: true,

  // enable some language-neutral replacement + quotes beautification
  typographer: true,

  // double + single quotes replacement pairs, when typographer enabled,
  // and smartquotes on. Could be either a String or an Array.
  //
  // For example, you can use '«»„"' for Russian, '„"‚'' for German,
  // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
  quotes: '""\'\'',

  // Highlighter function. Should return escaped HTML,
  // or '' if the source string is not changed and should be escaped externaly.
  // If result starts with <pre... internal wrapper is skipped.
  highlight: (str, language) => {
    if (language && hljs.getLanguage(language)) {
      try {
        const highlightedCode = hljs.highlight(str, {language, ignoreIllegals: true}).value;

        return `<pre class="hljs"><code>${highlightedCode}</code></pre>`;
      } catch (_) {
        console.info(
          'Could not highlight a piece of code with Highlight.js. Code: ' + str
        );
      }
    }

    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  }
});

module.exports = (metadataCallbacks, pluginsArray) => {
  return bespokeMarkdownit(createMdConfig, metadataCallbacks, pluginsArray);
};
