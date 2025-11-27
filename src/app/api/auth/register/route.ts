import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateAuthTokens, isValidEmail, isStrongPassword } from '@/lib/auth';
import { extractClientIp } from '@/lib/security';

/**
 * POST /api/auth/register
 * Register a new user
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, username, password, name, gender } = body;

    // Validation
    if (!email || !username || !password || !name || !gender) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = isStrongPassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: 'Weak password', details: passwordValidation.errors },
        { status: 400 }
      );
    }

    // Validate gender
    const validGenders = ['MALE', 'FEMALE', 'HOST'];
    if (!validGenders.includes(gender.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid gender. Must be MALE, FEMALE, or HOST' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'username';
      return NextResponse.json(
        { error: `User with this ${field} already exists` },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        name,
        gender: gender.toUpperCase(),
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        gender: true,
        role: true,
        createdAt: true,
      },
    });

    // Create default preferences
    await prisma.userPreferences.create({
      data: {
        userId: user.id,
      },
    });

    // Generate tokens
    const clientIp = extractClientIp(req.headers);
    const userAgent = req.headers.get('user-agent') || undefined;
    const tokens = await generateAuthTokens(user, clientIp, userAgent);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json(
      {
        message: 'User registered successfully',
        user,
        ...tokens,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
