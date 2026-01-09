
/* @jsxRuntime classic */
/* @jsx React.createElement */
/* @jsxFrag React.Fragment */
import React, { useState } from 'react';
import { AuditReport, ImageData } from './types';
import { performUIAudit } from './services/geminiService';
import FileUpload from './components/FileUpload';
import AuditDashboard from './components/AuditDashboard';

const App: React.FC = () => {
  const [designImg, setDesignImg] = useState<ImageData | null>(null);
  const [implImg, setImplImg] = useState<ImageData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<AuditReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingMessages = [
    "正在解析视觉层级...",
    "正在测量组件对齐...",
    "正在校验字体系统...",
    "正在对比色彩空间...",
    "正在计算综合评分..."
  ];

  const handleStartAudit = async () => {
    if (!designImg || !implImg) return;
    setIsAnalyzing(true);
    setError(null);
    
    const interval = setInterval(() => {
      setLoadingStep(prev => (prev + 1) % loadingMessages.length);
    }, 2000);

    try {
      const result = await performUIAudit(designImg.base64, implImg.base64);
      setReport(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || '分析过程中出现异常，请检查 API Key 或网络状况。');
    } finally {
      clearInterval(interval);
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setDesignImg(null);
    setImplImg(null);
    setReport(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-800">VisionAudit<span className="text-indigo-600">.pro</span></h1>
          </div>
          {report && (
            <button onClick={reset} className="text-xs font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              开启新项目
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!report ? (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-tight">
                AI 驱动的 <span className="text-indigo-600">UI 走查工具</span>
              </h2>
              <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto italic">
                “ 消除设计与代码的最后一像素偏差 ”
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <FileUpload 
                label="上传设计稿" 
                description="从 Figma 导出或直接复制粘贴"
                previewUrl={designImg?.url}
                onFileSelect={(file, base64) => setDesignImg({ url: URL.createObjectURL(file), base64, name: file.name })}
              />
              <FileUpload 
                label="上传实现截图" 
                description="在预览页截图后直接在此粘贴"
                shortcutHint="提示：Win+Shift+S 或 Cmd+Shift+4 截图"
                previewUrl={implImg?.url}
                onFileSelect={(file, base64) => setImplImg({ url: URL.createObjectURL(file), base64, name: file.name })}
              />
            </div>

            <div className="flex flex-col items-center gap-6">
              <button
                disabled={!designImg || !implImg || isAnalyzing}
                onClick={handleStartAudit}
                className={`
                  relative h-16 px-12 rounded-[2rem] font-black text-lg tracking-widest transition-all flex items-center gap-4 shadow-2xl
                  ${!designImg || !implImg ? 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none border border-slate-200' : 'bg-slate-900 text-white hover:bg-indigo-600 hover:scale-[1.05] active:scale-95 shadow-indigo-200'}
                `}
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{loadingMessages[loadingStep]}</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>开启深度走查</span>
                  </>
                )}
              </button>
              {error && <div className="text-rose-500 text-sm font-bold bg-rose-50 px-6 py-3 rounded-2xl border border-rose-100 animate-bounce">{error}</div>}
            </div>

            {/* 技巧提示区 */}
            <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="p-6 bg-white rounded-3xl border border-slate-200">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4 font-bold">1</div>
                  <h4 className="font-bold text-slate-800 mb-2">系统级截图</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">使用系统的部分截图快捷键，然后回到本页面直接点击输入框后 Ctrl+V 粘贴。</p>
               </div>
               <div className="p-6 bg-white rounded-3xl border border-slate-200">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4 font-bold">2</div>
                  <h4 className="font-bold text-slate-800 mb-2">捕获全尺寸</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Chrome 控制台按下 Ctrl+Shift+P，输入 "Capture full size" 可一键获取长网页截图。</p>
               </div>
               <div className="p-6 bg-white rounded-3xl border border-slate-200">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4 font-bold">3</div>
                  <h4 className="font-bold text-slate-800 mb-2">对比视图</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">走查结果支持左右滑动对比，AI 会自动寻找并高亮所有的视觉不一致点。</p>
               </div>
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
