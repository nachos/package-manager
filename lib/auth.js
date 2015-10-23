'use strict';

var SettingsFile = require('nachos-settings-file');
var nachosConfig = require('nachos-config');
var Q = require('q');
var debug = require('debug')('nachosPackageManager:auth');

var settingsFile = new SettingsFile('package-manager');
var auth = {};

auth.set = function (token) {
  if (!token) {
    return Q.reject(new TypeError('token must be provided'));
  }

  if (typeof token !== 'string') {
    return Q.reject(new TypeError('token must be a string'));
  }

  debug('token to set it is %s', token);

  return settingsFile.set({token: token});
};

auth.get = function () {
  return settingsFile.get()
    .then(function (settings) {
      debug(settings.token ? 'got token from settings file ' + settings.token : '');

      return settings.token ||
        nachosConfig.get()
          .then(function (config) {
            debug(config.token ? 'got token from nachos config ' + config.token : '');

            return config.token;
          });
    });
};

module.exports = auth;