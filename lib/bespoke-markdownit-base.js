const isEmpty = require('lodash.isempty');
const isFunction = require('lodash.isfunction');
const markdownIt = require('markdown-it');

let slideMetadata = {};

/**
 * Fetches the content of a file through AJAX.
 * @param {string} path the path of the file to fetch
 * @param {Function} callbackSuccess
 * @param {Function} callbackError
 */
const fetchFile = (path, callbackSuccess, callbackError) => {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        callbackSuccess(xhr.responseText);
      } else {
        callbackError();
      }
    }
  };
  xhr.open('GET', path, false);
  xhr.send();
};

const checkForMetadata = (deck, slide, content) => {
  const tempSlide = document.createElement('section');
  tempSlide.innerHTML = content;

  if (
    tempSlide &&
    tempSlide.firstChild &&
    tempSlide.firstChild.nodeType === Node.COMMENT_NODE
  ) {
    const slideIndex = deck.slides.indexOf(slide);
    try {
      const metadata = JSON.parse(tempSlide.firstChild.nodeValue.trim());
      slideMetadata[`${slideIndex}`] = metadata;
      return true;
    } catch (e) {}
    return false;
  }
};

const removeMetadata = slide => slide.removeChild(slide.firstChild);

const callMetadata = (deck, callbacks) => {
  Object.keys(slideMetadata).forEach(slideIndex => {
    const metadata = slideMetadata[slideIndex];

    Object.keys(metadata).forEach(metadataFunctionName => {
      if (metadataFunctionName in callbacks) {
        callbacks[metadataFunctionName].call(
          deck,
          deck.slides[parseInt(slideIndex)],
          metadata[metadataFunctionName]
        );
      }
    });
  });
};

const markdownSlide = (deck, slide, content, md) => {
  const hadMetadata = checkForMetadata(deck, slide, content);
  slide.innerHTML = md.render(content);
  if (hadMetadata) {
    removeMetadata(slide);
  }
};

const createSlide = (deck, slide) => {
  const newSlide = document.createElement('section');
  let index;

  newSlide.className = 'bespoke-slide';
  if (typeof slide !== 'undefined' && slide instanceof HTMLElement) {
    deck.parent.insertBefore(newSlide, slide);
    index = deck.slides.indexOf(slide);
    deck.slides.splice(index, 0, newSlide);
  } else {
    deck.parent.appendChild(newSlide);
    deck.slides.push(newSlide);
  }

  return newSlide;
};

const removeSlide = (deck, slide) => {
  const slideIndex = deck.slides.indexOf(slide);
  deck.slides.splice(slideIndex, 1);
  deck.parent.removeChild(slide);
};

const slidify = (deck, slide, md) => {
  const markdownAttribute = slide.getAttribute('data-markdown');

  switch (true) {
    // data-markdown="path-to-file.md" (so we load the .md file)
    case markdownAttribute && markdownAttribute.trim() !== '':
      fetchFile(
        markdownAttribute.trim(),
        fileContents => {
          var slidesContent = fileContents.split(/\r?\n---+\r?\n/);
          slidesContent.forEach(function(slideContent) {
            var slideContainer = createSlide(deck, slide);
            markdownSlide(deck, slideContainer, slideContent, md);
          });

          // removes original slide
          removeSlide(deck, slide);
        },
        () => {
          slide.innerHTML = 'Error loading the .md file for this slide.';
        }
      );
      break;

    // data-markdown="" or data-markdown (so we markdown the content)
    case markdownAttribute !== null:
      markdownSlide(deck, slide, slide.innerHTML, md);
      break;

    // plain html slide. Don't do anything
    default:
      break;
  }
};

const processDeckForMarkdownAttributes = (deck, md) => {
  const markdownAttribute = deck.parent.getAttribute('data-markdown');
  let slide;

  if (markdownAttribute && markdownAttribute.trim()) {
    // <article data-markdown="...">
    // load the whole deck from md file
    // we create an initial slide with the same markdown attribute
    slide = createSlide(deck);
    slide.setAttribute('data-markdown', markdownAttribute);
  }

  // traverse slides to see which are html and which are md (data-markdown)
  deck.slides.forEach(slide => slidify(deck, slide, md));
};

/**
 * Checks whether we should consider for markdown rendering:
 * - elements with the attribute data-markdown, if at least one element has
 * that. It can be one or some slides or the parent object (full presentation).
 * - the content of all slides, if no element has data-markdown.
 */
const getPluginMode = deck => {
  const elements = [];
  let hasDataMarkdownAttribute;

  elements.push(deck.parent);
  deck.slides.forEach(slide => elements.push(slide));
  hasDataMarkdownAttribute = elements.some(
    current => current.getAttribute('data-markdown') !== null
  );

  return hasDataMarkdownAttribute
    ? 'transform-marked-elements-only'
    : 'transform-content-of-all-slides';
};

module.exports = (mdConfigOrFactory, metadataCallbacks, pluginsArray) => {
  metadataCallbacks = metadataCallbacks || {};
  slideMetadata = {};

  // If mdConfigOrFactory is a function, it's a factory that will be called with the md instance
  // This allows the highlight function to reference the md object
  let mdConfig;
  let md;
  
  if (typeof mdConfigOrFactory === 'function') {
    // Create a temporary md instance so the factory can use it
    md = markdownIt({});
    mdConfig = mdConfigOrFactory(md);
    // Recreate md with the full config
    md = markdownIt(mdConfig);
  } else {
    mdConfig = mdConfigOrFactory;
    md = markdownIt(mdConfig);
  }

  // installs the markdown-it plugins provided by the user
  pluginsArray = !!pluginsArray
    ? Array.isArray(pluginsArray)
      ? pluginsArray
      : [pluginsArray]
    : [];
  pluginsArray.forEach(function(plugin) {
    if (isFunction(plugin)) {
      md.use(plugin);
    } else if (Array.isArray(plugin) && plugin.length > 0) {
      md.use.apply(md, plugin);
    }
  });

  return deck => {
    const mode = getPluginMode(deck);

    switch (mode) {
      case 'transform-marked-elements-only':
        processDeckForMarkdownAttributes(deck, md);
        break;
      case 'transform-content-of-all-slides':
        deck.slides.forEach(function(slideEl) {
          markdownSlide(deck, slideEl, slideEl.innerHTML, md);
        });
        break;
    }

    if (!isEmpty(metadataCallbacks) && !isEmpty(slideMetadata)) {
      callMetadata(deck, metadataCallbacks);
    }
  };
};
