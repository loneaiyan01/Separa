/**
 * Connection Recovery Utilities
 * Helpers for managing connection state, quality monitoring, and reconnection logic
 */

export type ConnectionQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'disconnected';

export interface ConnectionMetrics {
    packetLoss: number;
    latency: number;
    jitter: number;
}

/**
 * Calculate connection quality based on metrics
 */
export function getConnectionQuality(metrics: ConnectionMetrics): ConnectionQuality {
    const { packetLoss, latency } = metrics;

    if (packetLoss > 10 || latency > 500) return 'poor';
    if (packetLoss > 5 || latency > 300) return 'fair';
    if (packetLoss > 2 || latency > 150) return 'good';
    return 'excellent';
}

/**
 * Calculate reconnection delay with exponential backoff and jitter
 */
export function getReconnectionDelay(attemptNumber: number, baseDelay: number = 1000): number {
    const maxDelay = 30000; // 30 seconds max
    const exponentialDelay = Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);

    // Add jitter (±25% randomness) to prevent thundering herd
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);

    return Math.floor(exponentialDelay + jitter);
}

/**
 * Format connection quality for display
 */
export function formatConnectionQuality(quality: ConnectionQuality): {
    label: string;
    color: string;
    icon: string;
} {
    switch (quality) {
        case 'excellent':
            return { label: 'Excellent', color: 'text-emerald-400', icon: '●●●●' };
        case 'good':
            return { label: 'Good', color: 'text-green-400', icon: '●●●○' };
        case 'fair':
            return { label: 'Fair', color: 'text-yellow-400', icon: '●●○○' };
        case 'poor':
            return { label: 'Poor', color: 'text-orange-400', icon: '●○○○' };
        case 'disconnected':
            return { label: 'Disconnected', color: 'text-red-400', icon: '○○○○' };
    }
}

/**
 * Session state for preservation during reconnection
 */
export interface SessionState {
    spotlightedParticipants: Set<string>;
    participantMetadata: Map<string, any>;
    lastUpdateTime: number;
}

/**
 * Save session state to sessionStorage
 */
export function saveSessionState(roomName: string, state: SessionState): void {
    try {
        const serialized = {
            spotlightedParticipants: Array.from(state.spotlightedParticipants),
            participantMetadata: Array.from(state.participantMetadata.entries()),
            lastUpdateTime: state.lastUpdateTime,
        };
        sessionStorage.setItem(`separa_session_${roomName}`, JSON.stringify(serialized));
    } catch (error) {
        console.error('Failed to save session state:', error);
    }
}

/**
 * Restore session state from sessionStorage
 */
export function restoreSessionState(roomName: string): SessionState | null {
    try {
        const stored = sessionStorage.getItem(`separa_session_${roomName}`);
        if (!stored) return null;

        const parsed = JSON.parse(stored);
        return {
            spotlightedParticipants: new Set(parsed.spotlightedParticipants),
            participantMetadata: new Map(parsed.participantMetadata),
            lastUpdateTime: parsed.lastUpdateTime,
        };
    } catch (error) {
        console.error('Failed to restore session state:', error);
        return null;
    }
}

/**
 * Clear session state
 */
export function clearSessionState(roomName: string): void {
    try {
        sessionStorage.removeItem(`separa_session_${roomName}`);
    } catch (error) {
        console.error('Failed to clear session state:', error);
    }
}

/**
 * Log connection event for debugging
 */
export function logConnectionEvent(event: string, details?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[Connection ${timestamp}] ${event}`, details || '');
}
