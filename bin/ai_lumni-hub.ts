#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AiLumniHubStack } from '../lib/ai_lumni-hub-stack';

const app = new cdk.App();
new AiLumniHubStack(app, 'AiLumniHubStack', {});