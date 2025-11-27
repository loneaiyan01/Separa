import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, updateRoom, deleteRoom, addAuditLog } from '@/lib/storage';
import { UpdateRoomRequest } from '@/types';
import crypto from 'crypto';

// GET - Get room by ID
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;
        const room = await getRoomById(roomId);

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Remove password from response
        const { password, ...sanitizedRoom } = room;

        return NextResponse.json(sanitizedRoom);
    } catch (error) {
        console.error('Error fetching room:', error);
        return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
    }
}

// PATCH - Update room
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;
        const body: UpdateRoomRequest = await req.json();

        // Get existing room
        const existingRoom = await getRoomById(roomId);
        if (!existingRoom) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Prepare updates
        const updates: Partial<typeof existingRoom> = {};

        if (body.name !== undefined) updates.name = body.name;
        if (body.description !== undefined) updates.description = body.description;
        if (body.locked !== undefined) updates.locked = body.locked;
        if (body.sessionPassword !== undefined) updates.sessionPassword = body.sessionPassword;
        if (body.blockedIps !== undefined) updates.blockedIps = body.blockedIps;
        if (body.settings !== undefined) {
            updates.settings = { ...existingRoom.settings, ...body.settings };
        }

        // Hash new password if provided
        if (body.password !== undefined) {
            updates.password = crypto
                .createHash('sha256')
                .update(body.password)
                .digest('hex');
        }

        // Update room
        const updatedRoom = await updateRoom(roomId, updates);

        if (!updatedRoom) {
            return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
        }

        // Log action
        await addAuditLog({
            roomId,
            action: 'UPDATE_ROOM',
            details: `Room updated: ${Object.keys(updates).join(', ')}`,
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
        });

        // Remove password from response
        const { password, ...sanitizedRoom } = updatedRoom;

        return NextResponse.json(sanitizedRoom);
    } catch (error) {
        console.error('Error updating room:', error);
        return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
    }
}

// DELETE - Delete room
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;

        const success = await deleteRoom(roomId);

        if (!success) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Log action
        await addAuditLog({
            roomId,
            action: 'DELETE_ROOM',
            details: 'Room deleted',
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting room:', error);
        return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
    }
}
