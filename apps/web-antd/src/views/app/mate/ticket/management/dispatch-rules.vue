<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type {
  AssignmentAiSuggestion,
  AssignmentRule,
  DispatchTargetMode,
} from '#/types/ticket';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Empty,
  Input,
  message,
  Modal,
  Pagination,
  Popconfirm,
  Spin,
  Switch,
  Tag,
} from 'ant-design-vue';

import { mockDispatchRules } from '#/api/mock-data-ticket';
import { getAssignmentAiSuggestionsApi } from '#/api/ticket';

import AssignmentRuleDrawer from './components/assignment-rule-drawer.vue';

/** 派单规则（列表按 rulePriority 升序展示，即实际执行顺序） */
const rules = ref<AssignmentRule[]>([...mockDispatchRules]);

/** 聚焦配置模式：全屏工作区，获得更宽的表格空间 */
const isMaximized = ref(false);

function toggleMaximized() {
  isMaximized.value = !isMaximized.value;
}

const keyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);

const filtered = computed(() =>
  rules.value
    .filter((rule) => {
      const matchKw =
        !keyword.value ||
        rule.name.includes(keyword.value) ||
        rule.condition.includes(keyword.value) ||
        rule.target.includes(keyword.value);
      return matchKw;
    })
    .toSorted((a, b) => (a.rulePriority ?? 99) - (b.rulePriority ?? 99)),
);

const pagedRules = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filtered.value.slice(start, start + pageSize.value);
});

function resetPage() {
  currentPage.value = 1;
}

// ---- UI helpers ----

function toggleRule(rule: AssignmentRule, value: boolean) {
  rule.enabled = value;
  message.success(value ? '规则已启用' : '规则已停用');
}

/** 触发时机文案（工单创建 / 工单受理 / 转派重派 / 动作完成后） */
function triggerLabel(rule: AssignmentRule): string {
  switch (rule.trigger) {
    case 'action': {
      return '动作完成后';
    }
    case 'create': {
      return '工单创建';
    }
    case 'enter-node': {
      return rule.triggerNodeId === 'fn-1' ? '工单受理' : '进入节点';
    }
    case 'transfer': {
      return '转派 / 重派';
    }
    default: {
      return '—';
    }
  }
}

/** 展开查看依据与确认记录（单开） */
const expandedId = ref<string>('');

function toggleEvidence(rule: AssignmentRule) {
  expandedId.value = expandedId.value === rule.id ? '' : rule.id;
}

function nowText(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ');
}

/** 确认规则：AI 解析 / 待核对规则经管理员确认后生效 */
function confirmRule(rule: AssignmentRule) {
  rule.confirmStatus = 'confirmed';
  rule.confirmRecord = { at: nowText(), by: '当前用户', version: 'v1.3.0' };
  message.success(`规则「${rule.name}」已确认`);
}

/** 列表展示派单目标模式标签（优先 candidateScope.type，回退 targetMode） */
function targetModeOf(rule: AssignmentRule): DispatchTargetMode {
  const scopeType = rule.candidateScope?.type;
  if (scopeType === 'person' || scopeType === 'position') {
    return scopeType;
  }
  return rule.targetMode ?? 'position';
}

function targetModeLabel(rule: AssignmentRule): string {
  const scopeType = rule.candidateScope?.type;
  if (scopeType === 'role') return '角色';
  if (scopeType === 'dynamic') return '动态';
  return targetModeOf(rule) === 'position' ? '岗位' : '人员';
}

function targetModeColor(rule: AssignmentRule): string {
  const scopeType = rule.candidateScope?.type;
  if (scopeType === 'role') return 'magenta';
  if (scopeType === 'dynamic') return 'gold';
  return targetModeOf(rule) === 'position' ? 'geekblue' : 'purple';
}

const drawerOpen = ref(false);
const editingRule = ref<AssignmentRule | null>(null);

function openAdd() {
  editingRule.value = null;
  drawerOpen.value = true;
}

function openEdit(rule: AssignmentRule) {
  editingRule.value = { ...rule };
  drawerOpen.value = true;
}

function onSave(rule: AssignmentRule) {
  const idx = rules.value.findIndex((r) => r.id === rule.id);
  if (idx === -1) {
    rules.value.unshift(rule);
    resetPage();
    message.success('派单规则已创建');
  } else {
    // 编辑已确认的规则后，该规则重新进入待确认状态
    if (rules.value[idx]!.confirmStatus === 'confirmed') {
      rule.confirmStatus = 'pending-review';
      rule.confirmRecord = undefined;
    }
    rules.value.splice(idx, 1, rule);
    message.success('派单规则已更新');
  }
}

function deleteRule(rule: AssignmentRule) {
  const idx = rules.value.findIndex((r) => r.id === rule.id);
  if (idx !== -1) {
    rules.value.splice(idx, 1);
    if (pagedRules.value.length === 0 && currentPage.value > 1) {
      currentPage.value -= 1;
    }
    message.success(`规则「${rule.name}」已删除`);
  }
}

/** AI 智能推荐弹窗 */
const aiOpen = ref(false);
const aiLoading = ref(false);
const aiSuggestions = ref<AssignmentAiSuggestion[]>([]);
const aiLoaded = ref(false);
/** 已采用的建议 id（采用后不可再操作） */
const adoptedIds = ref<string[]>([]);

async function openAiSuggestions() {
  aiOpen.value = true;
  if (aiLoaded.value) return;
  aiLoading.value = true;
  try {
    const res = await getAssignmentAiSuggestionsApi();
    aiSuggestions.value = res.data ?? [];
    aiLoaded.value = true;
  } catch {
    message.error('AI 推荐加载失败');
  } finally {
    aiLoading.value = false;
  }
}

/** 触发时机中文标签（AI 建议卡片展示） */
const triggerMomentLabelMap: Record<string, string> = {
  'enter-node': '进入节点',
  'leave-node': '离开节点',
  action: '动作触发',
  create: '工单创建',
  transfer: '转派时',
};

/** 派单对象中文标签（AI 建议卡片展示） */
const candidateScopeLabelMap: Record<string, string> = {
  person: '指定人员',
  position: '指定岗位',
  role: '指定角色',
  dynamic: '动态人员',
};

/** 分派策略中文标签（AI 建议卡片展示） */
const strategyLabelMap: Record<string, string> = {
  'load-balance': '负载均衡',
  'round-robin': '轮询',
};

/** 采用 AI 建议：构造预填规则并打开新增抽屉 */
function adoptAiSuggestion(s: AssignmentAiSuggestion) {
  const sug = s.suggestion;
  const scopeType = sug.candidateScopeType;
  const candidateIds = (() => {
    if (scopeType === 'person')
      return sug.targetPersonId ? [sug.targetPersonId] : [];
    if (scopeType === 'position')
      return sug.targetPosition ? [sug.targetPosition] : [];
    if (scopeType === 'role') return sug.targetRoleId ? [sug.targetRoleId] : [];
    return [];
  })();
  editingRule.value = {
    // 不带 id：抽屉按「新增」处理，保存时生成新 id
    id: undefined,
    name: sug.name,
    code: sug.code,
    condition: sug.applyConditionText,
    targetMode: scopeType === 'person' ? 'person' : 'position',
    target: '',
    priority: 'medium',
    enabled: true,
    hitCount: 0,
    trigger: (sug.trigger === 'create' || sug.trigger === 'transfer'
      ? 'enter-node'
      : sug.trigger) as AssignmentRule['trigger'],
    candidateScope: {
      type: scopeType,
      ids: candidateIds,
      dynamicExpr: sug.dynamicExpr,
    },
    strategy: sug.strategy ?? 'load-balance',
    rulePriority: 10,
    stopOnMatch: true,
    targetPersonId: sug.targetPersonId,
    targetPosition: sug.targetPosition,
    source: 'ai',
    evidence: {
      source: s.source,
      snippet: s.reason,
    },
    confirmStatus: 'pending-review',
  } as unknown as AssignmentRule;
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
          <h2 class="ticket-title">派单规则</h2>
          <p class="ticket-subtitle">
            设置工单分配条件、处理对象和默认派单方式
          </p>
        </div>
      </div>
      <div class="ticket-toolbar__right">
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
        <Input
          v-model:value="keyword"
          allow-clear
          placeholder="搜索规则名称 / 条件 / 目标"
          class="ticket-toolbar__search"
          @change="resetPage"
        >
          <template #prefix><Icon icon="lucide:search" /></template>
        </Input>
        <Button class="ai-btn" @click="openAiSuggestions">
          <Icon icon="lucide:sparkles" />
          AI 智能推荐
        </Button>
        <Button type="primary" @click="openAdd">
          <Icon icon="lucide:plus" />
          新增规则
        </Button>
      </div>
    </div>

    <div class="ticket-table">
      <div class="ticket-table__head">
        <span></span>
        <span>规则名称</span>
        <span>触发条件</span>
        <span>触发时机</span>
        <span>派单目标与进入状态</span>
        <span>启用状态</span>
        <span>来源</span>
        <span>操作</span>
      </div>
      <template v-for="rule in pagedRules" :key="rule.id">
        <div
          class="ticket-table__row"
          :class="{ 'is-disabled': !rule.enabled }"
        >
          <button
            class="ticket-table__toggle"
            :class="{ 'is-open': expandedId === rule.id }"
            type="button"
            :title="expandedId === rule.id ? '收起详情' : '展开详情'"
            @click="toggleEvidence(rule)"
          >
            <Icon icon="lucide:chevron-right" class="size-3.5" />
          </button>
          <span class="ticket-table__main">
            <strong>{{ rule.name }}</strong>
            <small>
              {{ rule.code || rule.id }} · 优先级 #{{
                rule.rulePriority ?? '—'
              }}
            </small>
          </span>
          <span class="ticket-table__condition">
            {{ rule.condition }}
          </span>
          <span class="ticket-table__trigger">
            <Icon icon="lucide:zap" class="size-3" />
            {{ triggerLabel(rule) }}
          </span>
          <span class="ticket-table__hit">
            <span class="ticket-table__hit-target">
              <Tag class="ticket-table__mode" :color="targetModeColor(rule)">
                {{ targetModeLabel(rule) }}
              </Tag>
              <span class="ticket-table__hit-name">{{ rule.target }}</span>
            </span>
            <span class="ticket-table__hit-next">
              <Icon icon="lucide:arrow-right" class="size-3" />
              进入「{{ rule.targetStatus || '当前状态' }}」
            </span>
          </span>
          <span class="ticket-table__state">
            <Switch
              :checked="rule.enabled"
              size="small"
              @change="(v: unknown) => toggleRule(rule, Boolean(v))"
            />
            {{ rule.enabled ? '已启用' : '已停用' }}
          </span>
          <span class="ticket-table__src">
            <Icon
              v-if="rule.source === 'ai'"
              icon="lucide:sparkles"
              class="size-3"
            />
            {{ rule.source === 'ai' ? 'AI 解析' : '手工配置' }}
          </span>
          <span class="ticket-table__ops">
            <Button size="small" @click="openEdit(rule)">
              <Icon icon="lucide:pencil" class="size-3" />
              编辑
            </Button>
            <Popconfirm
              title="确认删除该规则吗？"
              ok-text="删除"
              cancel-text="取消"
              @confirm="deleteRule(rule)"
            >
              <Button size="small" danger>
                <Icon icon="lucide:trash-2" class="size-3" />
                删除
              </Button>
            </Popconfirm>
          </span>

          <!-- 展开详情：冲突提醒 / 完整条件与执行 / 依据与确认记录 / 操作 -->
          <div v-if="expandedId === rule.id" class="rule-detail" @click.stop>
            <div v-if="rule.conflictNote" class="rule-detail__conflict">
              <Icon icon="lucide:triangle-alert" class="size-3.5" />
              <span>
                <b>冲突提醒：</b>
                {{ rule.conflictNote }}
              </span>
            </div>

            <div class="rule-detail__cond">
              <span class="rule-detail__key">完整条件</span>
              <div class="rule-detail__cond-body">
                <p>{{ rule.condition }}</p>
                <small>
                  命中后{{
                    rule.stopOnMatch === false
                      ? '继续匹配下一条规则'
                      : '停止匹配（优先级 #N 从小到大执行）'
                  }}；未命中任何规则时进入待分配池，由调度岗（刘静宇）在 1
                  小时内人工分派。
                </small>
              </div>
            </div>

            <div class="rule-evidence">
              <div class="rule-evidence__col">
                <div class="rule-evidence__label">
                  依据
                  <Tag
                    v-if="rule.source === 'ai'"
                    color="purple"
                    class="ticket-table__mode"
                  >
                    AI 解析
                  </Tag>
                </div>
                <template v-if="rule.evidence">
                  <div class="rule-evidence__src">
                    <Icon icon="lucide:book-open" class="size-3" />
                    {{ rule.evidence.source }}
                    <span
                      v-if="rule.evidence.confidence"
                      class="rule-evidence__conf"
                    >
                      置信度 {{ rule.evidence.confidence }}
                    </span>
                  </div>
                  <blockquote class="rule-evidence__quote">
                    {{ rule.evidence.snippet }}
                  </blockquote>
                  <p v-if="rule.source === 'ai'" class="rule-evidence__ai">
                    <Icon icon="lucide:sparkles" class="size-3" />
                    AI 解析生成，请核对原文后确认；编辑后需重新确认。
                  </p>
                </template>
                <p v-else class="rule-evidence__none">
                  人工配置规则，未关联制度依据。可在编辑中补充配置说明。
                </p>
              </div>
              <div class="rule-evidence__col">
                <div class="rule-evidence__label">确认记录</div>
                <template v-if="rule.confirmStatus === 'confirmed'">
                  <div class="rule-evidence__record">
                    <Icon icon="lucide:user-check" class="size-3" />
                    {{ rule.confirmRecord?.by || '—' }}
                    {{ rule.confirmRecord?.at || '' }}
                    <span
                      v-if="rule.confirmRecord?.version"
                      class="rule-evidence__ver"
                    >
                      规则版本 {{ rule.confirmRecord.version }}
                    </span>
                  </div>
                </template>
                <p v-else class="rule-evidence__pending">
                  <Icon icon="lucide:clock-alert" class="size-3" />
                  待确认：核对条件、派单目标与依据后在下方操作中点击「确认」生效。
                </p>
              </div>
            </div>

            <div
              v-if="rule.confirmStatus === 'pending-review'"
              class="rule-detail__ops"
            >
              <Button type="primary" size="small" @click="confirmRule(rule)">
                <Icon icon="lucide:check" class="size-3" />
                确认此规则
              </Button>
            </div>
          </div>
        </div>
      </template>

      <p v-if="filtered.length === 0" class="ticket-empty">
        未找到匹配的派单规则。
      </p>
      <div v-else class="ticket-table__pager">
        <Pagination
          v-model:current="currentPage"
          v-model:page-size="pageSize"
          :total="filtered.length"
          :page-size-options="['10', '20', '50']"
          :show-size-changer="true"
          :show-quick-jumper="false"
          size="small"
          :show-total="(total: number) => `共 ${total} 条`"
        />
      </div>
    </div>

    <AssignmentRuleDrawer
      v-model:open="drawerOpen"
      :rule="editingRule"
      @save="onSave"
    />

    <!-- AI 智能推荐弹窗 -->
    <Modal
      v-model:open="aiOpen"
      title="AI 智能推荐"
      :width="720"
      :footer="null"
      wrap-class-name="dispatch-ai-modal"
    >
      <Spin :spinning="aiLoading">
        <div v-if="aiSuggestions.length === 0 && !aiLoading" class="py-8">
          <Empty description="暂无推荐" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
        </div>
        <div
          v-else
          class="flex max-h-[520px] flex-col gap-3 overflow-y-auto pt-2"
        >
          <div
            v-for="s in aiSuggestions"
            :key="s.id"
            class="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50/60 p-3"
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
                  {{
                    triggerMomentLabelMap[s.suggestion.trigger] ??
                    s.suggestion.trigger
                  }}
                </Tag>
                <Tag class="bg-emerald-50 text-emerald-700">
                  {{ s.suggestion.applyConditionText }}
                </Tag>
                <Tag class="bg-purple-50 text-purple-700">
                  {{
                    candidateScopeLabelMap[s.suggestion.candidateScopeType] ??
                    s.suggestion.candidateScopeType
                  }}
                </Tag>
                <Tag
                  v-if="s.suggestion.strategy"
                  class="bg-pink-50 text-pink-700"
                >
                  {{
                    strategyLabelMap[s.suggestion.strategy] ??
                    s.suggestion.strategy
                  }}
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
          </div>
        </div>
      </Spin>
    </Modal>
  </section>
</template>

<style scoped>
@media (max-width: 1100px) {
  .ticket-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .ticket-toolbar__search {
    width: 100%;
  }

  .ticket-toolbar__right {
    justify-content: flex-start;
  }

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

.ticket-toolbar__search {
  width: 320px;
}

.ticket-toolbar__right {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: center;
  justify-content: flex-end;
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

.ticket-toolbar__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ticket-toolbar__chips button {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #4a6b62;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d3e4de;
  border-radius: 999px;
}

.ticket-toolbar__chips button.is-active {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
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
  grid-template-columns: 36px 1.1fr 1.45fr 0.75fr 1.25fr 0.7fr 0.65fr 0.9fr;
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
  grid-template-columns: 36px 1.1fr 1.45fr 0.75fr 1.25fr 0.7fr 0.65fr 0.9fr;
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

.ticket-table__condition {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: 12px;
  line-height: 1.6;
  color: #1f3b34;
  word-break: break-all;
  -webkit-box-orient: vertical;
}

/* 触发时机 */
.ticket-table__trigger {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: #4a6b62;
}

.ticket-table__trigger svg {
  color: #0b6e65;
}

/* 命中结果：派给谁 → 进入哪个状态 */
.ticket-table__hit {
  display: flex;
  flex-direction: column;
  gap: 3px;
  font-size: 12px;
  line-height: 1.5;
}

.ticket-table__hit-target {
  display: flex;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.ticket-table__hit-name {
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 600;
  color: #1f3b34;
  white-space: nowrap;
}

.ticket-table__hit-next {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 11px;
  color: #0b6e65;
}

.ticket-table__hit-next svg {
  color: #32c8a5;
}

/* 启用状态（开关） */
.ticket-table__state {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 11px;
  color: #5f5e5a;
}

/* 来源文字 */
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

/* ===== 展开详情：冲突提醒 / 完整条件 / 操作 ===== */
.rule-detail {
  display: flex;
  flex-direction: column;
  grid-column: 1 / -1;
  gap: 10px;
}

.rule-detail__conflict {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 9px 12px;
  font-size: 11.5px;
  line-height: 1.6;
  color: #9a6e10;
  background: #fff9ec;
  border: 1px solid #eadfbf;
  border-radius: 8px;
}

.rule-detail__conflict svg {
  flex-shrink: 0;
  margin-top: 2px;
  color: #e0a32e;
}

.rule-detail__conflict b {
  font-weight: 600;
}

.rule-detail__cond {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.rule-detail__key {
  flex-shrink: 0;
  width: 56px;
  font-size: 11px;
  line-height: 1.7;
  color: #81958e;
}

.rule-detail__cond-body {
  flex: 1;
  min-width: 0;
}

.rule-detail__cond-body p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #1f3b34;
}

.rule-detail__cond-body small {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.6;
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

.ticket-table__mode {
  flex-shrink: 0;
  margin: 0;
  font-size: 10px;
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
</style>
