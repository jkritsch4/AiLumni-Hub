import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import path = require('path');
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AiLumniHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // build dynamodb table
    const processorTable = new cdk.aws_dynamodb.Table(this, 'webhook-event-processor-table', {
      partitionKey: {
        name: "Team",
        type: cdk.aws_dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "Sport",
        type: cdk.aws_dynamodb.AttributeType.STRING
      },
      tableClass: cdk.aws_dynamodb.TableClass.STANDARD_INFREQUENT_ACCESS,
      pointInTimeRecovery: true,
      encryption: cdk.aws_dynamodb.TableEncryption.AWS_MANAGED,
      tableName: 'webhook-event-processor-table'
    })

    // build webhook api
    const processorApi = new cdk.aws_apigateway.RestApi(this, 'webhook-event-processor-api', {
      restApiName: "WebhookProcessorApi",
      retainDeployments: false,
      parameters: {
        date: new Date().toISOString()
      },
      endpointConfiguration: {
        types: [
          cdk.aws_apigateway.EndpointType.REGIONAL
        ]
      }
    })

    // define lambdas
    const lambdaEnvironment = {
      PROCESSOR_TABLE_NAME: processorTable.tableName,
      SOURCE_EMAIL: 'cade11kritsch@yahoo.com',
      DESTINATION_EMAIL: 'cade11kritsch@yahoo.com',
      EMAIL_SUBJECT: 'testing',
      EMAIL_BODY: 'testing'
    }

    const bedrockNotificationProcessorLambda = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'bedrock-notification-processor-lambda', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../src/lambdas/bedrock-notification-processor', 'index.ts'),
      timeout: cdk.Duration.seconds(60),
      environment: lambdaEnvironment,
      memorySize: 128
    })

    const webhookEventProcessor = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'webhook-event-processor-lambda', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../src/lambdas/webhook-event-processor', 'index.ts'),
      timeout: cdk.Duration.seconds(60),
      environment: lambdaEnvironment,
      memorySize: 128
    })

    // define enventbridge rule assigned to notification lambda
    const notificationCronJob = new cdk.aws_events.Rule(this, 'trigger-bedrock-job-daily', {
      schedule: cdk.aws_events.Schedule.expression('cron(0 12 ? * * *)')
    })

    notificationCronJob.addTarget(
      new cdk.aws_events_targets.LambdaFunction(bedrockNotificationProcessorLambda)
    )

    // attach lambda to API
    processorApi.root.addMethod(
      "POST",
      new cdk.aws_apigateway.LambdaIntegration(webhookEventProcessor)
    )
  }
}
