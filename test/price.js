'use strict'
/*
* This is a cli or lab test harness for verifiying the SpotSpec price method
*/
const SpotSpec = require('..').SpotSpec
const Const = require('..').Const
const Intern = require('..').Intern
const Tools = require('./tools')

const Util = require('util')
const EventEmitter = require('events').EventEmitter

/**
 * Constructs a new Price Test
 * @constructor
 */
function TestPrice () {
  EventEmitter.call(this)
  this.spotter = null
  this.runAttribs = null
}
Util.inherits(TestPrice, EventEmitter)

// initialize the AWS service
TestPrice.prototype.initialize = function (options, attributes) {
  options.isLogging = attributes.isLogging || false
  delete attributes.isLogging
  this.spotter = new SpotSpec(options)

  this.runAttribs = attributes  // If Success initializing, use for later
  let spotter = this.spotter
  let self = this

  // the event handler
  spotter.once(Const.EVENT_INITIALIZED, function onInitialize (err, initData) {
    if (err) {
      console.log('Initialized error:\n', err)
    } else {
      console.log('Initialized event:\n', initData)
    }

    // done initializing
    Intern.emitAsync.call(self, Const.EVENT_INITIALIZED, err, initData)
  })
}

// make the price request
TestPrice.prototype.price = function () {
  let spotter = this.spotter
  let runAttribs = this.runAttribs
  let self = this

  // the event handler
  spotter.once(Const.EVENT_PRICED, function onPrices (err, pricesData) {
    if (err) {
      console.log('Prices error:\n', err)
    } else {
      console.log('Prices event:\n', pricesData)
    }

    // all done
    Intern.emitAsync.call(self, Const.EVENT_PRICED, err, pricesData)
  })

  let priceOpts = Object.assign({}, runAttribs)

  // make the ec2 request
  spotter.prices(priceOpts)
}

// show some cmd line help
const logHelp = function (error) {
  // Expected (or optional) cmd line run attributes
  let attributes = {
    type: '',
    product: '',
    dryRun: '',
    isLogging: ''
  }

  Tools.logHelp(error, attributes)
}

// The outter wrapper. Handle when using LAB or CLI
const priceTest = function (labCb) {
  let theTest = new TestPrice()

  const destroy = function (err, data) {
    if (theTest) {
      theTest.removeAllListeners()
      theTest = null
    }

    if (labCb) {
      labCb(err, data)
    }
  }

  // wait for initialized, then price
  theTest.once(Const.EVENT_INITIALIZED, function (err, initData) {
    if (err) {
      destroy(err)
    } else {
      // now make the price request
      theTest.price(theTest)
    }
  })

  // wait for price, then exit
  theTest.once(Const.EVENT_PRICED, function (err, pricesData) {
    if (err) {
      destroy(err)
    } else {
      destroy(err, pricesData)
    }
  })

  // check for proper number of cmd line objects
  // parse the logs and run the test
  Tools.parseArgs(nameOfTest, function (err, construct, attributes) {
    if (err) {
      logHelp(err)
      destroy(err)
    } else {
      theTest.initialize(construct, attributes)
    }
  })
}

/* ************************************************************************** */

/* check the command line process name that was used
* and consider if debugging was used
*/
const isLabTest = function () {
  let argv = process.argv

  if (argv[0].endsWith('lab')) {
    return true
  }

  if (argv.length > 0 && argv[1].endsWith('lab')) {
    return true
  }

  return false
}

const labTest = function (testName) {
  let Lab = require('lab')
  let Code = require('code')

  let lab = exports.lab = Lab.script()
  let expect = Code.expect

  // if running in lab testing, call via that module
  lab.test(testName, function (labCbDone) {
    priceTest(function (err, resultsData) {
      expect(err).to.be.null()
      labCbDone()
    })
  })
}

const nameOfTest = __filename.slice(__dirname.length + 1, -3)

/* Either a LAB test or plain old CLI test
*/
if (isLabTest()) {
  labTest(nameOfTest)
} else {
  // CLI. no callback and no event listening
  priceTest()
}
