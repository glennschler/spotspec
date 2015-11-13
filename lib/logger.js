'use strict'

/**
* Function to be assigned to an objects logger method
* @private
* @function LogWrapper
*/
function LogWrapper (isLogging) {
  if (this.constructor.name === 'Function') {
    throw new Error('Missing object context')
  }

  if (!isLogging) {
    // stub the logger out
    this.logger = {}

    this.logger.info = function () {}
    this.logger.error = function () {}
    this.logger.warn = function () {}
    return
  }

  // Else config winston for logging
  const Winston = require('winston')

  let winstonTransport = new (Winston.transports.Console)({
    json: false,
    colorize: true
  })

  this.logger = new (Winston.Logger)({
    transports: [winstonTransport]
  })
}

/**
* @description Wrapper around winston
*/
module.exports = LogWrapper
