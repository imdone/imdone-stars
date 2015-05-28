var Repo        = require('imdone-core/lib/repository'),
    FsStore     = require('imdone-core/lib/mixins/repo-fs-store'),
    path        = require('path'),
    _           = require('lodash'),
    moment      = require('moment'),
    ProgressBar = require('progress'),
    Table       = require('cli-table'),
    fmt         = require('util').format;

if (process.argv.length < 3) return console.log("Repo Path is required");
var start = moment();
var repoPath = path.resolve(process.argv[2]);

console.log('Loading repo at: ' + repoPath);
var repo = new FsStore(new Repo(repoPath));

var listBar = new ProgressBar('  listing [:bar] :percent :etas', {
  complete: '=',
  incomplete: ' ',
  width: 100,
  total: 100
});
var listTicks = 1;
repo.on('file.processed', function(data) {
  var chunk = data.total/100;
  if (listTicks < 101 && data.processed/listTicks > chunk) {
    listBar.tick();
    listTicks++;
  }
});

var readBar = new ProgressBar('  reading [:bar] :percent :etas', {
  complete: '=',
  incomplete: ' ',
  width: 100,
  total: 100
});
var readTicks = 1;
repo.on('file.read', function(data) {
  var chunk = repo.files.length/100;
  if (readTicks < 101 && data.completed/readTicks > chunk) {
    readBar.tick();
    readTicks++;
  }
});

var table = new Table({
    head: ['List', 'tasks']
  , colWidths: [20, 20]
});

repo.on('initialized', function() {
  console.log(moment().diff(start, 'seconds'));
  repo.getLists().forEach(function(list) {
    var tasks = repo.getTasksInList(list.name);
    table.push([list.name, tasks.length]);
  });
  console.log(table.toString());
});

repo.fileStats(function(err, files) {
  console.log(fmt("Files %d", _.filter(files, {isDir: false}).length));
});

repo.init();