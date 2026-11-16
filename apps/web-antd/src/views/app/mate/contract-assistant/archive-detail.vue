<script setup lang="ts">
import type {
  ContractChange,
  ContractChatSession,
  ContractRelatedItem,
} from '#/types/contract-assistant';

import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  Dropdown,
  Empty,
  Menu,
  message,
  Tabs,
  Tag,
  Upload,
} from 'ant-design-vue';

import { getAuditSchemesApi } from '#/api/audit';
import { addContractSupplement } from '#/api/contract-lifecycle';
import {
  getContractArchive,
  getContractOperationPermission,
  getContractRelatedItems,
} from '#/api/mock-contract-assistant';
import { getContractAccess } from '#/api/mock-contract-authorization';
import { mockMateEmployees } from '#/api/mock-data-mate';

import ContractAccessModal from './components/contract-access-modal.vue';
import ContractAuditItems from './components/contract-audit-items.vue';
import ContractExtractionValues from './components/contract-extraction-values.vue';
import ContractLifecyclePanel from './components/contract-lifecycle-panel.vue';
import ContractRelatedItems from './components/contract-related-items.vue';
import {
  archiveStateLabel,
  contractValidityLabel,
  ensureArchiveManagement,
} from './utils/archive-management';

const authorizationOpen = ref(false);
async function attachSupplement(file: File) {
  if (!active.value) return false;
  try {
    await addContractSupplement(active.value.id, file);
    await load();
    message.success('补充资料已关联');
  } catch (error) {
    message.error(error instanceof Error ? error.message : '附件关联失败');
  }
  return false;
}
const canManageAuthorization = ref(false);
const operationPermission = ref('view');
async function refreshAuthorization() {
  if (!active.value) return;
  try {
    const access = await getContractAccess(active.value.id);
    canManageAuthorization.value = access.data.canManage;
  } catch {
    canManageAuthorization.value = false;
  }
}

const route = useRoute();
const router = useRouter();
const active = ref<ContractChatSession>();
const loading = ref(true);
const failed = ref(false);
const preview = ref('');
const detailTab = ref('info');
const previewExpanded = ref(false);
const relatedItems = ref<ContractRelatedItem[]>([]);
const avatar = mockMateEmployees.find(
  (item) => item.id === 'contract-assistant',
)?.avatar;
const stateLabel = archiveStateLabel;
interface LifecycleEntry {
  id: string;
  stage: string;
  color: string;
  icon: string;
  title: string;
  at: string;
  actor: string;
  detail?: string;
  fields?: ContractChange['fields'];
  pending?: boolean;
}
function lifecycleStage(description: string) {
  if (description.includes('上传') || description.includes('草稿'))
    return { stage: '草稿', color: 'default', icon: 'lucide:file-up' };
  if (description.includes('终止') || description.includes('作废'))
    return { stage: '结束', color: 'red', icon: 'lucide:circle-x' };
  if (description.includes('审核'))
    return { stage: '审核', color: 'geekblue', icon: 'lucide:scan-line' };
  if (description.includes('建档'))
    return { stage: '建档', color: 'green', icon: 'lucide:archive-check' };
  if (description.includes('续约') || description.includes('续签'))
    return { stage: '续约', color: 'cyan', icon: 'lucide:refresh-cw' };
  if (description.includes('补充'))
    return { stage: '补充', color: 'default', icon: 'lucide:paperclip' };
  return { stage: '变更', color: 'orange', icon: 'lucide:file-pen' };
}
const lifecycleTime = (entry: LifecycleEntry) =>
  entry.pending ? '9999' : entry.at;
const lifecycleEntries = computed<LifecycleEntry[]>(() => {
  const item = active.value;
  if (!item) return [];
  const state = item.managementState;
  const changes = item.changes || [];
  const entries: LifecycleEntry[] = [];
  const archivedChange = changes.find((change) =>
    change.description.includes('建档'),
  );
  if (
    !changes.some(
      (change) =>
        change.description.includes('上传') ||
        change.description.includes('草稿'),
    )
  )
    entries.push({
      id: 'flow-draft',
      stage: '草稿',
      color: 'default',
      icon: 'lucide:file-up',
      title: '上传合同，创建档案草稿',
      at: item.createdAt || item.time,
      actor: item.owner || '合同上传人',
      detail: '合同原件已上传，进入信息核对与智能审核流程。',
    });
  if (archivedChange)
    entries.push({
      id: archivedChange.id,
      ...lifecycleStage(archivedChange.description),
      title: archivedChange.description,
      at: archivedChange.at,
      actor: archivedChange.actor,
      fields: archivedChange.fields,
    });
  else if (state?.archived)
    entries.push({
      id: 'flow-archive',
      stage: '建档',
      color: 'green',
      icon: 'lucide:archive-check',
      title: '完成合同建档',
      at: [item.start, item.createdAt].findLast((value) => !!value) || '',
      actor: item.owner || '合同负责人',
      detail: '审核核对完成后合同正式建档，进入履约执行。',
    });
  else
    entries.push({
      id: 'flow-archive-pending',
      stage: '建档',
      color: 'default',
      icon: 'lucide:archive',
      title: '完成审核并建档',
      at: '',
      actor: item.owner || '合同负责人',
      detail: '核对合同信息与审核结果后完成建档。',
      pending: true,
    });
  if (state?.archived && !item.end) {
    const items = relatedItems.value;
    const done = items.filter((one) => one.status === 'completed').length;
    const doing = items.filter((one) => one.status === 'in-progress').length;
    const overdue = items.filter((one) => one.status === 'overdue').length;
    const latest = items.toSorted((a, b) =>
      a.updatedAt < b.updatedAt ? 1 : -1,
    )[0];
    entries.push({
      id: 'flow-execution',
      stage: '执行',
      color: 'blue',
      icon: 'lucide:rocket',
      title: '合同进入履约执行',
      at: latest?.updatedAt || archivedChange?.at || item.createdAt || '',
      actor: item.team || item.owner || '履约跟踪',
      detail:
        items.length > 0
          ? `已关联 ${items.length} 项业务事项：${done} 项已完成、${doing} 项进行中${overdue ? `、${overdue} 项已逾期` : ''}，最新进展见关联业务。`
          : '暂未关联业务事项；相关业务由应收、应付、项目或工单模块办理。',
    });
  }
  for (const change of changes.toReversed())
    if (change !== archivedChange)
      entries.push({
        id: change.id,
        ...lifecycleStage(change.description),
        title: change.description,
        at: change.at,
        actor: change.actor,
        fields: change.fields,
      });
  return entries.toSorted((a, b) =>
    lifecycleTime(a).localeCompare(lifecycleTime(b)),
  );
});
const management = computed(() => active.value?.managementState);
const auditName = ref('');
const auditPresentation = computed(() => {
  const mode = active.value?.scheme?.management?.audit.mode;
  if (!mode)
    return {
      label: '待配置',
      color: 'default',
      tone: 'pending',
      icon: 'lucide:settings-2',
      title: '尚未确定审核方式',
      description: '请先匹配合同类型，引用该类型的审核配置。',
    };
  if (mode === 'none')
    return {
      label: '不审核',
      color: 'default',
      tone: 'neutral',
      icon: 'lucide:shield-minus',
      title: '本合同无需执行审核',
      description: '合同类型设置为不审核，未生成审核结论。',
    };
  switch (management.value?.auditStatus) {
    case 'issues': {
      return {
        label: '待处理',
        color: 'orange',
        tone: 'warning',
        icon: 'lucide:shield-alert',
        title: '存在需要处理的审核问题',
        description: '请补充或修正相关内容，处理后重新审核。',
      };
    }
    case 'passed': {
      return {
        label: '无阻断问题',
        color: 'green',
        tone: 'success',
        icon: 'lucide:shield-check',
        title: '未发现阻断建档的问题',
        description: '审核结果已生成，请结合合同原文核对具体结论。',
      };
    }
    default: {
      return {
        label: '待审核',
        color: 'blue',
        tone: 'pending',
        icon: 'lucide:scan-line',
        title: '尚未生成审核结果',
        description: '请前往合同助理会话查看审核结果，未审核不代表审核通过。',
      };
    }
  }
});

const startLabels: Record<string, string> = {
  fixed: '合同明确的固定日期',
  signing: '签约日',
  delivery: '到货日',
  acceptance: '验收日',
  'go-live': '上线日',
  contract: '按合同约定识别并确认',
};
function back() {
  void router.push('/app/mate/employee/contract-assistant/contract-archives');
}
function continueChat(item: ContractChatSession) {
  void router.push({
    path: '/app/mate/employee/contract-assistant/contract-chat',
    query: { archiveId: item.id },
  });
}
const isSales = computed(
  () =>
    active.value?.scheme?.contractCategory === 'sales' ||
    active.value?.businessType === 'sales' ||
    active.value?.scheme?.categoryIds.includes('contract-sales'),
);
const isMaintenance = computed(
  () =>
    active.value?.scheme?.contractCategory === 'service' ||
    active.value?.businessType === 'maintenance' ||
    active.value?.scheme?.categoryIds.includes('contract-maintenance'),
);
const recommendation = computed(() => {
  if (active.value?.end)
    return {
      text: '合同已结束，可查阅变更记录与历史资料。',
      action: '查看变更记录',
    };
  if (management.value?.archived && management.value.auditStatus === 'issues')
    return {
      text: '合同存在待处理的审核问题，请核对后更新档案。',
      action: '处理审核问题',
    };
  if (!management.value?.archived)
    return {
      text: '核对提取信息与审核结果，一次确认建档。',
      action: '继续核对并建档',
    };
  if (!management.value.dateConfirmed)
    return {
      text: '合同已建档，起算日期或到期日期尚未确认。事件发生后补充日期，确认前不触发提醒。',
      action: '补充并确认关键日期',
    };
  return {
    text: '合同已建档，可查看到期提醒、续约待办及其接收人；日期变化后需核对受影响事项。',
    action: '查看到期处理事项',
  };
});
function mainAction() {
  if (!active.value) return;
  if (active.value.end) {
    detailTab.value = 'changes';
    return;
  }
  if (management.value?.auditStatus === 'issues') {
    continueChat(active.value);
    return;
  }
  if (management.value?.archived && management.value.dateConfirmed)
    detailTab.value = 'lifecycle';
  else continueChat(active.value);
}
let request = 0;
async function load() {
  const token = ++request;
  loading.value = true;
  failed.value = false;
  active.value = undefined;
  authorizationOpen.value = false;
  canManageAuthorization.value = false;
  relatedItems.value = [];
  previewExpanded.value = false;
  if (preview.value) URL.revokeObjectURL(preview.value);
  preview.value = '';
  try {
    const [
      archiveResponse,
      relatedResponse,
      authorizationResponse,
      operationResponse,
    ] = await Promise.all([
      getContractArchive(String(route.params.archiveId)),
      getContractRelatedItems(String(route.params.archiveId)),
      getContractAccess(String(route.params.archiveId)),
      getContractOperationPermission(String(route.params.archiveId)),
    ]);
    const item = archiveResponse.data;
    if (token !== request) return;
    relatedItems.value = relatedResponse.data;
    canManageAuthorization.value = authorizationResponse.data.canManage;
    operationPermission.value = operationResponse.data || 'view';
    if (item) ensureArchiveManagement(item);
    active.value = item || undefined;
    const audits = await getAuditSchemesApi();
    if (token !== request) return;
    auditName.value =
      audits.data.find(
        (value) => value.id === item?.scheme?.management?.audit.schemeId,
      )?.name || '未配置审核方案';
    if (item?.file?.type === 'application/pdf')
      preview.value = URL.createObjectURL(item.file);
  } catch {
    if (token === request) failed.value = true;
  } finally {
    if (token === request) loading.value = false;
  }
}
watch(
  () => [route.params.archiveId, route.query.tab],
  () => {
    const tab = String(route.query.tab);
    if (
      ['attachments', 'changes', 'lifecycle', 'related', 'review'].includes(tab)
    )
      detailTab.value = tab === 'attachments' ? 'info' : tab;
    else detailTab.value = tab === 'plans' ? 'lifecycle' : 'info';
    void load();
  },
  { immediate: true },
);
onBeforeUnmount(() => {
  request++;
  if (preview.value) URL.revokeObjectURL(preview.value);
});
</script>
<template>
  <section class="contract-detail-page">
    <div v-if="active" class="detail-columns">
      <section class="contract-detail-main">
        <div class="card-navigation">
          <Button type="text" class="back-button" @click="back">
            <Icon icon="lucide:arrow-left" />
            返回合同档案
          </Button>
        </div>
        <header class="main-heading">
          <span class="detail-icon"><Icon icon="lucide:file-text" /></span>
          <div class="contract-heading-copy">
            <div class="contract-title-line">
              <h1>{{ active.fileName.replace(/\.[^.]+$/, '') }}</h1>
              <Tag :color="management?.archived ? 'green' : 'orange'">
                {{ stateLabel(active) }}
              </Tag>
              <Tag>{{ contractValidityLabel(active) }}</Tag>
            </div>
            <p>档案号 {{ active.id }}</p>
          </div>
          <span class="upload-date">{{ active.createdAt }}</span>
          <Dropdown v-if="canManageAuthorization" :trigger="['click']">
            <Button type="text" aria-label="更多合同操作" title="更多">
              <Icon icon="lucide:ellipsis" />
            </Button>
            <template #overlay>
              <Menu>
                <Menu.Item
                  key="authorization"
                  @click="authorizationOpen = true"
                >
                  <Icon icon="lucide:shield-check" />
                  本合同授权
                </Menu.Item>
              </Menu>
            </template>
          </Dropdown>
        </header>
        <div class="basic-strip">
          <span>
            分类
            <strong>
              {{ active.scheme?.name || '待匹配' }}
            </strong>
          </span>
          <span>
            负责人
            <strong>{{ active.owner || '待指定' }}</strong>
          </span>
          <span>
            日期状态
            <strong>
              {{ management?.dateConfirmed ? '已确认' : '待确认' }}
            </strong>
          </span>
        </div>
        <div class="detail-content">
          <Tabs v-model:active-key="detailTab">
            <Tabs.TabPane key="info" tab="合同信息">
              <details class="review-card">
                <summary>查看合同摘要</summary>
                <header class="review-heading">
                  <span class="review-icon">
                    <Icon icon="lucide:file-text" />
                  </span>
                  <div>
                    <h3>合同摘要</h3>
                    <p>快速了解合同主体与主要约定</p>
                  </div>
                </header>
                <p v-if="management?.summary" class="review-summary">
                  {{ management.summary }}
                </p>
                <Empty
                  v-else
                  :image="Empty.PRESENTED_IMAGE_SIMPLE"
                  description="尚未整理合同摘要"
                />
              </details>
              <dl class="contract-info">
                <dt>合同编号</dt>
                <dd>{{ active.contractNumber || '未提取' }}</dd>
                <dt>签约主体</dt>
                <dd>{{ active.counterparty || '未提取' }}</dd>
                <dt>所属公司</dt>
                <dd>{{ active.company || '未填写' }}</dd>
                <dt>归属部门</dt>
                <dd>{{ active.department || '未指定' }}</dd>
                <template v-if="isSales">
                  <dt>合同金额</dt>
                  <dd>¥ {{ active.amount?.toLocaleString('zh-CN') }}</dd>
                  <dt>签订日期</dt>
                  <dd>{{ active.signedAt }}</dd>
                  <dt>销售内容</dt>
                  <dd>{{ active.scope }}</dd>
                  <dt>开票约定</dt>
                  <dd>{{ active.invoiceTerms }}</dd>
                  <dt>收款约定</dt>
                  <dd>{{ active.paymentTerms }}</dd>
                </template>
                <template v-else-if="isMaintenance">
                  <dt>服务范围</dt>
                  <dd>{{ active.scope }}</dd>
                  <dt>服务地点</dt>
                  <dd>{{ active.location }}</dd>
                  <dt>服务期限</dt>
                  <dd>
                    {{
                      active.scheme?.management?.lifecycle.expiryBasis ===
                      'duration'
                        ? `从起算日期计算${active.scheme.management.lifecycle.durationMonths}个月`
                        : '按合同约定识别并确认'
                    }}
                  </dd>
                  <dt>巡检要求</dt>
                  <dd>服务期内 {{ active.count }} 次</dd>
                  <dt>特殊要求</dt>
                  <dd>{{ active.special || '未填写' }}</dd>
                </template>
                <dt>起算依据</dt>
                <dd>
                  {{
                    startLabels[
                      active.scheme?.management?.lifecycle.startBasis ||
                        'contract'
                    ]
                  }}
                </dd>
                <dt>实际起算日期</dt>
                <dd>{{ active.start || '事件未发生／待确认' }}</dd>
                <dt>负责人</dt>
                <dd>{{ active.owner || '待指定' }}</dd>
                <dt>到期日期</dt>
                <dd>{{ management?.expiryDate || '待确认' }}</dd>
                <dt>日期确认状态</dt>
                <dd>
                  {{
                    management?.dateConfirmed
                      ? '已确认'
                      : '待确认，暂不触发到期提醒'
                  }}
                </dd>
                <dt>合同类型</dt>
                <dd>
                  {{
                    active.scheme
                      ? `${active.scheme.name} · V${active.scheme.version}`
                      : '尚未匹配'
                  }}
                </dd>
              </dl>
              <ContractExtractionValues :item="active" readonly />

              <section class="contract-attachments">
                <header>
                  <h3>合同附件</h3>
                  <span>1 个文件</span>
                </header>
                <div class="attachment-row">
                  <Icon icon="lucide:file-text" />
                  <div>
                    <strong>{{ active.fileName }}</strong>
                    <small>
                      {{
                        active.fileName.split('.').at(-1)?.toUpperCase() ||
                        '文件'
                      }}
                      ·
                      {{
                        active.file
                          ? `${Math.ceil(active.file.size / 1024)} KB · 已上传`
                          : '未提供原文件'
                      }}
                    </small>
                  </div>
                  <Tag>主合同</Tag>
                  <Button
                    type="link"
                    size="small"
                    :disabled="!preview"
                    @click="previewExpanded = !previewExpanded"
                  >
                    {{ previewExpanded ? '收起预览' : '预览' }}
                  </Button>
                </div>
                <iframe
                  v-if="previewExpanded && preview"
                  :src="preview"
                  title="主合同预览"
                  class="archive-preview"
                ></iframe>
                <div v-if="active.supplementaryFiles?.length" class="mt-3">
                  <div
                    v-for="file in active.supplementaryFiles"
                    :key="file.name"
                    class="attachment-row"
                  >
                    <Icon icon="lucide:paperclip" />
                    <div>
                      <strong>{{ file.name }}</strong>
                      <small>{{ file.at }}</small>
                    </div>
                    <Tag>补充资料</Tag>
                  </div>
                </div>
                <Upload
                  v-if="operationPermission !== 'view'"
                  :before-upload="attachSupplement"
                  :show-upload-list="false"
                  accept=".pdf,.doc,.docx,.txt,.md"
                >
                  <Button size="small" class="mt-3">
                    关联补充协议／证明资料
                  </Button>
                </Upload>
                <p v-if="!preview" class="attachment-help">
                  {{
                    active.file
                      ? '此格式暂不支持在线预览，请核对本地原文件。'
                      : '当前档案未提供可预览的原文件。'
                  }}
                </p>
              </section>
            </Tabs.TabPane>
            <Tabs.TabPane key="review" tab="智能审核结果">
              <div class="review-layout">
                <section class="review-card">
                  <header class="review-heading">
                    <span class="review-icon">
                      <Icon icon="lucide:scan-text" />
                    </span>
                    <div>
                      <h3>合同审核</h3>
                      <p>审核配置与本次处理结果</p>
                    </div>
                  </header>
                  <div class="audit-metadata">
                    <div>
                      <span>审核方式</span>
                      <strong>
                        {{
                          !active.scheme?.management
                            ? '待匹配合同类型'
                            : active.scheme.management.audit.mode === 'none'
                              ? '不审核'
                              : '调用智能审核'
                        }}
                      </strong>
                    </div>
                    <div
                      v-if="
                        active.scheme?.management?.audit.mode === 'intelligent'
                      "
                    >
                      <span>审核方案</span>
                      <strong>{{ auditName }}</strong>
                    </div>
                    <div>
                      <span>配置来源</span>
                      <strong>
                        {{
                          active.scheme
                            ? `${active.scheme.name} · V${active.scheme.version}`
                            : '尚未匹配'
                        }}
                      </strong>
                    </div>
                  </div>
                  <div
                    class="audit-result"
                    :class="`audit-result--${auditPresentation.tone}`"
                  >
                    <header>
                      <Icon :icon="auditPresentation.icon" />
                      <h4>{{ auditPresentation.title }}</h4>
                      <Tag :color="auditPresentation.color">
                        {{ auditPresentation.label }}
                      </Tag>
                    </header>
                    <p>{{ auditPresentation.description }}</p>
                    <div
                      v-if="
                        active.scheme?.management?.audit.mode ===
                          'intelligent' &&
                        management?.auditStatus !== 'pending' &&
                        management?.auditNote
                      "
                      class="audit-detail"
                    >
                      <span>审核结果说明</span>
                      <ContractAuditItems :state="management" />
                      <p v-if="management.auditHandlingNote">
                        人工核对说明：{{ management.auditHandlingNote }}
                      </p>
                    </div>
                    <div
                      v-if="
                        active.scheme?.management?.audit.mode ===
                          'intelligent' &&
                        ['passed', 'issues'].includes(
                          management?.auditStatus || '',
                        )
                      "
                      class="audit-confirmation"
                    >
                      <Icon
                        :icon="
                          management?.auditConfirmed
                            ? 'lucide:circle-check'
                            : 'lucide:clock-3'
                        "
                      />
                      {{
                        management?.auditConfirmed
                          ? '用户已确认审核结果'
                          : '审核结果待用户处理与确认'
                      }}
                    </div>
                  </div>
                  <div
                    v-if="
                      active.scheme?.management?.audit.mode === 'intelligent' &&
                      (management?.auditStatus === 'issues' ||
                        management?.auditStatus === 'pending')
                    "
                    class="audit-follow-up"
                  >
                    <p v-if="management?.auditStatus === 'issues'">
                      <span>处理要求</span>
                      {{ active.scheme.management.audit.resultHandling }}
                    </p>
                    <Button size="small" @click="continueChat(active)">
                      {{
                        management?.auditStatus === 'issues'
                          ? '前往会话处理问题'
                          : '前往会话查看审核'
                      }}
                      <Icon icon="lucide:arrow-up-right" />
                    </Button>
                  </div>
                </section>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane key="lifecycle" tab="到期与续约">
              <h3 class="mb-3">到期事项与续约处理</h3>
              <ContractLifecyclePanel
                :key="`${active.id}-${active.revision}`"
                :contract-id="active.id"
                @changed="load"
              />
            </Tabs.TabPane>
            <Tabs.TabPane key="related" tab="关联业务">
              <h3 class="mb-3">业务执行进展</h3>
              <ContractRelatedItems :items="relatedItems" />
            </Tabs.TabPane>
            <Tabs.TabPane key="changes" tab="变更记录">
              <Empty
                v-if="lifecycleEntries.length === 0"
                description="暂无流转记录"
              />
              <ol v-else class="lifecycle-timeline">
                <li
                  v-for="entry in lifecycleEntries"
                  :key="entry.id"
                  class="lifecycle-item"
                  :class="{ 'lifecycle-item--pending': entry.pending }"
                >
                  <span class="lifecycle-dot">
                    <Icon :icon="entry.icon" />
                  </span>
                  <div class="lifecycle-body">
                    <header>
                      <h3>{{ entry.title }}</h3>
                      <Tag :color="entry.color">{{ entry.stage }}</Tag>
                    </header>
                    <p class="lifecycle-meta">
                      {{ entry.at || '待处理' }}
                      <template v-if="entry.actor">
                        · {{ entry.actor }}
                      </template>
                    </p>
                    <p v-if="entry.detail" class="lifecycle-detail">
                      {{ entry.detail }}
                    </p>
                    <p
                      v-for="field in entry.fields"
                      :key="field.label"
                      class="lifecycle-field"
                    >
                      {{ field.label }}：{{ field.before || '未填写' }} →
                      {{ field.after || '未填写' }}
                    </p>
                  </div>
                </li>
              </ol>
            </Tabs.TabPane>
          </Tabs>
        </div>
      </section>
      <aside class="next-actions">
        <header class="copilot-heading">
          <small>AI COPILOT</small>
          <h2>下一步建议</h2>
        </header>
        <section class="employee-suggestions">
          <div class="suggestion-identity">
            <span class="suggestion-avatar">
              <img v-if="avatar" :src="avatar" alt="合同助理" />
              <Icon v-else icon="lucide:bot" />
            </span>
            <div>
              <h3>合同助理</h3>
              <p>整理合同摘要、查看审核结果，跟踪有效期及到期事项</p>
            </div>
          </div>
          <p class="suggestion-description">{{ recommendation.text }}</p>
          <button class="suggestion-button recommended" @click="mainAction">
            <span class="bulb"><Icon icon="lucide:lightbulb" /></span>
            <strong>{{ recommendation.action }}</strong>
            <Icon icon="lucide:chevron-right" />
          </button>
          <button class="suggestion-button" @click="continueChat(active)">
            <span class="bulb"><Icon icon="lucide:lightbulb" /></span>
            <strong>
              {{
                active.phase === 4
                  ? '回到会话，查看合同处理记录'
                  : '带着这份合同，继续与助理沟通'
              }}
            </strong>
            <Icon icon="lucide:chevron-right" />
          </button>
          <button
            v-if="
              management?.auditStatus === 'issues' ||
              management?.auditItems?.some((item) =>
                ['warning', 'unknown'].includes(item.status),
              )
            "
            class="suggestion-button"
            @click="detailTab = 'review'"
          >
            <span class="bulb"><Icon icon="lucide:triangle-alert" /></span>
            <strong>查看待处理审核事项</strong>
            <Icon icon="lucide:chevron-right" />
          </button>
        </section>
      </aside>
    </div>
    <div v-else class="detail-empty">
      <p v-if="loading">正在加载合同档案…</p>
      <Empty
        v-else
        :description="
          failed ? '加载失败，请重试' : '未找到合同档案，请返回列表查看。'
        "
      >
        <Button @click="failed ? load() : back()">
          {{ failed ? '重新加载' : '返回合同档案' }}
        </Button>
      </Empty>
    </div>
    <ContractAccessModal
      v-if="active"
      v-model:open="authorizationOpen"
      :contract-id="active.id"
      :contract-name="active.fileName.replace(/\.[^.]+$/, '')"
      @changed="refreshAuthorization"
    />
  </section>
</template>
<style scoped>
.card-navigation {
  padding: 12px 16px 0;
}

.card-navigation .back-button {
  height: 28px;
  padding: 4px 7px;
  font-size: 12px;
  color: #557e67;
}

.card-navigation + .main-heading {
  padding-top: 12px;
}

.archive-detail-heading {
  display: flex;
  gap: 13px;
  align-items: center;
}

.detail-icon {
  display: grid;
  place-items: center;
  width: 46px;
  height: 50px;
  font-size: 26px;
  color: #568f6a;
  background: #edf6f0;
  border-radius: 10px;
}

.archive-detail-heading h2 {
  font-size: 18px;
  font-weight: 650;
  color: #365640;
}

.archive-detail-heading p {
  margin-top: 7px;
  font-size: 11px;
  color: #9aac9e;
}

.detail-actions {
  display: flex;
  gap: 7px;
  align-items: center;
  margin: 20px 0;
}

.detail-actions .ant-btn {
  margin-left: auto;
}

.attachment-row {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 18px;
  border: 1px solid #e0eae3;
  border-radius: 10px;
}

.attachment-row > svg {
  font-size: 24px;
  color: #5d9975;
}

.attachment-row > div {
  flex: 1;
}

.attachment-row strong {
  font-size: 13px;
  color: #4a6853;
}

.attachment-row small {
  display: block;
  margin-top: 6px;
  font-size: 11px;
  color: #98a99c;
}

.lifecycle-timeline {
  display: flex;
  flex-direction: column;
  padding: 4px 0 0;
  margin: 0;
  list-style: none;
}

.lifecycle-item {
  position: relative;
  display: flex;
  gap: 12px;
  padding-bottom: 20px;
}

.lifecycle-item:not(:last-child)::before {
  content: '';
  position: absolute;
  top: 36px;
  bottom: 4px;
  left: 15px;
  width: 1px;
  background: #d8e6dc;
}

.lifecycle-dot {
  display: grid;
  flex: none;
  place-items: center;
  width: 31px;
  height: 31px;
  font-size: 15px;
  color: #37735a;
  background: #e9f3ed;
  border: 1px solid #cfe4d7;
  border-radius: 50%;
}

.lifecycle-item--pending .lifecycle-dot {
  color: #8a9e90;
  background: #f4f7f5;
  border-style: dashed;
}

.lifecycle-body {
  flex: 1;
  min-width: 0;
  padding-top: 3px;
}

.lifecycle-body header {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.lifecycle-body h3 {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #33523f;
  overflow-wrap: anywhere;
}

.lifecycle-meta,
.lifecycle-detail,
.lifecycle-field {
  margin: 5px 0 0;
  font-size: 12px;
  line-height: 1.75;
  color: #7d9184;
  overflow-wrap: anywhere;
}

.lifecycle-meta {
  color: #97a89c;
}

.archive-preview {
  width: 100%;
  height: 500px;
  border: 1px solid #dfe9e3;
  border-radius: 10px;
}

.contract-info {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 0;
  overflow: hidden;
  border: 1px solid #e1ebe3;
  border-radius: 10px;
}

.contract-info dt,
.contract-info dd {
  padding: 13px 15px;
  font-size: 12px;
  line-height: 22px;
  border-bottom: 1px solid #edf2ee;
}

.contract-info dt {
  color: #8a9e90;
  background: #f6faf7;
}

.contract-info dd {
  color: #50705a;
}

.archive-plan {
  display: flex;
  gap: 14px;
  padding: 19px;
  margin-bottom: 12px;
  border: 1px solid #e1ebe3;
  border-radius: 10px;
}

.archive-plan > span {
  font-size: 22px;
  font-weight: 650;
  color: #bfd2c3;
}

.archive-plan h3 {
  font-size: 14px;
  font-weight: 550;
  color: #486a52;
}

.archive-plan h3 .ant-tag {
  margin-left: 10px;
}

.archive-plan p {
  margin: 10px 0;
  font-size: 12px;
  line-height: 23px;
  color: #809687;
}

.archive-plan small {
  font-size: 11px;
  color: #a0afa4;
}

:deep(.ant-btn) {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
}

:deep(.ant-btn-primary) {
  background: #176e5b;
  border-color: #176e5b;
}

.contract-detail-page {
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 4px 2px 20px;
  overflow: auto;
  color: #31533e;
  background: #f7faf8;
}

.page-top {
  display: flex;
  gap: 14px;
  align-items: center;
  margin: 0 0 16px;
}

.back-button {
  color: #28654d;
  border-radius: 999px;
}

.page-title {
  display: flex;
  flex: 1;
  gap: 8px;
  align-items: center;
  min-width: 0;
}

.page-title h1 {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 17px;
  font-weight: 650;
  color: #284c36;
  white-space: nowrap;
}

.detail-columns {
  display: grid;
  grid-template-columns: minmax(0, 6fr) minmax(0, 4fr);
  gap: 18px;
  align-items: start;
}

.contract-detail-main {
  overflow: hidden;
  background: white;
  border: 1px solid #dce8e0;
  border-radius: 16px;
}

.main-heading {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 20px 22px;
  border-bottom: 1px solid #e8eee9;
}

.main-heading h2 {
  font-size: 16px;
  font-weight: 650;
  color: #355940;
}

.main-heading p {
  margin-top: 4px;
  font-size: 11px;
  color: #8d9f92;
}

.upload-date {
  margin-left: auto;
  font-size: 11px;
  color: #9cab9f;
}

.basic-strip {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 14px 22px;
  background: #f8fbf9;
  border-bottom: 1px solid #e6eee8;
}

.basic-strip > span {
  font-size: 10px;
  color: #9aa99e;
}

.basic-strip strong {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  font-weight: 500;
  color: #5f7967;
}

.detail-content {
  padding: 0 22px 22px;
}

.next-actions {
  position: sticky;
  top: 0;
  padding: 22px 24px;
}

.side-note {
  font-size: 10px;
  line-height: 20px;
  color: #a6b4a9;
}

.detail-empty {
  display: grid;
  place-items: center;
  min-height: 300px;
  color: #91a393;
}

@media (max-width: 800px) {
  .detail-columns {
    grid-template-columns: 1fr;
  }

  .next-actions {
    position: static;
  }

  .page-top {
    flex-wrap: wrap;
  }

  .page-title {
    flex-basis: 100%;
    order: 3;
  }
}

@media (max-width: 600px) {
  .detail-content {
    padding: 0 14px 14px;
  }

  .main-heading {
    padding: 14px;
  }

  .upload-date {
    display: none;
  }

  .basic-strip {
    padding: 12px 14px;
  }

  .page-title h1 {
    font-size: 14px;
  }
}

.contract-heading-copy {
  flex: 1;
  min-width: 0;
}

.contract-title-line {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  align-items: center;
}

.contract-title-line h1 {
  font-size: 17px;
  font-weight: 650;
  line-height: 26px;
  color: #153e32;
  overflow-wrap: anywhere;
}

.contract-title-line :deep(.ant-tag) {
  flex-shrink: 0;
  margin-inline-end: 0;
}

.main-heading .upload-date {
  flex-shrink: 0;
  font-size: 10px;
}

.copilot-heading {
  margin-bottom: 16px;
}

.copilot-heading > small {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: #147665;
  letter-spacing: 0.08em;
}

.copilot-heading h2 {
  margin: 8px 0 7px;
  font-size: 21px;
  font-weight: 650;
  color: #133a30;
}

.copilot-heading p {
  font-size: 11px;
  line-height: 21px;
  color: #8a9cb4;
}

.employee-suggestions {
  padding: 18px 18px 20px;
  background: linear-gradient(180deg, #e5f2eb 0%, #f6fbf8 58%, #fff 100%);
  border: 1px solid #c6e3d7;
  border-radius: 17px;
}

.suggestion-identity {
  display: flex;
  gap: 14px;
  align-items: flex-end;
  margin-bottom: 13px;
}

.suggestion-avatar {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 52px;
  height: 52px;
  padding: 4px;
  margin-top: 0;
  font-size: 26px;
  color: #397b5b;
  background: white;
  border-radius: 15px;
  box-shadow: 0 5px 12px #244e3520;
}

.suggestion-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 10px;
}

.suggestion-identity h3 {
  font-size: 15px;
  font-weight: 650;
  line-height: 22px;
  color: #164735;
}

.suggestion-identity p {
  margin-top: 3px;
  font-size: 10px;
  line-height: 19px;
  color: #829bb7;
}

.suggestion-description {
  margin: 0 0 13px;
  font-size: 11px;
  line-height: 22px;
  color: #728e7f;
}

.suggestion-button {
  display: flex;
  gap: 11px;
  align-items: center;
  width: 100%;
  min-height: 38px;
  padding: 5px 11px;
  margin-top: 7px;
  color: #244861;
  text-align: left;
  background: white;
  border: 1px solid #dee7ef;
  border-radius: 12px;
  transition: background 0.15s;
}

.suggestion-button strong {
  flex: 1;
  font-size: 12px;
  font-weight: 550;
  line-height: 21px;
}

.suggestion-button > svg {
  flex-shrink: 0;
  font-size: 15px;
  color: #9eb3c7;
}

.suggestion-button .bulb {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 25px;
  height: 27px;
  font-size: 17px;
  color: #188570;
}

.suggestion-button.recommended {
  min-height: 40px;
  color: white;
  background: #0d6956;
  border-color: #0d6956;
  box-shadow: 0 7px 14px #146c4e1a;
}

.suggestion-button.recommended .bulb {
  color: #d8c96d;
  background: #ffffff14;
  border-radius: 8px;
}

.suggestion-button.recommended > svg {
  color: #b7dfd0;
}

.suggestion-button:hover {
  background: #f5fbf7;
  border-color: #90c3ae;
}

.suggestion-button.recommended:hover {
  background: #095c4a;
}

.suggestion-button:focus-visible {
  outline: 2px solid #3a9a7c;
  outline-offset: 2px;
}

@media (max-width: 1100px) {
  .next-actions {
    padding: 18px 16px;
  }

  .contract-title-line h1 {
    font-size: 15px;
  }

  .main-heading .upload-date {
    display: none;
  }

  .suggestion-button {
    gap: 7px;
    padding: 5px 10px;
  }
}

.meeting-suggestions {
  margin-top: 20px;
}

.review-layout {
  display: grid;
  gap: 16px;
}

.review-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e1ebe5;
  border-radius: 12px;
}

.review-heading {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 15px 18px;
  background: #f8fbf9;
  border-bottom: 1px solid #edf2ee;
}

.review-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 34px;
  height: 34px;
  font-size: 18px;
  color: #37735a;
  background: #e9f3ed;
  border-radius: 9px;
}

.review-heading h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #294c3c;
}

.review-heading p {
  margin-top: 3px;
  font-size: 11px;
  color: #8b9e92;
}

.review-summary {
  padding: 18px 20px;
  margin: 0;
  font-size: 13px;
  line-height: 1.95;
  color: #496354;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.audit-metadata {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
  padding: 18px 20px;
}

.audit-metadata > div {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.audit-metadata span,
.audit-detail > span,
.audit-follow-up p > span {
  font-size: 11px;
  color: #8b9e92;
}

.audit-metadata strong {
  font-size: 12px;
  font-weight: 500;
  color: #425f4e;
  overflow-wrap: anywhere;
}

.audit-result {
  padding: 16px;
  margin: 0 18px 18px;
  background: #f7faf8;
  border: 1px solid #e0e8e3;
  border-radius: 10px;
}

.audit-result > header {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  align-items: center;
}

.audit-result > header > svg {
  flex: none;
  font-size: 21px;
  color: #698476;
}

.audit-result h4 {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: #385744;
}

.audit-result :deep(.ant-tag) {
  margin: 0;
}

.audit-result p {
  margin-top: 9px;
  font-size: 12px;
  line-height: 1.85;
  color: #718578;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.audit-result--success {
  background: #f0f8f3;
  border-color: #d5e9dc;
}

.audit-result--success > header > svg {
  color: #3e8a60;
}

.audit-result--warning {
  background: #fffbf2;
  border-color: #efe1bd;
}

.audit-result--warning > header > svg {
  color: #bd8b2c;
}

.audit-result--pending {
  background: #f5f8fc;
  border-color: #dde6ef;
}

.audit-detail {
  padding-top: 12px;
  margin-top: 14px;
  border-top: 1px solid rgb(92 122 105 / 12%);
}

.audit-detail p {
  margin-top: 4px;
  color: #4d6858;
}

.audit-confirmation {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 12px;
  font-size: 11px;
  color: #6e8878;
}

.audit-follow-up {
  padding: 0 18px 18px;
}

.audit-follow-up p {
  margin-bottom: 12px;
  font-size: 12px;
  line-height: 1.8;
  color: #73877b;
}

.audit-follow-up p > span {
  display: block;
  margin-bottom: 4px;
}

@media (max-width: 680px) {
  .audit-metadata {
    grid-template-columns: 1fr;
  }
}

.contract-attachments {
  margin-top: 22px;
}

.contract-attachments > header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.contract-attachments h3 {
  font-size: 14px;
  font-weight: 600;
  color: #3a5a47;
}

.contract-attachments > header > span {
  font-size: 11px;
  color: #96a69b;
}

.contract-attachments .attachment-row {
  padding: 14px 16px;
}

.contract-attachments .attachment-row > div {
  min-width: 0;
}

.contract-attachments .attachment-row strong {
  overflow-wrap: anywhere;
}

.contract-attachments .archive-preview {
  margin-top: 12px;
}

.attachment-help {
  margin-top: 9px;
  font-size: 11px;
  line-height: 1.8;
  color: #99a79e;
}

@media (max-width: 680px) {
  .contract-attachments .attachment-row {
    flex-wrap: wrap;
  }
}

.suggestion-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
