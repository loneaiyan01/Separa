'use client';

import { TrackReferenceOrPlaceholder, ParticipantTile } from '@livekit/components-react';
import { Track } from 'livekit-client';

interface SidebarLayoutProps {
  tracks: TrackReferenceOrPlaceholder[];
  isMobile?: boolean;
}

export default function SidebarLayout({ tracks, isMobile = false }: SidebarLayoutProps) {
  // Find the active speaker or screen share
  const screenShare = tracks.find(
    (track) => track.publication?.source === Track.Source.ScreenShare
  );
  
  // If there's a screen share, prioritize it
  const primaryTrack = screenShare || tracks.find((track) => {
    const participant = track.participant;
    return participant?.isSpeaking || participant?.isLocal;
  }) || tracks[0];

  // Get other participants (sidebar)
  const sidebarTracks = tracks.filter(
    (track) => track.participant !== primaryTrack?.participant
  );

  if (isMobile) {
    // On mobile, fall back to speaker layout
    return (
      <div className="w-full h-full flex flex-col gap-3 p-3">
        <div className="flex-1 rounded-xl overflow-hidden bg-slate-900/50 min-h-0">
          {primaryTrack && (
            <ParticipantTile 
              trackRef={primaryTrack}
              {...primaryTrack}
            />
          )}
        </div>
        {sidebarTracks.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {sidebarTracks.map((track, index) => (
              <div
                key={track.participant.identity + index}
                className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-900/50"
              >
                <ParticipantTile 
                  trackRef={track}
                  {...track}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full flex gap-3 p-3 animate-fade-in">
      {/* Main Speaker View */}
      <div className="flex-1 rounded-2xl overflow-hidden bg-slate-900/50 border border-slate-800/50 relative min-h-0 shadow-xl">
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

      {/* Sidebar Thumbnails */}
      {sidebarTracks.length > 0 && (
        <div className="w-64 flex flex-col gap-3 overflow-y-auto custom-scrollbar">
          {sidebarTracks.map((track, index) => (
            <div
              key={track.participant.identity + index}
              className="w-full aspect-video rounded-xl overflow-hidden bg-slate-900/50 border border-slate-800/50 hover:ring-2 hover:ring-primary hover:scale-105 transition-all cursor-pointer shadow-lg"
            >
              <ParticipantTile 
                trackRef={track}
                {...track}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
