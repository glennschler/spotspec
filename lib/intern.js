'use strict'
 /**
 * @private
 * @namespace {object} Intern
 */
function Intern () {}

/**
* @private
* @function Intern#emitAsync
*
* Emit event after queing to the end of the event loop
*/
Intern.emitAsync = function (eventName, err, data) {
  if (this.constructor.name === 'Function') {
    throw new Error('Caller must be an emitter')
  }

  setImmediate(function emitNextTick () {
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
  for (let propName in newProps) {
    // AWS option properties always start with upper case
    let newPropName = propName.charAt(0).toUpperCase() + propName.substr(1)

    // never overwrite an existing property & never insert 'undefined'
    if (existingObj.hasOwnProperty(newPropName)) continue
    if (typeof newProps[propName] === 'undefined') continue

    existingObj[newPropName] = newProps[propName]
  }

  return existingObj
}

/**
* @typedef {namespace} Const
* @private
*/
const Const = {
  // Event names

  // To the callers
  EVENT_INITIALIZED: 'initialized',
  EVENT_PRICED: 'priced',
  EVENT_LAUNCHED: 'launched',
  EVENT_INSTANCES: 'instances',
  EVENT_SPOTS: 'spots',
  EVENT_TERMINATED: 'terminated',
  EVENT_CANCELED: 'canceled'
}

/**
* @description Helper for AwsSpotter
*/
module.exports = {
  Intern: Intern,
  Const: Const
}
