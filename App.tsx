
/* @jsxRuntime classic */
/* @jsx React.createElement */
/* @jsxFrag React.Fragment */
import React, { useState, useEffect } from 'react';
import { AuditReport, ImageData } from './types';
import { performUIAudit } from './services/geminiService';
import FileUpload from './components/FileUpload';
import AuditDashboard from './components/AuditDashboard';

const App: React.FC = () => {
  const [figmaUrl, setFigmaUrl] = useState('');
  const [figmaToken, setFigmaToken] = useState(() => localStorage.getItem('figma_token') || '');
  const [previewUrl, setPreviewUrl] = useState('');
  const [designImg, setDesignImg] = useState<ImageData | null>(null);
  const [implImg, setImplImg] = useState<ImageData | null>(null);
  const [realPerfData, setRealPerfData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = ["正在同步设计稿...", "正在抓取前端页面...", "正在分析性能瓶颈...", "正在生成 AI 报告..."];

  useEffect(() => {
    localStorage.setItem('figma_token', figmaToken);
  }, [figmaToken]);

  const handleStartAudit = async () => {
    if (!designImg || !implImg) return;
    setIsAnalyzing(true);
    setError(null);
    const interval = setInterval(() => setLoadingStep(prev => (prev + 1) % loadingMessages.length), 2000);

    try {
      const result = await performUIAudit(designImg.base64, implImg.base64, realPerfData);
      setReport(result);
    } catch (err: any) {
      setError(err.message || '分析失败');
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  const handleAutoCapture = async () => {
    if (!figmaUrl && !previewUrl) {
      setError("请至少输入一个有效地址");
      return;
    }
    if (figmaUrl && !figmaToken) {
      setError("抓取 Figma 需要 Access Token，请在下方设置。");
      return;
    }
    
    setIsFetching(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:3000/api/audit-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          figmaUrl, 
          previewUrl, 
          figmaToken 
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "后端服务响应异常");
      }
      
      const data = await response.json();
      
      if (data.designImg) {
        setDesignImg({ url: data.designImg, base64: data.designImg, name: 'Figma_Export.png' });
      }
      if (data.implImg) {
        setImplImg({ url: data.implImg, base64: data.implImg, name: 'Preview_Capture.png' });
      }
      if (data.perfData) {
        setRealPerfData(data.perfData);
      }
    } catch (err: any) {
      setError("自动化获取失败: " + err.message);
    } finally {
      setIsFetching(false);
    }
  };

  const reset = () => {
    setDesignImg(null);
    setImplImg(null);
    setReport(null);
    setError(null);
    setRealPerfData(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">VisionAudit<span className="text-indigo-600">.pro</span></h1>
        </div>
        {report && <button onClick={reset} className="text-xs font-bold text-slate-400 hover:text-slate-900 uppercase">重置项目</button>}
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!report ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">自动化 <span className="text-indigo-600">UI 走查</span></h2>
              <p className="text-slate-500 font-medium italic">输入 URL，剩下的交给 AI</p>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm mb-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Figma Design URL</label>
                  <input 
                    type="text" value={figmaUrl} onChange={e => setFigmaUrl(e.target.value)}
                    placeholder="https://www.figma.com/design/..." 
                    className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preview URL</label>
                  <input 
                    type="text" value={previewUrl} onChange={e => setPreviewUrl(e.target.value)}
                    placeholder="https://your-site.com" 
                    className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 transition-colors text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Figma Access Token</label>
                <div className="relative">
                  <input 
                    type="password" value={figmaToken} onChange={e => setFigmaToken(e.target.value)}
                    placeholder="figd_..." 
                    className="w-full h-12 px-6 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-colors text-xs font-mono"
                  />
                  <a href="https://www.figma.com/settings/developers" target="_blank" className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-500 hover:underline">获取 Token</a>
                </div>
              </div>

              <button 
                onClick={handleAutoCapture} disabled={isFetching}
                className="w-full h-14 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                {isFetching ? (
                   <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>正在同步所有素材...</span>
                   </>
                ) : "一键抓取设计稿与实现页面"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <FileUpload label="设计稿" description="支持粘贴/上传" previewUrl={designImg?.url} onFileSelect={(file, base64) => setDesignImg({ url: URL.createObjectURL(file), base64, name: file.name })} />
              <FileUpload label="实现截图" description="支持粘贴/上传" previewUrl={implImg?.url} onFileSelect={(file, base64) => setImplImg({ url: URL.createObjectURL(file), base64, name: file.name })} />
            </div>

            <div className="flex flex-col items-center">
              <button 
                disabled={!designImg || !implImg || isAnalyzing} onClick={handleStartAudit}
                className={`h-16 px-16 rounded-[2.5rem] font-black text-xl transition-all shadow-2xl tracking-tight ${!designImg || !implImg ? 'bg-slate-100 text-slate-300' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 active:scale-95'}`}
              >
                {isAnalyzing ? loadingMessages[loadingStep] : "生成深度对比报告"}
              </button>
              {error && <div className="mt-6 text-rose-500 bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100 font-bold text-sm text-center max-w-lg">{error}</div>}
            </div>
          </div>
        ) : (
          <AuditDashboard report={report} designUrl={designImg!.url} implUrl={implImg!.url} />
        )}
      </main>
    </div>
  );
};

export default App;
