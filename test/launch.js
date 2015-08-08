/*
* This is an cli test harness for verifiying the AwsSpotter
*
*/
var AwsSpotter = require('../');

if (process.argv.length < 5) {
  console.log('Expected [accessKeyId] [secretAccessKey] [region] [keyName] [type] [price] [isDryRun]');
  return;
}

var awsCredentials = {
  accessKeyId: process.argv[2], // IAM user credentials
  secretAccessKey: process.argv[3], // IAM user credentials
  region: process.argv[4]
};

var keyName = process.argv[5] || '';
var type = process.argv[6] || 'm3.medium';
var price = process.argv[7] || '0.0071';
var isDryRun = (typeof process.argv[8] === 'undefined') ?
                true : (process.argv[8] !== 'false');
var isLogging = true;

var spotter = new AwsSpotter(awsCredentials, isLogging);

var options = {
  securityGroupIds: ['From Verizon ssh'],   // firewall specs defined in your EC2
  securityGroups: ['From Verizon vpn'],     // firewall specs defined in your EC2
  keyName: keyName,                         // keyName to pair when using SSH
  dryRun: isDryRun,
  ami: 'ami-1ecae776',                      // Amazon Linux VM image
  type: type,
  price: price
  //userData:
};

var specs = {};

spotter.spotLaunch(options, specs);

spotter.on('launched', function (data, err) {
  if (data === null) {
    console.log('launch err:\n', err);
  }
  else {
    console.log('launched event fired:\n', data);
  }
  exit();
});

var exit = function () {
  spotter = null;
  setTimeout(function() {
    console.log('Exiting...');
    process.exit(0);
  }, 100);
};
