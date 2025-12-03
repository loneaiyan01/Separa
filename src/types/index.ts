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

export type AuditAction =
    | 'room_created'
    | 'room_updated'
    | 'room_deleted'
    | 'participant_joined'
    | 'participant_left'
    | 'participant_kicked'
    | 'participant_banned'
    | 'ip_blocked'
    | 'ip_unblocked'
    | 'password_changed'
    | 'session_password_set'
    | 'settings_updated'
    | 'spotlight_granted'
    | 'spotlight_revoked'
    | 'e2ee_enabled'
    | 'e2ee_disabled';

export interface AuditLog {
    id: string;
    roomId: string;
    action: AuditAction;
    actorName: string; // Who performed the action
    actorIdentity?: string; // LiveKit identity if available
    targetName?: string; // Who was affected (for kicks, bans, etc.)
    details: string;
    timestamp: number;
    ipAddress?: string;
    metadata?: Record<string, any>; // Additional context
}

export interface IPBan {
    ip: string;
    reason?: string;
    bannedAt: number;
    bannedBy: string;
    expiresAt?: number; // Optional expiration timestamp
}

export interface SecurityConfig {
    e2eeEnabled: boolean;
    e2eeKeyRotationInterval?: number; // in minutes
    requireVerifiedParticipants?: boolean;
    maxLoginAttempts?: number;
    lockoutDuration?: number; // in minutes
    allowedIpRanges?: string[]; // CIDR notation
    geoBlockEnabled?: boolean;
    blockedCountries?: string[];
}

export interface HostConsoleSettings {
    allowBrothers: boolean;
    allowSisters: boolean;
    autoMediaOff: boolean;
    requirePassword: boolean;
    sisterPassword?: string; // Hashed
}

export interface Room {
    id: string;
    name: string;
    description?: string;
    template: RoomTemplate;
    locked: boolean;
    password?: string; // Room-level password (persistent, hashed)
    sessionPassword?: string; // Session-specific password (hashed)
    sessionPasswordExpiry?: number; // Timestamp when session password expires
    blockedIps?: IPBan[]; // Enhanced with metadata
    allowedIps?: string[]; // Whitelist IPs (overrides blocks)
    creator: string;
    createdAt: number;
    settings: RoomSettings;
    securityConfig?: SecurityConfig;
    hostConsoleSettings?: HostConsoleSettings;
    failedLoginAttempts?: Map<string, { count: number; lastAttempt: number }>; // IP -> attempts
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
    sessionPasswordExpiry?: number;
    blockedIps?: IPBan[];
    allowedIps?: string[];
    settings?: Partial<RoomSettings>;
    securityConfig?: Partial<SecurityConfig>;
}

export interface BlockIPRequest {
    ip: string;
    reason?: string;
    expiresAt?: number;
}

export interface AuditLogQuery {
    roomId?: string;
    action?: AuditAction;
    actorName?: string;
    startTime?: number;
    endTime?: number;
    limit?: number;
}
