'use strict';

var server = require('nachos-server-api');
var packages = require('nachos-packages');
var path = require('path');
var fs = require('fs');
var exec = require('child_process').exec;
var rimraf = require('rimraf');
var Q = require('q');
var debug = require('debug')('nachosPackageManager:install');
var mkdirp = require('mkdirp');
var os = require('os');
var zlib = require('zlib');
var tarFs = require('tar-fs');

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
  var tmpDir = path.join(os.tmpDir(), packageName + '-tmp-download-' + Date.now());
  var tgzPath = path.join(tmpDir, packageName + '.tgz');

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
          debug('Package deleted');
          return data;
        });
    })
    .then(function (data) {
      debug('Creating folder %s', tmpDir);

      return Q.nfcall(mkdirp, tmpDir)
        .then(function () {
          return data;
        });
    })
    .then(function (data) {
      debug('tgz path: %s', tgzPath);

      var file = fs.createWriteStream(tgzPath);

      debug('Downloading %s from server', packageName);

      return client.packages.download({}, {package: packageName})
        .then(function (tarball) {
          var deferred = Q.defer();

          tarball.pipe(file)
            .on('error', function (err) {
              deferred.reject(err);
            }).on('finish', function () {
              deferred.resolve(data);
            });

          return deferred.promise;
        });
    })
    .then(function (data) {
      var deferred = Q.defer();

      debug('Extracting tarball to %s', data.dest);

      fs.createReadStream(tgzPath)
        .pipe(zlib.Unzip())
        .pipe(tarFs.extract(data.dest))
        .on('finish', function () {
          deferred.resolve(data);
        })
        .on('error', function (err) {
          console.log('error: ', err);
        });

      return deferred.promise;
    })
    .then(function (data) {
      var dir = data.type === 'dip' || data.type === 'burrito' ? data.dest : path.join(data.dest, 'resources', 'app');

      debug('Executing npm install and bower install in %s', dir);

      return Q.all([
        _buildInstaller('npm install', path.join(dir, 'package.json'))
      ])
        .then(function () {
          return data.dest;
        });
    })
    .finally(function () {
      debug('Deleting temp directory %s', tmpDir);
      Q.nfcall(rimraf, tmpDir)
        .then(function () {
          debug('Temp directory %s deleted', tmpDir);
        });
    });
};