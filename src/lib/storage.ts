import { Room, AuditLog } from '@/types';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const DATA_DIR = path.join(process.cwd(), 'data');
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Read all rooms from storage
export async function getAllRooms(): Promise<Room[]> {
    await ensureDataDir();

    try {
        const data = await fs.readFile(ROOMS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (error: any) {
        // If file doesn't exist, return empty array
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

// Write rooms to storage
async function saveRooms(rooms: Room[]): Promise<void> {
    await ensureDataDir();
    await fs.writeFile(ROOMS_FILE, JSON.stringify(rooms, null, 2), 'utf-8');
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
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit-logs.json');

export async function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    await ensureDataDir();

    let logs: AuditLog[] = [];
    try {
        const data = await fs.readFile(AUDIT_LOGS_FILE, 'utf-8');
        logs = JSON.parse(data);
    } catch (error: any) {
        if (error.code !== 'ENOENT') throw error;
    }

    const newLog: AuditLog = {
        ...log,
        id: crypto.randomBytes(8).toString('hex'),
        timestamp: Date.now(),
    };

    logs.push(newLog);
    // Keep only last 10000 logs (increased for better audit trail)
    if (logs.length > 10000) {
        logs = logs.slice(-10000);
    }

    await fs.writeFile(AUDIT_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
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
    await ensureDataDir();
    try {
        const data = await fs.readFile(AUDIT_LOGS_FILE, 'utf-8');
        let logs: AuditLog[] = JSON.parse(data);

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
    } catch (error: any) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
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
