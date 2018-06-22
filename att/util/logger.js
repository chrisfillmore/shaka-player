const PREFIX = require('../config').log.prefix;

module.exports = {
  log: logToConsole.bind(undefined, 'log'),
  debug: logToConsole.bind(undefined, 'debug'),
  warn: logToConsole.bind(undefined, 'warn'),
  error: logToConsole.bind(undefined, 'error')
};

function logToConsole (level, ...args) {
  args.unshift(PREFIX);
  console[level](args.join('\n  '));
}