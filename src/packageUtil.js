'use strict';

const http = require('http');
const request = require('request');
const fs = require('fs');
const zlib = require('zlib');

let getContent = function(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            // explicitly treat incoming data as utf8 (avoids issues with multi-byte chars)
            res.setEncoding('utf8');

            // incrementally capture the incoming response body
            let body = '';
            res.on('data', (d) => {
                body += d;
            });

            // do whatever we want with the response once it's done
            res.on('end', () => {
                if (res.statusCode === 200) {
                    resolve({
                        url: url,
                        body: body
                    });
                } else {
                    reject(res.statusMessage);
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
};

let download = function(url, fileDest) {
    return new Promise((resolve, reject) => {
        http.get(url, (response) => {
            let fileStream = fs.createWriteStream(fileDest);
            let encoding = response.headers['content-encoding'];
            let resolveDownload = () => {
                resolve({
                    file: fileDest
                });
            };
            switch (encoding) {
                case 'gzip':
                case 'deflate':
                    {
                        let gunzip = encoding === 'gzip' ? zlib.createGunzip() : zlib.createInflate();
                        response.pipe(gunzip);

                        let chunks = [];
                        gunzip.on('data', (chunk) => {
                            chunks.push(chunk);
                        }).on('end', (cc) => {
                            let buffer = Buffer.concat(chunks);
                            fileStream.write(buffer);
                            fileStream.end();
                        });

                        fileStream.on('finish', () => {
                            resolveDownload();
                        });
                        break;
                    }
                default:
                    response.pipe(fileStream);
                    fileStream.on('finish', () => {
                        resolveDownload();
                    });
            }
        }).on('error', (err) => {
            reject(err);
        });
    });
};

let uniqueAndSortArray = function(array) {
    return Array.from(new Set(array));
};

let findDAMContent = function(nodeValue, files) {
    files = files || [];
    if (typeof nodeValue === 'string' && nodeValue.indexOf('jcr:content') === -1 && nodeValue.trim().toLowerCase().startsWith('/content/dam')) {
        files.push(nodeValue);
        const regexSrc = /(href|src)\s*=\s*["']((?=\/content\/dam).*?)["']/gi;
        let matchSrc = regexSrc.exec(nodeValue.trim().toLowerCase());
        if (matchSrc) {
            let value = matchSrc[2];
            files.push(value.trim());
        }
    }

    return files;
};

let crawlerNodes = function(nodes, files) {
    files = files || [];
    for (let node in nodes) {
        if (nodes.hasOwnProperty(node)) {
            let nodeValue = nodes[node];
            if (typeof nodeValue === 'object' && !Array.isArray(nodeValue)) {
                crawlerNodes(nodeValue, files);
            } else {
                files = findDAMContent(nodeValue, files);
            }
        }
    }
    return files;
};

let requestPost = function(options) {
    return new Promise((resolve, reject) => {
        request.post(options, function(error, response, body) {
            if (error) {
                reject(error);
            } else {
                let resp = {
                    statusCode: response && response.statusCode,
                    statusMessage: response && response.statusMessage,
                    body: body
                };

                if (response.statusCode == 200) {
                    resolve(resp);
                } else {
                    reject(resp);
                }
            }
        });
    });
};

module.exports = {
    getContent: getContent,
    download: download,
    uniqueAndSortArray: uniqueAndSortArray,
    findDAMContent: findDAMContent,
    crawlerNodes: crawlerNodes,
    requestPost: requestPost
};