export type InspectionStatus =
  '已完成' | '已暂停' | '已终止' | '待启用' | '执行中' | '草稿';
export interface InspectionExecution {
  id: string;
  date: string;
  owner: string;
  status:
    '处理中' | '已完成' | '已逾期' | '待执行' | '待派单' | '待生成' | '待验收';
  ticket: string;
  result: string;
  completedAt: string;
}
export interface InspectionPlan {
  configuration?: { overlapReason?: string; scopeReason?: string };
  contractId?: string;
  devices?: InspectionPlanDevice[];
  dispatchMode?: 'auto' | 'manual';
  firstDate?: string;
  contractText?: string;
  id: string;
  name: string;
  contract: string;
  customer: string;
  project: string;
  start: string;
  end: string;
  scope: string;
  requirements: string;
  frequency: string;
  owner: string;
  team: string;
  advanceDays: number;
  status: InspectionStatus;
  executions: InspectionExecution[];
  logs: { content: string; operator: string; time: string }[];
}

export interface InspectionDraft {
  contractId: string;
  name: string;
  contract: string;
  contractText: string;
  customer: string;
  project: string;
  start: string;
  end: string;
  scope: string;
  requirements: string;
  frequency: string;
  firstDate: string;
  owner: string;
  team: string;
  advanceDays: number;
}

export interface InspectionCheckItem {
  id: string;
  name: string;
  standard: string;
  required: boolean;
  evidence: string;
}
export interface InspectionTemplate {
  id: string;
  name: string;
  category: string;
  items: InspectionCheckItem[];
}
export interface InspectionDevice {
  model?: string;
  id: string;
  code: string;
  name: string;
  customer: string;
  project: string;
  location: string;
  category: string;
}
export interface InspectionPlanDevice extends InspectionDevice {
  templateId: string;
  items: InspectionCheckItem[];
}
export interface InspectionActivation {
  draft: InspectionDraft;
  devices: InspectionPlanDevice[];
  dispatchMode: 'auto' | 'manual';
  overlapReason?: string;
  scopeReason?: string;
  changeReason?: string;
}

export interface InspectionCheckResult {
  deviceId: string;
  itemId: string;
  result: '异常' | '正常';
  note: string;
  evidence: string;
}
export interface InspectionTicketData {
  planId: string;
  executionId: string;
  devices: InspectionPlanDevice[];
  results: InspectionCheckResult[];
  exceptionTicket?: string;
  acceptanceNote?: string;
}
