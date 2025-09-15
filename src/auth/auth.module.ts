import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { CognitoService } from './cognito.service';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [CognitoService],
  exports: [CognitoService],
})
export class AuthModule {}

