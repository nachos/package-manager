'use strict';

var server = require('nachos-server-api');
var debug = require('debug')('nachosPackageManager:login');
var Q = require('q');
var auth = require('../auth');

/**
 * Login to nachos
 *
 * @param {object} data email and password
 * @returns {Q.promise} Login succeeded
 */
module.exports = function (data) {
  data = data || {};

  if (!data.email) {
    return Q.reject(new TypeError('nachos-package-manager login: Email must be provided'));
  }

  if (!data.password) {
    return Q.reject(new TypeError('nachos-package-manager login: Password must be provided'));
  }

  var client = server();

  debug('logging in with: %j', data);

  return client.connect({
    email: data.email,
    password: data.password
  })
    .then(function (token) {
      return auth.set({token: token});
    });
};