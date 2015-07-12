var fs   = require('fs'),
    path = require('path'),
    GitHubApi  = require('github'),
    _          = require('lodash'),
    async      = require('async'),
    git        = require('gift'),
    fs         = require('fs'),
    util       = require('util');

var github = new GitHubApi({
    // required
    version: "3.0.0",
    headers: {
        "user-agent": "imdone-stars" // GitHub is happy with a unique user agent
    }
});

var reposDir = path.resolve(__dirname, "..", "repos");
var dataDir = path.resolve(__dirname, "..", "data");
var reposFile = path.resolve(dataDir, "repos.json");

var authGithub = function(cb) {
  fs.readFile(path.resolve(__dirname, "..", ".github"), function(err, data) {
    if (err) return cb(err);
    github.authenticate(JSON.parse(data));
    cb(null);
  });
};

var getTopRepos = function(cb) {
  authGithub(function() {
    github.search.repos({
      q: 'stars:>5000',
      sort: 'stars',
      order: 'desc',
      per_page: 60
    }, function(err, res) {
      if (err) return cb(err);
      async.mapSeries(res.items, function(repo, cb) {
        setTimeout(function() {
          getNumTODOs(repo.full_name, function(err, num) {
            cb(err, _.assign(repo, {todos:num}));
          });
        }, 2000);
      }, function(err, results) {
        if (err) return cb(err);
        repos = _.filter(results, function(repo) { return repo.todos > 9; });
        cb(null, repos);
      });
    });
  });
};

var getNumTODOs = function(repo, cb) {
  console.log('Searching for TODO in:', repo);
  github.search.code({
    q: 'q=TODO+repo:' + repo
  }, function(err, res) {
    if (err) return cb(err);
    cb(null, res.total_count);
  });
};

var createReposFile = function(cb) {
  getTopRepos(function(err, repos) {
    if (err) return cb(err);
    writeReposFile(repos, cb);
  });
};

var writeReposFile = function(repos, cb) {
  // Make sure our repos dir exists
  console.log("Checking if " + reposDir + " exists");
  if (!exists()){
      console.log('Creating ', reposDir);
      fs.mkdirSync(reposDir);
  }
  var sorted = _.sortByOrder(repos, ['watchers'], [false, true]);
  fs.writeFile(reposFile, JSON.stringify(repos, null, 3), function(err) {
    cb(err, sorted);
  });
};

var getGithubRepo = function(owner, repoName, cb) {
  github.repos.get({ user: owner, repo: repoName }, cb);
};

/*
  update: boolean - update with latest repo info from github
*/
var getRepos = function(update, cb) {
  var after = function(err, repos) {
    if (err) return cb(err);
    cb(null, _.map(repos, function(repo) {
      return _.extend(git(getRepoPath(repo)), repo);
    }));
  };

  var read = function(cb) {
    fs.readFile(reposFile, function (err, data) {
      if (err) return cb(err);
      after(null, JSON.parse(data));
    });
  };

  if (_.isFunction(update)) {
    cb = update;
    return read(update);
  }

  read(function(err, repos) {
    if (err) return cb(err);
    authGithub(function(err) {
      if (err) return cb(err);
      async.mapSeries(repos, function(repo, cb) {
        getGithubRepo(repo.owner.login, repo.name, cb);
      }, function(err, results) {
        if (err) return cb(err);
        writeReposFile(results, after);
      });
    });

    // #DONE:0 Update the repos file with the latest from github
  })
};

var getRepo = function(fullName, cb) {
  getRepos(function(err, repos) {
    if (err) return cb(err);
    cb(null,_.find(repos, function(repo) {
      return (fullName === repo.full_name);
    }));
  });
};

var getRepoPath = function(repo) {
  return path.resolve(reposDir, repo.name);
};

var exists = function(repo) {
  if (repo) return fs.existsSync(path.resolve(reposDir, repo.name))
  return fs.existsSync(reposFile);
};

var pull = function(repo, cb) {
  repo.pull(cb);
};

var clone = function(repo, cb) {
  git.clone(repo.clone_url, getRepoPath(repo), cb);
};

var log = function(repo, limit, ascending, cb) {
  if (_.isFunction(ascending)) {
    cb = ascending;
    ascending = true;
  } else if (_.isFunction(limit)) {
    cb = limit;
    limit = -1;
    ascending = true;
  }
  repo.commits(repo.default_branch, limit, function(err, data) {
    if (err) return cb(err);
    debugger;
    cb(null, data.sort(function(a,b) {
      if (ascending) return b.committed_date - a.committed_date;
      return a.committed_date - b.committed_date;
    }));
  });
};

module.exports = {
  exists: exists,
  getGithubRepo: getGithubRepo,
  getRepoPath: getRepoPath,
  getRepos: getRepos,
  getRepo: getRepo,
  createReposFile: createReposFile,
  writeReposFile: writeReposFile,
  clone: clone,
  pull: pull,
  log: log
};
