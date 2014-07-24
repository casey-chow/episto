/**
 * app.js
 *
 * This is the main file for common code.
 *
 *=require zepto
<<<<<<< Updated upstream
 *=require lodash
=======
>>>>>>> Stashed changes
 *=require socket.io
 *=require sails.io
 *=require lodash
 */

console.log('[Episto] Connecting to Sails.js...');
var socket = window.Socket = io.connect();

// TODO: Figure out a more robust way to handle page specific JS
$(function newRecordingPage() {
  if (!$("attr").hasClass("new-recording")) { return; }

  var $startRecording = $('#start-recording');
  var $stopRecording = $('#stop-recording');

  var startStream = function() {
    $startRecording.prop('disabled', true);
    navigator.getUserMedia({audio: true, video: true }, function(stream) {
      recordAudio = RecordRTC(stream, { bufferSize: 16384 });

      recordAudio.startRecording();

      $stopRecording.prop('disabled', false);
    }, console.log /* for error handling */);

    return false;
  };

  var stopStream = function() {
    $stopRecording.prop('disabled', true);

    recordAudio.stopRecording();

    recordAudio.getDataURL(function(audioDataURL) {
      console.log('this' + audioDataURL);
      socket.post('/recordings', { url: audioDataURL });
    });

    $startRecording.prop('disabled', false);

    return false;
  };

  socket.on('connect', function socketConnected() {

    $startRecording.click(startStream);
    $stopRecording.click(stopStream);

  });
});

