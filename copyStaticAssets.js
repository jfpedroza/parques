/**
 * @author Jhon Pedroza <jhonfpedroza@gmail.com>
 */
const shell = require('shelljs');

if (!shell.test('-e', '/dist/')) {
    shell.mkdir('/dist/');
}

shell.cp('-R', 'src/public/img', 'dist/public/');
shell.cp('-R', 'src/public/js/lib', 'dist/public/js/');
shell.cp('-R', 'src/public/css/lib', 'dist/public/css/');
shell.cp('-R', 'src/public/css/fonts', 'dist/public/css/');
shell.cp('src/public/index.html', 'dist/public/');
shell.cp('src/public/favicon.ico', 'dist/public/');
shell.cp('-R', 'src/public/stages', 'dist/public');