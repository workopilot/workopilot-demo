export interface ContractScheme {
  contractCategory?: 'purchase' | 'sales' | 'service';
  enabled?: boolean;
  management?: ContractManagementConfig;
  id: string;
  name: string;
  purpose: string;
  categoryIds: string[];
  fields: string[];
  scope: string;
  owner: string;
  version: number;
  status: 'disabled' | 'draft' | 'published';
  updatedAt: string;
  releases: { date: string; note: string; owner: string; version: number }[];
}

export interface ContractArchiveManagement {
  summary: string;
  auditStatus: 'issues' | 'passed' | 'pending' | 'skipped';
  auditNote: string;
  auditHandlingNote?: string;
  auditItems?: {
    detail?: string;
    evidence?: string;
    handlingNote?: string;
    severity?: 'BLOCK' | 'WARNING';
    status: 'blocked' | 'passed' | 'unknown' | 'warning';
    title: string;
  }[];
  auditConfirmed: boolean;
  dateConfirmed: boolean;
  expiryDate: string;
  remindersConfirmed: boolean;
  archived: boolean;
}

export interface ContractChatSession {
  contractId?: string;
  sessionId?: string;
  ownerId?: string;
  uploadedBy?: string;
  revision?: number;
  changes?: ContractChange[];
  end?: {
    actor: string;
    date: string;
    kind: 'terminated' | 'void';
    reason: string;
  };
  renewal?: {
    decision: 'no-renew' | 'renew' | 'undecided';
    newContractId?: string;
    note: string;
  };
  previousContractId?: string;
  supplementaryFiles?: { at: string; file?: File; name: string }[];

  department?: string;
  extractedFields?: Record<string, string>;
  extractionSnapshot?: Record<string, string>;
  extractionEvidence?: Record<string, string>;
  managementState?: ContractArchiveManagement;
  id: string;
  fileName: string;
  phase: number;
  scheme?: ContractScheme;
  available: ContractScheme[];
  pickedScheme: string;
  scope: string;
  location: string;
  count: number;
  special: string;
  start: string;
  team: string;
  owner: string;
  plans: {
    amount?: number;
    content: string;
    date: string;
    kind?: 'collection' | 'invoice';
    title?: string;
  }[];
  notes: { role: 'assistant' | 'user'; text: string }[];
  file?: File;
  draftText: string;
  editing: boolean;
  time: string;
  createdAt?: string;
  demo?: boolean;
  businessType?: 'maintenance' | 'purchase' | 'sales';
  contractNumber?: string;
  counterparty?: string;
  company?: string;
  amount?: number;
  signedAt?: string;
  invoiceTerms?: string;
  paymentTerms?: string;
  sourceText?: string;
  salesManager?: string;
  deliveryDate?: string;
  acceptanceRequirements?: string;
}

export interface ContractLifecycleAction {
  purpose?: 'renewal-review';
  id: string;
  name: string;
  trigger: 'after-expiry' | 'before-expiry' | 'on-expiry' | 'renewal-confirmed';
  days: number;
  action: 'message' | 'renewal-draft' | 'todo';
  recipients: string[];
  description: string;
  stopWhen: string[];
}
export interface ContractFulfillmentConfig {
  id: string;
  type:
    | 'acceptance'
    | 'collection'
    | 'custom'
    | 'delivery'
    | 'inspection'
    | 'invoice'
    | 'payment'
    | 'project'
    | 'service';
  name: string;
  fields: string[];
  trigger: 'after-event' | 'archived' | 'before-date' | 'contract' | 'on-date';
  party?: 'contract' | 'counterparty' | 'our';
  schedule?: 'contract' | 'once' | 'recurring' | 'staged';
  reminderDays?: number;
  triggerField?: string;
  advanceDays?: number;
  event?: string;
  method: 'assistant' | 'manual';
  handler?: string;
  responsibility: 'execution' | 'field' | 'owner';
  ownerField?: string;
}

export interface ContractFieldMapping {
  source: string;
  path?: string;
  target: string;
  extensionKey?: string;
  transform?:
    'amount' | 'auto' | 'date' | 'json' | 'number' | 'text' | 'wan-amount';
  enumMap?: string;
  required?: boolean;
}

export interface ContractExtractionField {
  key: string;
  name: string;
  type: 'amount' | 'date' | 'detail' | 'option' | 'text';
  required: boolean;
  instruction: string;
  options?: string[];
  columns?: {
    key: string;
    name: string;
    required?: boolean;
    type: 'amount' | 'date' | 'text';
  }[];
}

export interface ContractManagementConfig {
  extraction?: ContractExtractionField[];
  fulfillment?: ContractFulfillmentConfig[];
  categoryKey: string;
  code: string;
  mappings: ContractFieldMapping[];
  summary: {
    missing: string;
    requirements: string;
  };
  audit: {
    mode: 'intelligent' | 'none';
    resultHandling: string;
    ruleIds?: string[];
    schemeId?: string;
  };
  lifecycle: {
    actions: ContractLifecycleAction[];
    automaticRenewal: 'clause' | 'confirm' | 'none';
    changeHandling: string;
    durationMonths?: number;
    expiryBasis: 'contract' | 'duration' | 'explicit';
    missingDate: 'ask' | 'estimate';
    reminderTemplateId?: string;
    renewalInstructions: string;
    startBasis:
      'acceptance' | 'contract' | 'delivery' | 'fixed' | 'go-live' | 'signing';
  };
}

/** 业务模块回传的合同关联事项，仅用于进展展示。 */
export interface ContractRelatedItem {
  id: string;
  type: 'collection' | 'inspection' | 'invoice' | 'project';
  name: string;
  owner: string;
  status: 'completed' | 'in-progress' | 'overdue' | 'pending';
  plannedDate: string;
  updatedAt: string;
  progress: string;
  reference?: string;
  needsReview?: boolean;
  reviewReason?: string;
  reviewNote?: string;
  plannedCount?: number;
  completedCount?: number;
  amount?: number;
  completedAmount?: number;
}

export type ContractPermission = 'handle' | 'manage' | 'view';
export interface ContractAuthorizationRule {
  id: string;
  name: string;
  subjectType: 'department' | 'role' | 'user';
  subjectId: string;
  subjectName: string;
  permission: ContractPermission;
  scope: 'all' | 'department' | 'owned' | 'specified';
  categoryId: string;
  contractIds: string[];
  enabled: boolean;
  updatedAt: string;
}
export interface ContractAccessGrant {
  id: string;
  userId: string;
  userName: string;
  permission: ContractPermission;
  updatedAt: string;
}
export interface ContractAccessEntry {
  userId?: string;
  id: string;
  name: string;
  permission: ContractPermission;
  source: 'manual' | 'owner' | 'rule';
  sourceLabel: string;
  grantId?: string;
}

export interface ContractChange {
  id: string;
  at: string;
  actor: string;
  description: string;
  fields: { after: string; before: string; label: string }[];
}
export interface ContractReminderRecord {
  id: string;
  actionId: string;
  cycle: string;
  name: string;
  date?: string;
  status:
    'cancelled' | 'completed' | 'failed' | 'processing' | 'sent' | 'waiting';
  note: string;
  at?: string;
}
export interface ContractBusinessDraft {
  name: string;
  owner: string;
  rows: { amount?: number; date: string; name: string }[];
}
