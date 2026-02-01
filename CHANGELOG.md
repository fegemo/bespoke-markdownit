# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-02-01
### Added
- Highlight.js can now lazily load languages as they are seen used. Users should
  inlclude the `bespoke-markdownit-lazy-hljs{.min}.js` to have that feature.

### Changed
- Updated dev dependencies, linting
- The dist file `bespoke-markdownit-nohljs{.min}.js` renamed to `bespoke-markdownit-no-hljs{.min}.js`

## [1.2.0] - 2021-04-26
### Changed
- Updated dev dependencies, upgrading karma and istanbul
- Added `package-lock.json` to the repository

## [1.1.0] - 2019-02-26
### Added
- This changelog.
- Prettier configuration.

### Changed
- Updated all dependencies and devDependencies to their latest version.
- Restricted the highlight.js languages to the subset of [].
- Updated lib code and specs to ES2015+.
- Changed phantomjs for headless chrome and puppeteer for running tests.

### Removed
- Bower support (very few people using it).

## 1.0.0 - 2017-11-01
### Added
- Initial version.

[Unreleased]: https://github.com/fegemo/bespoke-markdownit/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/fegemo/bespoke-markdownit/compare/v1.1.0...v1.0.0
