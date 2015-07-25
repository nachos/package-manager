'use strict';

var chai = require('chai');
var sinon = require('sinon');
var Q = require('Q');
var expect = chai.expect;
var mockery = require('mockery');

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

xdescribe('login', function () {
  describe('with invalid parameters', function () {
    var packageManager = require('../../lib');

    it('should be rejected with empty data', function () {
      return expect(packageManager.login()).to.eventually.be.rejectedWith(TypeError);
    });

    it('should be rejected with invalid email', function () {
      return expect(packageManager.login({password: 'password'})).to.eventually.be.rejectedWith(TypeError);
    });

    it('should be rejected with invalid password', function () {
      return expect(packageManager.login({email: 'email'})).to.eventually.be.rejectedWith(TypeError);
    });
  });

  describe('with valid parameters', function () {
    var packageManager;

    describe('with correct data', function () {
      beforeEach(function () {
        var packageManagerMock = function () {
          return {
            connect: sinon.stub().returns(Q.resolve())
          };
        };

        mockery.registerMock('nachos-server-api', packageManagerMock);
        mockery.enable({
          useCleanCache: true,
          warnOnReplace: false,
          warnOnUnregistered: false
        });

        packageManager = require('../../lib');
      });

      afterEach(function () {
        mockery.deregisterMock('nachos-server-api');
        mockery.disable();
      });

      it('should login successfully', function () {
        return expect(packageManager.login({email: 'email', password: 'password'})).to.eventually.be.fulfilled;
      });
    });

    describe('with incorrect data', function () {
      beforeEach(function () {
        var packageManagerMock = function () {
          return {
            connect: sinon.stub().returns(Q.reject())
          };
        };

        mockery.registerMock('nachos-server-api', packageManagerMock);
        mockery.enable({
          useCleanCache: true,
          warnOnReplace: false,
          warnOnUnregistered: false
        });

        packageManager = require('../../lib');
      });

      afterEach(function () {
        mockery.deregisterMock('nachos-server-api');
        mockery.disable();
      });

      it('should not login', function () {
        return expect(packageManager.login({email: 'email', password: 'password'})).to.eventually.be.rejected;
      });
    });
  });
});