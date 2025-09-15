import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import { ConnectionRepo } from '../connection.repo';
import type { BigScoreEvent } from '../types/ws-events';

@Injectable()
export class WsService {
  private client: ApiGatewayManagementApiClient;
  private log = new Logger(WsService.name);

  constructor(
    private cfg: ConfigService,
    private connections: ConnectionRepo,
  ) {
    const region = this.cfg.get<string>('AWS_REGION');
    const endpoint = this.cfg.get<string>('WS_API_URL');
    this.client = new ApiGatewayManagementApiClient({
      region,
      endpoint,
    });
  }

  async broadcast(payload: BigScoreEvent): Promise<void> {
    try {
      const targets = await this.connections.allActive();
      if (!targets.length) {
        this.log.log(`No active WS connections. Skipping ${payload.event}.`);
        return;
      }

      const data = Buffer.from(JSON.stringify(payload));
      this.log.log(
        `Broadcasting ${payload.event} (user=${payload.user}, score=${payload.score}) to ${targets.length} connection(s)`,
      );

      let ok = 0;
      let fail = 0;
      for (const connectionId of targets) {
        try {
          await this.client.send(
            new PostToConnectionCommand({ ConnectionId: connectionId, Data: data }),
          );
          ok++;
        } catch (err: any) {
          const status = err?.$metadata?.httpStatusCode;
          const name = err?.name;
          if (status === 410 || name === 'GoneException') {
            this.log.warn(`Stale connection ${connectionId}; skipping`);
            fail++;
            continue;
          }
          this.log.warn(`Failed to post to ${connectionId}: ${name || status}`);
          fail++;
        }
      }
      this.log.log(
        `Broadcast complete for ${payload.event}: ${ok}/${targets.length} delivered (${fail} failed)`,
      );
    } catch (err) {
      this.log.error('Broadcast failed', err as any);
    }
  }
}
