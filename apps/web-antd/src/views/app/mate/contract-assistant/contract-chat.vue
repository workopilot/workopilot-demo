<script setup lang="ts">
import type { UploadProps } from 'ant-design-vue';

import type {
  ContractChatSession,
  ContractScheme,
} from '#/types/contract-assistant';

import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  DatePicker,
  Drawer,
  Dropdown,
  Empty,
  Input,
  Menu,
  message,
  Modal,
  Select,
  Tabs,
  Tag,
  Upload,
} from 'ant-design-vue';

import { getAuditSchemesApi } from '#/api/audit';
import {
  applyDemoContract,
  parseContractText,
  runContractDemoAudit,
} from '#/api/contract-demo-processing';
import { contractUser } from '#/api/contract-permissions';
import {
  ContractDuplicateError,
  deleteContractChatSession,
  getContractArchive,
  getContractChatSessions,
  getContractOperationPermission,
  getContractSchemes,
  saveContractChatSession,
} from '#/api/mock-contract-assistant';
import { mockDelay } from '#/api/mock-data';
import { mockMateEmployees } from '#/api/mock-data-mate';
import { mockUsers } from '#/api/mock-data-user-groups';
import { deepClone } from '#/utils/deep-clone';

import ContractAuditItems from './components/contract-audit-items.vue';
import ContractExtractionValues from './components/contract-extraction-values.vue';
import {
  archiveReminders,
  archiveStateLabel,
  calculateContractExpiry,
  ensureArchiveManagement,
} from './utils/archive-management';
import { missingContractExtraction } from './utils/contract-extraction';
import { getContractReminderDate } from './utils/management-config';

const router = useRouter();
const route = useRoute();
const historyCollapsed = ref(false);
const departmentOptions = [
  ...new Set(mockUsers.map((item) => item.department)),
].map((value) => ({ value, label: value }));
const busy = ref(false);
const historyQuery = ref('');
const drawer = ref('');
const text = ref('');
const feed = ref<HTMLElement>();
const current = ref<ContractChatSession>();
const editor = ref<ContractChatSession>();
const editorTab = ref('info');
const canHandle = ref(true);
async function refreshPermission() {
  if (!current.value) return;
  const response = await getContractOperationPermission(
    current.value.contractId || current.value.id,
  );
  canHandle.value = response.data !== 'view';
}
const working = computed(() => editor.value || current.value);
const sessions = ref<ContractChatSession[]>([]);
const schemes = ref<ContractScheme[]>([]);
const auditSchemes = ref<{ id: string; name: string }[]>([]);
const assistantAvatar = mockMateEmployees.find(
  (item) => item.id === 'contract-assistant',
)?.avatar;
const fileName = computed(() => current.value?.fileName || '');
const sessionId = computed(
  () => current.value?.sessionId || current.value?.id || '',
);
const filteredSessions = computed(() =>
  sessions.value.filter((item) => item.fileName.includes(historyQuery.value)),
);
const state = computed(() =>
  working.value ? ensureArchiveManagement(working.value) : undefined,
);
const config = computed(() => working.value?.scheme?.management);
const attachmentUrl = ref('');
watch(
  () => editor.value?.file,
  (file) => {
    if (attachmentUrl.value) URL.revokeObjectURL(attachmentUrl.value);
    attachmentUrl.value = file ? URL.createObjectURL(file) : '';
  },
);
onBeforeUnmount(() => {
  if (attachmentUrl.value) URL.revokeObjectURL(attachmentUrl.value);
});

const datesReady = computed(
  () =>
    !!(
      working.value?.start &&
      state.value?.expiryDate &&
      getContractReminderDate('on-expiry', 0, working.value.start, true) &&
      getContractReminderDate('on-expiry', 0, state.value.expiryDate, true) &&
      state.value.expiryDate >= working.value.start
    ),
);
const reminders = computed(() => {
  if (!working.value || !state.value) return [];
  return archiveReminders({
    ...working.value,
    managementState: {
      ...state.value,
      dateConfirmed: editor.value
        ? datesReady.value
        : state.value.dateConfirmed,
    },
  });
});
const selectable = computed(() => {
  const latest = new Map<string, ContractScheme>();
  for (const item of schemes.value.filter(
    (item) =>
      item.status === 'published' && item.enabled !== false && item.management,
  )) {
    const key = item.management?.categoryKey || item.id;
    if (!latest.has(key) || item.version > latest.get(key)!.version)
      latest.set(key, item);
  }
  return [...latest.values()];
});
const auditName = computed(
  () =>
    auditSchemes.value.find((item) => item.id === config.value?.audit.schemeId)
      ?.name || '审核方案不可用',
);
const startLabels: Record<string, string> = {
  fixed: '合同明确的固定日期',
  signing: '签约日',
  delivery: '到货日',
  acceptance: '验收日',
  'go-live': '上线日',
  contract: '按合同约定识别并确认',
};
const auditLabels = {
  pending: '待审核',
  skipped: '不审核',
  passed: '未发现阻断问题',
  issues: '待补充后重新审核',
};
// structuredClone 无法克隆响应式 Proxy，改用 deepClone
const clone = (item: ContractChatSession): ContractChatSession => ({
  ...deepClone(item),
  file: item.file,
  supplementaryFiles: item.supplementaryFiles?.map((file) => ({ ...file })),
});
async function scroll() {
  await nextTick();
  feed.value?.scrollTo({ top: feed.value.scrollHeight, behavior: 'smooth' });
}
function say(role: 'assistant' | 'user', value: string) {
  current.value?.notes.push({ role, text: value });
  void scroll();
}
async function persist() {
  if (!current.value) return;
  const response = await saveContractChatSession(clone(current.value));
  const i = sessions.value.findIndex(
    (item) =>
      (item.sessionId || item.id) ===
      (response.data.sessionId || response.data.id),
  );
  if (i === -1) sessions.value.unshift(response.data);
  else sessions.value[i] = response.data;
}
function openCollection() {
  if (!current.value || busy.value) return;
  if (!canHandle.value) {
    message.warning('当前合同仅有查看权限');
    return;
  }
  editor.value = clone(current.value);
  editor.value.extractedFields ||= {};
  const draft = ensureArchiveManagement(editor.value);
  const issues =
    draft.auditItems?.filter((item) =>
      ['unknown', 'warning'].includes(item.status),
    ) || [];
  if (
    draft.auditHandlingNote &&
    issues.length === 1 &&
    !issues[0]!.handlingNote
  )
    issues[0]!.handlingNote = draft.auditHandlingNote;
  editorTab.value = 'info';
  drawer.value = 'collection';
}
function closeDrawer() {
  if (busy.value) return;
  drawer.value = '';
  editor.value = undefined;
}
watch(
  () =>
    editor.value
      ? JSON.stringify([
          editor.value.fileName,
          editor.value.contractNumber,
          editor.value.counterparty,
          editor.value.scope,
          editor.value.owner,
          editor.value.amount,
          editor.value.location,
          editor.value.signedAt,
          editor.value.invoiceTerms,
          editor.value.paymentTerms,
          editor.value.count,
          editor.value.special,
          editor.value.managementState?.summary,
          editor.value.extractedFields,
          editor.value.start,
          editor.value.managementState?.expiryDate,
        ])
      : '',
  (value, oldValue) => {
    if (!editor.value || !oldValue || value === oldValue) return;
    const draftState = ensureArchiveManagement(editor.value);
    draftState.auditStatus =
      editor.value.scheme?.management?.audit.mode === 'none'
        ? 'skipped'
        : 'pending';
    draftState.auditNote = '';
    draftState.auditConfirmed = false;
  },
  { flush: 'sync' },
);
function reset() {
  editor.value = undefined;
  current.value = undefined;
  text.value = '';
  drawer.value = '';
}
function selectSession(id: string) {
  const item = sessions.value.find(
    (item) => (item.sessionId || item.id) === id,
  );
  if (item) {
    editor.value = undefined;
    current.value = clone(item);
    ensureArchiveManagement(current.value);
    drawer.value = '';
    void refreshPermission();
    void scroll();
  }
}
function deleteSession() {
  if (!current.value) return;
  const id = current.value.sessionId || current.value.id;
  Modal.confirm({
    title: '删除当前会话？',
    content: '删除会话后，合同档案仍会保留。',
    okText: '删除',
    cancelText: '取消',
    onOk: async () => {
      await deleteContractChatSession(id);
      sessions.value = sessions.value.filter(
        (item) => (item.sessionId || item.id) !== id,
      );
      reset();
    },
  });
}
function applyCategory(id: string) {
  if (!working.value) return;
  const selected = selectable.value.find((item) => item.id === id);
  working.value.scheme = selected ? deepClone(selected) : undefined;
  working.value.pickedScheme = id;
  const category = selected?.contractCategory;
  let businessType: 'maintenance' | 'purchase' | 'sales' = 'sales';
  if (category === 'purchase') businessType = 'purchase';
  else if (category === 'service') businessType = 'maintenance';
  working.value.businessType = businessType;
  const s = ensureArchiveManagement(working.value);
  s.dateConfirmed = false;
  s.auditStatus =
    selected?.management?.audit.mode === 'none' ? 'skipped' : 'pending';
  s.auditConfirmed = false;
  s.archived = false;
  s.remindersConfirmed = false;
  working.value.phase = 1;
}
async function selectTemplate(id: string) {
  applyCategory(id);
  const item = working.value;
  if (!item?.scheme) return;
  busy.value = true;
  try {
    if (item.demo) {
      applyDemoContract(item);
      runContractDemoAudit(item);
    } else if (item.file && (await parseContractText(item, item.file)))
      runContractDemoAudit(item);
    else {
      item.extractionSnapshot = undefined;
      item.extractionEvidence = {};
      runContractDemoAudit(item);
    }
  } catch (error) {
    message.warning((error as Error).message);
  } finally {
    busy.value = false;
  }
}
function detectCategory(fileName: string) {
  if (/销售/.test(fileName)) return 'sales';
  if (/采购/.test(fileName)) return 'purchase';
  if (/运维|服务/.test(fileName)) return 'service';
  return undefined;
}
async function begin(sales = false, file?: File) {
  if (busy.value) return;
  busy.value = true;
  try {
    editor.value = undefined;
    drawer.value = '';
    let category: 'purchase' | 'sales' | 'service' | undefined;
    if (file) {
      category = detectCategory(file.name);
    } else {
      category = sales ? 'sales' : 'service';
    }
    const candidates = category
      ? selectable.value.filter((item) => item.contractCategory === category)
      : [];
    const selected = candidates.length === 1 ? candidates[0] : undefined;
    const now = Date.now();
    let scope = '';
    if (!file)
      scope = sales ? '网络设备供货与安装调试' : '园区网络与安防设备运维服务';
    let contractNumber = '';
    if (!file) contractNumber = sales ? 'XS-2026-010' : 'YW-2026-020';
    let amount: number | undefined;
    if (!file) amount = sales ? 300_000 : 120_000;
    current.value = {
      id: `CT-${now}`,
      contractId: `CT-${now}`,
      sessionId: `CHAT-${now}`,
      uploadedBy: contractUser().id,
      ownerId: contractUser().id,
      department: contractUser().department,
      extractedFields: {},
      fileName:
        file?.name ||
        (sales ? '设备采购销售合同.pdf' : '园区设备运维服务合同.pdf'),
      phase: 1,
      available: [],
      pickedScheme: '',
      scope,
      location: file ? '' : '园区A区',
      count: sales ? 0 : 4,
      special: '',
      start: '',
      team: '',
      owner: contractUser().name,
      plans: [],
      notes: [],
      draftText: '',
      editing: false,
      time: new Date().toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      businessType: sales ? 'sales' : 'maintenance',
      contractNumber,
      counterparty: file ? '' : '华信科技有限公司',
      company: '企财通科技有限公司',
      amount,
      signedAt: file ? '' : '2026-10-16',
      file,
      demo: !file,
      invoiceTerms: sales ? '按合同约定分期开票' : '',
      paymentTerms: sales ? '分三期付款，每期10万元' : '',
    };
    ensureArchiveManagement(current.value);
    if (file) {
      state.value!.summary = '';
    }
    if (selected) applyCategory(selected.id);
    if (!file && selected) {
      applyDemoContract(current.value);
      runContractDemoAudit(current.value);
    }
    if (file && selected) {
      try {
        await parseContractText(current.value, file);
        runContractDemoAudit(current.value);
      } catch (error) {
        message.warning((error as Error).message);
      }
    }
    let userMessage = '请整理这份运维合同，按合同类型完成建档。';
    if (file) userMessage = `请管理这份合同：${file.name}`;
    else if (sales)
      userMessage = '请整理这份销售合同，提取字段并逐项审核，确认后建档。';
    say('user', userMessage);
    let assistantMessage =
      '请在信息确认卡片中选择适用合同类型；匹配不明确时，不自动套用规则。';
    if (selected) {
      if (file) {
        assistantMessage = current.value.extractionSnapshot
          ? `已按“${selected.name}” V${selected.version}提取文本并逐项审核，请打开确认卡片统一核对提取信息与审核结果。`
          : `已匹配“${selected.name}” V${selected.version}。当前文件需接入文档解析服务，请在确认卡片补充合同信息并核对审核事项；可使用销售或运维合同示例查看自动解析效果。`;
      } else {
        assistantMessage = `已按“${selected.name}” V${selected.version}完成示例解析与逐项审核，请打开确认卡片核对信息、审核依据及待处理事项，确认后建档。`;
      }
    }
    say('assistant', assistantMessage);
    await persist();
    await refreshPermission();
  } catch (error) {
    message.error((error as Error).message || '合同处理失败，请重试');
  } finally {
    busy.value = false;
  }
  if (current.value) openCollection();
}
const beforeUpload: UploadProps['beforeUpload'] = (file) => {
  if (busy.value) return false;
  void begin(/销售|采购/.test(file.name), file);
  return false;
};
function validateInfo() {
  const item = working.value;
  if (!item?.scheme?.management) {
    message.warning('请选择已发布的合同类型');
    return false;
  }
  if (
    !item.fileName.trim() ||
    !item.company?.trim() ||
    !item.contractNumber?.trim() ||
    !item.counterparty?.trim() ||
    !item.scope.trim() ||
    !item.owner.trim()
  ) {
    message.warning(
      '请补齐合同名称、所属公司、合同编号、客户、合同范围和负责人',
    );
    return false;
  }
  const missing = missingContractExtraction(item);
  if (missing.length > 0) {
    message.warning(missing[0]);
    return false;
  }
  return true;
}
function generateSummary() {
  if (!working.value || !state.value) return;
  if (!validateInfo()) {
    editorTab.value = 'info';
    return;
  }
  const item = working.value;
  state.value.summary = `${item.fileName.replace(/\.[^.]+$/, '')}；客户：${item.counterparty}；范围：${item.scope}；地点：${item.location || '未约定'}。${item.businessType === 'maintenance' ? `巡检${item.count}次；${item.special || '特殊要求待核对'}` : [item.invoiceTerms, item.paymentTerms].filter(Boolean).join('；')}`;
}
async function runAudit() {
  if (!working.value || !config.value || !state.value) return;
  if (
    config.value.audit.mode === 'intelligent' &&
    !auditSchemes.value.some((item) => item.id === config.value!.audit.schemeId)
  ) {
    message.warning('配置引用的审核方案不可用，请先检查合同类型管理');
    return;
  }
  busy.value = true;
  try {
    runContractDemoAudit(working.value);
    await mockDelay(200);
  } finally {
    busy.value = false;
  }
}
function computeExpiry() {
  if (!working.value || !state.value || !config.value) return;
  state.value.dateConfirmed = false;
  if (config.value.lifecycle.expiryBasis === 'duration')
    state.value.expiryDate = calculateContractExpiry(
      working.value.start,
      config.value.lifecycle,
    );
}
async function archive() {
  if (!editor.value || !state.value || busy.value) return;
  if (!validateInfo()) {
    editorTab.value = 'info';
    return;
  }
  const sourceChanged =
    current.value &&
    JSON.stringify([
      editor.value.fileName,
      editor.value.counterparty,
      editor.value.scope,
      editor.value.location,
      editor.value.invoiceTerms,
      editor.value.paymentTerms,
      editor.value.count,
      editor.value.special,
    ]) !==
      JSON.stringify([
        current.value.fileName,
        current.value.counterparty,
        current.value.scope,
        current.value.location,
        current.value.invoiceTerms,
        current.value.paymentTerms,
        current.value.count,
        current.value.special,
      ]);
  if (
    !state.value.summary.trim() ||
    (sourceChanged &&
      state.value.summary === current.value?.managementState?.summary)
  )
    generateSummary();
  if (
    config.value?.audit.mode === 'intelligent' &&
    state.value.auditStatus !== 'passed'
  ) {
    editorTab.value = 'review';
    await runAudit();
    if (ensureArchiveManagement(editor.value).auditStatus !== 'passed') {
      message.warning('请处理审核问题后再建档');
      return;
    }
  }
  const reviewIssues =
    state.value.auditItems?.filter((item) =>
      ['unknown', 'warning'].includes(item.status),
    ) || [];
  if (reviewIssues.some((item) => !item.handlingNote?.trim())) {
    message.warning('请补充每个审核问题的核对结果');
    editorTab.value = 'review';
    return;
  }
  state.value.auditHandlingNote = reviewIssues
    .map((item) => `${item.title}：${item.handlingNote}`)
    .join('；');

  if (
    (editor.value.start &&
      !getContractReminderDate('on-expiry', 0, editor.value.start, true)) ||
    (state.value.expiryDate &&
      !getContractReminderDate('on-expiry', 0, state.value.expiryDate, true)) ||
    (editor.value.start &&
      state.value.expiryDate &&
      state.value.expiryDate < editor.value.start)
  ) {
    message.warning('请核对起算日期及到期日期');
    editorTab.value = 'lifecycle';
    return;
  }
  state.value.dateConfirmed = !!(editor.value.start && state.value.expiryDate);
  state.value.remindersConfirmed = true;
  const previous = current.value;
  const alreadyArchived = !!previous?.managementState?.archived;
  const snapshot = clone(editor.value);
  snapshot.ownerId = mockUsers.find((user) => user.name === snapshot.owner)?.id;
  const savedState = ensureArchiveManagement(snapshot);
  savedState.auditConfirmed = true;
  if (snapshot.scheme?.management?.audit.mode === 'none')
    savedState.auditStatus = 'skipped';
  savedState.archived = true;
  snapshot.phase = 4;
  snapshot.notes.push({
    role: 'assistant',
    text: `${alreadyArchived ? '合同档案已更新' : '合同建档完成'}，合同信息、摘要、审核结果及到期事项已保存。${savedState.dateConfirmed ? '到期事项将按已确认日期处理。' : '关键日期待确认，到期提醒暂不触发。'}`,
  });
  busy.value = true;
  try {
    current.value = snapshot;
    await persist();
    drawer.value = '';
    editor.value = undefined;
    message.success(alreadyArchived ? '合同档案已更新' : '合同建档完成');
    void scroll();
  } catch (error) {
    current.value = previous;
    if (error instanceof ContractDuplicateError)
      Modal.confirm({
        title: '已有同编号合同',
        content: error.message,
        okText: '打开已有档案',
        cancelText: '继续核对',
        onOk: () =>
          router.push(
            `/app/mate/employee/contract-assistant/contract-archives/${error.contractId}`,
          ),
      });
    else
      message.error(
        error instanceof Error ? error.message : '建档保存失败，请重试',
      );
  } finally {
    busy.value = false;
  }
}
function openArchive() {
  if (current.value)
    void router.push(
      `/app/mate/employee/contract-assistant/contract-archives/${current.value.contractId || current.value.id}`,
    );
}
async function send() {
  const value = text.value.trim();
  if (!value || busy.value) return;
  text.value = '';
  if (!current.value) {
    await begin(/销售|采购/.test(value));
    return;
  }
  say('user', value);
  if (/到期|提醒|有效期/.test(value)) {
    say(
      'assistant',
      `当前起算依据为“${startLabels[config.value?.lifecycle.startBasis || 'contract']}”。${state.value?.dateConfirmed ? `已确认到期日期：${state.value.expiryDate}。` : '日期尚未确认，到期提醒不会触发。'}请在日期与到期事项卡片中核对。`,
    );
  } else if (/巡检|开票|收款|立项|交付/.test(value)) {
    say(
      'assistant',
      '合同助理负责合同建档、审核和到期管理。巡检、交付、开票及收付款由对应业务模块管理，合同档案可查看已执行的业务进展。',
    );
  } else if (/审核/.test(value)) {
    say(
      'assistant',
      config.value?.audit.mode === 'none'
        ? '当前类别不审核。'
        : `当前引用“${auditName.value}”，请打开信息收集卡片，在抽屉内查看审核结果。`,
    );
  } else {
    say(
      'assistant',
      '已记录你的补充。请打开信息收集卡片，在抽屉内核对并修改，确认后再保存；本条消息不会直接覆盖已确认内容。',
    );
  }
  await persist();
}
async function restore(id: string) {
  current.value = undefined;
  editor.value = undefined;
  drawer.value = '';
  canHandle.value = false;
  try {
    const response = await getContractArchive(id);
    if (response.data) {
      current.value = clone(response.data);
      ensureArchiveManagement(current.value);
      await refreshPermission();
    } else message.warning('未找到合同档案');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载合同失败');
  }
}
onMounted(async () => {
  try {
    const [history, list, audit] = await Promise.all([
      getContractChatSessions(),
      getContractSchemes(),
      getAuditSchemesApi(),
    ]);
    sessions.value = history.data;
    schemes.value = list.data;
    auditSchemes.value = audit.data;
    if (typeof route.query.archiveId === 'string')
      await restore(route.query.archiveId);
  } catch {
    message.error('加载失败，请刷新重试');
  }
});
watch(
  () => route.query.archiveId,
  (id) => {
    if (typeof id === 'string') void restore(id);
  },
);
</script>

<template>
  <section class="contract-chat-page">
    <div
      class="contract-chat-layout"
      :class="{ 'history-collapsed': historyCollapsed }"
    >
      <aside v-if="!historyCollapsed" class="chat-history">
        <header>
          <h2>对话历史</h2>
          <div class="history-tools">
            <Button
              type="text"
              shape="circle"
              title="新增会话"
              aria-label="新增会话"
              :disabled="busy"
              @click="reset"
            >
              <Icon icon="lucide:plus" />
            </Button>
            <Button
              type="text"
              shape="circle"
              title="删除当前会话"
              aria-label="删除当前会话"
              :disabled="busy || !sessionId"
              @click="deleteSession"
            >
              <Icon icon="lucide:trash-2" />
            </Button>
            <Button
              type="text"
              shape="circle"
              title="收起会话列表"
              aria-label="收起会话列表"
              @click="historyCollapsed = true"
            >
              <Icon icon="lucide:panel-left-close" />
            </Button>
          </div>
        </header>
        <div class="history-label">当前会话</div>
        <button v-if="!fileName" class="new-session-row" aria-current="true">
          <span class="topic-status active"><Icon icon="lucide:check" /></span>
          <strong>新会话</strong>
          <small>刚刚</small>
        </button>
        <div v-if="sessions.length > 0" class="history-label">
          {{ fileName ? '当前及历史会话' : '历史会话' }}
        </div>
        <div v-if="filteredSessions.length > 0" class="history-list">
          <button
            v-for="session in filteredSessions"
            :key="session.sessionId || session.id"
            type="button"
            :class="{
              'is-active': sessionId === (session.sessionId || session.id),
            }"
            :aria-pressed="sessionId === (session.sessionId || session.id)"
            :disabled="busy"
            @click="selectSession(session.sessionId || session.id)"
          >
            <span
              class="topic-status"
              :class="{
                active: sessionId === (session.sessionId || session.id),
              }"
            >
              <Icon
                :icon="
                  sessionId === (session.sessionId || session.id)
                    ? 'lucide:check'
                    : 'lucide:plus'
                "
              />
            </span>
            <strong :title="session.fileName">
              {{ session.fileName.replace(/\.[^.]+$/, '') }}
            </strong>
            <small>{{ session.time }}</small>
          </button>
        </div>
        <div v-else class="history-empty">
          <Icon icon="lucide:messages-square" />
          <p>{{ historyQuery ? '没有找到相关对话' : '还没有合同对话' }}</p>
          <small v-if="!historyQuery">上传合同后，将自动保留处理记录</small>
        </div>
      </aside>
      <main class="contract-chat">
        <header class="chat-header">
          <div class="assistant-identity">
            <Button
              type="text"
              :title="historyCollapsed ? '展开会话列表' : '收起会话列表'"
              :aria-label="historyCollapsed ? '展开会话列表' : '收起会话列表'"
              @click="historyCollapsed = !historyCollapsed"
            >
              <Icon
                :icon="
                  historyCollapsed
                    ? 'lucide:panel-left-open'
                    : 'lucide:panel-left-close'
                "
              />
            </Button>
            <span class="employee-photo">
              <img
                v-if="assistantAvatar"
                :src="assistantAvatar"
                alt="合同助理头像"
              />
              <Icon v-else icon="lucide:bot" />
              <i></i>
            </span>
            <strong>合同助理</strong>
          </div>
          <div class="main-tools">
            <Button
              type="text"
              shape="circle"
              title="会话文件"
              aria-label="会话文件"
              @click="drawer = 'files'"
            >
              <Icon icon="lucide:folder-open" />
            </Button>
            <Button
              type="text"
              shape="circle"
              title="新增会话"
              aria-label="新增会话"
              :disabled="busy"
              @click="reset"
            >
              <Icon icon="lucide:message-square-plus" />
            </Button>
            <Dropdown :trigger="['click']">
              <Button
                type="text"
                shape="circle"
                title="更多"
                aria-label="更多会话操作"
              >
                <Icon icon="lucide:ellipsis" />
              </Button>
              <template #overlay>
                <Menu>
                  <Menu.Item
                    key="scheme"
                    @click="
                      router.push('/app/mate/apps/smart-contract/schemes')
                    "
                  >
                    查看合同类型管理
                  </Menu.Item>
                  <Menu.Item
                    key="delete"
                    danger
                    :disabled="!sessionId || busy"
                    @click="deleteSession"
                  >
                    删除当前会话
                  </Menu.Item>
                </Menu>
              </template>
            </Dropdown>
          </div>
        </header>
        <div ref="feed" class="chat-feed">
          <article v-if="!current" class="chat-message assistant">
            <div class="message-avatar"><Icon icon="lucide:bot" /></div>
            <div class="message-bubble">
              <small>合同助理</small>
              <h2>从一份合同，建立完整档案</h2>
              <p>
                按类型提取合同信息并逐项审核，核对提取内容、审核结论及原文依据后统一建档。
              </p>
              <footer>
                <Upload
                  :before-upload="beforeUpload"
                  :show-upload-list="false"
                  accept=".pdf,.doc,.docx,.txt,.json,.md"
                >
                  <Button type="primary" :loading="busy">
                    <Icon icon="lucide:upload" />
                    上传合同
                  </Button>
                </Upload>
                <Button
                  @click="
                    router.push(
                      '/app/mate/employee/contract-assistant/contract-archives',
                    )
                  "
                >
                  查找合同
                </Button>
              </footer>
              <footer>
                <Button type="link" @click="begin(false)">体验运维合同</Button>
                <Button type="link" @click="begin(true)">体验销售合同</Button>
              </footer>
            </div>
          </article>
          <template v-if="current && state">
            <div class="file-message">
              <Icon icon="lucide:file-text" />
              <strong>{{ current.fileName }}</strong>
              <Tag>{{ archiveStateLabel(current) }}</Tag>
            </div>
            <div
              v-for="(note, index) in current.notes"
              :key="index"
              class="chat-message"
              :class="note.role"
            >
              <span v-if="note.role === 'assistant'" class="message-avatar">
                <Icon icon="lucide:bot" />
              </span>
              <div class="message-bubble">
                <small>
                  {{ note.role === 'assistant' ? '合同助理' : '你' }}
                </small>
                <p>{{ note.text }}</p>
              </div>
            </div>
            <button
              class="collection-card"
              type="button"
              :disabled="!canHandle"
              @click="openCollection"
            >
              <span class="collection-icon">
                <Icon icon="lucide:clipboard-pen-line" />
              </span>
              <span class="collection-copy">
                <strong>
                  合同建档确认
                  <Tag
                    :color="
                      current.managementState?.archived ? 'green' : 'orange'
                    "
                  >
                    {{
                      current.managementState?.archived ? '已建档' : '待完善'
                    }}
                  </Tag>
                </strong>
                <span>核对信息与审核结果，一次确认建档</span>
                <small>
                  待补充 {{ missingContractExtraction(current).length }} 项 ·
                  阻断
                  {{
                    current.managementState?.auditItems?.filter(
                      (item) => item.status === 'blocked',
                    ).length || 0
                  }}
                  项 · 警告／无法判断
                  {{
                    current.managementState?.auditItems?.filter((item) =>
                      ['warning', 'unknown'].includes(item.status),
                    ).length || 0
                  }}
                  项
                </small>
                <small>
                  {{
                    !canHandle
                      ? '当前合同仅有查看权限'
                      : current.managementState?.archived
                        ? '点击查看或完善合同档案'
                        : '点击打开侧边抽屉，核对并完成建档'
                  }}
                </small>
              </span>
              <Icon icon="lucide:chevron-right" />
            </button>
            <div
              v-if="current.managementState?.archived"
              class="archive-success"
            >
              <Icon icon="lucide:circle-check" />
              <span>合同建档完成</span>
              <Button type="link" size="small" @click="reset">继续上传</Button>
              <Button type="link" size="small" @click="openArchive">
                查看合同档案
              </Button>
            </div>
          </template>
        </div>
        <div class="quick-prompts">
          <button @click="begin(false)">
            <Icon icon="lucide:sparkles" />
            整理运维合同
          </button>
          <button @click="begin(true)">
            <Icon icon="lucide:sparkles" />
            整理销售合同
          </button>
          <button
            @click="
              text = '查看合同到期提醒';
              send();
            "
          >
            <Icon icon="lucide:sparkles" />
            查看到期提醒
          </button>
        </div>
        <div class="composer-shell">
          <div class="chat-composer">
            <Input.TextArea
              v-model:value="text"
              :auto-size="{ minRows: 2, maxRows: 5 }"
              placeholder="输入消息，例如：整理销售合同、查看合同到期提醒…"
              :disabled="busy"
              @keydown.enter.exact.prevent="send"
            />
            <div class="input-toolbar">
              <Upload
                :before-upload="beforeUpload"
                :show-upload-list="false"
                accept=".pdf,.doc,.docx,.txt,.json,.md"
              >
                <Button type="text" aria-label="上传合同">
                  <Icon icon="lucide:paperclip" />
                </Button>
              </Upload>
              <span class="flow-help">上传合同或补充需要核对的内容</span>
              <Button
                type="primary"
                class="flow-send"
                :disabled="!text.trim() || busy"
                @click="send"
              >
                <Icon icon="lucide:arrow-up" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
    <Drawer
      :open="drawer === 'collection'"
      title="核对并建档"
      :width="760"
      :closable="!busy"
      :mask-closable="!busy"
      :keyboard="!busy"
      @close="closeDrawer"
    >
      <div v-if="editor && state" class="collection-editor">
        <div class="collection-intro">
          <strong>{{ editor.fileName }}</strong>
          <p>核对标记的缺项与审核问题，确认后完成建档。</p>
        </div>
        <Tabs v-model:active-key="editorTab">
          <Tabs.TabPane key="info" tab="合同信息">
            <section class="business-card">
              <header>
                <div>
                  <small>01 / 类型与合同信息</small>
                  <h3>核对合同信息</h3>
                </div>
                <Tag>{{ editor.scheme?.name || '待选择类型' }}</Tag>
              </header>
              <div class="flow-fields">
                <label class="full">
                  <span>
                    合同类型
                    <b>*</b>
                  </span>
                  <Select
                    :value="editor.pickedScheme"
                    :disabled="busy"
                    :options="
                      selectable.map((item) => ({
                        value: item.id,
                        label: `${item.name} · V${item.version}`,
                      }))
                    "
                    placeholder="请选择合同类型"
                    @change="(value) => selectTemplate(String(value))"
                  />
                </label>
                <label>
                  <span>归属部门</span>
                  <Select
                    v-model:value="editor.department"
                    allow-clear
                    :options="departmentOptions"
                    :disabled="busy"
                    placeholder="请选择归属部门"
                  />
                </label>
              </div>
              <ContractExtractionValues
                :item="editor"
                :readonly="busy"
                all-fields
              />
              <details class="mt-4">
                <summary>合同摘要</summary>
                <Input.TextArea
                  v-model:value="state.summary"
                  :disabled="busy"
                  :auto-size="{ minRows: 3, maxRows: 6 }"
                />
                <Button type="link" :disabled="busy" @click="generateSummary">
                  根据合同信息更新摘要
                </Button>
              </details>
              <details
                v-if="Object.keys(editor.extractionEvidence || {}).length > 0"
                class="mt-4"
              >
                <summary>查看字段提取依据</summary>
                <p
                  v-for="(evidence, key) in editor.extractionEvidence"
                  :key="key"
                  class="flow-help"
                >
                  {{ evidence }}
                </p>
              </details>
              <p class="flow-help">
                按当前类型提取标准字段与扩展信息。未约定或无法确定的内容保留待确认。
              </p>
            </section>
            <details class="mt-4">
              <summary>查看合同原件</summary>
              <section class="business-card">
                <header>
                  <h3>{{ editor.file?.name || editor.fileName }}</h3>
                  <a
                    v-if="attachmentUrl"
                    :href="attachmentUrl"
                    :download="editor.file?.name"
                  >
                    下载原件
                  </a>
                </header>
                <iframe
                  v-if="
                    attachmentUrl && editor.file?.type === 'application/pdf'
                  "
                  :src="attachmentUrl"
                  title="合同正文预览"
                  style="width: 100%; height: 520px; border: 0"
                ></iframe>
                <pre
                  v-if="editor.sourceText"
                  style="white-space: pre-wrap; overflow-wrap: anywhere"
                  >{{ editor.sourceText }}</pre>
                <Empty
                  v-else-if="!attachmentUrl"
                  description="当前记录无可预览原件，可使用合同示例查看解析内容"
                />
                <p v-else-if="editor.file?.type !== 'application/pdf'">
                  可下载原件核对合同内容。
                </p>
              </section>
            </details>
          </Tabs.TabPane>
          <Tabs.TabPane key="review" tab="智能审核结果">
            <section class="business-card">
              <header>
                <div>
                  <small>02 / 智能审核结果</small>
                  <h3>优先处理审核问题</h3>
                </div>
                <Tag>{{ auditLabels[state.auditStatus] }}</Tag>
              </header>
              <div class="flow-audit">
                <strong>
                  {{
                    config?.audit.mode === 'none'
                      ? '审核方式：不审核'
                      : `智能审核方案：${auditName}`
                  }}
                </strong>
                <ContractAuditItems
                  v-if="config?.audit.mode === 'intelligent'"
                  :state="state"
                />
                <p v-else-if="state.auditNote">{{ state.auditNote }}</p>
                <p
                  v-if="config?.audit.mode === 'intelligent'"
                  class="flow-help"
                >
                  异常处理：{{
                    config.audit.resultHandling
                  }}（当前为前端审核结果演示）
                </p>
              </div>
              <label
                v-for="(issue, index) in state.auditItems?.filter((item) =>
                  ['warning', 'unknown'].includes(item.status),
                ) || []"
                :key="index"
                class="audit-handling"
              >
                <span>
                  {{ issue.title }} · 核对结果
                  <b>*</b>
                </span>
                <Input.TextArea
                  v-model:value="issue.handlingNote"
                  :disabled="busy"
                  :rows="2"
                  placeholder="说明本项的核对结果和处理依据"
                />
              </label>
              <footer>
                <Button
                  v-if="config?.audit.mode === 'intelligent'"
                  :loading="busy"
                  @click="runAudit"
                >
                  {{
                    state.auditStatus === 'pending'
                      ? '触发自动审核'
                      : '重新审核'
                  }}
                </Button>
              </footer>
            </section>
          </Tabs.TabPane>
          <Tabs.TabPane key="lifecycle" tab="到期与续约">
            <section class="business-card">
              <header>
                <div>
                  <small>03 / 有效期与到期处理</small>
                  <h3>
                    {{
                      state.archived
                        ? '建档结果与到期事项'
                        : '确认有效期与到期事项'
                    }}
                  </h3>
                </div>
                <Tag :color="state.dateConfirmed ? 'green' : 'orange'">
                  {{ datesReady ? '日期将随建档确认' : '日期待补充' }}
                </Tag>
              </header>
              <p>
                起算依据：{{
                  startLabels[config?.lifecycle.startBasis || 'contract']
                }}
              </p>
              <div class="flow-fields">
                <label>
                  <span>实际起算日期</span>
                  <DatePicker
                    v-model:value="editor.start"
                    :disabled="busy"
                    value-format="YYYY-MM-DD"
                    @change="computeExpiry"
                  />
                </label>
                <label>
                  <span>
                    到期日期{{
                      config?.lifecycle.expiryBasis === 'duration'
                        ? '（按期限计算）'
                        : ''
                    }}
                  </span>
                  <DatePicker
                    v-model:value="state.expiryDate"
                    :disabled="busy"
                    value-format="YYYY-MM-DD"
                    @change="state.dateConfirmed = false"
                  />
                </label>
              </div>
              <p class="flow-help">
                事件尚未发生时可留空并完成建档。确认建档时一并确认已填写的日期；关键日期不完整时不触发到期提醒。
              </p>
              <p class="flow-help">
                续约要求：{{
                  config?.lifecycle.automaticRenewal === 'none'
                    ? '不配置续约处理'
                    : config?.lifecycle.renewalInstructions
                }}
              </p>
              <p class="flow-help">
                日期变更：{{ config?.lifecycle.changeHandling }}
              </p>
              <article
                v-for="item in reminders"
                :key="item.id"
                class="flow-reminder"
              >
                <strong>{{ item.name }}</strong>
                <Tag>
                  {{ datesReady ? '随建档确认' : '待日期补充' }}
                </Tag>
                <p>
                  {{
                    item.date ||
                    (item.trigger === 'renewal-confirmed'
                      ? '人工确认续约后'
                      : '等待日期确认后计算')
                  }}
                  · {{ item.recipients.join('、') }}
                </p>
                <p>{{ item.description }}</p>
              </article>
              <Empty
                v-if="reminders.length === 0"
                description="本类型未配置到期处理事项"
              />
            </section>
          </Tabs.TabPane>
        </Tabs>
      </div>
      <template #footer>
        <div class="collection-footer">
          <span>确认即保存合同信息、审核结果与到期安排</span>
          <Button :disabled="busy" @click="closeDrawer">取消</Button>
          <Button type="primary" :loading="busy" @click="archive">
            {{
              current?.managementState?.archived ? '确认更新档案' : '确认建档'
            }}
          </Button>
        </div>
      </template>
    </Drawer>
    <Drawer
      :open="drawer === 'files'"
      title="会话文件"
      :width="460"
      @close="drawer = ''"
    >
      <div v-if="current">
        <Icon icon="lucide:file-text" />
        {{ current.fileName }}
        <p class="flow-help">合同原件与摘要保留在合同档案中。</p>
        <Button @click="openArchive">查看合同档案</Button>
      </div>
      <Empty v-else description="当前会话暂无文件" />
    </Drawer>
  </section>
</template>

<style scoped>
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 900px) {
  .contract-chat-layout {
    grid-template-columns: 220px minmax(0, 1fr);
  }
}

@media (max-width: 680px) {
  .contract-chat-layout {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .chat-history {
    max-height: 250px;
    border-right: 0;
    border-bottom: 1px solid #e1ebe8;
  }

  .contract-chat {
    min-height: 560px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .history-list button {
    transition: none;
  }
}

@media (max-width: 680px) {
  .contract-chat-layout {
    grid-template-rows: auto minmax(560px, 1fr);
  }

  .business-card,
  .confirmed-summary,
  .demo-notice {
    margin-left: 0;
  }

  .conditions,
  .requirements {
    grid-template-columns: 1fr;
  }

  .assistant-identity small {
    max-width: 180px;
  }
}

@media (max-width: 900px) {
  .contract-chat-layout {
    grid-template-columns: 220px minmax(0, 1fr);
  }
}

@media (max-width: 680px) {
  .contract-chat-layout {
    grid-template-rows: auto minmax(560px, 1fr);
    grid-template-columns: 1fr;
  }

  .contract-chat-layout.history-collapsed {
    grid-template-rows: minmax(0, 1fr);
  }

  .chat-history {
    max-height: 210px;
  }

  .chat-feed {
    padding: 18px 14px;
  }

  .composer-shell {
    padding: 0 12px 12px;
  }

  .input-hint {
    display: none;
  }

  .input-mode {
    margin-left: auto;
  }

  .assistant-identity > strong {
    font-size: 14px;
  }

  .chat-header {
    padding: 0 12px;
  }

  .main-tools {
    gap: 4px !important;
  }
}

.contract-chat-page {
  display: grid;
  flex: 1;
  grid-template-rows: minmax(0, 1fr);
  width: 100%;
  min-width: 0;
  height: 100%;
  min-height: 0;
}

.contract-chat-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d5e4df;
  border-radius: 16px;
  box-shadow: 0 18px 44px rgb(18 57 45/6%);
}

.chat-history {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 14px 12px;
  background: linear-gradient(180deg, #eef6f2, #f8fbf9);
  border-right: 1px solid #e1ebe8;
}

.chat-history header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  padding: 0 5px 10px;
}

.chat-history header span {
  font-size: 9px;
  font-weight: 800;
  color: #0b806f;
  letter-spacing: 0.12em;
}

.chat-history h2 {
  margin: 2px 0 0;
  font-size: 16px;
  color: #102e29;
}

.chat-history :deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}

.history-label {
  padding: 14px 8px 7px;
  font-size: 10px;
  font-weight: 700;
  color: #768b83;
}

.history-list {
  display: grid;
  gap: 5px;
  overflow-y: auto;
}

.history-list button {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 9px;
  min-height: 76px;
  padding: 10px;
  color: #557067;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  transition: 180ms ease;
}

.history-list button:hover {
  background: rgb(255 255 255/65%);
}

.history-list button:focus-visible {
  outline: 3px solid rgb(11 128 111/22%);
  outline-offset: 1px;
}

.history-list button.is-active {
  color: #102e29;
  background: #fff;
  border-color: #d7e6e1;
  box-shadow: 0 4px 14px rgb(18 57 45/7%);
}

.history-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: #0b806f;
  background: #dff0ea;
  border-radius: 9px;
}

.history-list button > span:last-child {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.history-list strong,
.history-list small,
.history-list em {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-list strong {
  font-size: 11px;
}

.history-list small {
  font-size: 9px;
  color: #6f837c;
}

.history-list em {
  font-size: 9px;
  font-style: normal;
  color: #91a19c;
}

.history-empty {
  padding: 32px 12px;
  font-size: 11px;
  color: #82958e;
  text-align: center;
}

.contract-chat {
  display: grid;
  grid-template-rows: 60px minmax(0, 1fr) auto auto;
  min-width: 0;
  min-height: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 62px;
  padding: 0 18px;
  border-bottom: 1px solid #e4eee9;
}

.chat-header > div,
.assistant-identity {
  display: flex;
  gap: 9px;
  align-items: center;
}

.assistant-identity > span {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 17px;
  color: #0b806f;
  background: #e4f1ed;
  border-radius: 10px;
}

.assistant-identity > span i {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 9px;
  height: 9px;
  background: #16a36d;
  border: 2px solid #fff;
  border-radius: 50%;
}

.assistant-identity > div {
  display: grid;
  gap: 2px;
}

.assistant-identity strong {
  font-size: 13px;
  color: #173b33;
}

.assistant-identity small {
  font-size: 9px;
  color: #71857e;
}

.chat-context {
  display: flex;
  gap: 6px;
  padding: 9px 20px;
  background: #f8fbfa;
  border-bottom: 1px solid #e7efec;
}

.chat-feed {
  padding: 22px;
  overflow-y: auto;
  background: #fbfdfc;
}

.chat-feed article {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.chat-feed article.user {
  justify-content: flex-end;
}

.message-avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  color: #0b806f;
  background: #e4f1ed;
  border-radius: 10px;
}

.message-bubble {
  max-width: min(960px, 94%);
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #dae7e2;
  border-radius: 4px 16px 16px;
  box-shadow: 0 6px 18px rgb(18 57 45/5%);
}

.user .message-bubble {
  color: #fff;
  background: #0f5a4f;
  border-color: #0f5a4f;
  border-radius: 16px 4px 16px 16px;
}

.message-bubble small {
  font-size: 9px;
  font-weight: 700;
  color: #0b806f;
}

.user .message-bubble small,
.user .message-bubble p {
  color: #dceee9;
}

.message-bubble h2 {
  margin: 5px 0 7px;
  font-size: 14px;
  color: #173b33;
}

.message-bubble p {
  margin: 0;
  font-size: 12px;
  line-height: 1.75;
  color: #597168;
  white-space: pre-line;
}

.message-bubble footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 11px;
  margin-top: 12px;
  border-top: 1px solid #e8efec;
}

.quick-prompts {
  display: flex;
  gap: 7px;
  padding: 8px 16px;
  overflow-x: auto;
  background: #f7faf9;
  border-top: 1px solid #e5eeea;
}

.quick-prompts button {
  display: inline-flex;
  flex: none;
  gap: 5px;
  align-items: center;
  min-height: 32px;
  padding: 5px 10px;
  font-size: 10px;
  color: #0b6e65;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d2e3dd;
  border-radius: 999px;
}

.quick-prompts button:hover {
  border-color: #77b7a7;
}

.chat-composer {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 7px;
  align-items: center;
  padding: 11px 14px 14px;
  background: #fff;
  border-top: 1px solid #e1ebe7;
}

.chat-composer :deep(.ant-input) {
  min-height: 42px;
  border-color: #d8e6e1;
}

.contract-chat :deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}

.file-message {
  display: flex;
  gap: 12px;
  align-items: center;
  max-width: 480px;
  padding: 14px 18px;
  margin: 0 0 22px auto;
  background: white;
  border: 1px solid #dfebe2;
  border-radius: 12px;
}

.file-message > svg {
  font-size: 27px;
  color: #488764;
}

.file-message strong {
  display: block;
  font-size: 13px;
  color: #395944;
}

.file-message small {
  display: block;
  margin-top: 5px;
  font-size: 11px;
  color: #8c9e91;
}

.file-message .ant-tag {
  margin-left: auto;
}

.business-card {
  padding: 22px;
  margin: 18px 0 10px 38px;
  background: white;
  border: 1px solid #d7e6dc;
  border-radius: 14px;
  box-shadow: 0 6px 22px #244d3010;
}

.business-card > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}

.business-card.clickable {
  cursor: pointer;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.business-card.clickable:hover {
  border-color: #a6cab7;
  box-shadow: 0 8px 24px #244d3018;
}

.business-card small {
  font-size: 10px;
  color: #8ba194;
}

.business-card h3 {
  margin-top: 5px;
  font-size: 18px;
  font-weight: 650;
  color: #2a4f38;
}

.scheme-reference {
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 9px 12px;
  font-size: 11px;
  color: #7d9786;
  background: #f5f9f6;
  border-radius: 7px;
}

.scheme-reference button {
  margin-left: auto;
  color: #31855e;
}

.requirements {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 19px;
  padding: 22px 0;
}

.requirements > div {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.requirements label,
.conditions label {
  font-size: 11px;
  color: #8b9e90;
}

.requirements strong {
  font-size: 13px;
  font-weight: 500;
  line-height: 23px;
  color: #415e49;
}

.wide {
  grid-column: 1/-1;
}

b {
  font-weight: 400;
  color: #ef4444;
}

.pending {
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 10px 12px;
  font-size: 12px;
  line-height: 22px;
  color: #a28c54;
  background: #fcf8ed;
  border-radius: 7px;
}

.business-card footer {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  padding-top: 17px;
  margin-top: 20px;
  border-top: 1px solid #edf2ee;
}

.card-description {
  margin: 8px 0 18px;
  font-size: 12px;
  line-height: 23px;
  color: #86998b;
}

.conditions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.conditions label {
  display: grid;
  gap: 9px;
}

.confirmed-summary {
  padding: 12px 15px;
  margin: 12px 0 12px 38px;
  font-size: 12px;
  color: #6e9078;
  background: #f6faf7;
  border: 1px solid #dfebe2;
  border-radius: 9px;
}

.confirmed-summary summary {
  cursor: pointer;
}

.confirmed-summary summary > svg {
  display: inline;
  margin-right: 6px;
}

.confirmed-summary p {
  margin: 10px 0;
  line-height: 23px;
}

.plan-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 17px 0;
}

.plan-summary span {
  font-size: 11px;
  color: #91a195;
}

.plan-summary strong {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #3b5b45;
}

.plan-row {
  display: flex;
  gap: 13px;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #edf2ee;
}

.plan-index {
  font-size: 16px;
  font-weight: 650;
  color: #b4cbb9;
}

.plan-row > div {
  flex: 1;
}

.plan-row strong {
  font-size: 13px;
  font-weight: 500;
  color: #3a5c45;
}

.plan-row p {
  margin-top: 4px;
  font-size: 11px;
  color: #92a697;
}

.plan-row :deep(.ant-picker) {
  max-width: 150px;
}

.validation-error {
  margin-top: 12px;
  font-size: 12px;
  color: #c66949;
}

.card-footnote {
  margin-top: 12px;
  font-size: 10px;
  line-height: 20px;
  color: #9aaca0;
}

.result-card {
  background: #fcfffc;
  border-color: #b9d9c2;
}

.result-heading {
  display: flex;
  gap: 13px;
  align-items: center;
}

.result-heading > svg {
  font-size: 31px;
  color: #469b67;
}

.result-code {
  font-size: 11px;
  color: #8da994;
}

.processing {
  display: flex;
  gap: 10px;
  align-items: center;
  margin: 24px 0;
  font-size: 13px;
  color: #53836a;
}

.processing small {
  font-size: 10px;
  color: #a3b3a8;
}

.demo-notice {
  margin: 12px 0 18px 38px;
}

.source-quote {
  padding: 20px;
  font-size: 14px;
  line-height: 29px;
  color: #56735e;
  background: #f7faf8;
  border-left: 3px solid #72a986;
  border-radius: 7px;
}

.pdf-preview {
  width: 100%;
  height: 520px;
  border: 1px solid #dfe9e1;
  border-radius: 8px;
}

.drawer-rule {
  padding: 14px;
  margin-bottom: 10px;
  font-size: 13px;
  line-height: 25px;
  color: #5b7762;
  background: #f7faf8;
  border-radius: 9px;
}

.drawer-plan {
  padding: 17px;
  margin-bottom: 14px;
  border: 1px solid #e2ebe4;
  border-radius: 10px;
}

.drawer-plan h3 {
  margin-bottom: 12px;
  font-weight: 650;
  color: #42634b;
}

.drawer-plan-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.drawer-plan-head h3 {
  margin-bottom: 0;
}

.drawer-plan-field {
  display: block;
  margin-bottom: 12px;
  font-size: 12px;
  color: #7b8f82;
}

.drawer-plan-field > span {
  display: block;
  margin-bottom: 5px;
}

.drawer-plan-owner {
  margin-top: 10px;
  font-size: 12px;
  color: #94a79a;
}

.spin {
  animation: spin 1s linear infinite;
}

:deep(.ant-btn) {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

:deep(.ant-btn-primary) {
  background: #237653;
}

.flow-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 16px 0;
}

.flow-fields label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: #536e5e;
}

.flow-fields .full {
  grid-column: 1/-1;
}

.flow-fields b {
  color: #ef4444;
}

.flow-fields :deep(.ant-input-number) {
  width: 100%;
}

.flow-help {
  margin: 10px 0;
  font-size: 12px;
  line-height: 1.8;
  color: #84968e;
}

.flow-audit,
.flow-reminder {
  padding: 14px;
  margin: 14px 0;
  line-height: 1.8;
  background: #f6faf8;
  border: 1px solid #e0ebe5;
  border-radius: 10px;
}

.flow-reminder strong {
  margin-right: 10px;
}

.flow-send {
  margin-left: auto;
}

@media (max-width: 680px) {
  .flow-fields {
    grid-template-columns: 1fr;
  }
}

.contract-overview {
  padding: 18px 20px;
  margin: 18px 0 14px 45px;
  background: #fff;
  border: 1px solid #e1ebe5;
  border-radius: 12px;
}

.contract-overview h3 {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #3e604b;
}

.contract-overview dl {
  display: grid;
  grid-template-columns: 95px 1fr;
  gap: 10px;
  font-size: 12px;
}

.contract-overview dt {
  color: #93a399;
}

.contract-overview dd {
  color: #526e5c;
  overflow-wrap: anywhere;
}

.collection-card {
  display: flex;
  gap: 14px;
  align-items: center;
  width: calc(100% - 45px);
  padding: 20px;
  margin: 0 0 20px 45px;
  text-align: left;
  cursor: pointer;
  background: linear-gradient(120deg, #f0f8f3, #fcfefc);
  border: 1px solid #c8ded1;
  border-radius: 12px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.collection-card:hover {
  border-color: #8ab89b;
  box-shadow: 0 5px 18px rgb(50 100 70 / 7%);
}

.collection-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 48px;
  font-size: 25px;
  color: #4b8260;
  background: #deeee3;
  border-radius: 10px;
}

.collection-copy {
  display: grid;
  flex: 1;
  gap: 8px;
}

.collection-copy strong {
  font-size: 14px;
  color: #355a41;
}

.collection-copy strong :deep(.ant-tag) {
  margin-left: 9px;
  font-size: 10px;
}

.collection-copy > span {
  font-size: 12px;
  color: #6f8978;
}

.collection-copy small {
  font-size: 11px;
  color: #99ab9f;
}

.collection-card > svg {
  color: #7da28b;
}

.archive-success {
  display: flex;
  gap: 9px;
  align-items: center;
  margin: 0 0 18px 45px;
  font-size: 12px;
  color: #4e8661;
}

.collection-editor .business-card {
  width: 100%;
  max-width: none;
  margin: 0;
  box-shadow: none;
}

.collection-intro {
  padding: 14px 16px;
  background: #f6faf7;
  border-radius: 10px;
}

.collection-intro strong {
  font-size: 13px;
  color: #4c7059;
}

.collection-intro p {
  margin-top: 7px;
  font-size: 12px;
  line-height: 1.8;
  color: #91a297;
}

.collection-footer {
  display: flex;
  gap: 10px;
  align-items: center;
}

.collection-footer > span {
  margin-right: auto;
  font-size: 11px;
  color: #9baa9f;
}

@media (max-width: 680px) {
  .contract-overview,
  .archive-success {
    margin-left: 0;
  }

  .collection-card {
    width: 100%;
    margin-left: 0;
  }

  .collection-footer {
    flex-wrap: wrap;
  }

  .collection-footer > span {
    width: 100%;
  }

  .collection-copy strong :deep(.ant-tag) {
    margin-left: 0;
  }
}
</style>

<!-- 精修主题段：在基础样式之上做视觉覆盖，独立 style 块便于维护 -->
<style scoped>
.contract-chat-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  width: 100%;
  min-width: 0;
  height: 100%;
  border-radius: 26px;
  box-shadow: 0 10px 35px rgb(25 55 44 / 4%);
}

.chat-feed .chat-message {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.chat-feed .chat-message.user {
  justify-content: flex-end;
}

.assistant-identity > div {
  min-width: 0;
}

.assistant-identity small {
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-context {
  flex-wrap: wrap;
  align-items: center;
}

.chat-context > .ant-btn {
  margin-left: auto;
}

.chat-context :deep(.ant-tag) {
  margin-inline-end: 0;
}

.chat-feed .welcome-note {
  padding-top: 10px;
  margin-top: 12px;
  font-size: 10px;
  color: #91a49a;
  border-top: 1px solid #e8efec;
}

.quick-prompts button:disabled {
  cursor: wait;
  opacity: 0.5;
}

.history-empty > svg {
  margin: 0 auto 12px;
  font-size: 24px;
  color: #a7bdb0;
}

.history-empty small {
  display: block;
  margin-top: 8px;
  font-size: 10px;
}

.history-label {
  display: flex;
  justify-content: space-between;
  padding: 5px 10px 9px;
  font-size: 10px;
  font-weight: 400;
  color: #9baba2;
}

.history-list em i {
  display: inline-block;
  width: 4px;
  height: 4px;
  margin-right: 4px;
  background: #c3a366;
  border-radius: 50%;
}

.history-list em i.done {
  background: #5eaa82;
}

.contract-chat :deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}

.contract-chat-layout.history-collapsed {
  grid-template-columns: minmax(0, 1fr);
}

.chat-history {
  padding: 16px 12px;
  background: linear-gradient(180deg, #edf4f0, #f5f9f6);
}

.chat-history header {
  min-height: 48px;
  padding: 0 6px 18px;
}

.chat-history h2 {
  font-size: 15px;
  font-weight: 650;
}

.history-tools {
  display: flex;
  gap: 6px;
}

.history-tools :deep(.ant-btn) {
  width: 30px;
  height: 30px;
  font-size: 15px;
  color: #8295ac;
  background: #f7f9fc;
  border: 1px solid #dce6ea;
}

.history-list {
  gap: 8px;
}

.history-list button,
.new-session-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) 42px;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-height: 47px;
  padding: 10px 12px;
  text-align: left;
  background: rgb(255 255 255 / 78%);
  border: 1px solid #e3eae6;
  border-radius: 19px;
}

.history-list button.is-active,
.new-session-row {
  background: #fcfefd;
  border-color: #d4e5fc;
  box-shadow: 0 0 0 1px #e5effa;
}

.new-session-row {
  margin-bottom: 10px;
}

.history-list strong,
.new-session-row strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 550;
  color: #293749;
  white-space: nowrap;
}

.history-list button > small,
.new-session-row small {
  font-size: 10px;
  color: #8a9eb7;
  text-align: right;
}

.topic-status {
  display: grid;
  place-items: center;
  width: 23px;
  height: 23px;
  font-size: 13px;
  color: #9bb1cc;
  background: white;
  border: 1px solid #d8e4ec;
  border-radius: 50%;
}

.topic-status.active {
  color: white;
  background: #367cfc;
  border-color: #367cfc;
}

.chat-header {
  height: 60px;
  padding: 0 20px;
  background: white;
  border-bottom: 1px solid #edf0f0;
}

.assistant-identity {
  gap: 12px;
}

.assistant-identity > strong {
  font-size: 16px;
  font-weight: 550;
  color: #283143;
}

.assistant-identity > .employee-photo {
  width: 38px;
  height: 38px;
  padding: 0;
  background: #e8f1fc;
  border: 1px solid #deebf8;
  border-radius: 50%;
}

.employee-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.assistant-identity > .employee-photo i {
  background: #37c582;
}

.main-tools {
  gap: 8px !important;
}

.main-tools :deep(.ant-btn) {
  width: 32px;
  height: 32px;
  font-size: 18px;
  color: #263343;
  background: #f7f9fa;
}

.chat-feed {
  padding: 24px 20px;
  background: linear-gradient(180deg, #fff, #f9fcfa);
}

.message-avatar {
  color: #3681cb;
  background: #edf5fa;
  border-radius: 50%;
}

.chat-message.user .message-bubble {
  color: #455061;
  background: #f1eee8;
  border-color: #e3dfd7;
}

.chat-message.user .message-bubble small,
.chat-message.user .message-bubble p {
  color: #455061;
}

.message-bubble {
  border-color: #e6edf7;
  box-shadow: 0 1px 3px #23364d08;
}

.quick-prompts {
  padding: 10px 20px 11px;
  background: #fcfefd;
  border: 0;
}

.quick-prompts button {
  min-height: 30px;
  color: #3b72e8;
  background: #f0f6ff;
  border-color: #cadcff;
}

.composer-shell {
  padding: 0 20px 20px;
  background: #fcfefd;
}

.chat-composer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: stretch;
  min-height: 112px;
  padding: 14px 16px 10px;
  background: #f8fafb;
  border: 1px solid #dce5e8;
  border-radius: 28px;
}

.chat-composer :deep(textarea.ant-input) {
  min-height: 42px;
  padding: 4px 0;
  font-size: 13px;
  color: #40516a;
  resize: none;
  background: transparent;
  border: 0;
  box-shadow: none !important;
}

.input-toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-toolbar :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.input-toolbar > .input-hint {
  margin-left: auto;
  font-size: 10px;
  color: #aab7c4;
}

.input-mode {
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 6px 10px;
  font-size: 11px;
  color: #5883e4;
  background: #eff5ff;
  border: 1px solid #cadcff;
  border-radius: 18px;
}

.input-toolbar :deep(.ant-btn-primary) {
  background: #568bf5;
  border-color: #568bf5;
}

.input-toolbar :deep(.ant-btn-primary:disabled) {
  color: #91a1b7;
  background: #e0e7ef;
  border-color: #e0e7ef;
}

.session-file {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 16px;
  border: 1px solid #e0e8ed;
  border-radius: 12px;
}

.session-file > svg {
  font-size: 26px;
  color: #658fb8;
}

.session-file > div {
  flex: 1;
  min-width: 0;
}

.session-file strong {
  font-size: 13px;
  overflow-wrap: anywhere;
}

.session-file p {
  margin-top: 4px;
  font-size: 11px;
  color: #99a9b5;
}

.flow-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin: 16px 0;
}

.flow-fields label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 12px;
  color: #536e5e;
}

.flow-fields .full {
  grid-column: 1/-1;
}

.flow-fields b {
  color: #ef4444;
}

.flow-fields :deep(.ant-input-number) {
  width: 100%;
}

.flow-help {
  margin: 10px 0;
  font-size: 12px;
  line-height: 1.8;
  color: #84968e;
}

.flow-audit,
.flow-reminder {
  padding: 14px;
  margin: 14px 0;
  line-height: 1.8;
  background: #f6faf8;
  border: 1px solid #e0ebe5;
  border-radius: 10px;
}

.flow-reminder strong {
  margin-right: 10px;
}

.flow-send {
  margin-left: auto;
}

@media (max-width: 680px) {
  .flow-fields {
    grid-template-columns: 1fr;
  }
}

.contract-overview {
  padding: 18px 20px;
  margin: 18px 0 14px 45px;
  background: #fff;
  border: 1px solid #e1ebe5;
  border-radius: 12px;
}

.contract-overview h3 {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #3e604b;
}

.contract-overview dl {
  display: grid;
  grid-template-columns: 95px 1fr;
  gap: 10px;
  font-size: 12px;
}

.contract-overview dt {
  color: #93a399;
}

.contract-overview dd {
  color: #526e5c;
  overflow-wrap: anywhere;
}

.collection-card {
  display: flex;
  gap: 14px;
  align-items: center;
  width: calc(100% - 45px);
  padding: 20px;
  margin: 0 0 20px 45px;
  text-align: left;
  cursor: pointer;
  background: linear-gradient(120deg, #f0f8f3, #fcfefc);
  border: 1px solid #c8ded1;
  border-radius: 12px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.collection-card:hover {
  border-color: #8ab89b;
  box-shadow: 0 5px 18px rgb(50 100 70 / 7%);
}

.collection-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 44px;
  height: 48px;
  font-size: 25px;
  color: #4b8260;
  background: #deeee3;
  border-radius: 10px;
}

.collection-copy {
  display: grid;
  flex: 1;
  gap: 8px;
}

.collection-copy strong {
  font-size: 14px;
  color: #355a41;
}

.collection-copy strong :deep(.ant-tag) {
  margin-left: 9px;
  font-size: 10px;
}

.collection-copy > span {
  font-size: 12px;
  color: #6f8978;
}

.collection-copy small {
  font-size: 11px;
  color: #99ab9f;
}

.collection-card > svg {
  color: #7da28b;
}

.archive-success {
  display: flex;
  gap: 9px;
  align-items: center;
  margin: 0 0 18px 45px;
  font-size: 12px;
  color: #4e8661;
}

.collection-editor .business-card {
  width: 100%;
  max-width: none;
  margin: 0;
  box-shadow: none;
}

.collection-intro {
  padding: 14px 16px;
  background: #f6faf7;
  border-radius: 10px;
}

.collection-intro strong {
  font-size: 13px;
  color: #4c7059;
}

.collection-intro p {
  margin-top: 7px;
  font-size: 12px;
  line-height: 1.8;
  color: #91a297;
}

.collection-footer {
  display: flex;
  gap: 10px;
  align-items: center;
}

.collection-footer > span {
  margin-right: auto;
  font-size: 11px;
  color: #9baa9f;
}

@media (max-width: 680px) {
  .contract-overview,
  .archive-success {
    margin-left: 0;
  }

  .collection-card {
    width: 100%;
    margin-left: 0;
  }

  .collection-footer {
    flex-wrap: wrap;
  }

  .collection-footer > span {
    width: 100%;
  }

  .collection-copy strong :deep(.ant-tag) {
    margin-left: 0;
  }
}
</style>
