<a name="AwsSpotter"></a>
## AwsSpotter

* [AwsSpotter](#AwsSpotter)
  * [new AwsSpotter(awsCredentials, isLogging)](#new_AwsSpotter_new)
  * [.spotPrices(type, [ProductDesc])](#AwsSpotter+spotPrices)
  * [.spotLaunch(options, [launchSpec])](#AwsSpotter+spotLaunch)
  * [.spotDescribe()](#AwsSpotter+spotDescribe)
  * [.instancesDescribe()](#AwsSpotter+instancesDescribe)
  * [.terminateInstances()](#AwsSpotter+terminateInstances)
  * [.cancelSpotRequest()](#AwsSpotter+cancelSpotRequest)
  * ["prices" (priceData, [err])](#AwsSpotter+event_prices)
  * ["launched" (launchData, [err])](#AwsSpotter+event_launched)
  * [.AWSCredentials](#AwsSpotter+AWSCredentials) : <code>object</code>
  * [.SpotPriceHistory](#AwsSpotter+SpotPriceHistory) : <code>object</code>
  * [.SpotOptions](#AwsSpotter+SpotOptions) : <code>object</code>
  * [.LaunchSpecification](#AwsSpotter+LaunchSpecification) : <code>object</code>

<a name="new_AwsSpotter_new"></a>
### new AwsSpotter(awsCredentials, isLogging)
Constructs a new AwsSpotter Library

**Throws**:

- <code>error</code> 


| Param | Type | Description |
| --- | --- | --- |
| awsCredentials | <code>[Array.&lt;AWSCredentials&gt;](#AwsSpotter+AWSCredentials)</code> | The ec2 IAM credentials for every region |
| isLogging | <code>boolean</code> | Use internal logging |

<a name="AwsSpotter+spotPrices"></a>
### awsSpotter.spotPrices(type, [ProductDesc])
spotPrices - Request the latest spot prices

**Kind**: instance method of <code>[AwsSpotter](#AwsSpotter)</code>  
**Emits**: <code>[prices](#AwsSpotter+event_prices)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| type | <code>string</code> |  | The instance type to be priced e.g. m3.medium |
| [ProductDesc] | <code>string</code> | <code>&quot;Linux/UNIX&quot;</code> | e.g. 'Windows' |

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
Describe the status of all instances

**Kind**: instance method of <code>[AwsSpotter](#AwsSpotter)</code>  
<a name="AwsSpotter+terminateInstances"></a>
### awsSpotter.terminateInstances()
Terminate an instance

**Kind**: instance method of <code>[AwsSpotter](#AwsSpotter)</code>  
<a name="AwsSpotter+cancelSpotRequest"></a>
### awsSpotter.cancelSpotRequest()
Cancel a spot request

**Kind**: instance method of <code>[AwsSpotter](#AwsSpotter)</code>  
<a name="AwsSpotter+event_prices"></a>
### "prices" (priceData, [err])
Emitted as the response to a spotPrices request

**Kind**: event emitted by <code>[AwsSpotter](#AwsSpotter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| priceData | <code>[Array.&lt;SpotPriceHistory&gt;](#AwsSpotter+SpotPriceHistory)</code> | Null on error |
| [err] | <code>error</code> | Only on error |

<a name="AwsSpotter+event_launched"></a>
### "launched" (launchData, [err])
Emitted as the response to a spotLaunch request

**Kind**: event emitted by <code>[AwsSpotter](#AwsSpotter)</code>  

| Param | Type | Description |
| --- | --- | --- |
| launchData | <code>object</code> | Null on error |
| [err] | <code>error</code> | Only on error |

<a name="AwsSpotter+AWSCredentials"></a>
### awsSpotter.AWSCredentials : <code>object</code>
Selected properites described in [aws docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#constructor-property)

**Kind**: instance typedef of <code>[AwsSpotter](#AwsSpotter)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| accessKeyId | <code>string</code> | The IAM users AWS access key ID |
| secretAccessKey | <code>string</code> | The IAM users AWS secret access key |
| region | <code>string</code> | The region to send service requests to |

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

<a name="AwsSpotter+SpotOptions"></a>
### awsSpotter.SpotOptions : <code>object</code>
The following properties are nessesary or highly recommended.

**Kind**: instance typedef of <code>[AwsSpotter](#AwsSpotter)</code>  
**Properties**

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| dryRun | <code>boolean</code> |  | Only verify launch parameters. if TRUE, do not launch an instance |
| ami | <code>string</code> |  | The amazon machine image name |
| type | <code>string</code> |  | The amazon Instance Type e.g. m3.medium |
| price | <code>string</code> |  | The maximaum price limit |
| keyName | <code>string</code> |  | The name of the key pair needed to access the launched instance. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html) |
| count | <code>number</code> | <code>1</code> | The InstanceCount number to launch |
| securityGroupIds | <code>Array.&lt;string&gt;</code> |  | Array of one or more security group ids. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html) |
| securityGroups | <code>Array.&lt;string&gt;</code> |  | Array of one or more security group names. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html) |
| userData | <code>string</code> |  | cloud-init text. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html#user-data-cloud-init) |

<a name="AwsSpotter+LaunchSpecification"></a>
### awsSpotter.LaunchSpecification : <code>object</code>
Additional control properties defined in the LaunchSpecification property
of requestSpotInstances params [aws doc](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#requestSpotInstances-property)

**Kind**: instance typedef of <code>[AwsSpotter](#AwsSpotter)</code>  
