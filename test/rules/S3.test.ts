/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
*/
import {
  AnyPrincipal,
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
  StarPrincipal,
} from '@aws-cdk/aws-iam';
import {
  Bucket,
  BucketAccessControl,
  BucketEncryption,
  CfnBucket,
  CfnBucketPolicy,
} from '@aws-cdk/aws-s3';
import { Aspects, Stack } from '@aws-cdk/core';
import {
  S3BucketDefaultLockEnabled,
  S3BucketLevelPublicAccessProhibited,
  S3BucketLoggingEnabled,
  S3BucketPublicReadProhibited,
  S3BucketPublicWriteProhibited,
  S3BucketReplicationEnabled,
  S3BucketServerSideEncryptionEnabled,
  S3BucketSSLRequestsOnly,
  S3BucketVersioningEnabled,
  S3DefaultEncryptionKMS,
} from '../../src/rules/s3';
import { validateStack, TestType, TestPack } from './utils';

const testPack = new TestPack([
  S3BucketDefaultLockEnabled,
  S3BucketLevelPublicAccessProhibited,
  S3BucketLoggingEnabled,
  S3BucketPublicReadProhibited,
  S3BucketPublicWriteProhibited,
  S3BucketReplicationEnabled,
  S3BucketServerSideEncryptionEnabled,
  S3BucketSSLRequestsOnly,
  S3BucketVersioningEnabled,
  S3DefaultEncryptionKMS,
]);
let stack: Stack;

beforeEach(() => {
  stack = new Stack();
  Aspects.of(stack).add(testPack);
});

describe('Amazon Simple Storage Service (S3)', () => {
  describe('S3BucketDefaultLockEnabled: S3 Buckets have object lock enabled', () => {
    const ruleId = 'S3BucketDefaultLockEnabled';
    test('Noncompliance 1', () => {
      new Bucket(stack, 'rBucket');
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Noncompliance 2', () => {
      new CfnBucket(stack, 'rBucket', { objectLockEnabled: true });
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Compliance', () => {
      new CfnBucket(stack, 'rBucket', {
        objectLockEnabled: true,
        objectLockConfiguration: {
          objectLockEnabled: 'Enabled',
          rule: {
            defaultRetention: {
              mode: 'GOVERNANCE',
              days: 1,
            },
          },
        },
      });
      validateStack(stack, ruleId, TestType.COMPLIANCE);
    });
  });

  describe('S3BucketLevelPublicAccessProhibited: S3 Buckets prohibit public access through bucket level settings', () => {
    const ruleId = 'S3BucketLevelPublicAccessProhibited';
    test('Noncompliance 1', () => {
      new Bucket(stack, 'rBucket');
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Noncompliance 2', () => {
      new Bucket(stack, 'rBucket', {
        blockPublicAccess: {
          blockPublicPolicy: true,
          blockPublicAcls: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        },
      });
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Compliance', () => {
      new Bucket(stack, 'rBucket', {
        blockPublicAccess: {
          blockPublicPolicy: true,
          blockPublicAcls: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        },
      });
      validateStack(stack, ruleId, TestType.COMPLIANCE);
    });
  });

  describe('S3BucketLoggingEnabled: S3 Buckets have server access logs enabled', () => {
    const ruleId = 'S3BucketLoggingEnabled';
    test('Noncompliance 1', () => {
      new Bucket(stack, 'rBucket');
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Compliance', () => {
      new Bucket(stack, 'rBucket', {
        serverAccessLogsBucket: Bucket.fromBucketName(
          stack,
          'rLogsBucket',
          'foo'
        ),
      });
      new Bucket(stack, 'rBucket2', {
        serverAccessLogsPrefix: 'foo',
      });
      validateStack(stack, ruleId, TestType.COMPLIANCE);
    });
  });

  describe('S3BucketPublicReadProhibited: S3 Buckets prohibit public read access through their Block Public Access configurations and bucket ACLs', () => {
    const ruleId = 'S3BucketPublicReadProhibited';
    test('Noncompliance 1', () => {
      new Bucket(stack, 'rBucket');
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Noncompliance 2', () => {
      new Bucket(stack, 'rBucket', {
        blockPublicAccess: {
          blockPublicPolicy: true,
          blockPublicAcls: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        },
        accessControl: BucketAccessControl.PUBLIC_READ,
      });
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Compliance', () => {
      new Bucket(stack, 'rBucket', {
        blockPublicAccess: {
          blockPublicPolicy: true,
          blockPublicAcls: true,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        },
        accessControl: BucketAccessControl.PUBLIC_READ,
      });
      new Bucket(stack, 'rBucket2', {
        blockPublicAccess: {
          blockPublicPolicy: true,
          blockPublicAcls: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        },
        accessControl: BucketAccessControl.PRIVATE,
      });
      new Bucket(stack, 'rBucket3', {
        blockPublicAccess: {
          blockPublicPolicy: true,
          blockPublicAcls: true,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        },
      });
      validateStack(stack, ruleId, TestType.COMPLIANCE);
    });
  });

  describe('S3BucketPublicWriteProhibited: S3 Buckets prohibit public write access through their Block Public Access configurations and bucket ACLs', () => {
    const ruleId = 'S3BucketPublicWriteProhibited';
    test('Noncompliance 1', () => {
      new Bucket(stack, 'rBucket');
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Noncompliance 2', () => {
      new Bucket(stack, 'rBucket', {
        blockPublicAccess: {
          blockPublicPolicy: true,
          blockPublicAcls: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        },
        accessControl: BucketAccessControl.PUBLIC_READ_WRITE,
      });
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Compliance', () => {
      new Bucket(stack, 'rBucket', {
        blockPublicAccess: {
          blockPublicPolicy: true,
          blockPublicAcls: true,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        },
        accessControl: BucketAccessControl.PUBLIC_READ_WRITE,
      });
      new Bucket(stack, 'rBucket2', {
        blockPublicAccess: {
          blockPublicPolicy: true,
          blockPublicAcls: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        },
        accessControl: BucketAccessControl.PRIVATE,
      });
      new Bucket(stack, 'rBucket3', {
        blockPublicAccess: {
          blockPublicPolicy: true,
          blockPublicAcls: true,
          ignorePublicAcls: false,
          restrictPublicBuckets: false,
        },
      });
      validateStack(stack, ruleId, TestType.COMPLIANCE);
    });
  });

  describe('S3BucketReplicationEnabled: S3 Buckets have replication enabled', () => {
    const ruleId = 'S3BucketReplicationEnabled';
    test('Noncompliance 1', () => {
      new Bucket(stack, 'rBucket');
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Noncompliance 2', () => {
      new CfnBucket(stack, 'rBucket', {
        replicationConfiguration: {
          role: new Role(stack, 'rReplicationRole', {
            assumedBy: new ServicePrincipal('s3.amazonaws.com'),
          }).roleArn,
          rules: [{ destination: { bucket: 'foo' }, status: 'Disabled' }],
        },
      });
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Compliance', () => {
      new CfnBucket(stack, 'rBucket', {
        replicationConfiguration: {
          role: new Role(stack, 'rReplicationRole', {
            assumedBy: new ServicePrincipal('s3.amazonaws.com'),
          }).roleArn,
          rules: [{ destination: { bucket: 'foo' }, status: 'Enabled' }],
        },
      });
      validateStack(stack, ruleId, TestType.COMPLIANCE);
    });
  });

  describe('S3BucketServerSideEncryptionEnabled: S3 Buckets have default server-side encryption enabled', () => {
    const ruleId = 'S3BucketServerSideEncryptionEnabled';
    test('Noncompliance 1', () => {
      new Bucket(stack, 'rBucket');
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Compliance', () => {
      new Bucket(stack, 'rBucket', {
        encryption: BucketEncryption.S3_MANAGED,
      });
      validateStack(stack, ruleId, TestType.COMPLIANCE);
    });
  });

  describe('S3BucketSSLRequestsOnly: S3 Buckets require requests to use SSL', () => {
    const ruleId = 'S3BucketSSLRequestsOnly';
    test('Noncompliance 1', () => {
      new CfnBucket(stack, 'rBucket');
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Noncompliance 2', () => {
      new CfnBucket(stack, 'rBucket', { bucketName: 'foo' });
      new CfnBucketPolicy(stack, 'rPolicy', {
        bucket: 'foo',
        policyDocument: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['nots3:*'],
              effect: Effect.DENY,
              principals: [new AnyPrincipal()],
              conditions: { Bool: { 'aws:SecureTransport': 'false' } },
              resources: ['arn:aws:s3:::foo', 'arn:aws:s3:::foo/*'],
            }),
          ],
        }),
      });
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Noncompliance 3', () => {
      new CfnBucket(stack, 'rBucket', { bucketName: 'foo' });
      new CfnBucketPolicy(stack, 'rPolicy', {
        bucket: 'foo',
        policyDocument: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['s3:*'],
              effect: Effect.DENY,
              principals: [new AnyPrincipal()],
              conditions: { Bool: { 'aws:SecureTransport': 'false' } },
              resources: ['arn:aws:s3:::foo', 'arn:aws:s3:::food/*'],
            }),
          ],
        }),
      });
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Noncompliance 4', () => {
      new CfnBucket(stack, 'rBucket', { bucketName: 'foo' });
      new CfnBucketPolicy(stack, 'rPolicy', {
        bucket: 'foo',
        policyDocument: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['s3:*'],
              effect: Effect.DENY,
              principals: [new AnyPrincipal()],
              conditions: { Bool: { 'aws:SecureTransport': 'false' } },
              resources: ['arn:aws:s3:::foo', 'arn:aws:s3:::foo/s/*'],
            }),
          ],
        }),
      });
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Noncompliance 5', () => {
      new CfnBucketPolicy(stack, 'rPolicy', {
        bucket: 'foo',
        policyDocument: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['s3:*'],
              effect: Effect.DENY,
              principals: [new AnyPrincipal()],
              conditions: { Bool: { 'aws:SecureTransport': 'false' } },
              resources: [
                'arn:aws:s3:::foo',
                new Bucket(stack, 'rBucket', { bucketName: 'foo' }).bucketArn +
                  '/path' +
                  '/*',
              ],
            }),
          ],
        }),
      });
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Noncompliance 6', () => {
      new CfnBucket(stack, 'rBucket', { bucketName: 'food' });
      new CfnBucketPolicy(stack, 'rPolicy', {
        bucket: 'foo',
        policyDocument: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['s3:*'],
              effect: Effect.DENY,
              principals: [new AnyPrincipal()],
              conditions: { Bool: { 'aws:SecureTransport': 'false' } },
              resources: ['arn:aws:s3:::foo', 'arn:aws:s3:::foo/*'],
            }),
          ],
        }),
      });
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Compliance', () => {
      const compliantBucket = new Bucket(stack, 'rBucket');
      new CfnBucketPolicy(stack, 'rPolicy', {
        bucket: compliantBucket.bucketName,
        policyDocument: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['s3:getObject', 's3:*'],
              effect: Effect.DENY,
              principals: [new StarPrincipal()],
              conditions: { Bool: { 'aws:SecureTransport': 'false' } },
              resources: [
                compliantBucket.bucketArn,
                compliantBucket.bucketArn + '/*',
              ],
            }),
          ],
        }),
      });
      new CfnBucket(stack, 'rBucket2', { bucketName: 'foo' });
      new CfnBucketPolicy(stack, 'rPolicy2', {
        bucket: 'foo',
        policyDocument: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['*', 's3:getObject'],
              effect: Effect.DENY,
              principals: [new AnyPrincipal()],
              conditions: { Bool: { 'aws:SecureTransport': false } },
              resources: [
                'arn:aws:s3:::foo',
                'arn:aws:s3:::foo/*',
                'arn:aws:s3:::foo/path/*',
              ],
            }),
          ],
        }),
      });
      new CfnBucket(stack, 'rBucket3', { bucketName: 'bar' });
      new CfnBucketPolicy(stack, 'rPolicy3', {
        bucket: 'bar',
        policyDocument: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ['*', 's3:getObject'],
              effect: Effect.DENY,
              principals: [new AnyPrincipal()],
              conditions: { Bool: { 'aws:SecureTransport': 'false' } },
              resources: ['arn:aws:s3:::bar/*', 'arn:aws:s3:::bar'],
            }),
          ],
        }),
      });
      validateStack(stack, ruleId, TestType.COMPLIANCE);
    });
  });

  describe('S3BucketVersioningEnabled: S3 Buckets have versioningConfiguration enabled', () => {
    const ruleId = 'S3BucketVersioningEnabled';
    test('Noncompliance 1', () => {
      new Bucket(stack, 'rBucket');
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Noncompliance 2', () => {
      new CfnBucket(stack, 'rBucket', {
        versioningConfiguration: {
          status: 'Suspended',
        },
      });
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Compliance', () => {
      new Bucket(stack, 'rBucket', { versioned: true });
      validateStack(stack, ruleId, TestType.COMPLIANCE);
    });
  });

  describe('S3DefaultEncryptionKMS: S3 Buckets are encrypted with a KMS Key by default', () => {
    const ruleId = 'S3DefaultEncryptionKMS';
    test('Noncompliance 1', () => {
      new Bucket(stack, 'rBucket');
      validateStack(stack, ruleId, TestType.NON_COMPLIANCE);
    });
    test('Compliance', () => {
      new Bucket(stack, 'rBucket', { encryption: BucketEncryption.KMS });
      validateStack(stack, ruleId, TestType.COMPLIANCE);
    });
  });
});
