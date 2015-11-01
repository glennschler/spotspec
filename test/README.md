To run tests, edit the config.json files for each test, or set ENV vars, or use CLI command line options
* test/launch.price.json
* test/launch.config.json
* test/launch.instances.json

To set ENV vars:
```
export awsAccessKeyId=
export awsSecretAccessKey=

# The arn of the MFA key thats was setup in IAM e.g. arn:aws:iam::99999999999:mfa/testingMFA
export awsSerialNumber=

# The token code shown at this minute
export awsTokenCode=
```

Run the tests as hapijs/lab tests. Works with any combination of *.config.json file, env vars

```
# Timeout if not returned within 8 seconds
lab -m 8000 test/price.js
lab -m 8000 test/launch.js
lab -m 8000 test/instances.js
```

Run as CLI without test framework. Works with any combination of *.config.json file, env vars, or command line args

```
node test/price.js --awsTokenCode= --awsAccessKeyId=
node test/launch.js --awsTokenCode= --awsSecretAccessKey=
node test/instances.js --awsTokenCode=
```
