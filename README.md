[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)

# SpotSpec
Manage spot instances

See [jsdoc](./doc/index.md)

Example AWS IAM policy to price and launch with MFA authentication
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
          "Sid": "SpotManagement",
          "Action": [
            "ec2:DescribeSpotPriceHistory",
            "ec2:RequestSpotInstances",
            "ec2:DescribeSpotInstanceRequests",
            "ec2:DescribeInstances",
            "ec2:TerminateInstances",
            "ec2:CancelSpotRequest"
          ],
          "Effect": "Allow",
          "Resource": "*",
          "Condition": {
            "Bool": {
              "aws:SecureTransport": "true",
              "aws:MultiFactorAuthPresent": "true"
            },
            "StringEquals": {
              "ec2:Region": [
                "us-east-1",
                "us-west-1"
                "us-west-2"
              ]
            }
          }
        }
    ]
}
```

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
          "Sid": "StsSessionManagement",
          "Effect": "Allow",
          "Action": [
            "sts:GetSessionToken"
          ],
          "Resource": [
            "*"
          ]
        }
    ]
}
```
