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
  grunt.loadNpmTasks('grunt-mincer');

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
            production: false
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
          enable: 'source_maps',
          engines: {
            Stylus: function(stylus) {
              stylus.use(require('nib')());
            }
          }
        },
        files: [{
          expand: true,
          cwd: 'assets/',
          src: ["js/*.js", "styles/*.css"],
          dest: '.tmp/public/'
        }]
      },

      build: {
        options: {
          include: ['assets/js', 'assets/styles', 'assets/lib', 'assets/vendor'],
          engines: {
            Stylus: function(stylus) { stylus.use(require('nib')()); }
          }
        },
        files: [{
          expand: true,
          cwd: 'assets/',
          src: ["js/*.js", "styles/*.css"],
          dest: 'www/'
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
            src: ['**/*.!(coffee|js|css|styl)'],
            dest: '.tmp/public'
        }]
      },
      build: {
        files: [{
            expand: true,
            cwd: '.tmp/public',
            src: ['**/*.!(coffee|js|css|styl)'],
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

        // API files to watch:
        files: ['api/**/*']
      },
      assets: {

        // Assets to watch:
        files: ['assets/**/*'],

        // When assets are changed:
        tasks: ['compileAssets']
      }
    }
  });

  /****************************************************************************/

  /**
   * `Custom Task Registration`
   */

  // When Sails is lifted:
  grunt.registerTask('default', [
    'compile',
    'watch'
  ]);

  // A single generic task to do everything you need with assets.
  grunt.registerTask('compile', [
    'clean:dev',
    'bower:install',
    'mince:dev',
    'copy:dev'   
  ]);

  // Build the assets into a web accessible folder.
  // (handy for phone gap apps, chrome extensions, etc.)
  grunt.registerTask('build', [
    'clean:build',
    'bower:install',
    'mince:build',
    'copy:build'
  ]);

  // When sails is lifted in production
  grunt.registerTask('prod', [ 'compileAssets' ]);

  // Testing Stuff
  grunt.registerTask('test', [ 'mochaTest' ]);
  grunt.registerTask('spec', [ 'mochaTest' ]);

};
