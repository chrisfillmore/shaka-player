const logger = require('../util/logger');
const GitHelper = require('./git_helper')
const config = require('../config');
const path = require('path');

const workingDirectory = path.resolve(config.git.workingDirectory);

start();

function start () {
  // GitHelper must be initialized before it is used
  GitHelper.init(workingDirectory);

  checkForUncommittedChanges()
    .then(configureAllRemotes)
    .then(pullFromUpstream)
    .then(pushToOrigin)
    .catch(onError);
}

function checkForUncommittedChanges () {
  return GitHelper.isDirty()
    .then((dirty) => {
      if (dirty) {
        throw Error(`There are uncommitted/untracked changes in ${workingDirectory}`);
      }
    });
}

function configureAllRemotes () {
  return GitHelper.getRemotes()
    .then((remotes) => {
      return Promise.all([
        configureRemote(remotes, config.git.remote.upstream, 'fetch'),
        configureRemote(remotes, config.git.remote.origin, 'push')
      ]);
    });
}

/**
 * This script is intentionally opinionated -- your git remotes must be
 * set up according to the configuration. This function enforces that.
 * @param {GitRemote[]} remotes
 * @param {object} remoteConfig
 * @param {string} mode
 */
function configureRemote (remotes, remoteConfig, mode) {
  let remote = remotes.find((remote) => remote.name === remoteConfig.name);

  if (remote) {
    if (remote.url[mode] === remoteConfig.url) {
      // Remote is configured correctly, no action required.
      return Promise.resolve();
    } else {
      logger.log('Found remote by name:',
        `\t${remote.name}\t${remote.url[mode]} (${mode})`,
        `but the url doesn't match`,
        `\t${remoteConfig.url}`,
        `so the url will be changed.`);

      return GitHelper.setRemoteUrl(remote.name, remoteConfig.url);
    }
  } else {
    // First, check for a remote with the same url, but different name.
    remote = remotes.find((remote) => remote.url[mode] === remoteConfig.url);

    if (remote) {
      logger.log('Found remote by url:',
        `\t${remote.name}\t${remote.url[mode]} (${mode})`,
        `but the name doesn't match`,
        `\t${remoteConfig.name}`,
        `so the name will be changed.`);

      return GitHelper.setRemoteName(remote.name, remoteConfig.name);
    } else {
      // No remote found, either by name or url. Add one.
      return GitHelper.addRemote(remoteConfig.name, remoteConfig.url);
    }
  }
}

function pullFromUpstream () {
  const upstream = config.git.remote.upstream;

  return GitHelper.fetch(upstream.name, config.git.masterBranch)
    .then(() => GitHelper.checkout(config.git.masterBranch))
    .then(() => GitHelper.merge(`${upstream.name}/${config.git.masterBranch}`));
}

function pushToOrigin () {
  const origin = config.git.remote.origin;
  const upstream = config.git.remote.upstream;

  return GitHelper.checkout(getSyncBranchName(), true)
    .then(() => GitHelper.pushAllBranches(origin.name));
}

function getSyncBranchName () {
  const dateTime = new Date().toISOString().split('.')[0].replace(':','-');

  return `${config.git.syncBranchPrefix}${upstream.name}Sync_${dateTime}`;
}

function onError (error) {
  console.error(error.message || 'There was an error.', error);
}