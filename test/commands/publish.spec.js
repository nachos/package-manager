'use strict';

var chai = require('chai');
var expect = chai.expect;
var childProcess = require('child_process');
var sinon = require('sinon');
var mockery = require('mockery');
var Q = require('q');

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

describe('publish', function () {
  describe('with invalid source parameter', function () {
    var packageManager = require('../../lib');

    it('should be rejected with TypeError', function () {
      expect(packageManager.publish()).to.eventually.be.rejectedWith(TypeError);
    });

    it('should be rejected with TypeError', function () {
      expect(packageManager.publish(12)).to.eventually.be.rejectedWith(TypeError);
    });
  });

  describe('with invalid os parameter', function () {
    var packageManager = require('../../lib');

    it('should be rejected with TypeError', function () {
      expect(packageManager.publish('source')).to.eventually.be.rejectedWith(TypeError);
    });

    it('should be rejected with TypeError', function () {
      expect(packageManager.publish('source', 12)).to.eventually.be.rejectedWith(TypeError);
    });
  });

  describe('with invalid arch parameter', function () {
    var packageManager = require('../../lib');

    it('should be rejected with TypeError', function () {
      expect(packageManager.publish('source', 'os')).to.eventually.be.rejectedWith(TypeError);
    });

    it('should be rejected with TypeError', function () {
      expect(packageManager.publish('source', 'os', 12)).to.eventually.be.rejectedWith(TypeError);
    });
  });

  describe('with valid parameters', function () {
    var packageManager;

    beforeEach(function () {
      var jsonfile = {
        readFile: sinon.stub().callsArgWith(1, null, {test: 'testData'})
      };

      childProcess.exec = sinon.stub().callsArgWith(2, null, 'testRepo');

      mockery.registerMock('jsonfile', jsonfile);
      mockery.registerMock('child-process', childProcess);

      mockery.enable({
        useCleanCache: true,
        warnOnReplace: false,
        warnOnUnregistered: false
      });

      packageManager = require('../../lib');
    });

    afterEach(function () {
      mockery.deregisterMock('jsonfile');
      mockery.deregisterMock('child-process');
      mockery.disable();
    });

    describe('with connected user', function () {
      before(function () {
        var serverApiMock = function () {
          return {
            connected: function () {
              return true;
            },
            setToken: function () {
              return true;
            },
            packages: {
              upload: function () {
                return Q.resolve(true);
              }
            }
          };
        };

        var settingsFile = sinon.stub().returns({
          get: sinon.stub().returns(Q.resolve({token: 'token'}))
        });

        mockery.registerMock('nachos-settings-file', settingsFile);

        mockery.registerMock('nachos-server-api', serverApiMock);
      });

      after(function () {
        mockery.deregisterMock('nachos-server-api');
        mockery.deregisterMock('nachos-settings-file');
      });

      it('should be fulfilled', function () {
        return expect(packageManager.publish('test', 'os', 'arch')).to.eventually.be.fulfilled;
      });
    });

    describe('with no user connected', function () {
      before(function () {
        var serverApiMock = function () {
          return {
            connected: function () {
              return false;
            },
            setToken: function () {
              return true;
            }
          };
        };

        mockery.registerMock('nachos-server-api', serverApiMock);
      });

      after(function () {
        mockery.deregisterMock('nachos-server-api');
      });

      it('should be rejected', function () {
        return expect(packageManager.publish('test', 'os', 'arch')).to.eventually.be.rejectedWith('There is no logged-in user.');
      });
    });
  });
});