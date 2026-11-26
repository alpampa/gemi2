import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  const previousSecret = process.env.JWT_ACCESS_SECRET;
  const jwt = new JwtService({});
  const guard = new JwtAuthGuard(jwt);

  afterEach(() => {
    if (previousSecret === undefined) delete process.env.JWT_ACCESS_SECRET;
    else process.env.JWT_ACCESS_SECRET = previousSecret;
  });

  function contextFor(token: string): ExecutionContext {
    const request = { headers: { authorization: `Bearer ${token}` } };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
  }

  it('rejects development-signed tokens when the configured secret is missing', () => {
    delete process.env.JWT_ACCESS_SECRET;
    const token = jwt.sign({ sub: 'user-1' }, { secret: 'dev_access_secret' });

    expect(() => guard.canActivate(contextFor(token))).toThrow(
      UnauthorizedException,
    );
  });

  it('accepts a token signed by the configured secret', () => {
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    const token = jwt.sign(
      { sub: 'user-1' },
      { secret: process.env.JWT_ACCESS_SECRET },
    );

    expect(guard.canActivate(contextFor(token))).toBe(true);
  });
});
