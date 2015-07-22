'use strict';

var chai = require('chai');
var expect = chai.expect;

chai.use(require('chai-as-promised'));

describe('package-manager', function () {
  describe('exports', function () {
    var packageManager = require('../lib');

    it('should be an object', function () {
      return expect(packageManager).to.be.an.object;
    });

    it('should have all methods', function () {
    });
  });

  describe('link', function () {
    describe('without parameters', function () {
      var packageManager = require('../lib');

      it('should be rejected with TypeError', function () {
        return expect(packageManager.link()).to.eventually.be.rejectedWith(TypeError);
      });
    });

    it('should be awesome', function () {
      var packageManager = require('../lib');

      return expect(packageManager.link('source')).to.be.empty;
    });
  });
});