'use strict';

var program = require('commander');
var inquirer = require('inquirer');
var pkg = require('../package.json');
var lib = require('./');

program
  .version(pkg.version)
  .description('Nachos package manager')
  .usage('<command>');

program
  .command('login')
  .alias('l')
  .description('Login')
  .action(function () {
    inquirer.prompt([
      {
        name: 'email',
        message: 'Username:'
      },
      {
        name: 'password',
        message: 'Password:',
        type: 'password'
      }
    ], function (answers) {
      lib.login(answers)
        .then(function () {
          console.log('Successfully logged in');
        })
        .catch(function (err) {
          console.log(err);
        });
    });
  });

program
  .command('install <package>')
  .alias('i')
  .description('Install a package')
  .action(function (pkg) {
    console.log('installing ' + pkg);

    lib.install(pkg)
      .then(function () {
        console.log('finished installing ' + pkg);
      })
      .catch(function (err) {
        console.log(err);
      });
  });

program
  .command('uninstall <package>')
  .alias('uni')
  .description('Uninstall a package')
  .action(function (pkg) {
    console.log('uninstalling ' + pkg);

    lib.uninstall(pkg)
      .then(function () {
        console.log('finished uninstalling ' + pkg);
      })
      .catch(function (err) {
        console.log(err);
      });
  });

program
  .command('publish [path]')
  .description('Publish a package')
  .action(function (path) {
    console.log('publishing');

    lib.publish(path || process.cwd())
      .then(function () {
        console.log('finished publishing');
      })
      .catch(function (err) {
        console.log(err);
      });
  });

program
  .command('link [path]')
  .description('Link a package')
  .action(function (path) {
    console.log('linking');

    lib.link(path || process.cwd())
      .then(function (data) {
        console.log('%s -> %s', data.src, data.dest);
      })
      .catch(function (err) {
        console.log(err);
      });
  });

/**
 * Handle cli arguments
 *
 * @param {string[]} argv - string array of the arguments
 */
module.exports = function (argv) {
  program
    .parse(argv);

  if (argv.length <= 2) {
    program.help();
  }
};