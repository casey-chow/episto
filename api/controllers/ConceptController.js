/**
 * ConceptController
 *
 * @module      :: Controller
 * @description :: A set of functions called `actions`.
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

var fs = require('fs-extra');
var path = require('path');
var _ = require('lodash');
var async = require('async');
var execFile = require('child_process').execFile;

module.exports = {
    
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to ConceptController)
   */
  _config: {
    rest: false,
    pluralize: true 
  },

  /** Simply display a list of concepts to try. */
  index: function(req, res) {
    res.view('concept/index', {
      concepts: [
        "stream-recording",
      ]
    });
  },

  /** Render the streamRecording view that interacts with {@link streamRecording}. */
  renderStreamRecording: function(req, res) {
    sails.log("rendering Stream Recording page");
    res.view('concept/stream-recording');
  },


  /**
   * Test whether and how quickly recordings can be streamed. This method receives the audio
   * pumped in from the `concept/stream-recording` view and benchmarks recording speed.
   *
   * @example
   * socket.post('/concepts/stream-recording/single', { 
   *   audio: "the audio data URI"
   * }, function(res) { "respond to the data"; });
   * @see The proof of WebRTC experiment this is based off of, <a href="https://github.com/muaz-khan/WebRTC-Experiment/tree/master/RecordRTC/RecordRTC-over-Socketio">RecordRTC-over-Socketio</a>.
   * @see <a href="http://localhost:3000/concepts/stream-recording">The test in action</a>.
   */
  recordSingleBlob: function(req, res) {
    var audioData = req.param('audio');
    var audioExcerpt = audioData.slice(-128);
    sails.log.info('[SingleBlob] Received Audio: ' + audioExcerpt);

    res.json({
      success: true,
      message: audioData,
      length: audioData.length
    });
  },

  /**
   * Test whether sending chunked data is a possibility. This method receives audio in chunks 
   * of base64 encoded audio and, when requested, returns a concatenated file.
   *
   * @example
   * socket.post('/concepts/stream-recording/chunked', { 
   *   audio: "audio data URI" 
   * }, function(res) { "respond to the data"; });
   */
  recordBlobStream: function(req, res) {
    var audioData, audioExcerpt;
    var chunks = req.session.chunks = req.session.chunks || [];

    if (req.method == 'POST') {
      audioData = req.param('audio');
      audioExcerpt = audioData.slice(-128);

      sails.log('[Chunks] Received Audio: ' + audioExcerpt);
      chunks.push(audioData);
      sails.log.verbose('[Chunks] Chunk collection now at length ' + chunks.length);

      res.json({
        success: true,
        message: audioData,
        length: audioData.length,
        chunks: chunks.length
      });
    } else {
      sails.log.verbose('[Chunks] Compiling chunks')
      combineAudio(chunks, function(compilation) {
        sails.log.info('[Chunks] Sending chunk result: ' + compilation.slice(-128));
        res.send({
          success: true,
          message: compilation,
          length: chunks.reduce(function(sum, cur) { return sum + cur.length; }, 0)
        });
      });
    }
  }
};

function combineAudio(chunks, cb) {
  var length = chunks.length;

  async.seq(
    function createDirectory(done) {
      fs.mkdirp(path.resolve('tmp/audio'), done);
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
        var fileName = path.resolve('tmp/audio/'+index+'.wav');

        files.push(fileName);
        sails.log('Writing to file ' + fileName);
        fs.writeFile(fileName, chunkBuffer, _done);
      }, done);
    },
    function soxCombine(done) {
      sails.log('Combining with sox');
      this.files.push(path.resolve('tmp/audio/out.wav'));
      sails.log.verbose('Calling sox with parameters: ' + this.files.join(' '));
      execFile('sox', this.files, done);
    },
    function readFile(stdout, stderr, done) {
      if (stdout) { sails.log(stdout); }
      if (stderr) { sails.log.error(stderr); }

      sails.log.info('Reading output file');
      fs.readFile(path.resolve('tmp/audio/out.wav'), done);
    },
    function returnBase64(finalBuffer, done) {
      cb('data:audio/wav;base64,' + finalBuffer.toString('base64'));
      fs.remove(path.resolve('tmp/audio/'), done);
    }
  )(function() {
    sails.log('[Chunks] Completed Task');
  });
}