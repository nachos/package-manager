var SettingsFile = require('nachos-settings-file');
var rimraf = require('rimraf');
var Packages = require('nachos-packages');

module.exports = function (pkg, cb) {
  var packages = new Packages();

  var pkgSettings = new SettingsFile(pkg);

  pkgSettings.delete(function (err) {
    if (err) {
      return cb(err);
    }

    packages.getFolderByPackage(pkg, function (err, folderPath) {
      if (err) {
        return cb(err);
      }

      var dest = path.join(folderPath, pkg);

      rimraf(dest, cb);
    });
  });
};