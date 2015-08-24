'use strict';

var server = require('nachos-server-api');
var Q = require('q');
var debug = require('debug')('nachosPackageManager:publish');
var fstream = require('fstream');
var nachosConfig = require('nachos-config');
var tar = require('tar');
var jf = require('jsonfile');
var path = require('path');

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

  return Q.nfcall(jf.readFile, path.join(source, 'nachos.json'))
    .then(function (data) {
      debug('nachos.json: %j', data);

      return nachosConfig.get()
        .then(function (config) {
          client.setToken(config.token);

          var stream = fstream.Reader(source)
            .pipe(tar.Pack());

          return client.packages.upload({'package': stream}, {'package': data.name});
        });
    });
};
