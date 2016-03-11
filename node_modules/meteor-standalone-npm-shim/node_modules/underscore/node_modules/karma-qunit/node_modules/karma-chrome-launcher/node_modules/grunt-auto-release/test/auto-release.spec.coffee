expect = require('chai').expect


describe 'parseRepoInfoFromPackage', ->
  parseRepoInfoFromPackage = require('../tasks/auto-release').parseRepoInfoFromPackage

  it 'should parse git url', ->
    info = parseRepoInfoFromPackage '"url": "git://github.com/vojtajina/grunt-auto-release.git"'
    expect(info.repo).to.equal 'grunt-auto-release'
    expect(info.user).to.equal 'vojtajina'

  it 'should parse repo with dots', ->
    info = parseRepoInfoFromPackage '"url": "git://github.com/org/socket.io-client.git"'
    expect(info.repo).to.equal 'socket.io-client'
    expect(info.user).to.equal 'org'
