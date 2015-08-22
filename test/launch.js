/*
* This is an cli test harness for verifiying the AwsSpotter launchSpot method
*
*/
var AwsSpotter = require('../lib/awsspotter')
const Const = require('../lib/intern').Const
const Internal = require('./internal.js')

// initialize the AWS service
var test = function (construct, attributes) {
  var spotter = new AwsSpotter(construct, attributes.isLogging)

  // the event handler
  spotter.once(Const.EVENT_INITIALIZED, function (err, initData) {
    if (err) {
      console.log('Initialized error:\n', err)
      spotter = null
    } else {
      console.log('Initialized event:\n', initData)

      // now make the launch request
      launch(attributes)
    }
  })

  // The launch request
  var launch = function (cmdOptions) {
    var keyName = cmdOptions.keyName || ''
    var type = cmdOptions.type || 'm3.medium'
    var price = cmdOptions.price
    var isDryRun = cmdOptions.dryRun
    var options = {
      securityGroups: cmdOptions.securityGroups || [], // ['Fibertel NQN vpn', 'Fibertel NQN ssh'],     // firewall specs "Names" defined in your EC2
      keyName: keyName,                         // keyName to pair when using SSH
      dryRun: isDryRun,
      ami: cmdOptions.ami || 'ami-1ecae776',      // Amazon Linux VM image
      type: type,
      price: price
      // userData:
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
