import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { DynamoDBClient, GetItemCommandInput, GetItemCommand } from '@aws-sdk/client-dynamodb';
import { SendEmailCommand, SendEmailCommandInput, SESClient } from '@aws-sdk/client-ses';

export async function handler(event: any) {

    const gameId = event?.gameID;

    if (!gameId) {
        throw new Error('Fatal error, no game id provided in input event');
    }
    // initialize sdk clients
    const bedrockClient = new BedrockRuntimeClient({ region: this.region });
    const dynamoClient = new DynamoDBClient({ region: this.region });
    const sesClient = new SESClient();

    // read data from dynamo so that we can train the bedrock model
    const getItemCommandInput: GetItemCommandInput = {
        TableName: process.env.PROCESSOR_TABLE_NAME,
        Key: {
            GameID: {
                "S": gameId
            }
        }
    }
    const getItemCommand = new GetItemCommand(getItemCommandInput);
    const getItemResponse = await dynamoClient.send(getItemCommand);
    console.log("investigating getItemResponse", getItemResponse);

    if (!getItemResponse.Item) {
        throw new Error(`record with game id ${gameId} not found`)
    }

    const bedrockPrompt = `Generate a push notification that summarizes this event: ${getItemResponse.Item}`;
    // train bedrock client on data
    const invokeModelCommand = new InvokeModelCommand({
        modelId: 'athropic.claude-v2',
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
            prompt: JSON.stringify(bedrockPrompt),
            max_tokens: 100
        })
    });

    console.log("investigating model command", invokeModelCommand);
    const bedrockResponse = await bedrockClient.send(invokeModelCommand);
    console.log("investigating bedrockResponse", bedrockResponse);

    // parse response from bedrock
    const bedrockResponseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body));
    const message = bedrockResponseBody.completion.trim();
    console.log("investigating bedrock generated message", message);

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