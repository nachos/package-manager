'use strict';

var SettingsFile = require('nachos-settings-file');
var path = require('path');
var rimraf = require('rimraf');
var packages = require('nachos-packages');
var Q = require('q');
var debug = require('debug')('nachosPackageManager:uninstall');

/**
 * Uninstall a package
 * @param pkg package name
 * @returns {Q.promise}
 */
module.exports = function (pkg) {
  var pkgSettings = new SettingsFile(pkg);

  debug('package to uninstall: %s', pkg);

  return pkgSettings.delete().then(function () {
    return packages.getFolderByPackage(pkg);
  }).then(function (folderPath) {
    debug('path to remove: %s', path.join(folderPath, pkg));

    return Q.nfcall(rimraf, path.join(folderPath, pkg));
  });
};