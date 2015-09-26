/*
* This is an cli test harness for verifiying the AwsSpotter launchSpot method
*
*/
var AwsSpotter = require('../lib/awsspotter').AwsSpotter
const Const = require('../lib/awsspotter').Const
const Internal = require('./internal')

// initialize the AWS service
var test = function (construct, attributes) {

  // first just check if there is userData file to be streamed in
  if (attributes.hasOwnProperty('fileUserData')) {
    var fs = require('fs')
    var fileName = attributes.fileUserData

    fileName = require('path').resolve(__dirname, fileName)

    // must send base64 to AWS
    fs.readFile(fileName, 'base64', function (err, userData) {
      if (err) {
        throw new Error(err)
      }

      delete attributes.fnUserData
      attributes.userData = userData
      newSpotter(construct, attributes)
    })
  } else {
    newSpotter(construct, attributes)
  }
}

// Instantiate the AwsSpotter and launch a spot instance
var newSpotter = function newSpotter (construct, attributes) {
  var spotter = new AwsSpotter(construct, attributes.isLogging)

  // the event handler
  spotter.once(Const.EVENT_INITIALIZED, function (err, initData) {
    if (err) {
      console.log('Initialized error:\n', err)
    } else {
      console.log('Initialized event:\n', initData)

      // now make the launch request
      launch(attributes, spotter)
    }
  })
}

// The launch request
var launch = function (cmdOptions, spotter) {
  var keyName = cmdOptions.keyName || ''
  var type = cmdOptions.type || 'm3.medium'
  var price = cmdOptions.price
  var isDryRun = cmdOptions.dryRun
  var options = {
    securityGroups: cmdOptions.securityGroups || [], // firewall specs "Names" defined in your EC2
    keyName: keyName,                         // keyName to pair when using SSH
    dryRun: isDryRun,
    ami: cmdOptions.ami || 'ami-e3106686',    // Amazon Linux VM HVM SSD image name
    type: type,
    price: price
  }

  if (cmdOptions.hasOwnProperty('userData')) {
    options.userData = cmdOptions.userData
  }

  var specs = {}

  spotter.once(Const.EVENT_LAUNCHED, function (data, err) {
    if (err) {
      console.log('Launched err:\n', err)
    } else {
      console.log('Launched event:\n', data)
    }

    // all done
    spotter = null
  })

  // make the ec2 request
  spotter.spotLaunch(options, specs)
}

// show some cmd line help
var logHelp = function (error) {
  // Expected (or optional) cmd line run attributes
  var attributes = {
    type: '',
    price: '',
    keyName: '',
    ami: '',
    securityGroups: [],
    dryRun: '',
    isLogging: ''
  }

  Internal.logHelp(error, attributes)
}

// check for proper number of cmd line objects
// parse the logs and run the test
Internal.parseArgs(function cb (err, construct, attributes) {
  if (err) {
    logHelp(err)
  } else {
    test(construct, attributes)
  }
})
