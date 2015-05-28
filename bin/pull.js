var git = require('simple-git');
var path = require('path');
var repoPath = path.resolve(process.argv[2]);
console.log(repoPath);
git(repoPath).pull(function(err, update) {
  console.log('err:', err);
  console.log('update:', update);
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

});
