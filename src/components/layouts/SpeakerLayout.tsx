'use client';

import { TrackReferenceOrPlaceholder, ParticipantTile } from '@livekit/components-react';
import { Track } from 'livekit-client';
import MonogramPlaceholder from '../MonogramPlaceholder';

interface SpeakerLayoutProps {
  tracks: TrackReferenceOrPlaceholder[];
  isMobile?: boolean;
}

export default function SpeakerLayout({ tracks, isMobile = false }: SpeakerLayoutProps) {
  // Find the active speaker or screen share
  const screenShare = tracks.find(
    (track) => track.publication?.source === Track.Source.ScreenShare
  );

  // If there's a screen share, prioritize it
  const primaryTrack = screenShare || tracks.find((track) => {
    const participant = track.participant;
    return participant?.isSpeaking || participant?.isLocal;
  }) || tracks[0];

  // Get other participants (thumbnails)
  const thumbnailTracks = tracks.filter(
    (track) => track.participant !== primaryTrack?.participant
  );

  return (
    <div className="w-full h-full flex flex-col gap-3 p-3 animate-fade-in">
      {/* Main Speaker View */}
      <div className="flex-1 rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-800/50 relative min-h-0 shadow-xl">
        {primaryTrack && (
          <ParticipantTile
            trackRef={primaryTrack}
            {...primaryTrack}
            className="relative"
          >
            <MonogramPlaceholder />
          </ParticipantTile>
        )}
        {screenShare && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-sm z-10 shadow-lg animate-scale-in">
            🖥️ Screen Share
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {thumbnailTracks.length > 0 && (
        <div className={`flex gap-3 ${isMobile ? 'flex-wrap justify-center' : ''} overflow-x-auto pb-2 custom-scrollbar`}>
          {thumbnailTracks.map((track, index) => (
            <div
              key={track.participant.identity + index}
              className={`
                ${isMobile ? 'w-24 h-24' : 'w-32 h-32'}
                flex-shrink-0 rounded-xl overflow-hidden bg-slate-900/50 border border-slate-800/50
                hover:ring-2 hover:ring-primary hover:scale-105 transition-all cursor-pointer shadow-lg relative
              `}
            >
              <ParticipantTile
                trackRef={track}
                {...track}
                className="relative"
              >
                <MonogramPlaceholder />
              </ParticipantTile>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
