var mkvtools = require('../lib/mkvtools'),
    hashFiles = require('hash-files'),
    expect = require('expect.js'),
    path = require('path'),
    fs = require('fs');

describe('mkvtools', function() {
  describe('mkvinfo', function() {
    it('should provide an output on end', function(done) {
      var info = [];

      mkvtools.info(path.resolve(__dirname, 'assets/test-file.mkv'))
        .on('error', function(err) {
          done(new Error(err));
        })
        .on('data', function(chunk) {
          info.push(chunk);
        })
        .on('end', function() {
          var video = fs.readFileSync(path.resolve(__dirname, 'assets/test-file.nfo'));
          expect(Buffer.concat(info).toString()).to.equal(video.toString());
          done();
        })
        .run();
    });
  });

  describe('mkvextract', function() {
    it('should extract a video stream', function(done) {
      mkvtools.extract(path.resolve(__dirname, 'assets/test-file.mkv'))
        .mode('tracks')
        .addOutput('0', path.resolve(__dirname, 'assets/test-file-video.avi'))
        .on('error', function(err) {
          done(new Error(err));
        })
        .on('end', function() {
          var video = hashFiles.sync({files: [path.resolve(__dirname, 'assets/test-file-video.avi')]});
          expect(video).to.equal('ce0450d73114f9fe069a52f63d7ac5c08e70f231');
          done();
        })
        .run();
    });

    it('should emit an error when no mode was set', function(done) {
      mkvtools.extract(path.resolve(__dirname, 'mkvtools.js'))
        .on('error', function() {
          done();
        })
        .on('end', function() {
          done(new Error('mkvtools emitted an `end` event when an error was expected.'));
        })
        .run();
    });

    it('should emit an error when processing an invalid file', function(done) {
      mkvtools.extract(path.resolve(__dirname, 'mkvtools.js'))
        .mode('tracks')
        .on('error', function() {
          done();
        })
        .on('end', function() {
          done(new Error('mkvtools emitted an `end` event when an error was expected.'));
        })
        .run();
    });
  });
});
