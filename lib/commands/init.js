'use strict';

var Q = require('q');
var path = require('path');
var jsonfile = require('jsonfile');

module.exports = function (json) {
  return Q.nfcall(jsonfile.writeFile, path.join(process.cwd(), 'nachos.json'), json, {spaces: 2})
    .then(function () {
      return Q.resolve();
    }, function (err) {
      return Q.reject(err);
    });
};