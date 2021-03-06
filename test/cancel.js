'use strict'
/*
* This is a cli or lab test harness for verifiying the SpotSpec Instances method
*/
const SpotSpec = require('..').SpotSpec
const Const = require('..').Const
const Intern = require('..').Intern
const Tools = require('./tools')

const Util = require('util')
const EventEmitter = require('events').EventEmitter

/**
 * Constructs a new Instances Test
 * @constructor
 */
function TestInstances () {
  EventEmitter.call(this)
  this.spotter = null
  this.runAttribs = null
}
Util.inherits(TestInstances, EventEmitter)

// initialize the AWS service
TestInstances.prototype.initialize = function (options, attributes) {
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

// make the cancel request
TestInstances.prototype.cancel = function () {
  let spotter = this.spotter
  let self = this

  // the event handler
  spotter.once(Const.EVENT_CANCELED, function oncancels (err, cancelledRequests) {
    if (err) {
      console.log('cancels error:\n', err)
    } else {
      console.log('cancel event:\n', cancelledRequests)
    }

    // all done
    Intern.emitAsync.call(self, Const.EVENT_CANCELED, err, cancelledRequests)
  })

  let runAttribs = this.runAttribs
  let options = Object.assign({}, runAttribs)

  // make the ec2 request
  spotter.cancelSpotRequest(options)
}

// show some cmd line help
const logHelp = function (error) {
  // Expected (or optional) cmd line run attributes
  let attributes = {
    dryRun: ''
  }

  Tools.logHelp(error, attributes)
}

// The outter wrapper. Handle when using LAB or CLI
const InstancesTest = function (labCb) {
  let theTest = new TestInstances()

  const destroy = function (err, data) {
    if (theTest) {
      theTest.removeAllListeners()
      theTest = null
    }

    if (labCb) {
      labCb(err, data)
    }
  }

  // wait for initialized, then below canceled event
  theTest.once(Const.EVENT_INITIALIZED, function (err, initData) {
    if (err) {
      destroy(err)
    } else {
      // now make the cancel request
      theTest.cancel()
    }
  })

  // wait for Cancel data, then exit
  theTest.once(Const.EVENT_CANCELED, function (err, InstancessData) {
    if (err) {
      destroy(err)
    } else {
      destroy(err, InstancessData)
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
    InstancesTest(function (err, resultsData) {
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
  InstancesTest()
}
