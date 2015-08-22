/*
* This is an cli test harness for verifiying the AwsSpotter
*
*/
var AwsSpotter = require('../lib/awsspotter')
const Const = require('../lib/intern').Const

// initialize the AWS service
var initialize = function (construct, attributes) {
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
    var price = cmdOptions.price || '0.0071'
    var isDryRun = cmdOptions.dryRun
    var options = {
      securityGroups: ['From Comcast vpn', 'From Comcast ssh'],     // firewall specs "Names" defined in your EC2
      keyName: keyName,                         // keyName to pair when using SSH
      dryRun: isDryRun,
      ami: 'ami-1ecae776',                      // Amazon Linux VM image
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
var logHelp = function (err) {
  var error = (typeof err === 'undefined' ? '' : 'Error: ' + err + '\n')

  // Expected (or optional) cmd line credentials
  var credentials = {
    accessKeyId: '',
    secretAccessKey: '',
    region: '',
    serialNumber: '',
    tokenCode: ''
  }

  // Expected (or optional) cmd line run attributes
  var attributes = {
    type: '',
    price: '',
    keyName: '',
    dryRun: '',
    isLogging: ''
  }

  // show help for the expected input
  console.log(error + 'Expect JSON: {\n\t"credentials":', JSON.stringify(credentials) + ',\n\t',
                '"attributes": ' + JSON.stringify(attributes) + '\n\t}')
}

// check for proper number of cmd line objects
var opts = ''
var construct = {}
var attributes = {}
var argvL = process.argv.length

// check for proper number of cmd line objects
if (argvL >= 3) {
  var substr
  for (var index = 2; index < argvL; ++index) {
    substr = process.argv[index]
    if (typeof substr !== 'string') break
    opts += substr
  }

  // IF cmd line options are formatted well
  if (typeof opts === 'string') {
    opts = JSON.parse(opts)

    construct = opts.construct
    attributes = opts.attributes
  }
}

// cmd options must have two json objects
if (typeof construct !== 'undefined' &&
    typeof construct.keys !== 'undefined' &&
    typeof attributes !== 'undefined') {

  try {
    initialize(construct, attributes)
  } catch (err) {
    logHelp(err)
  }
} else {
  logHelp('Missing arguments')
}
