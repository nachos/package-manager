'use strict';

var server = require('nachos-server-api');
var packages = require('nachos-packages');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var rimraf = require('rimraf');
var Q = require('q');
var debug = require('debug')('nachosPackageManager:install');
var zlib = require('zlib');
var tarFs = require('tar-fs');
var _ = require('lodash');

var auth = require('../auth');

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
 * @param {string} targetOS Target operating system
 * @param {string} targetArch Target arch
 * @returns {Q.promise} Destination directory
 */
module.exports = function (packageName, targetOS, targetArch) {
  targetOS = targetOS || process.platform;
  targetArch = targetArch || process.arch;

  if (!packageName) {
    return Q.reject(new TypeError('nachos-package-manager install: package name must be provided'));
  }
  else if (typeof packageName !== 'string') {
    return Q.reject(new TypeError('nachos-package-manager install: package name must be a string'));
  }

  if (typeof targetOS !== 'string') {
    return Q.reject(new TypeError('nachos-package-manager install: target os name must be a string'));
  }

  if (typeof targetArch !== 'string') {
    return Q.reject(new TypeError('nachos-package-manager install: target arch must be a string'));
  }

  var client = server();

  return auth.get()
    .then(function (token) {
      if (!token) {
        debug('There is no logged-in user.');

        return Q.reject(new Error('There is no logged-in user.'));
      }

      debug('token is %s', token);

      client.setToken(token);

      return client.packages.byName({}, {package: packageName});
    })
    .then(function (details) {
      debug('package details: %j', details);

      return packages.getFolderByType(details.type)
        .then(function (folderPath) {
          var dest = path.join(folderPath, details.name);

          debug('Deleting existing package in %s', dest);

          return Q.nfcall(rimraf, dest)
            .then(function () {
              debug('Downloading %s from server', packageName);

              return client.packages.download({}, {
                package: packageName,
                os: targetOS,
                arch: targetArch
              });
            })
            .then(function (stream) {
              var deferred = Q.defer();

              debug('Extracting tarball to %s', dest);

              stream
                .pipe(zlib.Unzip())
                .pipe(tarFs.extract(dest))
                .on('finish', function () {
                  deferred.resolve();
                })
                .on('error', function (err) {
                  deferred.reject(err);
                });

              return deferred.promise;
            })
            .then(function () {
              return Q.all(
                _.map([dest, path.join(dest, 'resources', 'app')], function (dir) {
                  debug('Executing npm install in %s', dir);

                  return _buildInstaller('npm install --production', path.join(dir, 'package.json'));
                }));
            });
        });
    });
};
