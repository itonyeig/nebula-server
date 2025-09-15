import { Module } from '@nestjs/common';
import { ScoreService } from './services/score.service';
import { ScoreController } from './score.controller';
import { WsService } from './services/ws.service';
import { LeaderboardServiceRepo } from './services/leaderboard.service';
import { ConnectionRepo } from './connection.repo';

@Module({
  controllers: [ScoreController],
  providers: [ScoreService, WsService, LeaderboardServiceRepo, ConnectionRepo],
})
export class ScoreModule {}
