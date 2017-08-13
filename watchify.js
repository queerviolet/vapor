const browserify = require('browserify')
    , watchify = require('watchify')
    , livereload = require('browserify-livereload')
    , errorify = require('errorify')
    , fs = require('fs')

const b = browserify(__dirname + '/index.js', {
  extensions: ['.js', '.jsx', '.json', '.kubo', '.mmm'],
  cache: {},
  packageCache: {},
  debug: true,
  plugin: [watchify, errorify],
})

b.plugin(livereload, {
  host: 'localhost',
  port: 1337,
  outfile: __dirname + '/bundle.js'
})

b.on('update', bundle);
bundle();

function bundle() {
  console.log('compiling bundle.js')
  b.bundle().pipe(fs.createWriteStream('bundle.js'))
    .on('finish', () => console.log('wrote bundle.js'))
}

