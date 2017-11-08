const chokidar = require('chokidar');
const shell = require('shelljs');
const pathModule = require('path');

let watcher = chokidar.watch(['src/public/index.html', 'src/public/stages/*.html']);

watcher.on('change', function (path) {
    console.log(`${path} changed, copying to dist`);
    let newPath = pathModule.dirname(path.replace('src', 'dist'));
    shell.cp(path, newPath);
});