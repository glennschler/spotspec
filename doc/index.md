<a name="SpotSpec"></a>
## SpotSpec

* [SpotSpec](#SpotSpec)
  * [new SpotSpec(options)](#new_SpotSpec_new)
  * [.prices(options)](#SpotSpec+prices)
  * [.launch(options)](#SpotSpec+launch)
  * [.describeRequests(options)](#SpotSpec+describeRequests)
  * [.describeInstances(options, instanceIds)](#SpotSpec+describeInstances)
  * [.terminateInstances(options, [instanceIds])](#SpotSpec+terminateInstances)
  * [.cancelSpotRequest(options, [spotInstanceRequestIds])](#SpotSpec+cancelSpotRequest)
  * ["initialized" (err, [initData])](#SpotSpec+event_initialized)
  * ["priced" (err, [priceData])](#SpotSpec+event_priced)
  * ["launched" (err, [launchData])](#SpotSpec+event_launched)
  * ["requests" (err, [spotInstanceRequests])](#SpotSpec+event_requests)
  * ["instances" (err, [instances])](#SpotSpec+event_instances)
  * ["terminated" (err)](#SpotSpec+event_terminated)
  * ["canceled" (err)](#SpotSpec+event_canceled)

<a name="new_SpotSpec_new"></a>
### new SpotSpec(options)
Constructs a new SpotSpec Library

**Throws**:

- <code>error</code> 


| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | The AWS service IAM credentials - See [aws docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Credentials.html) |
| options.keys | <code>object</code> |  | AWS credentials |
| options.keys.accessKeyId | <code>string</code> |  | AWS access key ID |
| options.keys.secretAccessKey | <code>string</code> |  | AWS secret access key. |
| options.keys.region | <code>string</code> |  | The EC2 region to send service requests |
| options.upgrade | <code>object</code> |  | Temporary Session Token credentials - See [aws docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/STS.html#getSessionToken-property) |
| options.upgrade.serialNumber | <code>string</code> |  | Identifies the user's hardware or virtual MFA device. |
| options.upgrade.tokenCode | <code>string</code> |  | Time-based one-time password (TOTP) that the MFA devices produces |
| [options.upgrade.durationSeconds] | <code>number</code> | <code>900</code> | How long the temporary key will last |
| [options.isLogging] | <code>boolean</code> | <code>false</code> | Use internal logging |

<a name="SpotSpec+prices"></a>
### spotSpec.prices(options)
prices - Request the latest spot prices

**Kind**: instance method of <code>[SpotSpec](#SpotSpec)</code>  
**Emits**: <code>[priced](#SpotSpec+event_priced)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | JSON options to request current price |
| poptions.type | <code>string</code> |  | The instance type to be priced e.g. m3.medium |
| [options.InstanceTypes] | <code>Array.&lt;string&gt;</code> | <code></code> | Array of instance types to be priced |
| [options.product] | <code>string</code> |  | The ProductDescriptions, e.g. 'Windows' |
| [options.ProductDescriptions] | <code>Array.&lt;string&gt;</code> | <code></code> | Array of ProductDescriptions, e.g. 'Windows' |
| [options.dryRun] | <code>boolean</code> | <code>false</code> | Only verify parameters. |
| [options.isLogging] | <code>boolean</code> | <code>false</code> |  |

<a name="SpotSpec+launch"></a>
### spotSpec.launch(options)
Launch a spot instance

**Kind**: instance method of <code>[SpotSpec](#SpotSpec)</code>  
**Throws**:

- <code>error</code> 

**Emits**: <code>[launched](#SpotSpec+event_launched)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | JSON options to request a spot instance |
| options.ami | <code>string</code> |  | The amazon machine image name |
| options.type | <code>string</code> |  | The amazon Instance Type e.g. m3.medium |
| options.price | <code>string</code> |  | The maximum price limit |
| options.keyName | <code>string</code> |  | The name of the key pair needed to access the launched instance. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html) |
| [options.dryRun] | <code>boolean</code> | <code>false</code> | Only verify launch parameters. if TRUE, do not launch an instance |
| [options.count] | <code>number</code> | <code>1</code> | The InstanceCount number to launch |
| [options.securityGroupIds] | <code>Array.&lt;string&gt;</code> |  | Array of one or more security group ids. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html) |
| [options.securityGroups] | <code>Array.&lt;string&gt;</code> |  | Array of one or more security group names. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-network-security.html) |
| [options.userData] | <code>string</code> |  | cloud-init *base64-encoded* text. See [user guide](http://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html#user-data-cloud-init) |
| options.launchSpecification | <code>object</code> |  | JSON of any additional launch specification. See [api guide](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#requestSpotInstances-property) |

<a name="SpotSpec+describeRequests"></a>
### spotSpec.describeRequests(options)
describeRequests - Describe the status of all current spot requests See [aws docs](http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/EC2.html#describeSpotInstanceRequests-property)

**Kind**: instance method of <code>[SpotSpec](#SpotSpec)</code>  
**Emits**: <code>[priced](#SpotSpec+event_priced)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | JSON options to request current price |
| [options.dryRun] | <code>boolean</code> | <code>false</code> | Only verify parameters. |

<a name="SpotSpec+describeInstances"></a>
### spotSpec.describeInstances(options, instanceIds)
Describe the status of all running instance.

**Kind**: instance method of <code>[SpotSpec](#SpotSpec)</code>  
**Emits**: <code>{SpotSpec#event:Reservations[]} Array of EC2 instances</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | JSON options to request current price |
| [options.dryRun] | <code>boolean</code> | <code>false</code> | Only verify parameters |
| instanceIds | <code>Array.&lt;string&gt;</code> |  | Array of instance ids to search |

<a name="SpotSpec+terminateInstances"></a>
### spotSpec.terminateInstances(options, [instanceIds])
Terminate an instance

**Kind**: instance method of <code>[SpotSpec](#SpotSpec)</code>  
**Emits**: <code>[terminated](#SpotSpec+event_terminated)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | JSON options to request current price |
| [instanceIds] | <code>Array.&lt;string&gt;</code> |  | Array of instance ids to terminate |
| [options.dryRun] | <code>boolean</code> | <code>false</code> | Only verify parameters. |

<a name="SpotSpec+cancelSpotRequest"></a>
### spotSpec.cancelSpotRequest(options, [spotInstanceRequestIds])
Cancel a spot request

**Kind**: instance method of <code>[SpotSpec](#SpotSpec)</code>  
**Emits**: <code>[canceled](#SpotSpec+event_canceled)</code>  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| options | <code>object</code> |  | JSON options to request current price |
| [spotInstanceRequestIds] | <code>Array.&lt;string&gt;</code> |  | Array of instance ids to terminate |
| [options.dryRun] | <code>boolean</code> | <code>false</code> | Only verify parameters. |

<a name="SpotSpec+event_initialized"></a>
### "initialized" (err, [initData])
Emitted as the response to constuct SpotSpec

**Kind**: event emitted by <code>[SpotSpec](#SpotSpec)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
| [initData] | <code>object</code> | Null on error |

<a name="SpotSpec+event_priced"></a>
### "priced" (err, [priceData])
Emitted as the response to a prices request

**Kind**: event emitted by <code>[SpotSpec](#SpotSpec)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
| [priceData] | <code>Array.&lt;SpotSpec#SpotPriceHistory&gt;</code> | Null on error |

<a name="SpotSpec+event_launched"></a>
### "launched" (err, [launchData])
Emitted as the response to a launch request

**Kind**: event emitted by <code>[SpotSpec](#SpotSpec)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
| [launchData] | <code>object</code> | Null on error |

<a name="SpotSpec+event_requests"></a>
### "requests" (err, [spotInstanceRequests])
Emitted as the response to a describe requests 'request'

**Kind**: event emitted by <code>[SpotSpec](#SpotSpec)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
| [spotInstanceRequests] | <code>Array.&lt;SpotSpec#SpotInstanceRequests&gt;</code> | Null on error |

<a name="SpotSpec+event_instances"></a>
### "instances" (err, [instances])
Emitted as the response to a describe instances request

**Kind**: event emitted by <code>[SpotSpec](#SpotSpec)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
| [instances] | <code>Array.&lt;SpotSpec#reservations&gt;</code> | Null on error |

<a name="SpotSpec+event_terminated"></a>
### "terminated" (err)
Emitted as the response to a terminate request

**Kind**: event emitted by <code>[SpotSpec](#SpotSpec)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
|  | <code>Array.&lt;SpotSpec#TerminatingInstances&gt;</code> | Null on error |

<a name="SpotSpec+event_canceled"></a>
### "canceled" (err)
Emitted as the response to a cancel request

**Kind**: event emitted by <code>[SpotSpec](#SpotSpec)</code>  

| Param | Type | Description |
| --- | --- | --- |
| err | <code>error</code> | Only on error |
|  | <code>Array.&lt;SpotSpec#CancelledSpotInstanceRequests&gt;</code> | Null on error |


ERROR, Cannot find class.