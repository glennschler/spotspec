[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

## SpotSpec
Manage spot instances

### Best practices
Before using this module understand the standard best practices when working with AWS credentials. __Never__ use root account credentials. AWS documentation for creating a new IAM user with restrictions explains [best practices](http://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html).

##### Prepare AWS IAM Credentials
AWS credentials are required. AWS STS Session management, which is optional, generates a temporary session token to replace the given keys for all further transactions. This module is a convenient wrapper to the existing AWS-SDK, which itself is only an implementation of the [AWS HTTP API](http://docs.aws.amazon.com/AWSEC2/latest/APIReference/Welcome.html). No additional technique is attempted to better secure the AWS credentials than what is already provided by AWS.

##### Optional AWS SDK reading
To understand the API implemented in this module:
* How are credentials validated? Reference their [Credentials documentation](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html#accessKeyId-property)
* How are temporary session tokens created? Reference their [STS documentation](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#getSessionToken-property)

### API
Reference this modules [API documentation](./doc/index.md)

### Usage

#### Create an instance of SpotSpec for a specific region

```
'use strict'
const SpotSpec = require('spotspec').SpotSpec
const Const = require('spotspec').Const

// AWS Credentials
const awsKeys = {
  accessKeyId: '',
  secretAccessKey': '',
  region: 'us-west-1'
}

// Optional MFA device information
const stsUpgrade = {
  serialNumber: '',
  tokenCode: '',
  durationSeconds: 900
}

// place "keys" and "upgrade" in the options
const options = {
  keys: awsKeys,
  upgrade: stsUpgrade,
  isLogging: false
}

const isLogging = false
const spec = new SpotSpec(options)

// Wait until the initialized event is received
spec.once(Const.EVENT_INITIALIZED, function onInitialize (err, initData) {
  if (err) {
    console.log('Initialized error:\n', err)
  } else {
    console.log('Initialized event:\n', initData)
  }
})
```

#### Request current prices
```
// Example options to request current prices
const priceOptions = {
    'type': 'm3.medium',
    'dryRun': 'false',
    'product': 'Linux/UNIX'
  }

// Request the current prices
spec.prices(priceOptions)

// Wait until the priced event is received
spec.once(Const.EVENT_PRICED, function onPrices (err, pricesData) {
  if (err) {
    console.log('Prices error:\n', err)
  } else {
    console.log('Prices event:\n', pricesData)
  }
})
```

#### Query outstanding and completed spot requests
```
const options = {
  DryRun: false
}

// Request the spot requests
spec.describeRequests(options)

// Wait until the spots event is received
spotter.once(Const.EVENT_SPOTS, function onSpots (err, spotRequests) {
  if (err) {
    console.log('Spots error:\n', err)
  } else {
    for (let key in spotRequests) {
      let spot = spotRequests[key]
      console.info('Spots event: Instance[' + key + ']:', spot)
    }
  }
})
```

### Examples

The automated tests are also working examples. To understand how to execute reference the tests [README](./test/README.md)

### AWS IAM policy management

#### Example AWS IAM policy to price and launch with MFA authentication
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
          "Sid": "SpotManagement",
          "Action": [
            "ec2:DescribeSpotPriceHistory",
            "ec2:RequestSpotInstances",
            "ec2:DescribeSpotInstanceRequests",
            "ec2:DescribeInstances",
            "ec2:TerminateInstances",
            "ec2:CancelSpotRequest"
          ],
          "Effect": "Allow",
          "Resource": "*",
          "Condition": {
            "Bool": {
              "aws:SecureTransport": "true",
              "aws:MultiFactorAuthPresent": "true"
            },
            "StringEquals": {
              "ec2:Region": [
                "us-east-1",
                "us-west-1"
                "us-west-2"
              ]
            }
          }
        }
    ]
}
```

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
          "Sid": "StsSessionManagement",
          "Effect": "Allow",
          "Action": [
            "sts:GetSessionToken"
          ],
          "Resource": [
            "*"
          ]
        }
    ]
}
```
