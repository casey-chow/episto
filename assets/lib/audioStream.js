/**
 * Singleton object to abstract away the boilerplate of the
 * WebAudio API.
 *
 * @example
 * Episto.AudioStream.open().then(function(stream) {
 *   stream.on('chunk', processChunk);
 * });
 * when.delay(500).then(Episto.AudioStream.close);
 * 
 *= require wavencoder
 *= require when
 *= require lodash
 */

window.Episto = window.Episto || {};

/** @namespace */
Episto.AudioStream = (function(window, document, Episto, undefined) {

  /*********************************
   * Private Variables and Methods *
   *********************************/

  var my = {

    /**
     * Private Variables
     *
     * -audioStream
     * -wavEncoder
     * -streamOpen
     * -context
     * -audioSource
     * -scriptProcessor
     */

    /** 
     * Get the user media stream as a promise.
     *
     * @returns {Promise} The promise of a stream object.
     */
    getAudioStream: function() {

      my.audioStream = my.audioStream || when.promise(function(resolve, reject) {
        navigator.getUserMedia({ audio: true }, resolve, reject);
      });

      return my.audioStream;

    },

    /**
     * Get the WavEncoder object, if it already exists, or creates a new one 
     * from config.
     *
     * @returns {Promise} Promise fulfilled immediately.
     */
    getWavEncoder: function() {

      my.wavEncoder = my.wavEncoder || when(new WavEncoder(
        Episto.config.bufferSize,
        { sampleRateHz: Episto.config.sampleRate }
      ));

    },

    /** 
     * Opens the stream. If the stream already exists, does nothing.
     *
     * @returns {Promise} Immediately-fulfilled empty promise.
     */
    openStream: function(audioStream) {

      var bufferSize = Episto.config.bufferSize;
      my.streamOpen = !!my.audioStream;

      if(!my.streamOpen) {

        // Create processor
        my.context = new (audioContext || webkitAudioContext)();
        my.audioSource = my.context.createMediaStreamSource(audioStream);
        my.scriptProcessor = my.context.createScriptProcessor(bufferSize, 1, 1);

        // Bind it to an event
        // When there is audio to process, `process:chunk` will be emitted
        // with the event object.
        my.scriptProcessor.onaudioprocess = this.onChunk;

        // Connect!
        my.audioSource.connect(my.scriptProcessor);
        my.scriptProcessor.connect(_context.destination);

        AudioStream.emit('stream:open');
        my.streamOpen = true;

      }
      
      return when(AudioStream);

    },

    /**
     * Called when a chunk is available. Emits it to any functions that 
     * have registered with it.
     *
     * Note that this listener assumes the chunks are emitted in order.
     *
     * @param {Event} e - Event encapsulating the chunk availability.
     * @emits chunk:processing - Event with the original buffer.
     * @emits chunk - Event with the processed chunk.
     * @see https://github.com/fritzo/wavencoderjs
     */
    onChunk: function(e) {
      
        var inBuffer = e.inputBuffer.getChannelData(0);
        AudioStream.emit('chunk:buffer', inBuffer);

        // Only for if you care about getting the audio back to the browser.
        // var outBuffer = e.outputBuffer.getChannelData(0);
        // outBuffer.set(inBuffer); 
        
        var chunk = wavEncode(inBuffer);
        AudioStream.emit('chunk', chunk);

    },

    /**
     * Stops all audio-related tasks. If already closed, does nothing.
     *
     * @returns {Promise} Immediately fulfilled promise for itself.
     */
    closeStream: function(audioStream) {

      if(my.streamOpen) {
        audioStream.stop();

        my.scriptProcessor.onaudioprocess = null;
        my.audioSource.disconnect();
        my.scriptProcessor.disconnect();

        AudioStream.emit('stream:close');
        my.streamOpen = false;
      }

      return when(AudioStream);

    },

  };

  var AudioStream = {

    /**
     * Events are mixed in too.
     */

    /** 
     * Open the audio stream so that listeners can latch on. If already open,
     * does nothing.
     * 
     * @returns {Promise} Promise for AudioStream, for chaining.
     */
    open: function() {

      return my.getAudioStream().then(my.openStream);

    },

    /**
     * Encode the a given array of floats into a base64-encoded WAV file
     *
     * @returns {Promise} Promise for the encoded result.
     */
    wavEncode: function(buffer) {

      return my.getWavEncoder().then(function(wavEncoder) {
        return wavEncoder.encode(buffer);
      });

    },

    /**
     * Check whether the stream is open.
     * 
     * @returns {bool} - Whether the stream is open or not.
     */
    streamOpen: function() {

      return my.streamOpen;

    },

    /**
     * Closes the audio stream.
     *
     * @returns {Promise} Promise for AudioStream, for chaining.
     */
    close: function() {

      return my.getAudioStream().then(my.closeStream);

    }

  };

  return Stapes.mixinEvents(AudioStream);

})(window, document, Episto);