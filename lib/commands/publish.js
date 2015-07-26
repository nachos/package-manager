'use strict';

var exec = require('child_process').exec;
var server = require('nachos-server-api');
var jf = require('jsonfile');
var path = require('path');
var _ = require('lodash');
var Q = require('q');
var debug = require('debug')('nachosPackageManager:publish');

/**
 * Publish a package
 * @param source Source directory
 * @returns {Q.promise}
 */
module.exports = function (source) {
  if (!source) {
    return Q.reject(new TypeError('nachos-package-manager publish: source directory must be provided'));
  }

  debug('publishing directory %s', source);

  return Q.nfcall(exec, 'git config --get remote.origin.url', {cwd: source})
    .then(function (repo) {
      debug('origin url: %s', repo);

      return Q.nfcall(jf.readFile, path.join(source, 'nachos.json'))
        .then(function (data) {
          debug('nachos.json: %j', data);
          data.repo = repo;

          return data;
        });
    })
    .then(function (data) {
      var client = server();

      if (!client.connected()) {
        return Q.reject('not logged in');
      }

      return client.packages.add({}, {
        name: data.name,
        repo: _.trim(data.repo),
        type: data.type
      });
    });
};
