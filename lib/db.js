var mongojs = require('mongojs');
var _ = require('lodash');
var db = mongojs('imdone-stars', ['imdone_stats']);
var imdone_stats = db.collection('imdone_stats');

module.exports = {
  saveStats: function(stats, cb) {
    return imdone_stats.insert(stats, function(err) {
      if (err) return cb(err);
      return cb(null, stats);
    });
  },

  updateStats: function(stats, updates, cb) {
    imdone_stats.update({repoId: stats.repoId, lastHash: stats.lastHash}, {$set:updates}, cb);
  },

  getStats: function(qry, coll, cb) {
    if (_.isFunction(coll)) return imdone_stats.findOne(qry, coll);
    return imdone_stats.find(qry, cb);
  },

  getIncompleteCommits: function(repo, cb) {
    return this.getStats({
      $query: {
        repoId: repo.id,
        lists:{$exists: false},
        files:{$exists: false}
      },
      $orderBy: {date: 1}
    }, true, cb);
  },

  close: function() {
    db.close();
  }
};
