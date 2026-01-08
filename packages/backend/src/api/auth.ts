import express from 'express';
import passport from 'passport';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error-handler';
import { LoginRequestSchema, RegisterRequestSchema } from '@trainer3/shared';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

// Register with email/password
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = RegisterRequestSchema.parse(req.body);

    // Check if user exists
    const existing = await prisma.account.findFirst({
      where: { provider: 'email' },
      include: { user: true },
    });

    if (existing && existing.user.email === email) {
      throw new AppError(400, 'USER_EXISTS', 'User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user and account
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        name: name || null,
        accounts: {
          create: {
            id: uuidv4(),
            provider: 'email',
            passwordHash,
          },
        },
      },
    });

    // Create session
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        token,
        expiresAt,
      },
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Login with email/password
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = LoginRequestSchema.parse(req.body);

    // Find user account
    const account = await prisma.account.findFirst({
      where: { provider: 'email' },
      include: { user: true },
    });

    if (!account || account.user.email !== email || !account.passwordHash) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, account.passwordHash);
    if (!isValid) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    // Create session
    const token = jwt.sign({ userId: account.user.id }, JWT_SECRET, { expiresIn: '7d' });
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        id: uuidv4(),
        userId: account.user.id,
        token,
        expiresAt,
      },
    });

    res.json({
      user: {
        id: account.user.id,
        email: account.user.email,
        name: account.user.name,
      },
      token,
      expires_at: expiresAt.toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const user = req.user as any;

      // Create session
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.session.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          token,
          expiresAt,
        },
      });

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_failed`);
    }
  }
);

// Logout
router.post('/logout', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    await prisma.session.deleteMany({ where: { token } });
  }
  res.json({ success: true });
});

export { router as authRouter };
