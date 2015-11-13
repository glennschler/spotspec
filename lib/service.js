'use strict'
const Credentials = require('./credentials')
const Intern = require('./intern')
const LogWrap = require('./logger')
const AWS = require('aws-sdk')

const EventEmitter = require('events').EventEmitter
const Util = require('util')

/**
* internals
* @private
*/
let internals = {
  EVENT_INITIALIZED: Intern.Const.EVENT_INITIALIZED,

  // logging
  logger: null,
  initLogger: function (isLogging) {
    internals.logger = new LogWrap(isLogging).logger
  },

  // alias
  emitAsync: Intern.Intern.emitAsync
}

/**
* Initialize the requested AWS service using the given Credentials
* @private
*/
internals.newService = function (awsConfig, RequestedAwsService) {
  let newServiceObj

  try {
    // Instantiate an object of the requested Aws service class
    newServiceObj = new RequestedAwsService(awsConfig)
  } catch (err) {
    internals.emitAsync.call(this, internals.EVENT_INITIALIZED, err)
    return
  }

  let serviceName = RequestedAwsService.serviceIdentifier

  // keep the new service object
  this._services[serviceName] = newServiceObj

  /**
  * Emitted as the response to constuct SvcAws
  * @event initialized
  * @param {?error} err - Only on error
  * @param {object} [state] - Null on error
  */
  let dataOk = { state: 'ok' }
  internals.emitAsync.call(this, internals.EVENT_INITIALIZED, null, dataOk)
}

/**
 * Constructs a new SvcAws object for managing aws credentials
 * @constructor
 * @abstract
 * @arg {class} requestedSvc - The AWS.Service class to instantiate [aws docs]{@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Service.html}
 * @arg {object} options - The AWS service IAM credentials
 * @arg {object} options.keys - Credentials for the service API authentication. See [aws docs]{@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html}
 * @arg {string} options.keys.accessKeyId - AWS access key ID
 * @arg {string} options.keys.secretAccessKey - AWS secret access key
 * @arg {string} options.keys.region - The EC2 region to send service requests
 * @arg {object} options.upgrade - Temporary Session Token credentials. See [aws docs]{@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#getSessionToken-property}
 * @arg {string} options.upgrade.serialNumber - Identifies the user's hardware or virtual MFA device
 * @arg {number} options.upgrade.tokenCode - Time-based one-time password (TOTP) that the MFA devices produces
 * @arg {number} [options.upgrade.durationSeconds=900] - The duration, in seconds, that the credentials should remain valid
 * @arg {boolean} [options.isLogging=false] - Use internal logging
 * @throws {error}
 * @emits {intialized}
 */
function SvcAws (requestedSvc, options) {
  if (this.constructor.name === 'Object') {
    throw new Error('Must be instantiated using new')
  } else if (this.constructor.name === 'SvcAws') {
    throw new Error('Abstract class ' +
      this.constructor.name + ' should not be instantiated')
  }
  EventEmitter.call(this)
  let self = this

  // initialize the property bag of AWS services which will be created
  this._services = {}

  let credOptions = Object.assign({}, options)

  internals.initLogger(options.isLogging)
  this.logger = internals.logger

  credOptions.logger = this.logger
  let credsManager = new Credentials(credOptions)

  credsManager.once(internals.EVENT_INITIALIZED, function (err, data) {
    if (err) {
      self.logger.warn(internals.EVENT_INITIALIZED, err)

      internals.emitAsync.call(self, internals.EVENT_INITIALIZED, err)
      return
    } else {
      self.logger.info(internals.EVENT_INITIALIZED, 'success')
    }

    if (self._services.hasOwnProperty(requestedSvc.serviceIdentifier)) {
      let serviceName = requestedSvc.serviceIdentifier
      self.logger.info('Refreshing service: ' + serviceName)
    }

    // Always instantiate the requested aws service, even if old one exists
    internals.newService.call(self, credsManager._awsConfig, requestedSvc)
  })
}
Util.inherits(SvcAws, EventEmitter)

/**
* @description Manage AWS Services
*/
module.exports = {
  SvcAws: SvcAws,
  EC2: AWS.EC2      // currently the only service supported for exports
}
