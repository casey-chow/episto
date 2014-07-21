/**
 * ConceptController
 *
 * @module      :: Controller
 * @description :: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

module.exports = {
    
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to ConceptController)
   */
  _config: {
    rest: false,
    pluralize: true 
  },

  /** Simply display a list of concepts to try. */
  index: function(req, res) {
    res.view('concept/index', {
      concepts: [
        "stream-recording",
      ]
    });
  },

  /** Render the streamRecording view that interacts with {@link streamRecording}. */
  renderStreamRecording: function(req, res) {
    sails.log("rendering Stream Recording page");
    res.view('concept/stream-recording');
  },


  /**
   * Test whether and how quickly recordings can be streamed. This method receives the audio
   * pumped in from the `concept/stream-recording` view and benchmarks recording speed.
   *
   * @example
   * socket.post('/concepts/stream-recording', { 
   *   audio: "the audio data URI"
   * }, function(res) { "respond to the data"; });
   * @see The proof of WebRTC experiment this is based off of, <a href="https://github.com/muaz-khan/WebRTC-Experiment/tree/master/RecordRTC/RecordRTC-over-Socketio">RecordRTC-over-Socketio</a>.
   * @see <a href="http://localhost:3000/concepts/stream-recording">The test in action</a>.
   */
  streamRecording: function(req, res) {
    var audioData = req.param('audio');
    var audioExcerpt = audioData.slice(-128);
    sails.log.info('Received Audio: ' + audioExcerpt);
    res.json({
      success: true,
      message: audioData,
      length: audioData.length
    });
  }

};
