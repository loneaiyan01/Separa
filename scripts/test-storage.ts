
import { createRoom, getAllRooms } from '../src/lib/storage';
import { Room } from '../src/types';

async function testStorage() {
    console.log('Testing storage...');

    const testRoom: Room = {
        id: 'test-' + Date.now(),
        name: 'Script Test Room',
        description: 'Created by test script',
        template: 'brothers-only',
        locked: false,
        creator: 'script',
        createdAt: Date.now(),
        settings: {
            allowedGenders: ['male', 'host'],
            requireHost: false,
            maxParticipants: null
        },
        securityConfig: {
            e2eeEnabled: false,
            e2eeKeyRotationInterval: 60,
            requireVerifiedParticipants: false,
            maxLoginAttempts: 5,
            lockoutDuration: 15,
            geoBlockEnabled: false,
            blockedCountries: []
        },
        blockedIps: [],
        allowedIps: []
    };

    try {
        console.log('Creating room:', testRoom.id);
        await createRoom(testRoom);
        console.log('Room created in memory.');

        console.log('Verifying persistence...');
        // Force a new read by clearing cache if we could, but here we just call getAllRooms
        // which might use cache. To verify file, we should read file directly.

        const fs = require('fs/promises');
        const path = require('path');
        const roomsFile = path.join(process.cwd(), 'data', 'rooms.json');

        const data = await fs.readFile(roomsFile, 'utf-8');
        if (data.includes(testRoom.id)) {
            console.log('SUCCESS: Room found in rooms.json');
        } else {
            console.error('FAILURE: Room NOT found in rooms.json');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testStorage();
