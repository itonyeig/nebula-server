import type { APIGatewayProxyWebsocketEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import jwt, { JwtHeader } from 'jsonwebtoken';
import * as jwkToPem from 'jwk-to-pem';
import axios from 'axios';

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
    //@ts-ignore
    const token = event.queryStringParameters?.token;
    if (!token) return response(401, { message: 'Missing token' });

    // Decode to fetch iss + kid
    const decoded = jwt.decode(token, { complete: true }) as
      | { payload: any; header: JwtHeader }
      | null;
    if (!decoded) return response(401, { message: 'Invalid token' });
    const iss = (decoded.payload as any)?.iss as string | undefined;
    const kid = decoded.header?.kid as string | undefined;
    if (!iss || !kid) return response(401, { message: 'Invalid token' });

    // Fetch JWKS and verify
    const { data } = await axios.get(`${iss}/.well-known/jwks.json`);
    const kidToPem = Object.fromEntries((data.keys as any[]).map((k: any) => [k.kid, jwkToPem(k)]));
    const pem = kidToPem[kid];
    if (!pem) return response(401, { message: 'Invalid token' });
    const claims = jwt.verify(token, pem, { algorithms: ['RS256'] }) as any;
    if (claims?.token_use && claims.token_use !== 'id' && claims.token_use !== 'access') {
      return response(401, { message: 'Invalid token type' });
    }

    const userId = claims?.sub as string | undefined;
    const connectionId = event.requestContext.connectionId;
    if (!userId || !connectionId) return response(400, { message: 'Malformed request' });

    const ttlSeconds = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // 24h
    await ddb.send(
      new PutCommand({
        TableName: process.env.CONNECTIONS_TABLE,
        Item: {
          user_id: userId,
          connection_id: connectionId,
          ttl: ttlSeconds,
          connected_at: Date.now(),
        },
      }),
    );

    return response(200);
  } catch (err) {
    console.warn('Connect handler error', err);
    return response(500, { message: 'Internal error' });
  }
};

