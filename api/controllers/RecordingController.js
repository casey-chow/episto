/**
 * RecordingController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */
var async = require('async');
var fs = require('fs-extra');
var path = require('path');
var execFile = require('child_process').execFile;

var my = {

  /** Serial number to ensure audio files don't conflict with one another. */
  serial: 0,

  baseDir: '.tmp/audio',
  outDir: '.tmp/audio/out',

  /**
   * Combines the WAV chunks into a single sample.
   *
   * @param {Array} chunks - an array of the base64-encoded WAV chunks
   * @param {Function} cb - a callback with the signature cb(compilation), 
   *                        which receives the final base64-encoded compilation
   */
  combineAudioChunks: function(chunks, cb) {
    var length = chunks.length;
    my.serial += 1;

    var inputDir = path.resolve(path.join(my.baseDir, ''+my.serial));
    var outputFile = path.resolve(path.join(my.outDir, ''+my.serial+'.wav'));

    async.seq(
      function createDirectory(done) {
        fs.ensureDir(inputDir, done);
      },
      function createDirectory2(err, done) {
        if (err) { sails.log.error(err); }
        fs.ensureDir(my.outDir, done);
      },
      function bufferizeChunks(err, done) {
        if (err) { sails.log.error(err); }
        var files = this.files = [];

        chunks = _.map(chunks, function bufferizeChunk(chunk, index) {
          /** 
           * Assumption here is that the chunk starts with 
           * `data:audio/wav;base64,`, which is 22 chars long.
           */
          chunk = chunk.slice(22); 
          return [new Buffer(chunk, 'base64'), index];
        });

        async.each(chunks, function writeBuffer(arr, _done) {
          var chunkBuffer = arr[0];
          var index = arr[1];
          var fileName = path.join(inputDir, ''+index+'.wav');

          files.push(fileName);
          sails.log.verbose('[Chunks] Writing to file ' + fileName);
          fs.writeFile(fileName, chunkBuffer, _done);
        }, done);
      },
      function soxCombine(done) {
        sails.log.verbose('[Chunks] Combining with sox');

        this.files.push(outputFile);
        sails.log.verbose('[Chunks] Calling sox with parameters: ' + this.files.join(' '));

        execFile('sox', this.files, { timeout: 500 }, done);
      },
      function readFile(stdout, stderr, done) {
        if (stdout) { sails.log(stdout); }
        if (stderr) { sails.log.error(stderr); }

        sails.log.verbose('[Chunks] Reading output file');
        fs.readFile(outputFile, done);
      },
      function returnBase64(finalBuffer, done) {
        sails.log('Returning buffer');
        cb('data:audio/wav;base64,' + finalBuffer.toString('base64'));
        done();
      }
    )(function(err, results) {
      if (err) { sails.log.error(err); }
      if (results) { sails.log(results); }
      sails.log('[Chunks] Completed Task');
    });
  }
}

module.exports = {
    
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to RecordingController)
   */
  _config: {},

  new: function(req, res) {
    fs.remov
    res.view();
  },

  index: function(req, res) {
    sails.log.verbose('RecordingController.index');
    res.json(req.params);
  },

  chunk: function(req, res) {
    var chunks = req.session.chunks = req.session.chunks || [];

    if (req.method == 'POST' && req.param('done')) {
      sails.log.verbose('[Chunks] Stream ended.');
      res.json({
        success: true,
        chunks: chunks.length
      });

      return;
    }

    var audioData = req.param('audio');
    var audioExcerpt = audioData.slice(-128);

    sails.log.verbose('[Chunks] Received Audio: ' + audioExcerpt);
    chunks.push(audioData);
    sails.log.verbose('[Chunks] Chunk collection now at length ' + chunks.length);

    res.json({
      success: true,
      message: 'Chunk successfully stored.',
      length: audioData.length,
      chunks: chunks.length
    });

  },

  compile: function(req, res) {
    var chunks = req.session.chunks;

    if(!chunks) { sails.log.error('Compile called without chunks stored.'); }

    req.session.chunks = []; // Reset for the next round.
    sails.log.verbose('[Chunks] Compiling chunks');

    my.combineAudioChunks(chunks, function(compilation) {
      sails.log.info('[Chunks] Sending chunk result: ' + compilation.slice(-128));
      res.send({
        success: true,
        message: compilation,
        length: chunks.reduce(function(sum, cur) { return sum + cur.length; }, 0)
      });
    });

  }

};
