import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION }),
  { marshallOptions: { removeUndefinedValues: true } },
);

function response(statusCode: number, body?: any): APIGatewayProxyStructuredResultV2 {
  return { statusCode, body: body ? JSON.stringify(body) : undefined };
}

export const handler = async (
  event: APIGatewayProxyWebsocketEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  try {
    const connectionId = event.requestContext.connectionId;
    if (!connectionId) return response(400, { message: 'Missing connection id' });

    // We don't have user_id on disconnect, so scan to find the item (demo-friendly).
    const scan = await ddb.send(
      new ScanCommand({
        TableName: process.env.CONNECTIONS_TABLE,
        ProjectionExpression: 'user_id, connection_id',
        FilterExpression: '#cid = :cid',
        ExpressionAttributeNames: { '#cid': 'connection_id' },
        ExpressionAttributeValues: { ':cid': connectionId },
        Limit: 1,
      }),
    );

    const item = scan.Items?.[0] as { user_id: string; connection_id: string } | undefined;
    if (item) {
      await ddb.send(
        new DeleteCommand({
          TableName: process.env.CONNECTIONS_TABLE,
          Key: { user_id: item.user_id, connection_id: item.connection_id },
        }),
      );
    }

    return response(200);
  } catch (err) {
    console.warn('Disconnect handler error', err);
    return response(200); // Swallow errors on disconnect
  }
};

