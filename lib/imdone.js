var Repo    = require('imdone-core/lib/repository'),
    repos   = require('../lib/repos');,
    _       = require('lodash'),
    FsStore = require('imdone-core/lib/mixins/repo-fs-store'),
    moment  = require('moment'),
    mongojs = require('mongojs');

module.exports = {
  getTasks: function(repo, cb) {
    var imdoneRepo = new FsStore(new Repo(repo.path));
    console.time(repo.name);

    var listTicks = 1;
    var listCount = 0;
    imdoneRepo.on('file.processed', function(data) {
      if (listCount === 0) process.stdout.write('Processing files');
      listCount++;
      var chunk = data.total/100;
      if (listTicks < 101 && data.processed/listTicks > chunk) {
        process.stdout.write('.');
        listTicks++;
      }
    });

    var readTicks = 1;
    var readCount = 0;
    imdoneRepo.on('file.read', function(data) {
      if (readCount === 0) process.stdout.write('\nReading files');
      readCount++;
      var chunk = imdoneRepo.files.length/100;
      if (readTicks < 101 && data.completed/readTicks > chunk) {
        process.stdout.write('.');
        readTicks++;
      }
    });

    imdoneRepo.init(function(err, files) {
      if (err) return cb(err);
      var stats = { files: [], lists:[] };
      process.stdout.write('\n');

      imdoneRepo.getLists().forEach(function(list) {
        var tasks = imdoneRepo.getTasksInList(list.name);
        var stat = {};
        stat[list.name] = tasks.length;
        stats.lists.push(stat);
      });

      imdoneRepo.getFiles().forEach(function(file) {
        var tasks = _.map(file.getTasks(), function(task) {
          return _.pick(task, 'text', 'list', 'line');
        });
        if (tasks.length > 0) {
          stats.files.push({
            path: file.path,
            tasks: tasks
          });
        }
      });

      cb(null, stats);
    });

  }
};
