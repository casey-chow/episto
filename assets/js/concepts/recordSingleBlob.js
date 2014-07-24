/**
 * recordSingleBlob.js
 *
 * @overview This file only concerns the stream-recording concept page.
 *
 *= require zepto
 *= require lodash
 *= require socket.io
 *= require sails.io
 *= require q
 *= require recordrtc
 */

(function conceptRecordSingleBlob() {

  if (!$("#attr").hasClass("stream-recording")) { return; }

  var $startRecording = $('#single-blob .start-recording');
  var $stopRecording = $('#single-blob .stop-recording');
  var $log = $('#single-blob .log');
  var htmlLog = _.throttle(function(msg) { $log.html(msg); }, 1000);
  var $audioElement = $('#single-blob .player');

  var singleBlobConcept = Concept.Stream.SingleBlob = Concept.Stream.subclass({

    /** @constructor */
    constructor: function() {
      Concept.Stream.prototype.constructor.call(this);

      console.log("[RecordSingleBlob] loading code");

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

          $startRecording.addClass('pure-button-disabled');
          $stopRecording.removeClass('pure-button-disabled');
        },
        'recording:stop': function() {
          htmlLog('Recording Finished');
        },
        'upload:start': function(audioDataURL) {
          console.log('[RecordSingleBlob] Audio Data: ', audioDataURL);
          console.time('[RecordSingleBlob] Sending Data to Server');
          htmlLog('Sending Blob to Server');
        },
        'upload:complete': function(res) {
          console.timeEnd("[RecordSingleBlob] Sending Data to Server");
          console.log("[RecordSingleBlob] Server Response:", res);

          htmlLog('Blob Successfully Sent');
          htmlLog('Ready to Record');
        }
      })
    },

    /** Callback binding for the ending of the recording. */
    onStartRecording: function() {
      if($startRecording.hasClass("pure-button-disabled")) { return false; }

      this.emit('recording:start');
      this._startRecording();
      return false;
      
    },

    /** Callback binding for the ending of the recording. */
    onStopRecording: function() {
      if($stopRecording.hasClass('pure-button-disabled')) { return false; }
      var self = this;

      $stopRecording.addClass('pure-button-disabled');

      this._stopRecording().then(function() {

        self.emit('recording:stop');
        $startRecording.removeClass('pure-button-disabled');
        return self._getRecordingDataURL();

      }).then(function(audioDataURL) {

        self.emit('upload:start', audioDataURL);
        return self._uploadRecording('/concepts/stream-recording', audioDataURL);

      }).then(function(res) {

        self.emit('upload:complete', res);
        $audioElement.attr('src', res.message);

      }).done();

      return false;
    }

  });

  new singleBlobConcept();

}());
