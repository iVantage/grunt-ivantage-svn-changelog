/*
 * grunt-ivantage-svn-changelog
 * https://github.com/iVantage/grunt-ivantage-svn-changelog
 *
 * Copyright (c) 2013 iVantage Health Analytics
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var sh = require('shelljs');

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

  grunt.registerMultiTask('ivantage_svn_changelog', '', function() {

    if(!sh.which('svn')) {
      grunt.fail.fatal('ivantage_svn_changelog requires the svn command line tools');
    }

    var opts = this.options({
      // Available flags
      // - admin
      // - chore
      // - docs
      // - feature
      // - fix
      // - ui
      // - partial
      // - refactor
      // - style
      // - test
      flags: ['feature', 'fix'],

      revFrom: 'LAST_SEMVER_TAG',
      revTo: 'HEAD'
    });

    var revFrom = +getRevFromKey(opts.revFrom)
      , revTo = +getRevFromKey(opts.revTo);

    if(revFrom > 0) {
      var cmd = sh.exec('svn log -r ' + revFrom + ':' + revTo, {silent: true});
      if(cmd.code === 0) {
        var logs = parser.parse(cmd.output);

        // The first line of every message should be of the form:
        // <type>:(<scope>): <summary>
        var ix, firstLine, type, scope, summary;

        var messages = {};

        for(ix = logs.length; ix--;) {
          firstLine = logs[ix].message.split(/\r\n?/)[0];
          type = getCommitHeaderType(firstLine);
          scope = getCommitHeaderScope(firstLine);
          summary = getCommitHeaderSummary(firstLine);

          if(!messages.hasOwnProperty(scope)) {
            messages[scope] = {
              label: scope,
              flags: {}
            };
          }

          if(!messages[scope].flags.hasOwnProperty(type)) {
            messages[scope].flags[type] = [];
          }

          messages[scope].flags[type].push(summary);
        }

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

    //if('LAST_SEMVER_TAG' === revKey) {
    //  var lastSemverTag = getLastSemverTag();
    //  return getRevFromTag(lastSemverTag);
    //}

    // Could be 'TAG:<tag>'
    if(/TAG:.*/.test(revKey + '')) {
      return getRevFromTag(revKey.replace(/^TAG:/, ''));
    }

    // Could just be a number
    if(/\d+/.test(revKey + '')) {
      return revKey;
    }
  };

  getLastSemverTag = function() {
    // Hmmm sever-tags is an async command... use shelljs ;)? Seems like a
    // horrible hack... probably because it would be.
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
    var lines = svnInfo.split(/\r\n?/g), l, ix;
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

