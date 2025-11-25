export type Gender = 'male' | 'female' | 'host';
export type UserRole = 'host' | 'participant';

export interface ParticipantMetadata {
    gender: Gender;
    isHost: boolean;
    isSpotlighted?: boolean;
}
