var GitHubApi  = require('github'),
    _          = require('lodash'),
    async      = require('async'),
    prompt     = require('prompt'),
    git        = require('gift');

var github = new GitHubApi({
    // required
    version: "3.0.0",
    headers: {
        "user-agent": "imdone-stars" // GitHub is happy with a unique user agent
    }
});

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
  go();
});

var getTopRepos = function(cb) {
  github.search.repos({
    q: 'stars:>5000',
    sort: 'stars',
    order: 'desc',
    per_page: 60
  }, function(err, res) {
    if (err) return cb(err);
    cb(null,_.map(res.items, function(item) {
      return _.pick(item,['name', 'full_name', 'watchers']);
    }));
  });
};

var getNumTODOs = function(repo, cb) {
  github.search.code({
    q: 'q=TODO+repo:' + repo
  }, function(err, res) {
    if (err) return cb(err);
    cb(null, res.total_count);
  });
};


var go = function() {
  getTopRepos(function(err, repos) {
    console.log(JSON.stringify(repos, null, 3));
    if (err) return console.log('Unable to get Top repos', err);
    async.mapSeries(repos, function(repo, cb) {
      setTimeout(function() {
        getNumTODOs(repo.full_name, function(err, num) {
          cb(err, _.assign(repo, {todos:num}));
        });
      }, 2000);
    }, function(err, results) {
      if (err) return console.log(err);
      results = _.filter(results, function(repo) { return repo.todos > 9; });
      var sorted = _.sortByOrder(results, ['todos', 'watchers'], [false, true]);
      console.log(JSON.stringify(sorted, null, 3));
    });
  });
};

