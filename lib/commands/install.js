var server = require('nachos-server-api');
var downloader = require('git-downloader');
var Packages = require('nachos-packages');
var path = require('path');
var fs = require('fs');
var async = require('async');
var exec = require('child_process').exec;
var rimraf = require('rimraf');

module.exports = function (pkg, cb) {
  var client = server();

  client.packages.byName({package: pkg}, function (err, data) {
    if (err) {
      return cb(err);
    }

    var packages = new Packages();

    packages.getFolderByType(data.type, function (err, folderPath) {
      if (err) {
        return cb(err);
      }

      var dest = path.join(folderPath, data.name);

      rimraf(dest, function (err) {
        if (err) {
          return cb(err);
        }

        downloader({
          source: data.repo,
          dest: dest
        }, function (err) {
          if (err) {
            return cb(err);
          }

          async.parallel([
            function (callback) {
              fs.exists(path.join(dest, 'package.json'), function (exists) {
                if (!exists) {
                  return callback();
                }

                exec('npm install', {
                  cwd: dest
                }, callback);
              });
            },
            function (callback) {
              fs.exists(path.join(dest, 'bower.json'), function (exists) {
                if (!exists) {
                  return callback();
                }

                exec('bower install', {
                  cwd: dest
                }, callback);
              });
            }
          ], cb);
        });
      });
    });
  });
};