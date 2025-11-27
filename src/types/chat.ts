import { Gender } from './index';

export type MessageType = 'public' | 'private' | 'system';
export type FileType = 'image' | 'document';

export interface FileAttachment {
    name: string;
    type: FileType;
    size: number;
    data: string; // base64 encoded data URL
    mimeType: string;
}

export interface ChatMessage {
    id: string;
    type: MessageType;
    senderId: string;
    senderName: string;
    senderGender: Gender;
    content: string;
    timestamp: number;
    recipientId?: string; // For private messages (host ID)
    file?: FileAttachment;
    isAnonymous?: boolean; // True for sister private messages to host
    deleted?: boolean; // For moderation
}

export interface TypingIndicator {
    userId: string;
    userName: string;
    timestamp: number;
}

export interface ChatModerationAction {
    action: 'delete_message' | 'mute_user' | 'unmute_user';
    targetId: string; // Message ID or User ID
    moderatorId: string;
    moderatorName: string;
    reason?: string;
    timestamp: number;
}

export interface MutedUser {
    userId: string;
    userName: string;
    mutedAt: number;
    mutedBy: string;
    reason?: string;
    expiresAt?: number; // Optional expiration
}

export interface ChatState {
    messages: ChatMessage[];
    mutedUsers: MutedUser[];
    typingUsers: TypingIndicator[];
}
