<a name="AwsSpotter"></a>
## AwsSpotter

* [AwsSpotter](#AwsSpotter)
  * [new AwsSpotter(construct, boolean)](#new_AwsSpotter_new)
  * [.spotPrices(attributes)](#AwsSpotter+spotPrices)
  * [.spotLaunch(attributes)](#AwsSpotter+spotLaunch)
  * [.spotsDescribe(attributes)](#AwsSpotter+spotsDescribe)
  * [.instancesDescribe(attributes)](#AwsSpotter+instancesDescribe)
  * [.terminateInstances()](#AwsSpotter+terminateInstances)
  * [.cancelSpotRequest()](#AwsSpotter+cancelSpotRequest)
  * ["initialized" (err, [data])](#AwsSpotter+event_initialized)
  * ["priced" (err, [priceData])](#AwsSpotter+event_priced)
  * ["launched" (err, [launchData])](#AwsSpotter+event_launched)
  * ["instances" (err, [spotInstanceRequests])](#AwsSpotter+event_instances)
  * ["instances" (err, [instanceReservations])](#AwsSpotter+event_instances)

<a name="new_AwsSpotter_new"></a>
### new AwsSpotter(construct, boolean)
Constructs a new AwsSpotter Library

**Throws**:

- <code>error</code> 


| Param | Type | Description |
| --- | --- | --- |
| construct | <code>object</code> | The AWS service IAM credentials - See [aws docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html) |
| construct.keys | <code>object</code> | AWS credentials |
| construct.keys.accessKeyId | <code>string</code> | AWS access key ID |
| construct.keys.secretAccessKey | <code>string</code> | AWS secret access key. |
| construct.keys.region | <code>string</code> | The EC2 region to send service requests |
| construct.upgrade | <code>object</code> | Temporary Session Token credentials - See [aws docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#getSessionToken-property) |
| construct.upgrade.serialNumber | <code>string</code> | Identifies the user's hardware or virtual MFA device. |
| construct.upgrade.tokenCode | <code>string</code> | Time-based one-time password (TOTP) that the MFA devices produces |
| boolean |  | isLogging |

<a name="AwsSpotter+spotPrices"></a>
### awsSpotter.spotPrices(attributes)
spotPrices - Request the latest spot prices

**Kind**: instance method of <code>[AwsSpotter](#AwsSpotter)</code>  
**Emits**: <code>[priced](#AwsSpotter+event_priced)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| attributes | <code>object</code> |  | JSON attributes to request current price |
| attributes.type | <code>string</code> |  | The instance type to be priced e.g. m3.medium |
| [attributes.product] | <code>string</code> | <code>&quot;Linux/UNIX&quot;</code> | e.g. 'Windows' |
| [attributes.dryRun] | <code>boolean</code> | <code>true</code> | Only verify parameters. |
| [attributes.isLogging] | <code>boolean</code> | <code>false</code> |  |

<a name="AwsSpotter+spotLaunch"></a>
### awsSpotter.spotLaunch(attributes)
Launch a spot instance

**Kind**: instance method of <code>[AwsSpotter](#AwsSpotter)</code>  
**Throws**:

- <code>error</code> 

**Emits**: <code>[launched](#AwsSpotter+event_launched)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| attributes | <code>object</code> |  | JSON attributes to request a spot instance |
| attributes.ami | <code>string</code> |  | The amazon machine image name |
| attributes.type | <code>string</code> |  | The amazon Instance Type e.g. m3.medium |
| attributes.price | <code>string</code> |  | The maximum price limit |
| attributes.keyName | <code>string</code> |  | The name of the key pair needed to access the launched instance. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html) |
| [attributes.dryRun] | <code>boolean</code> | <code>true</code> | Only verify launch parameters. if TRUE, do not launch an instance |
| [attributes.count] | <code>number</code> | <code>1</code> | The InstanceCount number to launch |
| [attributes.securityGroupIds] | <code>Array.&lt;string&gt;</code> |  | Array of one or more security group ids. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html) |
| [attributes.securityGroups] | <code>Array.&lt;string&gt;</code> |  | Array of one or more security group names. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html) |
| [attributes.userData] | <code>string</code> |  | cloud-init *base64-encoded* text. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html#user-data-cloud-init) |
| attributes.launchSpecification | <code>object</code> |  | JSON of any additional launch specification. See [api guide](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#requestSpotInstances-property) |

<a name="AwsSpotter+spotsDescribe"></a>
### awsSpotter.spotsDescribe(attributes)
spotsDescribe - Describe the status of all current spot requests See [aws docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeSpotInstanceRequests-property)

**Kind**: instance method of <code>[AwsSpotter](#AwsSpotter)</code>  
**Emits**: <code>[priced](#AwsSpotter+event_priced)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| attributes | <code>object</code> |  | JSON attributes to request current price |
| [attributes.dryRun] | <code>boolean</code> | <code>true</code> | Only verify parameters. |

<a name="AwsSpotter+instancesDescribe"></a>
### awsSpotter.instancesDescribe(attributes)
Describe the status of all running instance.

**Kind**: instance method of <code>[AwsSpotter](#AwsSpotter)</code>  
**Emits**: <code>{AwsSpotter#event:Reservations[]} Array of EC2 instances</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| attributes | <code>object</code> |  | JSON attributes to request current price |
| [attributes.dryRun] | <code>boolean</code> | <code>true</code> | Only verify parameters. |

<a name="AwsSpotter+terminateInstances"></a>
### awsSpotter.terminateInstances()
Terminate an instance

**Kind**: instance method of <code>[AwsSpotter](#AwsSpotter)</code>  
<a name="AwsSpotter+cancelSpotRequest"></a>
### awsSpotter.cancelSpotRequest()
Cancel a spot request

**Kind**: instance method of <code>[AwsSpotter](#AwsSpotter)</code>  
<a name="AwsSpotter+event_initialized"></a>
### "initialized" (err, [data])
Emitted as the response to constuct AwsSpotter

**Kind**: event emitted by <code>[AwsSpotter](#AwsSpotter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
| [data] | <code>object</code> | Null on error |

<a name="AwsSpotter+event_priced"></a>
### "priced" (err, [priceData])
Emitted as the response to a spotPrices request

**Kind**: event emitted by <code>[AwsSpotter](#AwsSpotter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
| [priceData] | <code>Array.&lt;AwsSpotter#SpotPriceHistory&gt;</code> | Null on error |

<a name="AwsSpotter+event_launched"></a>
### "launched" (err, [launchData])
Emitted as the response to a spotLaunch request

**Kind**: event emitted by <code>[AwsSpotter](#AwsSpotter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
| [launchData] | <code>object</code> | Null on error |

<a name="AwsSpotter+event_instances"></a>
### "instances" (err, [spotInstanceRequests])
Emitted as the response to a spotPrices request

**Kind**: event emitted by <code>[AwsSpotter](#AwsSpotter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
| [spotInstanceRequests] | <code>Array.&lt;AwsSpotter#SpotInstanceRequests&gt;</code> | Null on error |

<a name="AwsSpotter+event_instances"></a>
### "instances" (err, [instanceReservations])
Emitted as the response to a spotPrices request

**Kind**: event emitted by <code>[AwsSpotter](#AwsSpotter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
| [instanceReservations] | <code>Array.&lt;AwsSpotter#Reservations&gt;</code> | Null on error |


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

