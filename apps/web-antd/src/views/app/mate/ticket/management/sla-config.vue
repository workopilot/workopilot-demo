<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type {
  AlertChannel,
  SlaAiSuggestion,
  SlaConfig,
  TicketPriority,
} from '#/types/ticket';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Empty,
  message,
  Modal,
  Pagination,
  Popconfirm,
  Spin,
  Switch,
  Tag,
} from 'ant-design-vue';

import {
  mockOpsStaff,
  mockSlaConfigs,
  ticketPriorityLabel,
} from '#/api/mock-data-ticket';
import { getSlaAiSuggestionsApi } from '#/api/ticket';

import SlaPolicyDrawer from './components/sla-policy-drawer.vue';

const router = useRouter();

const configs = ref<SlaConfig[]>([...mockSlaConfigs]);
const currentPage = ref(1);
const pageSize = ref(10);

/** 聚焦配置模式：全屏工作区，获得更宽的列表空间 */
const isMaximized = ref(false);

function toggleMaximized() {
  isMaximized.value = !isMaximized.value;
}

const pagedConfigs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return configs.value.slice(start, start + pageSize.value);
});

/** 告警渠道标签文案与颜色 */
const channelLabel: Record<AlertChannel, string> = {
  email: '邮件',
  'in-app': '站内信',
  phone: '电话',
  sms: '短信',
  wecom: '企业微信',
};

function channelColor(channel: AlertChannel) {
  switch (channel) {
    case 'email': {
      return 'blue';
    }
    case 'in-app': {
      return 'default';
    }
    case 'phone': {
      return 'orange';
    }
    case 'sms': {
      return 'purple';
    }
    case 'wecom': {
      return 'green';
    }
    default: {
      return 'default';
    }
  }
}

/** 通知对象 ID 列表 → 姓名拼接 */
function formatTargets(ids: string[]): string {
  if (!ids || ids.length === 0) return '—';
  return ids
    .map((id) => mockOpsStaff.find((s) => s.id === id)?.position || id)
    .join('、');
}

/** 合并未响应与未解决告警的渠道并去重展示 */
function mergedChannels(config: SlaConfig): AlertChannel[] {
  const set = new Set<AlertChannel>();
  if (config.responseAlert.enabled) {
    config.responseAlert.channels.forEach((c) => set.add(c));
  }
  if (config.resolveAlert.enabled) {
    config.resolveAlert.channels.forEach((c) => set.add(c));
  }
  return [...set];
}

/** 适用范围：优先级之外的维度条件（故障级别 / 设备类别 / 客户等级等） */
function scopeText(config: SlaConfig): string {
  const dims: string[] = [];
  if (config.faultLevel) dims.push(`故障级别＝${config.faultLevel}`);
  if (config.deviceCategory) dims.push(`设备类别＝${config.deviceCategory}`);
  if (config.customerLevel) dims.push(`客户等级＝${config.customerLevel}`);
  return dims.length > 0 ? dims.join('，') : '全部工单';
}

/** 计时起点文案 */
function startTimingLabel(config: SlaConfig): string {
  return config.startTiming === 'create' ? '工单创建后开始' : '工单受理后开始';
}

/** 展开查看依据与确认记录（单开） */
const expandedId = ref<string>('');

function toggleEvidence(config: SlaConfig) {
  expandedId.value = expandedId.value === config.id ? '' : config.id;
}

/** 确认 SLA 规则 */
function confirmSla(config: SlaConfig) {
  config.confirmStatus = 'confirmed';
  config.confirmRecord = {
    at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    by: '当前用户',
    version: 'v1.3.0',
  };
  message.success(`SLA「${config.name}」已确认`);
}

/** 暂停状态点击 → 跳转第 3 步处理流程查看对应节点 */
function goFlow() {
  router.push('/app/mate/apps/smart-ticket/wizard/custom-status');
}

function priorityColor(priority: TicketPriority) {
  switch (priority) {
    case 'high': {
      return 'orange';
    }
    case 'low': {
      return 'default';
    }
    case 'medium': {
      return 'blue';
    }
    case 'urgent': {
      return 'red';
    }
    default: {
      return 'default';
    }
  }
}

function toggleConfig(config: SlaConfig, value: boolean) {
  config.enabled = value;
  message.success(value ? 'SLA 已启用' : 'SLA 已停用');
}

/** Drawer 状态：编辑时传入策略，新增时为 null */
const drawerOpen = ref(false);
const editingPolicy = ref<null | SlaConfig>(null);

function openAdd() {
  editingPolicy.value = null;
  drawerOpen.value = true;
}

function openEdit(policy: SlaConfig) {
  // 浅拷贝以保证引用变化，触发 Drawer 内部 watch 重新填充表单
  editingPolicy.value = { ...policy };
  drawerOpen.value = true;
}

function onSave(policy: SlaConfig) {
  const idx = configs.value.findIndex((c) => c.id === policy.id);
  if (idx === -1) {
    configs.value.unshift(policy);
    currentPage.value = 1;
    message.success('SLA 策略已创建');
  } else {
    // 编辑已确认的规则后，该规则重新进入待确认状态
    if (configs.value[idx]!.confirmStatus === 'confirmed') {
      policy.confirmStatus = 'pending-review';
      policy.confirmRecord = undefined;
    }
    configs.value[idx] = policy;
    message.success('SLA 策略已更新');
  }
  drawerOpen.value = false;
}

function deleteConfig(config: SlaConfig) {
  const idx = configs.value.findIndex((c) => c.id === config.id);
  if (idx !== -1) {
    configs.value.splice(idx, 1);
    if (pagedConfigs.value.length === 0 && currentPage.value > 1) {
      currentPage.value -= 1;
    }
    message.success(`SLA「${config.name}」已删除`);
  }
}

/** AI 智能推荐弹窗 */
const aiOpen = ref(false);
const aiLoading = ref(false);
const aiSuggestions = ref<SlaAiSuggestion[]>([]);
const aiLoaded = ref(false);
/** 已采用的建议 id（采用后不可再操作） */
const adoptedIds = ref<string[]>([]);

async function openAiSuggestions() {
  aiOpen.value = true;
  if (aiLoaded.value) return;
  aiLoading.value = true;
  try {
    const res = await getSlaAiSuggestionsApi();
    aiSuggestions.value = res.data ?? [];
    aiLoaded.value = true;
  } catch {
    message.error('AI 推荐加载失败');
  } finally {
    aiLoading.value = false;
  }
}

/** 采用 AI 建议：构造预填策略并打开新增抽屉 */
function adoptAiSuggestion(s: SlaAiSuggestion) {
  const sug = s.suggestion;
  const responseRules = sug.responseTimeoutRules ?? [];
  const resolveRules = sug.resolveTimeoutRules ?? [];
  editingPolicy.value = {
    // 不带 id：抽屉按「新增」处理，保存时生成新 id
    id: undefined,
    name: sug.name,
    priority: 'medium',
    responseHours: sug.responseHours,
    resolveHours: sug.resolveHours,
    penalty: sug.applyConditionText,
    responseAlert: {
      enabled: responseRules.length > 0,
      delayMinutes: responseRules[0]?.atMinutes ?? 0,
      targetPersonIds: [],
      channels: responseRules[0]?.channels ?? ['in-app'],
    },
    resolveAlert: {
      enabled: resolveRules.length > 0,
      delayMinutes: resolveRules[0]?.atMinutes ?? 0,
      targetPersonIds: [],
      channels: resolveRules[0]?.channels ?? ['in-app'],
    },
    alertChannels: ['in-app'],
    enabled: true,
    // 扩展字段：抽屉表单回读
    code: sug.code,
    applyConditionText: sug.applyConditionText,
    responseAlertEnabled: responseRules.length > 0,
    responseTimeoutRules: responseRules,
    resolveAlertEnabled: resolveRules.length > 0,
    resolveTimeoutRules: resolveRules,
    source: 'ai',
    evidence: {
      source: s.source,
      snippet: s.reason,
    },
    confirmStatus: 'pending-review',
  } as unknown as SlaConfig;
  if (!adoptedIds.value.includes(s.id)) {
    adoptedIds.value.push(s.id);
  }
  aiOpen.value = false;
  drawerOpen.value = true;
  message.success('已采用该 AI 建议，可在表单中继续调整');
}
</script>

<template>
  <section class="ticket-page" :class="{ 'is-maximized': isMaximized }">
    <div class="ticket-toolbar">
      <div class="ticket-toolbar__left">
        <div class="ticket-title-block">
          <h2 class="ticket-title">时限提醒</h2>
          <p class="ticket-subtitle">
            配置响应与处理时限，以及提醒和超时升级规则
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button
          class="max-btn"
          :title="isMaximized ? '恢复' : '聚焦配置'"
          @click="toggleMaximized"
        >
          <Icon
            :icon="isMaximized ? 'lucide:minimize-2' : 'lucide:maximize-2'"
          />
          {{ isMaximized ? '恢复' : '聚焦配置' }}
        </Button>
        <Button class="ai-btn" @click="openAiSuggestions">
          <Icon icon="lucide:sparkles" />
          AI 智能推荐
        </Button>
        <Button type="primary" @click="openAdd">
          <Icon icon="lucide:plus" />
          新增 SLA
        </Button>
      </div>
    </div>

    <div class="ticket-table">
      <div class="ticket-table__head">
        <span></span>
        <span>SLA 名称与适用范围</span>
        <span>首次响应</span>
        <span>解决时限</span>
        <span>启用状态</span>
        <span>来源</span>
        <span>操作</span>
      </div>
      <template v-for="config in pagedConfigs" :key="config.id">
        <div
          class="ticket-table__row"
          :class="{ 'is-disabled': !config.enabled }"
        >
          <button
            class="ticket-table__toggle"
            :class="{ 'is-open': expandedId === config.id }"
            type="button"
            :title="expandedId === config.id ? '收起详情' : '展开详情'"
            @click="toggleEvidence(config)"
          >
            <Icon icon="lucide:chevron-right" class="size-3.5" />
          </button>
          <span class="ticket-table__main">
            <strong>{{ config.name }}</strong>
            <span class="ticket-table__scope">
              <Tag :color="priorityColor(config.priority)">
                {{ ticketPriorityLabel[config.priority] }}
              </Tag>
              <span class="ticket-table__scope-text">
                {{ scopeText(config) }}
              </span>
            </span>
          </span>
          <span class="ticket-table__timer">
            <Icon icon="lucide:clock" />
            <b>{{ config.responseHours }}h</b>
            <small>{{ startTimingLabel(config) }}</small>
          </span>
          <span class="ticket-table__timer ticket-table__timer--resolve">
            <Icon icon="lucide:hourglass" />
            <b>{{ config.resolveHours }}h</b>
            <span
              v-if="config.pauseStatuses?.length"
              class="ticket-table__pause"
            >
              <template
                v-for="(st, i) in config.pauseStatuses.slice(0, 2)"
                :key="st"
              >
                <a
                  class="ticket-table__pause-link"
                  title="查看状态流转中的该状态"
                  @click="goFlow()"
                >
                  「{{ st }}」
                </a>
                <span v-if="i < Math.min(config.pauseStatuses.length, 2) - 1">
                  、
                </span>
              </template>
              <span v-if="config.pauseStatuses.length > 2">
                等 {{ config.pauseStatuses.length }} 项暂停
              </span>
              <span v-else>暂停</span>
            </span>
            <small v-else>全程计时</small>
          </span>
          <span class="ticket-table__state">
            <Switch
              :checked="config.enabled"
              size="small"
              @change="(v: unknown) => toggleConfig(config, Boolean(v))"
            />
            {{ config.enabled ? '已启用' : '已停用' }}
          </span>
          <span class="ticket-table__src">
            <Icon
              v-if="config.source === 'ai'"
              icon="lucide:sparkles"
              class="size-3"
            />
            {{ config.source === 'ai' ? 'AI 解析' : '手工配置' }}
          </span>
          <span class="ticket-table__ops">
            <Button size="small" @click="openEdit(config)">
              <Icon icon="lucide:pencil" class="size-3" />
              编辑
            </Button>
            <Popconfirm
              title="确认删除该 SLA 配置吗？"
              ok-text="删除"
              cancel-text="取消"
              @confirm="deleteConfig(config)"
            >
              <Button size="small" danger>
                <Icon icon="lucide:trash-2" class="size-3" />
                删除
              </Button>
            </Popconfirm>
          </span>

          <!-- 展开详情：提醒与升级 / 依据与确认记录 / 操作 -->
          <div v-if="expandedId === config.id" class="rule-detail" @click.stop>
            <div class="rule-detail__block">
              <div class="rule-detail__block-label">提醒与升级</div>
              <div class="rule-detail__block-body">
                <div class="ticket-table__upgrade">
                  <Icon icon="lucide:arrow-up-right" class="size-3" />
                  <span>{{ config.penalty }}</span>
                </div>
                <div class="rule-detail__alerts">
                  <div class="ticket-table__alert-row">
                    <Tag
                      :color="
                        config.responseAlert.enabled ? 'orange' : 'default'
                      "
                    >
                      未响应
                    </Tag>
                    <span class="ticket-table__alert-text">
                      <template v-if="config.responseAlert.enabled">
                        +{{ config.responseAlert.delayMinutes }}min ·
                        {{
                          formatTargets(config.responseAlert.targetPersonIds)
                        }}
                      </template>
                      <template v-else>未启用</template>
                    </span>
                  </div>
                  <div class="ticket-table__alert-row">
                    <Tag
                      :color="config.resolveAlert.enabled ? 'red' : 'default'"
                    >
                      未解决
                    </Tag>
                    <span class="ticket-table__alert-text">
                      <template v-if="config.resolveAlert.enabled">
                        +{{ config.resolveAlert.delayMinutes }}min ·
                        {{ formatTargets(config.resolveAlert.targetPersonIds) }}
                      </template>
                      <template v-else>未启用</template>
                    </span>
                  </div>
                </div>
                <div
                  v-if="mergedChannels(config).length > 0"
                  class="ticket-table__alert-channels"
                >
                  <span class="rule-detail__chan-label">通知渠道</span>
                  <Tag
                    v-for="channel in mergedChannels(config)"
                    :key="channel"
                    :color="channelColor(channel)"
                  >
                    {{ channelLabel[channel] }}
                  </Tag>
                </div>
              </div>
            </div>

            <div class="rule-evidence">
              <div class="rule-evidence__col">
                <div class="rule-evidence__label">
                  依据
                  <Tag
                    v-if="config.source === 'ai'"
                    color="purple"
                    class="ticket-table__source"
                  >
                    AI 解析
                  </Tag>
                </div>
                <template v-if="config.evidence">
                  <div class="rule-evidence__src">
                    <Icon icon="lucide:book-open" class="size-3" />
                    {{ config.evidence.source }}
                    <span
                      v-if="config.evidence.confidence"
                      class="rule-evidence__conf"
                    >
                      置信度 {{ config.evidence.confidence }}
                    </span>
                  </div>
                  <blockquote class="rule-evidence__quote">
                    {{ config.evidence.snippet }}
                  </blockquote>
                  <p v-if="config.source === 'ai'" class="rule-evidence__ai">
                    <Icon icon="lucide:sparkles" class="size-3" />
                    AI 解析生成，请核对原文后确认；编辑后需重新确认。
                  </p>
                </template>
                <p v-else class="rule-evidence__none">
                  人工配置规则，未关联制度依据。
                </p>
              </div>
              <div class="rule-evidence__col">
                <div class="rule-evidence__label">确认记录</div>
                <template v-if="config.confirmStatus === 'confirmed'">
                  <div class="rule-evidence__record">
                    <Icon icon="lucide:user-check" class="size-3" />
                    {{ config.confirmRecord?.by || '—' }}
                    {{ config.confirmRecord?.at || '' }}
                    <span
                      v-if="config.confirmRecord?.version"
                      class="rule-evidence__ver"
                    >
                      规则版本 {{ config.confirmRecord.version }}
                    </span>
                  </div>
                </template>
                <p v-else class="rule-evidence__pending">
                  <Icon icon="lucide:clock-alert" class="size-3" />
                  待确认：核对计时起点、暂停状态与超时动作后在下方操作中点击「确认」生效。
                </p>
              </div>
            </div>

            <div
              v-if="config.confirmStatus === 'pending-review'"
              class="rule-detail__ops"
            >
              <Button type="primary" size="small" @click="confirmSla(config)">
                <Icon icon="lucide:check" class="size-3" />
                确认此 SLA
              </Button>
            </div>
          </div>
        </div>
      </template>
      <p v-if="configs.length === 0" class="ticket-empty">暂无 SLA 配置。</p>
      <div v-else class="ticket-table__pager">
        <Pagination
          v-model:current="currentPage"
          v-model:page-size="pageSize"
          :total="configs.length"
          :page-size-options="['10', '20', '50']"
          :show-size-changer="true"
          :show-quick-jumper="false"
          size="small"
          :show-total="(total: number) => `共 ${total} 条`"
        />
      </div>
    </div>

    <SlaPolicyDrawer
      v-model:open="drawerOpen"
      :policy="editingPolicy"
      @save="onSave"
    />

    <!-- AI 智能推荐弹窗 -->
    <Modal
      v-model:open="aiOpen"
      title="AI 智能推荐"
      :width="720"
      :footer="null"
      wrap-class-name="sla-ai-modal"
    >
      <Spin :spinning="aiLoading">
        <div v-if="aiSuggestions.length === 0 && !aiLoading" class="py-8">
          <Empty description="暂无推荐" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
        </div>
        <div
          v-else
          class="flex max-h-[520px] flex-col gap-3 overflow-y-auto pt-2"
        >
          <Card
            v-for="s in aiSuggestions"
            :key="s.id"
            size="small"
            class="sla-ai-card"
          >
            <!-- 左侧：建议内容 -->
            <div class="min-w-0 flex-1">
              <Tag class="mb-2 bg-amber-50 text-amber-700">
                {{ s.source }}
              </Tag>
              <p class="mb-2 text-xs leading-relaxed text-gray-700">
                {{ s.reason }}
              </p>
              <div class="flex flex-wrap gap-1">
                <Tag class="bg-blue-50 text-blue-700">
                  响应 {{ s.suggestion.responseHours }} 小时
                </Tag>
                <Tag class="bg-emerald-50 text-emerald-700">
                  解决 {{ s.suggestion.resolveHours }} 小时
                </Tag>
              </div>
            </div>
            <!-- 右侧：操作按钮 -->
            <div class="flex-none">
              <Button
                v-if="adoptedIds.includes(s.id)"
                size="small"
                disabled
                class="!min-w-[88px]"
              >
                <Icon icon="lucide:check" class="mr-0.5 size-3" />
                已采用
              </Button>
              <Button
                v-else
                type="primary"
                size="small"
                class="!min-w-[88px]"
                @click="adoptAiSuggestion(s)"
              >
                采用建议
              </Button>
            </div>
          </Card>
        </div>
      </Spin>
    </Modal>
  </section>
</template>

<style scoped>
@media (max-width: 1100px) {
  .ticket-table__head {
    display: none;
  }

  .ticket-table__row {
    grid-template-columns: 1fr 1fr;
    gap: 6px 10px;
  }
}

.ticket-page {
  height: 100%;
  min-height: 0;
  padding: 24px;
  overflow: auto;
}

/* 聚焦配置模式：fixed 全屏工作区（与处理流程页一致） */
.ticket-page.is-maximized {
  position: fixed;
  inset: 0;
  z-index: 1000;
  height: 100vh;
  padding: 24px;
  overflow: auto;
  background: #f4f8f6;
  border-radius: 0;
}

/* 聚焦配置按钮 */
.max-btn {
  gap: 4px;
  color: #0b6e65;
}

.ticket-toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.ticket-toolbar__left {
  display: flex;
  gap: 12px;
  align-items: center;
}

.ticket-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: #0c4a3f;
}

.ticket-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ticket-subtitle {
  margin: 0;
  font-size: 11px;
  color: #6d827b;
}

.ai-btn {
  color: #7c3aed;
  border-color: #c4b5fd;
}

.ai-btn:hover {
  color: #6d28d9 !important;
  background: #f5f3ff;
  border-color: #a78bfa !important;
}

.ticket-table {
  padding: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #dce9e4;
  border-radius: 16px;
}

.ticket-table__head {
  display: grid;
  grid-template-columns: 36px 1.4fr 0.85fr 1.3fr 0.7fr 0.65fr 0.9fr;
  gap: 12px;
  padding: 12px 18px;
  font-size: 11px;
  font-weight: 700;
  color: #5a756d;
  background: #f4f8f6;
  border-bottom: 1px solid #e1ece7;
}

.ticket-table__row {
  display: grid;
  grid-template-columns: 36px 1.4fr 0.85fr 1.3fr 0.7fr 0.65fr 0.9fr;
  gap: 12px;
  align-items: center;
  padding: 12px 18px;
  border-bottom: 1px solid #eef3f0;
  transition: background 0.15s ease;
}

.ticket-table__row:last-child {
  border-bottom: 0;
}

.ticket-table__row:hover {
  background: #f6fbf9;
}

.ticket-table__row.is-disabled {
  background: #f7faf9;
  opacity: 0.7;
}

.ticket-table__toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: #5a756d;
  cursor: pointer;
  background: transparent;
  border: none;
  border-radius: 6px;
  transition:
    transform 0.15s ease,
    background 0.15s ease;
}

.ticket-table__toggle:hover {
  color: #0b6e65;
  background: #e9f5f1;
}

.ticket-table__toggle.is-open {
  color: #0b6e65;
  transform: rotate(90deg);
}

.ticket-table__main strong {
  display: block;
  font-size: 13px;
  font-weight: 700;
  color: #0c4a3f;
}

.ticket-table__main small {
  display: block;
  margin-top: 3px;
  font-size: 10px;
  color: #81958e;
}

.ticket-table__timer {
  display: inline-flex;
  gap: 6px;
  align-items: baseline;
  font-size: 12px;
  color: #4a6b62;
}

.ticket-table__timer svg {
  align-self: center;
  color: #0b6e65;
}

.ticket-table__timer b {
  font-size: 16px;
  font-weight: 800;
  color: #0b6e65;
}

.ticket-table__timer--resolve b {
  color: #178f7b;
}

.ticket-table__timer small {
  font-size: 10px;
  color: #95a7a1;
}

/* 适用范围：优先级 Tag + 维度条件（名称下方横排） */
.ticket-table__scope {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  margin-top: 4px;
}

.ticket-table__scope-text {
  font-size: 11px;
  line-height: 1.5;
  color: #4a6b62;
}

/* 暂停状态链接 */
.ticket-table__pause {
  display: inline;
  font-size: 10px;
  color: #9a6e10;
}

.ticket-table__pause-link {
  color: #185fa5;
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 2px;
  cursor: pointer;
}

.ticket-table__pause-link:hover {
  color: #0b6e65;
}

/* 提醒与升级 */
.ticket-table__upgrade {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
  color: #8a4b15;
}

.ticket-table__upgrade svg {
  flex-shrink: 0;
  color: #e0a32e;
}

/* 启用状态（开关） */
.ticket-table__state {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 11px;
  color: #5f5e5a;
}

/* 来源 */
.ticket-table__src {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 11px;
  color: #5f5e5a;
}

.ticket-table__src svg {
  color: #7c3aed;
}

/* 操作列 */
.ticket-table__ops {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  white-space: nowrap;
}

/* ===== 展开详情：提醒与升级 / 依据 / 操作 ===== */
.rule-detail {
  display: flex;
  flex-direction: column;
  grid-column: 1 / -1;
  gap: 10px;
}

.rule-detail__block {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.rule-detail__block-label {
  flex-shrink: 0;
  width: 56px;
  font-size: 11px;
  line-height: 1.7;
  color: #81958e;
}

.rule-detail__block-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.rule-detail__alerts {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rule-detail__chan-label {
  font-size: 11px;
  color: #81958e;
}

.rule-detail__ops {
  display: flex;
  gap: 10px;
  align-items: center;
  padding-top: 10px;
  border-top: 1px dashed #cde8dc;
}

/* 展开查看依据 */
.is-open {
  color: #0b6e65;
}

.rule-evidence {
  display: grid;
  grid-template-columns: 1.6fr 1fr;
  gap: 20px;
  padding: 12px 14px;
  background: #f7fbf9;
  border: 1px solid #dcebe4;
  border-radius: 10px;
}

.rule-evidence__label {
  display: flex;
  gap: 6px;
  align-items: center;
  padding-bottom: 6px;
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 700;
  color: #0c4a3f;
  border-bottom: 1px dashed #cde8dc;
}

.rule-evidence__src {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: #185fa5;
}

.rule-evidence__src svg {
  flex-shrink: 0;
}

.rule-evidence__conf {
  font-size: 10px;
  font-weight: 500;
  color: #7c3aed;
}

.rule-evidence__quote {
  padding: 8px 10px;
  margin: 8px 0;
  font-size: 12px;
  line-height: 1.7;
  color: #4a5a54;
  background: #fff;
  border-left: 3px solid #32c8a5;
  border-radius: 0 8px 8px 0;
}

.rule-evidence__ai {
  display: flex;
  gap: 4px;
  align-items: center;
  margin: 0;
  font-size: 11px;
  color: #7c3aed;
}

.rule-evidence__none {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: #81958e;
}

.rule-evidence__record {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  color: #1f3b34;
}

.rule-evidence__record svg {
  color: #0b6e65;
}

.rule-evidence__ver {
  padding: 0 6px;
  font-size: 10px;
  color: #085041;
  background: #e1f5ee;
  border-radius: 8px;
}

.rule-evidence__pending {
  display: flex;
  gap: 4px;
  align-items: flex-start;
  margin: 0 0 8px;
  font-size: 11px;
  line-height: 1.6;
  color: #9a6e10;
}

.rule-evidence__pending svg {
  flex-shrink: 0;
  margin-top: 2px;
}

.ticket-table__alert-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.ticket-table__alert-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ticket-table__alert-channels {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.ticket-table__row :deep(.ant-tag) {
  margin: 0;
  font-size: 10px;
}

.ticket-table__pager {
  display: flex;
  justify-content: flex-end;
  padding: 12px 18px;
  border-top: 1px solid #eef5f2;
}

.ticket-empty {
  padding: 40px 0;
  font-size: 13px;
  color: #81958e;
  text-align: center;
}

/* AI 推荐卡片：左侧内容 + 右侧按钮 */
.sla-ai-card :deep(.ant-card-body) {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px;
}

.sla-ai-card :deep(.ant-btn) {
  margin: 0;
}
</style>
