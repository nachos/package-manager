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
  describe('with invalid parameters', function () {
    describe('source parameter', function () {
      var packageManager = require('../../lib');

      describe('empty', function () {
        it('should be rejected with TypeError', function () {
          expect(packageManager.install()).to.eventually.be.rejectedWith(TypeError);
        });
      });

      describe('number', function () {
        it('should be rejected with TypeError', function () {
          expect(packageManager.install(12)).to.eventually.be.rejectedWith(TypeError);
        });
      });
    });

    describe('os parameter', function () {
      var packageManager = require('../../lib');

      describe('number', function () {
        it('should be rejected with TypeError', function () {
          expect(packageManager.install('test', 1)).to.eventually.be.rejectedWith(TypeError);
        });
      });
    });

    describe('arch parameter', function () {
      var packageManager = require('../../lib');

      describe('number', function () {
        it('should be rejected with TypeError', function () {
          expect(packageManager.install('test', 'test', 1)).to.eventually.be.rejectedWith(TypeError);
        });
      });
    });
  });

  describe('with valid parameters', function () {
    var packageManager;

    beforeEach(function () {
      var serverApiMock = function () {
        var stream = {
          pipe: function () {
            return this;
          },
          on: function (name, cb) {
            cb();

            return this;
          }
        };

        return {
          packages: {
            byName: sinon.stub().returns(Q.resolve({
              name: 'test',
              type: 'test'
            })),
            download: sinon.stub().returns(Q.resolve(stream))
          },
          setToken: sinon.stub()
        };
      };

      var packagesMock = {
        getFolderByType: sinon.stub().returns(Q.resolve(''))
      };

      rimraf = sinon.stub().callsArgWith(1, null);

      downloader = sinon.stub().returns(Q.resolve());

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

    describe('without logged-in user', function () {
      before(function () {
        var settingsFileMock = function () {
          return {
            get: sinon.stub().returns(Q.resolve({}))
          };
        };

        var nachosConfigMock = {
          get: sinon.stub().returns(Q.resolve({}))
        };

        mockery.registerMock('nachos-config', nachosConfigMock);
        mockery.registerMock('nachos-settings-file', settingsFileMock);
      });

      after(function () {
        mockery.deregisterMock('nachos-config');
        mockery.deregisterMock('nachos-settings-file');
      });

      it('should be rejected', function () {
        return expect(packageManager.install('test')).to.eventually.be.rejectedWith('There is no logged-in user');
      });
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