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
  spotter.once(Const.EVENT_INITIALIZED, function onInitialize (err, initData) {
    if (err) {
      console.log('Initialized error:\n', err)
      spotter = null
    } else {
      console.log('Initialized event:\n', initData)

      // now make the price request
      price(attributes)
    }
  })

  // make the price request
  var price = function (cmdOptions) {
    var priceOpts = {
      type: cmdOptions.type || 'm3.medium',
      product: cmdOptions.product || 'Linux/UNIX',
      dryRun: cmdOptions.dryRun
    }

    // the event handler
    spotter.once(Const.EVENT_PRICED, function onPrices (err, pricesData) {
      if (err) {
        console.log('Prices error:\n', err)
      } else {
        console.log('Prices event:\n', pricesData)
      }

      // all done
      spotter = null
    })

    // make the ec2 request
    spotter.spotPrices(priceOpts)
  }
}

// show some cmd line help
var logHelp = function (err) {
  var error = (typeof err === 'undefined' ? '' : 'Error: ' + err + '\n')

  // Expected (or optional) cmd line credentials
  var construct = {
    keys: {
      accessKeyId: '',
      secretAccessKey: '',
      region: ''
    },
    serialNumber: '',
    tokenCode: ''
  }

  // Expected (or optional) cmd line run attributes
  var attributes = {
    type: '',
    product: '',
    dryRun: '',
    isLogging: ''
  }

  // show help for the expected input
  console.log(error + 'Expect JSON: {\n\t"construct":', JSON.stringify(construct) + ',\n\t',
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
