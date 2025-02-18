import * as cdk from 'aws-cdk-lib';
import { IamResource } from 'aws-cdk-lib/aws-appsync';
import { Construct } from 'constructs';
import path = require('path');
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AiLumniHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // build processor dynamodb table
    const processorTable = new cdk.aws_dynamodb.Table(this, 'sports-schedule-data-table', {
      partitionKey: {
        name: "sport",
        type: cdk.aws_dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "gameDateTime",
        type: cdk.aws_dynamodb.AttributeType.STRING
      },
      tableClass: cdk.aws_dynamodb.TableClass.STANDARD_INFREQUENT_ACCESS,
      pointInTimeRecovery: true,
      encryption: cdk.aws_dynamodb.TableEncryption.AWS_MANAGED,
      tableName: 'sports-schedule-data'
    })

    // build config dynamodb table
    const configTable = new cdk.aws_dynamodb.Table(this, 'sports-schedule-config-table', {
      partitionKey: {
        name: "SchoolSport",
        type: cdk.aws_dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: "RSSFeedURL",
        type: cdk.aws_dynamodb.AttributeType.STRING
      },
      tableClass: cdk.aws_dynamodb.TableClass.STANDARD_INFREQUENT_ACCESS,
      pointInTimeRecovery: true,
      encryption: cdk.aws_dynamodb.TableEncryption.AWS_MANAGED,
      tableName: 'sports-schedule-config'
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

    // define lambdas roles and lambdas
    const apigInvokePrincipal = new cdk.aws_iam.ServicePrincipal('apigateway.amazonaws.com');
    const apigInvokeRole = new cdk.aws_iam.Role(this, 'apig-lambda-invoke-role', {
      assumedBy: apigInvokePrincipal
    })

    const lambdaEnvironment = {
      PROCESSOR_TABLE_NAME: processorTable.tableName,
      CONFIG_TABLE: configTable.tableName,
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
    bedrockNotificationProcessorLambda.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: [
        'bedrock:ListFoundationModels',
        'ses:SendEmail',
        'ses:SendRawEmail'
      ],
      resources: ['*']
    }));
    processorTable.grantReadWriteData(bedrockNotificationProcessorLambda)

    const webhookEventProcessor = new cdk.aws_lambda_nodejs.NodejsFunction(this, 'webhook-event-processor-lambda', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_20_X,
      entry: path.join(__dirname, '../src/lambdas/webhook-event-processor', 'index.ts'),
      timeout: cdk.Duration.seconds(60),
      environment: lambdaEnvironment,
      memorySize: 128
    })
    webhookEventProcessor.grantInvoke(apigInvokeRole)
    processorTable.grantReadWriteData(webhookEventProcessor)

    // const rssFeedParser = new cdk.aws_lambda.Function(this, 'rss-feed-processor-lambda', {
    //   runtime: cdk.aws_lambda.Runtime.PYTHON_3_13,
    //   code: cdk.aws_lambda.Code.fromAsset(path.join(__dirname, '../src/lambdas/rss-feed-parser', 'index.py')),
    //   timeout: cdk.Duration.seconds(60),
    //   environment: lambdaEnvironment,
    //   memorySize: 128,
    //   handler: 'index.py'
    // })
    // webhookEventProcessor.grantInvoke(apigInvokeRole)
    // processorTable.grantReadWriteData(webhookEventProcessor)

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
