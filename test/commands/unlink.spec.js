'use strict';

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var mockery = require('mockery');
var fs = require('fs');
var Q = require('q');

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

describe('unlink', function () {
  describe('without source parameter', function () {
    var packageManager = require('../../lib');

    it('should be rejected with TypeError', function () {
      expect(packageManager.unlink()).to.eventually.be.rejectedWith(TypeError);
    });
  });

  describe('with valid source parameter', function () {
    var packageManager;

    beforeEach(function () {
      var jsonfile = {
        readFile: sinon.stub().callsArgWith(1, null, {
          name: 'test',
          type: 'test'
        })
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

    describe('destination from source is linked', function () {
      describe('the link is the same as source', function () {
        before(function () {
          var unlinkStub = sinon.stub().callsArgWith(1, null, 'test');

          fs.lstat = sinon.stub().callsArgWith(1, null, {
            isSymbolicLink: function () {
              return true;
            }
          });

          fs.unlink = unlinkStub;
          mockery.registerMock('fs', fs);
        });

        after(function () {
          mockery.deregisterMock('fs');
        });

        it('should unlink', function () {
          return expect(packageManager.unlink('test')).to.eventually.be.equal('test');
        });
      });

      describe('the link is not the same as source', function () {
        var unlinkStub = sinon.stub().callsArgWith(1, null, 'test');

        before(function () {
          fs.lstat = sinon.stub().callsArgWith(1, null, {
            isSymbolicLink: function () {
              return true;
            }
          });

          fs.unlink = unlinkStub;

          mockery.registerMock('fs', fs);
        });

        after(function () {
          mockery.deregisterMock('fs');
        });

        it('should unlink', function () {
          return packageManager.unlink('test')
            .then(function (data) {
              expect(data).to.be.equal('test');

              return expect(unlinkStub).to.have.been.calledOnce;
            });
        });
      });
    });

    describe('destination from source is a directory and not a link', function () {
      var unlinkStub = sinon.stub().callsArgWith(1, null, 'test');

      before(function () {
        fs.lstat = sinon.stub().callsArgWith(1, null, {
          isSymbolicLink: function () {
            return false;
          }
        });

        fs.unlink = unlinkStub;

        mockery.registerMock('fs', fs);
      });

      after(function () {
        mockery.deregisterMock('fs');
      });

      it('should be rejected', function () {
        return expect(packageManager.unlink('test')).to.eventually.been.rejectedWith('test is not a symbolic link');
      });
    });

    describe('destination from source not exist', function () {
      var unlinkStub = sinon.stub().callsArgWith(1, null, 'test');

      before(function () {
        fs.lstat = sinon.stub().callsArgWith(1, null, Q.reject({code: 'ENOENT'}));

        fs.unlink = unlinkStub;

        mockery.registerMock('fs', fs);
      });

      after(function () {
        mockery.deregisterMock('fs');
      });

      it('should been rejected with ENOENT', function () {
        return expect(packageManager.unlink('test')).to.eventually.been.rejectedWith({code: 'ENOENT'});
      });
    });

    describe('no permissions to check destination from source', function () {
      before(function () {
        fs.lstat = sinon.stub().callsArgWith(1, null, Q.reject({code: 'ENOPER'}));

        mockery.registerMock('fs', fs);
      });

      after(function () {
        mockery.deregisterMock('fs');
      });

      it('should be rejected', function () {
        return expect(packageManager.unlink('test')).to.eventually.be.rejected;
      });
    });
  });
});