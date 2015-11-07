'use strict'
/*
* This is a cli or lab test harness for verifiying the SpotSpec Spots method
*
*/
const SpotSpec = require('..').SpotSpec
const Const = require('..').Const
const Tools = require('./tools')

const Util = require('util')
const EventEmitter = require('events').EventEmitter

/**
 * Constructs a new Spots Test
 * @constructor
 */
function TestSpots () {
  EventEmitter.call(this)
  this.spotter = null
  this.runAttribs = null
}
Util.inherits(TestSpots, EventEmitter)

// initialize the AWS service
TestSpots.prototype.initialze = function (construct, attributes) {
  this.spotter = new SpotSpec(construct, attributes.isLogging)
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

// make the Spots request
TestSpots.prototype.spots = function () {
  let spotter = this.spotter
  let self = this

  // the event handler
  spotter.once(Const.EVENT_SPOTS, function onSpots (err, spotRequests) {
    if (err) {
      console.log('Spots error:\n', err)
      self.emit(Const.EVENT_TESTED, err)
    } else {
      for (let key in spotRequests) {
        let spot = spotRequests[key]
        let pretty = {
          InstanceId: spot.SpotInstanceRequestId,
          SpotPrice: spot.SpotPrice,
          ImageId: spot.LaunchSpecification.ImageId,
          State: spot.State,
          Status: spot.Status,
          CreateTime: spot.CreateTime,
          LaunchedAvailabilityZone: spot.LaunchedAvailabilityZone
        }
        console.info('Spots event: Instance[' + key + ']:', pretty)
      }
    }

    // all done
    self.emit(Const.EVENT_SPOTS, err, spotRequests)
  })

  let options = {
    DryRun: false
  }

  // make the ec2 request
  spotter.describeRequests(options)
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
const SpotsTest = function (labCb) {
  let theTest = new TestSpots()

  const terminate = function (err, data) {
    if (theTest) {
      theTest.removeAllListeners()
      theTest = null
    }

    if (labCb) {
      labCb(err, data)
    }
  }

  // wait for initialized, then Spots
  theTest.on(Const.EVENT_INITIALIZED, function (err, initData) {
    if (err) {
      terminate(err)
    } else {
      // now make the Spots request
      theTest.spots()
    }
  })

  // wait for Spots, then exit
  theTest.on(Const.EVENT_SPOTS, function (err, SpotsData) {
    if (err) {
      terminate(err)
    } else {
      terminate(err, SpotsData)
    }
  })

  // check for proper number of cmd line objects
  // parse the logs and run the test
  Tools.parseArgs(nameOfTest, function (err, construct, attributes) {
    if (err) {
      logHelp(err)
      terminate(err)
    } else {
      theTest.initialze(construct, attributes)
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
    SpotsTest(function (err, resultsData) {
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
  SpotsTest()
}
