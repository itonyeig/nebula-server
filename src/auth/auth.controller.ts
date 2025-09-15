import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CognitoService } from './cognito.service';
import { SignUpDto } from './dto/signup.dto';
import { ConfirmDto } from './dto/confirm.dto';
import { LoginDto } from './dto/login.dto';
import { ResponseFormatter } from 'src/common/interceptors/response-formatter.interceptor';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly cognito: CognitoService) {}

  @Post('signup')
  async signUp(@Body() dto: SignUpDto) {
    await this.cognito.signUp(dto);
    return ResponseFormatter.Ok({
      message:
        'User registration successful. Please check your email for the confirmation code.',
    });
  }

  @Post('confirm')
  async confirm(@Body() dto: ConfirmDto) {
    await this.cognito.confirm(dto.email, dto.code);
    return ResponseFormatter.Ok({
      message: 'User confirmation successful.',
    });
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    const { AuthenticationResult } = await this.cognito.login(dto.email, dto.password);
    return ResponseFormatter.Ok({
      message: 'User login successful.',
      data: {
        token: AuthenticationResult?.IdToken,
        refreshToken: AuthenticationResult?.RefreshToken,
        expiresIn: AuthenticationResult?.ExpiresIn,
        tokenType: AuthenticationResult?.TokenType,
      },
    });
  }
}
