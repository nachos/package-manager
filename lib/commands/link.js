'use strict';

var fs = require('fs');
var path = require('path');
var jf = require('jsonfile');
var packages = require('nachos-packages');
var rimraf = require('rimraf');
var Q = require('q');
var debug = require('debug')('nachosPackageManager:link');

// Var uninstall = require('./uninstall');

/**
 * Remove current directory and recreate it
 * @param src Source directory to link
 * @param dest Destination directory
 * @returns {Q.promise} Source and destination directories
 * @private
 */
var _recreate = function (src, dest) {
  return Q.nfcall(rimraf, dest)
    .then(function () {
      // Should we uninstall instead? return uninstall(data.name).then(function () {

      return Q.nfcall(fs.symlink, src, dest, 'junction')
        .then(function () {
          return {src: src, dest: dest};
        });
    });
};

/**
 * Link a directory to nachos packages
 * @param src Source directory to link
 * @returns {Q.promise} Source and destination directories
 */
module.exports = function (src) {
  if (!src) {
    return Q.reject(new TypeError('nachos-package-manager link: Source must be provided'));
  }

  debug('linking source %s', src);

  return Q.nfcall(jf.readFile, path.join(src, 'nachos.json'))
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
              if (stats && stats.isSymbolicLink()) {
                return Q.nfcall(fs.readlink, data.dest)
                  .then(function (link) {
                    if (path.resolve(src) === path.resolve(link)) {
                      debug('link is already exists at %s', src);

                      return {src: src, dest: data.dest};
                    }

                    debug('link exists to: %s', path.resolve(link));

                    return _recreate(src, data.dest);
                  });
              }
              else {
                debug('directory already exists at %s', data.dest);

                return _recreate(src, data.dest);
              }
            }, function (err) {
              if (err.code === 'ENOENT') {
                return _recreate(src, data.dest);
              }

              return Q.reject(err);
            });
        });
    });
};