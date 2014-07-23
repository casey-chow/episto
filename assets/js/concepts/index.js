/**
 * Concepts
 * 
 * @overview
 * Concepts are just little demos that encapsulate the APIs we're trying to use
 * in a pattern that works.
 *
 *= require stapes
 *= require_self
 *= require concepts/recordSingleBlob
 *(=) require concepts/recordBlobStream
 */

(function conceptsIndex() {
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
