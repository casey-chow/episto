/**
 * recorder.js
 *
 * @overview 
 * Given an audio stream, this demo will record the streams in 2-sceond segments
 * using the webaudio API and pipe them over socket.io.
 *
 *= require jquery
 *= require lodash
 *= require stapes
 *= require socket.io
 *= require sails.io
 *= require q
 *= require wavencoder
 */

window.Recorder = (function recorder() {
  return;

  var dev = false;

  var my = {

    $startRecording: $('#recording-start'),
    $stopRecording: $('#recording-stop'),
    $status: $('#status'),
    $audioElement: $('#player'),
    $recognizedText: $('#recognized-text'),


    log: console.log.bind(console),
    verbose: dev ? console.log.bind(console) : function() {},
    error: console.error.bind(console),
    time: console.time.bind(console),
    timeEnd: console.timeEnd.bind(console),

    status: function(msg) { 
      my.$status.fadeOut(function() { $(this).html(msg); }).fadeIn();
    },

    /** 
     * Get the user media stream as a promise.
     * @returns {Promise} The promise of a stream object.
     */
    getUserMedia: function() {
      var promise = my.userMedia = 
      my.userMedia || Q.Promise(function(resolve, reject, notify) {
        navigator.webkitGetUserMedia({ audio: true }, resolve, reject);
      });

      return promise;
    },

    get: function(url) {
      return Q.Promise(function(resolve, reject, notify) {
        socket.get(url, resolve);
      });
    },
    send: function(url, msg) {
      return Q.Promise(function(resolve, reject) {
        socket.post(url, msg, resolve);
      });
    }
  };

  var Recorder = Stapes.subclass({

    /** @constructor */
    constructor: function() {
      my.log("[Episto] loading code");

      my.bufferSize = 4096;
      my.wavEncoder = new WavEncoder(my.bufferSize, {
        sampleRateHz: 48000
      });

      this.bindEvents();
    },

    /** Bind all the events needed for the application. */
    bindEvents: function() {

      my.$startRecording.click(this.onStartRecording.bind(this));
      my.$stopRecording.click(this.onStopRecording.bind(this));

      annyang.addCommands({
        '.*': function(str) {
          my.$recognizedText.append(str);
        }
      });

      socket.on('connect', function() {
        my.status('Ready to Record');
        my.$startRecording.prop('disabled', false);
      });

      this.on({
        'recording:start': function() {
          my.status('Recording');
          my.time("[Episto] Recording Audio");

          my.$startRecording.prop('disabled', true);
          my.$stopRecording.prop('disabled', false);
        },

        'processing:chunk': function(chunkBuffer) {
          my.log('[Episto] New chunk issued with length: ' 
            + chunkBuffer.length);
        },
        'upload:chunk:start': function(audioDataURL) {
          my.log('[Episto] Uploading Chunk:', audioDataURL);
          my.time('[Episto] Sending Chunk to Server');
        },
        'upload:chunk:complete': function(res) {
          my.timeEnd('[Episto] Sending Chunk to Server');
          my.log('[Episto] Server Returned', res)
        },

        'recording:stop': function() {
          my.status('Recording Finished');
          my.timeEnd("[Episto] Recording Audio");
          my.$stopRecording.addClass('pure-button-disabled');

          my.$startRecording.prop('disabled', false);
          my.$stopRecording.prop('disabled', true);

        },

        'compilation:start': function() {
          my.status('Requesting Compiled Audio');

          my.time('[Episto] Requesting Compilation');
          my.log('[Episto] Requesting Compilation');
        },

        'compilation:complete': function(res) {
          my.status('Compiled Audio Retrieved, Ready to Record');

          my.timeEnd('[Episto] Requesting Compilation');
          my.log('[Episto] Server Response:', res);

          my.$startRecording.prop('disabled', false);
          my.$stopRecording.prop('disabled', true);
        }
      });
    },

    /** Callback binding for the ending of the recording. */
    onStartRecording: function() {
      var that = this;

      annyang.start();

      my.getUserMedia().then(function(audioStream) {

        // Set up the WebAudio API
        my.context = new webkitAudioContext();
        my.audioSource = my.context.createMediaStreamSource(audioStream);
        my.scriptProcessor = my.context.createScriptProcessor(my.bufferSize,1,1);

        my.scriptProcessor.onaudioprocess = that.onChunk.bind(that);

        // Plug everything in
        my.audioSource.connect(my.scriptProcessor);
        my.scriptProcessor.connect(my.context.destination);

      }).catch(function(e) {
        my.error(e);
      }).then(function() {
        that.emit('recording:start');
      }).done();

      return false;

    },

    onChunk: function(e) {
      var that = this;

      var inBuffer = e.inputBuffer.getChannelData(0);
      var outBuffer = e.outputBuffer.getChannelData(0);

      // Only for if you care about getting the audio back to the browser.
      // Which we don't.
      // outBuffer.set(inBuffer); 
      
      this.emit('processing:chunk', inBuffer);

      /** Encode the data into a base64-enoded WAV file. 
       * @see https://github.com/fritzo/wavencoderjs
       */
      var chunk = my.wavEncoder.encode(inBuffer);

      this.emit('upload:chunk:start', chunk);

      // Upload das audio through socket
      my.send('/recordings/chunk', { 
        audio: chunk,
        done: false,
        type: 'audio/wav'
      }).then(function(res) {
        that.emit('upload:chunk:complete', res);
      }).done();

    },

    /** Callback binding for the ending of the recording. */
    onStopRecording: function() {
      var self = this;
      
      my.getUserMedia().then(function(audioStream) {

        audioStream.stop();

        my.scriptProcessor.onaudioprocess = null;
        my.audioSource.disconnect();
        my.scriptProcessor.disconnect();

        return Q.Promise(function(resolve, reject, notify) {
          socket.post('/recordings/chunk', {
            done: true
          }, resolve);
        });

      }).then(function() {

        self.emit('recording:stop upload:complete');

        self.requestAudio();

      }).done();

      return false;
    },

    /** Request the compiled audio from the server. */
    requestAudio: function() {
      var that = this;

      this.emit('compilation:start');

      my.get('/recordings/compile').then(function(res) {
        that.emit('compilation:complete', res);

        my.$audioElement.attr('src', res.message);
      }).done();

    }
  });

  return new Recorder();

}());
