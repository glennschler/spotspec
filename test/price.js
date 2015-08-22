/*
* This is an cli test harness for verifiying the AwsSpotter price method
*
*/
var AwsSpotter = require('../lib/awsspotter')
const Const = require('../lib/intern').Const
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
var logHelp = function (error) {
  // Expected (or optional) cmd line run attributes
  var attributes = {
    type: '',
    product: '',
    dryRun: '',
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
