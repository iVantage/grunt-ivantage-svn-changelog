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
    },

    bump: {
      options: {
        commitMessage: 'chore: Bump for release (v%VERSION%)',
        files: ['package.json'],
        commitFiles: ['-a'],
        push: false
      }
    },
    
   //  var findup = require('findup-sync');
// 
// 	// Start looking in the CWD.
// 	var filepath1 = findup('package.json');
// 
// 	// Start looking somewhere else, and ignore case (probably a good idea).
// 	var filepath2 = findup('package.json', {cwd: '/grunt-ivantage-svn-changelog/package.json', nocase: true});

	var pkginfo = require('pkginfo')(module, 'version');
  
	console.dir(module.exports);
    
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-bump');

  grunt.registerTask('default', ['jshint']);
};
