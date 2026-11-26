import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

/**
 * Gerçek JWT doğrulaması yapan guard. `Authorization: Bearer <token>`
 * bekler ve access secret ile imzayı doğrular. Doğrulanan yükü
 * `request.user` üzerine yazar.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Yetkilendirme başlığı eksik.');
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token) {
      throw new UnauthorizedException('Token bulunamadı.');
    }

    const secret = process.env.JWT_ACCESS_SECRET;
    if (!secret) {
      throw new UnauthorizedException('JWT erişim sırrı yapılandırılmamış.');
    }

    try {
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret,
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Geçersiz veya süresi dolmuş token.');
    }
  }
}
