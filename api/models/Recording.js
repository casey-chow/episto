/**
 * Recording
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs    :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

  attributes: {
    
    /** 
     * The title of the recording. 
     * By default, the title will be the meeting timestamp. 
     */
    title: {
      type: 'string',
      required: true,

      /** The default title is "Meeting from <Date>" */
      defaultsTo: function() {
        sails.log(new Date());
       return 'Meeting from ' + (new Date()).toString(); }
    },  

    /**
     * The length of the recording, in milliseconds.
     */
    length: {
      type: 'integer',
      // required: 'true'
    }

    
  }

};
