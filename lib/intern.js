 /**
 * @private
 * @namespace {object} Intern
 */
function Intern () {}

/**
* @private
* @function Intern#emitNextTick
*
* Emit event on the next tick
*/
Intern.emitNextTick = function (eventName, err, data) {
  if (this.constructor.name === 'Function') {
    throw new Error('Caller must be an emitter')
  }

  process.nextTick(function emitNextTick () {
    this.emit(eventName, err, data)
  }.bind(this))
}

/**
* Handle the string or undefined, default to true for 'undefined'
* @private
* @function Intern#isTrueOrUndefined
*/
Intern.isTrueOrUndefined = function (val) {
  return (typeof val === 'undefined') || ('' + val) === 'true'
}

/**
* Merge in new object properties, without overwriting the existing
* @private
* @function Intern#addOptions
*/
Intern.addOptions = function (existingObj, newProps) {
  for (var propName in newProps) {

    // AWS option properties always start with upper case
    var newPropName = propName.charAt(0).toUpperCase() + propName.substr(1)

    // never overwrite an existing property & never insert 'undefined'
    if (existingObj.hasOwnProperty(newPropName)) continue
    if (typeof newProps[propName] === 'undefined') continue

    existingObj[newPropName] = newProps[propName]
  }
}

/**
* Function to be assigned to an objects logger method
* @private
* @function Intern#fnInitLogger
*/
Intern.fnInitLogger = function (isLogging) {
  if (this.constructor.name === 'Function') {
    throw new Error('Missing object context')
  }

  var internals = this // the commonly used name of callers

  if (!internals.hasOwnProperty('logger')) {
    throw new Error('Missing property "logger" in current context')
  } else if (internals.logger !== null) {
    return          // must be null to initialize a new logger
  } else if (!isLogging) {
    // stub the logger out
    internals.logger = {}
    internals.logger.info = function () {}
    internals.logger.error = function () {}
    internals.logger.warn = function () {}
    return
  }

  var Winston = require('winston')

  var winstonTransport = new (Winston.transports.Console)({
    json: false,
    colorize: true
  })

  internals.logger = new (Winston.Logger)({
    transports: isLogging ? [winstonTransport] : []
  })
}

/**
* @typedef {namespace} Const
* @private
*/
var Const = {
  // Event names

  EVENT_CREDENTIAL: 'credential',
  EVENT_COMPLETE: 'complete',
  EVENT_INITIALIZED: 'initialized',
  EVENT_PRICED: 'priced',
  EVENT_LAUNCHED: 'launched',

  // Event states

  STATE_READY: 'ready',
  STATE_UPGRADED: 'upgraded'
}

/**
* @module Intern
* @description Helper for AwsSpotter
*/
module.exports = {
  Intern: Intern,
  Const: Const
}
