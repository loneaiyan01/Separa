import { Room, AuditLog } from '@/types';
import fs from 'fs/promises';
import path from 'path';

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
        id: Math.random().toString(36).substring(2, 15),
        timestamp: Date.now(),
    };

    logs.push(newLog);
    // Keep only last 1000 logs
    if (logs.length > 1000) {
        logs = logs.slice(-1000);
    }

    await fs.writeFile(AUDIT_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
    return newLog;
}

export async function getAuditLogs(roomId?: string): Promise<AuditLog[]> {
    await ensureDataDir();
    try {
        const data = await fs.readFile(AUDIT_LOGS_FILE, 'utf-8');
        const logs: AuditLog[] = JSON.parse(data);
        if (roomId) {
            return logs.filter(log => log.roomId === roomId).sort((a, b) => b.timestamp - a.timestamp);
        }
        return logs.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error: any) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
}
