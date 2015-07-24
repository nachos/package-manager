'use strict';

var server = require('nachos-server-api');
var downloader = require('git-downloader');
var packages = require('nachos-packages');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var rimraf = require('rimraf');
var Q = require('q');
var debug = require('debug')('nachosPackageManager:install');

/**
 * Install a package
 * @param pkg package name to install
 * @returns {Q.promise} Destination directory
 */
module.exports = function (pkg) {
  var client = server();

  return client.packages.byName({ package: pkg }).then(function (data) {
    debug('package details: %j', data);

    return packages.getFolderByType(data.type).then(function (folderPath) {
      data.dest = path.join(folderPath, data.name);
      debug('destination path: %s', data.dest);

      return data;
    });
  }).then(function (data) {
    return Q.nfcall(rimraf, data.dest).then(function () {
      return data;
    });
  }).then(function (data) {
    debug('repo to download: %s', data.repo);

    return Q.nfcall(downloader, {
      source: data.repo,
      dest: data.dest
    }).then(function () {
      return data;
    });
  }).then(function (data) {
    return Q.all([
      Q.fcall(function () {
        return Q.nfcall(fs.access, path.join(data.dest, 'package.json')).then(function () {
          debug('running npm install');

          return Q.nfcall(exec, 'npm install', {
            cwd: data.dest
          });
        }, function () {
          debug('no package.json');

          return Q.resolve();
        });
      }),
      Q.fcall(function () {
        return Q.nfcall(fs.access, path.join(data.dest, 'bower.json')).then(function () {
          debug('running bower install');

          return Q.nfcall(exec, 'bower install', {
            cwd: data.dest
          });
        }, function () {
          debug('no bower.json');

          return Q.resolve();
        });
      })
    ]).then(function () {
      return data.dest;
    });
  });
};
