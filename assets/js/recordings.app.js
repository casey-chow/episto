/**
 * recording.app.js
 *
 * Metafile to contain all recording-related code.
 *
 *= require zepto
 *= require lodash
 *= require stapes
 *= require when
 *= require socket.io
 *= require sails.io
 *= require_self
 *= require_tree recordings
 */

window.Episto = window.Episto || {};

Episto.Models = Episto.Models || {};
Episto.Collections = Episto.Collections || {};
Episto.Controllers = Episto.Controllers || {};
Episto.Views = Episto.Views || {};

Episto.log = _.bind(console.log, console);
Episto.error = _.bind(console.error, console);

$(function () {

	Episto.Init({
		bufferSize: 4096,
		sampleRate: 48000,
		compilationUrl: function(recId) {
			return '/recordings/'+recId+'/full';
		},
		uploadUrl: function(recId) {
			return '/recordings/'+recId+'/chunk';
		}
	});

});

Episto.Init = function(opts) {
	Episto.options = opts;

	Episto.Controllers.Recording.ready();
};