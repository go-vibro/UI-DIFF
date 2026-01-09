
/* @jsxRuntime classic */
/* @jsx React.createElement */
/* @jsxFrag React.Fragment */
import React, { useRef, useState } from 'react';

interface FileUploadProps {
  label: string;
  description: string;
  onFileSelect: (file: File, base64: string) => void;
  previewUrl?: string;
  shortcutHint?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, description, onFileSelect, previewUrl, shortcutHint }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onFileSelect(file, reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const item = e.clipboardData.items[0];
    if (item?.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) processFile(file);
    }
  };

  return (
    <div 
      onClick={() => inputRef.current?.click()}
      onPaste={handlePaste}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0} // 使容器可获焦以接收粘贴事件
      className={`
        relative border-2 border-dashed rounded-[2.5rem] p-10 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[360px] bg-white group outline-none focus:ring-2 focus:ring-indigo-500/20
        ${previewUrl ? 'border-indigo-400 bg-indigo-50/10 shadow-inner' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50 shadow-sm'}
      `}
    >
      <input type="file" ref={inputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      
      {previewUrl ? (
        <div className="w-full h-full flex flex-col items-center animate-in zoom-in-95 duration-500">
          <div className="relative mb-6">
            <img src={previewUrl} alt="预览" className="max-h-[220px] rounded-3xl shadow-2xl ring-8 ring-white object-contain" />
            <div className="absolute inset-0 bg-slate-900/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
               <span className="text-white text-[10px] font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-full border border-white/30">点击或粘贴以更换</span>
            </div>
          </div>
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
            {label} 已就绪
          </span>
        </div>
      ) : (
        <>
          <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-indigo-50 transition-all duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300 group-hover:text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">{label}</h3>
          <p className="text-sm text-slate-400 text-center max-w-[240px] font-medium leading-relaxed mb-4">{description}</p>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">支持粘贴 (Ctrl+V)</span>
          </div>

          {shortcutHint && (
            <p className="mt-4 text-[10px] font-bold text-indigo-400 uppercase tracking-tighter animate-pulse">{shortcutHint}</p>
          )}
        </>
      )}
    </div>
  );
};

export default FileUpload;
