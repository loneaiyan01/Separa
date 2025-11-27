import { NextRequest, NextResponse } from 'next/server';
import { getRoomById, updateRoom, addAuditLog } from '@/lib/storage';
import { extractClientIp, isValidIp, cleanExpiredBans, validateSecurityConfig } from '@/lib/security';
import { IPBan, BlockIPRequest } from '@/types';

/**
 * POST /api/rooms/[roomId]/security
 * Manage room security settings
 * Actions: block_ip, unblock_ip, update_security_config, set_session_password
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;
        const body = await req.json();
        const { action, actorName, ...data } = body;

        if (!actorName) {
            return NextResponse.json(
                { error: 'Actor name is required' },
                { status: 400 }
            );
        }

        const room = await getRoomById(roomId);
        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        const clientIp = extractClientIp(req.headers);

        switch (action) {
            case 'block_ip': {
                const { ip, reason, expiresAt }: BlockIPRequest = data;

                if (!ip || !isValidIp(ip)) {
                    return NextResponse.json(
                        { error: 'Valid IP address is required' },
                        { status: 400 }
                    );
                }

                const blockedIps = room.blockedIps || [];
                
                // Check if IP is already blocked
                const existingBan = blockedIps.find(ban => ban.ip === ip);
                if (existingBan) {
                    return NextResponse.json(
                        { error: 'IP is already blocked' },
                        { status: 400 }
                    );
                }

                const newBan: IPBan = {
                    ip,
                    reason: reason || 'No reason provided',
                    bannedAt: Date.now(),
                    bannedBy: actorName,
                    expiresAt
                };

                blockedIps.push(newBan);

                await updateRoom(roomId, { blockedIps });

                // Log the action
                await addAuditLog({
                    roomId,
                    action: 'ip_blocked',
                    actorName,
                    targetName: ip,
                    details: `IP ${ip} blocked. Reason: ${reason || 'No reason provided'}`,
                    ipAddress: clientIp,
                    metadata: { blockedIp: ip, reason, expiresAt }
                });

                return NextResponse.json({
                    success: true,
                    message: 'IP blocked successfully',
                    ban: newBan
                });
            }

            case 'unblock_ip': {
                const { ip } = data;

                if (!ip || !isValidIp(ip)) {
                    return NextResponse.json(
                        { error: 'Valid IP address is required' },
                        { status: 400 }
                    );
                }

                let blockedIps = room.blockedIps || [];
                const originalLength = blockedIps.length;
                
                blockedIps = blockedIps.filter(ban => ban.ip !== ip);

                if (blockedIps.length === originalLength) {
                    return NextResponse.json(
                        { error: 'IP is not blocked' },
                        { status: 404 }
                    );
                }

                await updateRoom(roomId, { blockedIps });

                // Log the action
                await addAuditLog({
                    roomId,
                    action: 'ip_unblocked',
                    actorName,
                    targetName: ip,
                    details: `IP ${ip} unblocked`,
                    ipAddress: clientIp,
                    metadata: { unblockedIp: ip }
                });

                return NextResponse.json({
                    success: true,
                    message: 'IP unblocked successfully'
                });
            }

            case 'clean_expired_bans': {
                const blockedIps = room.blockedIps || [];
                const cleanedBans = cleanExpiredBans(blockedIps);
                const removedCount = blockedIps.length - cleanedBans.length;

                if (removedCount > 0) {
                    await updateRoom(roomId, { blockedIps: cleanedBans });

                    await addAuditLog({
                        roomId,
                        action: 'settings_updated',
                        actorName,
                        details: `Cleaned ${removedCount} expired IP ban(s)`,
                        ipAddress: clientIp
                    });
                }

                return NextResponse.json({
                    success: true,
                    message: `Removed ${removedCount} expired ban(s)`,
                    removedCount
                });
            }

            case 'add_allowed_ip': {
                const { ip } = data;

                if (!ip || !isValidIp(ip)) {
                    return NextResponse.json(
                        { error: 'Valid IP address is required' },
                        { status: 400 }
                    );
                }

                const allowedIps = room.allowedIps || [];
                
                if (allowedIps.includes(ip)) {
                    return NextResponse.json(
                        { error: 'IP is already whitelisted' },
                        { status: 400 }
                    );
                }

                allowedIps.push(ip);
                await updateRoom(roomId, { allowedIps });

                await addAuditLog({
                    roomId,
                    action: 'settings_updated',
                    actorName,
                    details: `IP ${ip} added to whitelist`,
                    ipAddress: clientIp,
                    metadata: { whitelistedIp: ip }
                });

                return NextResponse.json({
                    success: true,
                    message: 'IP whitelisted successfully'
                });
            }

            case 'remove_allowed_ip': {
                const { ip } = data;

                if (!ip) {
                    return NextResponse.json(
                        { error: 'IP address is required' },
                        { status: 400 }
                    );
                }

                let allowedIps = room.allowedIps || [];
                const originalLength = allowedIps.length;
                
                allowedIps = allowedIps.filter(allowedIp => allowedIp !== ip);

                if (allowedIps.length === originalLength) {
                    return NextResponse.json(
                        { error: 'IP is not in whitelist' },
                        { status: 404 }
                    );
                }

                await updateRoom(roomId, { allowedIps });

                await addAuditLog({
                    roomId,
                    action: 'settings_updated',
                    actorName,
                    details: `IP ${ip} removed from whitelist`,
                    ipAddress: clientIp,
                    metadata: { removedIp: ip }
                });

                return NextResponse.json({
                    success: true,
                    message: 'IP removed from whitelist'
                });
            }

            case 'update_security_config': {
                const { securityConfig } = data;

                if (!securityConfig) {
                    return NextResponse.json(
                        { error: 'Security configuration is required' },
                        { status: 400 }
                    );
                }

                // Validate security config
                const validation = validateSecurityConfig(securityConfig);
                if (!validation.valid) {
                    return NextResponse.json(
                        { error: 'Invalid security configuration', details: validation.errors },
                        { status: 400 }
                    );
                }

                const updatedConfig = {
                    ...room.securityConfig,
                    ...securityConfig
                };

                await updateRoom(roomId, { securityConfig: updatedConfig });

                // Log E2EE changes specifically
                if (securityConfig.e2eeEnabled !== undefined) {
                    await addAuditLog({
                        roomId,
                        action: securityConfig.e2eeEnabled ? 'e2ee_enabled' : 'e2ee_disabled',
                        actorName,
                        details: `End-to-end encryption ${securityConfig.e2eeEnabled ? 'enabled' : 'disabled'}`,
                        ipAddress: clientIp
                    });
                }

                await addAuditLog({
                    roomId,
                    action: 'settings_updated',
                    actorName,
                    details: 'Security configuration updated',
                    ipAddress: clientIp,
                    metadata: { securityConfig }
                });

                return NextResponse.json({
                    success: true,
                    message: 'Security configuration updated',
                    securityConfig: updatedConfig
                });
            }

            case 'set_session_password': {
                const { password, expiryMinutes } = data;

                if (!password) {
                    return NextResponse.json(
                        { error: 'Password is required' },
                        { status: 400 }
                    );
                }

                const crypto = require('crypto');
                const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

                let sessionPasswordExpiry: number | undefined;
                if (expiryMinutes && expiryMinutes > 0) {
                    sessionPasswordExpiry = Date.now() + (expiryMinutes * 60 * 1000);
                }

                await updateRoom(roomId, {
                    sessionPassword: hashedPassword,
                    sessionPasswordExpiry
                });

                await addAuditLog({
                    roomId,
                    action: 'session_password_set',
                    actorName,
                    details: expiryMinutes 
                        ? `Session password set with ${expiryMinutes} minute(s) expiry`
                        : 'Session password set (no expiry)',
                    ipAddress: clientIp,
                    metadata: { expiryMinutes }
                });

                return NextResponse.json({
                    success: true,
                    message: 'Session password set successfully',
                    expiresAt: sessionPasswordExpiry
                });
            }

            case 'remove_session_password': {
                await updateRoom(roomId, {
                    sessionPassword: undefined,
                    sessionPasswordExpiry: undefined
                });

                await addAuditLog({
                    roomId,
                    action: 'settings_updated',
                    actorName,
                    details: 'Session password removed',
                    ipAddress: clientIp
                });

                return NextResponse.json({
                    success: true,
                    message: 'Session password removed'
                });
            }

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Error managing room security:', error);
        return NextResponse.json(
            { error: 'Failed to manage room security' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/rooms/[roomId]/security
 * Get security information for a room (sanitized)
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ roomId: string }> }
) {
    try {
        const { roomId } = await params;
        const room = await getRoomById(roomId);

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            );
        }

        // Clean expired bans before returning
        const blockedIps = cleanExpiredBans(room.blockedIps || []);

        return NextResponse.json({
            blockedIps: blockedIps.map(ban => ({
                ip: ban.ip,
                reason: ban.reason,
                bannedAt: ban.bannedAt,
                expiresAt: ban.expiresAt
            })),
            allowedIps: room.allowedIps || [],
            hasSessionPassword: !!room.sessionPassword,
            sessionPasswordExpiry: room.sessionPasswordExpiry,
            securityConfig: room.securityConfig || {
                e2eeEnabled: false,
                maxLoginAttempts: 5,
                lockoutDuration: 15
            }
        });
    } catch (error) {
        console.error('Error fetching room security:', error);
        return NextResponse.json(
            { error: 'Failed to fetch room security' },
            { status: 500 }
        );
    }
}
