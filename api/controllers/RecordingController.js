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
  /**
   * Combines the WAV chunks into a single sample.
   *
   * @param {Array} chunks - an array of the base64-encoded WAV chunks
   * @param {Function} cb - a callback with the signature cb(compilation), 
   *                        which receives the final base64-encoded compilation
   */
  combineAudioChunks: function(chunks, cb) {
    var length = chunks.length;

    async.seq(
      function createDirectory(done) {
        fs.mkdirp(path.resolve('.tmp/audio'), done);
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
          var fileName = path.resolve('.tmp/audio/'+index+'.wav');

          files.push(fileName);
          sails.log('Writing to file ' + fileName);
          fs.writeFile(fileName, chunkBuffer, _done);
        }, done);
      },
      function soxCombine(done) {
        sails.log('Combining with sox');
        this.files.push(path.resolve('.tmp/audio/out.wav'));
        sails.log.verbose('Calling sox with parameters: ' + this.files.join(' '));
        execFile('sox', this.files, done);
      },
      function readFile(stdout, stderr, done) {
        if (stdout) { sails.log(stdout); }
        if (stderr) { sails.log.error(stderr); }

        sails.log.info('Reading output file');
        fs.readFile(path.resolve('.tmp/audio/out.wav'), done);
      },
      function returnBase64(finalBuffer, done) {
        cb('data:audio/wav;base64,' + finalBuffer.toString('base64'));
        fs.remove(path.resolve('.tmp/audio/'), done);
      }
    )(function() {
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
    var chunks = req.session.chunks = req.session.chunks || [];

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
