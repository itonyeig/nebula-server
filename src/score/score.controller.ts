import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ScoreService } from './services/score.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { PaginateDto, SubmitScoreDto } from './dto/submit-score.dto';
import { ResponseFormatter } from 'src/common/interceptors/response-formatter.interceptor';
import { skip } from 'rxjs';
import { CurrentUserI } from 'src/@types/custom';

@ApiTags('Scores')
@ApiBearerAuth()
@Controller('score')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @Get()
  async all(@Query() paginateDto: PaginateDto) {
    const s = Math.max(0, paginateDto.skip || 0);
    const n = Math.max(1, Math.min(paginateDto.limit || 10, 100));
    const data = await this.scoreService.getAllScores(s, n);
    return ResponseFormatter.Ok({ data });
  }

  @Post()
  async save(@CurrentUser() user: CurrentUserI, @Body() { score }: SubmitScoreDto) {
    await this.scoreService.submitScore({
      user_id: user.sub,
      user_name: user.preferred_username || user.name || 'mock1',
      user_email: user.email,
      score,
    });
    return ResponseFormatter.Ok({
      message: 'Score submitted',
      data: { user: user.sub, score },
    });
  }

  @Get('top')
  async top() {
    const top10 = 10;
    const data = await this.scoreService.getTopScores(top10);
    return ResponseFormatter.Ok({ data });
  }

  


}
