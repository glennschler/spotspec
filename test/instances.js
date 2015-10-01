/*
* This is an cli test harness for verifiying the AwsSpotter price method
*
*/
var AwsSpotter = require('../lib/awsspotter').AwsSpotter
const Const = require('../lib/awsspotter').Const
const Internal = require('./internal')

// initialize the AWS service
var test = function (construct, attributes) {
  var spotter = new AwsSpotter(construct, attributes.isLogging)

  // the event handler
  spotter.once(Const.EVENT_INITIALIZED, function onInitialize (err, initData) {
    if (err) {
      console.log('Initialized error:\n', err)
      spotter = null
    } else {
      console.log('Initialized event:\n', initData)

      // now make the instancesDescribe request
      instancesDescribe(attributes)
    }
  })

  // make the instancesDescribe request
  var instancesDescribe = function (cmdOptions) {
    var instancesOpts = {
      dryRun: cmdOptions.dryRun
    }

    // the event handler
    spotter.once(Const.EVENT_INSTANCES, function instancesDescribe (err, data) {
      if (err) {
        console.log('instancesDescribe error:\n', err)
      } else {
        console.log('instancesDescribe event:\n', data)
      }

      // all done
      spotter = null
    })

    // make the ec2 request
    spotter.instancesDescribe(instancesOpts)
  }
}

// show some cmd line help
var logHelp = function (error) {
  // Expected (or optional) cmd line run attributes
  var attributes = {
    isLogging: ''
  }

  Internal.logHelp(error, attributes)
}

// parse the logs and run the test
Internal.parseArgs(function cb (err, construct, attributes) {
  if (err) {
    logHelp(err)
  } else {
    test(construct, attributes)
  }
})
