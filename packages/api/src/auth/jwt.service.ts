import { Injectable } from '@nestjs/common';
import jwt, { Algorithm, SignOptions, TokenExpiredError } from 'jsonwebtoken';
import { User, UserRole } from '../users/entities/user.entity';

export interface JwtPayload {
  userId: string;
  username: string | null;
  name: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface GenerateTokenOptions {
  expiresIn?: SignOptions['expiresIn'];
}

@Injectable()
export class JwtService {
  private getSecret(): string {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT secret is not configured');
    }

    return secret;
  }

  private getAlgorithm(): Algorithm {
    return (process.env.JWT_ALGORITHM as Algorithm) || 'HS256';
  }

  private getDefaultExpiresIn(): SignOptions['expiresIn'] {
    return (process.env.JWT_EXPIRES_IN || '24h') as SignOptions['expiresIn'];
  }

  generateToken(user: User, options?: GenerateTokenOptions): string {
    const payload: JwtPayload = {
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    return jwt.sign(payload, this.getSecret(), {
      algorithm: this.getAlgorithm(),
      expiresIn: options?.expiresIn || this.getDefaultExpiresIn(),
    });
  }

  verifyToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.getSecret(), {
        algorithms: [this.getAlgorithm()],
      });

      return decoded as JwtPayload;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new Error('Token expired');
      }

      throw new Error('Invalid token');
    }
  }

  extractTokenFromHeader(request: {
    headers?: Record<string, string | string[] | undefined>;
  }): string | null {
    const headerValue =
      request.headers?.authorization || request.headers?.Authorization;

    if (!headerValue || Array.isArray(headerValue)) {
      return null;
    }

    if (!headerValue.startsWith('Bearer ')) {
      return null;
    }

    const token = headerValue.slice(7).trim();

    return token || null;
  }
}
