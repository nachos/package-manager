'use strict';

var server = require('nachos-server-api');
var Q = require('q');
var debug = require('debug')('nachosPackageManager:publish');
var fstream = require('fstream');
var tar = require('tar');
var jf = require('jsonfile');
var path = require('path');
var zlib = require('zlib');
var fs = require('fs');
var os = require('os');
var _ = require('lodash');
var auth = require('../auth');

var validOs = ['win32', 'linux', 'darwin'];
var validTargetArch = ['ia32', 'x64'];
/**
 * Publish a package
 *
 * @param {string} source Source directory
 * @param {string} targetOS Target operating system
 * @param {string} targetArch Target arch
 * @returns {Q.promise} Publish succeeded
 */
module.exports = function (source, targetOS, targetArch) {
  if (!source) {
    return Q.reject(new TypeError('nachos-package-manager publish: source directory must be provided'));
  }
  else if (typeof source !== 'string') {
    return Q.reject(new TypeError('nachos-package-manager publish: source directory must be a string'));
  }

  if (!targetOS) {
    return Q.reject(new TypeError('nachos-package-manager publish: target os must be provided'));
  }
  else if (typeof targetOS !== 'string') {
    return Q.reject(new TypeError('nachos-package-manager publish: target os must be a string'));
  }
  else if (!_.contains(validOs, targetOS.toLowerCase())) {
    return Q.reject(new TypeError('nachos-package-manager publish: target os must be one of the following ' + validOs));
  }

  if (!targetArch) {
    return Q.reject(new TypeError('nachos-package-manager publish: target arch must be provided'));
  }
  else if (typeof targetArch !== 'string') {
    return Q.reject(new TypeError('nachos-package-manager publish: target arch must be a string'));
  }
  else if (!_.contains(validTargetArch, targetArch.toLowerCase())) {
    return Q.reject(new TypeError('nachos-package-manager publish: target arch must be one of the following ' + validTargetArch));
  }

  debug('publishing directory %s to %s %s', source, targetOS, targetArch);

  var client = server();
  var tempFile = path.join(os.tmpdir(), 'this-should-be-a-long-name-so-there-will-be-no-collision.tgz');

  return auth.get()
    .then(function (token) {
      if (!token) {
        return Q.reject(new Error('There is no logged-in user.'));
      }

      client.setToken(token);

      return Q.nfcall(jf.readFile, path.join(source, 'nachos.json'));
    })
    .then(function (data) {
      debug('nachos.json: %j', data);

      if (data.private) {
        return Q.reject('can\'t publish private package');
      }

      var deferred = Q.defer();

      fstream.Reader(source)
        .pipe(tar.Pack({fromBase: true}))
        .pipe(zlib.Gzip())
        .pipe(fs.createWriteStream(tempFile))
        .on('finish', function () {
          client.packages.upload({'package': fstream.Reader(tempFile)}, {
            package: data.name,
            os: targetOS,
            arch: targetArch
          })
            .then(function () {
              deferred.resolve();
            }, function (err) {
              debug('upload error: %j', err);

              if (err.response && err.response.statusCode === 403) {
                return Q.reject('permission denied, you are not an owner of this package');
              }

              return Q.reject(err);
            })
            .catch(function (err) {
              deferred.reject(err);
            })
            .finally(function () {
              return Q.nfcall(fs.unlink, tempFile);
            });
        });

      return deferred.promise;
    });
};
