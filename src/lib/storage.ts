import { Room, AuditLog } from '@/types';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit-logs.json');

// Default rooms to use when file storage is not available (e.g. Vercel)
const DEFAULT_ROOMS: Room[] = [
    {
        "id": "33c7c7fd52471379",
        "name": "Muneeb Baya",
        "description": "Weekly Classes",
        "template": "brothers-only",
        "locked": true,
        "password": "cd838f8fc2af70fc323a9d026c34b566b83086b315c781d71bab1023f9f2f8d2",
        "creator": "anonymous",
        "createdAt": 1764238528844,
        "settings": {
            "allowedGenders": [
                "male",
                "host"
            ],
            "requireHost": false,
            "maxParticipants": null
        }
    },
    {
        "id": "03e17f741a66b7d5",
        "name": "Test Brothers Room",
        "description": "",
        "template": "brothers-only",
        "locked": true,
        "password": "ecd71870d1963316a97e3ac3408c9835ad8cf0f3c1bc703527c30265534f75ae",
        "creator": "anonymous",
        "createdAt": 1764238698539,
        "settings": {
            "allowedGenders": [
                "male",
                "host"
            ],
            "requireHost": false,
            "maxParticipants": null
        }
    },
    {
        "id": "a105c30396f87439",
        "name": "Sisters Study Group",
        "description": "",
        "template": "sisters-only",
        "locked": false,
        "creator": "anonymous",
        "createdAt": 1764238775536,
        "settings": {
            "allowedGenders": [
                "female",
                "host"
            ],
            "requireHost": false,
            "maxParticipants": null
        }
    },
    {
        "id": "d84456539c4cb9d5",
        "name": "Community Meeting",
        "description": "",
        "template": "mixed-host-required",
        "locked": true,
        "password": "d8593183c1947107653e609e2c6341ffdab896794ea72475dc06558f67cf10fd",
        "creator": "anonymous",
        "createdAt": 1764238799432,
        "settings": {
            "allowedGenders": [
                "male",
                "female",
                "host"
            ],
            "requireHost": true,
            "maxParticipants": null
        }
    },
    {
        "id": "3241da6e35ff697d",
        "name": "Labeeb and Aiyan",
        "description": "",
        "template": "brothers-only",
        "locked": true,
        "password": "05cce1348dd97e1dd4653de543974d75f5b474c6b86811a17126d7c8fe31f6ba",
        "creator": "anonymous",
        "createdAt": 1764245565144,
        "settings": {
            "allowedGenders": [
                "male",
                "host"
            ],
            "requireHost": false,
            "maxParticipants": null
        },
        "securityConfig": {
            "e2eeEnabled": false,
            "e2eeKeyRotationInterval": 60,
            "requireVerifiedParticipants": false,
            "maxLoginAttempts": 5,
            "lockoutDuration": 15,
            "geoBlockEnabled": false,
            "blockedCountries": []
        },
        "blockedIps": [],
        "allowedIps": []
    },
    {
        "id": "7e8a74c3a6697a2b",
        "name": "Test11",
        "description": "Test11",
        "template": "brothers-only",
        "locked": true,
        "password": "0c4a43c5d77f97fe9ab526573176b34a725f6a5b7b74f4a39cad882b614756f9",
        "creator": "anonymous",
        "createdAt": 1764256977520,
        "settings": {
            "allowedGenders": [
                "male",
                "host"
            ],
            "requireHost": false,
            "maxParticipants": null
        },
        "securityConfig": {
            "e2eeEnabled": false,
            "e2eeKeyRotationInterval": 60,
            "requireVerifiedParticipants": false,
            "maxLoginAttempts": 5,
            "lockoutDuration": 15,
            "geoBlockEnabled": false,
            "blockedCountries": []
        },
        "blockedIps": [],
        "allowedIps": []
    },
    {
        "id": "1aca48fa330a97dd",
        "name": "Boys only",
        "description": "",
        "template": "brothers-only",
        "locked": false,
        "creator": "anonymous",
        "createdAt": 1764258834984,
        "settings": {
            "allowedGenders": [
                "male",
                "host"
            ],
            "requireHost": false,
            "maxParticipants": null
        },
        "securityConfig": {
            "e2eeEnabled": false,
            "e2eeKeyRotationInterval": 60,
            "requireVerifiedParticipants": false,
            "maxLoginAttempts": 5,
            "lockoutDuration": 15,
            "geoBlockEnabled": false,
            "blockedCountries": []
        },
        "blockedIps": [],
        "allowedIps": []
    },
    {
        "id": "313cbb3dc4ef8f2b",
        "name": "bros",
        "description": "",
        "template": "brothers-only",
        "locked": false,
        "creator": "anonymous",
        "createdAt": 1764258927859,
        "settings": {
            "allowedGenders": [
                "male",
                "host"
            ],
            "requireHost": false,
            "maxParticipants": null
        },
        "securityConfig": {
            "e2eeEnabled": false,
            "e2eeKeyRotationInterval": 60,
            "requireVerifiedParticipants": false,
            "maxLoginAttempts": 5,
            "lockoutDuration": 15,
            "geoBlockEnabled": false,
            "blockedCountries": []
        },
        "blockedIps": [],
        "allowedIps": []
    },
    {
        "id": "6b5f85d17804ceba",
        "name": "Test For Chat",
        "description": "",
        "template": "mixed-host-required",
        "locked": false,
        "creator": "anonymous",
        "createdAt": 1764260621120,
        "settings": {
            "allowedGenders": [
                "male",
                "female",
                "host"
            ],
            "requireHost": true,
            "maxParticipants": null
        },
        "securityConfig": {
            "e2eeEnabled": false,
            "e2eeKeyRotationInterval": 60,
            "requireVerifiedParticipants": false,
            "maxLoginAttempts": 5,
            "lockoutDuration": 15,
            "geoBlockEnabled": false,
            "blockedCountries": []
        },
        "blockedIps": [],
        "allowedIps": []
    },
    {
        "id": "c7e9f62b910eb006",
        "name": "222222222",
        "description": "",
        "template": "brothers-only",
        "locked": false,
        "creator": "anonymous",
        "createdAt": 1764262270451,
        "settings": {
            "allowedGenders": [
                "male",
                "host"
            ],
            "requireHost": false,
            "maxParticipants": null
        },
        "securityConfig": {
            "e2eeEnabled": false,
            "e2eeKeyRotationInterval": 60,
            "requireVerifiedParticipants": false,
            "maxLoginAttempts": 5,
            "lockoutDuration": 15,
            "geoBlockEnabled": false,
            "blockedCountries": []
        },
        "blockedIps": [],
        "allowedIps": []
    },
    {
        "id": "713f358c75571f35",
        "name": "HH",
        "description": "",
        "template": "brothers-only",
        "locked": false,
        "creator": "anonymous",
        "createdAt": 1764268273878,
        "settings": {
            "allowedGenders": [
                "male",
                "host"
            ],
            "requireHost": false,
            "maxParticipants": null
        },
        "securityConfig": {
            "e2eeEnabled": false,
            "e2eeKeyRotationInterval": 60,
            "requireVerifiedParticipants": false,
            "maxLoginAttempts": 5,
            "lockoutDuration": 15,
            "geoBlockEnabled": false,
            "blockedCountries": []
        },
        "blockedIps": [],
        "allowedIps": []
    }
];

// In-memory cache
let roomsCache: Room[] | null = null;
let auditLogsCache: AuditLog[] | null = null;

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        try {
            await fs.mkdir(DATA_DIR, { recursive: true });
        } catch (error) {
            console.warn('Failed to create data directory (expected on Vercel):', error);
        }
    }
}

// Read all rooms from storage
export async function getAllRooms(): Promise<Room[]> {
    // Return cache if available
    if (roomsCache) {
        return roomsCache;
    }

    try {
        await ensureDataDir();
        const data = await fs.readFile(ROOMS_FILE, 'utf-8');
        roomsCache = JSON.parse(data);
        return roomsCache!;
    } catch (error: any) {
        // If file doesn't exist or we can't read it (Vercel), use defaults
        console.log('Using default rooms (file storage unavailable)');
        roomsCache = [...DEFAULT_ROOMS];
        return roomsCache;
    }
}

// Write rooms to storage
async function saveRooms(rooms: Room[]): Promise<void> {
    // Update cache first
    roomsCache = rooms;

    try {
        await ensureDataDir();
        await fs.writeFile(ROOMS_FILE, JSON.stringify(rooms, null, 2), 'utf-8');
    } catch (error) {
        console.warn('Failed to save rooms to file (expected on Vercel):', error);
        // We don't throw here, allowing the app to continue with in-memory updates
    }
}

// Get room by ID
export async function getRoomById(id: string): Promise<Room | null> {
    const rooms = await getAllRooms();
    return rooms.find(room => room.id === id) || null;
}

// Create a new room
export async function createRoom(room: Room): Promise<Room> {
    const rooms = await getAllRooms();

    // Check if room ID already exists
    if (rooms.some(r => r.id === room.id)) {
        throw new Error('Room ID already exists');
    }

    rooms.push(room);
    await saveRooms(rooms);
    return room;
}

// Update a room
export async function updateRoom(id: string, updates: Partial<Room>): Promise<Room | null> {
    const rooms = await getAllRooms();
    const index = rooms.findIndex(room => room.id === id);

    if (index === -1) {
        return null;
    }

    rooms[index] = { ...rooms[index], ...updates };
    await saveRooms(rooms);
    return rooms[index];
}

// Delete a room
export async function deleteRoom(id: string): Promise<boolean> {
    const rooms = await getAllRooms();
    const filteredRooms = rooms.filter(room => room.id !== id);

    if (filteredRooms.length === rooms.length) {
        return false; // Room not found
    }

    await saveRooms(filteredRooms);
    return true;
}

// Audit Logs

export async function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    // Initialize cache if needed
    if (!auditLogsCache) {
        try {
            await ensureDataDir();
            const data = await fs.readFile(AUDIT_LOGS_FILE, 'utf-8');
            auditLogsCache = JSON.parse(data);
        } catch {
            auditLogsCache = [];
        }
    }

    const newLog: AuditLog = {
        ...log,
        id: crypto.randomBytes(8).toString('hex'),
        timestamp: Date.now(),
    };

    auditLogsCache!.push(newLog);

    // Keep only last 10000 logs
    if (auditLogsCache!.length > 10000) {
        auditLogsCache = auditLogsCache!.slice(-10000);
    }

    try {
        await ensureDataDir();
        await fs.writeFile(AUDIT_LOGS_FILE, JSON.stringify(auditLogsCache, null, 2), 'utf-8');
    } catch (error) {
        console.warn('Failed to save audit logs to file (expected on Vercel):', error);
    }

    return newLog;
}

export async function getAuditLogs(
    roomId?: string,
    filters?: {
        action?: string;
        actorName?: string;
        startTime?: number;
        endTime?: number;
        limit?: number;
    }
): Promise<AuditLog[]> {
    // Initialize cache if needed
    if (!auditLogsCache) {
        try {
            await ensureDataDir();
            const data = await fs.readFile(AUDIT_LOGS_FILE, 'utf-8');
            auditLogsCache = JSON.parse(data);
        } catch {
            auditLogsCache = [];
        }
    }

    let logs = [...auditLogsCache!];

    // Apply filters
    if (roomId) {
        logs = logs.filter(log => log.roomId === roomId);
    }

    if (filters?.action) {
        logs = logs.filter(log => log.action === filters.action);
    }

    if (filters?.actorName) {
        logs = logs.filter(log => log.actorName.toLowerCase().includes(filters.actorName!.toLowerCase()));
    }

    if (filters?.startTime) {
        logs = logs.filter(log => log.timestamp >= filters.startTime!);
    }

    if (filters?.endTime) {
        logs = logs.filter(log => log.timestamp <= filters.endTime!);
    }

    // Sort by timestamp descending
    logs.sort((a, b) => b.timestamp - a.timestamp);

    // Apply limit
    if (filters?.limit && filters.limit > 0) {
        logs = logs.slice(0, filters.limit);
    }

    return logs;
}

// Get audit logs statistics
export async function getAuditLogStats(roomId?: string): Promise<{
    totalLogs: number;
    actionCounts: Record<string, number>;
    recentActivity: AuditLog[];
}> {
    const logs = await getAuditLogs(roomId);

    const actionCounts: Record<string, number> = {};
    logs.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
    });

    return {
        totalLogs: logs.length,
        actionCounts,
        recentActivity: logs.slice(0, 10) // Last 10 activities
    };
}

