const fse = require('fs-extra');
const path = require('path');

const TARGET_PATH = './tmp';
const filesToMove = [
  'dist',
  'CHANGELOG.md',
  'CONTRIBUTING.md',
  'LICENSE',
  'package.json',
  'README.md',
];

filesToMove.forEach((file) => {
  fse.copySync(
    path.resolve(`./${file}`),
    path.resolve(`${TARGET_PATH}/${file}`),
    { overwrite: true });
});
