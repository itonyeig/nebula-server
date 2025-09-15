import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { CurrentUserI } from '../../@types/custom';

export const CurrentUser = createParamDecorator(
  (data: keyof CurrentUserI | undefined, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    const user = (req as any).user as CurrentUserI | undefined;
    if (!user) return undefined;
    return data ? (user as any)[data] : user;
  },
);

