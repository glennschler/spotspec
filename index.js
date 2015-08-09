const AWS = require('aws-sdk');
const EventEmitter = require('events').EventEmitter;
const Util = require('util');

/**
* internals
* @private
*/
var internals = {};

internals.init = function (isLogging) {
  if (isLogging) {
    this.logger = console;
  }
};

// Wrapper around logger log
internals.log = function () {
  if (typeof this.logger === 'undefined') return; // exit if not logging
  this.logger.log(Util.format.apply(this, arguments));
}

// Wrapper around log info
internals.logInfo = function () {
  internals.log('info', Util.format.apply(this, arguments));
}

// Wrapper around log error
internals.logError = function () {
  internals.log('error', Util.format.apply(this, arguments));
}

/**
* @typedef {object} AwsSpotter#AWSCredentials - Selected properites described in [aws docs]{@link http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#constructor-property}
* @property {string} accessKeyId - The IAM users AWS access key ID
* @property {string} secretAccessKey - The IAM users AWS secret access key
* @property {string} region - The region to send service requests to
*/

/**
 * Constructs a new AwsSpotter Library
 * @constructor
 * @arg {AwsSpotter#AWSCredentials[]} awsCredentials - The ec2 IAM credentials for every region
 * @arg {boolean} isLogging - Use internal logging
 * @throws {error}
 */
function AwsSpotter (awsCredentials, isLogging) {
  internals.init(isLogging);
  EventEmitter.call(this);

  awsCredentials.sslEnabled = true;

  // Initialize the awsConfig
  try {
    AWS.config.update(awsCredentials);
  }
  catch (awsErr) {
    throw awsErr;
  }

  internals.logInfo('Loaded EC2 for: ' + awsCredentials.region);

  this.ec2 = new AWS.EC2();
}
Util.inherits(AwsSpotter, EventEmitter);

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
* @emits AwsSpotter#prices
*/
AwsSpotter.prototype.spotPrices = function (options) {
  var self = this;
  var now = new Date();
  var future = new Date(now);

  // Add one day into the future to retrieve the current spot price
  future.setDate(future.getDate() + 1);

  // Optional ProductDescription
  //if (typeof options.product === 'undefined') {
  //  options.product = 'Linux/UNIX';
  //}

  var instanceTypes = [options.type]; // the vm type e.g. t1.micro
  var params = {
    DryRun: (typeof options.dryRun === 'undefined'),
    InstanceTypes: instanceTypes,
    ProductDescriptions: [options.product || 'Linux/UNIX'],
    EndTime: future,
    StartTime: now
  };

  internals.logInfo('Request Prices:', this.ec2.config.region, params);

  // Make the request to get the latest spot prices
  var req = this.ec2.describeSpotPriceHistory(params);

  req.on('error', function(err) {
    /**
    * Emitted as the response to a spotPrices request
    * @event AwsSpotter#prices
    * @param {?AwsSpotter#SpotPriceHistory[]} priceData - Null on error
    * @param {error} [err] - Only on error
    */
    self.emit('prices', null, err);
  })
  .on('success', function(resp) {
    var data = resp.data;
    if (data.NextToken !== '') {
       // Not relevant when using the Instance Type filter
    };

    var spotPrices = data.SpotPriceHistory;
    internals.logInfo('Prices:\n', spotPrices);
    self.emit('prices', spotPrices);
  })
  .send();
};

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
  var self = this;
  if (typeof options === 'undefined') {
    throw new Error('Missing required launch options');
  }

  // Nessesary to launch a new instance
  var launchSpecification = {
    ImageId: options.ami,
    KeyName: options.keyName,
    InstanceType: options.type
  };

  // These are suggested as important though still optional
  var optionalProps = {
    SecurityGroupIds: options.securityGroupIds,
    SecurityGroups: options.securityGroups,
    UserData: options.userData
  }

  var addOptions = function (existingObj, newProps) {
    for (var propName in newProps) {

      // upper case the 1st character before adding it
      var newPropName = propName.charAt(0).toUpperCase() + propName.substr(1);

      // Never overwrite an existing property and never insert 'undefined'
      if (existingObj.hasOwnProperty(newPropName)) continue;
      if (typeof newProps[propName] === 'undefined') continue;

      existingObj[newPropName] = newProps[propName];
    }
  }

  addOptions(launchSpecification, optionalProps); // the imporant ones first
  addOptions(launchSpecification, launchSpec);  // add these last

  // These are the aws request options, including the LaunchSpecification opts
  var params = {
    DryRun: (typeof options.dryRun === 'undefined'),
    SpotPrice: options.price,
    InstanceCount: options.count || 1,
    LaunchSpecification: launchSpecification
  };

  // Make the spot launch request
  var req = self.ec2.requestSpotInstances(params);

  req.on('error', function(err) {
    internals.logError('error: ', err); // An error occurred
    self.emit('launched', null, err);
  })
  .on('success', function(resp) {
    internals.logInfo('launched: ', resp.data); // Successful response

    /**
    * Emitted as the response to a spotLaunch request
    * @event AwsSpotter#launched
    * @param {?object} launchData - Null on error
    * @param {error} [err] - Only on error
    */
    self.emit('launched', resp.data);
  })
  .send();
}

/**
* Describe the status of all current spot requests
*/
AwsSpotter.prototype.spotDescribe = function spotDescribe () {
  var params = {
    DryRun : false
    //,InstanceIds : ['i-xxxxx']
  };

  // Make the request to get the latest spot request details
  this.ec2.describeSpotInstanceRequests(params, function(err, data) {
    if (err) {
      internals.logError(err, err.stack); // an error occurred
    }
    else if (data.hasOwnProperty('SpotInstanceRequests')) {
      internals.logInfo(spotRespToString (data));
    }
  });
};

/**
* Describe the status of all instances
*/
AwsSpotter.prototype.instancesDescribe = function instancesDescribe ()
{
  var params = { DryRun : false };

  // make the request to descibe all instances
  this.ec2.describeInstances(params, function(err, data) {
    if (err) {
      internals.logError(err, err.stack); // an error occurred
    }
    else if (data.hasOwnProperty('Reservations')) {
      for (var key in data.Reservations) {
        var instances = data.Reservations[key].Instances;
        logReservation(instances);
      }
    }
  });
};

/**
* Terminate an instance
*/
AwsSpotter.prototype.terminateInstances = function terminateInstances (inId)
{
  var instanceIds = [ inId  ];

  var params = {
    DryRun: false,
    InstanceIds: instanceIds
  };

  // request an instance termination
  this.ec2.terminateInstances(params, function(err, data) {
    if (err) {
      internals.logError(err, err.stack); // an error occurred
    }
    else {
      data.TerminatingInstances.forEach(function(entry) {
        internals.logInfo(entry);
      });
    }
  });
};

/**
* Cancel a spot request
*/
AwsSpotter.prototype.cancelSpotRequest = function cancelSpotRequest (reqId)
{
  var spotRequestIds = [ reqId  ];

  var params = {
    DryRun: false,
    SpotInstanceRequestIds : spotRequestIds
  };

  // request the cancelation
  this.ec2.cancelSpotInstanceRequests(params, function(err, data) {
    if (err) {
      internals.logError(err, err.stack); // an error occurred
    }
    else {
      data.CancelledSpotInstanceRequests.forEach(function(entry) {
        internals.logInfo(entry);
      });
    }
  });
};

// --------------
/**
* @module AwsSpotter
* @description Manage AWS EC2 Spot instances
*/
module.exports = AwsSpotter;
