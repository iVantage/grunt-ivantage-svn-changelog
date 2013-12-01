/*
 * grunt-ivantage-svn-changelog
 * https://github.com/iVantage/grunt-ivantage-svn-changelog
 *
 * Copyright (c) 2013 iVantage Health Analytics
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var sh = require('shelljs')
    , Handlebars = require('handlebars');

  var getHeadRev
    , getRevFromKey
    , getRevFromTag
    , getRevFromSvnInfo
    , getLastSemverTag;

  var getCommitHeaderType
    , getCommitHeaderScope
    , getCommitHeaderSummary;

  var Parser = require('svn-log-parse').Parser
    , parser = new Parser();

  var changelogTpl = Handlebars.compile(grunt.file.read(__dirname + '/../assets/changeset.md.handlebars'));

  grunt.registerMultiTask('ivantage_svn_changelog', 'Build changelogs from your svn commit message history', function() {

    if(!sh.which('svn')) {
      grunt.fail.fatal('ivantage_svn_changelog requires the svn command line tools');
    }

    // Note the final changelog will honor this order
    var allFlags = [
      'feature',
      'fix',
      'style',
      'docs',
      'chore',
      'refactor',
      'test',
      'admin',
      'partial'
    ];

    var opts = this.options({
      // See the `allFlags` var
      flags: ['feature', 'fix'],

      revFrom: 'LAST_SEMVER_TAG',
      revTo: 'HEAD',

      // Should be a beanstalk(?) changeset url with a placeholder for the
      // revision number
      changesetUrl: '#{{revision}}',

      outFile: 'CHANGELOG.md'
    });

    var revFrom = +getRevFromKey(opts.revFrom)
      , revTo = +getRevFromKey(opts.revTo);

    // Makes sure we only get legal flags
    opts.flags = opts.flags.filter(function(f) {
      return -1 !== allFlags.indexOf(f);
    });

    if(revFrom > 0) {
      var cmd = sh.exec('svn log -r ' + revFrom + ':' + revTo, {silent: true});
      if(cmd.code === 0) {
        var logs = parser.parse(cmd.output);

        // The first line of every message should be of the form:
        // <type>:(<scope>): <summary>
        var ix, firstLine, type, scope, summary, revision;

        var scopes = [], messages = {};

        var initScopeFlags = function(scope) {
          allFlags.forEach(function(f) {
            messages[scope].flags[f] = [];
          });
        };

        for(ix = logs.length; ix--;) {
          firstLine = logs[ix].message.split(/\r?\n/)[0];
          type = getCommitHeaderType(firstLine);
          scope = getCommitHeaderScope(firstLine);
          summary = getCommitHeaderSummary(firstLine);
          revision = logs[ix].revision.replace(/^r/, '');

          if(-1 !== opts.flags.indexOf(type)) {
            if(!messages.hasOwnProperty(scope)) {
              messages[scope] = {
                label: scope,
                flags: {}
              };

              // Make sure these are added in sorted order
              initScopeFlags(scope);
            }

            messages[scope].flags[type].push({
              summary: summary,
              revision: revision,
              changeset: opts.changesetUrl.replace('{{revision}}', revision)
            });
          }

        }

        // We had to add all flags to keep their order - now go through and
        // clear out the empty ones
        Object.keys(messages).forEach(function(scope) {
          var ix, f;
          for(ix = allFlags.length; ix--;) {
            f = allFlags[ix];
            if(0 === messages[scope].flags[f].length) {
              delete messages[scope].flags[f];
            }
          }
        });

        var messagesSorted = {};

        // Sort our scopes so we get consistent output, there's no
        // good/gaurenteed way to sort object keys so... just create a new
        // object and assign it keys in alpha order
        Object.keys(messages).forEach(function(scope) {
          messagesSorted[scope] = messages[scope];
        });

        var changelogMd = changelogTpl({
          messages: messagesSorted,
          revFrom: revFrom,
          revTo: revTo
        });
        grunt.file.write(opts.outFile, changelogMd);

        grunt.log.ok('CHANGELOG written to: ' + opts.outFile);

        return;
      }
    }
    grunt.fail.fatal('Could not resolve ' + revFrom + ' to a revision number');

  });

  getRevFromKey = function(revKey) {
    // Could be:
    // - 'HEAD'
    // - TAG:<tag name>
    // - 'LAST_SEMVER_TAG'
    // - an actual revision number

    // Could be 'HEAD'
    if('HEAD' === revKey) {
      return getHeadRev();
    }

    if(/LAST_SEMVER_TAG/.test(revKey+'')) {
      var parts = revKey.split(':')
        , numTagsAgo = parts.length === 2 ? parts[1] : 1;
      var lastSemverTag = getLastSemverTag(numTagsAgo);
      return getRevFromTag(lastSemverTag);
    }

    // Could be 'TAG:<tag>'
    if(/TAG:.*/.test(revKey + '')) {
      return getRevFromTag(revKey.replace(/^TAG:/, ''));
    }

    // Could just be a number
    if(/\d+/.test(revKey + '')) {
      return revKey;
    }
  };

  getLastSemverTag = function(numTagsAgo) {
    var cmd = sh.exec('node "'  + __dirname + '/../util/last-semver-tag.js" ' + numTagsAgo, {silent: true});
    if(cmd.code === 0) {
      var tag = cmd.output.trim();
      if(tag.length) {
        return tag;
      }
    }
    grunt.fail.fatal('Ouch, could not get your last semver tag');
  };

  getHeadRev = function() {
    var cmd = sh.exec('svn info -r HEAD', {silent: true});
    if(cmd.code === 0) {
      return getRevFromSvnInfo(cmd.output);
    } else {
      grunt.fail.fatal('Could not get rev number for HEAD');
    }
  };

  getRevFromTag = function(tag) {
    var cmd = sh.exec('svn info "^/tags/' + tag + '"', {silent: true});
    if(cmd.code === 0) {
      return getRevFromSvnInfo(cmd.output);
    } else {
      grunt.fail.fatal('Could not get rev number for tag ' + tag);
    }
  };

  getRevFromSvnInfo = function(svnInfo) {
    var lines = svnInfo.split(/\r?\n/g), l, ix;
    for(ix = lines.length; ix--;) {
      l = lines[ix].split(':');
      if(l.length === 2) {
        if(l[0].trim() === 'Last Changed Rev') {
          return +l[1].trim();
        }
      }
    }
    return -1;
  };

  getCommitHeaderType = function(header) {
    var parts = header.split(':');
    return parts[0].replace(/\(.*/, '').trim();
  };

  getCommitHeaderScope = function(header) {
    var parts = header.split(':')
      , scope = parts[0];

    if(-1 === scope.indexOf('(') || -1 === scope.indexOf(')')) {
      return 'misc';
    }

    scope = scope
      .replace(/.*\(/, '')
      .replace(/\).*/, '')
      .trim();

    return scope.length ? scope : 'misc';
  };

  getCommitHeaderSummary = function(header) {
    var parts = header.split(':');
    return parts.length === 2 ? parts[1].trim() : '';
  };

};

