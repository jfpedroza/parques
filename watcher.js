const chokidar = require('chokidar');
const shell = require('shelljs');

let watcher = chokidar.watch('src/public/index.html');

watcher.on('change', function (path) {
    console.log(`${path} changed, copying to dist`);
    shell.cp('src/public/index.html', 'dist/public/');
});