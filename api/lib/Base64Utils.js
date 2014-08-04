/**
 * Utilities for managing base64 encoded strings with files.
 */

var when      = require('when');
var whenNode  = require('when/node');
var fs        = require('fs-extra');
var path      = require('path');

var log = (typeof sails === 'object') ? sails.log.verbose : function() {};

var Base64Utils = module.exports = {

	/**
	 * Determines whether a string is base64-encoded or not.
	 */
	isBase64: function(str) {
		return str.slice(-64).indexOf('base64') > 0;
	},

	/**
   * Reads a file and converts it to base64.
   *
   * @param   {String}  filename   The name of the file to read, must exist.
   * @param   {String}  [mimeType] The target MIME type of the file.
   * @returns {Promise}            A promise encapsuling the file read. Callbacks must
   *                               have signature cb(err, fileContents).
   */
  readFileAsBase64: function(fileName, mimeType) {
    log('[AudioReceiverService] Reading file ' + fileName);

    var prefix         = mimeType ? 'data:'+mimeType+';base64,' : '';
    var bufferToString = function(buffer) { return prefix + buffer.toString('base64'); }
        fileName       = path.resolve(fileName);

    return whenNode.call(fs.readFile, fileName).then(bufferToString);
  },

  /**
   * Saves a base64 string as a binary file. If the file already exists,
   * this function will return an error.
   * 
   * @param   {String}  base64Str The base64-encoded file to save.
   * @param   {String}  filename  The name of the file to which to save, must exist.
   * @returns {Promise}           A promise encapsulating the completed file save.
   */
  writeBase64StringAsFile: function(base64Str, fileName) {
    log('[AudioReceiverService] Writing to ' + fileName);

    var binaryBuffer = new Buffer(base64Str, 'base64');
        fileName     = path.resolve(fileName);

    return whenNode.call(fs.writeFile, fileName, binaryBuffer);
  },

  /**
   * Saves an array of base64 strings as binary files.
   *
   * @param   {Array}    			 base64Arr The array of base64-encoded files to save.
   * @param   {Function|Array} fileName  A callback with signature fileName(file, index) that returns the
   *                                     desired name of the file. Alternatively, an array-ish object with
   *                                     the necessary mappings.
   * @returns {Promise}        A promise encapsulating an array of the filenames saved.
   */
  writeBase64ArrayAsFiles: function(base64Arr, fileName) {
    var that = this;
    var fileNames = [];

    return when.map(base64Arr, function(base64Str, index) {
      var _fileName = _.isFunction(fileName) ? fileName(base64Str, index) : fileName[index];
      fileNames.push(_fileName);

      return that.writeBase64StringAsFile(base64Str, _fileName).then(function() {
        return fileNames.push(_fileName);
      });
    });

  },

  /**
   * A dispatcher function that calls the approrpiate method based on the type of the input.
   *
   * @param {Array|String} 					base64Input The input data in base64, either as a string or array of strings.
   * @param {Function|Array|String} fileName    Something indicating what the file should be.
   * @returns {Promise}             The promise output by the other two functions.
   */
  writeBase64AsFile: function(base64Input, fileName) {
  	if(_.isArray(base64Input)) {
  		return this.writeBase64ArrayAsFiles(base64Input, fileName);
  	} else if (_.isString(base64Input)) {
  		return this.writeBase64StringAsFile(base64Input, fileName);
  	} else {
  		return when.reject(TypeError('Input must be a string or array.'));
  	}
  }
};


/**
 * Aliases
 */
Base64Utils.readFile = Base64Utils.readFileAsBase64;
Base64Utils.writeFile = Base64Utils.writeBase64AsFile;