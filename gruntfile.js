/*
 * grunt-ivantage-svn-changelog
 * https://github.com/iVantage/grunt-ivantage-svn-changelog
 *
 * Copyright (c) 2013 iVantage Health Analytics
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'gruntfile.js',
        'tasks/*.js'
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('default', ['jshint']);
};
