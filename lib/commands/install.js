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
 * Build an installer
 *
 * @param {string} command Command to execute
 * @param {string} filePath Full path to file to read install info from
 * @private
 */
var _buildInstaller = function (command, filePath) {
  return Q.nfcall(fs.access, filePath)
    .then(function () {
      debug('running %s', command);

      return Q.nfcall(exec, command, {cwd: path.dirname(filePath)});
    }, function () {
      debug('no %s', path.basename(filePath));

      return Q.resolve();
    });
};

/**
 * Install a package
 *
 * @param {string} packageName package name to install
 * @returns {Q.promise} Destination directory
 */
module.exports = function (packageName) {
  if (!packageName) {
    return Q.reject(new TypeError('nachos-package-manager install: Package name must be provided'));
  }

  var client = server();

  return client.packages.byName({}, {package: packageName})
    .then(function (data) {
      debug('package details: %j', data);

      return packages.getFolderByType(data.type)
        .then(function (folderPath) {
          data.dest = path.join(folderPath, data.name);
          debug('destination path: %s', data.dest);

          return data;
        });
    })
    .then(function (data) {
      debug('Deleting existing package in %s', data.dest);

      return Q.nfcall(rimraf, data.dest)
        .then(function () {
          return data;
        });
    })
    .then(function (data) {
      debug('repo to download: %s', data.repository);

      return downloader({
        source: data.repository,
        destination: data.dest
      })
        .then(function () {
          return data;
        });
    })
    .then(function (data) {
      return Q.all([
        _buildInstaller('npm install', path.join(data.dest, 'package.json')),
        _buildInstaller('bower install', path.join(data.dest, 'bower.json'))
      ])
        .then(function () {
          return data.dest;
        });
    });
};
