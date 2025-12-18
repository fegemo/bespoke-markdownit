const bespokeMarkdownit = require('./bespoke-markdownit-base');

// Factory function to create config - receives md instance
// No highlight function for syntax highlighting disabled
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

  // No highlight function - syntax highlighting disabled
});

module.exports = (metadataCallbacks, pluginsArray) => {
  return bespokeMarkdownit(createMdConfig, metadataCallbacks, pluginsArray);
};
