/**
 * Recording Model
 *
 *= require stapes
 *= require when
 *= require audioStream
 */

Episto.Models.Recording = (function(window, document, Episto, undefined) {
  'use strict';
  
  /** 
   * Private Methods 
   */

  var my = {

    Collection: Stapes.subclass(),

    /** 
     * Add a new chunk.
     *
     * @returns {model} The existing object, for chaining.
     */
    addChunk: function(chunk) {

      this.chunks.push(chunk);

      return this;

    }

  };

  /** Public Methods */

  var Recording = Stapes.subclass({

    /** 
     * Attributes
     *
     * `id` - Unique ID for recording
     * `chunks` - Collection of base64 chunks
     * `title` - Title of the recording
     * `complete` - whether the recording is complete
     */

    constructor: function() {
      var that = this;

      this.chunks = new my.Collection();
      _.bindAll(this, 'storeChunk', 'uploadChunk');
      this.complete = false;

      this.bindEvents();

      socket.post('/recordings/', {
        title: '' + new Date()
      }, function() { that.emit('ready'); })

    },

    bindEvents: function() {
      this.on({
        'ready': function() {
          Episto.log('App is ready to record');
        },
        'stop': function() {
          Episto.log('Stopped recording', this.id);
          this.notifyDone();
        },
        'start': function() {
          Episto.log('Starting recording', this.id);
        }
      });

    },

    /**
     * Start the recording for this audio and bind the chunk listener.
     *
     * @emits start
     * @returns {Promise} Promise fulfilled upon completion.
     */
    start: function() {

      return Episto.AudioStream.open()
        .tap(_.bind(this.emit, this, 'start'))
        .then(function(stream) {
          Episto.log('binding streams')
          // stream.on('chunk', _.bind(this.storeChunk, this));
          // stream.on('chunk', _.bind(this.uploadChunk, this));
        });

    },

    /**
     * Unbinds the chunk recorder from the audio stream.
     * Note that it does not close the stream, in case we want to use it again.
     * 
     * @returns {Promise} Immediately-fulfilled promise.
     */
    stop: function() {

      AudioStream.off('chunk', this.storeChunk);
      this.emit('stop');
      this.complete = true;

      return when();

    },

    /** 
     * Store a chunk in memory.
     *
     * @param {String} chunk - A base64-encoded WAV audio chunk.
     * @returns {model} The existing object, for chaining.
     */
    storeChunk: function(chunk) {

      this.chunks.push(chunk);
      return this;

    },

    /** 
     * Upload a chunk to the server.
     *
     * @param {String} chunk - A base64-encoded WAV audio chunk.
     * @returns {Promise} A promise fulfilled when the chunk is successfully uploaded.
     */
    uploadChunk: function(chunk) {

        this.uploadUrl = Episto.config.uploadURL(this.id);
 
        return when.callbacks.call(_.bind(socket.post, socket), this.uploadUrl, { 
            audio: chunk,
            done: false,
            type: 'audio/wav'
        });

    },

    /**
     * Notify the server of stream completion.
     * 
     * @returns {Promise} Promise fulfilled when the call is completed.
     */
    notifyDone: function() {

      return when.callbacks.call(_.bind(socket.post, socket), this.uploadUrl, {
        done: true
      }).done();

    },

    /**
     * Request the compiled audio file.
     * 
     * @returns {Promise} Promise fulfilled when the file is delivered.
     */
    getCompiledAudio: function() {
      
      return when.callbacks.call(socket.get, Episto.config.compilationUrl);

    }

  });

  return Recording;

})(window, document, Episto);