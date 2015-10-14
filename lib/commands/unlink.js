'use strict';

var fs = require('fs');
var path = require('path');
var jf = require('jsonfile');
var packages = require('nachos-packages');
var Q = require('q');
var debug = require('debug')('nachosPackageManager:unlink');

/**
 * Unlink a directory from nachos packages
 *
 * @param {string} source Source directory to unlink
 * @returns {Q.promise} Source and destination directories
 */
module.exports = function (source) {
  if (!source) {
    return Q.reject(new TypeError('nachos-package-manager unlink: Source must be provided'));
  }

  debug('unlinking source %s', source);

  return Q.nfcall(jf.readFile, path.join(source, 'nachos.json'))
    .then(function (data) {
      return packages.getFolderByType(data.type)
        .then(function (folderPath) {
          data.dest = path.join(folderPath, data.name);
          debug('destination data: %j', data);

          return data;
        })
        .then(function (data) {
          return Q.nfcall(fs.lstat, data.dest)
            .then(function (stats) {
              if (!(stats && stats.isSymbolicLink())) {
                return Q.reject(data.dest + ' is not a symbolic link');
              }

              return Q.nfcall(fs.unlink, data.dest);
            })
            .then(function () {
              return data.dest;
            });
        });
    });
};