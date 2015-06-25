var repos = require('../lib/repos');
var stats = require('../lib/stats');
var db = require('../lib/db');

if (process.argv.length < 4) return console.log("usage: log [user] [repo]");
var user = process.argv[2];
var name = process.argv[3];

console.log('Getting stats for %s/%s...', user, name);

repos.getRepo(user, name, function(err, repo) {
  if (err) return console.log('Error getting repo:', err);
  console.log('git pull %s/%s', user, name);
  stats.getCommits(repo, function(err) {
    if (err) return console.log('Error getting commits for %s:', repo.name, err);
    stats.getTaskStats(repo, function(err) {
      if (err) return console.log('Error getting task stats for %s:', repo.name, err);
      db.close();
    });
  });
});
