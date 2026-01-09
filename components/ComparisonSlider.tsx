/* @jsxRuntime classic */
/* @jsx React.createElement */
/* @jsxFrag React.Fragment */
import React, { useState, useRef } from 'react';
import { AuditIssue } from '../types';

interface ComparisonSliderProps {
  designUrl: string;
  implUrl: string;
  issues?: AuditIssue[];
  onIssueClick?: (index: number) => void;
}

const ComparisonSlider: React.FC<ComparisonSliderProps> = ({ designUrl, implUrl, issues = [], onIssueClick }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const pos = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPos((pos / rect.width) * 100);
  };

  const getMarkerColor = (severity: string) => {
    switch (severity) {
      case '致命': return 'bg-red-500';
      case '严重': return 'bg-orange-500';
      case '次要': return 'bg-blue-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="relative w-full bg-slate-100 rounded-3xl border border-slate-200 shadow-inner group cursor-col-resize select-none overflow-hidden"
         ref={containerRef}
         onMouseMove={handleMove}
         onTouchMove={handleMove}>
      
      {/* 滚动容器：支持长图走查 */}
      <div className="w-full max-h-[70vh] overflow-y-auto overflow-x-hidden">
        <div className="relative w-full">
          {/* 开发实现层 (底层) */}
          <div className="relative w-full">
            <img src={implUrl} className="w-full h-auto block" alt="开发实现" />
            
            {/* 差异标注点 - 叠加在开发图上 */}
            {issues.map((issue, idx) => (
              issue.location && (
                <button
                  key={idx}
                  onClick={(e) => { e.stopPropagation(); onIssueClick?.(idx); }}
                  className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-xl z-30 transition-all hover:scale-125 hover:z-40 ${getMarkerColor(issue.severity)}`}
                  style={{ left: `${issue.location.x}%`, top: `${issue.location.y}%` }}
                >
                  <span className="absolute inset-0 rounded-full animate-ping bg-inherit opacity-75"></span>
                  <span className="relative flex items-center justify-center text-[10px] font-black text-white">{idx + 1}</span>
                </button>
              )
            ))}
          </div>
          
          {/* 设计稿层 (遮罩层) */}
          <div className="absolute top-0 left-0 h-full overflow-hidden border-r-2 border-indigo-500 z-10 pointer-events-none"
               style={{ width: `${sliderPos}%` }}>
            <div className="w-full" style={{ width: containerRef.current?.offsetWidth || '100%' }}>
              <img src={designUrl} className="w-full h-auto block" alt="设计原稿" />
            </div>
          </div>
        </div>
      </div>

      {/* 滑块控制杆 Handle */}
      <div className="absolute top-0 bottom-0 w-px bg-indigo-500 z-20 pointer-events-none"
           style={{ left: `${sliderPos}%` }}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-slate-900 shadow-2xl flex items-center justify-center text-white ring-4 ring-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l-5 5m0 0l5 5m-5-5h18m-5-5l5 5m0 0l-5 5" />
          </svg>
        </div>
      </div>

      {/* 浮动标签 */}
      <div className="absolute top-4 left-4 z-30 px-3 py-1 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-slate-200">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">设计稿 (左侧)</span>
      </div>
      <div className="absolute top-4 right-4 z-30 px-3 py-1 bg-white/90 backdrop-blur rounded-lg shadow-sm border border-slate-200">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">实现图 (底层)</span>
      </div>
    </div>
  );
};

export default ComparisonSlider;