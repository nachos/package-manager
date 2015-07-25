'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var mockery = require('mockery');
var fs = require('fs');
var Q = require('q');
var rimraf = require('rimraf');

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

describe('link', function () {
  describe('without source parameter', function () {
    var packageManager = require('../../lib');

    it('should be rejected with TypeError', function () {
      expect(packageManager.link()).to.eventually.be.rejectedWith(TypeError);
    });
  });

  describe('with valid source parameter', function () {
    var packageManager;

    beforeEach(function () {
      var jsonfile = {
        readFile: sinon.stub().callsArgWith(1, null, {name: 'test', type: 'test'})
      };

      var packagesMock = {
        getFolderByType: sinon.stub().returns(Q.resolve(''))
      };

      mockery.registerMock('nachos-packages', packagesMock);
      mockery.registerMock('jsonfile', jsonfile);
      mockery.enable({
        useCleanCache: true,
        warnOnReplace: false,
        warnOnUnregistered: false
      });

      packageManager = require('../../lib');
    });

    afterEach(function () {
      mockery.deregisterMock('nachos-packages');
      mockery.deregisterMock('jsonfile');
      mockery.disable();
    });

    describe('destination from source is already linked', function () {
      describe('the link is the same as source', function () {
        before(function () {
          fs.lstat = sinon.stub().callsArgWith(1, null, {
            isSymbolicLink: function () {
              return true;
            }
          });

          fs.readlink = sinon.stub().callsArgWith(1, null, 'test');

          mockery.registerMock('fs', fs);
        });

        after(function () {
          mockery.deregisterMock('fs');
        });

        it('should not recreate link', function () {
          return expect(packageManager.link('test')).to.eventually.be.deep.equal({src: 'test', dest: 'test'});
        });
      });

      describe('the link is not the same as source', function () {
        var symlinkStub = sinon.stub().callsArgWith(3, null, 'test');

        before(function () {
          fs.lstat = sinon.stub().callsArgWith(1, null, {
            isSymbolicLink: function () {
              return true;
            }
          });

          fs.readlink = sinon.stub().callsArgWith(1, null, 'testB');
          fs.symlink = symlinkStub;
          rimraf = sinon.stub().callsArgWith(1, null);

          mockery.registerMock('fs', fs);
          mockery.registerMock('rimraf', rimraf);
        });

        after(function () {
          mockery.deregisterMock('fs');
          mockery.deregisterMock('rimraf');
        });

        it('should recreate link', function () {
          return packageManager.link('test')
            .then(function (data) {
              expect(data).to.be.deep.equal({src: 'test', dest: 'test'});

              return expect(symlinkStub).to.have.been.calledOnce;
            });
        });
      });
    });

    describe('destination from source is a directory and not a link', function () {
      var symlinkStub = sinon.stub().callsArgWith(3, null, 'test');

      before(function () {
        fs.lstat = sinon.stub().callsArgWith(1, null, {
          isSymbolicLink: function () {
            return false;
          }
        });

        fs.readlink = sinon.stub().callsArgWith(1, null, 'test');
        fs.symlink = symlinkStub;
        rimraf = sinon.stub().callsArgWith(1, null);

        mockery.registerMock('fs', fs);
        mockery.registerMock('rimraf', rimraf);
      });

      after(function () {
        mockery.deregisterMock('fs');
        mockery.deregisterMock('rimraf');
      });

      it('should recreate link', function () {
        return packageManager.link('test')
          .then(function (data) {
            expect(data).to.be.deep.equal({src: 'test', dest: 'test'});

            return expect(symlinkStub).to.have.been.calledOnce;
          });
      });
    });
  });
});