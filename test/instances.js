'use strict'
/*
* This is a cli or lab test harness for verifiying the SpotSpec Instances method
*
*/
const SpotSpec = require('..').SpotSpec
const Const = require('..').Const
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
    self.emit(Const.EVENT_INITIALIZED, err, initData)
  })
}

// make the Instances request
TestInstances.prototype.instances = function () {
  let spotter = this.spotter
  let self = this

  // the event handler
  spotter.once(Const.EVENT_INSTANCES, function onInstancess (err, instancesReservations) {
    if (err) {
      console.log('Instancess error:\n', err)
      self.emit(Const.EVENT_INSTANCES, err)
    } else {
      let parsedJson = Tools.parseReservations(instancesReservations)
      console.log('Instances event:\n', parsedJson)
    }

    // all done
    self.emit(Const.EVENT_INSTANCES, err, instancesReservations)
  })

  let runAttribs = this.runAttribs
  let options = Object.assign({}, runAttribs)

  // make the ec2 request
  spotter.describeInstances(options)
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

  const terminate = function (err, data) {
    if (theTest) {
      theTest.removeAllListeners()
      theTest = null
    }

    if (labCb) {
      labCb(err, data)
    }
  }

  // wait for initialized, then Instances
  theTest.on(Const.EVENT_INITIALIZED, function (err, initData) {
    if (err) {
      terminate(err)
    } else {
      // now make the Instances request
      theTest.instances()
    }
  })

  // wait for Instances, then exit
  theTest.on(Const.EVENT_INSTANCES, function (err, InstancessData) {
    if (err) {
      terminate(err)
    } else {
      terminate(err, InstancessData)
    }
  })

  // check for proper number of cmd line objects
  // parse the logs and run the test
  Tools.parseArgs(nameOfTest, function (err, construct, attributes) {
    if (err) {
      logHelp(err)
      terminate(err)
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
