import { NextRequest, NextResponse } from 'next/server';
import { extractTokenFromHeader, verifyToken, JWTPayload } from '@/lib/auth';

type AuthResult = 
  | { authorized: false; error: string; status: number }
  | { authorized: true; user: JWTPayload };

/**
 * Authentication middleware
 * Verifies JWT token and attaches user info to request
 */
export async function authenticateRequest(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader);

  if (!token) {
    return {
      authorized: false,
      error: 'Authentication required',
      status: 401,
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      authorized: false,
      error: 'Invalid or expired token',
      status: 401,
    };
  }

  return {
    authorized: true,
    user: payload,
  };
}

/**
 * Role-based authorization middleware
 */
export async function authorizeRole(req: NextRequest, allowedRoles: string[]): Promise<AuthResult> {
  const auth = await authenticateRequest(req);

  if (!auth.authorized) {
    return auth;
  }

  if (!allowedRoles.includes(auth.user.role)) {
    return {
      authorized: false,
      error: 'Insufficient permissions',
      status: 403,
    };
  }

  return {
    authorized: true,
    user: auth.user,
  };
}

/**
 * Helper to create protected API route
 */
export function withAuth(handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const auth = await authenticateRequest(req);

    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    return handler(req, auth.user);
  };
}

/**
 * Helper to create role-protected API route
 */
export function withRole(
  allowedRoles: string[],
  handler: (req: NextRequest, user: JWTPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const auth = await authorizeRole(req, allowedRoles);

    if (!auth.authorized) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    return handler(req, auth.user);
  };
}
