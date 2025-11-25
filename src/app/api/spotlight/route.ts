import { RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { ParticipantMetadata } from '@/types';

export async function POST(req: NextRequest) {
    const { roomName, participantIdentity, isSpotlighted } = await req.json();

    if (!roomName || !participantIdentity) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret || !wsUrl) {
        return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const roomService = new RoomServiceClient(wsUrl, apiKey, apiSecret);

    try {
        // Get current participant to preserve other metadata
        const participant = await roomService.getParticipant(roomName, participantIdentity);

        let metadata: ParticipantMetadata = { gender: 'male', isHost: false }; // default
        if (participant.metadata) {
            try {
                metadata = JSON.parse(participant.metadata);
            } catch (e) {
                // ignore
            }
        }

        metadata.isSpotlighted = isSpotlighted;

        await roomService.updateParticipant(roomName, participantIdentity, JSON.stringify(metadata));

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to update participant' }, { status: 500 });
    }
}
