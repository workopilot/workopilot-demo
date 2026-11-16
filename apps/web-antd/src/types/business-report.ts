export interface BusinessReportItem {
  owner?: string;
  id: string;
  title: string;
  detail: string;
  status?: string;
  evidence: string;
}
export interface BusinessReportBlock {
  metrics?: { label: string; value: string; hint: string; icon: string }[];
  id: string;
  title: string;
  icon: string;
  summary: string;
  items: BusinessReportItem[];
  tone?: 'risk' | 'plan';
}
export interface BusinessReportProfile {
  serviceStartedAt?: string;
  taskRecords?: ProjectReportTask[];
  id: string;
  kind: 'project' | 'customer';
  label: string;
  name: string;
  manager: string;
  role: string;
  phase: string;
  projectNames: string[];
  stages: string[];
  stageIndex: number;
  conclusion: string;
  metrics: { label: string; value: string; hint: string; icon: string }[];
  progress?: { done: number; total: number; label: string };
  service?: {
    resolved: number;
    open: number;
    categories: { label: string; count: number }[];
  };
  milestones: {
    title: string;
    planned: string;
    actual: string;
    status: string;
  }[];
  blocks: BusinessReportBlock[];
  sourcePath: string[];
}
export interface ProjectReportTask extends BusinessReportItem {
  owner: string;
  state: 'completed' | 'active' | 'delayed';
  periodPlanned?: boolean;
  nextPeriod?: boolean;
}
export interface BusinessReportEdits {
  customerNotes?: Record<string, string>;
  conclusion: string;
  health: string;
  forecast: string;
  notes: Record<string, string>;
  reviewed: string[];
}
export interface BusinessReportState {
  templateVersion?: string;
  dataSources?: string[];
  objectId?: string;
  scenario: string;
  drafts: Record<string, BusinessReportEdits>;
  updatedAt: string;
  /** Submitted preview uses the same saved collection snapshot. */
  snapshots?: Record<string, BusinessReportProfile>;
}

export interface CustomerReportApproval {
  status: 'pending' | 'approved' | 'changes';
  reviewer: string;
  version: number;
  feedback?: string;
  score?: number;
  reviewedAt?: string;
  sharedAt?: string;
  sharedWith?: string;
}
