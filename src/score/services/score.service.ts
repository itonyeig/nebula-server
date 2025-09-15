import { Injectable, Logger } from '@nestjs/common';
import { LeaderboardServiceRepo } from './leaderboard.service';
import { WsService } from './ws.service';

@Injectable()
export class ScoreService {
  constructor(
    private leaderboardService: LeaderboardServiceRepo,
    private ws: WsService,
  ) {}

  async submitScore(item: {
    user_id: string;
    user_name: string;
    user_email: string;
    score: number;
  }) {
    const res = await this.leaderboardService.putScore(item);
    if (item.score > 1000) {
      // Fire-and-forget; no throw on failure
      Logger.debug('Big score detected...',);
      this.ws
        .broadcast({ event: 'big-score', user: item.user_id, score: item.score })
        .catch(() => undefined);
    }
    return res;
  }

  async getTopScores(limit = 10) {
    return this.leaderboardService.getTop(limit);
  }

  async getUserScores(user_id: string, limit = 10) {
    return this.leaderboardService.getByUser(user_id, limit);
  }

  async getAllScores(skip = 0, limit = 10) {
    return this.leaderboardService.getAllSorted(skip, limit);
  }
}
