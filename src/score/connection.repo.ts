import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

@Injectable()
export class ConnectionRepo {
  private ddb: DynamoDBDocumentClient;
  private table: string;

  constructor(private cfg: ConfigService) {
    this.ddb = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: this.cfg.get<string>('AWS_REGION') }),
      { marshallOptions: { removeUndefinedValues: true } },
    );
    this.table = this.cfg.get<string>('CONNECTIONS_TABLE') || 'connections';
  }

  async allActive(): Promise<string[]> {
    const now = Math.floor(Date.now() / 1000);
    const res = await this.ddb.send(
      new ScanCommand({
        TableName: this.table,
        ProjectionExpression: 'connection_id, #ttl',
        FilterExpression: 'attribute_not_exists(#ttl) OR #ttl > :now',
        ExpressionAttributeNames: { '#ttl': 'ttl' },
        ExpressionAttributeValues: { ':now': now },
      }),
    );
    return (
      res.Items?.map((i) => (i as any).connection_id).filter(Boolean) || []
    );
  }
}
