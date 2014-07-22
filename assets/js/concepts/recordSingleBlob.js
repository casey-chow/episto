/**
 * recordSingleBlob.js
 *
 * @overview This file only concerns the stream-recording concept page.
 *
 *= require zepto
 *= require lodash
 *= require socket.io
 *= require sails.io
 *= require recordrtc
 */

(function conceptRecordSingleBlob() {

  if (!$("#attr").hasClass("stream-recording")) { return; }

  var $startRecording = $('#single-blob .start-recording');
  var $stopRecording = $('#single-blob .stop-recording');
  var $log = $('#single-blob .log');
  var htmlLog = _.throttle(function(msg) { $log.html(msg); }, 1000);
  var $audioElement = $('#single-blob .player');

  var singleBlobConcept = Concept.singleBlob = Concept.subclass({

    /** @constructor */
    constructor: function() {
      Concept.prototype.constructor.call(this);

      console.log("[RecordSingleBlob] recording code activated");

      $startRecording.click(_.bind(this.onStartRecording, this));
      $stopRecording.click(_.bind(this.onStopRecording, this));
      
      this.on('connect', function() {
        htmlLog('Ready to Record'); 
        console.log("[RecordSingleBlob] socket connected");
      }); 
    },

    /** Callback binding for the ending of the recording. */
    onStartRecording: function() {
      if($startRecording.hasClass("pure-button-disabled")) { return false; }

      htmlLog('Recording');

      $startRecording.addClass('pure-button-disabled');
      navigator.getUserMedia({audio: true, video: true }, function(stream) {
        recordAudio = RecordRTC(stream, { bufferSize: 16384 });

        recordAudio.startRecording();

        $stopRecording.removeClass('pure-button-disabled');
      }, console.log /* for error handling */);

      return false;
    },

    /** Callback binding for the ending of the recording. */
    onStopRecording: function() {
      if($stopRecording.hasClass('pure-button-disabled')) { return false; }

      $stopRecording.addClass('pure-button-disabled');

      recordAudio.stopRecording(function() {
        htmlLog('Recording Finished');

        recordAudio.getDataURL(function(audioDataURL) {

          console.log('Audio Data: ', audioDataURL);
          console.time('Sending Data to Server');
          htmlLog('Sending Blob to Server');

          socket.post('/concepts/stream-recording', { 
            audio: audioDataURL,
            type: recordAudio.getBlob().type || 'audio/wav'
          }, function(res) {
            console.timeEnd("Sending Data to Server");
            console.log("Server Response:");
            console.log(res);

            $audioElement.attr('src', res.message);

            htmlLog('Blob Successfully Sent');
            htmlLog('Ready to Record');
          });

        });

        $startRecording.removeClass('pure-button-disabled');
      });

      return false;
    }

  });

  new singleBlobConcept();

}());
