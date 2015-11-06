const Const = require('./intern').Const
const Intern = require('./intern').Intern

const AWS = require('aws-sdk')
const EventEmitter = require('events').EventEmitter
const Util = require('util')

/**
* internals
* @private
*/
var internals = {
  logger: null,
  initLogger: Intern.fnInitLogger
}

/**
* Initialize the requested AWS service using the given Credentials
* @private
*/
internals.newService = function (awsConfig, RequestedAwsService, cb) {
  var newServiceObj

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
internals.Credentials = function (constructOps) {
  EventEmitter.call(this)

  constructOps.keys.apiVersion = 'latest'
  constructOps.keys.sslEnabled = true

  if (constructOps.hasOwnProperty('upgrade')) {
    // Update with the MFA token passed in with the credentials
    this._update(constructOps)
    return
  }

  // Else not using a MFA token
  this._awsConfig = new AWS.Config(constructOps.keys)

  // Upgrade creditials not necessary. Tell the caller ready.
  Intern.emitNextTick.call(this, Const.EVENT_CREDENTIAL,
                        null, { state: Const.STATE_READY })
}
Util.inherits(internals.Credentials, EventEmitter)

/**
* Create MFA short term credentials
* @private
*/
internals.Credentials.prototype._update = function (constructOps) {
  var self = this
  var opsToUpgrade = constructOps.upgrade
  var stsParams = {
    DurationSeconds: opsToUpgrade.durationSeconds | 900,  // 15 minute default
    SerialNumber: opsToUpgrade.serialNumber,
    TokenCode: opsToUpgrade.tokenCode
  }

  var sts = new AWS.STS(constructOps.keys)

  // Request short term credentials from the STS service
  var req = sts.getSessionToken(stsParams)

  req.on('error', function (err, response) {
    Intern.emitNextTick.call(self, Const.EVENT_CREDENTIAL, err)
  })

  req.on('success', function (response) {
    var data = response.data

    if (!data.hasOwnProperty('Credentials')) {
      return handleMissingData(response)
    }

    onSuccess(response)
  })

  req.send()

  /**
  * Successful response
  */
  var onSuccess = function (response) {
    // Update the AWS Config using the new short term credentials
    var data = response.data
    var awsConfig = constructOps.keys
    var newAwsCredentials = {
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken,
      region: awsConfig.region,
      sslEnabled: awsConfig.sslEnabled,
      apiVersion: awsConfig.apiVersion
    }

    // Create the config to be used for future requests
    self._awsConfig = new AWS.Config(newAwsCredentials)

    Intern.emitNextTick.call(self, Const.EVENT_CREDENTIAL,
      null, { state: Const.STATE_UPGRADED, config: newAwsCredentials })
  }

  /**
  * @todo Temporary. Handle the AWS issue when using node-inspector
  * with node v 0.12.x and iojs 3.x
  */
  var handleMissingData = function (response) {
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
 * @arg {object} construct - The AWS service IAM credentials
 * @arg {object} construct.keys - Credentials for the service API authentication. See [aws docs]{@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html}
 * @arg {string} construct.keys.accessKeyId - AWS access key ID
 * @arg {string} construct.keys.secretAccessKey - AWS secret access key
 * @arg {string} construct.keys.region - The EC2 region to send service requests
 * @arg {object} construct.upgrade - Temporary Session Token credentials. See [aws docs]{@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#getSessionToken-property}
 * @arg {string} construct.upgrade.serialNumber - Identifies the user's hardware or virtual MFA device
 * @arg {string} construct.upgrade.tokenCode - Time-based one-time password (TOTP) that the MFA devices produces
 * @arg {string} [construct.upgrade.durationSeconds=900] - The duration, in seconds, that the credentials should remain valid
 * @arg {boolean} [isLogging] - Use internal logging
 * @throws {error}
 * @emits {AwsSvc#complete}
 */
function AwsSvc (requestedSvc, constructOps, isLogging) {
  if (this.constructor.name === 'Object') {
    throw new Error('Must be instantiated using new')
  } else if (this.constructor.name === 'AwsSvc') {
    throw new Error('Abstract class ' +
      this.constructor.name + ' should not be instantiated')
  }
  EventEmitter.call(this)
  var self = this

  // initialize the property bag of AWS services which will be created
  this._services = {}

  internals.initLogger(isLogging)

  if (isLogging) {
    constructOps.keys.logger = internals.logger
  }

  var credsManager = new internals.Credentials(constructOps)

  credsManager.on(Const.EVENT_CREDENTIAL, function (err, data) {
    var eventName = Const.EVENT_CREDENTIAL
    if (err) {
      internals.logger.warn(eventName, err)

      Intern.emitNextTick.call(self, Const.EVENT_COMPLETE, err)
      return
    }

    internals.logger.info(eventName, 'success')

    if (self._services.hasOwnProperty(requestedSvc.serviceIdentifier)) {
      var serviceName = requestedSvc.serviceIdentifier
      internals.logger.info('Refreshing service: ' + serviceName)
    }

    // Always instantiate the requested aws service, even if old one exists
    internals.newService(credsManager._awsConfig, requestedSvc, cbNewService)
  })

  // callback handler for creation of new AWS service
  var cbNewService = function (err, data) {
    if (err) {
      Intern.emitNextTick.call(self, Const.EVENT_COMPLETE, err)
      return
    }

    var newAwsService = data.newAwsService
    var serviceName = requestedSvc.serviceIdentifier

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
