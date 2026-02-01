import bespoke from 'bespoke';
import keys from 'bespoke-keys';
import touch from 'bespoke-touch';
import markdownIt from '../lib/bespoke-markdownit-lazy-hljs.js';
import defList from 'markdown-it-deflist';
import classes from 'bespoke-classes';
import progress from 'bespoke-progress';

bespoke.from('article', [
  keys(),
  touch(),
  markdownIt({}, [defList]),
  classes(),
  progress()
]);
