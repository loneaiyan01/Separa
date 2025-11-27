export type Gender = 'male' | 'female' | 'host';
export type UserRole = 'host' | 'participant';

export interface ParticipantMetadata {
    gender: Gender;
    isHost: boolean;
    isSpotlighted?: boolean;
}

// Room Management Types
export type RoomTemplate = 'brothers-only' | 'sisters-only' | 'mixed-host-required' | 'open';

export interface RoomSettings {
    allowedGenders: Gender[];
    requireHost: boolean;
    maxParticipants: number | null;
    e2ee?: boolean; // New security setting
}

export interface AuditLog {
    id: string;
    roomId: string;
    action: string;
    details: string;
    timestamp: number;
    ipAddress?: string;
}

export interface Room {
    id: string;
    name: string;
    description?: string;
    template: RoomTemplate;
    locked: boolean;
    password?: string; // Room-level password (persistent)
    sessionPassword?: string; // Session-specific password
    blockedIps?: string[];
    creator: string;
    createdAt: number;
    settings: RoomSettings;
}

export interface CreateRoomRequest {
    name: string;
    description: string;
    template: RoomTemplate;
    locked: boolean;
    password?: string;
    sessionPassword?: string;
    creator: string;
}

export interface UpdateRoomRequest {
    name?: string;
    description?: string;
    locked?: boolean;
    password?: string;
    sessionPassword?: string;
    blockedIps?: string[];
    settings?: Partial<RoomSettings>;
}
