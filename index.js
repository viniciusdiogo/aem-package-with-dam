#!/usr/bin/env node

const util = require('util');
const parseArgs = require('minimist');
const colors = require('colors');
const path = require('path');
const packageUtil = require('./src/packageUtil');

let buildConsole = function() {
    let argv = parseArgs(process.argv.slice(2), {
        default: {
            h: 'http://admin:admin@localhost:4502',
            d: true
        }
    });

    let help = `
    Usage: aem-package-with-dam -h http://admin:admin@localhost:4502 -n mypackname -p '/content/geometrixx'

    AEM Package with DAM

        Options:
            -h          AEM host. [Default: http://admin:admin@localhost:4502]
            -n          Package name.
            -p          Paths to content. e.g.: '/content/mycontent,/content/another-content'.
            -d          Download package after build. [Default: true]
`;

    if (!argv.n || !argv.p) {
        console.log(help);
        return null;
    }

    return argv;
};

let aemPackageWithDam = function(params) {

    if (!params || !params.host || !params.name || !params.paths) {
        console.log('Parameters \'host\', \'name\' and \'paths\' is required.');
        return;
    }

    let pathsContent = params.paths ? params.paths.split(',') : '';
    let packageName = params.name;
    let packageNameZip = params.name + '.zip';
    let groupName = 'my_packages';

    let urlCreatePackage = params.host + util.format('/crx/packmgr/service/.json/etc/packages/%s/%s?cmd=create', groupName, packageNameZip);
    let urlBuildPackage = params.host + util.format('/crx/packmgr/service/.json/etc/packages/%s/%s?cmd=build', groupName, packageNameZip);
    let urlUpdatePackage = params.host + '/crx/packmgr/update.jsp';
    let urlDownloadPackage = params.host + util.format('/etc/packages/%s/%s', groupName, packageNameZip);
    let urlListPackages = params.host + '/crx/packmgr/service.jsp?cmd=ls';
    let getUrlJsonContent = function(url) {
        return params.host + path.join('/crx/server/crx.default/jcr%3aroot', url.trim()) + '.-1.json';
    };

    console.log();

    packageUtil.getContent(urlListPackages)
        .then((response) => {
            if (response.body.indexOf(packageNameZip) !== -1) {
                console.log(' Package name "%s" already exists in AEM. Please choice another package name.\n', packageNameZip);
                process.exit(0);
            } else {
                console.log('- Get content JSON.');
                let promisesContent = [];
                let baseUrls = {};
                pathsContent.forEach(function(path) {
                    path = path.trim();
                    let fullURL = getUrlJsonContent(path);
                    promisesContent.push(packageUtil.getContent(fullURL));
                    baseUrls[fullURL] = path;
                });

                return Promise.all(promisesContent)
                    .then((contents) => {
                        let jsonPack = [];
                        let damFiles = [];

                        console.log('- Finding DAM assets in nodes.');
                        contents.forEach(function(content) {
                            let nodes = JSON.parse(content.body);
                            damFiles = damFiles.concat(packageUtil.crawlerNodes(nodes));
                            jsonPack.push({
                                'root': baseUrls[content.url],
                                'rules': []
                            });
                        });

                        console.log('- Remove duplicated DAM assets and sort.');
                        damFiles = packageUtil.uniqueAndSortArray(damFiles);
                        damFiles.sort();

                        console.log('- Generate package filters.');
                        for (let i = 0; i < damFiles.length; i++) {
                            let damFile = damFiles[i].split('?')[0].trim();
                            jsonPack.push({
                                'root': damFile,
                                'rules': []
                            });
                        }
                        let jsonPackString = JSON.stringify(jsonPack);

                        console.log('- Created package. name: %s', colors.inverse(packageNameZip));
                        return packageUtil.requestPost({
                            url: urlCreatePackage,
                            form: {
                                'packageName': packageNameZip,
                                'groupName': groupName,
                                '_charset_': 'UTF-8'
                            }
                        }).then(() => {
                            console.log('- Updated filter on package.');
                            return packageUtil.requestPost({
                                url: urlUpdatePackage,
                                formData: {
                                    'path': util.format('/etc/packages/%s/%s', groupName, packageNameZip),
                                    'packageName': packageName,
                                    'groupName': groupName,
                                    'filter': jsonPackString,
                                    '_charset_': 'UTF-8'
                                }
                            });
                        }).then(() => {
                            console.log('- Building package.');
                            return packageUtil.requestPost({
                                url: urlBuildPackage
                            });
                        }).then(() => {
                            console.log('- Building finished.');
                            if (params.download === true) {
                                console.log('- Downloading package.');
                                return packageUtil.download(urlDownloadPackage, path.resolve(packageNameZip))
                                    .then((resp) => {
                                        console.log('- Download finished. file: %s', colors.inverse(resp.file));
                                        return resp;
                                    });
                            }
                        });
                    });
            }
        })
        .catch((err) => {
            console.error('  Error on build Package. %s', err);
        });
};

let main = function() {
    let params = buildConsole();
    if (params) {
        aemPackageWithDam({
            host: params.h,
            name: params.n,
            paths: params.p,
            download: params.d
        });
    }
};

if (require.main === module) {
    main();
}

aemPackageWithDam.main = main;

module.exports = aemPackageWithDam;