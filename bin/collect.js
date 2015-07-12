var repos = require('../lib/repos');
var stats = require('../lib/stats');
var db = require('../lib/db');
var async = require('async');

function getStats(repo, cb) {
  stats.getCommits(repo, function(err) {
    if (err) return console.log('Error getting commits for %s:', repo.full_name, err);
    stats.getTaskStats(repo, function(err) {
      if (err) return console.log('Error getting task stats for %s:', repo.full_name, err);
      cb();
    });
  });
};


function singleRepo(fullName) {
  console.log('Getting stats for %s...', fullName);
  repos.getRepo(fullName, function(err, repo) {
    if (err) return console.log('Error getting repo:', err);
    getStats(repo, function() {
      db.close();
    });
  });
}

function allRepos() {
  repos.getRepos(function(err, allRepos) {
    if (err) return console.log('Error getting repos:', err);
    // DOING:0 Get stats for all repos in series
    async.eachSeries(allRepos, getStats, function() {
      db.close();
    });
  });
}

if (process.argv.length < 3) return allRepos();
singleRepo(process.argv[2]);
