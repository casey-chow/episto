/**
 * RecordingController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
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

var _ = require('lodash');
var when = require('when');

var combineChunks = function(chunks) {
  when.map(chunks, function(value, index) {
    return 
  })
}

module.exports = {
    
  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to RecordingController)
   */
  _config: {},

  new: function(req, res) {
    res.view();
  },

  index: function(req, res) {
    sails.log('RecordingController.index');
    sails.log.info(req.params);
    res.json(req.params);
  },

  /**
   * For receiving new audio chunks.
   */
  chunk: function(req, res) {
    
  }

  
};
