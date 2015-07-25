'use strict';

var chai = require('chai');
var expect = chai.expect;

chai.use(require('chai-as-promised'));

xdescribe('exports', function () {
  var packageManager = require('../lib');

  it('should be an object', function () {
    return expect(packageManager).to.be.an.object;
  });

  it('should have all methods', function () {
    expect(packageManager.install).to.be.a('function');
    expect(packageManager.uninstall).to.be.a('function');
    expect(packageManager.link).to.be.a('function');
    expect(packageManager.login).to.be.a('function');
    expect(packageManager.publish).to.be.a('function');
  });
});