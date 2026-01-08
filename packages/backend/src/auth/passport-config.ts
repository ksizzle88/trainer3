import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';

export function setupPassport() {
  // Serialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Local strategy (email/password)
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          const account = await prisma.account.findFirst({
            where: { provider: 'email' },
            include: { user: true },
          });

          if (!account || !account.passwordHash) {
            return done(null, false, { message: 'Invalid credentials' });
          }

          const isValid = await bcrypt.compare(password, account.passwordHash);

          if (!isValid) {
            return done(null, false, { message: 'Invalid credentials' });
          }

          return done(null, account.user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  // Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Check if account exists
            let account = await prisma.account.findUnique({
              where: {
                provider_providerId: {
                  provider: 'google',
                  providerId: profile.id,
                },
              },
              include: { user: true },
            });

            if (account) {
              return done(null, account.user);
            }

            // Create new user and account
            const email = profile.emails?.[0]?.value;
            if (!email) {
              return done(new Error('No email from Google'));
            }

            const user = await prisma.user.create({
              data: {
                email,
                name: profile.displayName,
                avatarUrl: profile.photos?.[0]?.value,
                accounts: {
                  create: {
                    provider: 'google',
                    providerId: profile.id,
                  },
                },
              },
            });

            return done(null, user);
          } catch (error) {
            return done(error as Error);
          }
        }
      )
    );
  }
}
