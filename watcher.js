const chokidar = require('chokidar');
const shell = require('shelljs');
const pathModule = require('path');

let htmlWatcher = chokidar.watch(['src/public/*.html', 'src/public/stages/*.html', 'src/public/js/admin/views/*.html']);

htmlWatcher.on('change', function (path) {
    console.log(`${path} changed, copying to dist`);
    let newPath = pathModule.dirname(path.replace('src', 'dist'));
    shell.cp(path, newPath);
});

let tsWatcher = chokidar.watch(['src/public/js/**/*.ts', 'src/models/*.ts']);

tsWatcher.on('change', function (path) {
    console.log(`${path} changed, compiling main.ts into bundle.js`);
    shell.exec('npm run build-main-ts');
    console.log(`${path} changed, compiling app.module.ts into admin-bundle.js`);
    shell.exec('npm run build-admin-ts');
});

let scssWatcher = chokidar.watch(['src/public/css/main.scss']);

scssWatcher.on('change', function (path) {
    console.log(`${path} changed, compiling main.scss into main.css`);
    shell.exec('npm run build-sass');
});