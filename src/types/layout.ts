/**
 * Video layout modes for the room
 */
export type VideoLayoutMode = 
  | 'gallery'        // Grid view (current default)
  | 'speaker'        // Large active speaker with small thumbnails
  | 'sidebar'        // Active speaker with vertical sidebar
  | 'pip';           // Picture-in-picture mode

export interface LayoutSettings {
  mode: VideoLayoutMode;
  showSidebar: boolean;
  pipPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  speakerSize: 'large' | 'medium' | 'small';
}
