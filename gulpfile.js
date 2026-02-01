import { src, dest, series, parallel, watch } from 'gulp';
import terser from 'gulp-terser';
import header from 'gulp-header';
import rename from 'gulp-rename';
import eslint from 'gulp-eslint-new';
import buffer from 'vinyl-buffer';
import connect from 'gulp-connect';
import coverallsPlugin from '@kollavarsham/gulp-coveralls';
import source from 'vinyl-source-stream';

import { deleteAsync as del } from 'del';
import ghpages from 'gh-pages';
import browserify from 'browserify';
import esmify from 'esmify';

import karmaPkg from 'karma';
const { config: karmaConfig, Server: KarmaServer } = karmaPkg;
import path from 'path';
import { readFileSync, promises as fs } from 'fs';
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

import { generateMapping } from './tool/map-aliases-to-hljsfiles.js';

async function clean() {
  return del(['dist', 'test/coverage']);
}

function lint() {
  return src(['gulpfile.js', 'lib/**/*.js', 'test/spec/**/*.js'])
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
}

async function testFn() {
  const parseConfig = karmaConfig.parseConfig;
  const karmaCfg = await parseConfig(path.resolve('karma.conf.cjs'), null, {
    promiseConfig: true,
    throwErrors: true
  });

  await new Promise((resolve, reject) => {
    const server = new KarmaServer(karmaCfg, exitCode => {
      resolve();
    });
    server.start();
  });
}

function coverageReport() {
  return src(['test/coverage/**/lcov.info']).pipe(coverallsPlugin());
}

function compile() {
  return browserify({ debug: true, standalone: 'bespoke.plugins.markdownIt' })
    .add('./lib/bespoke-markdownit.js')
    .plugin(esmify)
    .bundle()
    .pipe(source('bespoke-markdownit.js'))
    .pipe(buffer())
    .pipe(header([
      '/*!',
      ' * <%= name %> v<%= version %> (with highlight.js with all languages supported)',
      ' *',
      ' * Copyright <%= new Date().getFullYear() %>, <%= author.name %>',
      ' * This content is released under the <%= license %> license',
      ' */\n\n'
    ].join('\n'), pkg))
    .pipe(dest('dist'))
    .pipe(rename('bespoke-markdownit.min.js'))
    .pipe(terser({
      ecma: 8,
      compress: {
        unsafe: true,
        arguments: true,
        drop_console: true
      }
    }))
    .pipe(header(['/*! <%= name %> v<%= version %> ', '© <%= new Date().getFullYear() %> <%= author.name %>, ', '<%= license %> License */\n'].join(''), pkg))
    .pipe(dest('dist'))
    .pipe(connect.reload());
}

function compileNoHljs() {
  return browserify({ debug: true, standalone: 'bespoke.plugins.markdownIt' })
    .add('./lib/bespoke-markdownit-no-hljs.js')
    .plugin(esmify)
    .bundle()
    .pipe(source('bespoke-markdownit-no-hljs.js'))
    .pipe(buffer())
    .pipe(header([
      '/*!',
      ' * <%= name %> v<%= version %> (no highlight.js)',
      ' *',
      ' * Copyright <%= new Date().getFullYear() %>, <%= author.name %>',
      ' * This content is released under the <%= license %> license',
      ' */\n\n'
    ].join('\n'), pkg))
    .pipe(dest('dist'))
    .pipe(rename('bespoke-markdownit-no-hljs.min.js'))
    .pipe(terser({
      ecma: 8,
      compress: {
        unsafe: true,
        arguments: true,
        drop_console: true
      }
    }))
    .pipe(header(['/*! <%= name %> v<%= version %> ', '© <%= new Date().getFullYear() %> <%= author.name %>, ', '<%= license %> License */\n'].join(''), pkg))
    .pipe(dest('dist'))
    .pipe(connect.reload());
}

function compileLazyHljs() {
  return browserify({ debug: true, standalone: 'bespoke.plugins.markdownIt' })
    .add('./lib/bespoke-markdownit-lazy-hljs.js')
    .plugin(esmify)
    .bundle()
    .pipe(source('bespoke-markdownit-lazy-hljs.js'))
    .pipe(buffer())
    .pipe(header([
      '/*!',
      ' * <%= name %> v<%= version %> (lazily load languages with highlight.js)',
      ' *',
      ' * Copyright <%= new Date().getFullYear() %>, <%= author.name %>',
      ' * This content is released under the <%= license %> license',
      ' */\n\n'
    ].join('\n'), pkg))
    .pipe(dest('dist'))
    .pipe(rename('bespoke-markdownit-lazy-hljs.min.js'))
    .pipe(terser({
      ecma: 8,
      compress: {
        unsafe: true,
        arguments: true,
        drop_console: true
      }
    }))
    .pipe(header(['/*! <%= name %> v<%= version %> ', '© <%= new Date().getFullYear() %> <%= author.name %>, ', '<%= license %> License */\n'].join(''), pkg))
    .pipe(dest('dist'))
    .pipe(connect.reload());
}

function compileDemo() {
  return browserify({ debug: true })
    .add('demo/demo.js')
    .plugin(esmify)
    .bundle()
    .pipe(source('demo.bundled.js'))
    .pipe(dest('demo'))
    .pipe(connect.reload());
}

function devFn() {
  const port = 8085;

  watch('lib/**/*.js', series(lint, compile, compileNoHljs, compileLazyHljs, compileDemo, test));
  watch('test/spec/**/*.js', test);

  connect.server({
    root: ['demo', 'lib'],
    livereload: true,
    port
  });
}

function deploy(cb) {
  ghpages.publish(path.join(process.cwd(), 'demo'), cb);
}

async function aliasMap() {
  const mapping = await generateMapping();
  await fs.mkdir('data', { recursive: true });
  await fs.writeFile(
    'data/hljs-alias-to-file.json',
    JSON.stringify(mapping, null, 2)
  );
}

export const test = series(lint, testFn);
export const build = series(lint, parallel(aliasMap, compile, compileNoHljs, compileLazyHljs));
export const dev = series(parallel(aliasMap, compile, compileNoHljs, compileLazyHljs, compileDemo), devFn);
export const coveralls = series(test, coverageReport);
export { clean, lint, compile, compileNoHljs, compileLazyHljs, compileDemo, deploy, aliasMap };