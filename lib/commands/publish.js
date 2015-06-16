var exec = require('child_process').exec;
var server = require('nachos-server-api');
var jf = require('jsonfile');
var path = require('path');
var _ = require('lodash');

module.exports = function (src, cb) {
  exec('git config --get remote.origin.url', {cwd: src}, function (err, repo) {
    if (err) {
      return cb(err);
    }

    var client = server();

    jf.readFile(path.join(src, 'nachos.json'), function (err, data) {
      if (err) {
        return cb(err);
      }

      if (client.connected()) {
        client.packages.add({}, {
          name: data.name,
          repo: _.trim(repo),
          type: data.type
        }, function (err) {
          if (err) {
            return cb(err);
          }

          cb();
        });
        return;
      }

      // TODO: ask me
      client.connect({email: 'nacho@gmail.com', password: 'nacho'}, function (err, success) {
        if (err) {
          return cb(err);
        }

        if (!success) {
          // TODO: better error
          return cb('no login');
        }

        client.packages.add({}, {
          name: data.name,
          repo: _.trim(repo),
          type: data.type
        }, function (err) {
          if (err) {
            return cb(err);
          }

          cb();
        });
      });
    });
  });
};