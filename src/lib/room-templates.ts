import { RoomTemplate, RoomSettings } from '@/types';

export interface TemplateConfig {
    name: string;
    description: string;
    settings: RoomSettings;
    color: string;
    icon: string;
}

export const ROOM_TEMPLATES: Record<RoomTemplate, TemplateConfig> = {
    'brothers-only': {
        name: 'Brothers Only',
        description: 'Male participants only',
        settings: {
            allowedGenders: ['male', 'host'],
            requireHost: false,
            maxParticipants: null,
        },
        color: 'emerald',
        icon: 'users',
    },
    'sisters-only': {
        name: 'Sisters Only',
        description: 'Female participants only',
        settings: {
            allowedGenders: ['female', 'host'],
            requireHost: false,
            maxParticipants: null,
        },
        color: 'rose',
        icon: 'users',
    },
    'mixed-host-required': {
        name: 'Mixed (Host Required)',
        description: 'Both genders, host must be present',
        settings: {
            allowedGenders: ['male', 'female', 'host'],
            requireHost: true,
            maxParticipants: null,
        },
        color: 'amber',
        icon: 'crown',
    },
    'open': {
        name: 'Open',
        description: 'No restrictions',
        settings: {
            allowedGenders: ['male', 'female', 'host'],
            requireHost: false,
            maxParticipants: null,
        },
        color: 'blue',
        icon: 'globe',
    },
};

export function getTemplateSettings(template: RoomTemplate): RoomSettings {
    return ROOM_TEMPLATES[template].settings;
}
