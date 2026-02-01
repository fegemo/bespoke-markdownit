import bespokeMarkdownit from './bespoke-markdownit-base.js';
import hljs from 'highlight.js/lib/core';
import aliasToFileMap from '../data/hljs-alias-to-file.json' with { type: 'json' };
import pkg from '../package.json' with { type: 'json' };

// determine highlight.js version from package.json (fallback to hardcoded version)
const rawHljsVersion = pkg.peerDependencies && pkg.peerDependencies['highlight.js'];
const HLJS_CDN_VERSION = String(rawHljsVersion).replace(/^[^\d]*/, '');

// saves the path where we request new language files from
let hljsLanguagePath = `https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@${HLJS_CDN_VERSION}/build/es/languages/`;

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
  highlight: (content, language) => {
    // save the grammar to be used in place of the language found int the code fence block 
    // through its source file name in hljs
    // e.g., there is no languages/html.min.js in highlight.js, but there is languages/xml.min.js
    let hljsGrammar = language ? aliasToFileMap[language] : null;

    // if the language is already registered, highlight synchronously
    if (language && hljs.getLanguage(language)) {
      try {
        const highlightedCode = hljs.highlight(content, { language, ignoreIllegals: true }).value;
        return `<pre class="hljs"><code class="language-${language}">${highlightedCode}</code></pre>`;
      } catch (err) {
        console.warn('Could not highlight a piece of code with Highlight.js.', { language, hljsGrammar, error: err });
      }
    }

    // if the corresponding grammar is not yet registered, start async import in background, but
    // return escaped code synchronously to conform to markdown-it API
    if (language && !hljs.getLanguage(language)) {
      // Use a cache on the hljs object to avoid duplicate imports
      hljs.__dynamicLoadCache = hljs.__dynamicLoadCache || {};

      if (!hljs.__dynamicLoadCache[hljsGrammar]) {
        hljs.__dynamicLoadCache[hljsGrammar] = import(`${hljsLanguagePath}${hljsGrammar}.min.js`)
        // hljs.__dynamicLoadCache[hljsGrammar] = import(/* @vite-ignore */ `${hljsLanguagePath}${hljsGrammar}.min.js`)
        // hljs.__dynamicLoadCache[hljsGrammar] = import(`highlight.js/lib/languages/${hljsGrammar}.js`)
          .then(module => {
            const grammarFn = module?.default
            try {
              hljs.registerLanguage(hljsGrammar, grammarFn);
            } catch (e) {
              console.error('Error registering highlight.js language', language, e);
            }

            // after registering, re-highlight existing code blocks for this language
            try {
              // find all code elements that declare this language and that have not yet been highlighted
              const selector = `.hljs-awaiting > code.grammar-${hljsGrammar}`;
              const nodes = document.querySelectorAll(selector);
              nodes.forEach(el => {
                try {
                  const text = el.textContent || '';
                  const result = hljs.highlight(text, { language, ignoreIllegals: true }).value;

                  el.innerHTML = result;
                  el.parentNode.classList.remove('hljs-awaiting');
                  el.classList.remove(`grammar-${hljsGrammar}`);
                } catch (e) {
                  console.error('Error re-highlighting node for language', language, e);
                }
              });
            } catch (e) {
              console.warn('DOM re-highlight error for language', language, e);
            }
          })
          .catch(err => {
            console.warn('Could not import highlight.js language module for', language, err);
          });
      }
    }

    // Fallback: return escaped, unhighlighted code synchronously and, in case a grammar import is ongoing,
    // mark the block so that it can be re-highlighted once the grammar is loaded
    if (hljsGrammar && hljs.__dynamicLoadCache[hljsGrammar]) {
      return `<pre class="hljs hljs-awaiting"><code class="language-${language} grammar-${hljsGrammar}">${md.utils.escapeHtml(content)}</code></pre>`;
    } else {
      return `<pre class="hljs"><code>${md.utils.escapeHtml(content)}</code></pre>`;
    }
  }
});

export default (metadataCallbacks, pluginsArray, hljsOptions) => {
  if (hljsOptions && typeof hljsOptions === 'object' && hljsOptions.languagePath) {
    hljsLanguagePath = hljsOptions.languagePath;
  }
  return bespokeMarkdownit(createMdConfig, metadataCallbacks, pluginsArray);
};
