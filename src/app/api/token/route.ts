import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { getRoomById } from '@/lib/storage';
import crypto from 'crypto';

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

  let roomName = 'separa-demo'; // Default room
  let roomData = null;

  // If roomId is provided, validate room access
  if (roomId) {
    roomData = await getRoomById(roomId);

    if (!roomData) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    // Check if room is locked
    if (roomData.locked) {
      if (!roomPassword) {
        return NextResponse.json({ error: 'Room password required' }, { status: 401 });
      }

      // Verify password
      const hashedPassword = crypto
        .createHash('sha256')
        .update(roomPassword)
        .digest('hex');

      if (hashedPassword !== roomData.password) {
        return NextResponse.json({ error: 'Incorrect room password' }, { status: 401 });
      }
    }

    // Check Session Password (if set)
    if (roomData.sessionPassword) {
      // We reuse the roomPassword field for session password if the room is not locked
      // or if the user provides it separately (though current UI uses one field)
      // For simplicity, if sessionPassword exists, we check it against the provided password
      // UNLESS the room is also locked, in which case we might need a separate field.
      // Given the current UI, let's assume sessionPassword overrides or is an alternative.
      // A better approach for the future is a separate input, but for now:

      if (!roomData.locked && roomData.sessionPassword !== roomPassword) {
        return NextResponse.json({ error: 'Incorrect session password' }, { status: 401 });
      }
    }

    // Check IP Blocking
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    if (roomData.blockedIps?.includes(ip)) {
      return NextResponse.json({ error: 'Access denied: You have been blocked from this room.' }, { status: 403 });
    }

    // Check gender restrictions based on template
    const allowedGenders = roomData.settings.allowedGenders;
    const userGender = isHost ? 'host' : gender;

    if (!allowedGenders.includes(userGender)) {
      const templateName = roomData.template.replace(/-/g, ' ');
      return NextResponse.json(
        { error: `This room is ${templateName}. You cannot join.` },
        { status: 403 }
      );
    }

    // Use room ID as LiveKit room name
    roomName = `room-${roomId}`;
  }

  const at = new AccessToken(apiKey, apiSecret, {
    identity: participantName,
    metadata: JSON.stringify({ gender, isHost }),
  });

  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });

  return NextResponse.json({
    token: await at.toJwt(),
    room: roomData ? {
      id: roomData.id,
      name: roomData.name,
      description: roomData.description,
      template: roomData.template,
    } : null
  });
}
