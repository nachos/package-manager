'use strict';

var chai = require('chai');
var expect = chai.expect;
var childProcess = require('child_process');
var sinon = require('sinon');
var mockery = require('mockery');
var Q = require('q');

var fstream = require('fstream');
var fs = require('fs');
var zlib = require('zlib');

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

describe('publish', function () {
  describe('with invalid source parameter', function () {
    var packageManager = require('../../lib');

    describe('with empty parameter', function () {
      it('should be rejected with TypeError', function () {
        expect(packageManager.publish()).to.eventually.be.rejectedWith(TypeError, 'nachos-package-manager publish: source directory must be provided');
      });
    });

    describe('with not string parameter', function () {
      it('should be rejected with TypeError', function () {
        expect(packageManager.publish(12)).to.eventually.be.rejectedWith(TypeError, 'nachos-package-manager publish: source directory must be a string');
      });
    });
  });

  describe('with invalid os parameter', function () {
    var packageManager = require('../../lib');

    describe('with empty parameter', function () {
      it('should be rejected with TypeError', function () {
        expect(packageManager.publish('source')).to.eventually.be.rejectedWith(TypeError, 'nachos-package-manager publish: target os must be provided');
      });
    });

    describe('with not string parameter', function () {
      it('should be rejected with TypeError', function () {
        expect(packageManager.publish('source', 12)).to.eventually.be.rejectedWith(TypeError, 'nachos-package-manager publish: target os must be a string');
      });
    });

    describe('with not string parameter', function () {
      it('should be rejected with TypeError', function () {
        expect(packageManager.publish('source', 'win')).to.eventually.be.rejectedWith(TypeError, 'nachos-package-manager publish: target os must be a string');
      });
    });
  });

  describe('with invalid arch parameter', function () {
    var packageManager = require('../../lib');

    describe('with empty parameter', function () {
      it('should be rejected with TypeError', function () {
        expect(packageManager.publish('source', 'win32')).to.eventually.be.rejectedWith(TypeError, 'nachos-package-manager publish: target arch must be provided');
      });
    });

    describe('with not string parameter', function () {
      it('should be rejected with TypeError', function () {
        expect(packageManager.publish('source', 'win32', 12)).to.eventually.be.rejectedWith(TypeError, 'nachos-package-manager publish: target arch must be a string');
      });
    });

    describe('with not existing arch', function () {
      it('should be rejected with TypeError', function () {
        expect(packageManager.publish('source', 'win32', 'x32')).to.eventually.be.rejectedWith(TypeError, 'nachos-package-manager publish: target arch must be one of the following');
      });
    });
  });

  describe('with valid parameters', function () {
    var packageManager;

    beforeEach(function () {
      childProcess.exec = sinon.stub().callsArgWith(2, null, 'testRepo');

      mockery.registerMock('child-process', childProcess);

      mockery.enable({
        useCleanCache: true,
        warnOnReplace: false,
        warnOnUnregistered: false
      });
    });

    afterEach(function () {
      mockery.deregisterMock('child-process');
      mockery.disable();
    });

    describe('with private field in json', function () {
      beforeEach(function () {
        var serverApiMock = function () {
          return {
            connected: function () {
              return true;
            },
            setToken: function () {
              return true;
            }
          };
        };

        var settingsFileMock = sinon.stub().returns({
          get: sinon.stub().returns(Q.resolve({token: 'token'}))
        });

        var stream = sinon.stub().returns({
          pipe: function () {
            return this;
          },
          on: function (name, cb) {
            cb();

            return this;
          }
        });

        var jsonfile = {
          readFile: sinon.stub().callsArgWith(1, null, {
            test: 'testData',
            private: true
          })
        };

        fstream.Reader = stream;

        fs.unlink = function (file, cb) {
          cb();
        };

        fs.createWriteStream = sinon.stub();

        mockery.registerMock('jsonfile', jsonfile);
        mockery.registerMock('nachos-settings-file', settingsFileMock);
        mockery.registerMock('nachos-server-api', serverApiMock);
        mockery.registerMock('fstream', fstream);
        mockery.registerMock('fs', fs);
        mockery.registerMock('zlib', zlib);

        packageManager = require('../../lib');
      });

      afterEach(function () {
        mockery.deregisterMock('jsonfile');
        mockery.deregisterMock('nachos-server-api');
        mockery.deregisterMock('nachos-settings-file');
        mockery.deregisterMock('fstream');
        mockery.deregisterMock('fs');
        mockery.deregisterMock('zlib');
      });

      it('should be rejected', function () {
        return expect(packageManager.publish('test', 'win32', 'x64')).to.eventually.be.rejectedWith('can\'t publish private package');
      });
    });

    describe('with no user connected', function () {
      beforeEach(function () {
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

        var jsonfile = {
          readFile: sinon.stub().callsArgWith(1, null, {test: 'testData'})
        };

        mockery.registerMock('jsonfile', jsonfile);
        mockery.registerMock('nachos-server-api', serverApiMock);

        packageManager = require('../../lib');
      });

      afterEach(function () {
        mockery.deregisterMock('jsonfile');
        mockery.deregisterMock('nachos-server-api');
      });

      it('should be rejected', function () {
        return expect(packageManager.publish('test', 'win32', 'x64')).to.eventually.be.rejectedWith('There is no logged-in user.');
      });
    });

    describe('with upload errors', function () {
      beforeEach(function () {
        var jsonfile = {
          readFile: sinon.stub().callsArgWith(1, null, {test: 'testData'})
        };

        mockery.registerMock('jsonfile', jsonfile);
      });

      afterEach(function () {
        mockery.deregisterMock('jsonfile');
      });

      describe('server error', function () {
        beforeEach(function () {
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
                  return Q.reject({
                    response: {
                      statusCode: 500
                    }
                  });
                }
              }
            };
          };

          var settingsFileMock = sinon.stub().returns({
            get: sinon.stub().returns(Q.resolve({token: 'token'}))
          });

          var stream = sinon.stub().returns({
            pipe: function () {
              return this;
            },
            on: function (name, cb) {
              cb();

              return this;
            }
          });

          fstream.Reader = stream;

          fs.unlink = function (file, cb) {
            cb();
          };

          fs.createWriteStream = sinon.stub();

          mockery.registerMock('nachos-settings-file', settingsFileMock);
          mockery.registerMock('nachos-server-api', serverApiMock);
          mockery.registerMock('fstream', fstream);
          mockery.registerMock('fs', fs);
          mockery.registerMock('zlib', zlib);

          packageManager = require('../../lib');
        });

        afterEach(function () {
          mockery.deregisterMock('nachos-server-api');
          mockery.deregisterMock('nachos-settings-file');
          mockery.deregisterMock('fstream');
          mockery.deregisterMock('fs');
          mockery.deregisterMock('zlib');
        });

        it('should be rejected', function () {
          return expect(packageManager.publish('test', 'win32', 'x64')).to.eventually.be.rejectedWith({
            response: {
              statusCode: 500
            }
          });
        });
      });

      describe('no permissions error', function () {
        beforeEach(function () {
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
                  return Q.reject({
                    response: {
                      statusCode: 403
                    }
                  });
                }
              }
            };
          };

          var settingsFileMock = sinon.stub().returns({
            get: sinon.stub().returns(Q.resolve({token: 'token'}))
          });

          var stream = sinon.stub().returns({
            pipe: function () {
              return this;
            },
            on: function (name, cb) {
              cb();

              return this;
            }
          });

          fstream.Reader = stream;

          fs.unlink = function (file, cb) {
            cb();
          };

          fs.createWriteStream = sinon.stub();

          mockery.registerMock('nachos-settings-file', settingsFileMock);
          mockery.registerMock('nachos-server-api', serverApiMock);
          mockery.registerMock('fstream', fstream);
          mockery.registerMock('fs', fs);
          mockery.registerMock('zlib', zlib);

          packageManager = require('../../lib');
        });

        afterEach(function () {
          mockery.deregisterMock('nachos-server-api');
          mockery.deregisterMock('nachos-settings-file');
          mockery.deregisterMock('fstream');
          mockery.deregisterMock('fs');
          mockery.deregisterMock('zlib');
        });

        it('should be fulfilled', function () {
          return expect(packageManager.publish('test', 'win32', 'x64')).to.eventually.be.rejectedWith('permission denied, you are not an owner of this package');
        });
      });
    });

    describe('with connected user', function () {
      beforeEach(function () {
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

        var settingsFileMock = sinon.stub().returns({
          get: sinon.stub().returns(Q.resolve({token: 'token'}))
        });

        var stream = sinon.stub().returns({
          pipe: function () {
            return this;
          },
          on: function (name, cb) {
            cb();

            return this;
          }
        });

        var jsonfile = {
          readFile: sinon.stub().callsArgWith(1, null, {test: 'testData'})
        };

        fstream.Reader = stream;

        mockery.registerMock('jsonfile', jsonfile);
        mockery.registerMock('nachos-settings-file', settingsFileMock);
        mockery.registerMock('nachos-server-api', serverApiMock);
        mockery.registerMock('fstream', fstream);
        mockery.registerMock('zlib', zlib);

        packageManager = require('../../lib');
      });

      afterEach(function () {
        mockery.deregisterMock('jsonfile');
        mockery.deregisterMock('nachos-server-api');
        mockery.deregisterMock('nachos-settings-file');
        mockery.deregisterMock('fstream');
        mockery.deregisterMock('zlib', zlib);
      });

      it('should be fulfilled', function () {
        return expect(packageManager.publish('test', 'win32', 'x64')).to.eventually.be.fulfilled;
      });
    });
  });
});