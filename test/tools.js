'use strict'

/**
* @private
* @namespace {object} Internal
*/
const ParseArgs = require('nconf')
const Path = require('path')

function Tools () {
  throw new Error('Tools()  must not be instantiated')
}

/**
* internals
* @private
*/
const internals = {
  templateOpts: {
    'construct': {
      'upgrade': {},
      'keys': {
        accessKeyId: '',
        secretAccessKey: '',
        region: ''
      }
    }, 'attributes': {}
  }
}

/**
* Show some cmd line help
* @function logHelp
*
*/
Tools.logHelp = function (error, attributes) {
  let msg = (typeof error === 'undefined' ? '' : 'Error: ' + error + '\n')

  // Expected (or optional) cmd line credentials
  let options = Object.assign({}, internals.templateOpts)
  let upgrade = { serialNumber: '', tokenCode: '' }

  Object.assign(options.construct.upgrade, upgrade)

  // show help for the expected input
  console.log(msg + 'Expect JSON: {\n\t"credentials":',
                JSON.stringify(options) + ',\n\t',
                '"attributes": ' + JSON.stringify(attributes) + '\n\t}')
}

/**
* Merge in new object properties, without overwriting the existing
* @function mergeOptions
*/
Tools.mergeOptions = function (existingObj, newProps) {
  for (let propName in newProps) {
    // never overwrite an existing property & never insert 'undefined'
    if (existingObj.hasOwnProperty(propName)) continue
    if (typeof newProps[propName] === 'undefined') continue

    existingObj[propName] = newProps[propName]
  }

  return existingObj
}

/**
* convertIfBool all json properties to boolean if possible
* @function mergeOptions
*/
Tools.convertIfBool = function (val) {
  let valType = typeof val
  if (valType === 'number') {
    val = String('000000' + val).slice(-6) // zero pad
  }

  if (valType === 'string') {
    let valLow = val.toLowerCase()
    if (valLow === 'true' || valLow === 'false') {
      val = (valLow === 'true')
    }
  } else if (valType === 'object') {
    for (let key in val) {
      val[key] = Tools.convertIfBool(val[key])
    }
  }

  return val
}

// check for proper number of cmd line objects
Tools.parseArgs = function (testName, cb) {
  let testFName = Path.basename(testName, '.js')
  let fnConfig = Path.join(__dirname, testFName + '.config.json')
  let parsedArgs = ParseArgs.argv().env().file(fnConfig)
  let argvOpts = Object.assign({}, internals.templateOpts)

  let getArgvOrEnv = function (argName) {
    let retArg = ''
    if (argName) {
      retArg = parsedArgs.get(argName) || parsedArgs.get('aws' + argName)
      retArg = Tools.convertIfBool(retArg)
    }
    return retArg
  }

  argvOpts.construct.upgrade = {
    tokenCode: getArgvOrEnv('TokenCode'),
    serialNumber: getArgvOrEnv('SerialNumber')
  }
  argvOpts.construct.keys = {
    accessKeyId: getArgvOrEnv('AccessKeyId'),
    secretAccessKey: getArgvOrEnv('SecretAccessKey')
  }

  let fnOpts = {
    construct: getArgvOrEnv('construct'),
    attributes: getArgvOrEnv('attributes')
  }

  if (!fnOpts) {
    Object.assign(fnOpts, internals.templateOpts)
  }

  this.mergeOptions(argvOpts.construct.keys, fnOpts.construct.keys)
  this.mergeOptions(argvOpts.construct.upgrade, fnOpts.construct.upgrade)
  this.mergeOptions(argvOpts.attributes, fnOpts.attributes)

  let error = null

  // cmd options must have two json objects
  if (typeof argvOpts !== 'undefined' &&
      typeof argvOpts.construct !== 'undefined' &&
      typeof argvOpts.attributes !== 'undefined') {
    try {
      return cb(null, argvOpts.construct, argvOpts.attributes)
    } catch (err) {
      error = err
    }
  }

  return cb(error || 'Missing arguments')
}

// parseReservations
Tools.parseReservations = function (obj) {
  let str = {}

  if (!obj.hasOwnProperty('Reservations')) {
    return str
  }

  let reservation
  let count = 0
  let reservations = {}
  while ((reservation = obj.Reservations.shift())) {
    reservation = Tools.parseInstances(reservation)
    reservations[('' + count++)] = reservation
  }

  return reservations
}

// parseInstances
Tools.parseInstances = function (obj) {
  if (!obj.hasOwnProperty('Instances')) {
    return {}
  }

  let instance
  let count = 0
  let instances = {}

  while ((instance = obj.Instances.shift())) {
    instance = Tools.parseInstance(instance)
    instances[('' + count++)] = JSON.stringify(instance)
  }

  let rc = {}
  rc[obj.ReservationId] = instances
  return rc
}

// parseInstance
Tools.parseInstance = function (obj) {
  if (!obj.hasOwnProperty('InstanceId')) {
    return {}
  }

  let instanceJson = {
    InstanceId: obj.InstanceId,
    ImageId: obj.ImageId,
    State: obj.State,
    PrivateDnsName: obj.PrivateDnsName,
    PublicDnsName: obj.PublicDnsName,
    InstanceType: obj.InstanceType,
    LaunchTime: obj.LaunchTime,
    InstanceLifecycle: obj.InstanceLifecycle
  }

  return instanceJson
}

/**
* @module Internal
* @description Helper for tests
*/
module.exports = Tools
