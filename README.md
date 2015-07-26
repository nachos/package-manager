# package-manager

Nachos package manager

<table>
  <thead>
    <tr>
      <th>Linux</th>
      <th>OSX</th>
      <th>Windows</th>
      <th>Coverage</th>
      <th>Dependencies</th>
      <th>DevDependencies</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td colspan="2" align="center">
        <a href="https://travis-ci.org/nachos/package-manager"><img src="https://img.shields.io/travis/nachos/package-manager.svg?style=flat-square"></a>
      </td>
      <td align="center">
        <a href="https://ci.appveyor.com/project/nachos/package-manager"><img src="https://img.shields.io/appveyor/ci/nachos/package-manager.svg?style=flat-square"></a>
      </td>
      <td align="center">
<a href='https://coveralls.io/r/nachos/package-manager'><img src='https://img.shields.io/coveralls/nachos/package-manager.svg?style=flat-square' alt='Coverage Status' /></a>
      </td>
      <td align="center">
        <a href="https://david-dm.org/nachos/package-manager"><img src="https://img.shields.io/david/nachos/package-manager.svg?style=flat-square"></a>
      </td>
      <td align="center">
        <a href="https://david-dm.org/nachos/package-manager#info=devDependencies"><img src="https://img.shields.io/david/dev/nachos/package-manager.svg?style=flat-square"/></a>
      </td>
    </tr>
  </tbody>
</table>

## Have a problem? Come chat with us!
[![Join the chat at https://gitter.im/nachos/packages](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/nachos/package-manager?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

## Installation
As cli tool
``` bash
$ [sudo] npm install nachos-package-manager -g
```

Programmatically
``` bash
$ [sudo] npm install nachos-package-manager --save
```

## Usage
### cli
#### Example
``` bash
$ nachos install your-package
```
#### Options
``` bash
$ nachos --help

  Usage: nachos <command>


  Commands:

    login | l                  Login
    install | i <package>      Install a package
    uninstall | uni <package>  Uninstall a package
    publish [path]             Publish a package
    link [path]                Link a package

  Nachos package manager

  Options:

    -h, --help     output usage information
    -V, --version  output the version number

```


### Programmatically
#### Initialize
``` js
var nachosPackagesManager = require('nachos-package-manager');
```

#### install(packageName)
Install a package
``` js
nachosPackagesManager.install('your-package')
  .then(function (folder) {
    // folder -> user/home/.nachos/packages/your/package
  });
```

#### uninstall(packageName)
Unistall a package
``` js
nachosPackagesManager.uninstall('your-package')
  .then(function () {
    // Uninstalled successfully
  });
```

#### link(source)
Link a directory to nachos packages
``` js
nachosPackagesManager.link('path/to/your-package')
  .then(function (data) {
    /** data: 
        {
          src: 'path/to/your/package',
          dest: 'path/of/link'
        }
    */
  });
```

#### publish(source)
Publish a package
``` js
nachosPackagesManager.publish('path/to/your-package')
  .then(function () {
    // Published successfully
  });
```

#### login(data)
Login to nachos
``` js
nachosPackagesManager.login({email: 'your@email.com', password: 'yourP@$$w0rd'})
  .then(function () {
    // Logged in successfully
  });
```

## Run Tests
``` bash
$ npm test
```

## License

[MIT](LICENSE)
