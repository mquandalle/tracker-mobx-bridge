var GITHUB_REPO_REGEXP = /github\.com\/([\w-\.]+)\/([\w-\.]+)\.git/;
var parseRepoInfoFromPackage = function(content) {
  var match = content.match(GITHUB_REPO_REGEXP);

  return {
    user: match[1],
    repo: match[2]
  };
};


module.exports = function(grunt) {

  var exec = require('child_process').exec;
  var http = require('https');

  grunt.registerTask('auto-release', '', function(type) {
    var repoInfo = parseRepoInfoFromPackage(grunt.file.read('package.json'));
    var opts = this.options({
      githubUser: repoInfo.user,
      githubRepo: repoInfo.repo,
      branch: grunt.option('auto-release-branch') || 'master',
      remote: grunt.option('auto-release-remote') || 'upstream',
      checkTravisBuild: true,
      releaseTask: 'release'
    });

    var finish = this.async();
    var queue = [];
    var next = function(value) {
      if (!queue.length) {
        return finish();
      }

      queue.shift()(value, next, finish);
    };

    var execCmd = function(cmd, msg, fn) {
      if (msg) {
        grunt.verbose.write(msg + '...');
      }

      exec(cmd, function(err, output) {
        if (err) {
          return grunt.fatal(err.message.replace(/\n$/, '.'));
        }

        if (msg) {
          grunt.verbose.ok();
        }

        fn(output);
      });
    };

    var runCmd = function(cmd, msg, fn) {
      queue.push(function(valueFromPreviousCmd, next, finish) {
        execCmd(cmd, msg, function(output) {
          if (fn) {
            fn(output, next, finish);
          } else {
            next(output);
          }
        });
      });
    };

    var runCmdIf = function(condition, cmd, msg, fn) {
      if (condition) {
        runCmd(cmd, msg, fn);
      }
    }

    var run = function(fn) {
      queue.push(fn);
    };

    var runIf = function(condition, fn) {
      if (condition) {
        run(fn);
      }
    };

    runCmd('git fetch ' + opts.remote + ' --tags');

    // checkout the branch and pull from remote
    runCmd('git checkout ' + opts.branch, 'Switching to ' + opts.branch);
    runCmd('git pull ' + opts.remote + ' ' + opts.branch, 'Pulling from ' + opts.remote);


    // check if there are any new changes
    runCmd('git describe --tags --abbrev=0', 'Getting the previous tag', function(tag, next, finish) {
      var latestTag = tag.replace(/\n/g, '');

      execCmd('git log --grep="^feat|^fix" -E --oneline ' + latestTag + '..HEAD | wc -l', 'Checking for new changes since ' + latestTag, function(output) {
        var newChangesCount = parseInt(output, 10);

        if (!newChangesCount) {
          grunt.log.ok('Nothing to release since ' + latestTag + '.');
          return finish();
        }

        grunt.log.ok('There are ' + newChangesCount + ' new changes since ' + latestTag + '.');
        return next();
      });
    });



    // check Travis build
    runCmdIf(opts.checkTravisBuild, 'git show -s --format=%H HEAD', null, function(sha, next) {
      return next(sha.replace(/\n/g, ''));
    });

    runIf(opts.checkTravisBuild, function(latestCommit, next, finish) {
      grunt.verbose.write('Fetching status from GitHub/Travis...');

      var options = {
        hostname: 'api.github.com',
        path: '/repos/' + opts.githubUser + '/' + opts.githubRepo + '/statuses/' + latestCommit,
        headers: {
          'User-Agent': 'vojta'
        }
      };

      http.get(options, function(response) {
        var buffer = '';

        response.on('data', function(data) {
          buffer += data.toString();
        });

        response.on('end', function() {
          grunt.verbose.ok();

          var response = JSON.parse(buffer);

          if (!response.length) {
            return grunt.fatal('There is no Travis build for ' + opts.githubUser + '/' + opts.githubRepo + '/' + latestCommit);
          }

          if (response[0].state === 'success') {
            grunt.log.ok('Travis build for ' + opts.githubUser + '/' + opts.githubRepo + '/' + latestCommit + ' was successfull.');
            return next();
          }

          if (response[0].state === 'pending') {
            return grunt.fatal('Travis build for ' + opts.githubUser + '/' + opts.githubRepo + '/' + latestCommit + ' is pending.');
          }

          return grunt.fatal('Travis build for ' + opts.githubUser + '/' + opts.githubRepo + '/' + latestCommit + ' failed (' + response[0].state + ').');
        });
      });
    });


    // RELEASE
    run(function(_, next) {
      grunt.task.run([opts.releaseTask]);
      next();
    });


    // kick it off
    next();
  });
};


// publish for testing
module.exports.parseRepoInfoFromPackage = parseRepoInfoFromPackage;
