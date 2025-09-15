import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';

@Injectable()
export class CognitoService {
  private client: CognitoIdentityProviderClient;

  constructor(private cfg: ConfigService) {
    this.client = new CognitoIdentityProviderClient({
      region: this.cfg.get<string>('AWS_REGION'),
    });
  }

  private secretHash(username: string) {
    return createHmac('sha256', this.cfg.get<string>('COGNITO_CLIENT_SECRET')!)
      .update(username + this.cfg.get<string>('COGNITO_CLIENT_ID'))
      .digest('base64');
  }

  signUp({
    email,
    password,
    preferred_username,
    name,
  }: {
    email: string;
    password: string;
    preferred_username: string;
    name: string;
  }) {
    return this.client.send(
      new SignUpCommand({
        ClientId: this.cfg.get<string>('COGNITO_CLIENT_ID'),
        Username: email,
        Password: password,
        SecretHash: this.secretHash(email),
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'preferred_username', Value: preferred_username },
          { Name: 'name', Value: name },
        ],
      }),
    );
  }

  confirm(email: string, code: string) {
    return this.client.send(
      new ConfirmSignUpCommand({
        ClientId: this.cfg.get<string>('COGNITO_CLIENT_ID'),
        Username: email,
        ConfirmationCode: code,
        SecretHash: this.secretHash(email),
      }),
    );
  }

  login(email: string, password: string) {
    return this.client.send(
      new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: this.cfg.get<string>('COGNITO_CLIENT_ID'),
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
          SECRET_HASH: this.secretHash(email),
        },
      }),
    );
  }
}

