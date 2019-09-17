module.exports = function() {
    const root = './';
    const src  = './src/';
    const temp = './.tmp/';
    const build = './build/';
    const templates = `${src}templates/`;
    
    const bower   = {
        json: require('./bower.json'),
        directory: './bower_components/',
        // ignorePath: '../../'
    };

    const config = {
        /**
         * File paths
         */
        src,
        root,
        temp,
        build,
        templates,
        
        index: `${src}index.html`,

        template: {
            base : `${templates}base.html`,
            data : `${templates}data.json`,
        },
        pages: `${src}pages/**/*.+(html|nunjucks)`,
        views: [
            `${templates}/**/*.html`,
            `${src}pages/**/*.html`
        ],

        fonts: `${src}fonts/**/*.*`,
        images: `${src}images/**/*.*`,
        scss: [
            `${src}scss/vendors/bootstrap.scss`,
            `${src}scss/layout.scss`,
            `${src}scss/components.scss`
        ],

        allScss: `${src}scss/**/*.scss`,
        allJs: `${src}js/**/*.js`,

        source: src,

        /**
         * optimized files
         */
        optimized: {
            app: 'app.js',
            lib: 'lib.js',
            html: '**/*.html'
        },

        /**
         * Bower and NPM files
         */
        bower,
        packages: [
            './package.json',
            './bower.json'
        ],

        /**
         * cdnizer
         */
        cdnizer : {
            defaultCDNBase: '/',
            allowRev: true,
            allowMin: true,
            bowerComponents: './bower_components',
            fallbackScript: '',
            fallbackTest: '',
            files: require('./cdnizer.files.json').files || ''
        }
    };

    /**
     * wiredep and bower settings
     */
    config.getWiredepDefaultOptions = function() {
        const options = {
            bowerJson: config.bower.json,
            directory: config.bower.directory,
            ignorePath: config.bower.ignorePath,
            exclude: ['bower_components/bootstrap-sass/assets/javascripts/bootstrap.js']
        };
        return options;
    };

    return config;
    ////////////////
};