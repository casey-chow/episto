/**
 * recorder.js
 *
 *= require jquery
 *= require lodash
 *= require stapes
 *= require socket.io
 *= require sails.io
 *= require q
 */

window.Recognizer = (function recorder() {
  var dev = false;

  var my = {

    $startRecording: $('#recording-start'),
    $stopRecording: $('#recording-stop'),
    $status: $('#status'),
    // $audioElement: $('#player'),
    $recognizedText: $('#recognized-text'),
    $interpretedData: $('#interpreted-data'),
    $populate: $('#populate'),
    $summarize: $('#summarize'),


    log: console.log.bind(console),
    verbose: dev ? console.log.bind(console) : function() {},
    error: console.error.bind(console),
    time: console.time.bind(console),
    timeEnd: console.timeEnd.bind(console),

    status: function(msg) { 
      my.$status.fadeOut(function() { $(this).html(msg); }).fadeIn();
    }
  };

  var Recognizer = Stapes.subclass({

    /** 
     * @constructor 
     * @see http://www.google.com/intl/en/chrome/demos/speech.html
     */
    constructor: function() {
      my.log("[Episto] loading code");

      my.recognition = new webkitSpeechRecognition();
      my.recognition.continuous = true;
      my.recognition.intermResults = true;

      //this.onChunk.bind(this);

      this.bindEvents();
    },

    /** Bind all the events needed for the application. */
    bindEvents: function() {
      var that = this;

      my.recognition.onstart = this.emit.bind(this, 'recording:start');
      my.recognition.onend = this.emit.bind(this, 'recording:stop');
      my.recognition.onerror = this.emit.bind(this, 'error');
      my.recognition.onresult = this.emit.bind(this, 'result');

      my.$startRecording.click(this.onStartRecording.bind(this));
      my.$stopRecording.click(this.onStopRecording.bind(this));
      my.$populate.click(this.onPopulate.bind(this));
      my.$summarize.click(this.getSummary.bind(this));

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

        'result': function(e) {
          my.log('[Episto] New chunk: ' + e.results.length);
          this.onChunk(e);
        },

        'error': function(e) {
          my.error(e);
        },

        'recording:stop': function() {
          my.status('Recording Finished');
          my.timeEnd("[Episto] Recording Audio");
          my.$stopRecording.addClass('pure-button-disabled');

          my.$startRecording.prop('disabled', false);
          my.$stopRecording.prop('disabled', true);
        },

        'summary:request': function() {
          my.time('Summary Request');
          my.log('Requesting Summary');
        },

        'summary': function(msg) {
          my.status('Summary Retrieved');
          my.timeEnd('Summary Request');
          my.log('Summary Contents:', msg);
        }

      });
    },

    /** Callback binding for the ending of the recording. */
    onStartRecording: function() {
      my.recognition.start();
      return false;
    },

    onChunk: function(e) {

      var results = _.toArray(e.results);

      var recResult = results.filter(function(result) {
        return result.isFinal;
      }).reduce(function(prev, cur, index) {
        return prev + cur[0].transcript;
      }, '');

      console.log(results.filter(function(result) {
        return !result.isFinal;
      }));

      my.$recognizedText.text(recResult);

    },

    /** Callback binding for the ending of the recording. */
    onStopRecording: function() {
      my.recognition.stop();

      return false;
    },

    onPopulate: function() {
      
      $.get('/nixon.html').done(function(data) {
        my.$recognizedText.html(data);
      });

      return false;
    },

    getSummary: function(e) {
      var that = this;

      var msg = my.$recognizedText.text();

      socket.post('/recordings/summarize', { longform: msg }, function(res) {
        console.log(res);
        that.emit('summary', res);
        my.$interpretedData.text(res.sm_api_content);
      });

      this.emit('summary:request');
    }

  });

  return new Recognizer();

}());
