const puppeteer = require('puppeteer');
const esmify = require('esmify');

process.env.CHROME_BIN = puppeteer.executablePath();

module.exports = function(config) {
  config.set({
    basePath: '',

    frameworks: ['jasmine', 'browserify'],

    browserify: {
      plugin: [esmify]
    },

    files: [
      {
        pattern: 'test/fixtures/*',
        included: false,
        served: true
      },
      'test/spec/*Spec.js',
      'lib/**/*.js'
    ],

    exclude: [],

    preprocessors: {
      'test/spec/*.js': 'browserify',
      'lib/*.js': ['browserify', 'coverage']
    },

    reporters: ['progress', 'coverage'],

    coverageReporter: {
      type: 'lcov',
      dir: 'test/coverage',
      instrumenterOptions: {
        istanbul: { noCompact: true }
      }
    },

    port: 9090,

    logLevel: config.LOG_INFO,

    autoWatch: false,

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      }
    },

    browsers: ['ChromeHeadlessNoSandbox'],

    singleRun: true
  });
};
