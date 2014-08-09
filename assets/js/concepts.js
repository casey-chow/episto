/**
 * Concepts
 * 
 * @overview
 * Concepts are just little demos that encapsulate the APIs we're trying to use
 * in a pattern that works.
 *
 *= require stapes
 *= require_self
 *(=) require_tree concepts
 */

(function concepts() {
  'use strict';

  if (!$("#attr").hasClass("stream-recording")) { return; }

  var Concept = window.Concept = Stapes.subclass({

    /**
     * @constructor
     * @description Initializes the concept. The object will emit `ready` on document
     *              ready and `connect` on socket.io connect.
     */
    constructor: function() {
      var self = this;
      socket.on('connect', function() {
        self.emit('connect');
      });

      $(document).ready(function() {
        self.emit('ready');
      });
    },

    log: console.log,

    htmlLog: _.throttle(function(msg) { 
      this.$log.html(msg); 
    }, 1000)

  });

}());

(function streamConcept() {
  'use strict';

  if (!$("#attr").hasClass("stream-recording")) { return; }

  console.log('[StreamConcept] loading code');

  var StreamConcept = window.Concept.Stream = Concept.subclass({

    constructor: function() {
      this.on({
        'connect': function() {
          console.log('[StreamConcept] Socket Connected');
        }
      });

      Concept.prototype.constructor.call(this);
    },

    /** Starts the recording. */
    _startRecording: function() {
      var self = this;

      return this._recordAudioPromise().then(function(recordAudio) {
        recordAudio.startRecording();
      });

    },

    /** 
     * Stops the recording. 
     * @returns {Promise} A promise that resolves when the recuring stops.
     */
    _stopRecording: function() {
      return this._recordAudioPromise().then(function(recordAudio) {
        return Q.Promise(function(resolve) {
          recordAudio.stopRecording(resolve);
        });
      });
    },

    /** 
     * Get the data URL for the recording.
     * @returns {Promise} A promise that resolves when the data URL is retrieved.
     */
    _getRecordingDataURL: function() {
      return this._recordAudioPromise().then(function(recordAudio) {
        return Q.Promise(function(resolve) {
          recordAudio.getDataURL(resolve);
        }); 
      });
    },

    /**
     * Creates or gets a promise for recordAudio.
     * @returns {Promise} An instance of recordAudio.
     */
    _recordAudioPromise: function() {
      var promise = StreamConcept.__recordAudio = 
      StreamConcept.__recordAudio || this._getUserMediaPromise()
      .then(function(stream) {
        return RecordRTC(stream, { bufferSize: 16384 });
      }).catch(function(err) {
        console.log(err);
      });

      return promise;
    },

    /** 
     * Get the user media stream as a promise.
     * @returns {Promise} The promise of a stream object.
     */
    _getUserMediaPromise: function() {
      var promise = StreamConcept.__stream = 
      StreamConcept.__stream || Q.Promise(function(resolve, reject, notify) {
        navigator.getUserMedia({ audio: true }, resolve, reject);
      });

      return promise;
    },

    /** 
     * Uploads the recording taken from the mediaStream.
     * @returns {Promise} A promise object encapsulating the request.
     */
    _uploadRecording: function(url, audioDataURL, done) {
      return this._recordAudioPromise().then(function(recordAudio) {
        return Q.Promise(function(resolve, reject, notify) {
          socket.post(url, { 
            audio: audioDataURL,
            done: done,
            type: 'audio/wav'
          }, resolve);
        });
      });
    }
  });

}());
