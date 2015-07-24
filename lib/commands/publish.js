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
 * @param src source directory
 * @returns {Q.promise}
 */
module.exports = function (src) {
  debug('publishing directory %s', src);

  return Q.nfcall(exec, 'git config --get remote.origin.url', {cwd: src}).then(function (repo) {
    debug('origin url: %s', repo);

    return Q.nfcall(jf.readFile, path.join(src, 'nachos.json')).then(function (data) {
      debug('nachos.json: %j', data);
      data.repo = repo;

      return data;
    });
  }).then(function (data) {
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
