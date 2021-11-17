/*
Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
SPDX-License-Identifier: Apache-2.0
*/
import { parse } from 'path';
import { CfnDomain as LegacyCfnDomain } from '@aws-cdk/aws-elasticsearch';
import { CfnDomain } from '@aws-cdk/aws-opensearchservice';
import { CfnResource, Stack } from '@aws-cdk/core';

/**
 * OpenSearch Service domains are within VPCs
 * @param node the CfnResource to check
 */
export default Object.defineProperty(
  (node: CfnResource): boolean => {
    if (node instanceof LegacyCfnDomain || node instanceof CfnDomain) {
      const vpcOptions = Stack.of(node).resolve(node.vpcOptions);
      if (vpcOptions === undefined) {
        return false;
      }
      const subnetIds = Stack.of(node).resolve(vpcOptions.subnetIds);
      if (subnetIds === undefined || subnetIds.length === 0) {
        return false;
      }
    }
    return true;
  },
  'name',
  { value: parse(__filename).name }
);