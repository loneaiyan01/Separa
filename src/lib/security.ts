import crypto from 'crypto';
import { IPBan, SecurityConfig } from '@/types';

/**
 * Hash a password using SHA-256
 */
export function hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hash: string): boolean {
    return hashPassword(password) === hash;
}

/**
 * Generate a secure random token
 */
export function generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate a room ID
 */
export function generateRoomId(): string {
    return crypto.randomBytes(8).toString('hex');
}

/**
 * Check if an IP is blocked
 * @param ip - IP address to check
 * @param blockedIps - Array of IP bans
 * @param allowedIps - Whitelist of allowed IPs (overrides blocks)
 * @returns true if IP is blocked, false otherwise
 */
export function isIpBlocked(
    ip: string,
    blockedIps?: IPBan[],
    allowedIps?: string[]
): { blocked: boolean; reason?: string } {
    // Check whitelist first - whitelisted IPs bypass all blocks
    if (allowedIps && allowedIps.includes(ip)) {
        return { blocked: false };
    }

    if (!blockedIps || blockedIps.length === 0) {
        return { blocked: false };
    }

    const now = Date.now();
    
    for (const ban of blockedIps) {
        if (ban.ip === ip) {
            // Check if ban has expired
            if (ban.expiresAt && ban.expiresAt < now) {
                continue; // Ban expired, skip
            }
            return { blocked: true, reason: ban.reason };
        }
    }

    return { blocked: false };
}

/**
 * Clean up expired IP bans
 */
export function cleanExpiredBans(blockedIps: IPBan[]): IPBan[] {
    const now = Date.now();
    return blockedIps.filter(ban => !ban.expiresAt || ban.expiresAt > now);
}

/**
 * Check if session password has expired
 */
export function isSessionPasswordExpired(expiryTimestamp?: number): boolean {
    if (!expiryTimestamp) return false;
    return Date.now() > expiryTimestamp;
}

/**
 * Rate limiting for login attempts
 */
export function checkRateLimiting(
    ip: string,
    failedAttempts: Map<string, { count: number; lastAttempt: number }>,
    maxAttempts: number = 5,
    lockoutDuration: number = 15 // minutes
): { allowed: boolean; remainingAttempts?: number; lockedUntil?: number } {
    const attempt = failedAttempts.get(ip);
    
    if (!attempt) {
        return { allowed: true, remainingAttempts: maxAttempts };
    }

    const now = Date.now();
    const lockoutMs = lockoutDuration * 60 * 1000;
    const timeSinceLastAttempt = now - attempt.lastAttempt;

    // Reset if lockout period has passed
    if (timeSinceLastAttempt > lockoutMs) {
        failedAttempts.delete(ip);
        return { allowed: true, remainingAttempts: maxAttempts };
    }

    // Check if still locked out
    if (attempt.count >= maxAttempts) {
        const lockedUntil = attempt.lastAttempt + lockoutMs;
        return { allowed: false, lockedUntil };
    }

    return {
        allowed: true,
        remainingAttempts: maxAttempts - attempt.count
    };
}

/**
 * Record a failed login attempt
 */
export function recordFailedAttempt(
    ip: string,
    failedAttempts: Map<string, { count: number; lastAttempt: number }>
): void {
    const attempt = failedAttempts.get(ip);
    const now = Date.now();

    if (attempt) {
        failedAttempts.set(ip, {
            count: attempt.count + 1,
            lastAttempt: now
        });
    } else {
        failedAttempts.set(ip, {
            count: 1,
            lastAttempt: now
        });
    }
}

/**
 * Clear failed attempts for an IP (on successful login)
 */
export function clearFailedAttempts(
    ip: string,
    failedAttempts: Map<string, { count: number; lastAttempt: number }>
): void {
    failedAttempts.delete(ip);
}

/**
 * Validate IP address format
 */
export function isValidIp(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Sanitize input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
    return input.replace(/[<>\"']/g, '');
}

/**
 * Extract client IP from request headers
 */
export function extractClientIp(headers: Headers): string {
    // Check common proxy headers in order of preference
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
        // x-forwarded-for can contain multiple IPs, take the first one
        return forwardedFor.split(',')[0].trim();
    }

    const realIp = headers.get('x-real-ip');
    if (realIp) {
        return realIp.trim();
    }

    const cfConnectingIp = headers.get('cf-connecting-ip'); // Cloudflare
    if (cfConnectingIp) {
        return cfConnectingIp.trim();
    }

    // Fallback to localhost (for development)
    return '127.0.0.1';
}

/**
 * Get default security configuration
 */
export function getDefaultSecurityConfig(): SecurityConfig {
    return {
        e2eeEnabled: false,
        e2eeKeyRotationInterval: 60, // 1 hour
        requireVerifiedParticipants: false,
        maxLoginAttempts: 5,
        lockoutDuration: 15, // 15 minutes
        geoBlockEnabled: false,
        blockedCountries: []
    };
}

/**
 * Validate security configuration
 */
export function validateSecurityConfig(config: Partial<SecurityConfig>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.maxLoginAttempts !== undefined && config.maxLoginAttempts < 1) {
        errors.push('maxLoginAttempts must be at least 1');
    }

    if (config.lockoutDuration !== undefined && config.lockoutDuration < 1) {
        errors.push('lockoutDuration must be at least 1 minute');
    }

    if (config.e2eeKeyRotationInterval !== undefined && config.e2eeKeyRotationInterval < 5) {
        errors.push('e2eeKeyRotationInterval must be at least 5 minutes');
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Generate E2EE key material (for future implementation)
 */
export function generateE2EEKey(): string {
    return crypto.randomBytes(32).toString('base64');
}
