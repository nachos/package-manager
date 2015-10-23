'use strict';

var program = require('commander');
var inquirer = require('inquirer');
var nachosOpen = require('nachos-open');
var pkg = require('../package.json');
var lib = require('./');
var auth = require('./auth');
var path = require('path');
var semver = require('semver');
var validate = require('validate-npm-package-name');
var validator = require('validator');
var Q = require('q');

program
  .version(pkg.version)
  .description('Nachos package manager')
  .usage('<command>');

var login = function () {
  var deferred = Q.defer();

  inquirer.prompt([
    {
      name: 'email',
      message: 'Username:',
      validate: function (email) {
        return validator.isEmail(email) ? true : 'Invalid email format';
      }
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
        deferred.resolve();
      })
      .catch(function (err) {
        deferred.reject(err);
      });
  });

  return deferred.promise;
};

program
  .command('login')
  .alias('l')
  .description('Login')
  .action(login);

program
  .command('install <package>')
  .alias('i')
  .description('Install a package')
  .action(function (pkg) {
    if (!pkg) {
      console.log('You must provide a package name');

      return;
    }

    auth.get()
      .then(function (token) {
        if (!token) {
          return login();
        }
      })
      .then(function () {
        console.log('installing ' + pkg);

        return lib.install(pkg);
      })
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
  .command('publish <os> <arch> [path]')
  .description('Publish a package')
  .action(function (os, arch, path) {
    console.log('publishing');

    auth.get()
      .then(function (token) {
        if (!token) {
          return login();
        }
      })
      .then(function () {
        return lib.publish(path || process.cwd(), os, arch);
      })
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
  .command('unlink [path]')
  .description('Unlink a package')
  .action(function (path) {
    console.log('unlinking');

    lib.unlink(path || process.cwd())
      .then(function (dest) {
        console.log('%s unlinked', dest);
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
    console.log('Initializing nachos.json');

    inquirer.prompt([
      {
        name: 'name',
        message: 'name:',
        type: 'input',
        'default': path.basename(process.cwd()),
        validate: function (name) {
          var validationResult = validate(name);

          return validationResult.validForNewPackages ? true : validationResult.errors.join('\n');
        }
      },
      {
        name: 'version',
        message: 'version:',
        type: 'input',
        'default': '0.1.0',
        validate: function (version) {
          return semver.valid(version) ? true : 'not a valid package version';
        }
      },
      {
        name: 'type',
        message: 'choose package type:',
        choices: ['taco', 'burrito', 'dip'],
        type: 'list'
      },
      {
        name: 'description',
        message: 'description:',
        type: 'input'
      },
      {
        name: 'github',
        message: 'git repository: ',
        type: 'input'
      },
      {
        name: 'author',
        message: 'author: ',
        type: 'input'
      },
      {
        name: 'private',
        message: 'is it private?',
        type: 'confirm',
        default: false
      },
      {
        name: 'website',
        message: 'website: ',
        type: 'input'
      },
      {
        name: 'keywords',
        message: 'keywords: ',
        type: 'input',
        filter: function (keywords) {
          return keywords.split(' ');
        }
      }
    ], function (answers) {
      lib.init(answers)
        .then(function () {
          console.log('nachos.json created successfully');
        })
        .catch(function (err) {
          console.log(err);
        });
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