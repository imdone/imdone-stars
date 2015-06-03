var mongojs = require('mongojs');
    db      = mongojs('imdone-stars', ['pulls']),
    repos   = require('../lib/repos'),
    pulls   = db.collection('pulls');

repos.getRepos(true, function(err, repos) {
  if (err) return console.log(err);
  console.log(repos);
});
