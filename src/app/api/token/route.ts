import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, addAuditLog } from '@/lib/storage';
import { 
  extractClientIp, 
  isIpBlocked, 
  verifyPassword, 
  isSessionPasswordExpired,
  checkRateLimiting,
  recordFailedAttempt,
  clearFailedAttempts
} from '@/lib/security';
import crypto from 'crypto';

// Store failed login attempts in memory (in production, use Redis or similar)
const failedLoginAttempts = new Map<string, { count: number; lastAttempt: number }>();

export async function POST(req: NextRequest) {
  const { roomId, participantName, gender, isHost, roomPassword } = await req.json();

  if (!participantName) {
    return NextResponse.json({ error: 'Missing participant name' }, { status: 400 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // Extract client IP
  const clientIp = extractClientIp(req.headers);

  let roomName = 'separa-demo'; // Default room
  let roomData = null;

  // If roomId is provided, validate room access
  if (roomId) {
    roomData = await getRoomById(roomId);

    if (!roomData) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Get security config
    const securityConfig = roomData.securityConfig || {
      maxLoginAttempts: 5,
      lockoutDuration: 15
    };

    // Check rate limiting
    const rateLimitCheck = checkRateLimiting(
      clientIp,
      failedLoginAttempts,
      securityConfig.maxLoginAttempts,
      securityConfig.lockoutDuration
    );

    if (!rateLimitCheck.allowed) {
      const lockedUntil = rateLimitCheck.lockedUntil 
        ? new Date(rateLimitCheck.lockedUntil).toISOString()
        : 'unknown';
      
      return NextResponse.json({ 
        error: `Too many failed attempts. Try again later.`,
        lockedUntil: rateLimitCheck.lockedUntil 
      }, { status: 429 });
    }

    // Check IP blocking (enhanced)
    const ipBlockCheck = isIpBlocked(clientIp, roomData.blockedIps, roomData.allowedIps);
    if (ipBlockCheck.blocked) {
      await addAuditLog({
        roomId,
        action: 'participant_joined',
        actorName: participantName,
        details: `Blocked IP ${clientIp} attempted to join. Reason: ${ipBlockCheck.reason}`,
        ipAddress: clientIp,
        metadata: { blocked: true, reason: ipBlockCheck.reason }
      });

      return NextResponse.json({ 
        error: `Access denied: ${ipBlockCheck.reason || 'You have been blocked from this room.'}` 
      }, { status: 403 });
    }

    // Check if room is locked
    if (roomData.locked) {
      if (!roomPassword) {
        return NextResponse.json({ error: 'Room password required' }, { status: 401 });
      }

      // Verify password
      if (!verifyPassword(roomPassword, roomData.password!)) {
        recordFailedAttempt(clientIp, failedLoginAttempts);
        
        await addAuditLog({
          roomId,
          action: 'participant_joined',
          actorName: participantName,
          details: `Failed login attempt - incorrect password`,
          ipAddress: clientIp,
          metadata: { success: false, reason: 'incorrect_password' }
        });

        return NextResponse.json({ error: 'Incorrect room password' }, { status: 401 });
      }
    }

    // Check Session Password (if set and not expired)
    if (roomData.sessionPassword) {
      // Check if session password has expired
      if (isSessionPasswordExpired(roomData.sessionPasswordExpiry)) {
        // Session password has expired, remove it
        // Note: This should be done in a cleanup job, but we'll do it here for now
        console.log('Session password expired for room:', roomId);
      } else {
        // Session password is still valid
        if (!roomData.locked) {
          // If room is not locked, session password is required
          if (!roomPassword || !verifyPassword(roomPassword, roomData.sessionPassword)) {
            recordFailedAttempt(clientIp, failedLoginAttempts);
            
            await addAuditLog({
              roomId,
              action: 'participant_joined',
              actorName: participantName,
              details: `Failed login attempt - incorrect session password`,
              ipAddress: clientIp,
              metadata: { success: false, reason: 'incorrect_session_password' }
            });

            return NextResponse.json({ error: 'Incorrect session password' }, { status: 401 });
          }
        }
      }
    }

    // Check gender restrictions based on template
    const allowedGenders = roomData.settings.allowedGenders;
    const userGender = isHost ? 'host' : gender;

    if (!allowedGenders.includes(userGender)) {
      const templateName = roomData.template.replace(/-/g, ' ');
      
      await addAuditLog({
        roomId,
        action: 'participant_joined',
        actorName: participantName,
        details: `Access denied - gender restriction (${userGender} not allowed in ${templateName} room)`,
        ipAddress: clientIp,
        metadata: { success: false, reason: 'gender_restriction', userGender, template: roomData.template }
      });

      return NextResponse.json(
        { error: `This room is ${templateName}. You cannot join.` },
        { status: 403 }
      );
    }

    // Clear failed attempts on successful validation
    clearFailedAttempts(clientIp, failedLoginAttempts);

    // Use room ID as LiveKit room name
    roomName = `room-${roomId}`;
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    metadata: JSON.stringify({ gender, isHost }),
  });

  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

  // Log successful join
  if (roomId && roomData) {
    await addAuditLog({
      roomId,
      action: 'participant_joined',
      actorName: participantName,
      actorIdentity: participantName,
      details: `${participantName} joined as ${isHost ? 'host' : gender}`,
      ipAddress: clientIp,
      metadata: { 
        gender, 
        isHost,
        e2eeEnabled: roomData.securityConfig?.e2eeEnabled || false
      }
    });
  }

  return NextResponse.json({
    token: await at.toJwt(),
    room: roomData ? {
      id: roomData.id,
      name: roomData.name,
      description: roomData.description,
      template: roomData.template,
      e2eeEnabled: roomData.securityConfig?.e2eeEnabled || false,
    } : null
  });
}
