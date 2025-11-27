import { NextRequest, NextResponse } from 'next/server';
import { getAllRooms, createRoom } from '@/lib/storage';
import { getTemplateSettings } from '@/lib/room-templates';
import { Room, CreateRoomRequest } from '@/types';
import crypto from 'crypto';

// GET - List all rooms
export async function GET(req: NextRequest) {
    try {
        const rooms = await getAllRooms();

        // Remove passwords from response
        const sanitizedRooms = rooms.map(room => {
            const { password, ...rest } = room;
            return rest;
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
        const roomId = crypto.randomBytes(8).toString('hex');

        // Hash password if provided
        let hashedPassword: string | undefined;
        if (body.locked && body.password) {
            hashedPassword = crypto
                .createHash('sha256')
                .update(body.password)
                .digest('hex');
        }

        // Get template settings
        const settings = getTemplateSettings(body.template);

        // Create room object
        const room: Room = {
            id: roomId,
            name: body.name,
            description: body.description || '',
            template: body.template,
            locked: body.locked || false,
            password: hashedPassword,
            creator: body.creator,
            createdAt: new Date().toISOString(),
            settings,
        };

        // Save to storage
        const createdRoom = await createRoom(room);

        // Remove password from response
        const { password, ...sanitizedRoom } = createdRoom;

        return NextResponse.json(sanitizedRoom, { status: 201 });
    } catch (error) {
        console.error('Error creating room:', error);
        return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
    }
}
