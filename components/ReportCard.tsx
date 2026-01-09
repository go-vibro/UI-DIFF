/* @jsxRuntime classic */
/* @jsx React.createElement */
/* @jsxFrag React.Fragment */
import React from 'react';
import { AuditReport, Severity } from '../types';

interface ReportCardProps {
  report: AuditReport;
}

const ReportCard: React.FC<ReportCardProps> = ({ report }) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600';
    if (score >= 75) return 'text-amber-500';
    return 'text-rose-600';
  };

  const getSeverityBadge = (severity: Severity) => {
    // Fix: Updated to match Chinese severity values from the type definition
    switch (severity) {
      case '致命': return 'bg-rose-100 text-rose-700 border-rose-200';
      case '严重': return 'bg-amber-100 text-amber-700 border-amber-200';
      case '次要': return 'bg-blue-100 text-blue-700 border-blue-200';
      case '优化': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Stats Summary */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center justify-center text-center">
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Completion Score</span>
          <div className={`text-7xl font-black mb-1 ${getScoreColor(report.completionScore)}`}>
            {report.completionScore}%
          </div>
          <div className="text-2xl font-bold text-slate-700 mb-6">Grade: {report.rating}</div>
          <div className="grid grid-cols-2 gap-8 w-full border-t border-slate-100 pt-6">
            <div>
              <div className="text-2xl font-bold text-slate-800">{report.totalIssues}</div>
              <div className="text-xs text-slate-400 font-medium uppercase">Issues Found</div>
            </div>
            <div>
              {/* Fix: Comparison updated to use the correct Severity value '致命' instead of 'Critical' */}
              <div className="text-2xl font-bold text-slate-800">{report.issues.filter(i => i.severity === '致命').length}</div>
              <div className="text-xs text-slate-400 font-medium uppercase text-rose-500">致命 (Critical)</div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-600 rounded-2xl shadow-md p-6 text-white">
          <h3 className="font-bold text-lg mb-2">AI Summary</h3>
          <p className="text-indigo-100 text-sm leading-relaxed">{report.summary}</p>
        </div>
      </div>

      {/* Issues List */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-slate-800">Issue Breakdown</h2>
          <span className="text-sm text-slate-500">{report.issues.length} items to review</span>
        </div>
        
        {report.issues.map((issue, idx) => (
          <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getSeverityBadge(issue.severity)}`}>
                {issue.severity}
              </span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                {issue.category}
              </span>
            </div>
            <h4 className="font-semibold text-slate-800 mb-1">{issue.description}</h4>
            <div className="mt-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold text-indigo-500 uppercase block mb-1">AI Suggestion</span>
              <p className="text-sm text-slate-600 italic">"{issue.suggestion}"</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportCard;