import { DynamoDBClient, PutItemCommand, PutItemCommandInput } from '@aws-sdk/client-dynamodb';

export async function handler(event: any, context: any) {
    console.log("received event from API: ", event);

    // validation on event body
    if (!event.body) {
        throw new Error("Fatal: body missing in input event.")
    }

    // initialize sdk clients
    const dynamoClient = new DynamoDBClient({ region: this.region });

    // process event and insert into dynamodb table
    const parsedBody = JSON.parse(event.body);
    console.log("investigating parsedBody format", parsedBody);
    const putItemCommandInput: PutItemCommandInput = {
        TableName: process.env.PROCESSOR_TABLE_NAME,
        Item: {
            Team: {
                "S": "Chico State"
            }
        }
    }
    const putItemCommand = new PutItemCommand(putItemCommandInput);
    const putItemResponse = await dynamoClient.send(putItemCommand);
    console.log("investigating putData", putItemResponse)
    return putItemResponse
}