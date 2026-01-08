import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error-handler';
import { prisma } from '../db/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'No token provided');
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Check session exists and is valid
    const session = await prisma.session.findFirst({
      where: {
        token,
        expiresAt: { gte: new Date() },
      },
      include: { user: true },
    });

    if (!session) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name || undefined,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'UNAUTHORIZED', 'Invalid token'));
    } else {
      next(error);
    }
  }
}
