<a name="AwsSpotter"></a>
## AwsSpotter

* [AwsSpotter](#AwsSpotter)
  * [new AwsSpotter(construct, [isLogging])](#new_AwsSpotter_new)
  * [.spotPrices(options)](#AwsSpotter+spotPrices)
  * [.spotLaunch(options, [launchSpec])](#AwsSpotter+spotLaunch)
  * [.spotDescribe()](#AwsSpotter+spotDescribe)
  * [.instancesDescribe()](#AwsSpotter+instancesDescribe)
  * [.terminateInstances()](#AwsSpotter+terminateInstances)
  * [.cancelSpotRequest()](#AwsSpotter+cancelSpotRequest)
  * ["initialized" (err, [data])](#AwsSpotter+event_initialized)
  * ["priced" (err, [priceData])](#AwsSpotter+event_priced)
  * ["launched" (err, [launchData])](#AwsSpotter+event_launched)
  * ["instances" (err, [instanceReservations])](#AwsSpotter+event_instances)
  * [.SpotPriceHistory](#AwsSpotter+SpotPriceHistory) : <code>object</code>
  * [.PriceOptions](#AwsSpotter+PriceOptions) : <code>object</code>
  * [.SpotOptions](#AwsSpotter+SpotOptions) : <code>object</code>
  * [.LaunchSpecification](#AwsSpotter+LaunchSpecification) : <code>object</code>

<a name="new_AwsSpotter_new"></a>
### new AwsSpotter(construct, [isLogging])
Constructs a new AwsSpotter Library

**Throws**:

- <code>error</code> 


| Param | Type | Description |
| --- | --- | --- |
| construct | <code>[constructOpts](#AwsSvc+constructOpts)</code> | The AWS service IAM credentials |
| [isLogging] | <code>boolean</code> | Use internal logging |

<a name="AwsSpotter+spotPrices"></a>
### awsSpotter.spotPrices(options)
spotPrices - Request the latest spot prices

**Kind**: instance method of <code>[AwsSpotter](#AwsSpotter)</code>  
**Emits**: <code>[priced](#AwsSpotter+event_priced)</code>  

| Param | Type |
| --- | --- |
| options | <code>[PriceOptions](#AwsSpotter+PriceOptions)</code> | 

<a name="AwsSpotter+spotLaunch"></a>
### awsSpotter.spotLaunch(options, [launchSpec])
Launch a spot instance

**Kind**: instance method of <code>[AwsSpotter](#AwsSpotter)</code>  
**Throws**:

- <code>error</code> 

**Emits**: <code>[launched](#AwsSpotter+event_launched)</code>  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>[SpotOptions](#AwsSpotter+SpotOptions)</code> | Mandatory or suggested parameters |
| [launchSpec] | <code>[LaunchSpecification](#AwsSpotter+LaunchSpecification)</code> | Additional LaunchSpecification properties |

<a name="AwsSpotter+spotDescribe"></a>
### awsSpotter.spotDescribe()
Describe the status of all current spot requests

**Kind**: instance method of <code>[AwsSpotter](#AwsSpotter)</code>  
<a name="AwsSpotter+instancesDescribe"></a>
### awsSpotter.instancesDescribe()
Describe the status of all running instance.

**Kind**: instance method of <code>[AwsSpotter](#AwsSpotter)</code>  
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
| [priceData] | <code>[Array.&lt;SpotPriceHistory&gt;](#AwsSpotter+SpotPriceHistory)</code> | Null on error |

<a name="AwsSpotter+event_launched"></a>
### "launched" (err, [launchData])
Emitted as the response to a spotLaunch request

**Kind**: event emitted by <code>[AwsSpotter](#AwsSpotter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
| [launchData] | <code>object</code> | Null on error |

<a name="AwsSpotter+event_instances"></a>
### "instances" (err, [instanceReservations])
Emitted as the response to a spotPrices request

**Kind**: event emitted by <code>[AwsSpotter](#AwsSpotter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
| [instanceReservations] | <code>Array.&lt;AwsSpotter#Reservations&gt;</code> | Null on error |

<a name="AwsSpotter+SpotPriceHistory"></a>
### awsSpotter.SpotPriceHistory : <code>object</code>
**Kind**: instance typedef of <code>[AwsSpotter](#AwsSpotter)</code>  
**Properties**

| Name | Type |
| --- | --- |
| InstanceType | <code>string</code> | 
| ProductDescription | <code>string</code> | 
| SpotPrice | <code>string</code> | 
| Timestamp | <code>date</code> | 
| AvailabilityZone | <code>string</code> | 

<a name="AwsSpotter+PriceOptions"></a>
### awsSpotter.PriceOptions : <code>object</code>
**Kind**: instance typedef of <code>[AwsSpotter](#AwsSpotter)</code>  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| type | <code>string</code> |  | The instance type to be priced e.g. m3.medium |
| product | <code>string</code> | <code>&quot;Linux/UNIX&quot;</code> | e.g. 'Windows' |
| dryRun | <code>boolean</code> | <code>true</code> | Only verify parameters. |

<a name="AwsSpotter+SpotOptions"></a>
### awsSpotter.SpotOptions : <code>object</code>
The following properties are nessesary or highly recommended.

**Kind**: instance typedef of <code>[AwsSpotter](#AwsSpotter)</code>  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| ami | <code>string</code> |  | The amazon machine image name |
| type | <code>string</code> |  | The amazon Instance Type e.g. m3.medium |
| price | <code>string</code> |  | The maximaum price limit |
| keyName | <code>string</code> |  | The name of the key pair needed to access the launched instance. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html) |
| dryRun | <code>boolean</code> | <code>true</code> | Only verify launch parameters. if TRUE, do not launch an instance |
| count | <code>number</code> | <code>1</code> | The InstanceCount number to launch |
| securityGroupIds | <code>Array.&lt;string&gt;</code> |  | Array of one or more security group ids. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html) |
| securityGroups | <code>Array.&lt;string&gt;</code> |  | Array of one or more security group names. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html) |
| userData | <code>string</code> |  | cloud-init *base64-encoded* text. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html#user-data-cloud-init) |

<a name="AwsSpotter+LaunchSpecification"></a>
### awsSpotter.LaunchSpecification : <code>object</code>
Additional control properties defined in the LaunchSpecification property
of requestSpotInstances params [aws doc](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#requestSpotInstances-property)

**Kind**: instance typedef of <code>[AwsSpotter](#AwsSpotter)</code>  

<a name="AwsSvc"></a>
## *AwsSvc*

* *[AwsSvc](#AwsSvc)*
  * *[new AwsSvc(requestedSvc, construct, [isLogging])](#new_AwsSvc_new)*
  * *["complete" (err, [state])](#AwsSvc+event_complete)*
  * *[.AWSCredentials](#AwsSvc+AWSCredentials) : <code>object</code>*
  * *[.AWSSessionToken](#AwsSvc+AWSSessionToken) : <code>object</code>*
  * *[.constructOpts](#AwsSvc+constructOpts) : <code>object</code>*

<a name="new_AwsSvc_new"></a>
### *new AwsSvc(requestedSvc, construct, [isLogging])*
Constructs a new AwsSvc object for managing aws credentials

**Throws**:

- <code>error</code> 


| Param | Type | Description |
| --- | --- | --- |
| requestedSvc | <code>class</code> | The AWS.Service class to instantiate [aws docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Service.html) |
| construct | <code>[constructOpts](#AwsSvc+constructOpts)</code> | The AWS serice IAM credentials |
| [isLogging] | <code>boolean</code> | Use internal logging |

<a name="AwsSvc+event_complete"></a>
### *"complete" (err, [state])*
Emitted as the response to constuct AwsSvc

**Kind**: event emitted by <code>[AwsSvc](#AwsSvc)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
| [state] | <code>object</code> | Null on error |

<a name="AwsSvc+AWSCredentials"></a>
### *awsSvc.AWSCredentials : <code>object</code>*
Subset of [aws docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html)

**Kind**: instance typedef of <code>[AwsSvc](#AwsSvc)</code>  
**Properties**

| Name | Type |
| --- | --- |
| accessKeyId | <code>string</code> | 
| secretAccessKey | <code>string</code> | 
| region | <code>string</code> | 

<a name="AwsSvc+AWSSessionToken"></a>
### *awsSvc.AWSSessionToken : <code>object</code>*
Subset of [aws docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#getSessionToken-property)

**Kind**: instance typedef of <code>[AwsSvc](#AwsSvc)</code>  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| serialNumber | <code>string</code> |  | MFA serial number |
| tokenCode | <code>string</code> |  | MFA token code |
| durationSeconds | <code>string</code> | <code>900</code> | The duration, in seconds, that the credentials should remain valid |

<a name="AwsSvc+constructOpts"></a>
### *awsSvc.constructOpts : <code>object</code>*
Credentials and optional MFA

**Kind**: instance typedef of <code>[AwsSvc](#AwsSvc)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| keys | <code>[AWSCredentials](#AwsSvc+AWSCredentials)</code> | AWS config credentials |
| upgrade | <code>[AWSSessionToken](#AwsSvc+AWSSessionToken)</code> | MFA attributes |

