'use client';

import { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { ParticipantTile, GridLayout } from '@livekit/components-react';
import MonogramPlaceholder from '../MonogramPlaceholder';

interface GalleryLayoutProps {
  tracks: TrackReferenceOrPlaceholder[];
  isMobile?: boolean;
}

export default function GalleryLayout({ tracks, isMobile = false }: GalleryLayoutProps) {
  // Calculate grid columns based on track count
  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return isMobile ? 'grid-cols-1 grid-rows-2' : 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className={`w-full h-full p-2 grid gap-2 ${getGridClass(tracks.length)} auto-rows-fr`}>
      {tracks.map((track) => (
        <ParticipantTile
          key={track.participant.identity}
          trackRef={track}
          className="w-full h-full rounded-xl overflow-hidden border border-slate-700/50 shadow-lg bg-slate-900/50 relative"
        >
          <MonogramPlaceholder />
        </ParticipantTile>
      ))}
    </div>
  );
}
