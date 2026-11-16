<script setup lang="ts">
import type {
  ReportDraft,
  ReportAttachment,
  ReportSource,
  ReportMaterialSection,
  ReportScheme,
} from '#/types/new-report';
import { computed, nextTick, ref, watch } from 'vue';
import BusinessReportWorkbench from './components/BusinessReportWorkbench.vue';
import ProjectReportWorkbench from './components/ProjectReportWorkbench.vue';
import BusinessReportList from './components/BusinessReportList.vue';
import ReportHub from './components/ReportHub.vue';
import { reportCategories } from '#/api/mock-report-hub';
import type { ReportCategory } from '#/api/mock-report-hub';
import ReportBreadcrumb from './components/ReportBreadcrumb.vue';
import { reportApprovalPolicies } from '#/api/mock-report-approval-policies';
import {
  getPersonalReportSetting,
  personalScheduleLabel,
  personalReportSettingKey,
  defaultPersonalReportSetting,
  savePersonalReportSettings,
} from '#/api/mock-personal-report-settings';
import { personalReportOverview } from '#/api/mock-personal-report-statistics';
import PreviewTemplateBar from './components/PreviewTemplateBar.vue';
import { printReportElement } from '#/utils/report-presentation';
import PersonalSourceCard from './components/PersonalSourceCard.vue';
import ReportMarkdown from './components/ReportMarkdown.vue';
import ReportPreview from './components/ReportPreview.vue';
import ReportAttachments from './components/ReportAttachments.vue';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { mockDelay, createMockResponse } from '#/api/mock-data';
import {
  sourceDefinitions,
  settingsFor,
  materialSections,
  reportSourceSettings,
  gitConnection,
} from '#/api/mock-report-materials';
import type { SourceSettings } from '#/api/mock-report-materials';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import {
  Button,
  Checkbox,
  ConfigProvider,
  Drawer,
  Input,
  Modal,
  DatePicker,
  Switch,
  Select,
  message,
  theme,
} from 'ant-design-vue';
import { demoReports, makeReport, reportSchemes } from '#/api/mock-new-reports';
import { reportObjects, defaultReportObject } from '#/api/mock-report-objects';
import { newBusinessState } from '#/api/mock-business-reports';
import { zhijiSchemes } from '#/api/mock-zhiji';
import type { ReportPeriod } from '#/types/zhiji';
import {
  reportPeriods,
  periodLabel,
  reportPeriodRange,
} from '#/utils/report-period';

const route = useRoute();
const router = useRouter();
const historyLocation = computed(() => ({
  name: 'NewReportAssistantHistory',
  params: {
    employeeId: String(route.params.employeeId || 'new-report-assistant'),
  },
}));
watch(
  () => route.query.view,
  (value) => {
    if (value === 'history') void router.replace(historyLocation.value);
  },
  { immediate: true },
);
const viewMode = ref<'edit' | 'preview'>(
  route.query.view === 'preview' ? 'preview' : 'edit',
);
const previewReport = ref<ReportDraft>();
const previewSections = ref<ReportMaterialSection[]>([]);
const businessEditor = ref<
  | InstanceType<typeof BusinessReportWorkbench>
  | InstanceType<typeof ProjectReportWorkbench>
>();
const isBusiness = computed(() =>
  ['project', 'customer'].includes(scheme.value?.id ?? ''),
);
const sourceEditors = ref<InstanceType<typeof PersonalSourceCard>[]>([]);
function openPreview() {
  businessEditor.value?.savePending();
  sourceEditors.value.forEach((editor) => editor.savePending());
  saveDraft();
  if (!current.value) return;
  previewReport.value = JSON.parse(JSON.stringify(current.value));
  previewSections.value = copySections(sections.value);
  viewMode.value = 'preview';
}
const pageRoot = ref<HTMLElement>();
const documentRoot = ref<HTMLElement>();
const bodyRoot = ref<HTMLElement>();
const readonly = computed(() => current.value?.status === 'submitted');
const regenerationScope = ref('all');
const candidateSections = ref<ReportMaterialSection[]>([]);
const candidateReportId = ref('');
const generationLabel = computed(() =>
  regenerationScope.value === 'all'
    ? '整篇报告'
    : (sourceDefinitions.find((item) => item.id === regenerationScope.value)
        ?.title ?? '来源章节'),
);
function copySections(value: ReportMaterialSection[]) {
  return JSON.parse(JSON.stringify(value)) as ReportMaterialSection[];
}
function readingScroller() {
  return documentRoot.value &&
    getComputedStyle(documentRoot.value).overflowY === 'auto'
    ? documentRoot.value
    : bodyRoot.value;
}
watch(
  () => route.fullPath,
  async () => {
    viewMode.value = route.query.view === 'preview' ? 'preview' : 'edit';
    await nextTick();
    const root = readingScroller();
    if (root) root.scrollTop = 0;
  },
);
watch(
  () => route.query.scheme,
  async () => {
    await nextTick();
    if (pageRoot.value) pageRoot.value.scrollTop = 0;
  },
);
const schemes = computed(() => reportSchemes.filter((s) => s.enabled));
const scheme = computed(() =>
  schemes.value.find((s) => s.id === route.query.scheme),
);
const reports = computed(() =>
  demoReports.filter((r) => r.schemeId === scheme.value?.id),
);
const current = computed(
  () =>
    reports.value.find((r) => r.id === route.query.report) ?? reports.value[0],
);
const isPersonal = computed(() => scheme.value?.type === '个人报告');

function setAttachments(key: string, files: ReportAttachment[]) {
  if (!current.value || readonly.value) return;
  current.value.attachments = { ...current.value.attachments, [key]: files };
}
const overviewMarkdown = computed(() => {
  return personalReportOverview(
    visibleSections.value,
    current.value?.period ?? 'week',
  );
});
const visibleSections = computed(() =>
  isPersonal.value
    ? sections.value.filter((item) => item.enabled)
    : sections.value,
);
function saveSourceNote(id: string, note: { kind: string; text: string }) {
  const report = current.value;
  if (!report || readonly.value) return;
  saveDraft();
  remember(report);
  report.sourceNotes = { ...report.sourceNotes, [id]: note };
  report.filledAt = new Date().toLocaleString('zh-CN');
  report.history.unshift(
    `已补充${sourceDefinitions.find((item) => item.id === id)?.title}：${note.kind}`,
  );
  message.success('补充已保存到本期来源卡片');
}
function disableSource(id: string) {
  const report = current.value;
  if (!report || readonly.value) return;
  saveDraft();
  remember(report);
  reportSourceSettings[report.id] = { ...settingsFor(report.id), [id]: false };
  report.generatedSections = copySections(sections.value).map((item) =>
    item.id === id
      ? { ...item, enabled: false, records: [], summary: '' }
      : item,
  );
  report.summary = buildSummary();
  message.success('本期已关闭此数据源，可在顶部数据源设置中恢复');
}
const entrySchemes = computed(() =>
  schemes.value.flatMap<
    ReportScheme & { entryPeriod?: 'week' | 'month'; entryKey: string }
  >((s) =>
    ['project', 'customer'].includes(s.id)
      ? (['week', 'month'] as const).map((period) => ({
          ...s,
          title: `${s.id === 'project' ? '项目' : '客户'}${periodLabel(period)}`,
          entryPeriod: period,
          entryKey: `${s.id}:${period}`,
        }))
      : [{ ...s, entryPeriod: undefined, entryKey: s.id }],
  ),
);
const fixedBusinessPeriod = computed<'week' | 'month'>(() =>
  (route.query.cycle ??
    current.value?.period ??
    (scheme.value?.id === 'customer' ? 'month' : 'week')) === 'month'
    ? 'month'
    : 'week',
);
const businessListVisible = computed(
  () => isBusiness.value && !route.query.report,
);
const currentReportType = computed(
  () =>
    entrySchemes.value.find(
      (item) =>
        item.entryKey ===
        (isBusiness.value
          ? `${scheme.value?.id}:${fixedBusinessPeriod.value}`
          : scheme.value?.id),
    )?.title ??
    scheme.value?.title ??
    '报告',
);
const currentBusinessName = computed(() => {
  const report = current.value;
  if (!report || !isBusiness.value) return undefined;
  return (
    reportObjects.find(
      (item) =>
        item.id ===
        (report.business?.objectId ?? defaultReportObject(report.schemeId)),
    )?.name ?? report.title
  );
});
const hubCategory = computed(
  () => reportCategories.find((item) => item.id === route.query.category)?.id,
);
const currentCategory = computed<ReportCategory>(() =>
  scheme.value?.id === 'project'
    ? 'project'
    : scheme.value?.id === 'customer'
      ? 'customer'
      : scheme.value?.id === 'productline'
        ? 'productline'
        : 'personal',
);
const currentCategoryTitle = computed(
  () =>
    reportCategories.find((item) => item.id === currentCategory.value)?.title ??
    '个人报告',
);
function openCategory(category?: ReportCategory) {
  navigate(category ? { category } : {});
}
function backToCategory() {
  openCategory(currentCategory.value);
}
function openHubReport(report: ReportDraft) {
  navigate({
    scheme: report.schemeId,
    report: report.id,
    ...(report.period ? { cycle: report.period } : {}),
    ...(report.status === 'submitted' ? { view: 'preview' } : {}),
  });
}
function openBusinessReport(objectId: string, start: string, end: string) {
  if (!scheme.value) return;
  let report = reports.value.find(
    (item) =>
      item.start === start &&
      item.end === end &&
      (item.business?.objectId ?? defaultReportObject(item.schemeId)) ===
        objectId,
  );
  if (!report) {
    report = makeReport(scheme.value, start, end);
    report.period = fixedBusinessPeriod.value;
    report.business = { ...newBusinessState(scheme.value.id), objectId };
    demoReports.push(report);
  }
  navigate({
    scheme: scheme.value.id,
    cycle: fixedBusinessPeriod.value,
    report: report.id,
  });
}
function backToBusinessList() {
  backToCategory();
}
function exportPersonalPdf() {
  const element = pageRoot.value?.querySelector<HTMLElement>(
    '.report-final-preview',
  );
  if (element) printReportElement(element, current.value?.title ?? '个人报告');
}
const supplement = ref(current.value?.supplement ?? '');
const plan = ref(current.value?.plan ?? '');
const risk = ref(current.value?.risk ?? '');
const dirty = computed(
  () =>
    !!current.value &&
    (supplement.value !== current.value.supplement ||
      plan.value !== current.value.plan ||
      risk.value !== current.value.risk),
);
watch(
  () => current.value?.id,
  () => {
    supplement.value = current.value?.supplement ?? '';
    plan.value = current.value?.plan ?? '';
    risk.value = current.value?.risk ?? '';
    analyzed.value = false;
  },
);
const modal = ref<'' | 'regenerate' | 'submit' | 'task' | 'schedule'>('');
const busy = ref(false);
const candidate = ref('');
const source = ref<ReportSource>();
const versionOpen = ref(false);
const recipients = ref<string[]>([]);
const reviewers = ref<string[]>([]);
const rememberSubmitOptions = ref(false);
const submitting = ref(false);
const people = [
  { label: '杨总', value: '杨总' },
  { label: '小刚', value: '小刚' },
  { label: '产品团队', value: '产品团队' },
  { label: '交付项目组', value: '交付项目组' },
  { label: '客户服务组', value: '客户服务组' },
  { label: '王安康', value: '王安康' },
  { label: 'PMO / 项目管理部', value: 'PMO / 项目管理部' },
];
const analyzed = ref(false);
const analysisText = ref('');
const targetProject = computed(() =>
  scheme.value?.id === 'customer'
    ? '华辰医药 · 运维服务'
    : /EDB/i.test(analysisText.value)
      ? '曼伦 EDB 项目'
      : '喔壳平台 · 汇报引擎',
);
const match = computed(() =>
  scheme.value?.id === 'customer' || /EDB/i.test(analysisText.value)
    ? 'new'
    : /Demo|demo|页面|原型/.test(analysisText.value)
      ? 'covered'
      : /联调|接口/.test(analysisText.value)
        ? 'partial'
        : 'new',
);
const taskTitle = ref('');
const taskOwner = ref('王安康');
const taskDate = ref('2026-10-30');
const materialConsent = ref(false);
const matchedTask = computed(() =>
  match.value === 'covered'
    ? 'T-108 · 新汇报助理交互 Demo'
    : 'T-210 · 接口联调',
);
const scheduleText = ref('每周六 09:00 自动生成');
const scheduleResult = ref('');
const scheduled = ref<Record<string, string>>({});

function remember(report: ReportDraft) {
  report.versions.unshift({
    business: report.business
      ? JSON.parse(JSON.stringify(report.business))
      : undefined,
    attachments: JSON.parse(JSON.stringify(report.attachments ?? {})),
    sourceNotes: JSON.parse(JSON.stringify(report.sourceNotes ?? {})),
    planDetails: report.planDetails ? { ...report.planDetails } : undefined,
    version: report.version,
    summary: report.summary,
    supplement: report.supplement,
    plan: report.plan,
    risk: report.risk,
    status: report.status,
    generatedSections: copySections(
      report.generatedSections ?? materialSections(report),
    ),
  });
  report.version += 1;
}
function saveDraft() {
  businessEditor.value?.savePending();
  const r = current.value;
  if (!r || readonly.value || !dirty.value) return;
  r.supplement = supplement.value;
  r.plan = plan.value;
  r.risk = risk.value;
  r.filledAt = new Date().toLocaleString('zh-CN');
  message.success('人工补充已保存到当前演示草稿');
}
function selectBusinessObject(objectId: string) {
  const report = current.value;
  const selectedScheme = scheme.value;
  const object = reportObjects.find(
    (item) => item.id === objectId && item.kind === selectedScheme?.id,
  );
  if (!report || !selectedScheme || !object) return;
  saveDraft();
  let target = reports.value.find(
    (item) =>
      item.start === report.start &&
      item.end === report.end &&
      (item.business?.objectId ?? defaultReportObject(item.schemeId)) ===
        objectId,
  );
  if (!target) {
    target = makeReport(selectedScheme, report.start, report.end);
    target.business = { ...newBusinessState(selectedScheme.id), objectId };
    target.period = report.period ?? selectedPeriod.value;
    const config = report.schemeConfig ?? activeSchemeConfig.value;
    target.schemeConfig = config
      ? JSON.parse(JSON.stringify(config))
      : undefined;
    target.title = object.name + ' · ' + selectedScheme.title;
    demoReports.push(target);
  }
  navigate({
    scheme: selectedScheme.id,
    report: target.id,
    cycle: selectedPeriod.value,
  });
}
function saveHistoryContext() {
  sourceEditors.value.forEach((editor) => editor.savePending());
  saveDraft();
}
function openHistory() {
  saveHistoryContext();
  void router.push(historyLocation.value);
}
function navigate(query: Record<string, string>) {
  saveDraft();
  void router.push({ path: route.path, query });
}
async function regenerate(scope = 'all') {
  if (isBusiness.value) {
    await businessEditor.value?.regenerate(scope);
    return;
  }
  if (readonly.value || busy.value) return;
  saveDraft();
  const r = current.value;
  if (!r) return;
  if (scope !== 'all') {
    const item = sections.value.find((entry) => entry.id === scope);
    if (!item?.enabled || item.needsAuth) return;
  }
  regenerationScope.value = scope;
  candidateReportId.value = r.id;
  busy.value = true;
  try {
    await mockDelay(550);
    if (current.value?.id !== r.id || r.status === 'submitted') return;
    const fresh = materialSections(r);
    candidateSections.value = copySections(
      scope === 'all' ? fresh : fresh.filter((item) => item.id === scope),
    );
    candidate.value = createMockResponse(
      scope === 'all'
        ? buildSummary(fresh)
        : candidateSections.value[0]?.summary || '本周期暂无新的采集素材。',
    ).data;
    modal.value = 'regenerate';
  } finally {
    busy.value = false;
  }
}
function adopt() {
  const r = current.value;
  if (!r || readonly.value || r.id !== candidateReportId.value) {
    modal.value = '';
    return;
  }
  remember(r);
  const next =
    regenerationScope.value === 'all'
      ? candidateSections.value
      : sections.value.map(
          (item) =>
            candidateSections.value.find((part) => part.id === item.id) ?? item,
        );
  r.generatedSections = copySections(next);
  r.summary = buildSummary(next);
  r.sourceUpdatedAt ??= {};
  for (const section of candidateSections.value)
    r.sourceUpdatedAt[section.id] = new Date().toLocaleTimeString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
    });
  r.history.unshift(
    `重新采集并采用${generationLabel.value}的内容；人工补充和下一步计划保持不变。`,
  );
  modal.value = '';
  message.success(`已重新生成${generationLabel.value}，请核对后提报`);
}
function openSubmit() {
  if (readonly.value || busy.value) return;
  sourceEditors.value.forEach((editor) => editor.savePending());
  saveDraft();
  rememberSubmitOptions.value = false;
  const preference = current.value
    ? getPersonalReportSetting(current.value.schemeId, current.value.period)
    : undefined;
  const canAdjust =
    current.value?.schemeConfig?.allowAdjustRecipients !== false;
  recipients.value = [
    ...(preference && canAdjust
      ? preference.recipients
      : current.value?.recipients.length
        ? current.value.recipients
        : (current.value?.schemeConfig?.recipients ?? [])),
  ];
  reviewers.value = [
    ...(preference && canAdjust
      ? preference.approvalEnabled
        ? preference.reviewers
        : []
      : current.value?.reviewers.length
        ? current.value.reviewers
        : (current.value?.schemeConfig?.reviewers ?? [])),
  ];
  if (current.value?.schemeId === 'customer')
    reviewers.value = [...new Set(['杨总', ...reviewers.value])];
  if (
    current.value?.schemeId === 'project' &&
    !recipients.value.includes('PMO / 项目管理部')
  )
    recipients.value.push('PMO / 项目管理部');
  modal.value = 'submit';
}
async function submit() {
  if (readonly.value || submitting.value) return;
  if (!recipients.value.length && !reviewers.value.length) {
    message.warning('请选择至少一位分享对象或指定反馈人');
    return;
  }
  const r = current.value;
  if (!r) return;
  submitting.value = true;
  if (
    rememberSubmitOptions.value &&
    (r.schemeConfig ?? activeSchemeConfig.value)?.allowAdjustRecipients !==
      false
  ) {
    const kind =
      r.schemeConfig?.type ??
      activeSchemeConfig.value?.type ??
      (r.schemeId === 'customer'
        ? 'customer'
        : r.schemeId === 'project'
          ? 'project'
          : r.schemeId === 'productline'
            ? 'productline'
            : 'personal');
    const config = r.schemeConfig ?? activeSchemeConfig.value;
    const setting = getPersonalReportSetting(r.schemeId, r.period) ?? {
      ...defaultPersonalReportSetting(kind),
      enabled: config?.autoGenerate ?? false,
      time: config?.generateTime ?? '09:00',
      weekday: Math.max(1, Math.min(7, config?.generateDay ?? 6)),
      monthDay: Math.max(1, Math.min(28, config?.generateDay ?? 1)),
    };
    try {
      await savePersonalReportSettings({
        [personalReportSettingKey(r.schemeId, r.period)]: {
          ...setting,
          recipients: [...recipients.value],
          reviewers: [...reviewers.value],
          // Resolve personnel IDs again from these names when personal settings is opened.
          recipientIds: undefined,
          reviewerIds: undefined,
          approvalEnabled: reviewers.value.length > 0,
        },
      });
    } catch {
      submitting.value = false;
      message.error('未能记住本次选项，请重试，或取消勾选后提交');
      return;
    }
  }
  r.approvalRule =
    reportApprovalPolicies[
      r.schemeConfig?.type ??
        (r.schemeId === 'customer'
          ? 'customer'
          : r.schemeId === 'project'
            ? 'project'
            : 'personal')
    ];
  r.submittedAt = new Date().toLocaleString('zh-CN');
  r.filledAt ??= r.submittedAt;
  if (r.schemeId === 'customer') {
    reviewers.value = [...new Set(['杨总', ...reviewers.value])];
    r.customerApproval = {
      status: 'pending',
      reviewer: '杨总',
      version: r.version,
    };
  }
  if (
    r.schemeId === 'project' &&
    !recipients.value.includes('PMO / 项目管理部')
  )
    recipients.value.push('PMO / 项目管理部');
  r.recipients = [...recipients.value];
  r.reviewers = [...reviewers.value];
  r.generatedSections = copySections(sections.value);
  r.status = 'submitted';
  if (!isBusiness.value) previewReport.value = JSON.parse(JSON.stringify(r));
  analyzed.value = false;
  r.history.unshift(
    `已演示分发至 ${[...new Set([...recipients.value, ...reviewers.value])].join('、')}；指定反馈人 ${reviewers.value.length} 位。`,
  );
  modal.value = '';
  submitting.value = false;
  message.success('已完成演示提报，未向真实人员发送消息');
}
function analyzePlan() {
  if (readonly.value) return;
  if (!plan.value.trim()) {
    message.warning('先填写一条下一步计划');
    return;
  }
  analysisText.value = plan.value.trim();
  analyzed.value = true;
}
function openTask() {
  if (readonly.value) return;
  taskTitle.value = analysisText.value;
  taskOwner.value = '王安康';
  taskDate.value = match.value === 'covered' ? '2026-10-25' : '2026-10-30';
  materialConsent.value = false;
  modal.value = 'task';
}
function confirmTask() {
  if (readonly.value) return;
  const r = current.value;
  if (!r || !r.materials.includes(analysisText.value)) {
    message.warning('请先确认将该计划转为项目素材，再决定任务操作');
    return;
  }
  if (!taskTitle.value.trim() || !taskOwner.value || !taskDate.value) {
    message.warning('请补齐任务标题、负责人和计划日期');
    return;
  }
  if (r.actions.some((a) => a.title === analysisText.value)) {
    message.info('这条计划已处理，请勿重复创建');
    modal.value = '';
    return;
  }
  const kind =
    match.value === 'covered'
      ? '关联已有任务'
      : match.value === 'partial'
        ? '补充子任务'
        : '创建任务';
  r.actions.push({
    id: `ACT-${r.id}-${r.actions.length + 1}`,
    title: analysisText.value,
    target:
      match.value === 'new'
        ? `${taskTitle.value} · ${taskOwner.value} · ${taskDate.value}`
        : `${matchedTask.value} · ${taskTitle.value}`,
    kind,
  });
  r.history.unshift(`${kind}：${taskTitle.value}（仅演示记录）。`);
  modal.value = '';
  message.success('已记录确认后的演示动作，未写入真实任务系统');
}
function confirmMaterial() {
  if (readonly.value) return;
  const r = current.value;
  if (!r || !materialConsent.value) return;
  if (!r.materials.includes(analysisText.value)) {
    r.materials.push(analysisText.value);
    r.history.unshift(
      `已确认向 ${targetProject.value} 披露计划素材（演示），尚未执行任务写入。`,
    );
  }
  message.success('项目素材已确认；可以继续确认任务，也可以暂不处理');
}
function parseSchedule() {
  const text = scheduleText.value.trim();
  const day = text.match(/每周([一二三四五六日天])/);
  const time = text.match(/([01]?\d|2[0-3])[:：]([0-5]\d)/);
  if (!day || !time) {
    scheduleResult.value = '';
    message.info('请补充明确的每周几和时间，例如“每周六 09:00 自动生成”');
    return;
  }
  scheduleResult.value = `每周${day[1]} ${time[1]?.padStart(2, '0')}:${time[2]}（北京时间），生成当前方案上一完整周期的草稿`;
}
async function saveSchedule() {
  if (!scheme.value || !scheduleResult.value) return;
  const weekday = scheduleText.value.match(/每周([一二三四五六日天])/);
  const time = scheduleText.value.match(/([01]?\d|2[0-3])[:：]([0-5]\d)/);
  if (!weekday || !time) return;
  const period = current.value?.period ?? 'week';
  const setting = JSON.parse(
    JSON.stringify(
      getPersonalReportSetting(scheme.value.id, period) ??
        defaultPersonalReportSetting(
          scheme.value.id === 'customer'
            ? 'customer'
            : scheme.value.id === 'project'
              ? 'project'
              : 'personal',
        ),
    ),
  );
  setting.enabled = true;
  setting.weekday =
    weekday[1] === '天' ? 7 : '一二三四五六日'.indexOf(weekday[1]!) + 1;
  setting.time = `${time[1]?.padStart(2, '0')}:${time[2]}`;
  await savePersonalReportSettings({
    [personalReportSettingKey(scheme.value.id, period)]: setting,
  });
  scheduled.value[scheme.value.id] = scheduleResult.value;
  modal.value = '';
  message.success('演示计划已保存；此 Demo 不运行真实定时任务');
}
const configOpen = ref(false);
const authOpen = ref(false);
const authConsent = ref(false);
const configDraft = ref<SourceSettings>({});
const activeSection = ref('overview');
const sections = computed(() =>
  current.value
    ? (current.value.generatedSections ?? materialSections(current.value))
    : [],
);
watch(
  [() => current.value?.id, () => route.query.view],
  () => {
    if (route.query.view !== 'preview' || !current.value) return;
    previewReport.value = JSON.parse(JSON.stringify(current.value));
    previewSections.value = copySections(sections.value);
    viewMode.value = 'preview';
  },
  { immediate: true },
);
const totalRecords = computed(() =>
  sections.value.reduce((sum, item) => sum + item.records.length, 0),
);
const activeSchemeConfig = computed(() =>
  zhijiSchemes.find((s) => s.id === scheme.value?.id),
);
const selectedPeriod = computed<ReportPeriod>(() => {
  if (isBusiness.value) return fixedBusinessPeriod.value;
  const allowed = activeSchemeConfig.value?.periods ?? ['week'];
  const requested = String(route.query.cycle || '') as ReportPeriod;
  if (allowed.includes(requested)) return requested;
  return (
    current.value?.period ?? activeSchemeConfig.value?.defaultPeriod ?? 'week'
  );
});
const pickerType = computed(() =>
  selectedPeriod.value === 'day'
    ? 'date'
    : selectedPeriod.value === 'biweek'
      ? 'week'
      : selectedPeriod.value,
);
function changeCycle(value: unknown) {
  choosePeriod(
    dayjs(current.value?.start ?? '2026-10-22'),
    String(value) as ReportPeriod,
  );
}
const periodValue = computed(() => dayjs(current.value?.start));
const periodFormat = computed(() =>
  pickerType.value === 'month' ? 'YYYY 年 MM 月' : 'YYYY-MM-DD',
);
const periodText = computed(() =>
  !current.value
    ? ''
    : pickerType.value === 'month'
      ? dayjs(current.value.start).format('YYYY 年 M 月')
      : pickerType.value === 'date'
        ? current.value.start
        : `${current.value.start} — ${current.value.end}`,
);
const sourceCount = computed(
  () => sections.value.filter((item) => item.records.length).length,
);
async function jumpTo(id: string) {
  viewMode.value = 'edit';
  await nextTick();
  activeSection.value = id;
  const root = readingScroller();
  const target = root?.querySelector<HTMLElement>(`[id="report-${id}"]`);
  if (root && target)
    root.scrollTo({
      top:
        target.getBoundingClientRect().top -
        root.getBoundingClientRect().top +
        root.scrollTop -
        16,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
}
function syncOutline() {
  const top = readingScroller()?.getBoundingClientRect().top ?? 0;
  const anchors = pageRoot.value?.querySelectorAll<HTMLElement>(
    '[data-report-section]',
  );
  let id = 'overview';
  anchors?.forEach((node) => {
    if (node.getBoundingClientRect().top <= top + 65)
      id = node.id.replace('report-', '');
  });
  activeSection.value = id;
}
function choosePeriod(
  value: Dayjs | string | null,
  requestedPeriod?: ReportPeriod,
) {
  if (!value || !scheme.value) return;
  const cycle =
    requestedPeriod && reportPeriods.some((p) => p.value === requestedPeriod)
      ? requestedPeriod
      : selectedPeriod.value;
  const range = reportPeriodRange(
    dayjs(value).format('YYYY-MM-DD'),
    cycle,
    activeSchemeConfig.value?.anchor,
  );
  const start = dayjs(range.start);
  const end = dayjs(range.end);
  const startText = start.format('YYYY-MM-DD');
  const endText = end.format('YYYY-MM-DD');
  if (isBusiness.value) {
    navigate({
      scheme: scheme.value.id,
      cycle: fixedBusinessPeriod.value,
      start: startText,
    });
    return;
  }
  let target = reports.value.find(
    (item) =>
      item.start === startText &&
      item.end === endText &&
      (!isBusiness.value ||
        (item.business?.objectId ?? defaultReportObject(item.schemeId)) ===
          (current.value?.business?.objectId ??
            defaultReportObject(scheme.value!.id))),
  );
  if (!target) {
    target = makeReport(scheme.value, startText, endText);
    if (isBusiness.value) {
      const objectId =
        current.value?.business?.objectId ??
        defaultReportObject(scheme.value.id);
      target.business = { ...newBusinessState(scheme.value.id), objectId };
      target.title =
        (reportObjects.find((object) => object.id === objectId)?.name ??
          scheme.value.object) +
        ' · ' +
        scheme.value.title;
    }
    target.period = cycle;
    target.schemeConfig = activeSchemeConfig.value
      ? JSON.parse(JSON.stringify(activeSchemeConfig.value))
      : undefined;
    target.summary =
      '这个周期暂未采集到演示素材。你可以切回已有报告周期，或在下方手工补充工作成果与计划。';
    target.history = ['已建立所选周期的独立草稿，尚无采集素材。'];
    demoReports.push(target);
  }
  navigate({ scheme: scheme.value.id, report: target.id, cycle });
  activeSection.value = 'overview';
  nextTick(() => {
    if (pageRoot.value) pageRoot.value.scrollTop = 0;
  });
}
function stepPeriod(direction: number) {
  const cycle = selectedPeriod.value;
  const amount = cycle === 'biweek' ? 14 : cycle === 'quarter' ? 3 : 1;
  const unit =
    cycle === 'biweek' || cycle === 'day'
      ? 'day'
      : cycle === 'quarter'
        ? 'month'
        : cycle;
  choosePeriod(periodValue.value.add(direction * amount, unit));
}
function openSources() {
  if (isBusiness.value) {
    businessEditor.value?.configure();
    return;
  }
  if (!current.value) return;
  configDraft.value = { ...settingsFor(current.value.id) };
  configOpen.value = true;
}
function buildSummary(parts = sections.value) {
  if (isPersonal.value)
    return personalReportOverview(parts, current.value?.period ?? 'week');
  const available = parts.filter((item) => item.records.length);
  return available.length
    ? `本期已从 ${available.length} 类数据源整理 ${parts.reduce((sum, item) => sum + item.records.length, 0)} 条素材，覆盖${available.map((item) => item.title).join('、')}。主要工作包括${available.flatMap((item) => item.records.map((r) => r.title)).join('、')}。请结合下方来源章节补充量化成效与下一步交付计划。`
    : '当前周期和数据源范围内暂无已采集素材。请检查数据源开关与授权，或手工补充工作成果。';
}
function saveSources() {
  if (readonly.value) return;
  if (!current.value) return;
  saveDraft();
  remember(current.value);
  reportSourceSettings[current.value.id] = { ...configDraft.value };
  current.value.generatedSections = copySections(
    materialSections(current.value),
  );
  current.value.summary = buildSummary();
  current.value.status = 'draft';
  current.value.history.unshift(
    '已更新本报告的数据源范围，并重新整理来源章节与总结；人工补充保留。',
  );
  configOpen.value = false;
  message.success('已更新本报告数据源，人工补充与计划保持不变');
}
function authorizeGit() {
  if (readonly.value) return;
  if (!authConsent.value) return;
  gitConnection.authorized = true;
  authOpen.value = false;
  message.success('模拟 Git 授权已完成，请保存配置以重新整理报告');
}
</script>

<template>
  <ConfigProvider
    :theme="{
      inherit: false,
      algorithm: theme.defaultAlgorithm,
      token: {
        colorPrimary: '#247d69',
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        colorText: '#213d35',
        colorTextSecondary: '#5f7269',
        colorBorder: '#cddad2',
      },
    }"
  >
    <div
      ref="pageRoot"
      class="report-app"
      :class="{
        'is-detail': !!scheme,
        'is-personal': isPersonal,
        'report-workspace': true,
      }"
    >
      <ReportHub
        v-if="!scheme"
        :category="hubCategory"
        @category="openCategory"
        @open="openHubReport"
        @history="openHistory"
        @manage="(id, period) => navigate({ scheme: id, cycle: period })"
      />

      <BusinessReportList
        v-else-if="businessListVisible && scheme"
        :key="`${scheme.id}:${fixedBusinessPeriod}`"
        :scheme="scheme"
        :period="fixedBusinessPeriod"
        :initial-start="String(route.query.start ?? scheme.start)"
        @back="backToCategory"
        @open="openBusinessReport"
      />
      <template v-else-if="current">
        <div class="report-actionbar">
          <Button
            :aria-label="
              isBusiness
                ? '返回上级列表'
                : route.query.from === 'history'
                  ? '返回历史报告'
                  : '返回汇报'
            "
            class="toolbar-back"
            @click="
              isBusiness
                ? backToBusinessList()
                : route.query.from === 'history'
                  ? openHistory()
                  : backToCategory()
            "
            ><Icon icon="lucide:chevron-left"
          /></Button>
          <ReportBreadcrumb
            :list-label="currentCategoryTitle"
            :object-label="currentBusinessName || currentReportType"
            @home="navigate({})"
            @list="backToBusinessList"
          />
          <Select
            v-if="!isBusiness && activeSchemeConfig?.mode === 'selectable'"
            :value="selectedPeriod"
            :options="
              reportPeriods.filter((p) =>
                activeSchemeConfig?.periods.includes(p.value),
              )
            "
            aria-label="选择周期模式"
            style="min-width: 90px"
            @change="changeCycle"
          />
          <div class="toolbar-period" :title="periodText">
            <Button aria-label="上一周期" @click="stepPeriod(-1)"
              ><Icon icon="lucide:chevron-left" /></Button
            ><DatePicker
              :value="periodValue"
              :picker="pickerType"
              :format="periodFormat"
              :allow-clear="false"
              aria-label="选择汇报周期"
              @change="(value) => choosePeriod(value)"
            /><Button aria-label="下一周期" @click="stepPeriod(1)"
              ><Icon icon="lucide:chevron-right"
            /></Button>
          </div>
          <div class="toolbar-actions">
            <div class="report-view-switch" role="group" aria-label="报告视图">
              <button
                :aria-pressed="viewMode === 'edit'"
                :title="readonly ? '查看内容' : '编辑'"
                :aria-label="readonly ? '查看内容' : '编辑'"
                @click="viewMode = 'edit'"
              >
                <Icon icon="lucide:pencil-line" />
                <span>{{ readonly ? '查看内容' : '编辑' }}</span></button
              ><button
                :aria-pressed="viewMode === 'preview'"
                title="预览报告"
                aria-label="预览报告"
                @click="openPreview"
              >
                <Icon icon="lucide:panels-top-left" />
                <span>预览</span>
              </button>
            </div>
            <RouterLink
              :to="historyLocation"
              class="toolbar-icon-link"
              title="历史报告"
              aria-label="历史报告"
              @click="saveHistoryContext"
              ><Icon icon="lucide:history" /><span>历史</span></RouterLink
            >
            <Button
              v-if="!readonly"
              class="toolbar-icon-button"
              title="整篇重新生成"
              aria-label="整篇重新生成"
              :loading="
                isBusiness
                  ? businessEditor?.busy === 'all'
                  : busy && regenerationScope === 'all'
              "
              :disabled="busy || !!businessEditor?.busy"
              @click="regenerate('all')"
              ><Icon icon="lucide:refresh-cw" /><span>生成</span></Button
            ><span v-else class="submitted-badge"
              ><Icon icon="lucide:lock-keyhole" />已提交 · 只读</span
            ><Button
              class="toolbar-icon-button"
              title="配置数据源"
              aria-label="配置数据源"
              @click="openSources"
              ><Icon icon="lucide:settings-2" /><span>设置</span></Button
            >
          </div>
        </div>
        <ProjectReportWorkbench
          v-if="scheme.id === 'project'"
          ref="businessEditor"
          :key="current.id"
          :report="current"
          :mode="viewMode"
          @preview="openPreview"
          @edit="viewMode = 'edit'"
          @submit="openSubmit"
        />
        <BusinessReportWorkbench
          v-else-if="scheme.id === 'customer'"
          ref="businessEditor"
          :key="current.id"
          :report="current"
          :mode="viewMode"
          :history-view="route.query.from === 'history'"
          @preview="openPreview"
          @edit="viewMode = 'edit'"
          @submit="openSubmit"
          @object="selectBusinessObject"
        />
        <div
          v-else
          ref="bodyRoot"
          class="detail-layout"
          @scroll.passive="syncOutline"
        >
          <div v-show="viewMode === 'edit'" class="report-main">
            <div
              ref="documentRoot"
              class="report-document"
              @scroll.passive="syncOutline"
            >
              <div id="report-overview" data-report-section>
                <div class="document-heading">
                  <span
                    class="status-pill"
                    :class="{ submitted: current.status === 'submitted' }"
                    >{{
                      current.status === 'draft'
                        ? '草稿 · 待你核对'
                        : '已提报 · 演示分发完成'
                    }}</span
                  ><button class="text-button" @click="versionOpen = true">
                    V{{ current.version }} · 版本记录
                    <Icon icon="lucide:history" />
                  </button>
                </div>
                <h1>{{ current.title }}</h1>
                <p class="document-meta">
                  {{ current.start }} — {{ current.end }} <span>·</span> 更新于
                  {{ current.generatedAt }}
                </p>
                <div v-if="!isPersonal" class="metric-grid">
                  <div>
                    <strong>{{ totalRecords }}</strong
                    ><span>已采集素材</span>
                  </div>
                  <div>
                    <strong>{{ sourceCount }}</strong
                    ><span>有数据的来源</span>
                  </div>
                  <div>
                    <strong>{{
                      sections.some((item) => item.enabled && item.needsAuth)
                        ? '待授权'
                        : '已就绪'
                    }}</strong
                    ><span>Git 数据源</span>
                  </div>
                </div>
                <section v-if="!isPersonal" class="content-section">
                  <div class="content-title">
                    <h3>本期工作概览</h3>
                    <span class="readonly-label"
                      ><Icon icon="lucide:lock-keyhole" /> AI 生成 · 只读</span
                    >
                  </div>
                  <p class="summary-copy">{{ current.summary }}</p>
                  <p v-if="readonly" class="submitted-note">
                    <Icon
                      icon="lucide:lock-keyhole"
                    />此报告已提交，正文与补充内容均已锁定。
                  </p>
                </section>
              </div>
              <template v-if="isPersonal">
                <section class="plain-report-overview">
                  <h3>本期成果概览</h3>
                  <ReportMarkdown :text="overviewMarkdown" />
                </section>
                <div class="personal-section-label">
                  <span>02 / 来源与结果</span
                  ><small>核对事实，补齐成果与风险</small>
                </div>
                <PersonalSourceCard
                  ref="sourceEditors"
                  v-for="item in visibleSections"
                  :key="`${current.id}-${item.id}`"
                  :section="item"
                  :readonly="readonly"
                  :busy="busy"
                  :note="current.sourceNotes?.[item.id]"
                  :attachments="current.attachments?.[item.id]"
                  @files="setAttachments(item.id, $event)"
                  @regenerate="regenerate(item.id)"
                  @configure="openSources"
                  @disable="disableSource(item.id)"
                  @supplement="saveSourceNote(item.id, $event)"
                  @record="source = $event"
                />
                <div v-if="!visibleSections.length" class="personal-empty">
                  暂无开启的数据源。<Button
                    v-if="!readonly"
                    @click="openSources"
                    >选择数据源</Button
                  >
                </div>
                <button
                  v-if="!readonly"
                  class="personal-source-manage"
                  @click="openSources"
                >
                  <Icon icon="lucide:settings-2" />管理数据源 ·
                  {{ sections.filter((item) => !item.enabled).length }} 个已关闭
                </button>
              </template>
              <template v-else>
                <section
                  v-for="item in sections"
                  :id="`report-${item.id}`"
                  :key="item.id"
                  class="content-section source-section"
                  data-report-section
                >
                  <div class="content-title">
                    <h3>
                      <Icon :icon="item.icon" />来自{{ item.title }}的工作
                    </h3>
                    <span class="readonly-label"
                      >{{ item.records.length }} 条 · AI 整理</span
                    >
                  </div>
                  <div v-if="!readonly" class="section-refresh">
                    <span>{{
                      current.sourceUpdatedAt?.[item.id]
                        ? `重新采集于 ${current.sourceUpdatedAt[item.id]}`
                        : '可重新采集本周期的最新记录'
                    }}</span
                    ><Button
                      size="small"
                      :aria-label="`重新生成${item.title}`"
                      :disabled="busy || !item.enabled || item.needsAuth"
                      :loading="busy && regenerationScope === item.id"
                      @click="regenerate(item.id)"
                      ><Icon icon="lucide:refresh-cw" />重新生成</Button
                    >
                  </div>
                  <ReportMarkdown
                    v-if="item.records.length"
                    :text="
                      item.records
                        .map(
                          (record) =>
                            `**${record.title}**\n\n${record.detail}\n\n来源：\`${record.id}\``,
                        )
                        .join('\n\n')
                    "
                  />
                  <div v-else class="source-empty">
                    <Icon
                      :icon="
                        !item.enabled
                          ? 'lucide:circle-slash'
                          : item.needsAuth
                            ? 'lucide:lock-keyhole'
                            : 'lucide:inbox'
                      "
                    />
                    <div>
                      <b>{{
                        !item.enabled
                          ? '此数据源未纳入报告'
                          : item.needsAuth
                            ? '连接 Git，补全研发成果'
                            : '本周期暂无采集记录'
                      }}</b>
                      <p>
                        {{
                          !item.enabled
                            ? '可在数据源设置中启用，重新整理后纳入正文。'
                            : item.needsAuth
                              ? '授权前不会读取仓库。可选择仅供演示的只读授权。'
                              : '仅展示所选周期的数据，不沿用其他周期的成果。'
                        }}
                      </p>
                      <button
                        v-if="!readonly && (!item.enabled || item.needsAuth)"
                        class="text-button"
                        @click="openSources"
                      >
                        {{
                          item.needsAuth && item.enabled
                            ? '去授权 Git'
                            : '配置数据源'
                        }}
                        <Icon icon="lucide:arrow-right" />
                      </button>
                    </div>
                  </div>
                </section>
              </template>
              <section
                id="report-supplement"
                class="content-section"
                data-report-section
              >
                <div class="content-title">
                  <h3>补充工作与成果</h3>
                  <span v-if="!readonly" class="editable-label"
                    ><Icon icon="lucide:pencil-line" /> 你可以编辑</span
                  >
                </div>
                <label class="sr-only" for="input-supplement"
                  >补充工作与成果</label
                ><Input.TextArea
                  v-if="!readonly"
                  id="input-supplement"
                  v-model:value="supplement"
                  :auto-size="{ minRows: 3, maxRows: 9 }"
                  placeholder="补充未被系统记录的工作、量化结果或成果链接，例如：完成 3 次客户访谈，输出需求清单…"
                />
                <ReportMarkdown
                  v-else
                  :text="current.supplement || '未填写。'"
                />
                <ReportAttachments
                  :files="current.attachments?.['supplement'] ?? []"
                  :readonly="readonly"
                  label="补充工作"
                  @change="setAttachments('supplement', $event)"
                />
              </section>
              <section
                id="report-plan"
                class="content-section"
                data-report-section
              >
                <div class="content-title">
                  <h3>
                    {{ isPersonal ? '03 / 下一周期的交付计划' : '下一步计划' }}
                  </h3>
                  <span v-if="!readonly" class="editable-label"
                    ><Icon icon="lucide:pencil-line" /> 你可以编辑</span
                  >
                </div>
                <label class="sr-only" for="input-plan">下一步计划</label
                ><Input.TextArea
                  v-if="!readonly"
                  id="input-plan"
                  v-model:value="plan"
                  :auto-size="{ minRows: 3, maxRows: 8 }"
                  placeholder="下一周期要完成什么目标？例如：完成汇报 Demo，交付提报与任务确认流程。"
                  @change="analyzed = false"
                />
                <ReportMarkdown v-else :text="current.plan || '未填写。'" />
                <ReportAttachments
                  :files="current.attachments?.['plan'] ?? []"
                  :readonly="readonly"
                  label="下一步计划"
                  @change="setAttachments('plan', $event)"
                />

                <div v-if="!readonly" class="field-footer">
                  <span>计划不会自动变成任务。</span
                  ><Button size="small" @click="analyzePlan"
                    ><Icon icon="lucide:sparkles" /> 检查任务覆盖</Button
                  >
                </div>
                <div v-if="analyzed && !readonly" class="action-suggestion">
                  <p class="suggestion-label">AI 行动建议 · 演示匹配</p>
                  <h4>
                    {{
                      match === 'covered'
                        ? '已有任务可以承接，不用重复创建'
                        : match === 'partial'
                          ? '已有联调任务，建议补充验收交付物'
                          : '在示例任务中未找到覆盖项，建议创建任务'
                    }}
                  </h4>
                  <p>
                    {{
                      match === 'new'
                        ? '请确认目标项目、负责人和计划时间，再决定是否新建。该结果只基于演示任务样本。'
                        : `${matchedTask}；匹配依据：计划关键词及目标交付物。请人工核对时间和范围。`
                    }}
                  </p>
                  <div class="suggestion-actions">
                    <Button
                      size="small"
                      type="primary"
                      :disabled="
                        current.actions.some((a) => a.title === analysisText)
                      "
                      @click="openTask"
                      >{{
                        current.actions.some((a) => a.title === analysisText)
                          ? '已确认处理'
                          : match === 'covered'
                            ? '查看并关联'
                            : match === 'partial'
                              ? '确认补充子任务'
                              : '查看并创建'
                      }}</Button
                    ><Button size="small" type="text" @click="analyzed = false"
                      >暂不处理</Button
                    >
                  </div>
                </div>
              </section>
              <section
                id="report-risk"
                class="content-section"
                data-report-section
              >
                <div class="content-title">
                  <h3>风险与协调诉求</h3>
                  <span v-if="!readonly" class="editable-label"
                    >选填 · 可编辑</span
                  >
                </div>
                <label class="sr-only" for="input-risk">风险与协调诉求</label
                ><Input.TextArea
                  v-if="!readonly"
                  id="input-risk"
                  v-model:value="risk"
                  :auto-size="{ minRows: 2, maxRows: 6 }"
                  placeholder="问题与影响 → 原因 → 已采取措施 → 需要谁在什么时间提供什么支持。无风险可填写“本期无新增风险”。"
                />
                <p v-else class="submitted-copy">
                  {{ current.risk || '未记录风险与协调诉求。' }}
                </p>
              </section>
            </div>
            <div v-if="!readonly" class="report-footer">
              <span
                >{{ dirty ? '有未保存的人工补充' : '人工内容已保存'
                }}<small>操作仅在当前 Demo 中生效</small></span
              >
              <div>
                <Button @click="openPreview"
                  ><Icon icon="lucide:eye" />保存并预览</Button
                ><Button :disabled="!dirty" @click="saveDraft">保存草稿</Button
                ><Button
                  type="primary"
                  :disabled="current.status === 'submitted' && !dirty"
                  @click="openSubmit"
                  ><Icon icon="lucide:send" />
                  {{
                    current.status === 'submitted' && !dirty
                      ? '已提报'
                      : '核对并提报'
                  }}</Button
                >
              </div>
            </div>
          </div>
          <div v-if="viewMode === 'preview'" class="report-main preview-main">
            <div class="preview-scroll">
              <ReportPreview
                :report="previewReport"
                :sections="previewSections"
              />
            </div>
            <div class="personal-export-bar">
              <PreviewTemplateBar
                v-if="current"
                :report="current"
                @applied="openPreview"
              />
              <Button @click="exportPersonalPdf"
                ><Icon icon="lucide:file-down" />导出 PDF</Button
              >
            </div>
          </div>
          <aside class="report-context">
            <section class="article-nav source-navigation">
              <div class="nav-title">
                <h3>数据源导航</h3>
                <span>{{ totalRecords }} 条素材</span>
              </div>
              <nav aria-label="数据源与补充导航">
                <button
                  :aria-current="
                    activeSection === 'overview' ? 'location' : undefined
                  "
                  :class="{ selected: activeSection === 'overview' }"
                  @click="jumpTo('overview')"
                >
                  <Icon icon="lucide:file-text" />本期概览
                </button>
                <button
                  v-for="item in visibleSections"
                  :key="item.id"
                  :class="{ selected: activeSection === item.id }"
                  :aria-current="
                    activeSection === item.id ? 'location' : undefined
                  "
                  @click="jumpTo(item.id)"
                >
                  <Icon :icon="item.icon" /><span>{{ item.title }}</span
                  ><small>{{
                    !item.enabled
                      ? '关闭'
                      : item.needsAuth
                        ? '待授权'
                        : item.records.length
                  }}</small>
                </button>
                <div class="nav-divider"></div>
                <button
                  :class="{ selected: activeSection === 'supplement' }"
                  @click="jumpTo('supplement')"
                >
                  <Icon icon="lucide:pencil-line" />补充工作
                </button>
                <button
                  :class="{ selected: activeSection === 'plan' }"
                  @click="jumpTo('plan')"
                >
                  <Icon icon="lucide:calendar-check" />下一步计划
                </button>
                <button
                  :class="{ selected: activeSection === 'risk' }"
                  @click="jumpTo('risk')"
                >
                  <Icon icon="lucide:flag" />风险与协调
                </button>
              </nav>
              <p>
                {{
                  readonly
                    ? '当前为已提交快照，内容与来源均只读。'
                    : viewMode === 'preview'
                      ? '选择数据源，返回对应内容核对。'
                      : '选择数据源，快速定位与补充。'
                }}
              </p>
            </section>

            <section v-if="readonly" class="submitted-context">
              <div class="context-title">
                <Icon icon="lucide:circle-check" />
                <h3>报告已提交</h3>
              </div>
              <p>本期内容已锁定，可查看来源快照和分发记录。</p>
              <Button block @click="versionOpen = true">查看版本记录</Button>
            </section>
            <section>
              <h3>当前方案</h3>
              <dl>
                <dt>报告类型</dt>
                <dd>{{ scheme.type }}</dd>
                <dt>报告对象</dt>
                <dd>{{ scheme.object }}</dd>
                <dt>生成频率</dt>
                <dd>
                  {{
                    personalScheduleLabel(
                      getPersonalReportSetting(scheme.id, current.period),
                      current.period,
                    ) ??
                    scheduled[scheme.id] ??
                    scheme.cadence
                  }}
                </dd>
                <dt>数据范围</dt>
                <dd>
                  {{
                    sections
                      .filter((s) => s.enabled && !s.needsAuth)
                      .map((s) => s.title)
                      .join('、') || '未开启数据源'
                  }}
                </dd>
              </dl>
              <button
                v-if="!readonly"
                class="text-button"
                @click="
                  scheduleResult = '';
                  modal = 'schedule';
                "
              >
                用对话调整频率 <Icon icon="lucide:arrow-right" />
              </button>
            </section>
            <section v-if="current.actions.length">
              <h3>已确认行动</h3>
              <div
                v-for="action in current.actions"
                :key="action.id"
                class="confirmed-action"
              >
                <Icon icon="lucide:circle-check" />
                <div>
                  <b>{{ action.kind }}</b>
                  <p>{{ action.target }}</p>
                </div>
              </div>
            </section>
            <section v-if="current.status === 'submitted'">
              <h3>分发记录</h3>
              <p>分享：{{ current.recipients.join('、') || '未单独选择' }}</p>
              <p>
                指定反馈：{{
                  current.reviewers.join('、') || '无，接收者无需反馈'
                }}
              </p>
            </section>
          </aside>
        </div>
      </template>

      <Modal
        :open="modal === 'regenerate'"
        :title="`核对重新生成的${generationLabel}`"
        :width="680"
        ok-text="采用新内容"
        cancel-text="保留原内容"
        @ok="adopt"
        @cancel="modal = ''"
        ><p class="modal-hint">
          已重新采集所选周期的演示数据。请核对候选内容；采用前不改变正文，人工补充和下一步计划保持不变。
        </p>
        <div class="candidate-copy">{{ candidate }}</div>
        <div v-if="regenerationScope === 'all'" class="candidate-sections">
          <section v-for="part in candidateSections" :key="part.id">
            <h4>{{ part.title }} · {{ part.records.length }} 条</h4>
            <p>
              {{
                !part.enabled
                  ? '数据源未启用'
                  : part.needsAuth
                    ? '等待授权'
                    : part.summary || '本周期暂无记录'
              }}
            </p>
          </section>
        </div>
        <p class="modal-hint">
          采用后保留原版本和人工补充，报告进入待核对草稿。
        </p></Modal
      >
      <Modal
        :open="modal === 'submit'"
        :title="
          current?.schemeId === 'customer' ? '提交运维负责人审批' : '核对并提报'
        "
        :ok-text="
          current?.schemeId === 'customer' ? '确认提交审批' : '确认提报与分发'
        "
        cancel-text="继续编辑"
        :confirm-loading="submitting"
        :cancel-button-props="{ disabled: submitting }"
        :closable="!submitting"
        :mask-closable="!submitting"
        :keyboard="!submitting"
        :width="600"
        @ok="submit"
        @cancel="modal = ''"
        ><div class="submit-summary">
          <Icon icon="lucide:file-check-2" />
          <div>
            <b>{{ current?.title }}</b>
            <p>
              {{ current?.start }} — {{ current?.end }} · V{{
                current?.version
              }}
            </p>
          </div>
        </div>
        <p class="modal-hint">
          展示模板：{{
            current?.layoutTemplate?.name ?? '标准报告'
          }}。提交使用当前预览样式，可在预览底部切换并重新生成排版。
        </p>
        <label class="form-label" for="report-recipients"
          >授权谁可见 <small>内部人员 / 部门，只读查看</small></label
        ><Select
          id="report-recipients"
          v-model:value="recipients"
          :disabled="
            submitting || current?.schemeConfig?.allowAdjustRecipients === false
          "
          mode="multiple"
          :options="people"
          placeholder="选择授权人员或部门"
          style="width: 100%"
        /><label class="form-label" for="report-reviewers"
          >{{
            current?.schemeId === 'customer' ? '运维负责人审批' : '指定反馈人'
          }}
          <small>{{
            current?.schemeId === 'customer'
              ? '必选 · 杨总（运维负责人，演示），通过后才能对外分享'
              : '选填；被指定的人必须评分和写意见'
          }}</small></label
        ><Select
          id="report-reviewers"
          v-model:value="reviewers"
          :disabled="submitting || current?.schemeId === 'customer'"
          mode="multiple"
          :options="
            people.filter(
              (p) =>
                ![
                  '产品团队',
                  '交付项目组',
                  '客户服务组',
                  'PMO / 项目管理部',
                ].includes(p.value),
            )
          "
          placeholder="不指定也可以提报"
          style="width: 100%"
        />
        <div class="notice-box">
          此处仅演示分发记录，不向真实人员发送消息。任务建议未确认时不会随提报自动执行。
        </div>
        <div class="remember-submit-options">
          <Checkbox
            v-model:checked="rememberSubmitOptions"
            :disabled="
              submitting ||
              (current?.schemeConfig ?? activeSchemeConfig)
                ?.allowAdjustRecipients === false
            "
            >记住我的选项</Checkbox
          >
          <p>
            {{
              (current?.schemeConfig ?? activeSchemeConfig)
                ?.allowAdjustRecipients === false
                ? '此报告的分享与审批由管理员统一配置。'
                : '保存本次分享人员和审批人，下次提交同类报告时自动带出。'
            }}
          </p>
        </div></Modal
      >
      <Modal
        :open="modal === 'task'"
        :title="
          match === 'covered'
            ? '确认关联已有任务'
            : match === 'partial'
              ? '确认补充子任务'
              : '确认创建任务'
        "
        ok-text="确认执行（演示）"
        cancel-text="暂不处理"
        @ok="confirmTask"
        @cancel="modal = ''"
        ><p class="modal-hint">
          项目：{{ targetProject }}。仅处理你确认的计划条目，不披露整篇报告。
        </p>
        <p v-if="match !== 'new'" class="notice-box">目标：{{ matchedTask }}</p>
        <label class="form-label" for="task-title">{{
          match === 'covered' ? '关联计划' : '任务 / 子任务内容'
        }}</label
        ><Input id="task-title" v-model:value="taskTitle" /><label
          class="form-label"
          for="task-owner"
          >负责人</label
        ><Select
          id="task-owner"
          :disabled="match === 'covered'"
          v-model:value="taskOwner"
          :options="
            ['王安康', '小刚'].map((value) => ({ label: value, value }))
          "
          style="width: 100%"
        /><label class="form-label" for="task-date">计划完成日期</label
        ><input
          id="task-date"
          :disabled="match === 'covered'"
          v-model="taskDate"
          type="date"
          class="native-date"
        />
        <div class="notice-box">
          <template v-if="current?.materials.includes(analysisText)"
            ><b>项目素材已确认</b>
            <p>尚未写入任务。核对上方内容后，点击下方确认执行。</p></template
          >
          <template v-else
            ><Checkbox v-model:checked="materialConsent"
              >我确认将此计划条目披露给该项目</Checkbox
            ><Button
              class="parse-button"
              :disabled="!materialConsent"
              @click="confirmMaterial"
              >先确认转入项目素材</Button
            ></template
          >
        </div>
        <p class="modal-hint">
          只保存演示动作，不创建真实项目素材或任务。
        </p></Modal
      >
      <Modal
        :open="modal === 'schedule'"
        title="设置生成计划"
        ok-text="确认保存计划"
        cancel-text="取消"
        :ok-button-props="{ disabled: !scheduleResult }"
        @ok="saveSchedule"
        @cancel="modal = ''"
        ><p class="modal-hint">
          {{ scheme?.title }} ·
          {{ scheme?.object }}。定时只生成草稿并提醒你核对。
        </p>
        <label class="form-label" for="schedule-text">告诉助理何时生成</label
        ><Input
          id="schedule-text"
          v-model:value="scheduleText"
          placeholder="例如：每周六 09:00 自动生成"
          @change="scheduleResult = ''"
          @press-enter="parseSchedule"
        /><Button class="parse-button" @click="parseSchedule"
          ><Icon icon="lucide:sparkles" /> 解析计划</Button
        >
        <div v-if="scheduleResult" class="notice-box">
          <b>请核对</b>
          <p>{{ scheduleResult }}</p>
          <p>不自动提报、不创建任务。演示支持“每周几 + 时间”的指令。</p>
        </div></Modal
      >
      <Drawer
        :open="configOpen"
        title="配置本报告的数据源"
        :width="460"
        @close="configOpen = false"
      >
        <div class="source-settings">
          <p>
            在管理员开放的数据源中，选择本报告需要采集的内容。保存后重新整理正文，人工补充与计划保留。
          </p>
          <div
            v-for="item in sourceDefinitions"
            :key="item.id"
            class="setting-row"
          >
            <div class="setting-line">
              <h3><Icon :icon="item.icon" />{{ item.title }}</h3>
              <Switch
                :disabled="readonly"
                v-model:checked="configDraft[item.id]"
                :aria-label="`启用${item.title}数据源`"
              />
            </div>
            <p>{{ item.description }}</p>
            <div v-if="item.id === 'git'" class="git-access">
              <span>{{
                gitConnection.authorized
                  ? '演示授权已连接 · 只读'
                  : '尚未授权 · 不读取仓库'
              }}</span
              ><Button
                v-if="!readonly && !gitConnection.authorized"
                size="small"
                :disabled="!configDraft.git"
                @click="
                  authConsent = false;
                  authOpen = true;
                "
                >授权 Git</Button
              ><small v-if="gitConnection.authorized"
                >示例仓库：workopilot-demo</small
              >
            </div>
          </div>
        </div>
        <template #footer
          ><div class="config-footer">
            <Button @click="configOpen = false">取消</Button
            ><Button v-if="!readonly" type="primary" @click="saveSources"
              >保存并重新整理</Button
            >
          </div></template
        >
      </Drawer>
      <Modal
        :open="authOpen"
        title="连接 Git · 演示授权"
        ok-text="确认模拟授权"
        cancel-text="取消"
        :ok-button-props="{ disabled: !authConsent }"
        @ok="authorizeGit"
        @cancel="authOpen = false"
      >
        <p class="modal-hint">
          本 Demo 不连接真实 Git 服务，不请求账号密码或令牌。
        </p>
        <div class="notice-box">
          <b>workopilot-demo</b>
          <p>
            只读范围：所选周期内的提交信息、分支及合并摘要。不授予推送、修改或删除权限。
          </p>
        </div>
        <Checkbox v-model:checked="authConsent"
          >我确认模拟上述只读授权</Checkbox
        >
      </Modal>
      <Drawer
        :open="!!source"
        :title="source?.title"
        :width="440"
        @close="source = undefined"
        ><span class="status-pill">{{ source?.kind }} · {{ source?.id }}</span>
        <p class="source-detail">{{ source?.detail }}</p>
        <p class="modal-hint">
          此处展示授权来源快照。源业务事实不能在报告里直接修改。
        </p></Drawer
      >
      <Drawer
        :open="versionOpen"
        title="版本与操作记录"
        :width="480"
        @close="versionOpen = false"
        ><h3>当前 V{{ current?.version }}</h3>
        <p
          v-for="(item, index) in current?.history"
          :key="index"
          class="history-item"
        >
          {{ item }}
        </p>
        <h3>历史内容快照</h3>
        <p v-if="!current?.versions.length" class="modal-hint">
          尚无历史版本。采用新总结或更新已提报内容后保留快照。
        </p>
        <details
          v-for="v in current?.versions"
          :key="v.version"
          class="history-version"
        >
          <summary>
            V{{ v.version }} · {{ v.status === 'draft' ? '草稿' : '已提报' }}
          </summary>
          <p>{{ v.summary }}</p>
          <p v-if="v.supplement">人工补充：{{ v.supplement }}</p>
          <p v-if="v.plan">计划：{{ v.plan }}</p>
          <p v-if="v.risk">风险：{{ v.risk }}</p>
        </details></Drawer
      >
    </div>
  </ConfigProvider>
</template>

<style scoped src="./report.css"></style>
<style scoped src="./report-refinement.css"></style>
