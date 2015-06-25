var repos = require('./repos');
var db = require('./db');
var moment = require('moment');
var _ = require('lodash');
var async = require('async');
var imdone = require('./imdone');

function processCommits(commits, cb) {
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
      cb(err);
    });
  });
}

function processLog(repo, cb) {
  var now = moment();
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
    processCommits(commitsLastYear, cb);
  });
}

// Exported methods ----------------------------------------------------------------------
module.exports = {
  getCommits: function(repo, cb) {
    console.log('Getting commits for %s/%s...', repo.owner.login, repo.name);
    repo.pull(function(err, resp) {
      if (err) {
        console.log('Error pulling repo:', err);
        return cb(err);
      }
      console.log('git log %s/%s', repo.owner.login, repo.name);
      processLog(repo, cb);
    });
  },

  getTaskStats: function(repo, cb) {
    db.getIncompleteCommits(repo, function(err, commits) {
      if (err) return cb(err);
      async.eachSeries(commits, function(commit, cb) {
        repo.checkout(commit.lastHash, function() {
            imdone.getTasks(repo, function(err, stats) {
              if (err) return cb(err);
              console.log('Updating stats for %s %s', repo.full_name, commit.lastHash);
              db.updateStats(commit, stats, cb);
            });
        });
      }, function(err) {
        if (err) return cb(err);
        console.log('Done updating stats for %s', repo.full_name);
        cb();
      });
    });
  }
}
