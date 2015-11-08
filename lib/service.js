'use strict'
const Const = require('./intern').Const
const Intern = require('./intern').Intern

const AWS = require('aws-sdk')
const EventEmitter = require('events').EventEmitter
const Util = require('util')

/**
* internals
* @private
*/
let internals = {
  logger: null,
  initLogger: Intern.fnInitLogger
}

/**
* Initialize the requested AWS service using the given Credentials
* @private
*/
internals.newService = function (awsConfig, RequestedAwsService, cb) {
  let newServiceObj

  try {
    // Instantiate an object of the requested Aws service class
    newServiceObj = new RequestedAwsService(awsConfig)
  } catch (err) {
    return cb(err)
  }

  // return the new service
  return cb(null, { newAwsService: newServiceObj })
}

/**
* Create MFA short term credentials
* @private
*/
internals.Credentials = function (options) {
  EventEmitter.call(this)

  options.keys.apiVersion = 'latest'
  options.keys.sslEnabled = true

  if (options.hasOwnProperty('upgrade')) {
    // Update with the MFA token passed in with the credentials
    this._update(options)
    return
  }

  let awsConfig = Object.assign({}, options.keys)

  // Else not using a MFA token
  this._awsConfig = new AWS.Config(awsConfig)

  // Upgrade creditials not necessary. Tell the caller ready.
  Intern.emitNextTick.call(this, Const.EVENT_CREDENTIAL,
                        null, { state: Const.STATE_READY })
}
Util.inherits(internals.Credentials, EventEmitter)

/**
* Create MFA short term credentials
* @private
*/
internals.Credentials.prototype._update = function (options) {
  let self = this
  let opsToUpgrade = options.upgrade
  let stsParams = {
    DurationSeconds: opsToUpgrade.durationSeconds | 900,  // 15 minute default
    SerialNumber: opsToUpgrade.serialNumber,
    TokenCode: opsToUpgrade.tokenCode
  }

  let stsConfigOps = Object.assign({}, options.keys)
  stsConfigOps.logger = options.logger

  let sts = new AWS.STS(stsConfigOps)

  // Request short term credentials from the STS service
  let req = sts.getSessionToken(stsParams)

  req.on('error', function (err, response) {
    Intern.emitNextTick.call(self, Const.EVENT_CREDENTIAL, err)
  })

  req.on('success', function (response) {
    let data = response.data

    if (!data.hasOwnProperty('Credentials')) {
      return handleMissingData(response)
    }

    onSuccess(response, stsConfigOps)
  })

  req.send()

  /**
  * Successful response
  */
  const onSuccess = function (response, keys) {
    // Update the AWS Config using the new short term credentials
    let data = response.data
    let newAwsCredentials = {
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken,
      region: keys.region,
      sslEnabled: keys.sslEnabled,
      apiVersion: keys.apiVersion,
      logger: keys.logger
    }

    // Create the config to be used for future requests
    self._awsConfig = new AWS.Config(newAwsCredentials)

    Intern.emitNextTick.call(self, Const.EVENT_CREDENTIAL,
      null, { state: Const.STATE_UPGRADED, config: newAwsCredentials })
  }

  /**
  * @todo Temporary. Handle the AWS-SDK issue when using node-inspector
  * with node v 0.12.x and node 4.x and node 5.x
  */
  const handleMissingData = function (response) {
    internals.logger.info('Success, but no Credentials data streamed: ' +
      JSON.stringify(response.httpResponse.headers))

    Intern.emitNextTick.call(self, Const.EVENT_CREDENTIAL,
      new Error('Internal: aws service failed to stream data on success'))
    return false
  }
}

/**
 * Constructs a new AwsSvc object for managing aws credentials
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
 * @arg {string} options.upgrade.tokenCode - Time-based one-time password (TOTP) that the MFA devices produces
 * @arg {string} [options.upgrade.durationSeconds=900] - The duration, in seconds, that the credentials should remain valid
 * @arg {boolean} [options.isLogging] - Use internal logging
 * @throws {error}
 * @emits {AwsSvc#complete}
 */
function AwsSvc (requestedSvc, options) {
  if (this.constructor.name === 'Object') {
    throw new Error('Must be instantiated using new')
  } else if (this.constructor.name === 'AwsSvc') {
    throw new Error('Abstract class ' +
      this.constructor.name + ' should not be instantiated')
  }
  EventEmitter.call(this)
  let self = this

  // initialize the property bag of AWS services which will be created
  this._services = {}

  let credOptions = Object.assign({}, options)

  internals.initLogger(credOptions.isLogging)
  credOptions.logger = internals.logger

  let credsManager = new internals.Credentials(credOptions)

  credsManager.on(Const.EVENT_CREDENTIAL, function (err, data) {
    let eventName = Const.EVENT_CREDENTIAL
    if (err) {
      internals.logger.warn(eventName, err)

      Intern.emitNextTick.call(self, Const.EVENT_COMPLETE, err)
      return
    }

    internals.logger.info(eventName, 'success')

    if (self._services.hasOwnProperty(requestedSvc.serviceIdentifier)) {
      let serviceName = requestedSvc.serviceIdentifier
      internals.logger.info('Refreshing service: ' + serviceName)
    }

    // Always instantiate the requested aws service, even if old one exists
    internals.newService(credsManager._awsConfig, requestedSvc, cbNewService)
  })

  // callback handler for creation of new AWS service
  const cbNewService = function (err, data) {
    if (err) {
      Intern.emitNextTick.call(self, Const.EVENT_COMPLETE, err)
      return
    }

    let newAwsService = data.newAwsService
    let serviceName = requestedSvc.serviceIdentifier

    // keep the new service object
    self._services[serviceName] = newAwsService

    /**
    * Emitted as the response to constuct AwsSvc
    * @event AwsSvc#complete
    * @param {?error} err - Only on error
    * @param {object} [state] - Null on error
    */
    Intern.emitNextTick.call(self, Const.EVENT_COMPLETE, null,
      { state: Const.STATE_READY })
  }
}
Util.inherits(AwsSvc, EventEmitter)

/**
* @description Manage AWS Services
*/
module.exports = AwsSvc
