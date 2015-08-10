/*
* This is an cli test harness for verifiying the AwsSpotter
*
*/
var AwsSpotter = require('../');

var logHelp = function (err) {
  var err = (typeof err === 'undefined' ? '' : err);
  console.log(err, 'Expected {\n\t"accessKeyId": "",\n\t"secretAccessKey": "",\n\t"region": "",\n\t' +
              '"type": "",\n\t"product": "",\n\t"dryRun": "",\n\t"isLogging": "" }');
}

if (process.argv.length < 3) {
  logHelp();
  process.exit();
}

var opts = process.argv[2]; // JSON

try {
  if (typeof opts === 'string') opts = JSON.parse(opts);
}
catch (err) {
  logHelp(err);
  process.exit();
}

var awsCredentials = {
  accessKeyId: opts.accessKeyId, // IAM user credentials
  secretAccessKey: opts.secretAccessKey, // IAM user credentials
  region: opts.region
};

var isLogging = opts.isLogging;
var spotter = new AwsSpotter(awsCredentials, isLogging);

var priceOpts = {
  type: opts.type || 'm3.medium',
  product: opts.product || 'Linux/UNIX',
  dryRun: opts.dryRun
};

spotter.spotPrices(priceOpts);

// the event handler
spotter.once ('prices', function (pricesData, err) {
  if (pricesData === null) {
    console.log('price err:\n', err);
  }
  else {
    console.log('prices event fired:\n', pricesData);
  }
});
