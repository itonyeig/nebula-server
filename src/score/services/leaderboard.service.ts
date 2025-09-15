import { Injectable } from '@nestjs/common';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LeaderboardServiceRepo {
  private ddb: DynamoDBDocumentClient;
  private table = 'leaderboard';

  constructor(private cfg: ConfigService) {
    this.ddb = DynamoDBDocumentClient.from(
      new DynamoDBClient({ region: this.cfg.get('AWS_REGION') }),
      { marshallOptions: { removeUndefinedValues: true } },
    );
  }

  putScore(item: {
    user_id: string;
    user_name: string;
    user_email: string;
    score: number;
  }) {
    return this.ddb.send(
      new PutCommand({
        TableName: this.table,
        Item: {
          id: randomUUID(),
          ...item,
          timestamp: Date.now()
        },
      }),
    );
  }

  async getTop(limit = 1) {
    // Demo-friendly fallback: scan and sort locally by score desc, then timestamp desc
    const res = await this.ddb.send(
      new ScanCommand({
        TableName: this.table,
        ProjectionExpression: '#id, user_id, user_name, user_email, score, #ts',
        ExpressionAttributeNames: { '#id': 'id', '#ts': 'timestamp' },
      }),
    );
    const items = (res.Items || []) as Array<{
      id: string;
      user_id: string;
      user_name: string;
      user_email: string;
      score: number;
      timestamp: number;
    }>;
    items.sort((a, b) => (b.score - a.score) || (b.timestamp - a.timestamp));
    return items.slice(0, Math.max(1, limit));
  }

  async getByUser(user_id: string, limit = 10) {
    const res = await this.ddb.send(
      new ScanCommand({
        TableName: this.table,
        ProjectionExpression: '#id, user_id, user_name, user_email, score, #ts',
        ExpressionAttributeNames: { '#id': 'id', '#ts': 'timestamp' },
        FilterExpression: 'user_id = :uid',
        ExpressionAttributeValues: { ':uid': user_id },
      }),
    );
    const items = (res.Items || []) as Array<{
      id: string;
      user_id: string;
      user_name: string;
      user_email: string;
      score: number;
      timestamp: number;
    }>;
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items.slice(0, Math.max(1, limit));
  }

  async getAllSorted(skip = 0, limit = 10) {
    const res = await this.ddb.send(
      new ScanCommand({
        TableName: this.table,
        ProjectionExpression: '#id, user_id, user_name, user_email, score, #ts',
        ExpressionAttributeNames: { '#id': 'id', '#ts': 'timestamp' },
      }),
    );
    const items = (res.Items || []) as Array<{
      id: string;
      user_id: string;
      user_name: string;
      user_email: string;
      score: number;
      timestamp: number;
    }>;
    items.sort((a, b) => b.score - a.score || b.timestamp - a.timestamp);
    const start = Math.max(0, skip | 0);
    const end = start + Math.max(1, limit | 0);
    return items.slice(start, end);
  }
}
