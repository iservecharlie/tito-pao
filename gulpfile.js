"use strict";

// Load plugins
const browsersync = require("browser-sync").create();
const del = require("del");
const gulp = require("gulp");
const cleanCSS = require("gulp-clean-css");
const plumber = require("gulp-plumber");
const rename = require("gulp-rename");
const sass = require("gulp-sass");
const uglify = require("gulp-uglify");
const connect = require("gulp-connect");
const merge = require("merge-stream");

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./"
    },
    port: 3000
  });
  done();
}

// BrowserSync reload
function browserSyncReload(done) {
  browsersync.reload();
  done();
}

// Clean vendor
function clean() {
  return del(["./static/"]);
}

// Bring third party dependencies from node_modules into vendor directory
function modules() {
  // Bootstrap JS
  var bootstrapJS = gulp.src('./node_modules/bootstrap/dist/js/*')
    .pipe(gulp.dest('./static/js/bootstrap'));
  // Bootstrap SCSS
  var bootstrapSCSS = gulp.src('./node_modules/bootstrap/scss/**/*')
    .pipe(gulp.dest('./static/scss/bootstrap'));
  // Font Awesome
  var fontAwesome = gulp.src('./node_modules/@fortawesome/**/*')
    .pipe(gulp.dest('./static/font'));
  // jQuery
  var jquery = gulp.src([
      './node_modules/jquery/dist/*',
      '!./node_modules/jquery/dist/core.js'
    ])
    .pipe(gulp.dest('./static/js/jquery'));
  return merge(bootstrapJS, bootstrapSCSS, fontAwesome, jquery);
}
// Images task
function img() {
    return gulp
        .src(["./src/img/**/*.jpg", "./src/img/**/*.png"])
        .pipe(gulp.dest("./static/img"))
        .pipe(browsersync.stream());
}
// SVG task
function svg() {
    return gulp
        .src(["./src/svg/**/*.svg"])
        .pipe(gulp.dest("./static/svg"))
        .pipe(browsersync.stream());
}

// CSS task
function css() {
  return gulp
    .src(["./src/scss/**/*.scss", "./static/scss/**/*.scss", "./src/css/**/*.css"])
    .pipe(plumber())
    .pipe(sass({
      outputStyle: "expanded",
      includePaths: "./node_modules",
    }))
    .on("error", sass.logError)
    .pipe(gulp.dest("./static/css"))
    .pipe(rename({
      suffix: ".min"
    }))
    .pipe(cleanCSS())
    .pipe(gulp.dest("./static/css"))
    .pipe(browsersync.stream());
}

// JS task
function js() {
  return gulp
    .src([
      "./src/js/**/*.js",
      "!./src/js/**/*.min.js"
    ])
    .pipe(uglify())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest("./static/js"))
    .pipe(browsersync.stream());
}

// Watch files
function watchFiles() {
  gulp.watch("./static/scss/**/*", css);
  gulp.watch(["./static/js/**/*", "!./static/js/**/*.min.js"], js);
  gulp.watch("*.html", browserSyncReload);
}

function startServer() {
    connect.server({
        root: ["./"],
        port: process.env.PORT || 5000, // localhost:5000
        livereload: false
    });
}

// Define complex tasks
const dist = gulp.series(clean, modules);
const build = gulp.series(dist, gulp.parallel(img, svg, css, js));
const watch = gulp.series(build, gulp.parallel(watchFiles, browserSync));
const deploy = gulp.series(build, startServer);

// Export tasks
exports.img = img;
exports.svg = svg;
exports.css = css;
exports.js = js;
exports.clean = clean;
exports.dist = dist;
exports.build = build;
exports.watch = watch;
exports.default = build;
exports.deploy = deploy;