var fs = require('fs');
var path = require('path');
var jf = require('jsonfile');
var Packages = require('nachos-packages');
var rimraf = require('rimraf');

module.exports = function (src, cb) {
  jf.readFile(path.join(src, 'nachos.json'), function (err, data) {
    if (err) {
      return cb(err);
    }

    var packages = new Packages();

    packages.getFolderByType(data.type, function (err, folderPath) {
      if (err) {
        return cb(err);
      }

      var dest = path.join(folderPath, data.name);

      fs.lstat(dest, function (err, stats) {
        if (stats && stats.isSymbolicLink()) {
          fs.readlink(dest, function (err, link) {
            if (err) {
              return cb(err);
            }
            if (src === link) {
              return cb(null, {src: src, dest: dest});
            }

            fs.symlink(src, dest, 'junction', function (err) {
              if (err) {
                return cb(err);
              }

              cb(null, {src: src, dest: dest});
            });
          });
        }
        else {
          rimraf(dest, function (err) {
            if (err) {
              return cb(err);
            }

            fs.symlink(src, dest, 'junction', function (err) {
              if (err) {
                return cb(err);
              }

              cb(null, {src: src, dest: dest});
            });
          });
        }
      });
    });
  });
};