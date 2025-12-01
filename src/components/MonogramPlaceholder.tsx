import { useParticipantContext, useIsSpeaking } from '@livekit/components-react';
import { useMemo } from 'react';
import { ParticipantMetadata } from '@/types';

export default function MonogramPlaceholder() {
    const participant = useParticipantContext();
    const isSpeaking = useIsSpeaking(participant);

    const { initials, colorClass, name, isCameraOff } = useMemo(() => {
        if (!participant) return { initials: '', colorClass: '', name: '', isCameraOff: false };

        const name = participant.name || participant.identity || 'Unknown';
        const initials = name
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();

        let gender = 'male';
        if (participant.metadata) {
            try {
                const meta = JSON.parse(participant.metadata) as ParticipantMetadata;
                gender = meta.gender;
            } catch (e) {
                // ignore
            }
        }

        const colorClass = gender === 'female' ? 'role-sister' : 'role-brother';
        const isCameraOff = !participant.isCameraEnabled;

        return { initials, colorClass, name, isCameraOff };
    }, [participant, participant?.metadata, participant?.isCameraEnabled, participant?.name, participant?.identity]);

    if (!participant || !isCameraOff) return null;

    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950">
            <div
                className={`avatar-circle w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-xl relative z-10 transition-all duration-300 ${colorClass}`}
                style={{
                    transform: isSpeaking ? 'scale(1.1)' : 'scale(1)',
                    boxShadow: isSpeaking ? '0 0 0 4px rgba(255, 255, 255, 0.2)' : 'none'
                }}
            >
                {initials}
            </div>
            <div className="user-name-label text-lg font-medium text-white/90 shadow-sm">
                {name}
            </div>
            <style jsx global>{`
                .avatar-circle.role-brother {
                    background: linear-gradient(135deg, #0f766e, #115e59);
                    box-shadow: 0 0 0 1px rgba(0, 240, 255, 0.2);
                }
                .avatar-circle.role-sister {
                    background: linear-gradient(135deg, #be123c, #881337);
                    box-shadow: 0 0 0 1px rgba(255, 0, 85, 0.2);
                }
            `}</style>
        </div>
    );
}
