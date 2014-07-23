/**
 * recordBlobStream.js
 *
 * @overview 
 * This file only concerns the stream-recording concept page.
 * Given an audio stream, this demo will record the streams in 2-sceond segments
 * and sent them to the server via
 *
 *=require zepto
 *=require lodash
 *=require socket.io
 *=require sails.io
 */

$(function recordBlobStream() {
  if (!$("#attr").hasClass("stream-recording")) { return; }

  console.log("Stream recording code activated");

  var $startRecording = $('#blob-stream .start-recording');
  var $stopRecording = $('#blob-stream .stop-recording');
  var $log = $('#blob-stream .log');
  var htmlLog = _.throttle(function(msg) { $log.html(msg); }, 1000);
  var $audioElement = $('#blob-stream .player');

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
