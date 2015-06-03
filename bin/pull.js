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
var getUpdate = function(update) {
  var _update;
  if (update.files) {
    _update = {
      files: [],
      summary: update.summary
    }
    update.files.forEach(function(file) {
      var _file = { path: file.trim()};
      if (update.insertions[file]) _file.insertions = update.insertions[file];
      if (update.deletions[file]) _file.deletions = update.deletions[file];
      _update.files.push(_file);
    });
  }

  return _update;
};

repos.getRepos(function(err, _repos) {
  async.eachSeries(_repos, function(repo, cb) {
    if (startAt && repo.name !== startAt) {
      console.log('skipping repo:', repo.name);
      return cb(null, 'skipping repo:', repo.name);
    }
    startAt = false;
    if (!repos.exists(repo)) return cb(null, "repo: " + repo + " does not exist");
    var repoPath = repos.getRepoPath(repo);
    var imdoneRepo = new FsStore(new Repo(repoPath));
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

    console.log('git pull', repo.full_name);
    git(repoPath).pull(function(err, update) {
      if (err) console.log('pull failed:', err);
      var stats = {
        createdAt: now,
        github_id: repo.id,
        repo_name: repo.full_name,
        lists: [],
        files: [],
        update: getUpdate(update)
      };

      console.log("Initializing imdone with %s", repo.name);
      imdoneRepo.init(function(err, files) {
        if (err) return cb(err);
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

        pulls.insert(stats, function(err) {
          if (err) {
            console.log(err);
            return cb(err);
          }
          console.timeEnd(repo.name);
          cb(null, repo.name);
        });
      });

    });
  }, function(err, results) {
    if (err) console.log(err);
    process.exit();
  });
});
