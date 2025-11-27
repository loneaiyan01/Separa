import { NextRequest, NextResponse } from 'next/server';
import { getAllRooms, createRoom, addAuditLog } from '@/lib/storage';
import { getTemplateSettings } from '@/lib/room-templates';
import { Room, CreateRoomRequest } from '@/types';
import { generateRoomId, hashPassword, extractClientIp, getDefaultSecurityConfig } from '@/lib/security';
import crypto from 'crypto';

// GET - List all rooms
export async function GET(req: NextRequest) {
    try {
        const rooms = await getAllRooms();

        // Remove sensitive data from response
        const sanitizedRooms = rooms.map(room => {
            const { password, sessionPassword, blockedIps, allowedIps, ...rest } = room;
            return {
                ...rest,
                hasPassword: !!password,
                hasSessionPassword: !!sessionPassword,
                blockedIpsCount: blockedIps?.length || 0,
                allowedIpsCount: allowedIps?.length || 0
            };
        });

        // Optional filtering
        const { searchParams } = new URL(req.url);
        const template = searchParams.get('template');
        const locked = searchParams.get('locked');

        let filtered = sanitizedRooms;

        if (template) {
            filtered = filtered.filter(room => room.template === template);
        }

        if (locked !== null) {
            const isLocked = locked === 'true';
            filtered = filtered.filter(room => room.locked === isLocked);
        }

        return NextResponse.json(filtered);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
    }
}

// POST - Create a new room
export async function POST(req: NextRequest) {
    try {
        const body: CreateRoomRequest = await req.json();

        // Validate required fields
        if (!body.name || !body.template || !body.creator) {
            return NextResponse.json(
                { error: 'Missing required fields: name, template, creator' },
                { status: 400 }
            );
        }

        // Validate template
        const validTemplates = ['brothers-only', 'sisters-only', 'mixed-host-required', 'open'];
        if (!validTemplates.includes(body.template)) {
            return NextResponse.json(
                { error: 'Invalid template' },
                { status: 400 }
            );
        }

        // Generate unique room ID
        const roomId = generateRoomId();

        // Hash password if provided
        let hashedPassword: string | undefined;
        if (body.locked && body.password) {
            hashedPassword = hashPassword(body.password);
        }

        // Hash session password if provided
        let hashedSessionPassword: string | undefined;
        let sessionPasswordExpiry: number | undefined;
        if (body.sessionPassword) {
            hashedSessionPassword = hashPassword(body.sessionPassword);
            // Default session password expiry: 24 hours from now
            sessionPasswordExpiry = Date.now() + (24 * 60 * 60 * 1000);
        }

        // Get template settings
        const settings = getTemplateSettings(body.template);

        // Get default security config
        const securityConfig = getDefaultSecurityConfig();

        // Get client IP
        const clientIp = extractClientIp(req.headers);

        // Create room object
        const room: Room = {
            id: roomId,
            name: body.name,
            description: body.description || '',
            template: body.template,
            locked: body.locked || false,
            password: hashedPassword,
            sessionPassword: hashedSessionPassword,
            sessionPasswordExpiry,
            creator: body.creator,
            createdAt: Date.now(),
            settings,
            securityConfig,
            blockedIps: [],
            allowedIps: []
        };

        // Save to storage
        const createdRoom = await createRoom(room);

        // Log room creation
        await addAuditLog({
            roomId,
            action: 'room_created',
            actorName: body.creator,
            details: `Room "${body.name}" created with template: ${body.template}`,
            ipAddress: clientIp,
            metadata: {
                template: body.template,
                locked: body.locked,
                hasSessionPassword: !!hashedSessionPassword
            }
        });

        // Remove sensitive data from response
        const { password, sessionPassword, ...sanitizedRoom } = createdRoom;

        return NextResponse.json(sanitizedRoom, { status: 201 });
    } catch (error) {
        console.error('Error creating room:', error);
        return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }
}
