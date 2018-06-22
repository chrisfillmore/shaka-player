module.exports = {
  git: {
    workingDirectory: '../',
    masterBranch: 'master',
    // Since we can't push to master, we will need to push to a feature branch
    // and then merge to master.
    syncBranchPrefix: 'feature/',
    remote: {
      upstream: {
        name: 'upstream',
        url: 'https://github.com/google/shaka-player.git'
      },
      origin: {
        name: 'origin',
        url: 'ssh://git@egbitbucket.dtvops.net:7999/vstblib/shaka-player.git'
      }
    }
  },
  log: {
    prefix: '[shaka-player-att-ext]'
  }
};