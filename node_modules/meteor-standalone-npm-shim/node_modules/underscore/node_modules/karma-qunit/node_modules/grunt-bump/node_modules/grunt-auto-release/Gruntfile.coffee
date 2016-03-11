module.exports = (grunt) ->

  grunt.initConfig
    simplemocha:
      options:
        ui: 'bdd'
        reporter: 'dot'
      unit:
        src: ['test/*.coffee']

    'auto-release': options:
      checkTravisBuild: false
    'bump': options:
      pushTo: 'upstream'

  grunt.loadTasks 'tasks'
  grunt.loadNpmTasks 'grunt-simple-mocha'
  grunt.loadNpmTasks 'grunt-npm'
  grunt.loadNpmTasks 'grunt-bump'

  grunt.registerTask 'test', ['simplemocha']
  grunt.registerTask 'release', 'Bump the version and publish to NPM.', (type) ->
    grunt.task.run [
      "bump:#{type||'patch'}"
      'npm-publish'
    ]
