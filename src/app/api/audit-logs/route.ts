import { NextRequest, NextResponse } from 'next/server';
import { getAuditLogs, getAuditLogStats } from '@/lib/storage';
import { AuditAction } from '@/types';

/**
 * GET /api/audit-logs
 * Fetch audit logs with optional filters
 * Query params:
 * - roomId: Filter by room ID
 * - action: Filter by action type
 * - actorName: Filter by actor name
 * - startTime: Filter by start timestamp
 * - endTime: Filter by end timestamp
 * - limit: Limit number of results
 * - stats: Return statistics instead of logs (true/false)
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        
        const roomId = searchParams.get('roomId') || undefined;
        const action = searchParams.get('action') as AuditAction | undefined;
        const actorName = searchParams.get('actorName') || undefined;
        const startTime = searchParams.get('startTime') ? parseInt(searchParams.get('startTime')!) : undefined;
        const endTime = searchParams.get('endTime') ? parseInt(searchParams.get('endTime')!) : undefined;
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
        const stats = searchParams.get('stats') === 'true';

        // Return statistics if requested
        if (stats) {
            const statistics = await getAuditLogStats(roomId);
            return NextResponse.json(statistics);
        }

        // Return filtered logs
        const logs = await getAuditLogs(roomId, {
            action,
            actorName,
            startTime,
            endTime,
            limit
        });

        return NextResponse.json({
            logs,
            count: logs.length,
            filters: {
                roomId,
                action,
                actorName,
                startTime,
                endTime,
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch audit logs' },
            { status: 500 }
        );
    }
}
