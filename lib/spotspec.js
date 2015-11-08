'use strict'
const Const = require('./intern').Const
const Intern = require('./intern').Intern
const AwsSvc = require('./service')

const AWS = require('aws-sdk')
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
* Constructs a new SpotSpec Library
* @constructor
* @arg {object} options - The AWS service IAM credentials - See [aws docs]{@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html}
* @arg {object} options.keys - AWS credentials
* @arg {string} options.keys.accessKeyId - AWS access key ID
* @arg {string} options.keys.secretAccessKey - AWS secret access key.
* @arg {string} options.keys.region - The EC2 region to send service requests
* @arg {object} options.upgrade - Temporary Session Token credentials - See [aws docs]{@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#getSessionToken-property}
* @arg {string} options.upgrade.serialNumber - Identifies the user's hardware or virtual MFA device.
* @arg {string} options.upgrade.tokenCode - Time-based one-time password (TOTP) that the MFA devices produces
* @arg {number} options.upgrade.durationSeconds - How long the temporary key will last
* @arg {boolean} - options.isLogging
* @throws {error}
* @emits {SpotSpec#initialized}
*/
function SpotSpec (options) {
  if (this.constructor.name === 'Object') {
    throw new Error('Object must be instantiated using new')
  }
  let self = this
  let specOptions = Object.assign({}, options)

  internals.initLogger(specOptions.isLogging)

  // Have the superclass constuct as an EC2 service
  AwsSvc.call(this, AWS.EC2, specOptions)

  internals.logger.info('Loading EC2 for: ' + specOptions.keys.region)

  this.on(Const.EVENT_COMPLETE, function onComplete (err, data) {
    /**
    * Emitted as the response to constuct SpotSpec
    * @event SpotSpec#initialized
    * @param {?error} err - Only on error
    * @param {object} [initData] - Null on error
    */
    Intern.emitNextTick.call(self, Const.EVENT_INITIALIZED, err, data)
  })
}
Util.inherits(SpotSpec, AwsSvc)

/**
* prices - Request the latest spot prices
* @arg {object} options - JSON options to request current price
* @arg {string} options.type - The instance type to be priced e.g. m3.medium
* @arg {string} [options.product=Linux/UNIX] - e.g. 'Windows'
* @arg {boolean} [options.dryRun=true] - Only verify parameters.
* @arg {boolean} [options.isLogging=false]
* @emits SpotSpec#priced
*/
SpotSpec.prototype.prices = function (options) {
  let self = this
  let now = new Date()
  let future = new Date(now)

  // Add one day into the future to retrieve the current spot price
  future.setDate(future.getDate() + 1)

  let instanceTypes = [options.type]  // the vm type e.g. t1.micro
  let params = {
    DryRun: Intern.isTrueOrUndefined(options.dryRun),
    InstanceTypes: instanceTypes,
    ProductDescriptions: [options.product || 'Linux/UNIX'],
    EndTime: future,
    StartTime: now
  }

  let ec2Service = this._services.ec2
  internals.logger.info('Request Prices:', ec2Service.config.region, params)

  // Make the request to get the latest spot prices
  let req = ec2Service.describeSpotPriceHistory(params)

  req.on('error', function onError (err) {
    internals.logger.warn('Prices Error:\n', err)
    Intern.emitNextTick.call(self, Const.EVENT_PRICED, err)
  })

  req.on('success', function onSuccess (resp) {
    let data = resp.data
    if (data.NextToken !== '') {
      // Not relevant when using the Instance Type filter
    }

    let prices = data.SpotPriceHistory
    internals.logger.info('Prices:\n', prices)

    /**
    * Emitted as the response to a prices request
    * @event SpotSpec#priced
    * @param {?error} err - Only on error
    * @param {SpotSpec#SpotPriceHistory[]} [priceData] - Null on error
    */
    Intern.emitNextTick.call(self, Const.EVENT_PRICED, null, prices)
  })

  req.send()
}

/**
* Launch a spot instance
* @arg {object} options - JSON options to request a spot instance
* @arg {string} options.ami - The amazon machine image name
* @arg {string} options.type - The amazon Instance Type e.g. m3.medium
* @arg {string} options.price - The maximum price limit
* @arg {string} options.keyName - The name of the key pair needed to access the launched instance. See [user guide]{@link http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html}
* @arg {boolean} [options.dryRun=true] - Only verify launch parameters. if TRUE, do not launch an instance
* @arg {number} [options.count=1] - The InstanceCount number to launch
* @arg {string[]} [options.securityGroupIds] - Array of one or more security group ids. See [user guide]{@link http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html}
* @arg {string[]} [options.securityGroups] - Array of one or more security group names. See [user guide]{@link http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html}
* @arg {string} [options.userData] - cloud-init *base64-encoded* text. See [user guide]{@link http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html#user-data-cloud-init}
* @arg {object} options.launchSpecification - JSON of any additional launch specification. See [api guide]{@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#requestSpotInstances-property}
* @throws {error}
* @emits SpotSpec#launched
*/
SpotSpec.prototype.launch = function launch (options) {
  let self = this
  if (typeof options === 'undefined') {
    throw new Error('Missing required launch options')
  }

  // These are the aws request options, including the LaunchSpecification opts
  let params = {
    SpotPrice: options.price,
    DryRun: Intern.isTrueOrUndefined(options.dryRun),
    InstanceCount: options.count || 1,
    LaunchSpecification: {
      ImageId: options.ami,
      KeyName: options.keyName,
      InstanceType: options.type,
      UserData: options.userData,
      SecurityGroupIds: options.securityGroupIds,
      SecurityGroups: options.securityGroups
    }
  }

  // handle any 'undefined' passed in
  params.LaunchSpecification = Intern.addOptions({}, params.LaunchSpecification)

  // merge additional LaunchSpecification options, while also
  // converting key names to an uppercase first letter AWS Style, but no overwrite
  Intern.addOptions(params.LaunchSpecification, options.launchSpecification)

  // Make the spot launch request
  let ec2Service = this._services.ec2
  let req = ec2Service.requestSpotInstances(params)

  req.on('error', function onError (err) {
    internals.logger.warn('error: ', err)
    Intern.emitNextTick.call(self, Const.EVENT_LAUNCHED, err)
  })

  req.on('success', function onSuccess (resp) {
    internals.logger.info('launched: ', resp.data)

    /**
    * Emitted as the response to a launch request
    * @event SpotSpec#launched
    * @param {?error} err - Only on error
    * @param {object} [launchData] - Null on error
    */
    Intern.emitNextTick.call(self, Const.EVENT_LAUNCHED, null, resp.data)
  })

  req.send()
}

/**
* describeRequests - Describe the status of all current spot requests See [aws docs]{@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeSpotInstanceRequests-property}
* @arg {object} options - JSON options to request current price
* @arg {boolean} [options.dryRun=true] - Only verify parameters.
* @emits SpotSpec#priced
*/
SpotSpec.prototype.describeRequests = function spotDescribe () {
  let self = this
  let params = {
    DryRun: false
  }

  let ec2Service = this._services.ec2

  // Make the request to get the latest spot request details
  let req = ec2Service.describeSpotInstanceRequests(params)

  req.on('error', function onError (err) {
    internals.logger.warn('Spot Describe Error:\n', err)
    Intern.emitNextTick.call(self, Const.EVENT_SPOTS, err)
  })

  req.on('success', function onSuccess (resp) {
    let data = resp.data

    /**
    * Emitted as the response to a prices request
    * @event SpotSpec#requests
    * @param {?error} err - Only on error
    * @param {SpotSpec#SpotInstanceRequests[]} [spotInstanceRequests] - Null on error
    */
    Intern.emitNextTick.call(self, Const.EVENT_SPOTS,
                                null, data.SpotInstanceRequests)
  })

  req.send()
}

/**
* Describe the status of all running instance.
* @arg {object} options - JSON options to request current price
* @arg {boolean} [options.dryRun=true] - Only verify parameters.
* @emits {SpotSpec#Reservations[]} Array of EC2 instances
*/
SpotSpec.prototype.describeInstances = function describeInstances (options) {
  let self = this

  let ec2Service = this._services.ec2
  internals.logger.info('Request Describe Instances:', ec2Service.config.region, options)

  // Make the request to get the latest spot instance requests
  let req = ec2Service.describeInstances(options)

  req.on('error', function onError (err) {
    internals.logger.warn('Instance Describe Error:\n', err)
    Intern.emitNextTick.call(self, Const.EVENT_INSTANCES, err)
  })

  req.on('success', function onSuccess (resp) {
    let data = resp.data

    /**
    * Emitted as the response to a prices request
    * @event SpotSpec#instances
    * @param {?error} err - Only on error
    * @param {SpotSpec#reservations[]} [instances] - Null on error
    */
    Intern.emitNextTick.call(self, Const.EVENT_INSTANCES,
                              null, data.Reservations)
  })

  req.send()
}

/**
* Terminate an instance
*/
SpotSpec.prototype.terminateInstances = function terminateInstances (inId) {
  let instanceIds = [inId]
  let ec2Service = this._services.ec2
  let params = {
    DryRun: false,
    InstanceIds: instanceIds
  }

  // request an instance termination
  ec2Service.terminateInstances(params,
    function cbTerminstateInstances (err, data) {
      if (err) {
        internals.logger.warn(err, err.stack) // an error occurred
      } else {
        data.TerminatingInstances.forEach(function (entry) {
          internals.logger.info(entry)
        })
      }
    })
}

/**
* Cancel a spot request
*/
SpotSpec.prototype.cancelSpotRequest = function cancelSpotRequest (reqId) {
  let spotRequestIds = [reqId]
  let ec2Service = this._services.ec2
  let params = {
    DryRun: false,
    SpotInstanceRequestIds: spotRequestIds
  }

  // request the cancelation
  ec2Service.cancelSpotInstanceRequests(params,
    function cbCancelSpotRequests (err, data) {
      if (err) {
        internals.logger.warn(err, err.stack) // an error occurred
      } else {
        data.CancelledSpotInstanceRequests.forEach(function (entry) {
          internals.logger.info(entry)
        })
      }
    })
}

/**
* @description Manage AWS EC2 Spot instances
*/
module.exports = {
  SpotSpec: SpotSpec,
  Const: Const,
  Intern: Intern
}
