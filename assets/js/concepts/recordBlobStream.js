/**
 * recordBlobStream.js
 *
 * @overview 
 * This file only concerns the stream-recording concept page.
 * Given an audio stream, this demo will record the streams in 2-sceond segments
 * and sent them to the server via socket.io.
 *
 *= require zepto
 *= require lodash
 *= require socket.io
 *= require sails.io
 *= require q
 *= require recordrtc
 */

(function conceptRecordStreamContinousBlobs() {

  if (!$("#attr").hasClass("stream-recording")) { return; }

  var $startRecording = $('#continuous-blob .start-recording');
  var $stopRecording = $('#continuous-blob .stop-recording');
  var $log = $('#continuous-blob .log');
  var htmlLog = _.throttle(function(msg) { $log.html(msg); }, 1000);
  var $audioElement = $('#continuous-blob .player');

  var streamContinousBlobsConcept = Concept.Stream.ContinousBlobs = Concept.Stream.subclass({

    /** @constructor */
    constructor: function() {
      Concept.Stream.prototype.constructor.call(this);

      console.log("[RecordStreamContinousBlobs] loading code");

      this.bindEvents();
    },

    /** Bind all the events needed for the application. */
    bindEvents: function() {

      $startRecording.click(_.bind(this.onStartRecording, this));
      $stopRecording.click(_.bind(this.onStopRecording, this));

      this.on({
        'connect': function() {
          htmlLog('Ready to Record');
          $startRecording.removeClass('pure-button-disabled');
          console.time('[RecordStreamContinousBlobs] No Recording Occurring');
        },
        'recording:start': function() {
          htmlLog('Recording');
          console.time("[RecordStreamContinousBlobs] Recording Audio");


          $startRecording.addClass('pure-button-disabled');
          $stopRecording.removeClass('pure-button-disabled');
        },
        'recording:chunk:start': function() {
          console.timeEnd('[RecordStreamContinousBlobs] No Recording Occurring');
          console.log('[RecordStreamContinousBlobs] Recording New Chunk');
        },
        'recording:chunk:stop': function() {
          console.log('[RecordStreamContinousBlobs] Recording Stopped');
          console.time('[RecordStreamContinousBlobs] No Recording Occurring');
        },
        'upload:chunk:start': function(audioDataURL) {
          console.log('[RecordStreamContinousBlobs] Uploading Chunk:', audioDataURL);
          console.time('[RecordStreamContinousBlobs] Sending Chunk to Server');
        },
        'upload:chunk:complete': function() {
          console.timeEnd('[RecordStreamContinousBlobs] Sending Chunk to Server');
        },
        'recording:stop': function() {
          htmlLog('Recording Finished');
          console.timeEnd("[RecordStreamContinousBlobs] Recording Audio");
          $stopRecording.addClass('pure-button-disabled');
        },
        'upload:start': function(audioDataURL) {
          console.log('[RecordStreamContinousBlobs] Audio Data: ', audioDataURL);
          console.time('[RecordStreamContinousBlobs] Sending Data to Server');
          htmlLog('Sending Blob to Server');
        },
        'upload:complete': function(res) {
          console.timeEnd("[RecordStreamContinousBlobs] Sending Data to Server");

          htmlLog('Stream Successfully Sent');
          htmlLog('Ready to Record');

          this.requestAudio();

          $startRecording.removeClass('pure-button-disabled');
          $stopRecording.addClass('pure-button-disabled');
        },
        'compilation:start': function() {
          htmlLog('Requesting Compiled Audio');

          console.time('[RecordStreamContinousBlobs] Requesting Compilation');
          console.log('[RecordStreamContinousBlobs] Requesting Compilation');
        },
        'compilation:complete': function(res) {
          htmlLog('Compiled Audio Retrieved');

          console.timeEnd('[RecordStreamContinousBlobs] Requesting Compilation');

          console.log('[RecordStreamContinousBlobs] Server Response:', res);

          $audioElement.attr('src', res.message);
        }
      });
    },

    /** Callback binding for the ending of the recording. */
    onStartRecording: function() {
      if($startRecording.hasClass("pure-button-disabled")) { return false; }

      this.emit('recording:start');
      this.chunks = [];
      this._startRecording()
      .delay(500).then(_.bind(this.onChunk, this));
      return false;
    },

    onChunk: function() {
      var self = this;

      return this._stopRecording()
      .then(function() {

        self.emit('recording:chunk:stop');
        return self._getRecordingDataURL();

      }).then(function(audioDataURL) {

        self.emit('upload:chunk:start', audioDataURL);

        // start the recording again, but don't return as promise
        if (!self._done) {
          self._startRecording().then(function() {  
            self.emit('recording:chunk:start');
          });
        }

        return self._uploadRecording('/concepts/stream-recording/chunked', audioDataURL, self._done);

      }).then(function() {

        self.emit('upload:chunk:complete');
        if (self._done) { self.emit('recording:stop upload:complete')}
        else { setTimeout(_.bind(self.onChunk, self), 500); }

      }).done();
    },

    /** Callback binding for the ending of the recording. */
    onStopRecording: function() {
      if($stopRecording.hasClass('pure-button-disabled')) { return false; }

      this._done = true;

      return false;
    },

    /** Request the compiled audio from the server. */
    requestAudio: function() {
      var self = this;
      self.emit('compilation:start');

      Q.Promise(function(resolve, reject, notify) {
        socket.get('/concepts/stream-recording/chunked', resolve);
      }).then(function(res) {
        self.emit('compilation:complete', res);
      });
    }

  });

  new streamContinousBlobsConcept();

}());
