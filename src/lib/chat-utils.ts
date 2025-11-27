/**
 * Chat Utility Functions
 * Helpers for message filtering, file handling, and chat operations
 */

import { Gender } from '@/types';
import { ChatMessage, FileAttachment, FileType } from '@/types/chat';

/**
 * Determine if a viewer can see a message based on gender filtering rules
 */
export function canSeeMessage(
    message: ChatMessage,
    viewerGender: Gender,
    viewerId: string,
    isHost: boolean
): boolean {
    // System messages are visible to all
    if (message.type === 'system') return true;

    // Private messages only visible to sender and recipient
    if (message.type === 'private') {
        return message.senderId === viewerId || message.recipientId === viewerId;
    }

    // Deleted messages are not visible
    if (message.deleted) return false;

    // Host sees all public messages
    if (isHost) return true;

    // Everyone sees host messages
    if (message.senderGender === 'host') return true;

    // Gender-based filtering for public messages
    if (viewerGender === 'male' && message.senderGender === 'male') return true;
    if (viewerGender === 'female' && message.senderGender === 'female') return true;

    return false;
}

/**
 * Filter messages array based on viewer's permissions
 */
export function filterMessages(
    messages: ChatMessage[],
    viewerGender: Gender,
    viewerId: string,
    isHost: boolean
): ChatMessage[] {
    return messages.filter(msg => canSeeMessage(msg, viewerGender, viewerId, isHost));
}

/**
 * Format file size to human-readable string
 */
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Validate file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 5 * 1024 * 1024; // 5MB

    // Check file size
    if (file.size > maxSize) {
        return { valid: false, error: 'File size exceeds 5MB limit' };
    }

    // Allowed file types
    const allowedTypes = [
        // Images
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        // Documents
        'application/pdf',
        'text/plain',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'File type not supported. Allowed: images (jpg, png, gif, webp) and documents (pdf, txt, docx)' };
    }

    return { valid: true };
}

/**
 * Convert file to base64 data URL
 */
export function encodeFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to encode file'));
            }
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

/**
 * Get file type category from MIME type
 */
export function getFileType(mimeType: string): FileType {
    if (mimeType.startsWith('image/')) {
        return 'image';
    }
    return 'document';
}

/**
 * Sanitize message content to prevent XSS
 */
export function sanitizeMessage(content: string): string {
    // Remove HTML tags
    const withoutTags = content.replace(/<[^>]*>/g, '');

    // Escape special characters
    const escaped = withoutTags
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');

    return escaped.trim();
}

/**
 * Generate unique message ID
 */
export function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if user is muted
 */
export function isUserMuted(userId: string, mutedUsers: Array<{ userId: string; expiresAt?: number }>): boolean {
    const mutedUser = mutedUsers.find(mu => mu.userId === userId);

    if (!mutedUser) return false;

    // Check if mute has expired
    if (mutedUser.expiresAt && mutedUser.expiresAt < Date.now()) {
        return false;
    }

    return true;
}

/**
 * Format timestamp to readable time
 */
export function formatMessageTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Create anonymous sender name for sister private messages
 */
export function getAnonymousSenderName(senderGender: Gender, isAnonymous: boolean): string {
    if (isAnonymous && senderGender === 'female') {
        return 'Anonymous Sister';
    }
    return ''; // Will use actual name
}

/**
 * Download file from base64 data URL
 */
export function downloadFile(dataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
