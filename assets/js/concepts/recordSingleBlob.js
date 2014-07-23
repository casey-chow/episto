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

  var _stream;
  var recordAudio;


  /** 
   * Get the user media stream as a promise.
   * @returns {Promise} The promise of a stream object. If it already exists,
   *                    running `_getUserMedia().then(fn)` will run immediately.
   */
  var _getUserMedia = function() {
    _stream = _stream || Q.Promise(function(resolve, reject, notify) {
      navigator.getUserMedia({ 
        audio: true 
      }, resolve, reject);
    });

    return _stream;
  };

  /** 
   * Uploads the recording taken from the mediaStream.
   * @returns {Promise} A promise object encapsulating the request.
   */
  var _uploadRecording = function(url, audioDataURL) {
    return Q.Promise(function(resolve, reject, notify) {
        socket.post(url, { 
          audio: audioDataURL,
          type: recordAudio.getBlob().type || 'audio/wav'
        }, resolve);
    });
  };

  var singleBlobConcept = Concept.singleBlob = Concept.subclass({

    /** @constructor */
    constructor: function() {
      Concept.prototype.constructor.call(this);

      console.log("[RecordSingleBlob] recording code activated");

      this.bindEvents();
    },

    /** Bind all the events needed for the application. */
    bindEvents: function() {

      $startRecording.click(_.bind(this.onStartRecording, this));
      $stopRecording.click(_.bind(this.onStopRecording, this));

      this.on({
        'connect': function() {
          htmlLog('Ready to Record'); 
          console.log("[RecordSingleBlob] socket connected");
        },
        'recording:start': function() {
          htmlLog('Recording');
        },
        'recording:stop': function() {
          htmlLog('Recording Finished');
        },
        'upload:start': function(audioDataURL) {
          console.log('Audio Data: ', audioDataURL);
          console.time('Sending Data to Server');
          htmlLog('Sending Blob to Server');
        },
        'upload:complete': function(res) {
          console.timeEnd("Sending Data to Server");
          console.log("Server Response:", res);

          htmlLog('Blob Successfully Sent');
          htmlLog('Ready to Record');
        }
      })
    },

    /** Callback binding for the ending of the recording. */
    onStartRecording: function() {
      if($startRecording.hasClass("pure-button-disabled")) { return false; }

      this.emit('recording:start');

      $startRecording.addClass('pure-button-disabled');
      $stopRecording.removeClass('pure-button-disabled');

      _getUserMedia().then(function(stream) {
        recordAudio = RecordRTC(stream, { bufferSize: 16384 });
        recordAudio.startRecording();
      }).catch(function(err) { console.log(err); });

      return false;
    },


    /** Callback binding for the ending of the recording. */
    onStopRecording: function() {
      if($stopRecording.hasClass('pure-button-disabled')) { return false; }
      var self = this;

      $stopRecording.addClass('pure-button-disabled');

      Q.Promise(recordAudio.stopRecording).then(function() {

        self.emit('recording:stop');
        $startRecording.removeClass('pure-button-disabled');

        return Q.Promise(function(resolve) {
          recordAudio.getDataURL(resolve); 
        });

      }).then(function(audioDataURL) {

        self.emit('upload:start', audioDataURL);

        return _uploadRecording('/concepts/stream-recording', audioDataURL);

      }).done(function(res) {

        self.emit('upload:complete', res);

        $audioElement.attr('src', res.message);

      });

      return false;
    }

  });

  new singleBlobConcept();

}());
