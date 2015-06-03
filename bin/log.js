var git = require('gift');
var path = require('path');
var _ = require('lodash');

var repoDir = path.resolve(__dirname, "..", "repos", "ionic");
var repo = git(repoDir);
repo.commits("master", 20, function(err, data) {
  console.log(_.sortByOrder(data, ['committed_date:'], [false]));
});
