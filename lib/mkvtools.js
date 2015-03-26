'use strict';

var EventEmitter = require('events').EventEmitter,
    inherits = require('util').inherits,
    spawn = require('child_process').spawn,
    which = require('which');

function MkvTools(exec, file) {
  if (!(this instanceof MkvTools)) {
    return new MkvTools('mkvinfo', file);
  }

  this.done = false;
  this.exec = exec;
  this.file = file;
  this.options = this.outputs = [];
}

inherits(MkvTools, EventEmitter);

MkvTools.info = function(file) {
  return new MkvTools('mkvinfo', file);
};

MkvTools.merge = function(file) {
  return new MkvTools('mkvmerge', file);
};

MkvTools.extract = function(file) {
  return new MkvTools('mkvextract', file);
};

MkvTools.prototype.mode = function(mode) {
  if (mode === 'timecodes') {
    mode = 'timecodes_v2';
  }

  this.mode = mode;
  return this;
};

MkvTools.prototype.addOption = function(option) {
  if (arguments.length > 1) {
    option = [].slice.call(arguments);
  }

  this.options = this.options.concat(option);
  return this;
};

MkvTools.prototype.addOutput = function(id, filename) {
  this.outputs = this.outputs.concat([id + ':' + filename]);
  return this;
};

MkvTools.prototype._error = function(msg) {
  if (!this.done) {
    this.done = true;
    this.emit('error', msg);
  }
};

MkvTools.prototype.run = function() {
  which(this.exec, function(err, path) {
    if (err) {
      this._error(new Error('Unable to locate the ' + this.exec + ' binary file in PATH.'));
    }

    var args = [];
    if (this.exec === 'mkvinfo') {
      args = args.concat(this.options, this.file);
    } else if (this.exec === 'mkvextract') {
      if (typeof this.mode !== 'string') {
        this._error(new Error('You must specify a mode to use with mkvextract.'));
        return;
      }
      args = args.concat(this.mode, this.file, this.options, this.outputs);
    } else if (this.exec === 'mkvmerge') {
      args = args.concat(this.options, ['-o', this.file], this.outputs);
    }

    this.process = spawn(path, args);
    this.process.on('error', this._error.bind(this));
    this.process.on('exit', function(exitCode) {
      if (exitCode > 0 && !this.done) {
        this._error(new Error(this.exec + ' exited with a non-zero exit code: ' + exitCode));
      } else {
        this.emit('end');
      }
    }.bind(this));

    this.process.stdout.on('data', function(chunk) {
      this.emit('data', chunk);
    }.bind(this));
  }.bind(this));
};

module.exports = MkvTools;
