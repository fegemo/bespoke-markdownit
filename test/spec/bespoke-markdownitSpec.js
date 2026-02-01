import bespoke from 'bespoke';
import markdown from '../../lib/bespoke-markdownit-lazy-hljs.js';

const FIXTURES_PATH = 'base/test/fixtures/';

describe('bespoke-markdownit', function() {
  let deck,
    parentNode,
    createParent = function() {
      parentNode = document.createElement('article');
    },
    createSlide = function(content) {
      var slideNode = document.createElement('section');
      slideNode.innerHTML = content;
      parentNode.appendChild(slideNode);
    },
    clearDocument = function() {
      parentNode = null;
      var body = document.getElementsByTagName('body')[0];
      body.innerHTML = '';
    };

  afterEach(clearDocument);

  describe('deck.slide', function() {
    var createDeck = function(slideEls) {
      createParent();
      slideEls.forEach(function(slide) {
        parentNode.appendChild(slide);
      });

      deck = bespoke.from(parentNode, [markdown()]);
    };

    it('should have parsed the slide from markdown to html', function() {
      var slides = [];
      for (var i = 0; i < 10; i++) {
        var slide = document.createElement('section');
        slide.innerHTML = 'just a __bold__ text ' + i;
        slides.push(slide);
      }
      createDeck(slides);

      expect(deck.slides[0].innerHTML.trim()).toBe(
        '<p>just a <strong>bold</strong> text 0</p>'
      );
    });

    it('should allow mixed markdown and html slides', function() {
      var slideMd = document.createElement('section');
      var slideHtml = document.createElement('section');
      slideMd.innerHTML = '**bold**';
      slideMd.setAttribute('data-markdown', '');
      slideHtml.innerHTML = '<div class="yay">**hulla**</div>';
      createDeck([slideMd, slideHtml]);

      expect(deck.slides[0].querySelector('strong')).toBeDefined();
      expect(deck.slides[1].innerHTML).toBe('<div class="yay">**hulla**</div>');
    });
  });

  describe('highlighting', function() {
    beforeEach(createParent);

    it('should highlight codeblocks', function() {
      createSlide(
        '```\n' + 'function a() { window.console.log(\'yayyyyy!!\')}' + '```\n'
      );
      deck = bespoke.from(parentNode, [markdown()]);
      var codeEl = parentNode.firstChild.querySelector('code');
      expect(codeEl).toBeDefined();
      expect(codeEl.parentNode.classList.contains('hljs')).toBeTruthy();
    });

    it('should include the language name on the code element', function() {
      createSlide(
        '```js\n' + 'function a() { window.console.log(\'yayyyyy!!\')}' + '```\n'
      );
      deck = bespoke.from(parentNode, [markdown()]);
      var codeEl = parentNode.firstChild.querySelector('code');
      expect(codeEl.parentNode.className.indexOf('js')).toBeTruthy();
    });
  });

  describe('external markdown file', function() {
    beforeEach(createParent);

    it('should allow an external markdown file to be provided ', function() {
      parentNode.setAttribute('data-markdown', FIXTURES_PATH + 'simple.md');
      deck = bespoke.from(parentNode, [markdown()]);
      var slideContent = deck.slides[0] ? deck.slides[0].innerHTML.trim() : '';
      expect(slideContent).toBe(
        '<p>This is a simple ' +
          'sentence with a <strong>bold</strong> word.</p>'
      );
    });

    it('should allow a markdown file with multiple slides split by \n---\n', function() {
      parentNode.setAttribute('data-markdown', FIXTURES_PATH + 'multiple.md');
      deck = bespoke.from(parentNode, [markdown()]);
      expect(deck.slides.length).toBe(3);
      expect(deck.slides[0].innerHTML).toMatch(/first/);
      expect(deck.slides[1].innerHTML).toMatch(/second/);
      expect(deck.slides[2].innerHTML).toMatch(/third/);
    });

    it('should render an error if the external file is not reachable', function() {
      parentNode.setAttribute(
        'data-markdown',
        FIXTURES_PATH + 'does-not-exist.md'
      );
      deck = bespoke.from(parentNode, [markdown()]);
      var slideContent = deck.slides[0] ? deck.slides[0].innerHTML.trim() : '';
      expect(slideContent).toMatch(/erro/i);
    });

    it('should allow mixed html/markdown formats for slides', function() {
      var htmlNode = document.createElement('section'),
        markdownNode = document.createElement('section');
      htmlNode.innerHTML = 'this is an html node';
      markdownNode.setAttribute('data-markdown', FIXTURES_PATH + 'simple.md');
      parentNode.appendChild(htmlNode);
      parentNode.appendChild(markdownNode);

      deck = bespoke.from(parentNode, [markdown()]);
      var slideContent = deck.slides[1] ? deck.slides[1].innerHTML.trim() : '';
      expect(deck.slides.length).toBe(2);
      expect(slideContent).toMatch(/<strong>/);
    });
  });

  describe('slide metadata', function() {
    beforeEach(createParent);

    it(
      'should allow metadata defined in proper json format inside html ' +
        'comments as the first node in a slide',
      function() {
        createSlide('<!-- { "a": 42 } -->\n# title of slide ');
        var aFunc = jasmine.createSpy('function a');
        deck = bespoke.from(parentNode, [
          markdown({
            a: aFunc
          })
        ]);

        expect(aFunc).toHaveBeenCalledWith(jasmine.any(Object), 42);
      }
    );

    it('should allow metadata defined as a single object', function() {
      createSlide('<!-- { "c": { "d": 1 } } -->');
      var aFunc = jasmine.createSpy('function c');
      deck = bespoke.from(parentNode, [
        markdown({
          c: aFunc
        })
      ]);

      expect(aFunc).toHaveBeenCalledWith(
        jasmine.any(Object),
        jasmine.objectContaining({ d: 1 })
      );
    });

    it('should allow metadata defined as a single primitive', function() {
      createSlide('<!-- { "e": 15 } -->\n');
      var aFunc = jasmine.createSpy('function e');
      deck = bespoke.from(parentNode, [
        markdown({
          e: aFunc
        })
      ]);

      expect(aFunc).toHaveBeenCalledWith(jasmine.any(Object), 15);
    });

    it('should allow metadata defined as an array', function() {
      createSlide('<!-- { "f": [ "123", 456, { "g": 0 } ] } -->\n');
      var aFunc = jasmine.createSpy('function f');
      deck = bespoke.from(parentNode, [
        markdown({
          f: aFunc
        })
      ]);

      expect(aFunc).toHaveBeenCalledWith(jasmine.any(Object), [
        '123',
        456,
        jasmine.objectContaining({ g: 0 })
      ]);
    });

    it(
      'should call the metadata callback function with the first parameter ' +
        'as the slide index',
      function() {
        createSlide('# slide number 0');
        createSlide('# slide number 1');
        createSlide('<!-- { "h": null } -->\n# slide number 2');
        var aFunc = jasmine.createSpy('function h');
        deck = bespoke.from(parentNode, [
          markdown({
            h: aFunc
          })
        ]);

        expect(aFunc).toHaveBeenCalledWith(deck.slides[2], null);
      }
    );

    it(
      'should allow multiple metadata callback functions to be called with ' +
        'their respective arguments',
      function() {
        createSlide('<!-- { "i": 25, "j": "lala" } -->');
        var aFunc = jasmine.createSpy('function i'),
          anotherFunc = jasmine.createSpy('function j');
        deck = bespoke.from(parentNode, [
          markdown({
            i: aFunc,
            j: anotherFunc
          })
        ]);

        expect(aFunc).toHaveBeenCalledWith(jasmine.any(Object), 25);
        expect(anotherFunc).toHaveBeenCalledWith(jasmine.any(Object), 'lala');
      }
    );

    it('should ignore metadata that cannot be parsed', function() {
      createSlide('<!-- { safasdf123123 } -->');
      var aFunc = jasmine.createSpy('function a');
      deck = bespoke.from(parentNode, [
        markdown({
          a: aFunc
        })
      ]);

      expect(aFunc).not.toHaveBeenCalled();
    });

    it(
      'should not throw an error if a metadata function was found for a ' +
        'slide, but a corresponding function was not supplied',
      function() {
        createSlide('<!-- { "f": null } -->\n# t1');
        deck = bespoke.from(parentNode, [markdown({ g: function() {} })]);
        expect(parentNode.firstElementChild.firstElementChild.tagName).toBe(
          'H1'
        );
      }
    );

    it('should delete the metadata node after it has been parsed', function() {
      createSlide('<!-- { "c": 1 } --> # title of slide');
      deck = bespoke.from(parentNode, [markdown()]);
      expect(parentNode.firstChild.firstChild.nodeType).not.toBe(
        Node.COMMENT_NODE
      );
    });

    it(
      'should keep the comment node after it has been parsed if it ' +
        'wasn\'t metadata',
      function() {
        createSlide('<!-- { adfadsfadsfa } -->\n# title of slide');
        deck = bespoke.from(parentNode, [markdown()]);
        expect(parentNode.firstChild.firstChild.nodeType).toBe(
          Node.COMMENT_NODE
        );
      }
    );
  });

  describe('usage of markdown-it plugins', function() {
    beforeEach(createParent);

    it('should allow one plugin to be handed over to markdown-it', function() {
      createSlide('# title with a smile :)');
      var pluginSpy = jasmine.createSpy('plugin function');
      deck = bespoke.from(parentNode, [
        markdown(null, function(markdownit) {
          markdownit.core.ruler.push('smile', pluginSpy);
        })
      ]);

      expect(pluginSpy).toHaveBeenCalled();
    });

    it('should allow an array of plugins to be handed over to markdown-it', function() {
      createSlide('# title with a smile :)');
      var plugin1Spy = jasmine.createSpy('plugin 1 function');
      var plugin2Spy = jasmine.createSpy('plugin 2 function');
      deck = bespoke.from(parentNode, [
        markdown(null, [
          function(markdownit) {
            markdownit.core.ruler.push('smile', plugin1Spy);
          },
          function(markdownit) {
            markdownit.core.ruler.push('sadden', plugin2Spy);
          }
        ])
      ]);

      expect(plugin1Spy).toHaveBeenCalled();
      expect(plugin2Spy).toHaveBeenCalled();
    });

    it(
      'should ignore a passed plugin that was not a function, neither ' +
        'an array',
      function() {
        var originalSlideContent = '# plz write **sthg** interesting _here_';
        createSlide(originalSlideContent);
        deck = bespoke.from(parentNode, [
          markdown(null, 'thisShouldBeAFunction')
        ]);

        expect(deck.slides[0].firstElementChild.innerHTML).not.toEqual(
          originalSlideContent
        );
      }
    );

    it(
      'should allow plugin\'s parameters to be passed if the plugin ' +
        'is passed as an array along with its arguments',
      function() {
        var slideContent = '# hey',
          pluginSpy = jasmine.createSpy();
        createSlide(slideContent);
        deck = bespoke.from(parentNode, [
          markdown(null, [[pluginSpy, 'arg1', 2]])
        ]);

        expect(pluginSpy).toHaveBeenCalled();
      }
    );
  });
});
