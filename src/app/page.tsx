"use client"
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import LobbySelection from '@/components/LobbySelection';
import VideoRoom from '@/components/VideoRoom';
import { Gender } from '@/types';

export default function Home() {
    const searchParams = useSearchParams();
    const roomId = searchParams.get('room');

    const [token, setToken] = useState('');
    const [userGender, setUserGender] = useState<Gender>('male');
    const [isHost, setIsHost] = useState(false);
    const [roomName, setRoomName] = useState('');
    const [currentRoomId, setCurrentRoomId] = useState<string | undefined>(undefined);
    const [roomDisplayName, setRoomDisplayName] = useState<string | undefined>(undefined);

    // Fetch room details if roomId is in URL
    useEffect(() => {
        if (roomId) {
            fetchRoomDetails(roomId);
        }
    }, [roomId]);

    const fetchRoomDetails = async (id: string) => {
        try {
            const res = await fetch(`/api/rooms/${id}`);
            if (res.ok) {
                const room = await res.json();
                setRoomDisplayName(room.name);
                setCurrentRoomId(id);
            }
        } catch (error) {
            console.error('Error fetching room details:', error);
        }
    };

    const handleJoin = async (name: string, gender: Gender, host: boolean, roomPassword?: string) => {
        try {
            const res = await fetch('/api/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    roomId: currentRoomId,
                    participantName: name,
                    gender: gender,
                    isHost: host,
                    roomPassword: roomPassword,
                }),
            });

            if (!res.ok) {
                const error = await res.json();
                alert(error.error || 'Failed to join room');
                return;
            }

            const data = await res.json();
            setToken(data.token);
            setUserGender(gender);
            setIsHost(host);

            // Set room name from response or use display name
            if (data.room) {
                setRoomName(data.room.name);
            } else {
                setRoomName(roomDisplayName || 'separa-demo');
            }
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
                roomName={roomName}
            />
        );
    }

    return (
        <LobbySelection
            onJoin={handleJoin}
            roomId={currentRoomId}
            roomName={roomDisplayName}
        />
    );
}
