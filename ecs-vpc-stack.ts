import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Vpc, SubnetType, SecurityGroup, NatProvider, IpAddresses } from 'aws-cdk-lib/aws-ec2';
import { ApplicationLoadBalancer, ApplicationProtocol, ListenerAction, ApplicationTargetGroup, TargetType } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export class EcsVpcStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // VPC 생성
    const vpc = new Vpc(this, 'MyVpc', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // ALB 보안 그룹 생성
    const albSecurityGroup = new SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Allow HTTP access on port 80',
      allowAllOutbound: true,
    });

    albSecurityGroup.addIngressRule(cdk.aws_ec2.Peer.anyIpv4(), cdk.aws_ec2.Port.tcp(80), 'Allow HTTP traffic');

    // ALB 생성
    const alb = new ApplicationLoadBalancer(this, 'ApplicationLoadBalancer', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    // Target Group 생성
    const targetGroup = new ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      protocol: ApplicationProtocol.HTTP,
      port: 80,
      targetType: TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 3,
        unhealthyThresholdCount: 3,
      },
    });

    // ALB 리스너 생성
    alb.addListener('ALBListener', {
      protocol: ApplicationProtocol.HTTP,
      port: 80,
      defaultAction: ListenerAction.forward([targetGroup]),
    });

    // UI 용 보안 그룹 생성
    const uiSecurityGroup = new SecurityGroup(this, 'UISecurityGroup', {
      vpc,
      description: 'Allow TCP traffic on ports 80 and 8080',
      allowAllOutbound: true,
    });

    uiSecurityGroup.addIngressRule(cdk.aws_ec2.Peer.anyIpv4(), cdk.aws_ec2.Port.tcp(80), 'Allow HTTP traffic');
    uiSecurityGroup.addIngressRule(cdk.aws_ec2.Peer.anyIpv4(), cdk.aws_ec2.Port.tcp(8080), 'Allow HTTP traffic on port 8080');
  }
}
