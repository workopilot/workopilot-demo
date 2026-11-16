import { reactive } from 'vue';
import type { ReportPeriod, ReportKind } from '#/types/zhiji';
import { createMockResponse, mockDelay } from './mock-data';
export interface PersonalReportSetting {
  enabled: boolean;
  weekday: number;
  monthDay: number;
  time: string;
  workdaysOnly: boolean;
  recipients: string[];
  approvalEnabled: boolean;
  reviewers: string[];
  recipientIds?: string[];
  reviewerIds?: string[];
  updatedAt?: string;
}
export const personalReportSettingTypes: {
  key: string;
  schemeId: string;
  title: string;
  kind: ReportKind;
  period: ReportPeriod;
  icon: string;
}[] = [
  {
    key: 'daily',
    schemeId: 'daily',
    title: '个人日报',
    kind: 'personal',
    period: 'day',
    icon: 'lucide:sun',
  },
  {
    key: 'weekly',
    schemeId: 'weekly',
    title: '个人周报',
    kind: 'personal',
    period: 'week',
    icon: 'lucide:calendar-days',
  },
  {
    key: 'project:week',
    schemeId: 'project',
    title: '项目周报',
    kind: 'project',
    period: 'week',
    icon: 'lucide:folder-kanban',
  },
  {
    key: 'project:month',
    schemeId: 'project',
    title: '项目月报',
    kind: 'project',
    period: 'month',
    icon: 'lucide:folder-clock',
  },
  {
    key: 'customer:week',
    schemeId: 'customer',
    title: '客户周报',
    kind: 'customer',
    period: 'week',
    icon: 'lucide:building-2',
  },
  {
    key: 'customer:month',
    schemeId: 'customer',
    title: '客户月报',
    kind: 'customer',
    period: 'month',
    icon: 'lucide:calendar-range',
  },
];
export const personalReportSettings = reactive<
  Record<string, PersonalReportSetting>
>({});
export function personalReportSettingKey(
  schemeId: string,
  period?: ReportPeriod,
) {
  return ['project', 'customer'].includes(schemeId)
    ? `${schemeId}:${period ?? (schemeId === 'project' ? 'week' : 'month')}`
    : schemeId;
}
export function getPersonalReportSetting(
  schemeId: string,
  period?: ReportPeriod,
) {
  return personalReportSettings[personalReportSettingKey(schemeId, period)];
}
export function defaultPersonalReportSetting(
  kind: ReportKind,
): PersonalReportSetting {
  return {
    enabled: false,
    weekday: 6,
    monthDay: 1,
    time: '09:00',
    workdaysOnly: true,
    recipients: [],
    approvalEnabled: kind === 'customer',
    reviewers: kind === 'customer' ? ['杨总'] : [],
  };
}
export function personalScheduleLabel(
  setting: PersonalReportSetting | undefined,
  period: ReportPeriod = 'week',
) {
  if (!setting) return undefined;
  if (!setting.enabled) return '未开启自动生成';
  return `${period === 'day' ? (setting.workdaysOnly ? '工作日' : '每天') : period === 'month' ? `每月 ${setting.monthDay} 日` : `每周${['', '一', '二', '三', '四', '五', '六', '日'][setting.weekday]}`} ${setting.time}（北京时间）生成草稿`;
}
const saveRevisions: Record<string, number> = {};
export async function savePersonalReportSettings(
  settings: Record<string, PersonalReportSetting>,
) {
  const saved = JSON.parse(JSON.stringify(settings)) as Record<
    string,
    PersonalReportSetting
  >;
  const revisions = Object.fromEntries(
    Object.keys(saved).map((key) => [
      key,
      (saveRevisions[key] = (saveRevisions[key] ?? 0) + 1),
    ]),
  );
  await mockDelay(300);
  const updatedAt = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
  });
  for (const [key, setting] of Object.entries(saved)) {
    setting.updatedAt = updatedAt;
    if (!setting.approvalEnabled) {
      setting.reviewers = [];
      setting.reviewerIds = [];
    }
    if (saveRevisions[key] === revisions[key])
      personalReportSettings[key] = setting;
  }
  return createMockResponse(saved);
}
