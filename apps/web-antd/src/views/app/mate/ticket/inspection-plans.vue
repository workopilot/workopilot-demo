<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type { InspectionPlan, InspectionStatus } from '#/types/inspection';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  Dropdown,
  Empty,
  Input,
  Menu,
  message,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  copyInspectionPlanApi,
  getInspectionPlansApi,
  updateInspectionPlanApi,
} from '#/api/contract-inspection';
import { inspectionNextDate, inspectionOverdue } from '#/api/inspection-rules';
import AiWorkPage from '#/views/app/mate/ai-work/components/ai-work-page.vue';

import InspectionConfirmModal from './modals/inspection-confirm-modal.vue';

const route = useRoute();
const router = useRouter();

const employeeId = computed(() =>
  String(route.params.employeeId || 'ticket-assistant'),
);

const plans = ref<InspectionPlan[]>([]);
const loading = ref(false);
const busy = ref(false);

// 筛选：与「合同档案」一致，v-model 实时过滤
const keyword = ref('');
const customer = ref<string>();
const owner = ref<string>();
const status = ref<string>('all');
const overdueOnly = ref(false);

const statuses = [
  { value: 'all', label: '全部状态' },
  ...(
    ['草稿', '执行中', '已暂停', '已完成', '已终止'] as InspectionStatus[]
  ).map((value) => ({ label: value, value })),
];
const options = (values: string[]) =>
  values.map((value) => ({ label: value, value }));
const customers = computed(() =>
  options([...new Set(plans.value.map((p) => p.customer))]),
);
const owners = computed(() =>
  options([...new Set(plans.value.map((p) => p.owner))]),
);

/** 统计卡筛选：全部 / 执行中 / 草稿 / 逾期计划 */
const activeStat = computed(() => {
  if (overdueOnly.value) return 'overdue';
  if (status.value === '执行中') return 'executing';
  if (status.value === '草稿') return 'pending';
  return 'all';
});

function selectStat(kind: 'all' | 'executing' | 'overdue' | 'pending') {
  overdueOnly.value = kind === 'overdue';
  if (kind === 'executing') status.value = '执行中';
  else if (kind === 'pending') status.value = '草稿';
  else status.value = 'all';
}

const filtered = computed(() =>
  plans.value.filter((p) => {
    if (overdueOnly.value && !inspectionOverdue(p)) return false;
    if (status.value !== 'all' && p.status !== status.value) return false;
    if (customer.value && p.customer !== customer.value) return false;
    if (owner.value && p.owner !== owner.value) return false;
    if (
      keyword.value.trim() &&
      !`${p.id}${p.name}${p.contract}${p.project}`
        .toLowerCase()
        .includes(keyword.value.trim().toLowerCase())
    ) {
      return false;
    }
    return true;
  }),
);

const stats = computed(() => ({
  all: plans.value.length,
  executing: plans.value.filter((p) => p.status === '执行中').length,
  overdue: plans.value.filter((p) => inspectionOverdue(p) > 0).length,
  pending: plans.value.filter((p) => p.status === '草稿').length,
}));

const color = (value: InspectionStatus) =>
  ({
    已暂停: 'warning',
    已完成: 'success',
    已终止: 'default',
    执行中: 'processing',
    草稿: 'default',
    待启用: 'default',
  })[value];

const completed = (p: InspectionPlan) =>
  p.executions.filter((e) => e.status === '已完成').length;
const progress = (p: InspectionPlan) =>
  Math.round((completed(p) / (p.executions.length || 1)) * 100);
const next = inspectionNextDate;

/** 主状态流转动作（每个计划最多一个） */
function stateAction(
  plan: InspectionPlan,
): undefined | { label: string; target: InspectionStatus } {
  switch (plan.status) {
    case '已暂停': {
      return { label: '恢复', target: '执行中' };
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

/** 跳转巡检计划详情页 */
function goToDetail(plan: InspectionPlan) {
  void router.push({
    path: `/app/mate/employee/${employeeId.value}/inspection-plan-detail`,
    query: { id: plan.id },
  });
}

const columns = [
  { title: '计划名称', key: 'name', width: 250 },
  { title: '客户／项目', key: 'customer', width: 180 },
  { title: '频次／负责人', key: 'owner', width: 170 },
  { title: '下次执行', key: 'next', width: 135 },
  { title: '执行进度', key: 'progress', width: 150 },
  { title: '状态', key: 'status', width: 95 },
  { title: '操作', key: 'action', width: 150, fixed: 'right' as const },
];

function planRow(record: Record<string, unknown>): InspectionPlan {
  const item = plans.value.find((value) => value.id === record.id);
  if (!item) throw new Error('未找到巡检计划');
  return item;
}

async function load() {
  loading.value = true;
  try {
    const response = await getInspectionPlansApi();
    plans.value = response.data;
  } catch {
    message.error('加载失败，请重试');
  } finally {
    loading.value = false;
  }
}

function edit(plan: InspectionPlan) {
  void router.push({
    path: '/app/mate/employee/ticket-assistant/ticket-chat',
    query: {
      action: plan.status === '草稿' ? 'draft' : 'adjust',
      planId: plan.id,
    },
  });
}

/** 状态变更确认弹窗 */
const confirmOpen = ref(false);
const confirmPlan = ref<InspectionPlan>();
const confirmTarget = ref<InspectionStatus>('执行中');
const changing = ref(false);

function change(plan: InspectionPlan, target: InspectionStatus) {
  if (target === '执行中' && plan.status === '草稿') {
    void router.push({
      path: '/app/mate/employee/ticket-assistant/ticket-chat',
      query: { action: 'enable', planId: plan.id },
    });
    return;
  }
  confirmPlan.value = plan;
  confirmTarget.value = target;
  confirmOpen.value = true;
}

async function confirmChange() {
  const plan = confirmPlan.value;
  if (!plan || changing.value) return;
  changing.value = true;
  try {
    await updateInspectionPlanApi(plan.id, {
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

async function copy(plan: InspectionPlan) {
  if (busy.value) return;
  busy.value = true;
  try {
    const result = await copyInspectionPlanApi(plan.id);
    await load();
    edit(result.data);
    message.success('已复制为草稿，请核对配置');
  } catch {
    message.error('复制失败，请重试');
  } finally {
    busy.value = false;
  }
}

onMounted(load);
</script>

<template>
  <AiWorkPage
    title="巡检计划"
    icon="lucide:calendar-check"
    description="管理合同巡检安排，追踪每一次服务执行。"
  >
    <template #title-suffix>
      <b class="plan-count">{{ plans.length }}</b>
    </template>
    <template #actions>
      <Button :loading="loading" @click="load">
        <Icon icon="lucide:refresh-cw" />
        刷新
      </Button>
    </template>

    <div class="plan-page">
      <!-- 统计卡片：点击筛选列表 -->
      <div class="plan-stats">
        <button
          :class="{ selected: activeStat === 'all' }"
          @click="selectStat('all')"
        >
          <span class="stat-icon"><Icon icon="lucide:clipboard-list" /></span>
          <span>
            <small>全部计划</small>
            <strong>
              {{ stats.all }}
              <em>个</em>
            </strong>
          </span>
        </button>
        <button
          :class="{ selected: activeStat === 'executing' }"
          @click="selectStat('executing')"
        >
          <span class="stat-icon teal"><Icon icon="lucide:activity" /></span>
          <span>
            <small>执行中</small>
            <strong>
              {{ stats.executing }}
              <em>个</em>
            </strong>
          </span>
        </button>
        <button
          :class="{ selected: activeStat === 'pending' }"
          @click="selectStat('pending')"
        >
          <span class="stat-icon cyan">
            <Icon icon="lucide:calendar-clock" />
          </span>
          <span>
            <small>草稿</small>
            <strong>
              {{ stats.pending }}
              <em>个</em>
            </strong>
          </span>
        </button>
        <button
          :class="{ selected: activeStat === 'overdue' }"
          @click="selectStat('overdue')"
        >
          <span class="stat-icon amber">
            <Icon icon="lucide:triangle-alert" />
          </span>
          <span>
            <small>逾期计划</small>
            <strong>
              {{ stats.overdue }}
              <em>次</em>
            </strong>
          </span>
        </button>
      </div>

      <!-- 工作台 -->
      <section class="plan-workbench">
        <header class="plan-toolbar">
          <div><h2>计划记录</h2></div>
          <div class="plan-filters">
            <Input
              v-model:value="keyword"
              allow-clear
              placeholder="搜索计划名称、编号或合同"
            >
              <template #prefix><Icon icon="lucide:search" /></template>
            </Input>
            <Select
              v-model:value="customer"
              allow-clear
              placeholder="全部客户"
              :options="customers"
            />
            <Select
              v-model:value="owner"
              allow-clear
              placeholder="全部负责人"
              :options="owners"
            />
            <Select v-model:value="status" :options="statuses" />
          </div>
        </header>
        <Table
          :data-source="filtered"
          :columns="columns"
          :loading="loading"
          row-key="id"
          :scroll="{ x: 1130 }"
          :pagination="{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total: number) => `共 ${total} 个计划`,
          }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <button class="plan-name" @click="goToDetail(planRow(record))">
                <span class="file-symbol">
                  <Icon icon="lucide:calendar-clock" />
                </span>
                <span>
                  <strong :title="record.name">{{ record.name }}</strong>
                  <small>{{ record.id }} · {{ record.contract }}</small>
                </span>
              </button>
            </template>
            <template v-else-if="column.key === 'customer'">
              <span class="cell-main">{{ record.customer }}</span>
              <small class="cell-sub">项目：{{ record.project }}</small>
            </template>
            <template v-else-if="column.key === 'owner'">
              <span class="cell-main">{{ record.frequency }}</span>
              <small class="cell-sub">
                负责人：{{ record.owner }} · {{ record.team }}
              </small>
            </template>
            <template v-else-if="column.key === 'next'">
              <span class="cell-main">{{ next(planRow(record)) }}</span>
              <small
                class="cell-sub"
                :class="{ 'is-warn': record.status === '已暂停' }"
              >
                {{
                  record.status === '已暂停'
                    ? '排期已暂停'
                    : `提前 ${record.advanceDays} 天提醒`
                }}
              </small>
            </template>
            <template v-else-if="column.key === 'progress'">
              <span v-if="record.status !== '草稿'" class="plan-progress">
                <span class="plan-progress__bar">
                  <i :style="{ width: `${progress(planRow(record))}%` }"></i>
                </span>
                <small>
                  {{ completed(planRow(record)) }} /
                  {{ record.executions.length }} 次
                </small>
              </span>
              <small v-else class="cell-sub">启用后生成排期</small>
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="color(record.status)">{{ record.status }}</Tag>
              <div
                v-if="record.status === '草稿'"
                class="mt-1 text-xs text-amber-700"
              >
                待确认设备与执行安排
              </div>
            </template>
            <template v-else-if="column.key === 'action'">
              <div class="plan-actions" @click.stop>
                <a
                  class="detail-link"
                  @click.prevent="goToDetail(planRow(record))"
                >
                  查看详情
                  <Icon icon="lucide:arrow-up-right" />
                </a>
                <Dropdown :trigger="['click']" placement="bottomRight">
                  <Button type="text" size="small" title="更多操作">
                    <Icon icon="lucide:ellipsis" />
                  </Button>
                  <template #overlay>
                    <Menu>
                      <Menu.Item
                        v-if="stateAction(planRow(record))"
                        key="state"
                        @click="
                          change(
                            planRow(record),
                            stateAction(planRow(record))!.target,
                          )
                        "
                      >
                        {{ stateAction(planRow(record))!.label }}
                      </Menu.Item>
                      <Menu.Item
                        v-if="!['已完成', '已终止'].includes(record.status)"
                        key="edit"
                        @click="edit(planRow(record))"
                      >
                        编辑计划
                      </Menu.Item>
                      <Menu.Item
                        key="copy"
                        :disabled="busy"
                        @click="copy(planRow(record))"
                      >
                        复制为草稿
                      </Menu.Item>
                      <Menu.Item
                        v-if="
                          ['执行中', '已暂停', '草稿'].includes(record.status)
                        "
                        key="stop"
                        danger
                        @click="change(planRow(record), '已终止')"
                      >
                        终止计划
                      </Menu.Item>
                    </Menu>
                  </template>
                </Dropdown>
              </div>
            </template>
          </template>
          <template #emptyText>
            <Empty
              description="暂无匹配巡检计划，可更改筛选条件或点击统计卡切换范围"
            />
          </template>
        </Table>
        <footer class="plan-note">
          <Icon icon="lucide:info" />
          暂停或终止的计划不再生成新工单，已生成的巡检工单保留原安排。
        </footer>
      </section>
    </div>

    <InspectionConfirmModal
      v-model:open="confirmOpen"
      :plan="confirmPlan"
      :target="confirmTarget"
      :busy="changing"
      @confirm="confirmChange"
    />
  </AiWorkPage>
</template>

<style scoped>
/* ============ 响应式 ============ */
@media (max-width: 1000px) {
  .plan-stats > button > span:last-child {
    gap: 5px;
  }

  .plan-stats > button {
    gap: 7px;
    padding: 9px 10px;
  }

  .stat-icon {
    flex-shrink: 0;
    width: 25px;
    height: 25px;
    font-size: 15px;
  }

  .plan-stats small {
    font-size: 10px;
  }

  .plan-filters :deep(.ant-input-affix-wrapper) {
    width: 210px;
  }
}

@media (max-width: 680px) {
  .plan-page {
    padding: 12px;
  }

  .plan-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .plan-stats > button {
    padding: 12px;
  }

  .plan-toolbar {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .plan-filters {
    width: 100%;
  }

  .plan-filters :deep(.ant-input-affix-wrapper) {
    width: 100%;
  }
}

.plan-page {
  height: 100%;
  min-height: 0;
  padding: 14px 18px;
  overflow: auto;
  background: #f7faf8;
}

.plan-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 26px;
  height: 23px;
  padding: 0 7px;
  font-size: 12px;
  color: #437460;
  background: #e8f1ec;
  border-radius: 7px;
}

/* ============ 统计卡片 ============ */
.plan-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}

.plan-stats > button {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
  text-align: left;
  background: white;
  border: 1px solid #dfe9e3;
  border-radius: 13px;
}

.plan-stats > button.selected {
  background: #f1f8f3;
  border-color: #a6cab7;
}

.stat-icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 30px;
  height: 30px;
  font-size: 17px;
  color: #4f8d69;
  background: #ecf5ef;
  border-radius: 8px;
}

.stat-icon.teal {
  color: #2b8577;
  background: #e9f4f2;
}

.stat-icon.cyan {
  color: #4b8ba1;
  background: #e9f3f7;
}

.stat-icon.amber {
  color: #b59150;
  background: #fcf4e6;
}

.plan-stats > button > span:last-child {
  display: flex;
  flex: 1;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.plan-stats small {
  display: block;
  font-size: 11px;
  color: #83958a;
}

.plan-stats strong {
  display: block;
  margin-top: 0;
  font-size: 22px;
  font-weight: 650;
  line-height: 28px;
  color: #2f513b;
}

.plan-stats em {
  margin-left: 7px;
  font-size: 11px;
  font-style: normal;
  font-weight: 400;
  color: #9aaba0;
}

/* ============ 工作台 ============ */
.plan-workbench {
  overflow: hidden;
  background: white;
  border: 1px solid #dfe9e3;
  border-radius: 14px;
}

.plan-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
}

.plan-toolbar h2 {
  font-size: 14px;
  font-weight: 650;
  color: #31543e;
  white-space: nowrap;
}

.plan-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.plan-filters :deep(.ant-input-affix-wrapper) {
  display: inline-flex;
  align-items: center;
  width: 240px;
  height: 32px;
  padding: 4px 11px;
  margin: 0;
}

.plan-filters :deep(.ant-input-affix-wrapper > input.ant-input) {
  height: auto;
  min-height: 0;
  padding: 0;
  line-height: 22px;
}

.plan-filters :deep(.ant-input-prefix),
.plan-filters :deep(.ant-input-suffix) {
  display: inline-flex;
  align-items: center;
}

.plan-filters :deep(.ant-select-single) {
  height: 32px;
}

.plan-filters :deep(.ant-select-single .ant-select-selector) {
  display: flex;
  align-items: center;
  height: 32px;
  padding-inline-end: 28px;
}

.plan-filters :deep(.ant-select-single .ant-select-selection-item),
.plan-filters :deep(.ant-select-single .ant-select-selection-placeholder) {
  line-height: 30px;
}

.plan-filters :deep(.ant-select-arrow) {
  position: absolute;
  inset-inline-end: 11px;
  top: 50%;
  display: inline-flex;
  align-items: center;
  height: 12px;
  margin-top: -6px;
}

.plan-filters :deep(.ant-select) {
  min-width: 135px;
}

/* ============ 表格单元格 ============ */
.plan-name {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  max-width: 218px;
  text-align: left;
}

.file-symbol {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 34px;
  height: 38px;
  font-size: 20px;
  color: #5a9370;
  background: #eef6f1;
  border-radius: 8px;
}

.plan-name > span:last-child {
  min-width: 0;
}

.plan-name strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 550;
  color: #345b43;
  white-space: nowrap;
}

.plan-name small {
  display: block;
  margin-top: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10px;
  color: #95a79a;
  white-space: nowrap;
}

.cell-main {
  font-size: 12px;
  color: #56715e;
}

.cell-sub {
  display: block;
  margin-top: 5px;
  font-size: 10px;
  color: #9aa89e;
}

.cell-sub.is-warn {
  color: #b7791f;
}

.plan-progress {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.plan-progress__bar {
  display: block;
  width: 100%;
  max-width: 110px;
  height: 6px;
  overflow: hidden;
  background: #e6f0ea;
  border-radius: 999px;
}

.plan-progress__bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #176e5b, #2b9a7f);
  border-radius: inherit;
  transition: width 0.3s;
}

.plan-progress small {
  font-size: 10px;
  color: #9aa89e;
}

.plan-actions {
  display: flex;
  gap: 2px;
  align-items: center;
}

.detail-link {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  color: #36785d;
  white-space: nowrap;
}

.detail-link:hover {
  color: #145d43;
}

.detail-link svg {
  font-size: 15px;
}

.plan-actions :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  color: #6d827b;
}

.plan-actions :deep(.ant-btn svg) {
  width: 15px;
  height: 15px;
}

.plan-note {
  display: flex;
  gap: 7px;
  align-items: center;
  padding: 13px 20px;
  font-size: 10px;
  line-height: 20px;
  color: #97a59b;
  background: #fbfdfb;
  border-top: 1px solid #eef2ee;
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

:deep(.ant-table-thead > tr > th) {
  font-size: 11px;
  font-weight: 550;
  color: #809588;
  background: #f7faf8;
}

:deep(.ant-table-pagination) {
  padding: 0 16px;
}

/* ============ 页面骨架（与「合同档案」一致） ============ */
</style>
