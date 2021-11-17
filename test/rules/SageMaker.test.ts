/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
*/
import { SynthUtils } from '@aws-cdk/assert';
import { Role, ServicePrincipal } from '@aws-cdk/aws-iam';
import { CfnEndpointConfig, CfnNotebookInstance } from '@aws-cdk/aws-sagemaker';
import { Aspects, CfnResource, IConstruct, Stack } from '@aws-cdk/core';
import { NagMessageLevel, NagPack, NagPackProps } from '../../src';
import {
  SageMakerEndpointConfigurationKMSKeyConfigured,
  SageMakerNotebookInVPC,
  SageMakerNotebookInstanceKMSKeyConfigured,
  SageMakerNotebookNoDirectInternetAccess,
} from '../../src/rules/sagemaker';

class TestPack extends NagPack {
  constructor(props?: NagPackProps) {
    super(props);
    this.packName = 'Test';
  }
  public visit(node: IConstruct): void {
    if (node instanceof CfnResource) {
      const rules = [
        SageMakerEndpointConfigurationKMSKeyConfigured,
        SageMakerNotebookInVPC,
        SageMakerNotebookInstanceKMSKeyConfigured,
        SageMakerNotebookNoDirectInternetAccess,
      ];
      rules.forEach((rule) => {
        this.applyRule({
          info: 'foo.',
          explanation: 'bar.',
          level: NagMessageLevel.ERROR,
          rule: rule,
          node: node,
        });
      });
    }
  }
}

describe('Amazon SageMaker', () => {
  test('SageMakerEndpointConfigurationKMSKeyConfigured: SageMaker endpoints utilize a KMS key', () => {
    const nonCompliant = new Stack();
    Aspects.of(nonCompliant).add(new TestPack());
    new CfnEndpointConfig(nonCompliant, 'badendpoint', {
      productionVariants: [],
    });
    const messages = SynthUtils.synthesize(nonCompliant).messages;
    expect(messages).toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining(
            'SageMakerEndpointConfigurationKMSKeyConfigured:'
          ),
        }),
      })
    );

    const compliant = new Stack();
    Aspects.of(compliant).add(new TestPack());
    new CfnEndpointConfig(compliant, 'badendpoint', {
      productionVariants: [],
      kmsKeyId: 'somecoolIDkey',
    });
    const messages2 = SynthUtils.synthesize(compliant).messages;
    expect(messages2).not.toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining(
            'SageMakerEndpointConfigurationKMSKeyConfigured:'
          ),
        }),
      })
    );
  });

  test('SageMakerNotebookInVPC: SageMaker notebook instances are provisioned inside a VPC', () => {
    const nonCompliant = new Stack();
    Aspects.of(nonCompliant).add(new TestPack());
    new CfnNotebookInstance(nonCompliant, 'rNotebook', {
      instanceType: 'ml.t3.xlarge',
      roleArn: new Role(nonCompliant, 'rNotebookRole', {
        assumedBy: new ServicePrincipal('sagemaker.amazonaws.com'),
      }).roleArn,
    });
    const messages = SynthUtils.synthesize(nonCompliant).messages;
    expect(messages).toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining('SageMakerNotebookInVPC:'),
        }),
      })
    );

    const compliant = new Stack();
    Aspects.of(compliant).add(new TestPack());
    new CfnNotebookInstance(compliant, 'rNotebook', {
      instanceType: 'ml.t3.xlarge',
      roleArn: new Role(compliant, 'rNotebookRole', {
        assumedBy: new ServicePrincipal('sagemaker.amazonaws.com'),
      }).roleArn,
      subnetId: 'subnet-0bb1c79de3EXAMPLE',
    });
    const messages2 = SynthUtils.synthesize(compliant).messages;
    expect(messages2).not.toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining('SageMakerNotebookInVPC:'),
        }),
      })
    );
  });

  test('SageMakerNotebookInstanceKMSKeyConfigured: SageMaker notebook instances utilize KMS keys for encryption at rest', () => {
    const nonCompliant = new Stack();
    Aspects.of(nonCompliant).add(new TestPack());
    new CfnNotebookInstance(nonCompliant, 'rNotebook', {
      instanceType: 'ml.t3.xlarge',
      roleArn: new Role(nonCompliant, 'rNotebookRole', {
        assumedBy: new ServicePrincipal('sagemaker.amazonaws.com'),
      }).roleArn,
    });
    const messages = SynthUtils.synthesize(nonCompliant).messages;
    expect(messages).toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining(
            'SageMakerNotebookInstanceKMSKeyConfigured:'
          ),
        }),
      })
    );

    const compliant = new Stack();
    Aspects.of(compliant).add(new TestPack());
    new CfnNotebookInstance(compliant, 'rNotebook', {
      instanceType: 'ml.t3.xlarge',
      roleArn: new Role(compliant, 'rNotebookRole', {
        assumedBy: new ServicePrincipal('sagemaker.amazonaws.com'),
      }).roleArn,
      kmsKeyId: '1234abcd-12ab-34cd-56ef-1234567890ab',
    });
    const messages2 = SynthUtils.synthesize(compliant).messages;
    expect(messages2).not.toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining(
            'SageMakerNotebookInstanceKMSKeyConfigured:'
          ),
        }),
      })
    );
  });

  test('SageMakerNotebookNoDirectInternetAccess: SageMaker notebook instances have direct internet access disabled', () => {
    const nonCompliant = new Stack();
    Aspects.of(nonCompliant).add(new TestPack());
    new CfnNotebookInstance(nonCompliant, 'rNotebook', {
      instanceType: 'ml.t3.xlarge',
      roleArn: new Role(nonCompliant, 'rNotebookRole', {
        assumedBy: new ServicePrincipal('sagemaker.amazonaws.com'),
      }).roleArn,
    });
    const messages = SynthUtils.synthesize(nonCompliant).messages;
    expect(messages).toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining(
            'SageMakerNotebookNoDirectInternetAccess:'
          ),
        }),
      })
    );

    const compliant = new Stack();
    Aspects.of(compliant).add(new TestPack());
    new CfnNotebookInstance(compliant, 'rNotebook', {
      instanceType: 'ml.t3.xlarge',
      roleArn: new Role(compliant, 'rNotebookRole', {
        assumedBy: new ServicePrincipal('sagemaker.amazonaws.com'),
      }).roleArn,
      subnetId: 'subnet-0bb1c79de3EXAMPLE',
      directInternetAccess: 'Disabled',
    });
    const messages2 = SynthUtils.synthesize(compliant).messages;
    expect(messages2).not.toContainEqual(
      expect.objectContaining({
        entry: expect.objectContaining({
          data: expect.stringContaining(
            'SageMakerNotebookNoDirectInternetAccess:'
          ),
        }),
      })
    );
  });
});