/**
* @private
* @namespace {object} Internal
*/
function Internal () {}

/**
* Show some cmd line help
* @private
* @function Internal#logHelp
*
*/
Internal.logHelp = function (error, attributes) {
  var msg = (typeof error === 'undefined' ? '' : 'Error: ' + error + '\n')

  // Expected (or optional) cmd line credentials
  var construct = {
    keys: {
      accessKeyId: '',
      secretAccessKey: '',
      region: ''
    },
    upgrade: {
      serialNumber: '',
      tokenCode: ''
    }
  }

  // show help for the expected input
  console.log(msg + 'Expect JSON: {\n\t"credentials":', JSON.stringify(construct) + ',\n\t',
                '"attributes": ' + JSON.stringify(attributes) + '\n\t}')
}

// check for proper number of cmd line objects
Internal.parseArgs = function (cb) {
  var opts = ''
  var construct = {}
  var attributes = {}
  var argvL = process.argv.length

  // check for proper number of cmd line objects
  if (argvL >= 3) {
    var substr
    for (var index = 2; index < argvL; ++index) {
      substr = process.argv[index]
      if (typeof substr !== 'string') break
      opts += substr
    }

    // IF cmd line options are formatted well
    if (typeof opts === 'string') {
      try {
        opts = JSON.parse(opts)
      } catch (err) {
        return cb(err)
      }

      construct = opts.construct
      attributes = opts.attributes
    }
  }

  var error = null

  // cmd options must have two json objects
  if (typeof construct !== 'undefined' &&
      typeof construct.keys !== 'undefined' &&
      typeof attributes !== 'undefined') {

    try {
      return cb(null, construct, attributes)
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
module.exports = Internal
