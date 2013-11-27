# Grunt iVantage SVN Changelog

> Build changelogs from your svn commit message history

## Getting Started
This plugin requires Grunt `~0.4.0rc7`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out
the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains
how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as
install and use Grunt plugins. Once you're familiar with that process, you may
install this plugin with this command:

## The "ivantage_svn_changelog" task
In your project's Gruntfile, add a section named `ivantage_svn_changelog` to the
data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  ivantage_svn_changelog: {
    internal_log: {
      options: {
        changesetUrl: 'https://my.hosted-repo.com/changesets/{{revision}}'
      }
    }
  }
});
```

### Options

#### flags
Type: `Array`
Default: `['feature', 'fix']`

Choose the "type" of commits you want rolled into your changelog. Accepted
values include:

- feature
- fix
- style
- docs
- chore
- refactor
- test
- admin
- partial

#### revFrom *and* revTo
Type: `String`/`Integer`
Default: `'LAST_SEMVER_TAG'` *and* `'HEAD'` respectively

These correspond to the bounds of the changelog, i.e. the range of commits to be
included. You may use any actual revision number, e.g. `1204`, or one of the
strings:

- 'HEAD'
- 'LAST_SEMVER_TAG'
- 'LAST_SEMVER_TAG:**num-semver-tags-ago**'
- 'TAG:**your-tag-here**'

The `'LAST_SEMVER_TAG:N'` option is meant to support workflows where the
changelog is built *after* tagging the current version for release. In this case
you would use `'LAST_SEMVER_TAG:2'` to skip over the version you just tagged.

NOTE: Right now the `'LAST_SEMVER_TAG'` option requires a global install of
[semver-tags](https://github.com/jtrussell/semver-tags).

#### changesetUrl
Type: `String`
Default: `'#{{revision}}'`

A URL for your changeset. Use the placeholder '{{revision}}' for the changeset
revision number.

#### outFile
Type: `String`
Default: `'CHANGELOG.md'`

Where to write your changelog to.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality. Lint and test your code
using [Grunt](http://gruntjs.com/).

## License

Copyright (c) 2013 iVantage Health Analytics.
Licensed under the MIT license.

