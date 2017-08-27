const aemPackageWithDam = require('aem-package-with-dam');

aemPackageWithDam({
    host: 'http://admin:admin@localhost:4502',
    name: 'mypackage-sample01',
    paths: '/content/geometrixx',
    download: true
});