# AEM Package With DAM

[![NPM version](https://badge.fury.io/js/simple-slider.svg)](https://npmjs.org/package/aem-package-with-dam)
[![license](http://img.shields.io/badge/license-MIT-blue.svg?style=flat)](https://raw.githubusercontent.com/viniciusdiogo/aem-package-with-dam/master/LICENSE)

## About

**aem-package-with-dam** is a tool for [AEM - Adobe Experience Manager](https://docs.adobe.com/content/docs/en/aem/6-1.html)
to generate **content packages** with all **DAM** dependencies.

The package generated will be also available in **Package Manager** http://localhost:4502/crx/packmgr/index.jsp.

## Install

Available on **npm**:

```sh
npm install aem-package-with-dam -g
```

## Usage

```sh
aem-package-with-dam -n myPackageName -p /content/geometrixx
```

## Options
| Option   	| Description | 
| -			| -			  | 
| `-h`  | AEM Host - [Default: http://admin:admin@localhost:4502] |
| `-n`  | Name of package. **(without .zip extension)** | 
| `-p` | Paths of content. |
| `-d` | If **true** download generated package. [Default: true] |

## Examples
```
$ aem-package-with-dam -n myPackageName -p /content/mycontent
```

```
$ aem-package-with-dam -n myPackageName --p '/content/mycontent,/content/another-content'
```

```
$ aem-package-with-dam -h http://admin:admin@localhost:4502 -n myPackageName -p '/content/mycontent,/content/another-content' -d false
```

## Notes
Tested in versions:
- AEM: 6.1
- Node.js: 6.11.2

## License

MIT © [Vinicius Diogo](http://viniciusdiogo.com.br) \<viniciusdiogo@gmail.com\>