import bespokeMarkdownit from './bespoke-markdownit-base.js';
import hljs from 'highlight.js';

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

        return `<pre class="hljs"><code class="language-${language}">${highlightedCode}</code></pre>`;
      } catch (_) {
        console.info(
          'Could not highlight a piece of code with Highlight.js. Code: ' + str
        );
      }
    }

    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
  }
});

export default (metadataCallbacks, pluginsArray) => {
  return bespokeMarkdownit(createMdConfig, metadataCallbacks, pluginsArray);
};
