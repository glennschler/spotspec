'use strict'
/*
* This is a cli or lab test harness for verifiying the SpotSpec launch method
*
*/
const SpotSpec = require('..').SpotSpec
const Const = require('..').Const
const Tools = require('./tools')

const Util = require('util')
const EventEmitter = require('events').EventEmitter

/**
 * Constructs a new Launch Test
 * @constructor
 */
function TestLaunch () {
  EventEmitter.call(this)
  this.spotter = null
  this.runAttribs = null
}
Util.inherits(TestLaunch, EventEmitter)

// initialize the AWS service
TestLaunch.prototype.initialze = function (construct, attributes) {
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

// make the launch request
TestLaunch.prototype.launch = function () {
  let spotter = this.spotter
  let runAttribs = this.runAttribs
  let self = this

  // first just check if there is userData file to be streamed in
  if (runAttribs.hasOwnProperty('fileUserData')) {
    let fs = require('fs')
    let fileName = runAttribs.fileUserData

    fileName = require('path').resolve(__dirname, fileName)

    // must send base64 to AWS
    fs.readFile(fileName, 'base64', function (err, userData) {
      if (err) {
        throw new Error(err)
      }

      delete runAttribs.fileUserData
      runAttribs.userData = userData
      self.runAttribs = runAttribs

      // recursivly call this method again with the new attributes
      self.launch()
    })

    return
  }

  // the event handler
  spotter.once(Const.EVENT_LAUNCHED, function onLaunch (err, data) {
    if (err) {
      console.log('Launched error:\n', err)
      self.emit(Const.EVENT_TESTED, err)
    } else {
      console.log('Launched event:\n', data)
    }

    // all done
    self.emit(Const.EVENT_LAUNCHED, err, data)
  })

  // make the ec2 request
  internals.launch.call(this)
}

const internals = {}

// The launch request
internals.launch = function () {
  let runAttribs = this.runAttribs

  let keyName = runAttribs.keyName
  let isDryRun = runAttribs.dryRun
  var options = {
    securityGroups: runAttribs.securityGroups, // firewall specs "Names" defined in your EC2
    keyName: keyName,                         // keyName to pair when using SSH
    dryRun: isDryRun,
    ami: runAttribs.ami,    // Amazon Linux VM HVM SSD image name
    type: runAttribs.type,
    price: runAttribs.price
  }

  if (runAttribs.hasOwnProperty('userData')) {
    options.userData = runAttribs.userData
  }

  var specs = {}

  // make the ec2 request
  this.spotter.launch(options, specs)
}

// show some cmd line help
const logHelp = function (error) {
  // Expected (or optional) cmd line run attributes
  let attributes = {
    type: '',
    price: '',
    keyName: '',
    ami: '',
    securityGroups: [],
    dryRun: '',
    isLogging: ''
  }

  Tools.logHelp(error, attributes)
}

// The outter wrapper. Handle when using LAB or CLI
const launchTest = function (labCb) {
  let theTest = new TestLaunch()

  const terminate = function (err, data) {
    if (theTest) {
      theTest.removeAllListeners()
      theTest = null
    }

    if (labCb) {
      labCb(err, data)
    }
  }

  // wait for initialized, then launch
  theTest.on(Const.EVENT_INITIALIZED, function (err, initData) {
    if (err) {
      terminate(err)
    } else {
      // now make the launch request
      theTest.launch.call(this)
    }
  })

  // wait for launch, then exit
  theTest.on(Const.EVENT_LAUNCHED, function (err, data) {
    if (err) {
      terminate(err)
    } else {
      terminate(err, data)
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
    launchTest(function (err, resultsData) {
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
  launchTest()
}
