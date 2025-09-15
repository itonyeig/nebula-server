import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import jwt, { JwtHeader } from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import axios from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const auth = req.headers.authorization;
    if (!auth) throw new UnauthorizedException('No token');
    const [scheme, token] = auth.split(' ');
    if (!token || scheme !== 'Bearer')
      throw new UnauthorizedException('Invalid authorization header');

    try {
      const decoded = jwt.decode(token, { complete: true }) as {
        payload: any;
        header: JwtHeader;
      } | null;
      if (!decoded) throw new BadRequestException('Malformed token');

      const iss = (decoded.payload as any)?.iss as string | undefined;
      const kid = decoded.header?.kid as string | undefined;
      if (!iss || !kid) throw new BadRequestException('Malformed token');

      const cacheKey = `jwks:${iss}`;
      let kidToPem =
        (await this.cache.get<Record<string, string>>(cacheKey)) || undefined;

      if (!kidToPem) {
        const { data } = await axios.get(`${iss}/.well-known/jwks.json`);
        kidToPem = Object.fromEntries(
          (data.keys as any[]).map((k: any) => [k.kid, jwkToPem(k)]),
        );
        // cache for 1 hour
        await this.cache.set(cacheKey, kidToPem, 3600_000);
      }

      let pem = kidToPem[kid];
      // Handle JWKS rotation: refresh once if kid not found
      if (!pem) {
        await (this.cache as any).del?.(cacheKey);
        const { data } = await axios.get(`${iss}/.well-known/jwks.json`);
        kidToPem = Object.fromEntries(
          (data.keys as any[]).map((k: any) => [k.kid, jwkToPem(k)]),
        );
        await this.cache.set(cacheKey, kidToPem, 3600_000);
        pem = kidToPem[kid];
      }
      if (!pem) throw new UnauthorizedException('Invalid token');

      const claims = jwt.verify(token, pem, { algorithms: ['RS256'] }) as any;
      // console.log('Verified claims:', claims);
      // if (claims?.token_use && claims.token_use !== 'access') {
      //   throw new UnauthorizedException('Invalid token type');
      // }
      req.user = claims;
      next();
    } catch (error: any) {
      console.warn('Auth error', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
