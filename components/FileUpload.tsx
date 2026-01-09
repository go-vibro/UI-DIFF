
/* @jsxRuntime classic */
/* @jsx React.createElement */
/* @jsxFrag React.Fragment */
import React, { useRef } from 'react';

interface FileUploadProps {
  label: string;
  description: string;
  onFileSelect: (file: File, base64: string) => void;
  previewUrl?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ label, description, onFileSelect, previewUrl }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onFileSelect(file, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div 
      onClick={() => inputRef.current?.click()}
      className={`
        relative border-2 border-dashed rounded-[2.5rem] p-10 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[360px] bg-white group
        ${previewUrl ? 'border-indigo-400 bg-indigo-50/10 shadow-inner' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50 shadow-sm'}
      `}
    >
      <input type="file" ref={inputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
      
      {previewUrl ? (
        <div className="w-full h-full flex flex-col items-center animate-in zoom-in-95 duration-500">
          <div className="relative mb-6">
            <img src={previewUrl} alt="预览" className="max-h-[220px] rounded-3xl shadow-2xl ring-8 ring-white object-contain" />
            <div className="absolute inset-0 bg-slate-900/60 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
               <span className="text-white text-[10px] font-black uppercase tracking-widest bg-white/20 px-4 py-2 rounded-full border border-white/30">更换素材</span>
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
          <p className="text-sm text-slate-400 text-center max-w-[240px] font-medium leading-relaxed">{description}</p>
        </>
      )}
    </div>
  );
};

export default FileUpload;
