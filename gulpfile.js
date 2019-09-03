const args = require('yargs').argv;
const browserSync = require('browser-sync');
const config = require('./gulp.config')();
const del = require('del');
const gulp = require('gulp');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const $ = require('gulp-load-plugins')({lazy: true});
const styleGuide = require('devbridge-styleguide');

/**
 * yargs variables can be passed in to alter the behavior, when present.
 * Example: gulp serve-dev
 *
 * --verbose  : Various tasks will produce more output to the console.
 * --nosync   : Don't launch the browser with browser-sync when serving code.
 * --debug    : Launch debugger with node-inspector.
 * --debug-brk: Launch debugger and break on 1st line with node-inspector.
 * --startServers: Will start servers for midway tests on the test task.
 */

/**
 * List the available gulp tasks
 */
gulp.task('help', $.taskListing);
gulp.task('default', ['help']);

/**
 * Compile all scss to css
 * @return {Stream}
 */
gulp.task('styles', ['clean-styles'], function() {
    log('Compiling scss --> CSS');

    return gulp
        .src(config.scss)
        .pipe($.plumber())
        .pipe($.sass())
        .on('error', errorLogger)
        .on('error', $.sass.logError)
        .pipe($.autoprefixer({browsers: ['last 3 version', '> 5%', 'ie > 8']}))
        .pipe(gulp.dest(config.temp));
});

/**
 * Copy fonts
 * @return {Stream}
 */
gulp.task('fonts', ['clean-fonts'], function() {
    log('Copying fonts');

    return gulp
        .src(config.fonts)
        .pipe(gulp.dest(config.build + 'fonts'));
});

/**
 * Compress images
 * @return {Stream}
 */
gulp.task('images', ['clean-images'], function() {
    log('Compressing and copying images');

    return gulp
        .src(config.images)
        .pipe($.imagemin({optimizationLevel: 4}))
        .pipe(gulp.dest(config.build + 'images'));
});

/**
 * Wire-up the bower dependencies
 * @return {Stream}
 */
gulp.task('wiredep', function() {
    log('Wiring the bower dependencies into the ' + config.template.Base);

    const wiredep = require('wiredep').stream;
    const options = config.getWiredepDefaultOptions();

    return gulp
        .src(config.template.base)
        .pipe(wiredep(options))
        .pipe(inject(config.allJs))
        .pipe(gulp.dest(config.templates));
});

gulp.task('inject', ['wiredep', 'styles'], function() {
    log('Wire up css into the html, after files are ready');

    return gulp
        .src(config.template.base)
        .pipe(inject([config.temp + '*.css']))
        .pipe(gulp.dest(config.templates));
});

/**
 * Build everything
 * This is separate so we can run tests on
 * optimize before handling image or fonts
 */
gulp.task('build', ['optimize', 'images', 'fonts'], function() {
    log('Building everything');

    const msg = {
        title: 'gulp build',
        subtitle: 'Deployed to the build folder',
        message: 'Running `gulp serve-build`'
    };
    del(config.temp);
    log(msg);
    notify(msg);
});

/**
 * Optimize all files, move to a build folder,
 * and inject them into the new index.html
 * @return {Stream}
 */
gulp.task('optimize', ['inject'], function() {
    log('Optimizing the js, css, and html');

    // noconcat
    const assets = $.useref.assets({searchPath: './'});
    // Filters are named for the gulp-useref path
    const cssFilter = $.filter('**/*.css');
    const jsAppFilter = $.filter('**/' + config.optimized.app);
    const jslibFilter = $.filter('**/' + config.optimized.lib);
    const jshtmlFilter = $.filter('**/' + config.optimized.html);

    return gulp
        .src(config.index)
        .pipe($.plumber())
        .pipe(assets) // Gather all assets from the html with useref
        // Get the css
        .pipe(cssFilter)
        .pipe($.cssnano({zindex: false}))
        .pipe(getHeader())
        .pipe(cssFilter.restore())
        // Get the custom javascript
        .pipe(jsAppFilter)
        .pipe($.uglify())
        .pipe(getHeader())
        .pipe(jsAppFilter.restore())
         //Get the vendor javascript
        .pipe(jslibFilter)
        .pipe($.uglify()) // another option is to override wiredep to use min files
        .pipe(jslibFilter.restore())
        // Take inventory of the file names for future rev numbers
        .pipe($.rev())
        // Apply the concat and file replacement with useref
        .pipe(assets.restore())
        .pipe($.useref())
        // Replace the file names in the html with rev numbers
        .pipe($.revReplace())
        // Get the html templates
        .pipe(jshtmlFilter)
        .pipe($.googleCdn(require('./bower.json')))
        .pipe($.cdnizer(config.cdnizer))
        //.pipe($.htmlmin({collapseWhitespace: true, removeComments:true}))
        .pipe(jshtmlFilter.restore())
        // Deploying to the build folder
        .pipe(gulp.dest(config.build));
});

/**
 * Remove all files from the build, temp, and reports folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean', function(done) {
    const delconfig = [].concat(config.build, config.temp);
    log('Cleaning: ' + $.util.colors.blue(delconfig));
    del(delconfig, done);
});

/**
 * Remove all fonts from the build folder
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-fonts', function(done) {
    clean(config.build + 'fonts/**/*.*', done);
});

/**
 * Remove all images from the build folder
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-images', function(done) {
    clean(config.build + 'images/**/*.*', done);
});

/**
 * Remove all styles from the build and temp folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-styles', function(done) {
    const files = [].concat(
        config.temp + '**/*.css',
        config.build + 'styles/**/*.css'
    );
    clean(files, done);
});

/**
 * Remove all js and html from the build and temp folders
 * @param  {Function} done - callback when complete
 */
gulp.task('clean-code', function(done) {
    const files = [].concat(
        config.temp + '**/*.js',
        config.build + 'js/**/*.js',
        config.build + '**/*.html'
    );
    clean(files, done);
});

/**
 * serve the dev environment
 * --debug-brk or --debug
 * --nosync
 */
gulp.task('serve-dev', ['watchGulpfile', 'templates'], function() {
    serve(true /*isDev*/);
});

/**
 * serve the build environment
 * --debug-brk or --debug
 * --nosync
 */
gulp.task('serve-build', ['build'], function() {
    serve(false /*isDev*/);
});

/**
 * Bump the version
 * --type=pre will bump the prerelease version *.*.*-x
 * --type=patch or no flag will bump the patch version *.*.x
 * --type=minor will bump the minor version *.x.*
 * --type=major will bump the major version x.*.*
 * --version=1.2.3 will bump to a specific version and ignore other flags
 */
gulp.task('bump', function() {
    const msg = 'Bumping versions';
    const type = args.type;
    const version = args.ver;
    const options = {};
    if (version) {
        options.version = version;
        msg += ' to ' + version;
    } else {
        options.type = type;
        msg += ' for a ' + type;
    }
    log(msg);

    return gulp
        .src(config.packages)
        .pipe($.print())
        .pipe($.bump(options))
        .pipe(gulp.dest(config.root));
});

/**
 * Optimize the code and re-load browserSync
 */

gulp.task('templates', ['inject'], function() {
    return gulp.src(config.pages)
        .pipe($.plumber())
        .pipe($.data(getDataForTemplates))
        .pipe($.nunjucksRender({
            path: [config.templates]
        }))
        .pipe(gulp.dest(config.src))
});

gulp.task('start-styleguide', function () {
    styleGuide.startServer();
});

////////////////

/**
 * When files change, log it
 * @param  {Object} event - event that fired
 */
function changeEvent(event) {
    const srcPattern = new RegExp('/.*(?=/' + config.source + ')/');
    log('File ' + event.path.replace(srcPattern, '') + ' ' + event.type);
}

/**
 * Delete all files in a given path
 * @param  {Array}   path - array of paths to delete
 * @param  {Function} done - callback when complete
 */
function clean(path, done) {
    log('Cleaning: ' + $.util.colors.blue(path));
    del(path, done);
}

/**
 * Inject files in a sorted sequence at a specified inject label
 * @param   {Array} src   glob pattern for source files
 * @param   {String} label   The label name
 * @param   {Array} order   glob pattern for sort order of the files
 * @returns {Stream}   The stream
 */
function inject(src, label, order) {
    const options = {read: false};
    if (label) {
        options.name = 'inject:' + label;
    }

    return $.inject(orderSrc(src, order), options);
}

/**
 * Order a stream
 * @param   {Stream} src   The gulp.src stream
 * @param   {Array} order Glob array pattern
 * @returns {Stream} The ordered stream
 */
function orderSrc (src, order) {
    //order = order || ['**/*'];
    return gulp
        .src(src)
        .pipe($.if(order, $.order(order)));
}

/**
 * serve the code
 * --debug-brk or --debug
 * --nosync
 * @param  {Boolean} isDev - dev or build mode
 * @param  {Boolean} specRunner - server spec runner html
 */
function serve(isDev, specRunner) {
    startBrowserSync(isDev, specRunner);
}

/**
 * Start BrowserSync
 * --nosync will avoid browserSync
 */
function startBrowserSync(isDev) {
    if (args.nosync || browserSync.active) {
        return;
    }

    log('Starting BrowserSync on port 400');

    // If dev: watches less, compiles it to css, browser-sync handles reload
    if (isDev){
        gulp.watch([config.allScss], ['styles']).on('change', changeEvent);
        gulp.watch([config.views, config.template.data], ['templates']).on('change', changeEvent);
    }

    const options = {
        server:  {
            baseDir: isDev? config.src : config.build,
            routes: {
                "/bower_components": "bower_components",
                "/.tmp": ".tmp",
                "/src": "src",
                "/styleguide": "styleguide"
            }
        },
        port: 4000,
        files: isDev ? [
            config.temp + '*.css',
            config.temp + '*.map',
            config.src  + '**/*.*'
        ] : [],
        ghostMode: {
            clicks: true,
            location: false,
            forms: true,
            scroll: true
        },
        injectChanges: true,
        logFileChanges: true,
        logLevel: 'info',
        logPrefix: 'NameProject',
        notify: true,
        reloadDelay: 0
    };

    browserSync(options);
}

/**
 * Log an error message and emit the end of a task
 */
function errorLogger(error) {
    log('*** Start of Error ***');
    log(error);
    log('*** End of Error ***');
    this.emit('end');
}

/**
 * Format and return the header for files
 * @return {String}           Formatted file header
 */
function getHeader() {
    const pkg = require('./package.json');
    const template = ['/**',
        ' * <%= pkg.name %> - <%= pkg.description %>',
        ' * @authors <%= pkg.authors %>',
        ' * @version v<%= pkg.version %>',
        ' * @link <%= pkg.homepage %>',
        ' * @license <%= pkg.license %>',
        ' */',
        ''
    ].join('\n');
    return $.header(template, {
        pkg: pkg
    });
}

/**
 * Log a message or series of messages using chalk's blue color.
 * Can pass in a string, object or array.
 */
function log(msg) {
    if (typeof(msg) === 'object') {
        for (const item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.blue(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.blue(msg));
    }
}

/**
 * Show OS level notification using node-notifier
 */
function notify(options) {
    const notifier = require('node-notifier');
    const notifyOptions = {
        sound: 'Bottle',
        contentImage: path.join(__dirname, 'gulp.png'),
        icon: path.join(__dirname, 'gulp.png')
    };
    _.assign(notifyOptions, options);
    notifier.notify(notifyOptions);
}

/**
 * get data for templates
 */
function getDataForTemplates() {
    return JSON.parse(fs.readFileSync(config.template.data));
}

/**
* gulpfile.js Watch Itself
*/
gulp.slurped = false;
gulp.task("watchGulpfile", function(){

    if(!gulp.slurped){
        gulp.watch("gulpfile.js", ["serve-dev"]);
        gulp.slurped = true;
    }
});

module.exports = gulp;