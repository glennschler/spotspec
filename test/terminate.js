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
function TestTerminate () {
  EventEmitter.call(this)
  this.spotter = null
  this.runAttribs = null
}
Util.inherits(TestTerminate, EventEmitter)

// initialize the AWS service
TestTerminate.prototype.initialize = function (options, attributes) {
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

// make the terminate request
TestTerminate.prototype.terminate = function (options) {
  let spotter = this.spotter
  let self = this

  // the event handler
  spotter.once(Const.EVENT_TERMINATED, function onTerminate (err, termInstances) {
    if (err) {
      console.log('Spots error:\n', err)
    } else {
      for (let key in termInstances) {
        let entry = termInstances[key]
        console.info('Terminated event: Instance[' + key + ']:', entry)
      }
    }

    // all done
    self.emit(Const.EVENT_TERMINATED, err, termInstances)
  })

  // make the ec2 request
  spotter.terminateInstances(this.runAttribs)
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
  let theTest = new TestTerminate()

  const destroy = function (err, data) {
    if (theTest) {
      theTest.removeAllListeners()
      theTest = null
    }

    if (labCb) {
      labCb(err, data)
    }
  }

  // wait for initialized, then Spots
  theTest.once(Const.EVENT_INITIALIZED, function (err, initData) {
    if (err) {
      destroy(err)
    } else {
      // now make the Spots request
      theTest.terminate()
    }
  })

  // wait for terminate, then exit
  theTest.once(Const.EVENT_TERMINATED, function (err, termData) {
    if (err) {
      destroy(err)
    } else {
      destroy(err, termData)
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
