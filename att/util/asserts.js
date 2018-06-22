const logger = require('./logger');

module.exports = {
  assert (condition, message) {
    if (!condition) {
      logger.error(message);
      throw new Error(message);
    }
  }
};