var mongojs = require('mongojs');

var db = mongojs('imdone-stars', ['imdone_stats']);
var imdone_stats = db.collection('imdone_stats');

module.exports = {
  saveStats: function(stats, cb) {
    imdone_stats.insert(stats, function(err) {
      if (err) return cb(err);
      cb(null, stats);
    });
  },

  getStats: function(repoName, user, cb) {

  }
}
