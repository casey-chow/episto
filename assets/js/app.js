/**
 * app.js
 *
 * This is the main file for common code.
 *
 *=require zepto
 *=require lodash
 *=require socket.io
 *=require sails.io
 */

console.log('Connecting to Sails.js...');
var socket = io.connect();

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

$(function recordingConceptPage() {
  if (!$("#attr").hasClass("stream-recording")) { return; }

  console.log("Stream recording code activated");

  var $startRecording = $('#single-blob .start-recording');
  var $stopRecording = $('#single-blob .stop-recording');
  var $log = $('#single-blob .log');
  var htmlLog = _.throttle(function(msg) { $log.html(msg); }, 1000);
  var $audioElement = $('#single-blob .player');

  var startStream = function() {
    if($startRecording.hasClass("pure-button-disabled")) { return false; }

    htmlLog('Recording');

    $startRecording.addClass('pure-button-disabled');
    navigator.getUserMedia({audio: true, video: true }, function(stream) {
      recordAudio = RecordRTC(stream, { bufferSize: 16384 });

      recordAudio.startRecording();

      $stopRecording.removeClass('pure-button-disabled');
    }, console.log /* for error handling */);

    return false;
  };

  var stopStream = function() {
    if($stopRecording.hasClass('pure-button-disabled')) { return false; }

    $stopRecording.addClass('pure-button-disabled');

    recordAudio.stopRecording(function() {
      htmlLog('Recording Finished');

      recordAudio.getDataURL(function(audioDataURL) {

        console.log('Audio Data: ', audioDataURL);
        console.time('Sending Data to Server');
        htmlLog('Sending Blob to Server');

        socket.post('/concepts/stream-recording', { 
          audio: audioDataURL,
          type: recordAudio.getBlob().type || 'audio/wav'
        }, function(res) {
          console.timeEnd("Sending Data to Server");
          console.log("Server Response:");
          console.log(res);

          $audioElement.attr('src', res.message);

          htmlLog('Blob Successfully Sent');
          htmlLog('Ready to Record');
        });

      });

      $startRecording.removeClass('pure-button-disabled');
    });

    return false;
  };

  socket.on('connect', function socketConnected() {

    $startRecording.click(startStream);
    $stopRecording.click(stopStream);
    console.log("Socket Connected");
    htmlLog('Ready to Record');

  });

});
