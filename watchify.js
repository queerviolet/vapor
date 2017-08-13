const browserify = require('browserify')
    , watchify = require('watchify')
    , errorify = require('errorify')
    , fs = require('fs')

const b = browserify(__dirname + '/index.js', {
  extensions: ['.js', '.jsx', '.json', '.kubo', '.mmm'],
  cache: {},
  packageCache: {},
  debug: true,
  plugin: [watchify, errorify],
})

b.on('update', bundle);
bundle();

function bundle() {
  b.bundle().pipe(fs.createWriteStream('bundle.js'));
}