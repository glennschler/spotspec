'use strict'
const Intern = require('./intern')

const AWS = require('aws-sdk')
const EventEmitter = require('events').EventEmitter
const Util = require('util')

/**
* internals
* @private
*/
let internals = {
  EVENT_INITIALIZED: Intern.Const.EVENT_INITIALIZED,

  // alias
  emitAsync: Intern.Intern.emitAsync
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
* Credentials - Create MFA short term credentials
* @constructor
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
* @emits {initialized}
*/
function Credentials (options) {
  EventEmitter.call(this)

  options.keys.apiVersion = 'latest'
  options.keys.sslEnabled = true

  if (options.hasOwnProperty('upgrade')) {
    // Update with the MFA token passed in with the credentials
    this.upgrade(options)
    return
  }

  let awsConfig = Object.assign({}, options.keys)

  // Else not using a MFA token
  this._awsConfig = new AWS.Config(awsConfig)

  // Upgrade creditials not necessary. Tell the caller ready.
  internals.emitAsync.call(this, internals.EVENT_INITIALIZED, null, { state: 'ok' })
}
Util.inherits(Credentials, EventEmitter)

/**
* Create MFA short term credentials
* @private
*/
Credentials.prototype.upgrade = function (options) {
  let self = this
  let opsToUpgrade = options.upgrade
  let stsParams = {
    DurationSeconds: opsToUpgrade.durationSeconds | 900,  // 15 minute default
    SerialNumber: opsToUpgrade.serialNumber
  }

  // allow if no TokenCode (SMS enabled MFA account)
  if (opsToUpgrade.tokenCode) {
    stsParams.TokenCode = opsToUpgrade.tokenCode
  }

  let stsConfigOps = Object.assign({}, options.keys)
  stsConfigOps.logger = options.logger

  let sts = new AWS.STS(stsConfigOps)

  // Request short term credentials from the STS service
  let req = sts.getSessionToken(stsParams)

  req.on('error', function (err, response) {
    internals.emitAsync.call(self, internals.EVENT_INITIALIZED, err)
  })

  req.on('success', function (response) {
    // Update the AWS Config using the new short term credentials
    let data = response.data
    let newAwsCredentials = {
      accessKeyId: data.Credentials.AccessKeyId,
      secretAccessKey: data.Credentials.SecretAccessKey,
      sessionToken: data.Credentials.SessionToken,
      region: options.keys.region,
      sslEnabled: options.keys.sslEnabled,
      apiVersion: options.keys.apiVersion,
      logger: stsConfigOps.logger
    }

    // Create the config to be used for future requests
    self._awsConfig = new AWS.Config(newAwsCredentials)

    internals.emitAsync.call(self, internals.EVENT_INITIALIZED,
      null, { state: 'ok', config: newAwsCredentials })
  })

  req.send()
}

/**
* @description Manage AWS Services
*/
module.exports = Credentials
