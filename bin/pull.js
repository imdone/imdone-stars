var Repo    = require('imdone-core/lib/repository'),
    repos   = require('../lib/repos'),
    async   = require('async'),
    _       = require('lodash'),
    FsStore = require('imdone-core/lib/mixins/repo-fs-store'),
    git     = require('simple-git'),
    moment  = require('moment'),
    mongojs = require('mongojs');

var db = mongojs('imdone-stars', ['pulls']);
var pulls = db.collection('pulls');
var now = new Date().getTime();
var startAt = (process.argv.length > 2) && process.argv[2];
repos.getRepos(function(err, _repos) {
  async.eachSeries(_repos, function(repo, cb) {
    if (startAt && repo.name !== startAt) {
      console.log('skipping repo:', repo.name);
      return cb(null, 'skipping repo:', repo.name);
    }
    startAt = false;
    if (!repos.exists(repo)) return cb(null, "repo: " + repo + " does not exist");
    var imdoneRepo = new FsStore(new Repo(repos.getRepoPath(repo)));
    console.log("Initializing imdone with %s", repo.name);
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
      process.stdout.write('\n');
      var stats = {
        createdAt: now,
        id: repo.id,
        repo: repo.name,
        lists: [],
        files: []
      };

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

      pulls.insert(stats, function(err) {
        if (err) {
          console.log(err);
          return cb(err);
        }
        console.timeEnd(repo.name);
        cb(null, repo.name);
      });
    });
  }, function(err, results) {
    if (err) console.log(err);
    process.exit();
  });
});

// git(repoPath).pull(function(err, update) {
//   console.log('err:', err);
//   console.log('update:', update);
// update: { files:
//    [ 'spec/text-editor-spec.coffee                      ',
//      'src/lines-component.coffee                        ',
//      'src/token.coffee                                  ',
//      'src/tokenized-buffer.coffee                       ',
//      'src/tokenized-line.coffee                         ' ],
//   insertions:
//    { 'spec/text-editor-spec.coffee                      ': 7,
//      'src/lines-component.coffee                        ': 4,
//      'src/token.coffee                                  ': 1,
//      'src/tokenized-buffer.coffee                       ': 3,
//      'src/tokenized-line.coffee                         ': 14 },
//   deletions:
//    { 'spec/text-editor-spec.coffee                      ': 394,
//      'src/lines-component.coffee                        ': 154,
//      'src/token.coffee                                  ': 198,
//      'src/tokenized-buffer.coffee                       ': 193,
//      'src/tokenized-line.coffee                         ': 559 },
//   summary: { changes: 50, insertions: 1255, deletions: 952 } }

// });
