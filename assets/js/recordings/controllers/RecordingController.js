/**
 * Recording Controller
 * 
 * A singleton object representing the Recording controller.
 */

Episto.Controllers.Recording = (function(window, document, Episto, undefined) {
  
  var Recording;
  var RecordingCollection;
  var RecordingView;

  var RecordingController = Stapes.subclass({

    ready: function() {
      this.emit('ready');

      Recording = Episto.Models.Recording;
      RecordingCollection = Episto.Collections.Recording;
      RecordingView = Episto.Views.Recording;
      
      this.bindEvents();

      RecordingView.set('recordingState', 'ready');
    },

    bindEvents: function() {
      var that = this;

      this.on({

      });

      RecordingView.on({
        'startBtn:click': function(e) {
          that.startRecording(e).done();
        },
        'stopBtn:click': function(e) {
          that.stopRecording(e).done();
        }
      });

    },


    /** 
     * @returns {Promise} Promise fulfilled when the recording starts.
     */
    startRecording: function(e) {
      
      if (this.recording) {
        Episto.error('Already recording, new recording cannot begin.');
      } else {
        Episto.log('Starting recording...');
      }
      
      this.recording = new Recording();
      RecordingCollection.push(this.recording);

      return when.callbacks
        .call(_.bind(this.recording.on, this.recording, 'ready'))
        .with(this.recording)
        .then(this.recording.start);

    },

    stopRecording: function(e) {
      var that = this;
      var recording = this.recording;
      
      if(!this.recording) {
        Episto.error('No recording exists, recording cannot stop.');
      }

      return recording.stop().then(function() {
        that.recording = null;
      }).then(recording.getCompiledAudio)
      .then(function(audio) {
        RecordingView.loadAduio(audio);
      });
    }

  });

  return new RecordingController();

})(window, document, Episto);