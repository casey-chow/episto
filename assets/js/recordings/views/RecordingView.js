/**
 * Recording View
 * 
 *= require wavencoder
 */

Episto.Views.Recording = (function(window, document, Episto, undefined) {
  'use strict';

  /** Private Variables */
  var my = {

  };


  /** Private utility methods */ 

  var RecordingView = Stapes.subclass({

    constructor: function() {
      this.$el = $('#web-audio');

      this.bindEvents();
    },

    recordingState: 'processing',

    bindEvents: function() {
      
      this.$el.find('.start-recording').click(
        _.bind(this.emit, this, 'startBtn:click'));
      this.$el.find('.stop-recording').click(
        _.bind(this.emit, this, 'stopBtn:click'));
      
      this.on({
        'change:recordingState': this.updateRecordingState 
      });
    },

    updateRecordingState: function(state) {
      var startEnabled;
      var stopEnabled;
      
      switch(state) {
        case 'processing':
          startEnabled = false;
          stopEnabled = false;
          break;
        case 'ready':
          startEnabled = true;
          stopEnabled = false;
          break;
        case 'recording':
          startEnabled = false;
          stopEnabled = true;
          break;
        default:
          throw new Error('Recording state must be one of [processing, ready, recording]');
      }

      this.$el.find('.start-recording').prop('disabled', !startEnabled);
      this.$el.find('.stop-recording').prop('disabled', !stopEnabled);
    }

  });

  return new RecordingView();

})(window, document, Episto);