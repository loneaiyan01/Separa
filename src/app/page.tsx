"use client"
import { useState } from 'react';
import LobbySelection from '@/components/LobbySelection';
import VideoRoom from '@/components/VideoRoom';
import { Gender } from '@/types';

export default function Home() {
    const [token, setToken] = useState('');
    const [userGender, setUserGender] = useState<Gender>('male');
    const [isHost, setIsHost] = useState(false);

    const handleJoin = async (name: string, gender: Gender, host: boolean) => {
        try {
            const res = await fetch('/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomName: 'separa-demo',
                    participantName: name,
                    gender: gender,
                    isHost: host,
                }),
            });
            const data = await res.json();
            setToken(data.token);
            setUserGender(gender);
            setIsHost(host);
        } catch (e) {
            console.error(e);
            alert('Failed to join room');
        }
    };

    const handleLeave = () => {
        setToken('');
        setIsHost(false);
    };

    if (token) {
        return (
            <VideoRoom
                token={token}
                userGender={userGender}
                isHost={isHost}
                onLeave={handleLeave}
                roomName="separa-demo"
            />
        );
    }

    return <LobbySelection onJoin={handleJoin} />;
}
