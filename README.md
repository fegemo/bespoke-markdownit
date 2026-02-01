[![Node.js CI](https://github.com/fegemo/bespoke-markdownit/actions/workflows/node.js.yml/badge.svg)](https://github.com/fegemo/bespoke-markdownit/actions/workflows/node.js.yml) [![Coverage Status](https://coveralls.io/repos/github/fegemo/bespoke-markdownit/badge.svg?branch=master)](https://coveralls.io/github/fegemo/bespoke-markdownit?branch=master)

# bespoke-markdownit

Allows you to use [(GitHub flavored) Markdown][gfm] to author your [bespoke.js](https://github.com/markdalgleish/bespoke.js) presentation.
There are 4 ways to use this plugin and they are described on the [demo page](http://fegemo.github.io/bespoke-markdownit/).

[gfm]: https://help.github.com/articles/github-flavored-markdown

bespoke-markdownit renders Markdown in HTML using the awesome
[markdown-it][markdown-it] parser.

## Download

Download the [production version][min] or the [development version][max],
or use a [package manager](#package-managers).

[min]: https://raw.github.com/fegemo/bespoke-markdown/master/dist/bespoke-markdownit.min.js
[max]: https://raw.github.com/fegemo/bespoke-markdown/master/dist/bespoke-markdownit.js

## Usage

There are 3 steps to using this plugin.
  1. Including and initializing the plugin
  1. Including a stylesheet for code highlighting
  1. Authoring the presentation using Markdown


### 1. Including and initializing the plugin

This plugin is shipped in a [UMD format](https://github.com/umdjs/umd),
meaning that it is available as a CommonJS/AMD module or browser global.

For example, when using CommonJS modules:

```js
const bespoke = require('bespoke'),
  markdown = require('bespoke-markdownit');
  // optionally: 
  // 1. require('bespoke-markdownit/lazy-hljs') to lazily load Highlight.js grammars
  // 2. require('bespoke-markdownit/no-hljs) to not perform any syntax highlighting

bespoke.from('#presentation', [
  markdown()
]);
```

If using browser globals:

```js
bespoke.from('#presentation', [
  bespoke.plugins.markdownIt()
]);
```

#### Plugin Options

The plugin builder accepts up to 3 parameters for configuration.
The first allows the **definition of metadata for each slide**. That data can
be used by callbacks provided to the plugin builder function. The second
parameter allows **passing plugins to the markdown-it** parser. There are
various [markdown-it plugins][plugins], such as one to extend the Markdown
syntax to allow `<abbr></abbr>` ([markdown-it-abbr][plugin-abbr]). The third
is an object with higlight.js configuration.

Let us see how to use those parameters.

##### 1st parameter: Slide metadata

The first parameter, if defined, is a object whose keys are names of
functions and values are callbacks to be invoked when certain Markdown
slides are parsed.

For example, if we want to add some class to a specific Markdown slide, we
can add metadata to that slide with the name of the class it should have and
provide a function to the plugin builder that just adds a class to the
slide owner of the metadata. The Markdown file would look like:

```markdown
# First slide
---
<!--
{
  "addClassToSlide": "2-columns-slide-layout"
}
-->
# Second slide

![](image-left-side.png)
![](image-right-side.png)
---
# Third slide
```

Then, we need to provide a property called `addClassToSlide` which contains
a callback that effectively adds a class to the slide:

```js
bespoke.from('#presentation',
  markdown({
    // slideEl is the HTMLElement of the slide (it is always provided
    //   as the first argument)
    // className is the value defined as the metadata. It could be any
    //   JSON value
    addClassToSlide: function(slideEl, className) {
      slideEl.classList.push(className);
    },
    // another metadata callback function that can be called
    logThisMessage: function(slideEl, message) {
      console.log(message);
    }
  })
);
```

The example would result in the following HTML:

```html
<article id="presentation">
  <section>
    <h1>First Slide</h1>
  </section>
  <section class="2-columns-slide-layout">
    <h1>Second Slide</h1>
    <img src="image-left-side.png" alt="">
    <img src="image-right-side.png" alt="">
  </section>
  <section>
    <h1>Third Slide</h1>
  </section>
</article>
```

The **metadata must be defined as an HTML comment** as the **first
thing in a slide** (i.e., right after the `---`, on a new line). Besides,
**its content must be a valid JSON string**, otherwise the comment will
just be ignored by the bespoke-markdownit plugin (in fact, we
  use `JSON.parse()` on the comment node value).

It is possible to call various callback functions from the metadata by
providing multiple keys, as in the following example.

```markdown
<!--
{
  "addClassToSlide": "pinky",
  "logThisMessage": "yayyyyy"
}
-->
# First Slide
```

Additionally, if a value is passed as an array or an object, the
callback function will receive it proper, such as illustrated.

```markdown
<!--
{
  "injectStylesheets": ["main.css", "ribbon.css"]
}
-->
```

And on the plugin builder function:

```js
bespoke.from('#presentation',
  markdown({
    injectStylesheets: function(slideEl, fileNames) {
      fileNames = Array.isArray(fileName) ? fileNames : [fileNames];
      fileNames.forEach(name => {
        const sheet = document.createElement('link');
        sheet.setAttribute('rel', 'stylesheet');
        sheet.setAttribute('href', name);
        slideEl.appendChild(sheet);        
      });
    }
  })
);
```

##### 2nd parameter: markdown-it plugins

The second parameter allows passing markdown-it plugins to the
markdown-it parser. If provided, it should be **an array of plugin
builder functions**, such as in the following example.

```js
// ...
const abbrPlugin = require('markdown-it-abbr');
const decoratePlugin = require('markdown-it-decorate');
bespoke.from('#presentation',
  markdown(
    // the first argument must be supplied, even if not using metadata
    {},
    // an array of plugin builder functions
    [abbrPlugin, decoratePlugin]
  )
);
```

The order in which they are passed to the bespoke-markdownit builder is the
same that it passes along to markdown-it.

##### 3rd parameter: Highlight.js option

The third parameter is an optional object with configurations for higlight.js.
It has the form:

```js
const hljsConfig = {
  languagesPath: '...'
}
```

If `hljsConfig.languagesPath` is provided, it is used internally as a prepend path
for lazily-loading Highlight.js grammars instead of including all of them at once.
It should point to a URL which contains a .min.js file for each supported grammar
in highlight.js, such a URL of the highlight.js assets hosted from a CDN¹ or a
local path where this plugin can dynamically import it using ES6 Modules.

¹The default behavior is to dynamically import lazily-loaded grammars from the
CDN: https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.11.1/build/languages/

### 2. Stylesheet for code highlighting

If you want code highlighting, you also need to include a stylesheet from
[highlight.js][hljs], which is the package used by this plugin. One option
to include it is via the dependencies of this plugin, as highlight.js is a
dependency of bespoke-markdownit.

In that case, you can include it by:

```html
<link rel="stylesheet" type="text/css" href="node_modules/highlight.js/styles/THEME_NAME.css" />
```

You can choose [any theme][th] from highlight.js and put it instead of
`THEME_NAME`. Some themes are:
  - default.css
  - monokai-sublime.css
  - sublime.css
  - github.css

[th]: https://highlightjs.org/static/test.html


### 3. Authoring presentation using Markdown

Just by including the plugin code and initializing bespoke with it will **allow
writing the content of the slides in Markdown**. You can use a markup similar to
the following:

```html
<article>
  <section>
# Title
This is **markdown content**.
  </section>
</article>
```

You can also write Markdown content in external files. You can do it for the
whole presentation or for specific slides. To mark a slide to be rendered using
Markdown, you need to add the `data-markdown="path-to-file.md"` attribute to the
presentation HTML element, like so:

```html
<article data-markdown="presentation.md"></article>
```

Or, you can add it to specific slides only:
```html
<article>
  <section data-markdown="slide-1.md"></section>
  <section>
    <p>A slide authored in HTML</p>
  </section>
  <section data-markdown="slide-3.md"></section>
</article>
```

You can split the `.md` file in multiple slides by using "`---`" to separate
them. For instance, `presentation.md`:

```markdown
This is the first slide
---
Second slide
---
And third!
```

Additionally, you can mix slides authored in HTML and in Markdown. To mark a
slide to have its contents rendered as Markdown, we also use the `data-markdown`
attribute, but without a value (or with an empty value, i.e.,
`data-markdown=""`). Check the example:
```html
<article>
  <section data-markdown>
    # Title 1
    This is a slide authored in Markdown.
  </section>
  <section data-markdown="">
    # Title 2
    This is also a slide authored in Markdown.
  </section>
  <section>
    <h1>Title 3</h1>
    <p>This is a slide authored in HTML.</p>
  </section>
</article>
```

## Package managers

### npm

```bash
$ npm install bespoke-markdownit
```

## History and Motivation

bespoke-markdownit was forked from [bespoke-markdown][bespoke-markdown] and is
also inspired by [bespoke-meta-markdown][bespoke-meta-markdown].

bespoke-markdown uses [marked][marked] as its parser, which bespoke-markdownit
improves by using [markdown-it][markdown-it]. The latter is not as fast as
[marked][marked], but it was designed to be extensible through plugins
from the beggining and, as such, is much more flexible.

bespoke-meta-markdown is, in turn, a fork of bespoke-markdown that allows
the definition of slide metadata inside HTML comments but in the YAML format.
For so, it has a larger signature than this plugin as it has to include a
YAML parser.

## Credits

This plugin was built with
[generator-bespokeplugin](https://github.com/markdalgleish/generator-bespokeplugin).

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

[markdown-it]: https://github.com/markdown-it/markdown-it
[plugins]: https://www.npmjs.com/browse/keyword/markdown-it-plugin
[plugin-abbr]: https://github.com/markdown-it/markdown-it-abbr
[hljs]: https://highlightjs.org/
[bespoke-markdown]: https://github.com/aaronpowell/bespoke-markdown
[bespoke-meta-markdown]: https://github.com/davidmarkclements/bespoke-meta-markdown
[marked]: https://github.com/chjj/marked
