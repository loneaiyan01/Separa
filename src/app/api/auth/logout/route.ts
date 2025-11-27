import { NextRequest, NextResponse } from 'next/server';
import { revokeRefreshToken } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Logout user and revoke refresh token
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token required' },
        { status: 400 }
      );
    }

    // Revoke refresh token
    const success = await revokeRefreshToken(refreshToken);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to revoke token' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    );
  }
}
