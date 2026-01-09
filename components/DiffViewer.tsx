/* @jsxRuntime classic */
/* @jsx React.createElement */
/* @jsxFrag React.Fragment */
import React, { useState, useRef } from 'react';

interface DiffViewerProps {
  designUrl: string;
  implUrl: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ designUrl, implUrl }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const relativeX = Math.max(0, Math.min(x - rect.left, rect.width));
    const percentage = (relativeX / rect.width) * 100;
    setSliderPos(percentage);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center px-2">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Design Mockup</span>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Implementation</span>
      </div>
      
      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-slate-200 rounded-xl overflow-hidden shadow-2xl cursor-col-resize select-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleMouseMove}
      >
        {/* Implementation (Background) */}
        <img src={implUrl} className="absolute inset-0 w-full h-full object-contain" alt="Implementation" />
        
        {/* Design (Foreground Clipped) */}
        <div 
          className="absolute inset-0 w-full h-full overflow-hidden border-r-2 border-indigo-500 z-10"
          style={{ width: `${sliderPos}%` }}
        >
          <img 
            src={designUrl} 
            className="absolute inset-0 w-auto h-full max-none object-contain" 
            style={{ width: containerRef.current?.offsetWidth || '100%' }}
            alt="Design" 
          />
        </div>

        {/* Handle */}
        <div 
          className="absolute h-full w-0.5 bg-indigo-500 z-20 pointer-events-none"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl ring-4 ring-white/50">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
      
      <p className="text-center text-sm text-slate-500 italic">Drag the slider to compare differences</p>
    </div>
  );
};

export default DiffViewer;