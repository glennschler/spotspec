ERROR, Cannot find class.
<a name="AwsSvc"></a>
## *AwsSvc*

* *[AwsSvc](#AwsSvc)*
  * *[new AwsSvc(requestedSvc, construct, [isLogging])](#new_AwsSvc_new)*
  * *["complete" (err, [state])](#AwsSvc+event_complete)*

<a name="new_AwsSvc_new"></a>
### *new AwsSvc(requestedSvc, construct, [isLogging])*
Constructs a new AwsSvc object for managing aws credentials

**Throws**:

- <code>error</code> 


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| requestedSvc | <code>class</code> |  | The AWS.Service class to instantiate [aws docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Service.html) |
| construct | <code>object</code> |  | The AWS service IAM credentials |
| construct.keys | <code>object</code> |  | Credentials for the service API authentication. See [aws docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html) |
| construct.keys.accessKeyId | <code>string</code> |  | AWS access key ID |
| construct.keys.secretAccessKey | <code>string</code> |  | AWS secret access key |
| construct.keys.region | <code>string</code> |  | The EC2 region to send service requests |
| construct.upgrade | <code>object</code> |  | Temporary Session Token credentials. See [aws docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#getSessionToken-property) |
| construct.upgrade.serialNumber | <code>string</code> |  | Identifies the user's hardware or virtual MFA device |
| construct.upgrade.tokenCode | <code>string</code> |  | Time-based one-time password (TOTP) that the MFA devices produces |
| [construct.upgrade.durationSeconds] | <code>string</code> | <code>900</code> | The duration, in seconds, that the credentials should remain valid |
| [isLogging] | <code>boolean</code> |  | Use internal logging |

<a name="AwsSvc+event_complete"></a>
### *"complete" (err, [state])*
Emitted as the response to constuct AwsSvc

**Kind**: event emitted by <code>[AwsSvc](#AwsSvc)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
| [state] | <code>object</code> | Null on error |

