/**
 * app.js
 *
 * This file contains some conventional defaults for working with Socket.io + Sails.
 * It is designed to get you up and running fast, but is by no means anything special.
 *
 * Feel free to change none, some, or ALL of this file to fit your needs!
 */

console.log('Connecting to Sails.js...');
var socket = io.connect();

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

