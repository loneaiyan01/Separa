'use client';

import { useState } from 'react';
import { Grid3x3, User, LayoutGrid, PictureInPicture2, X } from 'lucide-react';
import { Button } from './ui/button';
import { VideoLayoutMode } from '@/types/layout';

interface LayoutSelectorProps {
  currentLayout: VideoLayoutMode;
  onLayoutChange: (layout: VideoLayoutMode) => void;
  isMobile?: boolean;
}

export default function LayoutSelector({ 
  currentLayout, 
  onLayoutChange, 
  isMobile = false 
}: LayoutSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const layouts = [
    {
      mode: 'gallery' as VideoLayoutMode,
      name: 'Gallery View',
      icon: Grid3x3,
      description: 'Equal-sized grid layout',
      disabled: false,
    },
    {
      mode: 'speaker' as VideoLayoutMode,
      name: 'Speaker View',
      icon: User,
      description: 'Large active speaker',
      disabled: false,
    },
    {
      mode: 'sidebar' as VideoLayoutMode,
      name: 'Sidebar View',
      icon: LayoutGrid,
      description: 'Speaker with side thumbnails',
      disabled: false,
    },
    {
      mode: 'pip' as VideoLayoutMode,
      name: 'Picture-in-Picture',
      icon: PictureInPicture2,
      description: 'Floating video overlay',
      disabled: isMobile, // PiP might be limited on mobile
    },
  ];

  const handleLayoutSelect = (mode: VideoLayoutMode) => {
    onLayoutChange(mode);
    setIsOpen(false);
  };

  const currentLayoutInfo = layouts.find(l => l.mode === currentLayout);

  return (
    <div className="relative">
      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`glass-strong hover:bg-slate-700/80 text-white border border-slate-600/50 shadow-xl transition-all hover:scale-105 ${
          isMobile ? 'min-h-[44px] min-w-[44px]' : ''
        }`}
        size={isMobile ? 'sm' : 'sm'}
        title="Change Layout"
      >
        {currentLayoutInfo && (
          <currentLayoutInfo.icon className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4 mr-2'}`} />
        )}
        {!isMobile && <span className="font-semibold">Layout</span>}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-[45]" 
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className={`
            absolute ${isMobile ? 'right-0 top-12' : 'right-0 top-12'} 
            z-[46] 
            ${isMobile ? 'w-80' : 'w-96'} 
            glass-strong rounded-xl border border-slate-700/50 shadow-2xl 
            overflow-hidden
            animate-scale-in
          `}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-900/50">
              <h3 className="font-bold text-white text-lg">Video Layout</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-all p-1.5 rounded-lg hover:bg-slate-700/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Layout Options */}
            <div className="p-3 space-y-2">
              {layouts.map((layout) => (
                <button
                  key={layout.mode}
                  onClick={() => !layout.disabled && handleLayoutSelect(layout.mode)}
                  disabled={layout.disabled}
                  className={`
                    w-full p-4 rounded-xl text-left transition-all
                    ${currentLayout === layout.mode
                      ? 'bg-gradient-to-r from-primary/20 to-emerald-600/20 border-2 border-primary/50 shadow-lg shadow-primary/20'
                      : 'bg-slate-800/50 hover:bg-slate-700/50 border-2 border-transparent hover:border-slate-600/30'
                    }
                    ${layout.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:scale-[1.02]'
                    }
                    touch-manipulation
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                      ${currentLayout === layout.mode
                        ? 'bg-gradient-to-br from-primary/30 to-emerald-600/30 text-primary shadow-lg'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }
                    `}>
                      <layout.icon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-medium ${
                          currentLayout === layout.mode
                            ? 'text-emerald-400'
                            : 'text-white'
                        }`}>
                          {layout.name}
                        </h4>
                        {currentLayout === layout.mode && (
                          <span className="text-xs bg-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                            Active
                          </span>
                        )}
                        {layout.disabled && (
                          <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                            Unavailable
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {layout.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-900/80">
              <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1.5">
                <span>✨</span>
                <span>Layout changes apply instantly to your view only</span>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
