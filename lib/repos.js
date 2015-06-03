var fs   = require('fs'),
    path = require('path'),
    GitHubApi  = require('github'),
    _          = require('lodash'),
    async      = require('async'),
    prompt     = require('prompt'),
    git        = require('simple-git')(__dirname),
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
var reposFile = path.resolve(reposDir, "repos.json");


var authGithub = function(cb) {
  fs.readFile(path.resolve(__dirname, "..", ".github"), function(err, data) {
    if (err) return cb(err);
    github.authenticate(JSON.parse(data));
    cb(null);
  });
  // Do prompt and go!
  // prompt.message = 'github';
  // prompt.start();
  // var schema = {
  //   properties: {
  //     username: {
  //       required: true
  //     },
  //     password: {
  //       hidden: true,
  //       required: true
  //     }
  //   }
  // };
  // prompt.get(schema, function (err, result) {
  //   github.authenticate({
  //       type: "basic",
  //       username: result.username,
  //       password: result.password
  //   });
  //   cb();
  // });
};

var getTopRepos = function(cb) {
  github.search.repos({
    q: 'stars:>5000',
    sort: 'stars',
    order: 'desc',
    per_page: 60
  }, function(err, res) {
    cb(err, res.items);
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
  // Make sure our repos dir exists
  console.log("Checking if " + reposDir + " exists");
  if (!exists()){
      console.log('Creating ', reposDir);
      fs.mkdirSync(reposDir);
  }

  authGithub(function() {
    getTopRepos(function(err, repos) {
      if (err) return cb(err);
      writeReposFile(cb);
    });
  });
};

var writeReposFile = function(cb) {
  async.mapSeries(repos, function(repo, cb) {
    setTimeout(function() {
      getNumTODOs(repo.full_name, function(err, num) {
        cb(err, _.assign(repo, {todos:num}));
      });
    }, 2000);
  }, function(err, results) {
    if (err) return cb(err);
    results = _.filter(results, function(repo) { return repo.todos > 9; });
    var sorted = _.sortByOrder(results, ['todos', 'watchers'], [false, true]);
    fs.writeFileSync(reposFile, JSON.stringify(sorted, null, 3));
    cb(null, sorted);
  });
};

/*
  update: boolean - update with latest repo info from github
*/
var getRepos = function(update, cb) {
  var after = function(cb) {
    fs.readFile(reposFile, function (err, data) {
      if (err) return cb(err);
      cb(null, JSON.parse(data));
    });
  };

  if (_.isFunction(update)) return after(cb);
  after(function(err, repos) {
    if (err) return cb(err);
    authGithub(function(err) {
      if (err) return cb(err);
      async.mapSeries(repos, function(repo, cb) {
        github.repos.get({ user: repo.owner.login, repo: repo.name }, function(err, data) {
          cb(null, data);
        });
      }, function(err, results) {
        if (err) return cb(err);
        cb(null, results);
      });
    });

    // DOING:0 Update the repos file with the latest from github
  })
};

var getRepoPath = function(repo) {
  return path.resolve(reposDir, repo.name);
};

var exists = function(repo) {
  if (repo) return fs.existsSync(path.resolve(reposDir, repo.name))
  return fs.existsSync(reposFile);
};

module.exports = {
  exists: exists,
  getRepoPath: getRepoPath,
  getRepos: getRepos,
  createReposFile: createReposFile
};
