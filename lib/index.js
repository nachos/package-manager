'use strict';

module.exports = {
  login: require('./commands/login'),
  install: require('./commands/install'),
  uninstall: require('./commands/uninstall'),
  publish: require('./commands/publish'),
  link: require('./commands/link'),
  unlink: require('./commands/unlink'),
  init: require('./commands/init')
};