export type ProjectHealth = 'at-risk' | 'blocked' | 'healthy' | 'watch';
export type ProjectType = 'custom-development' | 'oem' | 'standard-delivery';
export type KrKind = 'deliverable' | 'metric';
export type KrStatus = 'accepted' | 'at-risk' | 'in-progress' | 'missing' | 'pending';
export type ProjectStageStatus =
  | 'blocked'
  | 'completed'
  | 'in-progress'
  | 'pending'
  | 'ready';
export type ProjectInitiationStatus = 'approved' | 'draft' | 'pending';

export interface ProjectKr {
  id: string;
  title: string;
  kind: KrKind;
  owner: string;
  dueDate: string;
  status: KrStatus;
  weight: number;
  acceptance?: string;
  artifact?: string;
  target?: number;
  actual?: number;
  unit?: string;
  weeklyEvidence?: string;
  confidence?: number;
}

export interface ProjectObjective {
  id: string;
  code: string;
  title: string;
  description: string;
  owner: string;
  collaborators: string[];
  dueDate?: string;
  progress: number;
  health: ProjectHealth;
  krs: ProjectKr[];
}

export interface StageGateItem {
  id: string;
  name: string;
  type: 'approval' | 'deliverable' | 'metric' | 'milestone';
  satisfied: boolean;
  targetValue?: string;
  actualValue?: string;
  note?: string;
  description?: string;
}

export interface WeeklyReportDeliverable {
  id: string;
  name: string;
  size: string;
  uploadedAt: string;
}

export interface WeeklyReportBlocker {
  text: string;
  status: 'pending' | 'resolved';
  resolvedIn?: string;
}

export interface WeeklyReportItem {
  id: string;
  weekTitle?: string;
  title?: string;
  cycle?: string;
  weekRange?: string;
  reporter?: string;
  author?: string;
  submitDate?: string;
  submittedAt?: string;
  summary?: string;
  progressRate?: number;
  deliverablesSubmitted?: WeeklyReportDeliverable[];
  blockers?: WeeklyReportBlocker[];
  status?: any;
  [key: string]: any;
}

export interface TransitionRecord {
  time: string;
  operator: string;
  action: 'advance' | 'concession';
  actionLabel: string;
  fromStage: string;
  toStage: string;
  reason?: string;
}

export interface ProjectStage {
  id: string;
  code: string;
  name: string;
  description: string;
  owner: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  dependsOn: string[];
  entryCriteria: string;
  exitCriteria: string;
  entryGates?: StageGateItem[];
  exitGates?: StageGateItem[];
  exceptionRules?: StageExceptionRule;
  weeklyReports?: WeeklyReportItem[];
  transitionHistory?: TransitionRecord[];
  status: ProjectStageStatus;
  progress: number;
  health: ProjectHealth;
  objectives: ProjectObjective[];
}

export interface DeliverableStandard {
  id: string;
  name: string;
  stageName: string;
  requiredFormat: 'archive' | 'document' | 'link' | 'screenshot' | 'video';
  formatLabel: string;
  acceptanceCriteria: string;
  sampleName?: string;
  verifierRole: string;
}

export interface RaciItem {
  stageId: string;
  stageName: string;
  responsible: string;
  accountable: string;
  consulted: string;
  informed: string;
}

export interface StageExceptionRule {
  rejectionGracePeriodDays: number;
  rejectionProcess: string;
  changeThresholdDays: number;
  changeApprovalRole: string;
  concessionPolicy: string;
}

export interface ProjectCharter {
  id: string;
  projectId?: string;
  contractCode?: string;
  contractName?: string;
  title?: string;
  customer?: string;
  manager?: string;
  version?: string;
  contractRef?: string;
  governanceStandardRef?: string;
  scopeSummary?: string;
  sowSummary?: string;
  internalStandardNote?: string;
  businessGoals?: string[];
  raciMatrix?: any[];
  deliverableStandards?: any[];
  exceptionHandling?: string;
  budgetSummary?: string;
  resourceBudget?: {
    manDays: number;
    teamSize: number;
    environments: string[];
    hardwareDependencies?: string[];
  };
  changeControlRule?: string;
  status?: 'active' | 'approved' | 'draft';
  approvedAt?: string;
  approvedBy?: string;
  [key: string]: any;
}

export interface DualTrackWeeklyReport {
  id: string;
  userId: string;
  userName: string;
  cycle: string;
  submitDate: string;
  projectTracks: Array<{
    projectId: string;
    projectName: string;
    stageId: string;
    stageName: string;
    progressContribution: number;
    deliverables: Array<{
      id: string;
      name: string;
      format: string;
      criteriaChecked: boolean;
      fileUrl?: string;
    }>;
    blockers: Array<{
      issue: string;
      status: 'pending' | 'resolved';
    }>;
  }>;
  unplannedTasks: Array<{
    id: string;
    title: string;
    category: 'adhoc-meeting' | 'emergency' | 'presales' | 'support';
    categoryLabel: string;
    spentHours: number;
    collaborator: string;
    outcomeSummary: string;
  }>;
}

export interface LightweightTask {
  id: string;
  title: string;
  initiator: string;
  assignee: string;
  deadline: string;
  priority: 'high' | 'medium' | 'urgent';
  detail: string;
  status: 'completed' | 'dismissed' | 'pending' | 'replied';
  replyContent?: string;
  dismissReason?: string;
  autoRemindInWeeklyReport: boolean;
  createdAt: string;
}

export interface ManagedProject {
  id: string;
  code: string;
  name: string;
  parentProject?: string;
  department?: string;
  customer: string;
  type: ProjectType;
  typeLabel: string;
  manager: string;
  startDate: string;
  stage: string;
  dueDate: string;
  initiationStatus: ProjectInitiationStatus;
  initiationStatusLabel: string;
  progress: number;
  onTimeProbability: number;
  health: ProjectHealth;
  healthLabel: string;
  summary: string;
  charter?: ProjectCharter;
  stages: ProjectStage[];
  objectives: ProjectObjective[];
}

export interface ProjectTemplate {
  id: ProjectType;
  name: string;
  description: string;
  icon: string;
  objectiveCount: number;
  krCount: number;
  phases: string[];
  highlights: string[];
}

export interface ProjectStoryStage {
  id: number;
  label: string;
  shortLabel: string;
  health: ProjectHealth;
  healthLabel: string;
  probability: number;
  progress: number;
  headline: string;
  explanation: string;
  nextAction: string;
}

export interface ProjectDiscussion {
  id: string;
  objectLabel: string;
  author: string;
  role: string;
  time: string;
  content: string;
  aiSummary?: string;
}

export interface ProjectDemoState {
  stage: number;
  generatedArtifacts: string[];
  weeklyLinkConfirmed: boolean;
  escalationConfirmed: boolean;
  discussions: ProjectDiscussion[];
}
