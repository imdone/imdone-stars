// #DOING:0 Move to lib/repos.js
var async = require('async'),
    repos = require('../lib/repos');
    git   = require('simple-git')(__dirname);

var clone = function(repo, cb) {
  console.log('cloning repo:', repo.name);
  git.clone(repo.clone_url, repos.getRepoPath(repo), cb);
};

var cloneRepos = function(_repos, cb) {
  async.eachSeries(_repos, function(repo, cb) {
    if (repos.exists(repo)) {
      console.log("Repo " + repo.name + " already cloned.");
      return cb(null);
    }
    clone(repo, function(err) {
      if (err) console.log("Error cloning repo for:", repo.name);
      console.log("Done cloning repo:", repo.name);
      cb(null);
    });
  }, function(err, results) {
    cb(err);
  });
};

if (repos.exists()) {
  repos.getRepos(function(err, repos) {
    cloneRepos(repos, function(err) {
      if (err) console.log("Error cloning:", err);
    });
  });
} else {
  repos.createReposFile(function(err, repos) {
    if (err) return console.log("Error creating repos.json", err);
    cloneRepos(repos);
  });
}
