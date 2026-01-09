
export type Severity = '致命' | '严重' | '次要' | '优化';
export type Category = '布局' | '字体' | '颜色' | '间距' | '内容';

export interface AuditIssue {
  category: Category;
  severity: Severity;
  description: string;
  suggestion: string;
  impactScore: number; 
  location?: {
    x: number; // 0-100 percentage
    y: number; // 0-100 percentage
  };
}

export interface AuditReport {
  completionScore: number;
  totalIssues: number;
  rating: string; 
  summary: string;
  issues: AuditIssue[];
  metrics: {
    layoutAccuracy: number;
    visualFidelity: number;
    contentConsistency: number;
  };
}

export interface ImageData {
  url: string;
  base64: string;
  name: string;
}
