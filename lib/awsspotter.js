const AWS = require('aws-sdk')
const Util = require('util')
const AwsSvc = require('./service')
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
* Constructs a new AwsSpotter Library
* @constructor
* @arg {AwsSvc#constructOpts} construct - The AWS serice IAM credentials
* @arg {boolean} [isLogging] - Use internal logging
* @throws {error}
* @emits {AwsSpotter#initialized}
*/
function AwsSpotter (constructOps, isLogging) {
  if (this.constructor.name === 'Object') {
    throw new Error('Object must be instantiated using new')
  }
  var self = this

  // Have the superclass constuct as an EC2 service
  AwsSvc.call(this, AWS.EC2, constructOps, isLogging)
  internals.initLogger(isLogging)

  internals.logger.info('Loading EC2 for: ' + constructOps.keys.region)

  this.on(Const.EVENT_COMPLETE, function onComplete (err, data) {
    /**
    * Emitted as the response to constuct AwsSpotter
    * @event AwsSpotter#initialized
    * @param {?error} err - Only on error
    * @param {object} [state] - Null on error
    */
    Intern.emitNextTick.call(self, Const.EVENT_INITIALIZED, err, data)
  })
}
Util.inherits(AwsSpotter, AwsSvc)

/**
* @typedef {object} AwsSpotter#SpotPriceHistory
* @property {string} InstanceType
* @property {string} ProductDescription
* @property {string} SpotPrice
* @property {date} Timestamp
* @property {string} AvailabilityZone
*/

/**
* @typedef {object} AwsSpotter#PriceOptions
* @property {string} type - The instance type to be priced e.g. m3.medium
* @property {string} [product=Linux/UNIX] - e.g. 'Windows'
* @property {boolean} [dryRun=true] - Only verify parameters.
*/

/**
* spotPrices - Request the latest spot prices
* @arg {AwsSpotter#PriceOptions}
* @emits AwsSpotter#priced
*/
AwsSpotter.prototype.spotPrices = function (options) {
  var self = this
  var now = new Date()
  var future = new Date(now)

  // Add one day into the future to retrieve the current spot price
  future.setDate(future.getDate() + 1)

  var instanceTypes = [options.type]  // the vm type e.g. t1.micro
  var params = {
    DryRun: Intern.isTrueOrUndefined(options.dryRun),
    InstanceTypes: instanceTypes,
    ProductDescriptions: [options.product || 'Linux/UNIX'],
    EndTime: future,
    StartTime: now
  }

  var ec2Service = this._services.ec2
  internals.logger.info('Request Prices:', ec2Service.config.region, params)

  // Make the request to get the latest spot prices
  var req = ec2Service.describeSpotPriceHistory(params)

  req.on('error', function onError (err) {
    internals.logger.error('Prices Error:\n', err)
    Intern.emitNextTick.call(self, 'prices', err)
  })

  req.on('success', function onSuccess (resp) {
    var data = resp.data
    if (data.NextToken !== '') {
      // Not relevant when using the Instance Type filter
    }

    var spotPrices = data.SpotPriceHistory
    internals.logger.debug('Prices:\n', spotPrices)

    /**
    * Emitted as the response to a spotPrices request
    * @event AwsSpotter#priced
    * @param {?error} err - Only on error
    * @param {AwsSpotter#SpotPriceHistory[]} [priceData] - Null on error
    */
    Intern.emitNextTick.call(self, 'priced', null, spotPrices)
  })

  req.send()
}

/**
* The following properties are nessesary or highly recommended.
* @typedef {object} AwsSpotter#SpotOptions
* @property {string} ami - The amazon machine image name
* @property {string} type - The amazon Instance Type e.g. m3.medium
* @property {string} price - The maximaum price limit
* @property {string} keyName - The name of the key pair needed to access the launched instance. See [user guide]{@link http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html}
* @property {boolean} [dryRun=true] - Only verify launch parameters. if TRUE, do not launch an instance
* @property {number} [count=1] - The InstanceCount number to launch
* @property {string[]} [securityGroupIds] - Array of one or more security group ids. See [user guide]{@link http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html}
* @property {string[]} [securityGroups] - Array of one or more security group names. See [user guide]{@link http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html}
* @property {string} [userData] - cloud-init text. See [user guide]{@link http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html#user-data-cloud-init}
*/

/**
* Additional control properties defined in the LaunchSpecification property
* of requestSpotInstances params [aws doc]{@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#requestSpotInstances-property}
* @typedef {object} AwsSpotter#LaunchSpecification
*/

/**
* Launch a spot instance
* @arg {AwsSpotter#SpotOptions} options - Mandatory or suggested parameters
* @arg {AwsSpotter#LaunchSpecification} [launchSpec] - Additional LaunchSpecification properties
* @throws {error}
* @emits AwsSpotter#launched
*/
AwsSpotter.prototype.spotLaunch = function spotLaunch (options, launchSpec) {
  var self = this
  if (typeof options === 'undefined') {
    throw new Error('Missing required launch options')
  }

  // Nessesary to launch a new instance
  var launchSpecification = {
    ImageId: options.ami,
    KeyName: options.keyName,
    InstanceType: options.type
  }

  // These are suggested as important though still optional
  var optionalProps = {
    SecurityGroupIds: options.securityGroupIds,
    SecurityGroups: options.securityGroups,
    UserData: options.userData
  }

  // Add the suggested optional ones next, ignoring the undefined
  Intern.addOptions(launchSpecification, optionalProps)
  Intern.addOptions(launchSpecification, launchSpec) // add the rest last

  // These are the aws request options, including the LaunchSpecification opts
  var params = {
    DryRun: Intern.isTrueOrUndefined(options.dryRun),
    SpotPrice: options.price,
    InstanceCount: options.count || 1,
    LaunchSpecification: launchSpecification
  }

  // Make the spot launch request
  var ec2Service = this._services.ec2
  var req = ec2Service.requestSpotInstances(params)

  req.on('error', function onError (err) {
    internals.logger.error('error: ', err)
    Intern.emitNextTick.call(self, Const.EVENT_LAUNCHED, null, err)
  })

  req.on('success', function onSuccess (resp) {
    internals.logger.debug('launched: ', resp.data)

    /**
    * Emitted as the response to a spotLaunch request
    * @event AwsSpotter#launched
    * @param {?error} err - Only on error
    * @param {object} [launchData] - Null on error
    */
    Intern.emitNextTick.call(self, Const.EVENT_LAUNCHED, resp.data)
  })

  req.send()
}

/**
* Describe the status of all current spot requests
*/
AwsSpotter.prototype.spotDescribe = function spotDescribe () {
  var params = {
    DryRun: false
  // ,InstanceIds : ['i-xxxxx']
  }

  var ec2Service = this._services.ec2

  // Make the request to get the latest spot request details
  ec2Service.describeSpotInstanceRequests(params,
    function cbDescribeSpotRequests (err, data) {
      if (err) {
        internals.logger.error(err, err.stack) // an error occurred
      } else if (data.hasOwnProperty('SpotInstanceRequests')) {
        // internals.logger.info(spotRespToString(data))
      }
    })
}

/**
* Describe the status of all instances
*/
AwsSpotter.prototype.instancesDescribe = function instancesDescribe () {
  var params = { DryRun: false }
  var ec2Service = this._services.ec2

  // make the request to descibe all instances
  ec2Service.describeInstances(params,
    function cbDescribeInstances (err, data) {
      if (err) {
        internals.logger.error(err, err.stack) // an error occurred
      } else if (data.hasOwnProperty('Reservations')) {
        for (var key in data.Reservations) {
          var instances = data.Reservations[key].Instances
          internals.logger.info(instances)
          // logReservation(instances)
        }
      }
    })
}

/**
* Terminate an instance
*/
AwsSpotter.prototype.terminateInstances = function terminateInstances (inId) {
  var instanceIds = [inId]
  var ec2Service = this._services.ec2
  var params = {
    DryRun: false,
    InstanceIds: instanceIds
  }

  // request an instance termination
  ec2Service.terminateInstances(params,
    function cbTerminstateInstances (err, data) {
      if (err) {
        internals.logger.error(err, err.stack) // an error occurred
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
AwsSpotter.prototype.cancelSpotRequest = function cancelSpotRequest (reqId) {
  var spotRequestIds = [reqId]
  var ec2Service = this._services.ec2
  var params = {
    DryRun: false,
    SpotInstanceRequestIds: spotRequestIds
  }

  // request the cancelation
  ec2Service.cancelSpotInstanceRequests(params,
    function cbCancelSpotRequests (err, data) {
      if (err) {
        internals.logger.error(err, err.stack) // an error occurred
      } else {
        data.CancelledSpotInstanceRequests.forEach(function (entry) {
          internals.logger.info(entry)
        })
      }
    })
}

/**
* @module AwsSpotter
* @description Manage AWS EC2 Spot instances
*/
module.exports = AwsSpotter