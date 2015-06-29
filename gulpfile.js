/**!
 * @file Gulp build system.
 * @author Philippe Sawicki (https://github.com/philsawicki)
 * @copyright Copyright Philippe Sawicki 2015
 * @license MIT
 */

'use strict';


/**********************************
 *          Build Plugins         *
 **********************************/

var browserify   = require('browserify');
var gulp         = require('gulp');
var autoprefixer = require('gulp-autoprefixer')
var concat       = require('gulp-concat');
var htmlmin      = require('gulp-htmlmin');
var imagemin     = require('gulp-imagemin');
var minifyCSS    = require('gulp-minify-css');
var plumber      = require('gulp-plumber');
var replace      = require('gulp-replace');
var sourceMaps   = require('gulp-sourcemaps');
var uglify       = require('gulp-uglify');
var gutil        = require('gulp-util');
var path         = require('path');
var source       = require('vinyl-source-stream');
var buffer       = require('vinyl-buffer');


/**
 * Browser definitions for "Autoprefixer".
 * 
 * @type {Array}
 */
var AUTOPREFIXER_BROWSERS = [
    'last 3 versions',
    'ie >= 8',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
];

/**
 * Paths for Application resources.
 * 
 * @type {Object}
 */
var PATHS = {
    src: {
        scripts: ['./src/js/**/*.js'],
        styles:  ['./src/css/**/*.css'],
        markup:  ['./src/**/*.html'],
        images:  ['./src/img/**/*.{png,gif,jpg,jpeg}']
    },
    dest: {
        scripts: path.join(__dirname, './dist/js'),
        styles:  path.join(__dirname, './dist/css'),
        markup:  path.join(__dirname, './dist'),
        images:  path.join(__dirname, './dist/img')
    }
};



/**********************************
 *        Helper Functions        *
 **********************************/

/**
 * Return a Timestamp to use for cache-busting resources.
 * 
 * @return {String} A Timestamp to use for cache-busting resources.
 */
var getTimestamp = function () {
    var now = new Date();

    var timestamp = [
        now.getFullYear(),                      // Year
        ('0' + (now.getMonth() + 1)).slice(-2), // Month
        ('0' + now.getDate()).slice(-2),        // Day
        ('0' + now.getHours()).slice(-2),       // Hours
        ('0' + now.getMinutes()).slice(-2),     // Minutes
        ('0' + now.getSeconds()).slice(-2),     // Seconds
    ];

    return timestamp.join('-');
};

/**
 * "Plumber" error handler.
 * 
 * @param  {Object} error The Gulp error.
 * @return {void}
 */
var errorHandler = function (error) {
  //gutil.beep();
  console.log(error);
  this.emit('end');
};



/**********************************
 *           Gulp Tasks           *
 **********************************/


/**
 * Build JavaScript libraries.
 */
gulp.task('javascript:libraries', function () {
    var libraries = [
        './src/js/libs/OrbitControls.js'
    ];

    return gulp.src(libraries)
        // Bind the custom error handler:
        .pipe(plumber({ errorHandler: errorHandler }))

        // Rename the output stream:
        .pipe(concat('libraries.min.js'))

        // Minify stream:
        .pipe(uglify())

        // Output resulting streams to the proper destination folder:
        .pipe(gulp.dest(PATHS.dest.scripts));
});

/**
 * Build JavaScript App.
 */
gulp.task('javascript:app', function () {
    // Set up the Browserify instance on a task basis
    var b = browserify({
        entries: ['./src/js/main.js'],
        debug: true
    });

    return b.bundle()
        // Bind the custom error handler:
        .pipe(plumber({ errorHandler: errorHandler }))

        // Rename the output stream:
        .pipe(source('main.min.js'))
        .pipe(buffer())

        // Create sourceMaps for debugging:
        .pipe(sourceMaps.init({ loadMaps: true }))
            // Add transformation tasks to the pipeline (minifying output):
            .pipe(uglify())
            .on('error', gutil.log)
        .pipe(sourceMaps.write('./'))

        // Output resulting streams to the proper destination folder:
        .pipe(gulp.dest(PATHS.dest.scripts));
});

/**
 * Minify HTML output.
 */
gulp.task('minify:html', function () {
    var timestamp = getTimestamp();

    return gulp.src(PATHS.src.markup)
        // Bind the custom error handler:
        .pipe(plumber({ errorHandler: errorHandler }))

        // Add cache-busting to resources:
        .pipe(replace(/style.min.css\?v=([0-9]*)/g, 'style.min.css?v=' + timestamp))
        .pipe(replace(/libraries.min.js\?v=([0-9]*)/g, 'libraries.min.js?v=' + timestamp))
        .pipe(replace(/main.min.js\?v=([0-9]*)/g, 'main.min.js?v=' + timestamp))

        // Minify HTML output.
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true
        }))

        // Output resulting streams to the proper destination folder:
        .pipe(gulp.dest(PATHS.dest.markup));
});

/**
 * Minify CSS output.
 */
gulp.task('minify:css', function () {
    var cssFiles = [
        './src/css/style_no_stats.css',
        './src/css/preloader.css',
        './src/css/style.css'
    ];

    return gulp.src(cssFiles)
        // Bind the custom error handler:
        .pipe(plumber({ errorHandler: errorHandler }))

        // Rename the output stream:
        .pipe(concat('style.min.css'))

        // Add vendor prefixes to CSS rules:
        .pipe(autoprefixer(AUTOPREFIXER_BROWSERS))

        // Minify CSS output:
        .pipe(minifyCSS({ compatibility: 'ie8' }))

        // Output resulting streams to the proper destination folder:
        .pipe(gulp.dest(PATHS.dest.styles));
});

/**
 * Copy images.
 */
gulp.task('copy:images', function () {
    return gulp.src(PATHS.src.images)
        // Bind the custom error handler:
        .pipe(plumber({ errorHandler: errorHandler }))

        // Optimize images:
        .pipe(imagemin({
            progressive: true,
            interlaced: true,
            svgoPlugins: [
                { removeViewBox: false },
                { removeUselessStrokeAndFill: false }
            ]
        }))

        // Output resulting streams to the proper destination folder:
        .pipe(gulp.dest(PATHS.dest.images));
});



/**********************************
 *         Gulp Watchers          *
 **********************************/

/**
 * Run the tasks when a file changes.
 */
gulp.task('watch', function () {
    gulp.watch(PATHS.src.scripts, ['javascript:libraries', 'javascript:app', 'minify:html']);
    gulp.watch(PATHS.src.styles,  ['minify:css']);
    gulp.watch(PATHS.src.markup,  ['minify:html']);
    gulp.watch(PATHS.src.images,  ['copy:images']);
})

/**
 * Build the Application assets.
 */
gulp.task('build', ['javascript:libraries', 'javascript:app', 'minify:html', 'minify:css', 'copy:images']);

/**
 * The default task to run (called when running `gulp` from CLI).
 */
gulp.task('default', ['watch']);
