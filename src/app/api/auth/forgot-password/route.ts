import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generatePasswordResetToken } from '@/lib/auth';

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email, a password reset link will be sent.',
      });
    }

    // Generate reset token
    const token = await generatePasswordResetToken(user.id);

    // TODO: Send email with reset link
    // For now, return the token (in production, this should be sent via email)
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    // In production, you would send an email here
    console.log('Password reset link:', resetLink);

    return NextResponse.json({
      message: 'If an account exists with this email, a password reset link will be sent.',
      // TODO: Remove this in production
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
