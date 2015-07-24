'use strict';

var server = require('nachos-server-api');
var debug = require('debug')('nachosPackageManager:login');
var Q = require('q');

/**
 * Login to nachos
 * @param data email and password
 * @returns {Q.promise}
 */
module.exports = function (data) {
  data = data || {};

  if (!data.email) {
    return Q.reject(new TypeError('nachos-package-manager: Email must be provided'));
  }

  if (!data.password) {
    return Q.reject(new TypeError('nachos-package-manager: Password must be provided'));
  }

  var client = server();

  debug('logging in with: %j', data);

  return client.connect({ email: data.email, password: data.password });
};