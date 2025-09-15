import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class SubmitScoreDto {
  @ApiProperty({ minimum: 0, example: 400 })
  @IsInt()
  @Min(0)
  score: number;
}


export class PaginateDto {
  @ApiProperty({ minimum: 0, example: 0, required: false })
  @IsInt()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @IsOptional()
  @Min(0)
  skip?: number;

  @ApiProperty({ minimum: 1, example: 10, required: false })
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10), { toClassOnly: true })
  @Min(1)
  limit?: number;
}
