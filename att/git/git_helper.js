const logger = require('../util/logger');
const asserts = require('../util/asserts.js');
let git;

/**
 * Absolute path to the working directory.
 * @type {string}
 */
let workingDirectory;

module.exports = {

  init (workingDirectory_) {
    workingDirectory = workingDirectory_;
    git = require('simple-git/promise')(workingDirectory);
  },

  /**
   * @returns {Promise<GitRemote[]>}
   */
  getRemotes () {
    return git.remote(['-v'])
      .then(parseRemoteOutput);
  },

  /**
   * @param {string} remote
   * @param {string} url
   * @returns {Promise}
   */
  setRemoteUrl (remote, url) {
    return git.remote(['set-url', remote, url]);
  },

  /**
   * @param {string} oldName
   * @param {string} newName
   * @returns {Promise}
   */
  setRemoteName (oldName, newName) {
    return git.remote(['rename', oldName, newName]);
  },

  /**
   * @param {string} name
   * @param {string} url
   * @returns {Promise}
   */
  addRemote (name, url) {
    logger.log(`Adding remote:`,
      `\t${name}\t${url}`,
      `to list of remotes in`,
      `\t${workingDirectory}`);

    return git.addRemote(name, url);
  },

  /**
   * Checks if there are uncommitted changes or untracked files in the
   * working directory.
   * @returns {Promise<boolean>}
   */
  isDirty () {
    // The output of `git status --porcelain` is empty if the working directory
    // is clean. (On inspection of the `simple-git` source, we see that calling
    // `git.status` adds additional flags, which produce non-empty output. Hence
    // we are calling `git.raw` to provide just the flags we want.)
    return git.raw(['status', '--porcelain'])
      .then((result) => !!result);
  },

  /**
   * @param {string} what
   * @returns {Promise}
   */
  checkout (what, newBranch) {
    const args = [what];
    if (newBranch) {
      args.push('-b');
    }

    return git.checkout(args);
  },

  /**
   * @param {string} remote
   * @param {string} branch
   * @returns {Promise}
   */
  fetch (remote, branch) {
    return git.fetch(remote, branch);
  },

  /**
   * @param {string} branch
   * @returns {Promise}
   */
  merge (branch) {
    return git.merge([branch]);
  },

  /**
   * @param {string} remote
   * @returns {Promise}
   */
  pushAllBranches (remote) {
    return git.push([remote, '--all']);
  }
};


/**
 * Parse lines of output from `git remote -v`. For example:
 *    shaka-player	https://github.com/google/shaka-player.git (fetch)
 *    shaka-player	https://github.com/google/shaka-player.git (push)
 * @param {string} lines
 * @returns {GitRemote[]}
 */
function parseRemoteOutput (lines) {
  return lines.trim().split('\n')
    .reduce((remotes, line, index) => {
      const parts = line.match(/\S+/g);
      const name = parts[0];
      const url = parts[1];
      const mode = parts[2].slice(1, -1);

      if (index % 2 === 0) {
        // Even-numbered lines are the first line describing a new remote
        const remote = {
          name,
          url: {
            [mode]: url
          }
        };
        remotes.push(remote);
      } else {
        // Odd-numbered lines are the second line of an existing remote.
        // Find the existing remote so that we can modify it.
        const remote = remotes[(index - 1) / 2];
        asserts.assert(remote.name === name, 'Listed remotes are out of order!');

        remote.url[mode] = url;
      }

      return remotes;
    }, []);
}
