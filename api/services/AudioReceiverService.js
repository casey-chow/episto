/**
 * Audio Receiver Service
 *
 * @overview
 * Allows the application to receive audio piped in as wav file chunks.
 * This file exports a number of utility functions to enable controllers to 
 * simplify their own logic.
 */

var when          = require('when');
var whenNode      = require('when/node');
var fs            = require('fs-extra');
var path          = require('path');
var execFile      = require('child_process').execFile;

var Base64Utils   = require('../lib/Base64Utils');

module.exports = {

  /**
   * Coerces base64 strings to files if they're base64 strings, leaves them
   * alone otherwise.
   *
   * @param {Array} strings An array of base64 or file path strings.
   * @param {String} [outDirectory='.tmp/audio'] The directory in which to house all the wav files.
   * @returns {Promise} A promise of the array with file paths.
   */
  coerceToFiles: function(strings, outDirectory) {

    outDirectory = outDirectory || '.tmp/audio';

    if(Base64Utils.isBase64(audioFiles[0])) {
      return Base64Utils.writeFile(audioFiles, function fileName(str, index) {
        return path.join(outDirectory, index + '.wav');
      });
    } else {
      return when(audioFiles);
    }
      
  },

  /**
   * Merges WAV files using sox.
   *
   * @param {Array}  audioFiles  Either a file path/data URI or an array of filepaths/data URIs. 
   *                               - The path must either be absolute or relative to the project root.
   *                               - A data URI must begin with 'data:audio/wav;base64,'.
   *                               - This method assumes that all elements in an array are the same type.
   * @param {String} outFileName The output file, relative to the project root.
   * @param {String} [outputDir] The output directory, relative to the project root. This is necessary for
   *                             base64 strings.
   * @returns {Promise}          A promise encapsulating the completed sox call. Returns
   *                             with signature cb(err, stdout, stderr).
   */
  mergeAudioFiles: function(audioFiles, outFileName, outputDir) {
    sails.log.verbose('[AudioReceiverService] Merging audio files, outputting to ' + fileName);

    var that = this;
    outFileName = path.resolve(outFileName);

    // A promise representing the arguments to pass into sox.
    // If it's base64, write them to disk first.
    return whenNode.call(fs.mkdirp(outputDir)).then(function() {

      return that.coerceToFiles(audioFiles, outputDir);

    }).then(function(soxArgs) {

      soxArgs.push(outFileName);

      return whenNode.call(execFile,  'sox', soxArgs);

    });

  }
}