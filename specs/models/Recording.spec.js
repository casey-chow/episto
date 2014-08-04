/**
 * Recording Spec
 * 
 * @description :: The specification and tests for the recording model's behavior.
 */

var sinon = require('sinon');

describe.skip('Recording', function () {
    var app;

    before(function (done) {
        Sails.lift({
            log: { level: 'error' }
        }, function(err, sails) {
            app = sails;
            done(err, sails);
        });
    });

    after(function (done) {
        try {
            app.lower(done);
        } catch(e) { done(); }
    });

    describe('validations', function() {
        it('ensures that a title exists', function (done) {
            Recording.create({ }).done(function(err, recording) {
                expect(recording).to.have.property('title');
                done();
            });
        });
    });
});