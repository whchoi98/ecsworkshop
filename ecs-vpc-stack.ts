import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export class VpcAlbStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a VPC
    const vpc = new ec2.Vpc(this, 'MyVPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 2, // Default is all AZs in the region
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
        },
      ],
    });

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Allow HTTP traffic to ALB',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');

    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    // Create Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 80,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 3,
        unhealthyThresholdCount: 3,
      },
    });

    // Create Listener for ALB
    alb.addListener('Listener', {
      port: 80,
      open: true,
      defaultTargetGroups: [targetGroup],
    });

    // Security Group for UI
    const uiSecurityGroup = new ec2.SecurityGroup(this, 'UISecurityGroup', {
      vpc,
      description: 'Allow TCP traffic on ports 80 and 8080',
      allowAllOutbound: true,
    });

    uiSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP traffic');
    uiSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(8080), 'Allow traffic on port 8080');

    // SSM Endpoint
    const ssmSecurityGroup = new ec2.SecurityGroup(this, 'SSMSecurityGroup', {
      vpc,
      description: 'Allow SSM access to private instances',
      allowAllOutbound: true,
    });

    new ec2.InterfaceVpcEndpoint(this, 'SSMEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.SSM,
      securityGroups: [ssmSecurityGroup],
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
    });

    new ec2.InterfaceVpcEndpoint(this, 'SSMMessagesEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES,
      securityGroups: [ssmSecurityGroup],
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
    });

    new ec2.InterfaceVpcEndpoint(this, 'EC2MessagesEndpoint', {
      vpc,
      service: ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES,
      securityGroups: [ssmSecurityGroup],
      subnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_NAT,
      },
    });
  }
}

const app = new cdk.App();
new VpcAlbStack(app, 'VpcAlbStack', {
  env: { region: 'ap-northeast-2' },
});
