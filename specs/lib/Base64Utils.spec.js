/**
 * Base64Utils Spec
 */

var helpers       = require('../helpers');
var randomstring  = require('randomstring');

/** The test subject. */
var Base64Utils = require('../../api/lib/Base64Utils');

/** Dependencies to stub */
var fs            = require('fs-extra');
var path          = require('path');

describe('Base64Utils', function () {
  var subject = Base64Utils;

  before(function () {

    this.genBase64Str = function() {
      var ranStr = randomstring.generate()
      return 'data:audio/wav;base64,'+new Buffer(ranStr).toString('base64');
    };
    this.genNonBase64Str = randomstring.generate;

  });

  beforeEach(function() {

    this.base64Str = this.genBase64Str();
    this.nonBase64Str = this.genNonBase64Str();

  });


  describe('.isBase64', function() {

    var isBase64 = Base64Utils.isBase64;
    
    it('determines whether a string is base64-encoded', function() {
      expect(isBase64(this.base64Str)).to.be.true;
      expect(isBase64(this.nonBase64Str)).to.be.false;
      expect(isBase64('')).to.be.false;
    });

  }); 

  describe('.readFileAsBase64', function() {
    var readFile;
    var readFileAsBase64;

    before(function () {
      readFileAsBase64 = Base64Utils.readFileAsBase64;
      readFile = sinon.stub(fs, 'readFile').yields(null, this.nonBase64Str);
    });

    after(function () {
      readFile.restore();
    });

    it('reads the necessary file', function () {
      return readFileAsBase64('test.wav', 'mime/type').then(function(base64) {
        expect(readFile).to.have.been.calledWithMatch('test.wav');
      });
    });

    it('returns a string', function() {
      return expect(readFileAsBase64('test.wav', 'audio/wav'))
        .to.eventually.be.a('string');
    });

    it('includes the MIME type in the returned string', function () {
      return expect(readFileAsBase64('test.wav', 'mime/type'))
        .to.eventually.contain('mime/type');
    });

    it('resolves the path filename', function () {
      var pathResolve = sinon.spy(path, 'resolve');

      return readFileAsBase64('test.wav', 'audio/wav').then(function(file) {
        expect(pathResolve).to.have.been.calledWithExactly('test.wav');
        pathResolve.restore();
      });
    });

  });

  describe('.writeBase64StringAsFile', function() {
    var writeFile;
    var writeBase64StringAsFile;

    before(function() {
      writeBase64StringAsFile = Base64Utils.writeBase64StringAsFile;
      writeFile = sinon.stub(fs, 'writeFile').yields();
    });

    after(function () {
      writeFile.restore();
    });

    it('resolves the path filename', function() {
      var pathResolve = sinon.spy(path, 'resolve');

      return writeBase64StringAsFile(this.base64Str, 'test.wav').then(function() {
        expect(pathResolve).to.have.been.calledWithExactly('test.wav');
      });
    });

    it('converts the file to a binary buffer before save', function() {
      return writeBase64StringAsFile(this.base64Str, 'test.wav').then(function() {
        expect(writeFile).to.have.been.calledWithMatch(Buffer);
      });
    });

    it('writes the file', function() {
      return writeBase64StringAsFile(this.base64Str, 'test.wav').then(function() {
        expect(writeFile).to.have.been.called;
      })
    });

  });

  describe('.writeBase64ArrayAsFile', function() {
    var writeFile;
    var writeBase64ArrayAsFile;

    before(function() {
      this.popSize = Math.floor(Math.random() * 30) + 5;

      writeBase64ArrayAsFiles = Base64Utils.writeBase64ArrayAsFiles;

      this.base64Arr = _.map(_.range(0, this.popSize), this.genBase64Str);
      this.base64FileArr = _.map(_.range(0, this.popSize), this.genNonBase64Str);
    });

    beforeEach(function () {
      writeBase64StringAsFile = sinon.stub(Base64Utils, 'writeBase64StringAsFile').resolves();      
    });

    afterEach(function () {
      writeBase64StringAsFile.restore();
    });
    
    it('writes an array of base64-encoded strings to respective files', function() {
      var that = this;

      return writeBase64ArrayAsFiles(this.base64Arr, this.base64FileArr)
      .then(function(arr) {
        // Get the arguments and rearrange them by type.
        var _arr = _.zip(writeBase64StringAsFile.args);
        var base64Str_args = _arr[0];
        var fileName_args = _arr[1];

        expect(writeBase64StringAsFile).to.have.callCount(that.popSize);
        expect(base64Str_args).to.deep.equal(that.base64Arr);
        expect(fileName_args).to.deep.equal(that.base64FileArr);
      });
    });

    it('accepts a function for filenames', function() {
      var that = this;

      var fileMap = function(n) { return that.base64FileArr[n]; };

      return writeBase64ArrayAsFiles(this.base64Arr, this.base64FileArr)
      .then(function(arr) {
        // Get the arguments and rearrange them by type.
        var _arr = _.zip(writeBase64StringAsFile.args);
        var base64Str_args = _arr[0];
        var fileName_args = _arr[1];

        expect(writeBase64StringAsFile).to.have.callCount(that.popSize);
        expect(base64Str_args).to.deep.equal(that.base64Arr);
        expect(fileName_args).to.deep.equal(that.base64FileArr);
      });

    });

  });

  describe('.writeBase64AsFile', function() {
    var writeBase64AsFile;

    before(function () {
      writeBase64AsFile = Base64Utils.writeBase64AsFile;

      this.base64Arr = _.map(_.range(0, 5), this.genBase64Str);
      this.base64FileArr = _.map(_.range(0, 5), this.genNonBase64Str);
    });
    
    beforeEach(function () {
      writeBase64StringAsFile = sinon.stub(Base64Utils, 'writeBase64StringAsFile').resolves();      
      writeBase64ArrayAsFiles = sinon.stub(Base64Utils, 'writeBase64ArrayAsFiles').resolves();      
    });

    afterEach(function() {
      writeBase64StringAsFile.restore();
      writeBase64ArrayAsFiles.restore();
    });

    it('redirects string input to writeBase64StringAsFile', function() {
      var that = this;

      return writeBase64AsFile(this.base64Str, 'asdf.wav').then(function() {
        expect(writeBase64StringAsFile)
          .to.have.been.calledWithExactly(that.base64Str, 'asdf.wav');
      });
    });

    it('redirects array input to writeBase64ArrayAsFiles', function() {
      var that = this;

      return writeBase64AsFile(this.base64Arr, this.base64FileArr).then(function() {
        expect(writeBase64ArrayAsFiles)
          .to.have.been.calledWithExactly(that.base64Arr, that.base64FileArr);
      });
    });

    it('throws if not given a string or array', function() {
      return expect(writeBase64AsFile({}, 'asdf.wav'))
        .to.be.rejectedWith(TypeError);
    });
  });

  describe('Associations', function() {
    
    it('aliases readFileAsBase64 to readFile', function() {
      expect(Base64Utils.readFile).to.equal(Base64Utils.readFileAsBase64);
    });

    it('aliases writeBase64AsFile to writeFile', function() {
      expect(Base64Utils.writeFile).to.equal(Base64Utils.writeBase64AsFile);
    });

  });

});