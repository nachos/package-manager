var program = require('commander');
var pkg = require('../package.json');
var lib = require('./');

program
  .version(pkg.version)
  .description('Nachos package manager')
  .usage('<command>');

program
  .command('install <package>')
  .alias('i')
  .description('Install a package')
  .action(function (pkg) {
    console.log('installing ' + pkg);

    lib.install(pkg, function (err) {
      if (err) {
        console.log(err);
        return;
      }

      console.log('finished installing ' + pkg);
    });
  });

program
  .command('uninstall <package>')
  .alias('uni')
  .description('Uninstall a package')
  .action(function (pkg) {
    console.log('uninstalling ' + pkg);

    lib.uninstall(pkg, function (err) {
      if (err) {
        console.log(err);
        return;
      }

      console.log('finished uninstalling ' + pkg);
    });
  });

program
  .command('publish [path]')
  .description('Publish a package')
  .action(function (path) {
    console.log('publishing');

    lib.publish(path || process.cwd(), function (err) {
      if (err) {
        console.log(err);
        return;
      }

      console.log('finished publishing');
    });
  });

program
  .command('link [path]')
  .description('Link a package')
  .action(function (path) {
    console.log('linking');

    lib.link(path || process.cwd(), function (err, data) {
      if (err) {
        console.log(err);
        return;
      }

      console.log('%s -> %s', data.src, data.dest);
    });
  });

//program
//  .command('*')
//  .action(function(){
//    program.help();
//  });

program
  .parse(process.argv);

if (!program.args.length) program.help();