var repos = require('../lib/repos');
var db = require('../lib/db');
var moment = require('moment');
var _ = require('lodash');
var async = require('async');

if (process.argv.length < 4) return console.log("usage: stats [user] [repo]");
var user = process.argv[2];
var name = process.argv[3];
var now = moment();

function processCommits(commits) {
  async.reject(commits, function(commit, cb) {
    db.getStats({lastHash: commit.lastHash, repoId: commit.repoId}, function(err, doc) {
      if (err) console.log("Error processing commits for: %s", commit.date.toString());
      if (doc !== null) console.log("Stats already exist for lastHash: %s", commit.lastHash);
      cb(doc !== null);
    });
  }, function(commits) {
    async.each(commits, function(commit, cb) {
      db.saveStats(commit, function(err, stats) {
        if (err) console.log("Error saving stats for lastHash: %s", commit.lastHash);
        cb(err);
      });
    }, function(err) {
      db.close();
    });
  });
}

function processLog(repo) {
  repos.log(repo, 10000, true, function(err, commits) {
    if (err) return console.log('Error getting repo log:', err);
    var dailyCommits = [];
    var daysAgoCounter = -1;
    var commitsOnThisDay = 1;
    var defaults = {
      repoId: repo.id,
      fullName: repo.full_name,
      name: repo.name,
      owner: repo.owner.login
    }, data, date;

    commits.forEach(function(commit) {
      date = moment(commit.committed_date).hours(0).minutes(0).seconds(0);
      var daysAgo = now.diff(moment(date), 'days');
      if (daysAgoCounter < 0) daysAgoCounter = daysAgo;
      if (daysAgo > daysAgoCounter) {
        dailyCommits.push(_.clone(data));
        daysAgoCounter = daysAgo;
        commitsOnThisDay = 1;
      }
      data = _.assign(defaults, {
        commits: commitsOnThisDay,
        lastHash: commit.id,
        daysAgo: daysAgoCounter,
        date: date.toDate()
      });
      lastDate = date;
      commitsOnThisDay++;
    });

    dailyCommits.push(_.assign(_.clone(data), {date: date.toDate()}));
    commitsLastYear = _.map(_.reject(dailyCommits, function(commit) { return commit.daysAgo > 365;}),
                            function(commit) { return _.omit(commit, 'daysAgo') });
    // console.log(JSON.stringify(commitsLastYear, null, 3));
    processCommits(commitsLastYear);
  });
}

console.log('Getting stats for %s/%s...', user, name);
repos.getRepo(user, name, function(err, repo) {
  if (err) return console.log('Error getting repo:', err);
  console.log('git pull %s/%s', user, name);
  return repo.pull(function(err, resp) {
    if (err) return console.log('Error pulling repo:', err);
    console.log('git log %s/%s', user, name);
    return processLog(repo);
  });
});
