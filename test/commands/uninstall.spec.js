'use strict';

var chai = require('chai');
var sinon = require('sinon');
var Q = require('q');
var expect = chai.expect;
var mockery = require('mockery');
var rimraf = require('rimraf');

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

describe('uninstall', function () {
  describe('without package name parameter', function () {
    var packageManager = require('../../lib');

    it('should be rejected with TypeError', function () {
      expect(packageManager.uninstall()).to.eventually.be.rejectedWith(TypeError);
    });
  });

  describe('with non-existing package', function () {
    var packageManager;

    beforeEach(function () {
      var settingsFileMock = function () {
        return {
          delete: sinon.stub().returns(Q.reject('Non existing folder'))
        };
      };

      mockery.registerMock('nachos-settings-file', settingsFileMock);
      mockery.enable({
        useCleanCache: true,
        warnOnReplace: false,
        warnOnUnregistered: false
      });

      packageManager = require('../../lib');
    });

    afterEach(function () {
      mockery.deregisterMock('nachos-settings-file');
      mockery.disable();
    });

    it('should be rejected', function () {
      return expect(packageManager.uninstall('test')).to.eventually.be.rejectedWith('Non existing folder');
    });
  });

  describe('with existing package', function () {
    var packageManager;

    beforeEach(function () {
      var nachosConfigMock = {
        get: sinon.stub().returns(Q.resolve({packages: 'path'}))
      };

      var settingsFileMock = function () {
        return {
          delete: sinon.stub().returns(Q.resolve())
        };
      };

      var packagesMock = {
        getFolderByPackage: sinon.stub().returns(Q.resolve('testFolder'))
      };

      rimraf = sinon.stub().callsArgWith(1, null);

      mockery.registerMock('nachos-config', nachosConfigMock);
      mockery.registerMock('nachos-settings-file', settingsFileMock);
      mockery.registerMock('nachos-packages', packagesMock);
      mockery.registerMock('rimraf', rimraf);
      mockery.enable({
        useCleanCache: true,
        warnOnReplace: false,
        warnOnUnregistered: false
      });

      packageManager = require('../../lib');
    });

    afterEach(function () {
      mockery.deregisterMock('nachos-config');
      mockery.deregisterMock('nachos-settings-file');
      mockery.deregisterMock('nachos-packages');
      mockery.deregisterMock('rimraf');
      mockery.disable();
    });

    it('should be fulfilled', function () {
      return expect(packageManager.uninstall('test')).to.eventually.be.fulfilled;
    });
  });
});