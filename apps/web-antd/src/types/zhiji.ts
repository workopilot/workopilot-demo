import type { ReportLayoutTemplate } from '#/api/mock-report-layout-templates';

export type ReportPeriod =
  'biweek' | 'day' | 'month' | 'quarter' | 'week' | 'year';
export type ReportKind = 'customer' | 'personal' | 'productline' | 'project';
export interface ZhijiType {
  id: ReportKind;
  name: string;
  description: string;
  object: string;
  owner: string;
  icon: string;
  sources: string[];
  sections: string[];
  enabled: boolean;
}
export interface ZhijiScheme {
  layoutTemplates?: ReportLayoutTemplate[];
  layoutTemplateIds?: string[];
  defaultLayoutTemplateId?: string;
  id: string;
  name: string;
  type: ReportKind;
  description: string;
  scope: string;
  scopeMode: 'all' | 'departments' | 'people';
  scopeIds: string[];
  sourcePrompts: Record<string, string>;
  owner: string;
  mode: 'fixed' | 'selectable';
  periods: ReportPeriod[];
  defaultPeriod: ReportPeriod;
  anchor: string;
  autoGenerate: boolean;
  generateDay: number;
  generateTime: string;
  required: boolean;
  deadlineDay: number;
  deadlineTime: string;
  reminder: boolean;
  sources: string[];
  sections: string[];
  template: string;
  prompt: string;
  recipients: string[];
  reviewers: string[];
  allowAdjustRecipients: boolean;
  status: 'disabled' | 'draft' | 'published';
  version: number;
  updated: string;
}
