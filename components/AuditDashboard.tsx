/* @jsxRuntime classic */
/* @jsx React.createElement */
/* @jsxFrag React.Fragment */
import React, { useRef } from 'react';
import { AuditReport } from '../types';
import ComparisonSlider from './ComparisonSlider';

interface AuditDashboardProps {
  report: AuditReport;
  designUrl: string;
  implUrl: string;
}

const AuditDashboard: React.FC<AuditDashboardProps> = ({ report, designUrl, implUrl }) => {
  const issueRefs = useRef<(HTMLDivElement | null)[]>([]);

  const handleIssueClick = (index: number) => {
    issueRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    issueRefs.current[index]?.classList.add('ring-4', 'ring-indigo-500/50', 'bg-indigo-50');
    setTimeout(() => {
      issueRefs.current[index]?.classList.remove('ring-4', 'ring-indigo-500/50', 'bg-indigo-50');
    }, 2000);
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case '致命': return 'bg-red-50 text-red-600 border-red-100';
      case '严重': return 'bg-orange-50 text-orange-600 border-orange-100';
      case '次要': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const metricsList = [
    { label: '布局准确度', val: report.metrics?.layoutAccuracy ?? 0 },
    { label: '视觉保真度', val: report.metrics?.visualFidelity ?? 0 },
    { label: '内容一致性', val: report.metrics?.contentConsistency ?? 0 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-700">
      {/* 左侧：统计与评分 */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50 blur-3xl"></div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">综合完成度评分</h3>
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
              <circle cx="72" cy="72" r="64" stroke="currentColor" strokeWidth="12" fill="transparent" 
                strokeDasharray={402} strokeDashoffset={402 - (402 * (report.completionScore ?? 0)) / 100}
                className="text-indigo-600 transition-all duration-1000 ease-out" />
            </svg>
            <span className="absolute text-4xl font-black text-slate-900">{report.completionScore ?? 0}%</span>
          </div>
          <div className="mt-4">
            <span className="text-5xl font-black text-slate-900 tracking-tighter">{report.rating ?? 'N/A'}</span>
            <p className="text-xs font-bold text-slate-400 uppercase mt-1">走查结果评级</p>
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">AI 执行摘要</h3>
          <p className="text-sm text-slate-200 leading-relaxed font-medium italic">“{report.summary ?? '无总结内容'}”</p>
          
          <div className="mt-8 pt-8 border-t border-white/10 space-y-6">
            {metricsList.map((m, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{m.label}</span>
                  <span className="text-[10px] font-black">{m.val}%</span>
                </div>
                <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${m.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧：交互视图与走查列表 */}
      <div className="lg:col-span-8 space-y-8">
        <section className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">差异视图标注 (全视图展示)</h3>
            <span className="text-[10px] font-bold text-slate-400 italic">图中数字对应下方差异编号</span>
          </div>
          <ComparisonSlider 
            designUrl={designUrl} 
            implUrl={implUrl} 
            issues={report.issues ?? []} 
            onIssueClick={handleIssueClick} 
          />
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">详细差异走查清单 ({report.totalIssues ?? 0})</h3>
          </div>
          <div className="grid gap-4">
            {(report.issues ?? []).map((issue, idx) => (
              <div 
                key={idx} 
                ref={el => { issueRefs.current[idx] = el; }}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-100 group-hover:bg-indigo-500 transition-colors"></div>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-slate-900 text-white text-[10px] font-black">{idx + 1}</span>
                      <span className={`px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getSeverityStyles(issue.severity ?? '优化')}`}>
                        {issue.severity ?? '未知'}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{issue.category ?? '通用'}</span>
                    </div>
                    <h4 className="text-lg font-bold text-slate-800">{issue.description ?? '无描述'}</h4>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                      <div className="w-4 h-4 rounded bg-slate-100 flex items-center justify-center text-[10px] text-slate-400">#</div>
                      影响分: {issue.impactScore ?? 0}/10
                    </div>
                  </div>
                  
                  <div className="shrink-0 md:max-w-[280px] bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50">
                    <span className="text-[10px] font-black text-indigo-600 uppercase block mb-2">修复方案建议</span>
                    <p className="text-xs font-medium text-slate-600 leading-relaxed italic">
                      “{issue.suggestion ?? '暂无修复建议'}”
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default AuditDashboard;