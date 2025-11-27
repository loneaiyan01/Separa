import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken, revokeRefreshToken } from '@/lib/auth';
import { extractClientIp } from '@/lib/security';

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
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

    // Verify refresh token
    const userId = await verifyRefreshToken(refreshToken);

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        gender: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      gender: user.gender,
    });

    // Optional: Rotate refresh token (more secure)
    const clientIp = extractClientIp(req.headers);
    const userAgent = req.headers.get('user-agent') || undefined;
    
    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);
    
    // Generate new refresh token
    const newRefreshToken = await generateRefreshToken(user.id, clientIp, userAgent);

    return NextResponse.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
