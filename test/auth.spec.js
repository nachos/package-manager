'use strict';

var chai = require('chai');
var Q = require('q');
var sinon = require('sinon');
var mockery = require('mockery');
var expect = chai.expect;

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

describe('auth', function () {
  describe('set', function () {
    describe('without a token', function () {
      var auth = require('../lib/auth');

      it('should be rejected with TypeError', function () {
        return expect(auth.set()).to.eventually.be.rejectedWith('token must be provided');
      });
    });

    describe('with a valid token', function () {
      var auth;

      before(function () {
        var settingsFile = function () {
          return {
            set: sinon.stub().returns(Q.resolve())
          };
        };

        mockery.registerMock('nachos-settings-file', settingsFile);

        mockery.enable({
          useCleanCache: true,
          warnOnReplace: false,
          warnOnUnregistered: false
        });

        auth = require('../lib/auth');
      });

      after(function () {
        mockery.deregisterMock('nachos-settings-file');
        mockery.disable();
      });

      it('should set the token in the settings file', function () {
        return expect(auth.set('token')).to.eventually.be.fulfilled;
      });
    });
  });

  describe('get', function () {
    describe('when there is a token in the settings file', function () {
      var auth;

      before(function () {
        var settingsFile = function () {
          return {
            get: sinon.stub().returns(Q.resolve({token: 'token'}))
          };
        };

        mockery.registerMock('nachos-settings-file', settingsFile);

        mockery.enable({
          useCleanCache: true,
          warnOnReplace: false,
          warnOnUnregistered: false
        });

        auth = require('../lib/auth');
      });

      after(function () {
        mockery.deregisterMock('nachos-settings-file');
        mockery.disable();
      });

      it('should return the token', function () {
        return expect(auth.get()).to.eventually.equal('token');
      });
    });

    describe('when there is no token in the settings file', function () {
      var auth;

      beforeEach(function () {
        var settingsFile = function () {
          return {
            get: sinon.stub().returns(Q.resolve({}))
          };
        };

        mockery.registerMock('nachos-settings-file', settingsFile);

        mockery.enable({
          useCleanCache: true,
          warnOnReplace: false,
          warnOnUnregistered: false
        });

        auth = require('../lib/auth');
      });

      afterEach(function () {
        mockery.deregisterMock('nachos-settings-file');
        mockery.disable();
      });

      describe('when there is a token in the nachos config', function () {
        before(function () {
          var nachosConfig = {
            get: sinon.stub().returns(Q.resolve({token: 'token'}))
          };

          mockery.registerMock('nachos-config', nachosConfig);

          auth = require('../lib/auth');
        });

        after(function () {
          mockery.deregisterMock('nachos-config');
        });

        it('should return the token', function () {
          return expect(auth.get()).to.eventually.equal('token');
        });
      });

      describe('when there is no token in the nachos config', function () {
        before(function () {
          var nachosConfig = {
            get: sinon.stub().returns(Q.resolve({}))
          };

          mockery.registerMock('nachos-config', nachosConfig);

          auth = require('../lib/auth');
        });

        after(function () {
          mockery.deregisterMock('nachos-config');
        });

        it('should return undefined', function () {
          return expect(auth.get()).to.eventually.equal(undefined);
        });
      });
    });
  });
});