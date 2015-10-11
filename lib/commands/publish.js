'use strict';

var server = require('nachos-server-api');
var Q = require('q');
var debug = require('debug')('nachosPackageManager:publish');
var fstream = require('fstream');
var nachosConfig = require('nachos-config');
var tar = require('tar');
var jf = require('jsonfile');
var path = require('path');
var zlib = require('zlib');
var fs = require('fs');
var os = require('os');

/**
 * Publish a package
 *
 * @param {string} source Source directory
 * @returns {Q.promise} Publish succeeded
 */
module.exports = function (source) {
  if (!source) {
    return Q.reject(new TypeError('nachos-package-manager publish: source directory must be provided'));
  }

  debug('publishing directory %s', source);

  var client = server();
  var tempFile = path.join(os.tmpdir(), 'this-should-be-a-long-name-so-there-will-be-no-collision.tgz');

  return Q.nfcall(jf.readFile, path.join(source, 'nachos.json'))
    .then(function (data) {
      debug('nachos.json: %j', data);

      return nachosConfig.get()
        .then(function (config) {
          var deferred = Q.defer();

          client.setToken(config.token);

          fstream.Reader(source)
            .pipe(tar.Pack({fromBase: true}))
            .pipe(zlib.Gzip())
            .pipe(fs.createWriteStream(tempFile))
            .on('finish', function () {
              client.packages.upload({'package': fstream.Reader(tempFile)}, {'package': data.name})
                .then(function () {
                  deferred.resolve();
                }, function (err) {
                  debug('upload error: %j', err);

                  if (err.response.statusCode === 403) {
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
    });
};
