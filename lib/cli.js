'use strict';

var program = require('commander');
var inquirer = require('inquirer');
var nachosOpen = require('nachos-open');
var pkg = require('../package.json');
var lib = require('./');
var path = require('path');
var semver = require('semver');

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

program
  .command('open <app> [args...]')
  .description('Open a nachos app')
  .action(function (app, args) {
    nachosOpen(app, args)
      .catch(function (err) {
        console.log(err);
      });
  });

program
  .command('init')
  .description('Init a nachos.json')
  .action(function () {
    inquirer.prompt([
      {
        name: 'name',
        message: 'name:',
        type: 'input',
        'default': path.basename(process.cwd())
      },
      {
        name: 'version',
        message: 'version:',
        type: 'input',
        'default': '0.1.0',
        validate: function (version) {
          return semver.valid(version) ? true : 'fuck you';
        }
      },
      {
        name: 'type',
        message: 'choose package type:',
        choices: ['taco', 'burrito', 'dip'],
        type: 'list'
      }
    ], function (answers) {
      console.log(answers);

      /* A     lib.init(answers)
        .then(function () {
          console.log('lol');
        })
        .catch(function (err) {
          console.log(err);
        });*/
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