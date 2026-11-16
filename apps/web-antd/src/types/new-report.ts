import type { ZhijiScheme, ReportPeriod } from './zhiji';
import type {
  BusinessReportState,
  CustomerReportApproval,
} from './business-report';
export interface ReportAttachment {
  id: string;
  name: string;
  size: number;
  url: string;
}
export interface ReportSource {
  projectTasks?: {
    id: string;
    title: string;
    status: 'completed' | 'active' | 'delayed';
    detail?: string;
  }[];
  statistics?: {
    planned?: number;
    nextWeekPlanned?: number;
    delayedDescription?: string;
    total: number;
    completed: number;
    active: number;
    delayed: number;
  };
  id: string;
  kind: string;
  title: string;
  detail: string;
}
export interface ReportScheme {
  id: string;
  title: string;
  type: string;
  icon: string;
  color: string;
  description: string;
  object: string;
  enabled: boolean;
  cadence: string;
  start: string;
  end: string;
  sources: ReportSource[];
  summary: string;
  metrics: { label: string; value: string }[];
}
export interface ReportPlanDetails {
  priority: string;
  outcome: string;
  acceptance: string;
  deadline: string;
}
export interface ReportDraft {
  approvalRule?: 'all' | 'any' | 'majority';
  layoutTemplate?: {
    htmlFile?: { name: string; content: string };
    id: string;
    name: string;
    version: number;
    prompt: string;
    presentation: 'classic' | 'executive' | 'warm';
    generatedAt: string;
  };
  filledAt?: string;
  submittedAt?: string;
  presentation?: 'classic' | 'executive' | 'warm';
  customerApproval?: CustomerReportApproval;
  schemeConfig?: ZhijiScheme;
  period?: ReportPeriod;
  business?: BusinessReportState;
  attachments?: Record<string, ReportAttachment[]>;
  planDetails?: ReportPlanDetails;
  sourceNotes?: Record<string, { kind: string; text: string }>;
  generatedSections?: ReportMaterialSection[];
  sourceUpdatedAt?: Record<string, string>;
  id: string;
  schemeId: string;
  title: string;
  start: string;
  end: string;
  summary: string;
  supplement: string;
  plan: string;
  risk: string;
  status: 'draft' | 'submitted';
  version: number;
  generatedAt: string;
  recipients: string[];
  reviewers: string[];
  actions: { id: string; title: string; target: string; kind: string }[];
  materials: string[];
  versions: {
    business?: BusinessReportState;
    attachments?: Record<string, ReportAttachment[]>;
    planDetails?: ReportPlanDetails;
    sourceNotes?: Record<string, { kind: string; text: string }>;
    generatedSections?: ReportMaterialSection[];
    version: number;
    summary: string;
    supplement: string;
    plan: string;
    risk: string;
    status: string;
  }[];
  history: string[];
}

export interface ReportMaterialSection {
  summaryFormat?: 'markdown-overview';
  id: string;
  title: string;
  icon: string;
  description: string;
  enabled: boolean;
  needsAuth: boolean;
  records: ReportSource[];
  summary: string;
}
