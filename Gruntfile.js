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

  // Project configuration.
  grunt.initConfig({

    pkg: grunt.file.readJSON('package.json'),

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
          expand: true,
          cwd: 'assets',
          src: 'js/*.js',
          dest: '.tmp/public/'
        }, {
          expand: true,
          cwd: 'assets',
          src: 'styles/*.css',
          dest: '.tmp/public/'
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
        src: ['.tmp/public/**/*.*'],
        overwrite: true,
        replacements: [{
          from: 'sourceMappingURL=.tmp/public/',
          to: 'sourceMappingURL=/'
        }]
      }
    },

    /** Clean out the temporary directory before use. */
    clean: {
      dev: ['.tmp/public/**'],
      build: ['www'],
      reset: ['.tmp/**', 'assets/vendor/**', 'node_modules/**']
    },

    /** Copy anything that isn't Javascript/CSS or a source file of it. */
    copy: {
      dev: {
        files: [{
            expand: true,
            cwd: 'assets',
            src: [
              '**/*', 
              '!**/*.js', 
              '!**/*.css',
              '!vendor/**',
              '!lib/**'
            ],
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
  grunt.registerTask('default', [], function() {
    grunt.loadTasks(depsPath + '/grunt-contrib-watch/tasks');

    grunt.task.run(
      'compile',
      'watch:assets'
    );
  });

  grunt.registerTask('install', [], function() {
    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-npm-install');

    grunt.task.run(
      'bower:install',
      'npm-install'
    );
  });

  // A single generic task to do everything you need with assets.
  grunt.registerTask('compile', [], function() {
    grunt.loadNpmTasks('grunt-mincer');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadNpmTasks('grunt-newer');
    grunt.loadTasks(depsPath + '/grunt-contrib-copy/tasks');

    grunt.task.run(
      // 'clean:dev',
      'mince:dev',
      'replace:sourcemap',
      'newer:copy:dev'   
    );
  });

  // Build the assets into a web accessible folder.
  // (handy for phone gap apps, chrome extensions, etc.)
  grunt.registerTask('build', [], function() {
    grunt.loadNpmTasks('grunt-mincer');
    grunt.loadNpmTasks('grunt-bower-task');
    grunt.loadNpmTasks('grunt-text-replace');
    grunt.loadTasks(depsPath + '/grunt-contrib-copy/tasks');

    grunt.task.run(
      'clean:build',
      'bower:install',
      'mince:build',
      'replace:sourcemap',
      'copy:build'
    );
  });

  // When sails is lifted in production
  grunt.registerTask('prod', [ 'compile' ]);

  // Testing Stuff
  grunt.registerTask('spec', [], function() {
    grunt.loadNpmTasks('grunt-mocha-test');

    grunt.task.run('mochaTest');
  });

  grunt.registerTask('spec:watch', [], function() {
    grunt.loadTasks(depsPath + '/grunt-contrib-watch/tasks');

    grunt.task.run('watch:spec');
  });

  // Resetting
  grunt.registerTask('reset', [], function() {
    grunt.task.run(
      'clean:reset'
    );
  });
};
