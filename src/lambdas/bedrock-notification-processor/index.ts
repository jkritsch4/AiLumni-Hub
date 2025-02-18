import { BedrockClient, ListFoundationModelsCommand } from '@aws-sdk/client-bedrock';
import { DynamoDBClient, GetItemCommandInput, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { SendEmailCommand, SendEmailCommandInput, SESClient } from '@aws-sdk/client-ses';

export async function handler() {
    // initialize sdk clients
    const bedrockClient = new BedrockClient({ region: this.region });
    const dynamoClient = new DynamoDBClient({ region: this.region });
    const sesClient = new SESClient();

    // read data from dynamo so that we can train the bedrock model
    const getItemCommandInput: GetItemCommandInput = {
        TableName: process.env.PROCESSOR_TABLE_NAME,
        Key: {
            Team: {
                "S": "Chico State"
            }
        }
    }
    const getItemCommand = new GetItemCommand(getItemCommandInput);
    const getItemResponse = await dynamoClient.send(getItemCommand);
    console.log("investigating getItemResponse", getItemResponse);

    // train bedrock client on data
    const listFoundationModelsCommand = new ListFoundationModelsCommand({});
    const bedrockResponse = await bedrockClient.send(listFoundationModelsCommand);
    console.log("investigating bedrockResponse", bedrockResponse);

    // send appropriate notifications
    const sendEmailCommandInput: SendEmailCommandInput = {
        Source: process.env.SOURCE_EMAIL,
        Destination: {
            ToAddresses: [process.env.DESTINATION_EMAIL!]
        },
        Message: {
            Subject: {
                Data: process.env.EMAIL_SUBJECT
            },
            Body: {
                Text: {
                    Data: process.env.EMAIL_BODY
                }
            }
        }
    };
    const sendEmailCommand = new SendEmailCommand(sendEmailCommandInput);
    const sesResponse = await sesClient.send(sendEmailCommand);
    console.log("investigating sesResponse", sesResponse)
}