'use strict';

var SettingsFile = require('nachos-settings-file');
var path = require('path');
var rimraf = require('rimraf');
var packages = require('nachos-packages');
var Q = require('q');

module.exports = function (pkg) {
  var pkgSettings = new SettingsFile(pkg);

  return pkgSettings.delete().then(function () {
    return packages.getFolderByPackage(pkg);
  }).then(function (folderPath) {
    return Q.nfcall(rimraf, path.join(folderPath, pkg));
  });
};