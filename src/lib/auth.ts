import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '15m'; // Access token expires in 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = '7d'; // Refresh token expires in 7 days

export interface JWTPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
  gender: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT access token
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'separa-app',
    audience: 'separa-users',
  });
}

/**
 * Generate refresh token and store in database
 */
export async function generateRefreshToken(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const token = jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'separa-app',
  });

  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
      ipAddress,
      userAgent,
    },
  });

  return token;
}

/**
 * Generate both access and refresh tokens
 */
export async function generateAuthTokens(
  user: any,
  ipAddress?: string,
  userAgent?: string
): Promise<AuthTokens> {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    gender: user.gender,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = await generateRefreshToken(user.id, ipAddress, userAgent);

  return { accessToken, refreshToken };
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'separa-app',
      audience: 'separa-users',
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify refresh token and check if it exists in database
 */
export async function verifyRefreshToken(token: string): Promise<string | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'separa-app',
    }) as any;

    // Check if token exists in database and is not revoked
    const refreshToken = await prisma.refreshToken.findFirst({
      where: {
        token,
        userId: decoded.userId,
        isRevoked: false,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!refreshToken) {
      return null;
    }

    return decoded.userId;
  } catch (error) {
    return null;
  }
}

/**
 * Revoke refresh token
 */
export async function revokeRefreshToken(token: string): Promise<boolean> {
  try {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Revoke all refresh tokens for a user
 */
export async function revokeAllUserTokens(userId: string): Promise<boolean> {
  try {
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate password reset token
 */
export async function generatePasswordResetToken(userId: string): Promise<string> {
  const token = jwt.sign({ userId, type: 'password-reset' }, JWT_SECRET, {
    expiresIn: '1h',
  });

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1);

  await prisma.passwordReset.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const resetToken = await prisma.passwordReset.findFirst({
      where: {
        token,
        userId: decoded.userId,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!resetToken) {
      return null;
    }

    return decoded.userId;
  } catch (error) {
    return null;
  }
}

/**
 * Mark password reset token as used
 */
export async function markPasswordResetTokenUsed(token: string): Promise<void> {
  await prisma.passwordReset.updateMany({
    where: { token },
    data: { usedAt: new Date() },
  });
}

/**
 * Generate email verification token
 */
export async function generateEmailVerificationToken(userId: string): Promise<string> {
  const token = jwt.sign({ userId, type: 'email-verification' }, JWT_SECRET, {
    expiresIn: '24h',
  });

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await prisma.emailVerification.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

/**
 * Verify email verification token
 */
export async function verifyEmailVerificationToken(token: string): Promise<string | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const verificationToken = await prisma.emailVerification.findFirst({
      where: {
        token,
        userId: decoded.userId,
        verifiedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!verificationToken) {
      return null;
    }

    return decoded.userId;
  } catch (error) {
    return null;
  }
}

/**
 * Mark email as verified
 */
export async function markEmailAsVerified(token: string, userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.emailVerification.updateMany({
      where: { token },
      data: { verifiedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    }),
  ]);
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Clean up expired tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  const now = new Date();

  await prisma.$transaction([
    // Delete expired refresh tokens
    prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { isRevoked: true, revokedAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, // 30 days old
        ],
      },
    }),
    // Delete expired password reset tokens
    prisma.passwordReset.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    }),
    // Delete expired email verification tokens
    prisma.emailVerification.deleteMany({
      where: {
        expiresAt: { lt: now },
      },
    }),
  ]);
}
