import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';

/**
 * GET /api/auth/me
 * Get current user profile
 */
export async function GET(req: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user with preferences
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        gender: true,
        role: true,
        avatar: true,
        bio: true,
        phoneNumber: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/auth/me
 * Update current user profile
 */
export async function PATCH(req: NextRequest) {
  try {
    // Extract and verify token
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, bio, phoneNumber, avatar } = body;

    // Update user
    const user = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        ...(name && { name }),
        ...(bio !== undefined && { bio }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        ...(avatar !== undefined && { avatar }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        gender: true,
        role: true,
        avatar: true,
        bio: true,
        phoneNumber: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
