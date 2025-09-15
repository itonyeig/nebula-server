export interface CurrentUserI {
  sub: string;
  email: string;
  name?: string;
  preferred_username?: string;
}

declare global {
  namespace Express {
    interface User extends CurrentUserI {}
    interface Request {
      user?: CurrentUserI;
    }
  }
}

export {};

