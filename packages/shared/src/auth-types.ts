import { z } from 'zod';

/**
 * Authentication & Authorization Types
 */

// User
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  avatar_url: z.string().url().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type User = z.infer<typeof UserSchema>;

// Auth provider
export const AuthProviderSchema = z.enum(['email', 'google']);
export type AuthProvider = z.infer<typeof AuthProviderSchema>;

// Session
export const SessionSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  expires_at: z.string().datetime(),
  created_at: z.string().datetime(),
});

export type Session = z.infer<typeof SessionSchema>;

// Login request
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

// Register request
export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

// Auth response
export const AuthResponseSchema = z.object({
  user: UserSchema,
  token: z.string(),
  expires_at: z.string().datetime(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
