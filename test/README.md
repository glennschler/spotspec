To run tests, edit the config.json files for each test, or set ENV vars, or use CLI command line options
* test/price.config.json
* test/launch.config.json
* test/instances.config.json
* test/spots.config.json
* test/spots.terminate.json
* test/spots.cancel.json

To set ENV vars:
```
# The IAM credentials
export awsAccessKeyId=<secret>
export awsSecretAccessKey=<secret>

# The arn of the MFA key which was setup in IAM e.g. arn:aws:iam::99999999999:mfa/testingMFA
export awsSerialNumber=<secret>

# The token code shown on your device at this minute
export awsTokenCode=<secret>
```

Run the tests as hapijs/lab tests. Works with any combination of *.config.json file, or env vars. Does not accept command line arguments.

```
# With NPM
npm test

# Timeout if not returned within 8 seconds
lab -m 8000 test/price.js
lab -m 8000 test/launch.js
lab -m 8000 test/instances.js
lab -m 8000 test/spots.js
lab -m 8000 test/cancel.js
lab -m 8000 test/terminate.js
```

Run as CLI without test framework. Works with any combination of *.config.json file, env vars, or command line args.

```
node test/price.js --awsTokenCode=<secret> --awsAccessKeyId=<secret>
node test/launch.js --awsTokenCode=<secret> --awsSecretAccessKey=<secret>
node test/instances.js --awsTokenCode=<secret>
```
