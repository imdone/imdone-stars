var GitHubApi  = require('github'),
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

var reposDir = __dirname + "/repos";
var reposFile = __dirname + "/repos.json";

var authGithub = function(cb) {
  // Do prompt and go!
  prompt.message = 'github';
  prompt.start();
  var schema = {
    properties: {
      username: {
        required: true
      },
      password: {
        hidden: true,
        required: true
      }
    }
  };
  prompt.get(schema, function (err, result) {
    github.authenticate({
        type: "basic",
        username: result.username,
        password: result.password
    });
    cb();
  });
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
  if (!fs.existsSync(reposDir)){
      console.log('Creating ', reposDir);
      fs.mkdirSync(reposDir);
  }

  authGithub(function() {
    getTopRepos(function(err, repos) {
      if (err) return cb(err);
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
    });
  });
};

var clone = function(repo, cb) {
  console.log('cloning repo:', repo.name);
  git.clone(repo.clone_url, getRepoPath(repo), cb);
};

var cloneRepos = function(repos, cb) {
  async.eachSeries(repos, function(repo, cb) {
    fs.exists(getRepoPath(repo), function(exists) {
      if (exists) {
        console.log("Repo " + repo.name + " already cloned.");
        return cb(null);
      }
      clone(repo, function(err) {
        if (err) console.log("Error cloning repo for:", repo.name);
        console.log("Done cloning repo:", repo.name);
        cb(null);
      });
    })
  }, function(err, results) {
    cb(err);
  });
};

var readReposFile = function(cb) {
  fs.readFile(reposFile, function (err, data) {
    if (err) return cb(err);
    cb(null, JSON.parse(data));
  });
};

var getRepoPath = function(repo) {
  return reposDir + "/" + repo.name;
};

if (fs.existsSync(reposFile)) {
  readReposFile(function(err, repos) {
    cloneRepos(repos, function(err) {
      if (err) console.log("Error cloning:", err);
    });
  });
} else {
  createReposFile(function(err, repos) {
    if (err) return console.log("Error creating repos.json", err);
    cloneRepos(repos);
  });
}
