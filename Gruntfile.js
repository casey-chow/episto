/**
 * Gruntfile
 *
 * More information on using Grunt to work with static assets:
 * http://gruntjs.com/configuring-tasks
 */

module.exports = function (grunt) {

  // Get path to core grunt dependencies from Sails
  var depsPath = grunt.option('gdsrc') || 'node_modules/sails/node_modules';
  grunt.loadTasks(depsPath + '/grunt-contrib-clean/tasks');
  grunt.loadTasks(depsPath + '/grunt-contrib-copy/tasks');
  grunt.loadTasks(depsPath + '/grunt-contrib-watch/tasks');

  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks('grunt-npm-install');
  grunt.loadNpmTasks('grunt-mincer');
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-shell');

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),


    shell: {
      run: {
        command: 'node app.js'
      },
      dev: {
        command: 'node ./node_modules/nodemon/bin/nodemon.js app.js'
      }
    },

    /** 
     * Bower
     *
     * The Bower task allows us to install client packages from the command line.
     * @see https://github.com/yatskevich/grunt-bower-task
     */
    bower: {
      install: {
        options: {
          targetDir: 'assets/vendor',
          layout: 'byComponent',
          install: true,
          verbose: true,
          cleanTargetDir: true,
          bowerOptions: {
            production: process.env.NODE_ENV === 'production'
          }
        }
      }
    },

    /** 
     * Mincer
     *
     * Mincer is responsible for dependency management, concatenation and other processing
     * for client packages.
     * @see https://github.com/pirxpilot/grunt-mincer
     */
    mince: {

      dev: {
        options: {
          include: ['assets/js', 'assets/styles', 'assets/lib', 'assets/vendor'],
          enable: ['source_maps', 'autoprefixer'],
          engines: { Stylus: function(stylus) { stylus.use(require('nib')()); } }
        },
        // Javascript is collected only on the top level to allow for ordering control.
        files: [{
          src: 'assets/js/*.js',
          dest: '.tmp/public/app.js'
        }, {
          src: 'assets/styles/*.css',
          dest: '.tmp/public/app.css'
        }]
      },

      build: {
        options: {
          include: ['assets/js', 'assets/styles', 'assets/lib', 'assets/vendor'],
          enable: ['autoprefixer'],
          engines: { Stylus: function(stylus) { stylus.use(require('nib')()); } }
        },
        files: [{
          src: 'assets/js/*.js',
          dest: 'www/app.js'
        }, {
          src: 'assets/styles/*.css',
          dest: 'www/app.css'
        }]
      }

    },

    replace: {
      sourcemap: {
        src: ['.tmp/public/*.*'],
        overwrite: true,
        replacements: [{
          from: 'sourceMappingURL=.tmp/public/',
          to: 'sourceMappingURL='
        }]
      }
    },

    /** Clean out the temporary directory before use. */
    clean: {
      dev: ['.tmp/public/**'],
      build: ['www']
    },

    /** Copy anything that isn't Javascript/CSS or a source file of it. */
    copy: {
      dev: {
        files: [{
            expand: true,
            cwd: './assets',
            src: ['**/*', '!**/*.js', '!**/*.css'],
            dest: '.tmp/public'
        }]
      },
      build: {
        files: [{
            expand: true,
            cwd: '.tmp/public',
            src: ['**/*', '!**/*.js', '!**/*.css'],
            dest: 'www'
        }]
      }
    },

    /**
     * MochaTest
     *
     * Running all the specs to ensure that everything is in working order.
     */
    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['specs/**/*.spec.js']
      }
    },

    /** 
     * Watch
     *
     * Ensure that upon change, the assets are recompiled.
     */
    watch: {
      api: {
        files: ['api/**/*']
      },
      assets: {
        files: ['assets/**/*'],
        tasks: ['compile']
      },
      spec: {
        files: ['api/**/*', 'assets/**/*.js', 'specs/**/*'],
        tasks: ['spec']
      }
    }
  });

  /****************************************************************************/

  /**
   * `Custom Task Registration`
   */

  // When Sails is lifted:
  grunt.registerTask('default', [
    'install',
    'compile',
    'watch'
  ]);

  grunt.registerTask('install', [
    'bower:install',
    'npm-install'
  ]);

  // A single generic task to do everything you need with assets.
  grunt.registerTask('compile', [
    'clean:dev',
    'mince:dev',
    'replace:sourcemap',
    'copy:dev'   
  ]);

  // Build the assets into a web accessible folder.
  // (handy for phone gap apps, chrome extensions, etc.)
  grunt.registerTask('build', [
    'clean:build',
    'bower:install',
    'mince:build',
    'replace:sourcemap',
    'copy:build'
  ]);

  // When sails is lifted in production
  grunt.registerTask('prod', [ 'compile' ]);

  // Testing Stuff
  grunt.registerTask('test', [ 'mochaTest' ]);
  grunt.registerTask('spec', [ 'mochaTest' ]);

  // Running Sails itself
  grunt.registerTask('run', ['shell:run']);
  grunt.registerTask('dev', ['shell:dev']);
};
