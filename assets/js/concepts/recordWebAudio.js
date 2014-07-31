/**
 * recordWebAudio.js
 *
 * @overview 
 * This file only concerns the stream-recording concept page.
 * Given an audio stream, this demo will record the streams in 2-sceond segments
 * using the webaudio API and pipe them over socket.io.
 *
 *= require zepto
 *= require lodash
 *= require socket.io
 *= require sails.io
 *= require q
 *= require wavencoder
 */

(function conceptWebAudioRecord() {

  if (!$("#attr").hasClass("stream-recording")) { return; }

  var $startRecording = $('#web-audio .start-recording');
  var $stopRecording = $('#web-audio .stop-recording');
  var $log = $('#web-audio .log');
  var htmlLog = _.throttle(function(msg) { $log.html(msg); }, 1000);
  var $audioElement = $('#web-audio .player');

  var streamWebAudioConcept = Concept.Stream.WebAudio = Concept.Stream.subclass({

    /** @constructor */
    constructor: function() {
      Concept.Stream.prototype.constructor.call(this);

      console.log("[RecordWebAudio] loading code");

      this._bufferSize = 4096;

      this._wavEncoder = new WavEncoder(this._bufferSize, {
        sampleRateHz: 48000
      });


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
        },
        'recording:start': function() {
          htmlLog('Recording');
          console.time("[RecordWebAudio] Recording Audio");


          $startRecording.addClass('pure-button-disabled');
          $stopRecording.removeClass('pure-button-disabled');
        },
        'processing:chunk': function(chunkBuffer) {
          console.log('[RecordWebAudio] New chunk issued with length: ' + chunkBuffer.length);
        },
        'upload:chunk:start': function(audioDataURL) {
          console.log('[RecordWebAudio] Uploading Chunk:', audioDataURL);
          console.time('[RecordWebAudio] Sending Chunk to Server');
        },
        'upload:chunk:complete': function(res) {
          console.timeEnd('[RecordWebAudio] Sending Chunk to Server');
          console.log('[RecordWebAudio] Server Returned', res)
        },
        'recording:stop': function() {
          htmlLog('Recording Finished');
          console.timeEnd("[RecordWebAudio] Recording Audio");
          $stopRecording.addClass('pure-button-disabled');

          $startRecording.removeClass('pure-button-disabled');
          $stopRecording.addClass('pure-button-disabled');

        },
        'compilation:start': function() {
          htmlLog('Requesting Compiled Audio');

          console.time('[RecordWebAudio] Requesting Compilation');
          console.log('[RecordWebAudio] Requesting Compilation');
        },
        'compilation:complete': function(res) {
          htmlLog('Compiled Audio Retrieved');

          console.timeEnd('[RecordWebAudio] Requesting Compilation');
          console.log('[RecordWebAudio] Server Response:', res);

          htmlLog('Ready to Record');
        }
      });
    },

    /** Callback binding for the ending of the recording. */
    onStartRecording: function() {
      if($startRecording.hasClass("pure-button-disabled")) { return false; }

      this.emit('recording:start');

      this._startRecording();

      return false;
    },

    /** Background process for actually setting up the recording. */
    _startRecording: function() {
      var self = this;

      this._getUserMediaPromise().then(function(audioStream) {

        // Set up the WebAudio API
        self._context = new webkitAudioContext();
        self._audioSource = self._context.createMediaStreamSource(audioStream);
        self._scriptProcessor = self._context.createScriptProcessor(self._bufferSize,1,1);

        self._scriptProcessor.onaudioprocess = _.bind(self.onChunk, self);

        // Plug everything in
        self._audioSource.connect(self._scriptProcessor);
        self._scriptProcessor.connect(self._context.destination);
      }).catch(function(e) {
        console.error(e);
      });
    },

    onChunk: function(e) {
      var self = this;

      var inBuffer = e.inputBuffer.getChannelData(0);
      var outBuffer = e.outputBuffer.getChannelData(0);

      // Only for if you care about getting the audio back to the browser.
      // Which we don't.
      // outBuffer.set(inBuffer); 
      
      this.emit('processing:chunk', inBuffer);

      /** Encode the data into a base64-enoded WAV file. 
       * @see https://github.com/fritzo/wavencoderjs
       */
      var chunk = this._wavEncoder.encode(inBuffer);

      this.emit('upload:chunk:start', chunk);

      // Upload das audio through socket
      this._uploadRecording('/concepts/stream-recording/webaudio', chunk, false)
      .then(function(res) {
        self.emit('upload:chunk:complete', res);
      });

    },

    /** Callback binding for the ending of the recording. */
    onStopRecording: function() {
      if($stopRecording.hasClass('pure-button-disabled')) { return false; }
      var self = this;

      
      this._getUserMediaPromise().then(function(audioStream) {

        audioStream.stop();

        self._scriptProcessor.onaudioprocess = null;
        self._audioSource.disconnect();
        self._scriptProcessor.disconnect();

        return Q.Promise(function(resolve, reject, notify) {
          socket.post('/concepts/stream-recording/webaudio', {
            done: true
          }, resolve);
        });

      }).then(function() {

        self.emit('recording:stop upload:complete');

        self.requestAudio();

      });

      return false;
    },

    /** Request the compiled audio from the server. */
    requestAudio: function() {
      var self = this;
      this.emit('compilation:start');

      Q.Promise(function(resolve, reject, notify) {
        socket.get('/concepts/stream-recording/webaudio', resolve);
      }).then(function(res) {
        self.emit('compilation:complete', res);

        $audioElement.attr('src', res.message);
      });
    }
  });

  new streamWebAudioConcept();

}());
