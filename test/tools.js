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
  let construct = Object.assign({}, internals.templateOpts)
  let upgrade = { serialNumber: '', tokenCode: '' }

  Object.assign(construct.upgrade, upgrade)

  // show help for the expected input
  console.log(msg + 'Expect JSON: {\n\t"credentials":',
                JSON.stringify(construct) + ',\n\t',
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

/**
* @module Internal
* @description Helper for tests
*/
module.exports = Tools
