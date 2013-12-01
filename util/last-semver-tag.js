// Pretty lame hack - semver-tags is only async right. This scripts lets us use
// shelljs to spoof a sync execution without requiring a global install

var s = require('semver-tags')
  , numTagsAgo = process.argv[2];
  
require('semver-tags')({
  repoType: 'svn',
  last: numTagsAgo,
  first: 1
}, function(err, tags) {
  if(err) {
    process.exit(1);
  }
  console.log(tags[0]);  
});