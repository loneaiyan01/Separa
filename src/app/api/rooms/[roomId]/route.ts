import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, updateRoom, deleteRoom, addAuditLog } from '@/lib/storage';
import { UpdateRoomRequest } from '@/types';
import { hashPassword, extractClientIp } from '@/lib/security';
import crypto from 'crypto';
import { getTemplateSettings } from '@/lib/room-templates';

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

        // Remove sensitive data from response
        const { password, sessionPassword, blockedIps, allowedIps, ...sanitizedRoom } = room;

        return NextResponse.json({
            ...sanitizedRoom,
            hasPassword: !!password,
            hasSessionPassword: !!sessionPassword,
            sessionPasswordExpired: room.sessionPasswordExpiry ? Date.now() > room.sessionPasswordExpiry : false,
            blockedIpsCount: blockedIps?.length || 0,
            allowedIpsCount: allowedIps?.length || 0
        });
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
        const body: UpdateRoomRequest & { actorName?: string; template?: string } = await req.json();

        const actorName = body.actorName || 'anonymous';
        const clientIp = extractClientIp(req.headers);

        // Get existing room
        const existingRoom = await getRoomById(roomId);
        if (!existingRoom) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        // Prepare updates
        const updates: Partial<typeof existingRoom> = {};
        const changedFields: string[] = [];

        if (body.name !== undefined && body.name !== existingRoom.name) {
            updates.name = body.name;
            changedFields.push('name');
        }

        if (body.description !== undefined && body.description !== existingRoom.description) {
            updates.description = body.description;
            changedFields.push('description');
        }

        // Handle Template Change
        if (body.template !== undefined && body.template !== existingRoom.template) {
            updates.template = body.template as any;
            changedFields.push('template');

            // Automatically update settings based on new template
            const newSettings = getTemplateSettings(body.template as any);
            updates.settings = newSettings;
            changedFields.push('settings (auto-updated from template)');
        }

        if (body.locked !== undefined && body.locked !== existingRoom.locked) {
            updates.locked = body.locked;
            changedFields.push('locked');
        }

        if (body.sessionPasswordExpiry !== undefined) {
            updates.sessionPasswordExpiry = body.sessionPasswordExpiry;
            changedFields.push('sessionPasswordExpiry');
        }

        if (body.blockedIps !== undefined) {
            updates.blockedIps = body.blockedIps;
            changedFields.push('blockedIps');
        }

        if (body.allowedIps !== undefined) {
            updates.allowedIps = body.allowedIps;
            changedFields.push('allowedIps');
        }

        // Only update settings manually if template wasn't changed (or if explicitly overriding)
        // If template changed, we already set updates.settings above. 
        // If body.settings is ALSO provided, it will override the template defaults.
        if (body.settings !== undefined) {
            updates.settings = { ...(updates.settings || existingRoom.settings), ...body.settings };
            if (!changedFields.includes('settings (auto-updated from template)')) {
                changedFields.push('settings');
            }
        }

        if (body.securityConfig !== undefined) {
            const currentConfig = existingRoom.securityConfig || {
                e2eeEnabled: false,
                maxLoginAttempts: 5,
                lockoutDuration: 15
            };
            updates.securityConfig = { ...currentConfig, ...body.securityConfig } as any;
            changedFields.push('securityConfig');
        }

        // Hash new password if provided
        if (body.password !== undefined) {
            updates.password = hashPassword(body.password);
            changedFields.push('password');
        }

        // Hash new session password if provided
        if (body.sessionPassword !== undefined) {
            updates.sessionPassword = hashPassword(body.sessionPassword);
            changedFields.push('sessionPassword');
        }

        // Only update if there are changes
        if (changedFields.length === 0) {
            return NextResponse.json({ message: 'No changes detected' }, { status: 200 });
        }

        // Update room
        const updatedRoom = await updateRoom(roomId, updates);

        if (!updatedRoom) {
            return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
        }

        // Log action with details
        await addAuditLog({
            roomId,
            action: 'room_updated',
            actorName,
            details: `Room updated: ${changedFields.join(', ')}`,
            ipAddress: clientIp,
            metadata: { updatedFields: changedFields }
        });

        // Log password change specifically
        if (changedFields.includes('password')) {
            await addAuditLog({
                roomId,
                action: 'password_changed',
                actorName,
                details: 'Room password changed',
                ipAddress: clientIp
            });
        }

        // Log session password change specifically
        if (changedFields.includes('sessionPassword')) {
            await addAuditLog({
                roomId,
                action: 'session_password_set',
                actorName,
                details: 'Session password updated',
                ipAddress: clientIp
            });
        }

        // Remove sensitive data from response
        const { password, sessionPassword, blockedIps, allowedIps, ...sanitizedRoom } = updatedRoom;

        return NextResponse.json({
            ...sanitizedRoom,
            hasPassword: !!password,
            hasSessionPassword: !!sessionPassword,
            blockedIpsCount: blockedIps?.length || 0,
            allowedIpsCount: allowedIps?.length || 0
        });
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
        const { searchParams } = new URL(req.url);
        const actorName = searchParams.get('actorName') || 'anonymous';
        const clientIp = extractClientIp(req.headers);

        // Get room details before deleting
        const room = await getRoomById(roomId);

        if (!room) {
            return NextResponse.json({ error: 'Room not found' }, { status: 404 });
        }

        const success = await deleteRoom(roomId);

        if (!success) {
            return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
        }

        // Log action with room details
        await addAuditLog({
            roomId,
            action: 'room_deleted',
            actorName,
            details: `Room "${room.name}" deleted`,
            ipAddress: clientIp,
            metadata: {
                roomName: room.name,
                template: room.template
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting room:', error);
        return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
    }
}
