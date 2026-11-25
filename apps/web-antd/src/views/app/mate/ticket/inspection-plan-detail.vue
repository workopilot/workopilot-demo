<!-- 巡检计划详情页（同「工单详情」布局）：左主列（计划信息/执行记录/变更记录） + 右侧栏（下一步建议：AI 建议 + 数字员工操作） -->
<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type { InspectionPlan, InspectionStatus } from '#/types/inspection';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, message, Tag } from 'ant-design-vue';

import {
  copyInspectionPlanApi,
  getInspectionPlansApi,
  updateInspectionPlanApi,
} from '#/api/contract-inspection';
import { inspectionNextDate } from '#/api/inspection-rules';
import { mockMateEmployees } from '#/api/mock-data-mate';
import EmployeeRecommendations from '../components/employee-recommendations.vue';
import { recommendationEmployee } from '#/utils/employee-recommendations';

import InspectionContractReview from './components/inspection-contract-review.vue';
import InspectionDeviceSummary from './components/inspection-device-summary.vue';
import InspectionExecutionPanel from './components/inspection-execution-panel.vue';
import InspectionConfirmModal from './modals/inspection-confirm-modal.vue';

const route = useRoute();
const router = useRouter();

const plans = ref<InspectionPlan[]>([]);
const busy = ref(false);

async function load() {
  try {
    const response = await getInspectionPlansApi();
    plans.value = response.data;
  } catch {
    message.error('加载失败，请重试');
  }
}

onMounted(load);

// ==================== 当前计划 / 上一单下一单 ====================

const planId = computed(() => String(route.query.id || ''));
const currentIndex = computed(() =>
  plans.value.findIndex((p) => p.id === planId.value),
);
const current = computed(() =>
  currentIndex.value >= 0 ? plans.value[currentIndex.value] : undefined,
);
const hasPrev = computed(() => currentIndex.value > 0);
const hasNext = computed(
  () => currentIndex.value >= 0 && currentIndex.value < plans.value.length - 1,
);

function navTo(offset: -1 | 1) {
  const next = plans.value[currentIndex.value + offset];
  if (next) {
    void router.replace({ query: { id: next.id } });
  }
}

function goBack() {
  void router.push('/app/mate/employee/ticket-assistant/inspection-plans');
}

// ==================== 状态展示 ====================

const statusDotClass: Record<InspectionStatus, string> = {
  已暂停: 'is-paused',
  已完成: 'is-done',
  已终止: 'is-ended',
  待启用: 'is-ready',
  执行中: 'is-running',
  草稿: 'is-draft',
};

const completed = (p: InspectionPlan) =>
  p.executions.filter((e) => e.status === '已完成').length;
const nextDate = inspectionNextDate;

// ==================== 计划信息展开 ====================

const metaExpanded = ref(false);

// ==================== 变更记录（折叠） ====================

const logsOpen = ref(false);

// ==================== 状态流转操作（左卡快捷操作） ====================

function stateAction(
  plan: InspectionPlan,
): undefined | { label: string; target: InspectionStatus } {
  switch (plan.status) {
    case '已暂停': {
      return { label: '恢复', target: '执行中' };
    }
    case '待启用': {
      return { label: '启用', target: '执行中' };
    }
    case '执行中': {
      return { label: '暂停', target: '已暂停' };
    }
    case '草稿': {
      return { label: '通过助理启用', target: '执行中' };
    }
    default: {
      return undefined;
    }
  }
}

/** 状态变更确认弹窗（计划取当前详情页的 current） */
const confirmOpen = ref(false);
const confirmTarget = ref<InspectionStatus>('执行中');
const changing = ref(false);

function change(target: InspectionStatus) {
  if (target === '执行中' && current.value?.status === '草稿') {
    goToAssistant('enable');
    return;
  }
  confirmTarget.value = target;
  confirmOpen.value = true;
}

async function confirmChange() {
  if (!current.value || changing.value) return;
  changing.value = true;
  try {
    await updateInspectionPlanApi(current.value.id, {
      status: confirmTarget.value,
    });
    confirmOpen.value = false;
    await load();
    message.success(`计划已设为${confirmTarget.value}`);
  } catch (error) {
    message.error((error as Error).message);
  } finally {
    changing.value = false;
  }
}

// ==================== 编辑计划 ====================

function edit(plan: InspectionPlan) {
  void router.push({
    path: '/app/mate/employee/ticket-assistant/ticket-chat',
    query: {
      action: plan.status === '草稿' ? 'draft' : 'adjust',
      planId: plan.id,
    },
  });
}

async function copy(plan: InspectionPlan) {
  if (busy.value) return;
  busy.value = true;
  try {
    const result = await copyInspectionPlanApi(plan.id);
    await load();
    void router.replace({ query: { id: result.data.id } });
    edit(result.data);
    message.success('已复制为草稿，请核对配置');
  } catch {
    message.error('复制失败，请重试');
  } finally {
    busy.value = false;
  }
}

// ==================== 右侧栏：下一步建议（AI 建议 + 数字员工） ====================

const ticketAssistantAvatar =
  mockMateEmployees.find((e) => e.id === 'ticket-assistant')?.avatar ?? '';
/** AI 下一步建议文案（随计划状态变化） */
const nextAdviceText = computed(() => {
  switch (current.value?.status) {
    case '已完成': {
      return '计划已完成全部巡检，建议归档并沉淀为标准巡检模板。';
    }
    case '已暂停': {
      return '计划已暂停排期，如需恢复执行请确认客户现场条件后操作。';
    }
    case '待启用': {
      return '计划配置已就绪，建议启用计划，系统将按频次自动生成巡检工单。';
    }
    case '执行中': {
      return '计划执行中，注意跟进逾期巡检并及时回填巡检结果，确保闭环。';
    }
    case '草稿': {
      return '草稿已保存，请通过工单助理确认排期、人员、设备与巡检模板后启用。';
    }
    default: {
      return '计划已终止，可复制为草稿快速创建新的巡检计划。';
    }
  }
});

/** AI 推荐的主操作（与 AI 建议文案同源，按计划状态确定性映射） */
const recommendedAction = computed<
  'adjust' | 'enable' | 'pause' | 'report' | 'resume' | null
>(() => {
  switch (current.value?.status) {
    case '已暂停': {
      return 'resume';
    }
    case '待启用': {
      return 'enable';
    }
    case '执行中': {
      return 'report';
    }
    case '草稿': {
      return 'enable';
    }
    default: {
      return null;
    }
  }
});

/** 跳转工单助理聊天框，并带入当前计划信息与待办操作 */
function goToAssistant(
  action: 'adjust' | 'enable' | 'pause' | 'report' | 'resume',
) {
  const plan = current.value;
  if (!plan) return;
  const actionText = {
    adjust: '帮我完善计划配置',
    enable: '帮我启用计划',
    pause: '帮我暂停巡检',
    report: '帮我填报巡检结果',
    resume: '帮我恢复执行',
  }[action];
  const prefill = [
    `请帮我处理巡检计划 ${plan.id}（${plan.name}）`,
    `客户：${plan.customer}（合同：${plan.contract}）`,
    `当前状态：${plan.status}，负责人：${plan.owner}，频次：${plan.frequency}`,
    actionText,
  ].join('\n');
  void router.push({
    path: '/app/mate/employee/ticket-assistant/ticket-chat',
    query: { action, prefill, planId: plan.id },
  });
}

const collaboration = computed(() => {
  const plan = current.value;
  if (!plan) return undefined;
  const purpose =
    plan.status === '已暂停'
      ? '恢复巡检协调'
      : plan.status === '已完成' || plan.status === '已终止'
        ? '巡检复盘'
        : '巡检安排沟通';
  return {
    context: {
      currentEmployeeId: 'ticket-assistant',
      source: 'inspection-plan-detail',
      businessId: plan.id,
      title: `巡检计划 · ${plan.name}`,
      query: { planId: plan.id },
      summary: `计划：${plan.id}（${plan.name}）\n客户：${plan.customer}；合同：${plan.contract}\n状态：${plan.status}；负责人：${plan.owner}；频次：${plan.frequency}`,
    },
    employees: [
      recommendationEmployee(
        'meeting-assistant',
        `计划当前为“${plan.status}”，可与${plan.customer}沟通${purpose}事项。`,
        [
          {
            id: 'meeting',
            title: `为${plan.customer}准备${purpose}会议`,
            icon: 'lucide:calendar-plus',
            prompt: `请根据巡检计划 ${plan.id} 的当前情况准备${purpose}会议草稿，候选参会人包括${plan.owner}，请核对客户参会人及时间后再预约。`,
          },
        ],
      ),
    ],
  };
});
</script>

<template>
  <section class="wdc-root">
    <!-- ============ 布局：左计划详情卡（6）+ 右下一步建议卡（4） ============ -->
    <div v-if="current" class="wdc-layout">
      <!-- 左：计划详情卡片（标题区 + 正文） -->
      <section class="wdc-detail">
        <!-- ============ 顶部标题区 ============ -->
        <header class="wdc-topbar">
          <div class="wdc-topbar__row">
            <button type="button" class="wdc-back" @click="goBack">
              <Icon icon="lucide:arrow-left" />
              返回巡检计划
            </button>
            <div class="wdc-nav">
              <button type="button" :disabled="!hasPrev" @click="navTo(-1)">
                <Icon icon="lucide:chevron-left" />
                上一单
              </button>
              <span class="wdc-nav__pos">
                {{ currentIndex + 1 }} / {{ plans.length }}
              </span>
              <button type="button" :disabled="!hasNext" @click="navTo(1)">
                下一单
                <Icon icon="lucide:chevron-right" />
              </button>
            </div>
          </div>
          <div class="wdc-titlebar">
            <h1 class="wdc-title">{{ current.name }}</h1>
            <span class="wdc-code">{{ current.id }}</span>
          </div>
        </header>

        <!-- 左主列 -->
        <div class="wdc-main">
          <!-- 计划信息：摘要与合同要求、执行安排合并展示 -->
          <section class="wdc-card wdc-info">
            <header class="wdc-info__head">
              <h3 class="wdc-card__title">计划信息</h3>
              <div class="wdc-info__ops">
                <button
                  v-if="!['已完成', '已终止'].includes(current.status)"
                  type="button"
                  class="wdc-op"
                  @click="edit(current)"
                >
                  <Icon icon="lucide:pencil" />
                  编辑计划
                </button>
                <button
                  v-if="stateAction(current)"
                  type="button"
                  class="wdc-op is-primary"
                  @click="change(stateAction(current)!.target)"
                >
                  <Icon icon="lucide:play" />
                  {{ stateAction(current)!.label }}
                </button>
                <button
                  v-if="['执行中', '已暂停', '待启用'].includes(current.status)"
                  type="button"
                  class="wdc-op is-danger"
                  @click="change('已终止')"
                >
                  <Icon icon="lucide:circle-off" />
                  终止
                </button>
                <button type="button" class="wdc-op" @click="copy(current)">
                  <Icon icon="lucide:copy" />
                  复制为草稿
                </button>
              </div>
            </header>
            <div class="wdc-info__row">
              <div class="wdc-meta__cell">
                <label>计划状态</label>
                <span
                  class="wdc-meta__dot"
                  :class="statusDotClass[current.status]"
                >
                  <i></i>
                  {{ current.status }}
                </span>
              </div>
              <div class="wdc-meta__cell">
                <label>巡检频次</label>
                <span class="wdc-meta__strong">{{ current.frequency }}</span>
              </div>
              <div class="wdc-meta__cell">
                <label>下次执行</label>
                <span class="wdc-meta__strong">{{ nextDate(current) }}</span>
              </div>
              <div class="wdc-meta__cell">
                <label>客户</label>
                <span class="wdc-meta__strong">{{ current.customer }}</span>
                <small>{{ current.project }}</small>
              </div>
            </div>
            <div v-if="metaExpanded" class="wdc-info__more">
              <div class="wdc-meta__cell wdc-meta__cell--wide">
                <label>关联合同</label>
                <span class="wdc-meta__strong">{{ current.contract }}</span>
              </div>
              <div class="wdc-meta__cell">
                <label>服务期限</label>
                <span class="wdc-meta__strong">
                  {{ current.start }} 至 {{ current.end }}
                </span>
              </div>
              <div class="wdc-meta__cell">
                <label>执行进度</label>
                <span class="wdc-meta__strong">
                  {{ completed(current) }} / {{ current.executions.length }} 次
                </span>
              </div>
              <div class="wdc-meta__cell">
                <label>负责人</label>
                <span class="wdc-meta__strong">{{ current.owner }}</span>
                <small>{{ current.team }}</small>
              </div>
              <div class="wdc-meta__cell">
                <label>工单提醒</label>
                <span class="wdc-meta__strong">
                  提前 {{ current.advanceDays }} 天生成工单
                </span>
              </div>
              <div class="wdc-meta__cell wdc-meta__cell--wide">
                <label>巡检范围</label>
                <span class="wdc-meta__strong">{{ current.scope }}</span>
              </div>
              <div class="wdc-meta__cell wdc-meta__cell--wide">
                <label>检查标准与记录要求</label>
                <span class="wdc-meta__strong">{{ current.requirements }}</span>
              </div>
              <div class="wdc-meta__cell wdc-meta__cell--wide">
                <label>排期规则</label>
                <span class="wdc-meta__strong">
                  以执行记录中的日期为准，遇节假日保持原日期
                </span>
              </div>
              <div
                v-if="current.contractText"
                class="wdc-meta__cell wdc-meta__cell--wide"
              >
                <label>合同原始信息</label>
                <span class="wdc-meta__strong whitespace-pre-line">
                  {{ current.contractText }}
                </span>
              </div>
            </div>
            <button
              type="button"
              class="wdc-info__toggle"
              @click="metaExpanded = !metaExpanded"
            >
              {{ metaExpanded ? '收起计划信息' : '展开合同要求与执行安排' }}
              <Icon
                :icon="
                  metaExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'
                "
              />
            </button>
          </section>

          <section class="wdc-card">
            <h3 class="wdc-card__title">设备与巡检事项</h3>
            <InspectionDeviceSummary :plan="current" />
          </section>
          <!-- 执行记录 -->
          <section class="wdc-card">
            <header class="wdc-card__head">
              <h3 class="wdc-card__title">执行记录</h3>
              <span class="wdc-card__extra">
                {{
                  current.status === '草稿'
                    ? '启用后生成排期'
                    : `${current.executions.length} 次排期`
                }}
              </span>
            </header>
            <InspectionContractReview :plan="current" @changed="load" />
            <InspectionExecutionPanel :plan="current" @changed="load" />
          </section>

          <!-- 变更记录 -->
          <section class="wdc-card wdc-flow">
            <button
              type="button"
              class="wdc-flow__toggle"
              @click="logsOpen = !logsOpen"
            >
              <Icon
                :icon="
                  logsOpen ? 'lucide:chevron-down' : 'lucide:chevron-right'
                "
              />
              变更记录 · {{ current.logs.length }} 条
            </button>
            <p
              v-if="current.logs.length > 0 && !logsOpen"
              class="wdc-flow__latest"
            >
              最新：{{ current.logs[0]?.time }}
              <b>{{ current.logs[0]?.content }}</b>
            </p>
            <span class="wdc-flow__hint">展开后按最新记录优先展示</span>
          </section>
          <section v-if="logsOpen" class="wdc-card wdc-flow-list">
            <ul class="wdc-timeline">
              <li v-for="(log, index) in current.logs" :key="index">
                <i>
                  <Icon icon="lucide:sticky-note" />
                </i>
                <div>
                  <strong>
                    <Tag color="blue" class="wdc-timeline__tag">变更</Tag>
                    {{ log.content }}
                  </strong>
                  <small>{{ log.time }} · {{ log.operator }}</small>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </section>

      <!-- 右：下一步建议（独立卡片） -->
      <aside class="wdc-side">
        <section class="wdc-card wdc-next">
          <header class="wdc-next__head">
            <i class="wdc-next__icon">
              <Icon icon="lucide:sparkles" />
            </i>
            <div class="wdc-next__heading">
              <small>AI COPILOT</small>
              <h3>当前巡检处理</h3>
              <p>由工单助理继续处理当前巡检计划。</p>
            </div>
          </header>

          <!-- AI 建议卡 -->
          <div class="wdc-next__advice">
            <span class="wdc-next__badge">
              <Icon icon="lucide:lightbulb" />
              AI 建议
            </span>
            <p class="wdc-next__text">{{ nextAdviceText }}</p>
          </div>

          <!-- 数字员工：工单助理 -->
          <article class="wdc-emp">
            <div class="wdc-emp__head">
              <img
                class="wdc-emp__avatar"
                :src="ticketAssistantAvatar"
                alt="工单助理"
              />
              <div class="wdc-emp__meta">
                <b>工单助理</b>
                <small>巡检计划调整、执行跟进与结果填报</small>
              </div>
              <Icon class="wdc-emp__goto" icon="lucide:arrow-up-right" />
            </div>
            <div
              v-if="
                current.status === '草稿' ||
                current.status === '待启用' ||
                current.status === '执行中' ||
                current.status === '已暂停'
              "
              class="wdc-emp__actions"
            >
              <button
                v-if="['草稿', '待启用'].includes(current.status)"
                type="button"
                class="wdc-emp__action"
                :class="{ 'is-recommended': recommendedAction === 'enable' }"
                @click="goToAssistant('enable')"
              >
                <Icon icon="lucide:play" />
                <span>帮我启用计划</span>
              </button>
              <button
                v-if="current.status === '执行中'"
                type="button"
                class="wdc-emp__action"
                :class="{ 'is-recommended': recommendedAction === 'report' }"
                @click="goToAssistant('report')"
              >
                <Icon icon="lucide:clipboard-check" />
                <span>帮我填报巡检结果</span>
              </button>
              <button
                v-if="current.status === '执行中'"
                type="button"
                class="wdc-emp__action"
                @click="goToAssistant('pause')"
              >
                <Icon icon="lucide:pause" />
                <span>帮我暂停巡检</span>
              </button>
              <button
                v-if="current.status === '已暂停'"
                type="button"
                class="wdc-emp__action"
                :class="{ 'is-recommended': recommendedAction === 'resume' }"
                @click="goToAssistant('resume')"
              >
                <Icon icon="lucide:rotate-cw" />
                <span>帮我恢复执行</span>
              </button>
            </div>
            <p v-else class="wdc-next__dim">
              <Icon icon="lucide:check-circle-2" />
              当前计划状态暂无需数字员工执行的操作
            </p>
          </article>
        </section>
        <EmployeeRecommendations
          v-if="collaboration"
          :context="collaboration.context"
          :employees="collaboration.employees"
        />
      </aside>
    </div>

    <!-- 未找到计划 -->
    <section v-else class="wdc-missing">
      <Icon icon="lucide:search-x" />
      <p>未找到对应巡检计划，可能已被删除或链接有误。</p>
      <Button type="primary" @click="goBack">
        <Icon icon="lucide:arrow-left" />
        返回巡检计划列表
      </Button>
    </section>

    <!-- 编辑计划弹窗 -->

    <!-- 状态变更确认弹窗 -->
    <InspectionConfirmModal
      v-model:open="confirmOpen"
      :plan="current"
      :target="confirmTarget"
      :busy="changing"
      @confirm="confirmChange"
    />
  </section>
</template>

<style scoped>
@keyframes wdc-pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(44 138 93 / 42%);
  }

  70% {
    box-shadow: 0 0 0 6px rgb(44 138 93 / 0%);
  }

  100% {
    box-shadow: 0 0 0 0 rgb(44 138 93 / 0%);
  }
}

/* ============ 响应式 ============ */
@media (max-width: 1024px) {
  .wdc-layout {
    grid-template-columns: 1fr;
  }

  .wdc-topbar__row {
    flex-wrap: wrap;
  }

  .wdc-title {
    white-space: normal;
  }

  .wdc-info__row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wdc-info__more {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .wdc-exec__head {
    display: none;
  }

  .wdc-exec__body li {
    grid-template-columns: 1fr 1fr;
    gap: 6px 10px;
  }
}

.wdc-root {
  --ai: #0e8074;
  --ai-soft: #e8f5f1;
  --bg-soft: #f6faf8;
  --ink: #10231f;
  --jade: #0b6e65;
  --jade-deep: #073a33;
  --line: #e2eae6;
  --txt: #46554f;

  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  padding: 14px 18px;
  overflow: auto;
  color: var(--txt);
  background: #f7faf8;
}

/* ============ 布局：左详情卡 + 右下一步建议卡 ============ */
.wdc-layout {
  display: grid;
  grid-template-columns: minmax(0, 6fr) minmax(0, 4fr);
  gap: 14px;
  align-items: start;
}

.wdc-detail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding: 18px 20px 20px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 14px;
  box-shadow: 0 10px 30px rgb(7 71 60 / 6%);
}

/* ============ 顶部标题区 ============ */
.wdc-topbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wdc-topbar__row {
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  padding: 0 4px 12px;
  border-bottom: 1px solid var(--line);
}

.wdc-back {
  display: inline-flex;
  flex: none;
  gap: 5px;
  align-items: center;
  padding: 5px 12px 5px 8px;
  font-size: 12.5px;
  font-weight: 500;
  color: #5a6b64;
  cursor: pointer;
  background: none;
  border: 1px solid transparent;
  border-radius: 999px;
  transition: all 0.2s ease;
}

.wdc-back:hover {
  color: var(--jade);
  background: var(--ai-soft);
}

.wdc-back svg {
  width: 14px;
  height: 14px;
}

.wdc-titlebar {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 0 4px;
}

.wdc-title {
  flex: 0 1 auto;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
  white-space: nowrap;
}

.wdc-code {
  flex: none;
  font-size: 14px;
  font-weight: 800;
  color: var(--jade-deep);
  letter-spacing: 0.2px;
}

.wdc-nav {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
}

.wdc-nav button {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #4a5b54;
  cursor: pointer;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 7px;
  transition: all 0.15s;
}

.wdc-nav button:hover:not(:disabled) {
  color: var(--jade);
  border-color: var(--jade);
}

.wdc-nav button:disabled {
  color: #b3c1bb;
  cursor: not-allowed;
  background: #f7faf8;
}

.wdc-nav button svg {
  width: 13px;
  height: 13px;
}

.wdc-nav__pos {
  font-size: 12px;
  color: #7a8b84;
  white-space: nowrap;
}

/* ============ 主体布局（左右 6:4） ============ */
.wdc-main {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.wdc-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ============ 卡片 ============ */
.wdc-card {
  padding: 16px 18px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
}

.wdc-card__head {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.wdc-card__title {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}

.wdc-card__head .wdc-card__title {
  margin: 0;
}

.wdc-card__title::before {
  width: 3px;
  height: 14px;
  content: '';
  background: var(--jade);
  border-radius: 2px;
}

.wdc-card__extra {
  margin-left: auto;
  font-size: 12px;
  color: #84948d;
}

/* ============ 计划信息卡 ============ */
.wdc-info {
  position: relative;
  padding-bottom: 24px;
}

.wdc-info__head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.wdc-info__head .wdc-card__title {
  margin: 0;
}

.wdc-info__ops {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.wdc-op {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 4px 11px;
  font-size: 12px;
  font-weight: 600;
  color: #4a5b54;
  cursor: pointer;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 999px;
  transition: all 0.15s;
}

.wdc-op svg {
  width: 13px;
  height: 13px;
}

.wdc-op:hover {
  color: var(--jade);
  border-color: var(--jade);
}

.wdc-op.is-primary {
  color: #fff;
  background: linear-gradient(135deg, #0b6e65, #2c8a5d);
  border-color: transparent;
}

.wdc-op.is-danger {
  color: #b42318;
  border-color: #f3c6c2;
}

.wdc-op.is-danger:hover {
  color: #fff;
  background: #d92d20;
  border-color: #d92d20;
}

.wdc-info__row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px 18px;
}

.wdc-info__more {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px 18px;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px dashed var(--line);
}

.wdc-info__toggle {
  position: absolute;
  bottom: -12px;
  left: 50%;
  z-index: 1;
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  color: #4a5b54;
  cursor: pointer;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 999px;
  transform: translateX(-50%);
  transition:
    color 0.15s,
    border-color 0.15s;
}

.wdc-info__toggle:hover {
  color: var(--jade);
  border-color: var(--jade);
}

.wdc-info__toggle svg {
  width: 13px;
  height: 13px;
}

.wdc-meta__cell {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 88px;
}

.wdc-meta__cell--wide {
  min-width: 180px;
}

.wdc-meta__cell > label {
  font-size: 11px;
  color: #84948d;
}

.wdc-meta__cell small {
  font-size: 11px;
  color: #97a6a0;
}

.wdc-meta__strong {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.wdc-meta__dot {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.wdc-meta__dot i {
  flex: none;
  width: 7px;
  height: 7px;
  background: #98a8a1;
  border-radius: 50%;
}

/* 计划状态点颜色 */
.wdc-meta__dot.is-draft i {
  background: #98a8a1;
}

.wdc-meta__dot.is-ready i {
  background: #1668dc;
}

.wdc-meta__dot.is-running i {
  background: #0e8074;
}

.wdc-meta__dot.is-paused i {
  background: #d97706;
}

.wdc-meta__dot.is-done i {
  background: #16a34a;
}

.wdc-meta__dot.is-ended i {
  background: #98a8a1;
}

/* ============ 执行记录 ============ */
.wdc-exec {
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 10px;
}

.wdc-exec__head,
.wdc-exec__body li {
  display: grid;
  grid-template-columns: 1fr 0.6fr 1.2fr 1.1fr;
  gap: 10px;
  align-items: center;
  padding: 9px 14px;
}

.wdc-exec__head {
  font-size: 11px;
  font-weight: 700;
  color: #809588;
  background: #f7faf8;
  border-bottom: 1px solid var(--line);
}

.wdc-exec__body {
  padding: 0;
  margin: 0;
  list-style: none;
}

.wdc-exec__body li {
  border-bottom: 1px solid #eef3f0;
}

.wdc-exec__body li:last-child {
  border-bottom: 0;
}

.wdc-exec__date b {
  display: block;
  font-size: 12.5px;
  color: var(--ink);
}

.wdc-exec__date small {
  font-size: 11px;
  color: #84948d;
}

.wdc-exec :deep(.ant-tag) {
  margin: 0;
  font-size: 11px;
}

.wdc-exec__ticket {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--jade);
}

.wdc-exec__ticket svg {
  width: 13px;
  height: 13px;
}

.wdc-exec__ticket small {
  font-size: 11px;
  font-weight: 400;
  color: #97a6a0;
}

.wdc-exec__result b {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--ink);
}

.wdc-exec__result small {
  font-size: 11px;
  color: #84948d;
}

/* ============ 变更记录（折叠） ============ */
.wdc-flow {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 13px 18px;
}

.wdc-flow__toggle {
  display: inline-flex;
  flex: none;
  gap: 6px;
  align-items: center;
  padding: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--ink);
  cursor: pointer;
  background: none;
  border: none;
}

.wdc-flow__toggle svg {
  width: 14px;
  height: 14px;
  color: var(--jade);
}

.wdc-flow__latest {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  color: #7a8b84;
  white-space: nowrap;
}

.wdc-flow__latest b {
  color: var(--ink);
}

.wdc-flow__hint {
  flex: none;
  margin-left: auto;
  font-size: 11px;
  color: #97a6a0;
}

.wdc-timeline {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.wdc-timeline li {
  display: flex;
  gap: 12px;
}

.wdc-timeline li > i {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: var(--jade);
  background: var(--ai-soft);
  border-radius: 50%;
}

.wdc-timeline li > i svg {
  width: 14px;
  height: 14px;
}

.wdc-timeline li > div strong {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.wdc-timeline__tag {
  margin: 0;
  font-size: 10.5px;
}

.wdc-timeline li > div small {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #8a9a93;
}

/* ============ 下一步建议（AI 建议 + 数字员工） ============ */
.wdc-next__head {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-bottom: 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.wdc-next__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  color: #fff;
  background: linear-gradient(135deg, #0b6e65, #2c8a5d);
  border-radius: 12px;
  box-shadow: 0 4px 10px rgb(11 110 101 / 22%);
}

.wdc-next__icon svg {
  width: 22px;
  height: 22px;
}

.wdc-next__heading small {
  display: block;
  font-size: 10.5px;
  font-weight: 800;
  color: var(--jade);
  letter-spacing: 0.12em;
}

.wdc-next__heading h3 {
  margin: 2px 0 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--ink);
}

.wdc-next__heading p {
  margin: 3px 0 0;
  font-size: 12px;
  color: #8a9a93;
}

.wdc-next__advice {
  padding: 14px;
  margin-bottom: 12px;
  background: #eef7f3;
  border: 1px solid #cfe6dc;
  border-radius: 12px;
}

.wdc-next__badge {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  font-weight: 800;
  color: #0b6e65;
}

.wdc-next__badge svg {
  width: 13px;
  height: 13px;
}

.wdc-next__text {
  margin: 8px 0 0;
  font-size: 13.5px;
  font-weight: 700;
  line-height: 1.6;
  color: var(--ink);
}

.wdc-emp {
  padding: 12px;
  margin-bottom: 10px;
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 12px;
  transition:
    border-color 0.15s,
    box-shadow 0.15s;
}

.wdc-emp:last-of-type {
  margin-bottom: 0;
}

.wdc-emp:hover {
  border-color: #9dc6b9;
  box-shadow: 0 4px 12px rgb(11 110 101 / 8%);
}

.wdc-emp__head {
  position: relative;
  display: flex;
  gap: 10px;
  align-items: center;
}

.wdc-emp__avatar {
  flex: none;
  width: 40px;
  height: 40px;
  object-fit: cover;
  background: var(--bg-soft);
  border-radius: 50%;
}

.wdc-emp__meta b {
  display: block;
  font-size: 13.5px;
  line-height: 1.3;
  color: var(--ink);
}

.wdc-emp__meta small {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  line-height: 1.4;
  color: #8a9a93;
}

.wdc-emp__goto {
  position: absolute;
  top: 2px;
  right: 0;
  width: 15px;
  height: 15px;
  color: #9db3ab;
}

.wdc-emp__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.wdc-emp__action {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #0b6e65;
  cursor: pointer;
  background: #f2f9f5;
  border: 1px solid #d8ece4;
  border-radius: 999px;
  transition:
    background 0.15s,
    border-color 0.15s;
}

.wdc-emp__action > svg:first-child {
  flex: none;
  width: 13px;
  height: 13px;
}

.wdc-emp__action:hover {
  background: #e2f1ea;
  border-color: #bcdcd0;
}

.wdc-emp__action.is-recommended {
  color: #fff;
  background: linear-gradient(135deg, #0b6e65, #2c8a5d);
  border-color: transparent;
  animation: wdc-pulse 2.4s ease-out infinite;
}

.wdc-emp__action.is-recommended > svg:first-child {
  color: #fff;
}

.wdc-next__hint {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  margin: 12px 0 0;
  font-size: 11.5px;
  line-height: 1.5;
  color: #9aa9a2;
}

.wdc-next__hint svg {
  flex: none;
  width: 13px;
  height: 13px;
  margin-top: 1px;
}

.wdc-next__dim {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 10px 0 0;
  font-size: 12px;
  color: #8a9a93;
}

.wdc-next__dim svg {
  width: 14px;
  height: 14px;
  color: #16a34a;
}

/* ============ 未找到计划 ============ */
.wdc-missing {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #81958e;
}

.wdc-missing svg {
  width: 40px;
  height: 40px;
  opacity: 0.5;
}

.wdc-missing p {
  margin: 0;
  font-size: 13px;
}

/* ============ 设计令牌（同「工单详情」） ============ */
</style>
