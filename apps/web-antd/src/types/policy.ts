export type PolicyStatus = 'active' | 'inactive';

export interface Policy {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string; // e.g. 'travel', 'purchase', 'finance', 'hr'
  version: string;
  status: PolicyStatus;
  ruleCount: number;
  updatedAt: string;
}

export interface PolicyClause {
  id: string;
  policyId: string;
  clauseCode: string; // New field: 条款编号
  title: string;
  content: string; // HTML/RichText
  summary?: string;
  source: 'ai' | 'manual';
  params?: Record<string, any>; // Keep for backward compatibility or other uses
  originalText?: string; // New field: 引用原文
  order: number;
}

export interface PolicyVersion {
  id: string;
  policyId: string;
  version: string;
  fileName: string;
  fileUrl: string;
  uploader: string;
  uploadedAt: string;
  status: 'failed' | 'parsed' | 'parsing';
}

export interface PolicyRelease {
  id: string;
  policyId: string;
  version: string;
  title: string;
  content: string;
  publisher: string;
  publishDate: string;
}
