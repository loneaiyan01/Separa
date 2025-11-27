import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailVerificationToken, markEmailAsVerified } from '@/lib/auth';

/**
 * POST /api/auth/verify-email
 * Verify email using verification token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Verify token
    const userId = await verifyEmailVerificationToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 401 }
      );
    }

    // Mark email as verified
    await markEmailAsVerified(token, userId);

    return NextResponse.json({
      message: 'Email verified successfully',
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}
