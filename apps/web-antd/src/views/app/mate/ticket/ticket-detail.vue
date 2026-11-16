<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type { DispatchDashboard } from '#/api/mock-data-ticket';

import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Modal, Select, Tag } from 'ant-design-vue';

import {
  engineers,
  mockDispatchDashboard,
  ticketPriorityLabel,
} from '#/api/mock-data-ticket';
import { dispatchWorkOrderApi, transferWorkOrderApi } from '#/api/ticket';

type DetailRow = DispatchDashboard['detailList'][number] & {
  checkInRecords?: Array<{
    id: string;
    location: string;
    note?: string;
    person: string;
    time: string;
  }>;
  onSiteDecisionAt?: string;
  onSiteDecisionBy?: string;
  onSiteRequired?: boolean;
  solution?: string;
};

const route = useRoute();
const router = useRouter();

const employeeId = computed(() =>
  String(route.params.employeeId || 'dispatch-assistant'),
);

const rawList = (mockDispatchDashboard as DispatchDashboard).detailList;

// ---------- 筛选条件 ----------
const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '待派单', value: 'pending', display: '待派单' },
  { label: '待接单', value: 'dispatched', display: '待接单' },
  { label: '处理中', value: 'processing', display: '处理中' },
  { label: '待验收', value: 'pending-acceptance', display: '待验收' },
  { label: '已完工', value: 'completed', display: '已完工' },
  { label: '已关闭', value: 'closed', display: '已关闭' },
];

/** URL query status key → 列表中状态文案映射 */
const statusKeyToLabel: Record<string, string> = {
  pending: '待派单',
  dispatched: '待接单',
  processing: '处理中',
  'pending-acceptance': '待验收',
  completed: '已完工',
  closed: '已关闭',
  breached: '已超时',
};

const priorityOptions = [
  { label: '全部优先级', value: '' },
  { label: '紧急', value: 'urgent' },
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
];

const typeOptions = computed(() => {
  const types = [...new Set(rawList.map((i) => i.type))];
  return [
    { label: '全部类型', value: '' },
    ...types.map((t) => ({ label: t, value: t })),
  ];
});

const regionOptions = computed(() => {
  const regions = [...new Set(rawList.map((i) => i.region))];
  return [
    { label: '全部区域', value: '' },
    ...regions.map((r) => ({ label: r, value: r })),
  ];
});

const filterStatus = ref<string>('');
const filterPriority = ref<string>('');
const filterType = ref<string>('');
const filterRegion = ref<string>('');
const filterKeyword = ref<string>('');

// 从 URL query 初始化
function applyQuery() {
  const s = String(route.query.status || '');
  // 支持 breached 映射为处理中（仅用于展示超时筛选）
  if (s === 'breached') {
    filterStatus.value = 'processing';
  } else if (s && statusKeyToLabel[s]) {
    filterStatus.value = s;
  } else {
    filterStatus.value = '';
  }
  filterPriority.value = String(route.query.priority || '');
  filterType.value = String(route.query.type || '');
  filterRegion.value = String(route.query.region || '');
  filterKeyword.value = String(route.query.keyword || '');
}

onMounted(applyQuery);
watch(
  () => [
    route.query.status,
    route.query.priority,
    route.query.type,
    route.query.region,
    route.query.keyword,
  ],
  applyQuery,
);

// ---------- 筛选列表 ----------
const filteredList = computed(() => {
  const kw = filterKeyword.value.trim().toLowerCase();
  return rawList.filter((item) => {
    // 状态过滤
    if (filterStatus.value) {
      const label = statusKeyToLabel[filterStatus.value];
      if (label && item.status !== label) return false;
    }
    // breached → 处理中且 SLA 异常
    if (
      String(route.query.status || '') === 'breached' &&
      !['已超时', '超时风险'].includes(item.sla)
    )
      return false;
    if (filterPriority.value && item.priority !== filterPriority.value)
      return false;
    if (filterType.value && item.type !== filterType.value) return false;
    if (filterRegion.value && item.region !== filterRegion.value) return false;
    if (kw) {
      const hay = [item.code, item.customer, item.type, item.assignee]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
});

const totalCount = computed(() => filteredList.value.length);

function resetFilters() {
  filterStatus.value = '';
  filterPriority.value = '';
  filterType.value = '';
  filterRegion.value = '';
  filterKeyword.value = '';
  router.replace({ path: route.path });
}

function goBackDashboard() {
  router.push(`/app/mate/employee/${employeeId.value}/ticket-center`);
}

// ---------- 状态/优先级颜色 ----------
function statusTagColor(status: string): string {
  switch (status) {
    case '处理中': {
      return 'processing';
    }
    case '已关闭': {
      return 'default';
    }
    case '已完工': {
      return 'green';
    }
    case '待接单': {
      return 'blue';
    }
    case '待派单': {
      return 'orange';
    }
    case '待验收': {
      return 'purple';
    }
    default: {
      return 'default';
    }
  }
}

function priorityTagColor(priority?: string): string {
  switch (priority) {
    case 'high': {
      return 'orange';
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

function slaTagColor(sla: string): string {
  if (['已超时', '超时风险'].includes(sla)) return 'red';
  if (sla.includes('剩余1h') || sla.includes('剩余2h')) return 'orange';
  return 'green';
}

// ---------- 工程师选择 Modal（派单 / 转派共用） ----------
const engineerModalOpen = ref(false);
const engineerModalMode = ref<'dispatch' | 'transfer'>('dispatch');
const engineerModalOrderId = ref('');
const engineerModalOrderCode = ref('');
const engineerModalCurrentAssigneeId = ref<string>('');
const engineerModalSelectedId = ref('');
const engineerModalKeyword = ref('');
const engineerModalNote = ref('');

const engineerPendingMap = computed<Record<string, number>>(() => {
  const counts: Record<string, number> = {};
  for (const order of rawList) {
    const match = engineers.find((e) => e.name === order.assignee);
    if (!match) continue;
    if (order.status === '待接单' || order.status === '处理中') {
      counts[match.id] = (counts[match.id] || 0) + 1;
    }
  }
  return counts;
});

function engineerPendingCount(id: string) {
  return engineerPendingMap.value[id] || 0;
}

const engineerModalList = computed(() => {
  const kw = engineerModalKeyword.value.trim().toLowerCase();
  return engineers
    .filter((e) =>
      engineerModalMode.value === 'transfer' &&
      engineerModalCurrentAssigneeId.value
        ? e.id !== engineerModalCurrentAssigneeId.value
        : true,
    )
    .filter(
      (e) =>
        !kw ||
        e.name.toLowerCase().includes(kw) ||
        e.area.toLowerCase().includes(kw) ||
        e.team.toLowerCase().includes(kw) ||
        e.role.toLowerCase().includes(kw),
    );
});

function openEngineerModal(mode: 'dispatch' | 'transfer', code: string) {
  const order = rawList.find((o) => o.code === code);
  if (!order) return;
  engineerModalMode.value = mode;
  engineerModalOrderId.value = order.id;
  engineerModalOrderCode.value = code;
  const match = engineers.find((e) => e.name === order.assignee);
  engineerModalCurrentAssigneeId.value = match?.id || '';
  engineerModalSelectedId.value = '';
  engineerModalKeyword.value = '';
  engineerModalNote.value = '';
  engineerModalOpen.value = true;
}

async function confirmEngineerModal() {
  if (!engineerModalSelectedId.value) {
    message.warning('请选择一名工程师');
    return;
  }
  const target = engineers.find((e) => e.id === engineerModalSelectedId.value);
  if (!target) return;
  if (engineerModalMode.value === 'dispatch') {
    await dispatchWorkOrderApi(
      engineerModalOrderId.value,
      target.id,
      target.name,
    );
    message.success(
      `已将 ${engineerModalOrderCode.value} 派单给 ${target.name}（${target.role}）`,
    );
  } else {
    await transferWorkOrderApi(
      engineerModalOrderId.value,
      target.id,
      target.name,
      engineerModalNote.value || '调度手动转派',
    );
    message.success(
      `已将 ${engineerModalOrderCode.value} 转派给 ${target.name}（${target.role}）`,
    );
  }
  engineerModalOpen.value = false;
}

// ---------- 工单详情 Modal（左信息 + 右 AI 派工建议） ----------
const detailModalOpen = ref(false);
const detailRow = ref<DetailRow | null>(null);

function openDetailModal(code: string) {
  const row = rawList.find((o) => o.code === code);
  if (!row) return;
  detailRow.value = row;
  detailModalOpen.value = true;
}

function engPendingOf(eid: string) {
  return engineerPendingMap.value[eid] || 0;
}

function scoreColor(score: number) {
  if (score >= 85) return '#2c8a5d';
  if (score >= 70) return '#0b6e65';
  if (score >= 60) return '#c9a43a';
  return '#d4541f';
}

function candidateTagColor(tag?: '备选' | '推荐' | '替补') {
  switch (tag) {
    case '备选': {
      return 'blue';
    }
    case '推荐': {
      return 'green';
    }
    default: {
      return 'default';
    }
  }
}

function dispatchFromDetail(eid: string) {
  if (!detailRow.value) return;
  const target = engineers.find((e) => e.id === eid);
  if (!target) return;
  openEngineerModal(
    detailRow.value.status === '待派单' ? 'dispatch' : 'transfer',
    detailRow.value.code,
  );
  engineerModalSelectedId.value = eid;
  detailModalOpen.value = false;
}
</script>

<template>
  <section class="td-layout">
    <!-- 头部 -->
    <header class="td-header">
      <div class="td-header__left">
        <button type="button" class="td-back" @click="goBackDashboard">
          <Icon icon="lucide:arrow-left" />
          返回调度中心
        </button>
        <div class="td-header__title">
          <h1>工单明细</h1>
          <p>按状态、类型、优先级、关键词筛选工单，支持派单 / 转派操作</p>
        </div>
      </div>
      <div class="td-header__right">
        <Tag color="green">共 {{ totalCount }} 条</Tag>
      </div>
    </header>

    <!-- 筛选区 -->
    <section class="td-filters">
      <div class="td-filters__row">
        <div class="td-filter">
          <label>状态</label>
          <Select
            v-model:value="filterStatus"
            :options="statusOptions"
            placeholder="全部状态"
            allow-clear
            style="width: 160px"
          />
        </div>
        <div class="td-filter">
          <label>类型</label>
          <Select
            v-model:value="filterType"
            :options="typeOptions"
            placeholder="全部类型"
            allow-clear
            style="width: 160px"
          />
        </div>
        <div class="td-filter">
          <label>优先级</label>
          <Select
            v-model:value="filterPriority"
            :options="priorityOptions"
            placeholder="全部优先级"
            allow-clear
            style="width: 160px"
          />
        </div>
        <div class="td-filter">
          <label>区域</label>
          <Select
            v-model:value="filterRegion"
            :options="regionOptions"
            placeholder="全部区域"
            allow-clear
            style="width: 140px"
          />
        </div>
        <div class="td-filter td-filter--grow">
          <label>关键词</label>
          <Input
            v-model:value="filterKeyword"
            placeholder="工单号 / 客户 / 工程师 / 类型"
            allow-clear
          >
            <template #prefix>
              <Icon icon="lucide:search" />
            </template>
          </Input>
        </div>
        <div class="td-filter td-filter--actions">
          <Button @click="resetFilters">
            <Icon icon="lucide:rotate-ccw" />
            重置
          </Button>
        </div>
      </div>
    </section>

    <!-- 表格 -->
    <section class="td-table-wrap">
      <div class="td-table">
        <div class="td-table__head">
          <span>工单号</span>
          <span>客户</span>
          <span>类型</span>
          <span>区域</span>
          <span>优先级</span>
          <span>状态</span>
          <span>SLA</span>
          <span>负责人</span>
          <span>操作</span>
        </div>
        <template v-if="filteredList.length > 0">
          <div
            v-for="order in filteredList"
            :key="order.id"
            class="td-table__row"
          >
            <span class="td-table__code">
              <a class="link-code" @click.prevent="openDetailModal(order.code)">
                {{ order.code }}
              </a>
            </span>
            <span class="td-table__customer">{{ order.customer }}</span>
            <span>{{ order.type }}</span>
            <span>{{ order.region }}</span>
            <span>
              <Tag :color="priorityTagColor(order.priority)">
                {{
                  order.priority
                    ? ticketPriorityLabel[
                        order.priority as keyof typeof ticketPriorityLabel
                      ]
                    : '-'
                }}
              </Tag>
            </span>
            <span>
              <Tag :color="statusTagColor(order.status)">
                {{ order.status }}
              </Tag>
            </span>
            <span>
              <Tag :color="slaTagColor(order.sla)">{{ order.sla }}</Tag>
            </span>
            <span>{{ order.assignee }}</span>
            <span class="td-table__action">
              <button
                type="button"
                class="action-btn"
                @click="openDetailModal(order.code)"
                style="margin-right: 6px"
              >
                <Icon icon="lucide:file-text" />
                详情
              </button>
              <button
                v-if="order.status === '待派单'"
                type="button"
                class="action-btn is-primary"
                @click="openEngineerModal('dispatch', order.code)"
              >
                <Icon icon="lucide:send" />
                派单
              </button>
              <button
                v-else-if="
                  order.status === '待接单' || order.status === '处理中'
                "
                type="button"
                class="action-btn"
                @click="openEngineerModal('transfer', order.code)"
              >
                <Icon icon="lucide:repeat" />
                转派
              </button>
              <span v-else class="action-hint">-</span>
            </span>
          </div>
        </template>
        <div v-else class="td-empty">
          <Icon icon="lucide:inbox" />
          <p>暂无符合条件的工单，试试调整筛选条件</p>
        </div>
      </div>
    </section>

    <!-- 工程师选择 Modal -->
    <Modal
      v-model:open="engineerModalOpen"
      :title="
        engineerModalMode === 'dispatch' ? '选择派单工程师' : '选择转派工程师'
      "
      width="720"
      :footer="null"
    >
      <div v-if="engineerModalOrderCode" class="eng-modal__summary">
        <strong>工单 · {{ engineerModalOrderCode }}</strong>
        <div class="eng-modal__tags">
          <span>
            模式：{{ engineerModalMode === 'dispatch' ? '派单' : '转派' }}
          </span>
        </div>
      </div>

      <Input
        v-model:value="engineerModalKeyword"
        placeholder="搜索姓名 / 区域 / 角色 / 团队"
        allow-clear
        style="margin-bottom: 16px"
      >
        <template #prefix>
          <Icon icon="lucide:search" />
        </template>
      </Input>

      <div v-if="engineerModalList.length > 0" class="eng-list">
        <div class="eng-list__head">
          <span class="eng-list__col-name">工程师</span>
          <span class="eng-list__col-role">角色</span>
          <span class="eng-list__col-area">区域</span>
          <span class="eng-list__col-team">团队</span>
          <span class="eng-list__col-load">待处理</span>
          <span class="eng-list__col-check"></span>
        </div>
        <ul class="eng-list__body">
          <li
            v-for="e in engineerModalList"
            :key="e.id"
            class="eng-list__row"
            :class="{ 'is-selected': engineerModalSelectedId === e.id }"
            @click="engineerModalSelectedId = e.id"
          >
            <span class="eng-list__col-name">
              <i class="eng-list__avatar">{{ e.name.slice(0, 1) }}</i>
              <strong>{{ e.name }}</strong>
            </span>
            <span class="eng-list__col-role">{{ e.role }}</span>
            <span class="eng-list__col-area">
              <Icon icon="lucide:map-pin" />
              {{ e.area }}
            </span>
            <span class="eng-list__col-team">
              <Icon icon="lucide:users" />
              {{ e.team }}
            </span>
            <span class="eng-list__col-load">
              <Tag
                :color="
                  engineerPendingCount(e.id) >= 4
                    ? 'orange'
                    : engineerPendingCount(e.id) >= 2
                      ? 'blue'
                      : 'green'
                "
              >
                {{ engineerPendingCount(e.id) }}
              </Tag>
            </span>
            <span class="eng-list__col-check">
              <Icon
                v-if="engineerModalSelectedId === e.id"
                icon="lucide:check-circle-2"
              />
            </span>
          </li>
        </ul>
      </div>
      <p v-else class="eng-list__empty">
        <Icon icon="lucide:search-x" />
        未找到匹配的工程师
      </p>

      <div class="eng-modal__note">
        <label>说明（非必填）</label>
        <Input.TextArea
          v-model:value="engineerModalNote"
          :rows="2"
          placeholder="例如：客户 VIP、需携带备件、优先现场等"
        />
      </div>

      <div class="eng-modal__footer">
        <Button @click="engineerModalOpen = false">取消</Button>
        <Button
          type="primary"
          :disabled="!engineerModalSelectedId"
          @click="confirmEngineerModal"
        >
          <Icon icon="lucide:check" />
          确认{{ engineerModalMode === 'dispatch' ? '派单' : '转派' }}
        </Button>
      </div>
    </Modal>

    <!-- 工单详情 Modal（左工单信息 + 右 AI 派工建议） -->
    <Modal
      v-model:open="detailModalOpen"
      :footer="null"
      :closable="true"
      width="960"
      :title="detailRow ? `工单详情 · ${detailRow.code}` : '工单详情'"
      wrap-class-name="td-detail-modal"
    >
      <template v-if="detailRow" #closeIcon>
        <Icon icon="lucide:x" />
      </template>
      <div v-if="detailRow" class="td-detail">
        <!-- 左侧：工单信息 -->
        <aside class="td-detail__left">
          <header class="td-detail__title">
            <div>
              <Tag :color="statusTagColor(detailRow.status)">
                {{ detailRow.status }}
              </Tag>
              <Tag :color="priorityTagColor(detailRow.priority)">
                {{
                  detailRow.priority
                    ? ticketPriorityLabel[
                        detailRow.priority as keyof typeof ticketPriorityLabel
                      ]
                    : '-'
                }}
              </Tag>
              <Tag :color="slaTagColor(detailRow.sla)">{{ detailRow.sla }}</Tag>
            </div>
            <b class="td-detail__code">{{ detailRow.code }}</b>
          </header>
          <h3 class="td-detail__h3">{{ detailRow.title || '工单详情' }}</h3>
          <p class="td-detail__desc">{{ detailRow.description }}</p>

          <ul class="td-detail__info">
            <li>
              <label>客户</label>
              <span>{{ detailRow.customer }}</span>
            </li>
            <li>
              <label>工单类型</label>
              <span>{{ detailRow.type }}</span>
            </li>
            <li>
              <label>负责区域</label>
              <span>{{ detailRow.region }}</span>
            </li>
            <li>
              <label>负责工程师</label>
              <span>{{ detailRow.assignee }}</span>
            </li>
            <li>
              <label>关联设备</label>
              <span>{{ detailRow.device || '-' }}</span>
            </li>
            <li>
              <label>报修编号</label>
              <span>{{ detailRow.reportNo || '-' }}</span>
            </li>
            <li>
              <label>创建时间</label>
              <span>{{ detailRow.createdAt || '-' }}</span>
            </li>
            <li>
              <label>服务地址</label>
              <span>{{ detailRow.address || '-' }}</span>
            </li>
          </ul>

          <section class="td-detail__contact">
            <header>
              <Icon icon="lucide:user-round" />
              <strong>联系人信息</strong>
            </header>
            <div>
              <span>{{ detailRow.contact?.name || '-' }}</span>
              <Tag color="teal" style="margin-left: 10px">
                <Icon
                  icon="lucide:phone"
                  style="width: 12px; height: 12px; margin-right: 4px"
                />
                {{ detailRow.contact?.phone || '-' }}
              </Tag>
            </div>
          </section>

          <section
            v-if="detailRow.attachments && detailRow.attachments.length > 0"
            class="td-detail__attach"
          >
            <header>
              <Icon icon="lucide:paperclip" />
              <strong>附件</strong>
            </header>
            <ul>
              <li v-for="(a, idx) in detailRow.attachments" :key="idx">
                <Icon icon="lucide:file" />
                <span class="attach-name">{{ a.name }}</span>
                <small>{{ a.size }}</small>
              </li>
            </ul>
          </section>

          <!-- 现场决策 -->
          <section
            v-if="detailRow.onSiteRequired !== undefined"
            class="mb-3.5 rounded-lg border border-[#e1ece7] bg-[#fafdfb] p-3"
          >
            <header
              class="mb-2 inline-flex items-center gap-1.5 text-[12px] text-[#0c2f28]"
            >
              <Icon icon="lucide:map-pin" class="size-3.5 text-[#0b6e65]" />
              <strong>现场决策</strong>
            </header>
            <div class="flex flex-col gap-1 text-[13px] text-[#1c3e35]">
              <p>需要前往现场：{{ detailRow.onSiteRequired ? '是' : '否' }}</p>
              <p v-if="detailRow.onSiteDecisionBy">
                决策人：{{ detailRow.onSiteDecisionBy }}
              </p>
              <p v-if="detailRow.onSiteDecisionAt">
                决策时间：{{ detailRow.onSiteDecisionAt }}
              </p>
            </div>
          </section>

          <!-- 现场打卡记录 -->
          <section
            v-if="
              detailRow.checkInRecords && detailRow.checkInRecords.length > 0
            "
            class="mb-3.5 rounded-lg border border-[#e1ece7] bg-[#fafdfb] p-3"
          >
            <header
              class="mb-2 inline-flex items-center gap-1.5 text-[12px] text-[#0c2f28]"
            >
              <Icon
                icon="lucide:map-pin-check"
                class="size-3.5 text-[#0b6e65]"
              />
              <strong>现场打卡记录</strong>
            </header>
            <div class="flex flex-col gap-2 text-[13px] text-[#1c3e35]">
              <div
                v-for="record in detailRow.checkInRecords"
                :key="record.id"
                class="flex flex-col gap-1 border-t border-[#e1ece7] pt-2 first:border-t-0 first:pt-0"
              >
                <p>{{ record.person }} · {{ record.time }}</p>
                <p>{{ record.location }}</p>
                <p v-if="record.note">{{ record.note }}</p>
              </div>
            </div>
          </section>

          <!-- 闭环要求 -->
          <section
            class="mb-3.5 rounded-lg border border-[#e1ece7] bg-[#fafdfb] p-3"
          >
            <header
              class="mb-2 inline-flex items-center gap-1.5 text-[12px] text-[#0c2f28]"
            >
              <Icon
                icon="lucide:check-square"
                class="size-3.5 text-[#0b6e65]"
              />
              <strong>闭环要求</strong>
            </header>
            <ul class="flex flex-col gap-1 pl-5 text-[13px] text-[#1c3e35]">
              <li>解决方案（必填）</li>
              <li>视频或截图凭证</li>
              <li v-if="detailRow.onSiteRequired">现场打卡水印照片</li>
            </ul>
          </section>
        </aside>

        <!-- 右侧：AI 派工建议 -->
        <section class="td-detail__right">
          <div v-if="detailRow.aiSuggest" class="ai-suggest">
            <header class="ai-suggest__head">
              <div class="ai-suggest__badge">
                <Icon icon="lucide:sparkles" />
                AI 派工建议
              </div>
              <span
                v-if="detailRow.status === '处理中'"
                class="ai-suggest__mode"
              >
                转派建议
              </span>
              <span v-else class="ai-suggest__mode">派单建议</span>
            </header>
            <p class="ai-suggest__summary">{{ detailRow.aiSuggest.summary }}</p>

            <!-- 推荐工程师候选 -->
            <div class="ai-suggest__candidates">
              <h4>
                <Icon icon="lucide:user-check" />
                推荐工程师
              </h4>
              <article
                v-for="c in detailRow.aiSuggest.candidates"
                :key="c.engineerId"
                class="candidate"
              >
                <div class="candidate__top">
                  <div class="candidate__meta">
                    <i class="candidate__avatar">
                      {{
                        engineers
                          .find((e) => e.id === c.engineerId)
                          ?.name?.slice(0, 1) || '?'
                      }}
                    </i>
                    <div>
                      <strong>
                        {{ engineers.find((e) => e.id === c.engineerId)?.name }}
                      </strong>
                      <span class="candidate__role">
                        {{ engineers.find((e) => e.id === c.engineerId)?.role }}
                      </span>
                    </div>
                  </div>
                  <div
                    class="candidate__score"
                    :style="{ color: scoreColor(c.score) }"
                  >
                    {{ c.score }}
                    <small>分</small>
                  </div>
                  <Tag
                    :color="candidateTagColor(c.tag)"
                    style="margin-left: 8px"
                  >
                    {{ c.tag }}
                  </Tag>
                </div>
                <div class="candidate__info">
                  <span>
                    <Icon icon="lucide:map-pin" />
                    {{ engineers.find((e) => e.id === c.engineerId)?.area }}
                  </span>
                  <span>
                    <Icon icon="lucide:users" />
                    {{ engineers.find((e) => e.id === c.engineerId)?.team }}
                  </span>
                  <span>
                    <Tag
                      :color="
                        engPendingOf(c.engineerId) >= 4
                          ? 'orange'
                          : engPendingOf(c.engineerId) >= 2
                            ? 'blue'
                            : 'green'
                      "
                    >
                      待处理 {{ engPendingOf(c.engineerId) }}
                    </Tag>
                  </span>
                </div>
                <ul class="candidate__reason">
                  <li v-for="(r, i) in c.reason" :key="i">
                    <Icon icon="lucide:check" />
                    {{ r }}
                  </li>
                </ul>
                <button
                  v-if="
                    detailRow.status === '待派单' ||
                    detailRow.status === '待接单' ||
                    detailRow.status === '处理中'
                  "
                  type="button"
                  class="candidate__action"
                  @click="dispatchFromDetail(c.engineerId)"
                >
                  <Icon icon="lucide:send" />
                  {{
                    detailRow.status === '待派单'
                      ? '选择该工程师派单'
                      : '转派给该工程师'
                  }}
                </button>
              </article>
            </div>

            <!-- 风险提示 -->
            <div
              v-if="detailRow.aiSuggest.risks.length > 0"
              class="ai-suggest__risks"
            >
              <h4>
                <Icon icon="lucide:triangle-alert" />
                风险提示
              </h4>
              <ul>
                <li v-for="(r, i) in detailRow.aiSuggest.risks" :key="i">
                  <Icon icon="lucide:alert-circle" />
                  {{ r }}
                </li>
              </ul>
            </div>

            <!-- 任务要点 -->
            <div class="ai-suggest__task">
              <h4>
                <Icon icon="lucide:clipboard-list" />
                任务要点
              </h4>
              <div class="task-grid">
                <div
                  v-if="detailRow.aiSuggest.taskNotes.estimateHours"
                  class="task-cell"
                >
                  <label>预计工时</label>
                  <span>
                    <Icon icon="lucide:clock" />
                    {{ detailRow.aiSuggest.taskNotes.estimateHours }}
                  </span>
                </div>
                <div
                  v-if="detailRow.aiSuggest.taskNotes.carryParts?.length"
                  class="task-cell"
                >
                  <label>携带备件</label>
                  <ul>
                    <li
                      v-for="(p, i) in detailRow.aiSuggest.taskNotes.carryParts"
                      :key="i"
                    >
                      <Icon icon="lucide:wrench" />
                      {{ p }}
                    </li>
                  </ul>
                </div>
                <div
                  v-if="detailRow.aiSuggest.taskNotes.attention?.length"
                  class="task-cell task-cell--wide"
                >
                  <label>现场注意事项</label>
                  <ol>
                    <li
                      v-for="(a, i) in detailRow.aiSuggest.taskNotes.attention"
                      :key="i"
                    >
                      {{ i + 1 }}. {{ a }}
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <!-- 已完工/已关闭，无建议 -->
          <div v-else class="ai-suggest is-dim">
            <header class="ai-suggest__head">
              <div class="ai-suggest__badge">
                <Icon icon="lucide:sparkles" />
                AI 派工建议
              </div>
              <span class="ai-suggest__mode">{{ detailRow.status }}</span>
            </header>
            <p class="ai-suggest__summary">
              当前工单状态为「{{
                detailRow.status
              }}」，无需派工建议，可查看历史记录。
            </p>
            <ul class="ai-suggest__candidates">
              <li class="td-empty" style="padding: 30px 0">
                <Icon icon="lucide:check-circle-2" />
                <p>该工单已完成流程闭环</p>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </Modal>
  </section>
</template>

<style scoped>
@media (max-width: 920px) {
  .td-detail {
    grid-template-columns: 1fr;
    max-height: 82vh;
  }

  .td-detail__left {
    max-height: 40vh;
    border-right: none;
    border-bottom: 1px solid #e1ece7;
  }

  .td-detail__right {
    max-height: 42vh;
  }

  .task-grid {
    grid-template-columns: 1fr;
  }

  .task-cell--wide {
    grid-column: span 1;
  }
}

@media (max-width: 1180px) {
  .td-table__head {
    display: none;
  }

  .td-table__row {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px 10px;
  }

  .td-table__action {
    grid-column: span 2;
    justify-content: flex-start;
  }

  .eng-list__head {
    display: none;
  }

  .eng-list__head,
  .eng-list__row {
    grid-template-columns: 1.6fr 1fr 0.6fr 32px;
    gap: 6px 8px;
    padding: 9px 12px;
  }

  .eng-list__col-team,
  .eng-list__col-area {
    display: none;
  }
}

.td-layout {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  height: 100%;
  padding: 20px;
  overflow: auto;
  background: #f0f5f2;
}

/* 头部 */
.td-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  color: #fff;
  background: linear-gradient(125deg, #073a33 0%, #0b6e65 66%, #178f7b 100%);
  border-radius: 14px;
  box-shadow: 0 12px 30px rgb(7 71 60 / 16%);
}

.td-header__left {
  display: flex;
  gap: 16px;
  align-items: center;
}

.td-back {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #0b6e65;
  cursor: pointer;
  background: rgb(255 255 255 / 90%);
  border: 1px solid transparent;
  border-radius: 999px;
}

.td-back svg {
  width: 13px;
  height: 13px;
}

.td-header__title h1 {
  margin: 0 0 2px;
  font-size: 22px;
  font-weight: 800;
}

.td-header__title p {
  margin: 0;
  font-size: 12px;
  color: rgb(255 255 255 / 72%);
}

.td-header__right {
  display: flex;
  align-items: center;
}

/* 筛选区 */
.td-filters {
  padding: 14px 18px;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 12px;
}

.td-filters__row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.td-filter {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.td-filter label {
  font-size: 11px;
  font-weight: 600;
  color: #5a756d;
}

.td-filter--grow {
  flex: 1 1 260px;
  min-width: 220px;
}

.td-filter--actions {
  margin-left: auto;
}

/* 表格 */
.td-table-wrap {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 12px;
}

.td-table {
  width: 100%;
}

.td-table__head,
.td-table__row {
  display: grid;
  grid-template-columns: 1.2fr 1.4fr 0.8fr 0.6fr 0.8fr 0.8fr 0.8fr 0.9fr 1fr;
  gap: 10px;
  align-items: center;
  padding: 10px 16px;
}

.td-table__head {
  font-size: 12px;
  font-weight: 700;
  color: #5a756d;
  background: #f4f8f6;
  border-bottom: 1px solid #e1ece7;
}

.td-table__row {
  font-size: 12px;
  color: #355b51;
  border-bottom: 1px solid #f0f5f2;
  transition: background 0.1s;
}

.td-table__row:last-child {
  border-bottom: 0;
}

.td-table__row:hover {
  background: #f6fbf9;
}

.td-table__code {
  font-weight: 700;
  color: #0c4a3f;
}

.link-code {
  font-weight: 700;
  color: #0b6e65;
  text-decoration: none;
  cursor: pointer;
  border-bottom: 1px dashed transparent;
  transition: all 0.15s;
}

.link-code:hover {
  color: #2c8a5d;
  border-bottom-color: #2c8a5d;
}

.td-table__customer {
  color: #1c3e35;
}

.td-table__action {
  display: flex;
  justify-content: flex-end;
}

.action-btn {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #0b6e65;
  cursor: pointer;
  background: #e3f1ec;
  border: 1px solid #b7d9cf;
  border-radius: 6px;
}

.action-btn svg {
  width: 13px;
  height: 13px;
}

.action-btn.is-primary {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
}

.action-hint {
  font-size: 12px;
  color: #a4b8b1;
}

.td-empty {
  padding: 60px 0;
  color: #81958e;
  text-align: center;
}

.td-empty svg {
  width: 40px;
  height: 40px;
  opacity: 0.5;
}

.td-empty p {
  margin: 8px 0 0;
  font-size: 13px;
}

/* 工程师选择 Modal */
.eng-modal__summary {
  padding: 12px 14px;
  margin-bottom: 16px;
  background: #f7faf9;
  border: 1px solid #e1ece7;
  border-radius: 8px;
}

.eng-modal__summary strong {
  display: block;
  font-size: 14px;
  color: #1c3e35;
}

.eng-modal__tags {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 6px;
  font-size: 12px;
  color: #6c8780;
}

.eng-list {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 10px;
}

.eng-list__head,
.eng-list__row {
  display: grid;
  grid-template-columns: minmax(120px, 1.4fr) 1fr 1fr 1fr 0.6fr 32px;
  gap: 8px;
  align-items: center;
  padding: 10px 14px;
}

.eng-list__head {
  font-size: 11px;
  font-weight: 700;
  color: #5a756d;
  letter-spacing: 0.02em;
  background: #f4f8f6;
  border-bottom: 1px solid #e1ece7;
}

.eng-list__body {
  max-height: 360px;
  padding: 0;
  margin: 0;
  overflow-y: auto;
  list-style: none;
}

.eng-list__row {
  position: relative;
  cursor: pointer;
  border-bottom: 1px solid #f0f5f2;
  transition: background 0.15s;
}

.eng-list__row:last-child {
  border-bottom: 0;
}

.eng-list__row:hover {
  background: #f6fbf9;
}

.eng-list__row.is-selected {
  background: #eef6f2;
  box-shadow: inset 3px 0 0 #0b6e65;
}

.eng-list__col-name {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.eng-list__avatar {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 12px;
  font-style: normal;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #0b6e65, #2c8a5d);
  border-radius: 50%;
}

.eng-list__col-name strong {
  font-size: 13px;
  color: #1c3e35;
}

.eng-list__col-role {
  font-size: 12px;
  color: #4a6b62;
}

.eng-list__col-area,
.eng-list__col-team {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 11px;
  color: #6c8780;
}

.eng-list__col-area svg,
.eng-list__col-team svg {
  width: 12px;
  height: 12px;
  opacity: 0.7;
}

.eng-list__col-load :deep(.ant-tag) {
  min-width: 30px;
  margin: 0;
  font-size: 11px;
  text-align: center;
}

.eng-list__col-check {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  color: #0b6e65;
}

.eng-list__col-check svg {
  width: 18px;
  height: 18px;
}

.eng-list__empty {
  padding: 40px 0;
  font-size: 13px;
  color: #81958e;
  text-align: center;
}

.eng-list__empty svg {
  width: 28px;
  height: 28px;
  margin-right: 6px;
  vertical-align: middle;
  opacity: 0.5;
}

.eng-modal__note {
  margin-top: 16px;
}

.eng-modal__note label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1c3e35;
}

.eng-modal__footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 14px;
  margin-top: 18px;
  border-top: 1px solid #e1ece7;
}

/* ---------- 工单详情 Modal ---------- */
.td-detail {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 0;
  min-height: 520px;
  max-height: 72vh;
  overflow: hidden;
  background: #f8fbf9;
  border-radius: 10px;
}

/* 左侧：工单信息 */
.td-detail__left {
  padding: 18px 18px 20px;
  overflow-y: auto;
  background: #fff;
  border-right: 1px solid #e1ece7;
}

.td-detail__title {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.td-detail__title :deep(.ant-tag) {
  margin-right: 6px;
  font-size: 11px;
}

.td-detail__code {
  font-size: 14px;
  color: #0c4a3f;
  letter-spacing: 0.2px;
}

.td-detail__h3 {
  margin: 10px 0 6px;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
  color: #0c2f28;
}

.td-detail__desc {
  padding: 10px 12px;
  margin: 0 0 16px;
  font-size: 12.5px;
  line-height: 1.7;
  color: #4a6b62;
  background: #f4f8f6;
  border-left: 3px solid #b7d9cf;
  border-radius: 8px;
}

.td-detail__info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 12px;
  padding: 0;
  margin: 0 0 16px;
  list-style: none;
}

.td-detail__info li {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.td-detail__info label {
  font-size: 10.5px;
  font-weight: 700;
  color: #708982;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.td-detail__info span {
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.4;
  color: #1c3e35;
}

.td-detail__contact,
.td-detail__attach {
  padding: 12px;
  margin-bottom: 14px;
  background: #fafdfb;
  border: 1px solid #e1ece7;
  border-radius: 8px;
}

.td-detail__contact > header,
.td-detail__attach > header {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #0c2f28;
}

.td-detail__contact > header svg,
.td-detail__attach > header svg {
  width: 14px;
  height: 14px;
  color: #0b6e65;
}

.td-detail__contact > div {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: #1c3e35;
}

.td-detail__attach ul {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.td-detail__attach li {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  font-size: 12px;
  color: #1c3e35;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 6px;
}

.td-detail__attach li svg {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  color: #0b6e65;
}

.attach-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.td-detail__attach small {
  flex-shrink: 0;
  font-weight: 600;
  color: #81958e;
}

/* 右侧：AI 派工建议 */
.td-detail__right {
  padding: 18px 20px 20px;
  overflow-y: auto;
}

.ai-suggest {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ai-suggest.is-dim {
  opacity: 0.8;
}

.ai-suggest__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-suggest__badge {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  color: #0b6e65;
  background: linear-gradient(135deg, #e8f6f1, #f0f9f5);
  border: 1px solid #b7d9cf;
  border-radius: 20px;
}

.ai-suggest__badge svg {
  width: 14px;
  height: 14px;
  color: #2c8a5d;
}

.ai-suggest__mode {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #5a756d;
  background: #fff;
  border: 1px solid #dde8e3;
  border-radius: 20px;
}

.ai-suggest__summary {
  padding: 12px 14px;
  margin: 0;
  font-size: 13px;
  line-height: 1.65;
  color: #f4fbf8;
  background: linear-gradient(135deg, #0b6e65 0%, #2c8a5d 100%);
  border-radius: 10px;
  box-shadow: 0 2px 10px rgb(11 110 101 / 12%);
}

.ai-suggest__candidates,
.ai-suggest__risks,
.ai-suggest__task {
  padding: 14px;
  margin: 0;
  list-style: none;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 10px;
}

.ai-suggest__candidates {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-suggest__candidates h4,
.ai-suggest__risks h4,
.ai-suggest__task h4 {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding-bottom: 8px;
  margin: 0 0 12px;
  font-size: 13px;
  font-weight: 700;
  color: #0c2f28;
  border-bottom: 1px dashed #dde8e3;
}

.ai-suggest__candidates h4 svg,
.ai-suggest__risks h4 svg,
.ai-suggest__task h4 svg {
  width: 15px;
  height: 15px;
  color: #0b6e65;
}

.candidate {
  padding: 12px;
  background: linear-gradient(to bottom, #fcfefd, #f8fbf9);
  border: 1px solid #e1ece7;
  border-radius: 10px;
  transition: all 0.15s;
}

.candidate:hover {
  border-color: #9dc6b9;
  box-shadow: 0 2px 10px rgb(11 110 101 / 6%);
  transform: translateY(-1px);
}

.candidate__top {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 8px;
}

.candidate__meta {
  display: flex;
  flex: 1;
  gap: 10px;
  align-items: center;
}

.candidate__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 15px;
  font-style: normal;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #0b6e65, #2c8a5d);
  border-radius: 50%;
  box-shadow: 0 2px 6px rgb(11 110 101 / 20%);
}

.candidate__meta strong {
  display: block;
  font-size: 13.5px;
  line-height: 1.3;
  color: #0c2f28;
}

.candidate__role {
  font-size: 11px;
  font-weight: 600;
  color: #5a756d;
}

.candidate__score {
  padding-right: 2px;
  font-size: 20px;
  font-weight: 800;
  line-height: 1;
}

.candidate__score small {
  margin-left: 2px;
  font-size: 11px;
  font-weight: 600;
  opacity: 0.7;
}

.candidate__info {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  margin-bottom: 8px;
  font-size: 11.5px;
  color: #6c8780;
}

.candidate__info > span {
  display: inline-flex;
  gap: 4px;
  align-items: center;
}

.candidate__info svg {
  width: 12px;
  height: 12px;
  opacity: 0.7;
}

.candidate__info :deep(.ant-tag) {
  margin: 0;
  font-size: 10.5px;
  font-weight: 600;
}

.candidate__reason {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
  margin: 0 0 10px;
  list-style: none;
}

.candidate__reason li {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  font-size: 12px;
  line-height: 1.55;
  color: #4a6b62;
}

.candidate__reason li svg {
  flex-shrink: 0;
  width: 13px;
  height: 13px;
  margin-top: 2px;
  color: #2c8a5d;
}

.candidate__action {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 8px 14px;
  font-size: 12.5px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(135deg, #0b6e65, #2c8a5d);
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgb(11 110 101 / 15%);
  transition: all 0.15s;
}

.candidate__action:hover {
  box-shadow: 0 4px 12px rgb(11 110 101 / 22%);
  transform: translateY(-1px);
}

.candidate__action svg {
  width: 14px;
  height: 14px;
}

/* 风险提示 */
.ai-suggest__risks ul {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.ai-suggest__risks li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.5;
  color: #6b4006;
  background: #fff7ed;
  border-left: 3px solid #f59e0b;
  border-radius: 0 6px 6px 0;
}

.ai-suggest__risks li svg {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  margin-top: 1px;
  color: #d97706;
}

/* 任务要点 */
.task-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.task-cell {
  padding: 10px 12px;
  background: #fafdfb;
  border: 1px solid #e1ece7;
  border-radius: 8px;
}

.task-cell--wide {
  grid-column: span 2;
}

.task-cell label {
  display: block;
  margin-bottom: 6px;
  font-size: 10.5px;
  font-weight: 800;
  color: #708982;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.task-cell span {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  font-weight: 700;
  color: #0c2f28;
}

.task-cell span svg {
  width: 14px;
  height: 14px;
  color: #0b6e65;
}

.task-cell ul,
.task-cell ol {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.task-cell ul li {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: #355b51;
}

.task-cell ul li svg {
  width: 12px;
  height: 12px;
  color: #0b6e65;
}

.task-cell ol li {
  padding-left: 2px;
  font-size: 12px;
  line-height: 1.55;
  color: #355b51;
}
</style>
