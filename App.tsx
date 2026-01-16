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
  
  const [loadingFigma, setLoadingFigma] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingPerf, setLoadingPerf] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('figma_token', figmaToken);
  }, [figmaToken]);

  // 1. 独立获取 Figma 素材
  const fetchFigma = async () => {
    if (!figmaUrl || !figmaToken) {
      setError("请填写 Figma 链接和 Access Token");
      return;
    }
    setLoadingFigma(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/figma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ figmaUrl, figmaToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Figma 导出失败");
      setDesignImg({ url: data.image, base64: data.image, name: 'Figma_Export.png' });
    } catch (err: any) {
      setError("Figma 获取失败: " + err.message);
    } finally {
      setLoadingFigma(false);
    }
  };

  // 2. 独立获取实现截图（Playwright）
  const fetchPreview = async () => {
    if (!previewUrl) {
      setError("请填写预览地址");
      return;
    }
    setLoadingPreview(true);
    setError(null);
    try {
      const res = await fetch('http://localhost:3000/api/preview-screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: previewUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "页面截图失败");
      setImplImg({ url: data.image, base64: data.image, name: 'Preview_Capture.png' });
      
      // 截图成功后，静默启动性能审计
      fetchPerformance();
    } catch (err: any) {
      setError("页面截图失败: " + err.message);
    } finally {
      setLoadingPreview(false);
    }
  };

  // 异步性能评分请求
  const fetchPerformance = async () => {
    setLoadingPerf(true);
    try {
      const res = await fetch('http://localhost:3000/api/preview-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: previewUrl })
      });
      const data = await res.json();
      if (res.ok) setRealPerfData(data);
    } catch (e) {
      console.warn("性能审计静默失败:", e);
    } finally {
      setLoadingPerf(false);
    }
  };

  // 3. 执行对比走查
  const handleStartAudit = async () => {
    if (!designImg || !implImg) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const result = await performUIAudit(designImg.base64, implImg.base64, realPerfData);
      setReport(result);
    } catch (err: any) {
      setError(err.message || 'AI 分析失败');
    } finally {
      setIsAnalyzing(false);
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-24">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800">VisionAudit<span className="text-indigo-600">.pro</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">AI Visual Review Suite</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-full border border-slate-200">
             <div className={`w-2 h-2 rounded-full ${realPerfData ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-300 animate-pulse'}`}></div>
             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
               {loadingPerf ? 'Performance Auditing...' : realPerfData ? 'Lighthouse Ready' : 'Backend Ready'}
             </span>
          </div>
          {report && (
            <button 
              onClick={reset} 
              className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-600 transition-all"
            >
              新建项目
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-12">
        {!report ? (
          <div className="space-y-12 animate-in fade-in duration-700">
            <header className="text-center max-w-3xl mx-auto mb-4">
              <h2 className="text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-none italic">
                视觉走查 <span className="text-indigo-600">快人一步</span>
              </h2>
              <p className="text-slate-400 text-lg font-medium italic">精准对比，一键生成 AI 还原度报告</p>
            </header>

            {/* 获取资产控制区 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-500">
                  <svg className="w-32 h-32" viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 28.5C19 25.0196 20.3828 21.6818 22.8442 19.2205C25.3055 16.7592 28.6433 15.3763 32.1237 15.3763V0H6.26477C2.8047 0 0 2.8047 0 6.26477V22.2352C0 25.6953 2.8047 28.5 6.26477 28.5H19Z" fill="currentColor"/></svg>
                </div>
                <div className="relative z-10 space-y-6">
                  <header className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-orange-100 text-orange-600 text-[10px] font-black rounded-md uppercase tracking-widest">Source</span>
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Figma 设计源</h3>
                  </header>
                  <div className="space-y-3">
                    <input type="text" value={figmaUrl} onChange={e => setFigmaUrl(e.target.value)} placeholder="Figma 链接 (选中 Frame 复制)" className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-orange-500/20 text-sm transition-all" />
                    <input type="password" value={figmaToken} onChange={e => setFigmaToken(e.target.value)} placeholder="Access Token" className="w-full h-12 px-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-orange-500/20 text-xs font-mono" />
                  </div>
                  <button onClick={fetchFigma} disabled={loadingFigma} className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest transition-all ${loadingFigma ? 'bg-slate-100 text-slate-400' : 'bg-slate-900 text-white hover:bg-orange-600 shadow-xl shadow-orange-100'}`}>
                    {loadingFigma ? "正在拉取..." : "同步设计稿"}
                  </button>
                </div>
              </section>

              <section className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 -mr-4 -mt-4 transition-transform group-hover:scale-110 duration-500">
                  <svg className="w-32 h-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
                </div>
                <div className="relative z-10 space-y-6">
                  <header className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-600 text-[10px] font-black rounded-md uppercase tracking-widest">Implementation</span>
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-xs">Playwright 抓取</h3>
                  </header>
                  <div className="space-y-3">
                    <input type="text" value={previewUrl} onChange={e => setPreviewUrl(e.target.value)} placeholder="https://your-preview-site.com" className="w-full h-14 px-5 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 ring-indigo-500/20 text-sm transition-all" />
                    <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">性能审计</span>
                      {loadingPerf ? (
                         <span className="text-[10px] text-indigo-500 animate-pulse font-bold">Lighthouse 审计中...</span>
                      ) : realPerfData ? (
                         <span className="text-[10px] text-emerald-500 font-bold">已就绪 (Score: {realPerfData.score})</span>
                      ) : (
                         <span className="text-[10px] text-slate-300 font-bold">截图后自动运行</span>
                      )}
                    </div>
                  </div>
                  <button onClick={fetchPreview} disabled={loadingPreview} className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest transition-all ${loadingPreview ? 'bg-slate-100 text-slate-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-100'}`}>
                    {loadingPreview ? "正在截图..." : "同步实现页"}
                  </button>
                </div>
              </section>
            </div>

            {/* 素材展示区：支持手动操作 */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 px-2">
                <div className="h-px flex-1 bg-slate-200"></div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">或 手动上传对比素材</h3>
                <div className="h-px flex-1 bg-slate-200"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FileUpload 
                  label="设计稿素材" 
                  description="自动同步或手动拖拽/粘贴" 
                  previewUrl={designImg?.url} 
                  onFileSelect={(file, base64) => setDesignImg({ url: URL.createObjectURL(file), base64, name: file.name })} 
                />
                <FileUpload 
                  label="实现页素材" 
                  description="自动同步或手动拖拽/粘贴" 
                  previewUrl={implImg?.url} 
                  onFileSelect={(file, base64) => setImplImg({ url: URL.createObjectURL(file), base64, name: file.name })} 
                />
              </div>
            </div>

            {/* 核心走查启动按钮 */}
            <div className="flex flex-col items-center py-10">
              <div className="mb-6 flex items-center gap-8">
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${designImg ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-200'}`}></div>
                   <span className="text-[10px] font-black uppercase text-slate-400">Design Ready</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${implImg ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-200'}`}></div>
                   <span className="text-[10px] font-black uppercase text-slate-400">Implementation Ready</span>
                </div>
              </div>

              <button 
                disabled={!designImg || !implImg || isAnalyzing} 
                onClick={handleStartAudit} 
                className={`
                  group relative h-24 px-28 rounded-[3rem] font-black text-3xl transition-all shadow-2xl tracking-tighter overflow-hidden
                  ${!designImg || !implImg 
                    ? 'bg-slate-100 text-slate-300 border border-slate-200 shadow-none' 
                    : 'bg-slate-900 text-white hover:scale-105 active:scale-95 shadow-indigo-200'}
                `}
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-5">
                    <svg className="animate-spin h-8 w-8 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    正在深度走查...
                  </span>
                ) : (
                  <>
                    <span className="relative z-10">开始对比深度走查</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  </>
                )}
              </button>
              
              {error && (
                <div className="mt-8 px-8 py-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-3xl font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
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