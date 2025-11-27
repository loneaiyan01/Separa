import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPasswordResetToken, markPasswordResetTokenUsed, hashPassword, isStrongPassword, revokeAllUserTokens } from '@/lib/auth';

/**
 * POST /api/auth/reset-password
 * Reset password using reset token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = isStrongPassword(newPassword);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Weak password', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Verify reset token
    const userId = await verifyPasswordResetToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await markPasswordResetTokenUsed(token);

    // Revoke all refresh tokens for security
    await revokeAllUserTokens(userId);

    return NextResponse.json({
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
