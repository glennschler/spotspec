/*
* This is an cli test harness for verifiying the AwsSpotter
*
*/
var AwsSpotter = require('../');

var logHelp = function () {
  console.log('Expected {\n\t"accessKeyId": "",\n\t"secretAccessKey": "",\n\t' +
              '"region": "",\n\t"type": "",\n\t"keyName": "",\n\t' +
              '"price":"",\n\t"dryRun": "",\n\t"isLogging": "" }');
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

var spotter = new AwsSpotter(awsCredentials, opts.isLogging);

var keyName = opts.keyName || '';
var type = opts.type || 'm3.medium';
var price = opts.price || '0.0071';
var isDryRun = opts.dryRun;
var options = {
  //securityGroupIds: [],   // firewall specs "IDs" defined in your EC2
  securityGroups: ['ISPCheckMyIpCidr vpn', 'ISPCheckMyIpCidr ssh'],     // firewall specs "Names" defined in your EC2
  keyName: keyName,                         // keyName to pair when using SSH
  dryRun: isDryRun,
  ami: 'ami-1ecae776',                      // Amazon Linux VM image
  type: type,
  price: price
  //userData:
};

var specs = {};

// the event handler
spotter.once ('launched', function (data, err) {
  if (data === null) {
    console.log('launch err:\n', err);
  }
  else {
    console.log('launched event fired:\n', data);
  }
});

spotter.spotLaunch(options, specs);
