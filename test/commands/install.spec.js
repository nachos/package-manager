'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var mockery = require('mockery');
var Q = require('q');
var rimraf = require('rimraf');
var downloader = require('git-downloader');
var fs = require('fs');
var childProcess = require('child_process');

describe('install', function () {
  describe('without source parameter', function () {
    var packageManager = require('../../lib');

    it('should be rejected with TypeError', function () {
      expect(packageManager.install()).to.eventually.be.rejectedWith(TypeError);
    });
  });

  describe('with valid package name', function () {
    var packageManager;

    beforeEach(function () {
      var serverApiMock = function () {
        return {
          packages: {
            byName: sinon.stub().returns(Q.resolve({name: 'test', type: 'test'}))
          }
        };
      };

      var packagesMock = {
        getFolderByType: sinon.stub().returns(Q.resolve(''))
      };

      rimraf = sinon.stub().callsArgWith(1, null);

      downloader = sinon.stub().callsArgWith(1, null);

      childProcess.exec = sinon.stub().callsArgWith(2, null);

      mockery.registerMock('nachos-packages', packagesMock);
      mockery.registerMock('nachos-server-api', serverApiMock);
      mockery.registerMock('rimraf', rimraf);
      mockery.registerMock('git-downloader', downloader);
      mockery.registerMock('child-process', childProcess);

      mockery.enable({
        useCleanCache: true,
        warnOnReplace: false,
        warnOnUnregistered: false
      });

      packageManager = require('../../lib');
    });

    afterEach(function () {
      mockery.deregisterMock('nachos-packages');
      mockery.deregisterMock('nachos-server-api');
      mockery.deregisterMock('rimraf');
      mockery.deregisterMock('git-downloader');
      mockery.deregisterMock('child-process');
      mockery.disable();
    });

    it('should be fine', function () {
      return expect(packageManager.install('test')).to.eventually.be.fulfilled;
    });

    describe('there is a package.json in the destination folder', function () {
      before(function () {
        fs.access = sinon.stub().callsArgWith(1, null);
        mockery.registerMock('fs', fs);
      });

      after(function () {
        mockery.deregisterMock('fs');
      });

      it('should be fulfilled', function () {
        return expect(packageManager.install('test')).to.eventually.be.fulfilled;
      });
    });

    describe('there is no package.json in the destination folder', function () {
      before(function () {
        fs.access = sinon.stub().callsArgWith(1, null, Q.reject());
        mockery.registerMock('fs', fs);
      });

      after(function () {
        mockery.deregisterMock('fs');
      });

      it('should be fulfilled', function () {
        return expect(packageManager.install('test')).to.eventually.be.fulfilled;
      });
    });
  });
});