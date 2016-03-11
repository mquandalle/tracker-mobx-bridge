var live = require('LiveScript');

var createLivePreprocessor = function(args, config, logger, helper) {
  config = config || {};

  var log = logger.create('preprocessor.live');
  var defaultOptions = {
    bare: true
  };
  var options = helper.merge(defaultOptions, args.options || {}, config.options || {});

  var transformPath = args.transformPath || config.transformPath || function(filepath) {
    return filepath.replace(/\.ls/, '.js');
  };

  return function(content, file, done) {
    var processed = null;

    log.debug('Processing "%s".', file.originalPath);
    file.path = transformPath(file.originalPath);

    // Clone the options because live.compile mutates them
    var opts = helper._.clone(options);

    try {
      processed = live.compile(content, opts);
    } catch (e) {
      log.error('%s\n  at %s', e.message, file.originalPath);
    }

    done(processed);
  };
};

createLivePreprocessor.$inject = ['args', 'config.livePreprocessor', 'logger', 'helper'];

// Publish the module
module.exports = {
  'preprocessor:live': ['factory', createLivePreprocessor]
};
