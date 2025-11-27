'use client';

import { useState } from 'react';
import { TrackReferenceOrPlaceholder, ParticipantTile } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { Maximize2, Minimize2 } from 'lucide-react';

interface PiPLayoutProps {
  tracks: TrackReferenceOrPlaceholder[];
  isMobile?: boolean;
}

type PiPPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export default function PiPLayout({ tracks, isMobile = false }: PiPLayoutProps) {
  const [pipPosition, setPipPosition] = useState<PiPPosition>('bottom-right');
  const [pipExpanded, setPipExpanded] = useState(false);

  // Find the active speaker or screen share for main view
  const screenShare = tracks.find(
    (track) => track.publication?.source === Track.Source.ScreenShare
  );
  
  const primaryTrack = screenShare || tracks.find((track) => {
    const participant = track.participant;
    return participant?.isSpeaking || !participant?.isLocal;
  }) || tracks[0];

  // Use local participant for PiP if available
  const pipTrack = tracks.find((track) => track.participant.isLocal) || tracks[1];

  const positionClasses = {
    'top-left': 'top-20 left-4',
    'top-right': 'top-20 right-4',
    'bottom-left': 'bottom-24 left-4',
    'bottom-right': 'bottom-24 right-4',
  };

  const cyclePiPPosition = () => {
    const positions: PiPPosition[] = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
    const currentIndex = positions.indexOf(pipPosition);
    const nextIndex = (currentIndex + 1) % positions.length;
    setPipPosition(positions[nextIndex]);
  };

  const pipSize = pipExpanded 
    ? (isMobile ? 'w-48 h-36' : 'w-80 h-60')
    : (isMobile ? 'w-32 h-24' : 'w-64 h-48');

  return (
    <div className="relative w-full h-full animate-fade-in">
      {/* Main View */}
      <div className="absolute inset-0 w-full h-full bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-800/50 shadow-xl">
        {primaryTrack && (
          <ParticipantTile 
            trackRef={primaryTrack}
            {...primaryTrack}
          />
        )}
        {screenShare && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full backdrop-blur-sm z-10 shadow-lg animate-scale-in">
            🖥️ Screen Share
          </div>
        )}
      </div>

      {/* Picture-in-Picture Window */}
      {pipTrack && tracks.length > 1 && (
        <div
          className={`
            fixed ${positionClasses[pipPosition]} z-50
            ${pipSize}
            rounded-2xl overflow-hidden
            shadow-2xl border-2 border-primary/50
            transition-all duration-300 ease-in-out
            group cursor-move
            hover:scale-105 hover:shadow-primary/30
            animate-scale-in
          `}
          style={{ touchAction: 'none' }}
        >
          {/* PiP Content */}
          <div className="w-full h-full relative">
            <ParticipantTile 
              trackRef={pipTrack}
              {...pipTrack}
            />
            
            {/* Controls Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-2 right-2 flex gap-2">
                {/* Expand/Collapse Button */}
                <button
                  onClick={() => setPipExpanded(!pipExpanded)}
                  className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white transition-colors touch-manipulation"
                  title={pipExpanded ? 'Collapse' : 'Expand'}
                >
                  {pipExpanded ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
                
                {/* Move Button */}
                <button
                  onClick={cyclePiPPosition}
                  className="p-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-white transition-colors touch-manipulation"
                  title="Move PiP"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Participant Name Label */}
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded backdrop-blur-sm">
              {pipTrack.participant.identity}
              {pipTrack.participant.isLocal && ' (You)'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
