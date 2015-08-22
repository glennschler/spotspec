const AWS = require('aws-sdk')
const EventEmitter = require('events').EventEmitter
const Util = require('util')
const Const = require('./intern').Const
const Intern = require('./intern').Intern

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
* @constructor
* @private
*/
internals.Credentials = function (constructOps) {
  EventEmitter.call(this)
  var self = this
  var opsToConfig = constructOps.keys

  opsToConfig.apiVersion = 'latest'
  opsToConfig.sslEnabled = true

  this._awsConfig = new AWS.Config(opsToConfig)

  if (!constructOps.hasOwnProperty('upgrade')) {
    // Upgrade creditials not nessecary. Tell the caller ready.
    Intern.emitNextTick.call(this, Const.EVENT_CREDENTIAL,
      null, { state: Const.STATE_READY })
    return
  }

  // Need to update with the MFA token passed in with the credentials
  var upgrade = constructOps.upgrade

  this.update(upgrade, function cbUpdateCreds (err, data) {
    if (err) {
      Intern.emitNextTick.call(self, Const.EVENT_CREDENTIAL, err)
    } else {
      // keep the new config
      self._awsConfig = data.newAwsConfig

      Intern.emitNextTick.call(self, Const.EVENT_CREDENTIAL,
        null, { state: Const.STATE_UPGRADED })
    }
  })
}
Util.inherits(internals.Credentials, EventEmitter)

/**
* Create MFA short term credentials
* @private
*/
internals.Credentials.prototype.update = function (opsToUpgrade, cb) {
  var self = this
  var stsParams = {
    DurationSeconds: opsToUpgrade.durationSeconds | 900,  // 15 minute default
    SerialNumber: opsToUpgrade.serialNumber,
    TokenCode: opsToUpgrade.tokenCode
  }

  var sts = new AWS.STS(this._awsConfig)

  // Request short term credentials from the STS service
  sts.getSessionToken(stsParams, function cbGetSessionToken (err, data) {
    if (err) {
      return cb(err)
    }

    var awsConfig = self._awsConfig // for reference only

    // Update the AWS Config using the short term credentials
    var newAwsCredentials = {
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken,
      region: awsConfig.region,
      sslEnabled: awsConfig.sslEnabled,
      apiVersion: awsConfig.apiVersion
    }

    // Return the updated config
    var newAwsConfig = new AWS.Config(newAwsCredentials)

    return cb(null, { newAwsConfig: newAwsConfig, state: Const.STATE_UPGRADED })
  })
}

/**
* Subset of [aws docs]{@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html}
* @typedef {object} AwsSvc#AWSCredentials
* @property {string} accessKeyId
* @property {string} secretAccessKey
* @property {string} region
*/

/**
* Subset of [aws docs]{@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#getSessionToken-property}
* @typedef {object} AwsSvc#AWSSessionToken
* @property {string} serialNumber - MFA serial number
* @property {string} tokenCode - MFA token code
* @property {string} [durationSeconds=900] - The duration, in seconds, that the credentials should remain valid
*/

/**
* Credentials and optional MFA
* @typedef {object} AwsSvc#constructOpts
* @property {AwsSvc#AWSCredentials} keys - AWS config credentials
* @property {AwsSvc#AWSSessionToken} [upgrade] - MFA attributes
*/

/**
 * Constructs a new AwsSvc object for managing aws credentials
 * @constructor
 * @abstract
 * @arg {class} requestedSvc - The AWS.Service class to instantiate [aws docs]{@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Service.html}
 * @arg {AwsSvc#constructOpts} construct - The AWS serice IAM credentials
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
  internals.initLogger(isLogging)
  var self = this

  // initialize the property bag of AWS services which will be created
  this._services = {}

  var credsManager = new internals.Credentials(constructOps)

  credsManager.on(Const.EVENT_CREDENTIAL,
    function onCredsComplete (err, data) {
      if (err) {
        // Notify the caller
        Intern.emitNextTick.call(self, Const.EVENT_COMPLETE, err)
        return
      }

      internals.logger.info('Credentials: ' + data.state)

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
      // Notify the caller
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
* @module AwsSvc
* @description Manage AWS Services
*/
module.exports = AwsSvc