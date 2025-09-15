import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'isitony36@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'TempPassw0rd!' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

