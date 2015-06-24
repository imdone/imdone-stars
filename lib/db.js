var mongojs = require('mongojs');

var db = mongojs('imdone-stars', ['imdone_stats']);
var imdone_stats = db.collection('imdone_stats');

module.exports = {
  saveStats: function(stats, cb) {
    return imdone_stats.insert(stats, function(err) {
      if (err) return cb(err);
      return cb(null, stats);
    });
  },

  getStats: function(qry, cb) {
    return imdone_stats.findOne(qry, cb);
  },

  close: function() {
    db.close();
  }
};
