'use strict';

var fs = require('fs');
var path = require('path');
var jf = require('jsonfile');
var packages = require('nachos-packages');
var rimraf = require('rimraf');
var Q = require('q');

module.exports = function (src) {
  if (!src) {
    return Q.reject(new TypeError('nachos-package-manager: Source must be provided'));
  }

  return Q.nfcall(jf.readFile, path.join(src, 'nachos.json')).then(function (data) {
    return packages.getFolderByType(data.type).then(function (folderPath) {
      data.dest = path.join(folderPath, data.name);

      return data;
    }).then(function (data) {
      return Q.fncall(fs.lstat, data.dest).then(function (stats) {
        if (stats && stats.isSymbolicLink()) {
          return Q.fncall(fs.readlink, data.dest).then(function (link) {
            if (src === link) {
              return { src: src, dest: data.dest };
            }

            return Q.nfcall(fs.symlink, src, data.dest, 'junction').then(function () {
              return { src: src, dest: data.dest };
            });
          });
        }
        else {
          return Q.nfcall(rimraf, data.dest).then(function () {
            return Q.nfcall(fs.symlink, src, data.dest, 'junction').then(function () {
              return { src: src, dest: data.dest };
            });
          });
        }
      });
    });
  });
};