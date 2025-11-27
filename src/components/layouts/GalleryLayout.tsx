'use client';

import { TrackReferenceOrPlaceholder } from '@livekit/components-react';
import { ParticipantTile, GridLayout } from '@livekit/components-react';

interface GalleryLayoutProps {
  tracks: TrackReferenceOrPlaceholder[];
  isMobile?: boolean;
}

export default function GalleryLayout({ tracks, isMobile = false }: GalleryLayoutProps) {
  return (
    <div className="w-full h-full">
      <GridLayout tracks={tracks} style={{ height: '100%', width: '100%' }}>
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}
