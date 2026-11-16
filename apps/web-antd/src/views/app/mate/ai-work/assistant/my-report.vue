<!-- 我的周报：3层景深 + 微容器 (Card in Card) + 左侧时间树未读评语红点 (点击即消失) -->
<script setup lang="ts">
import type { EntityPick } from '../components/entity-context-drawer.vue';

import type { AiWorkEntities, AiWorkWorkItem } from '#/types/ai-work';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Avatar,
  Button,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Progress,
  Rate,
} from 'ant-design-vue';

import { aiWorkReportItems } from '#/api/mock-data-ai-work';
import { useAiWorkDemoStore } from '#/store/ai-work-demo';

import EntityContextDrawer from '../components/entity-context-drawer.vue';
import EntityTags from '../components/entity-tags.vue';
import MaterialList from '../components/material-list.vue';
import WorkItemDetailDrawer from '../components/work-item-detail-drawer.vue';

const store = useAiWorkDemoStore();
const entityOpen = ref(false);
const pickedEntity = ref<EntityPick | null>(null);

// 卡片内直接内联编辑控制
const editingItemId = ref<null | string>(null);
const inlineEditingText = ref('');

function startInlineEdit(item: any) {
  editingItemId.value = item.id;
  inlineEditingText.value = item.content;
}

function cancelInlineEdit() {
  editingItemId.value = null;
  inlineEditingText.value = '';
}

function saveInlineEdit(item: any) {
  if (!inlineEditingText.value.trim()) {
    message.warning('描述内容不能为空');
    return;
  }
  item.content = inlineEditingText.value.trim();
  editingItemId.value = null;
  message.success('已在卡片内部直接保存修改后的成果描述');
}

// 复用【我的工作】侧滑抽屉 (WorkItemDetailDrawer)
const detailDrawerOpen = ref(false);
const currentDetailItem = ref<AiWorkWorkItem | null>(null);

function openItemDetail(item: any) {
  currentDetailItem.value = item;
  detailDrawerOpen.value = true;
}

// 新增下周计划 Modal 状态与日期快捷块选项
const isAddingNextPlan = ref(false);
const newPlanText = ref('');

interface QuickDateOption {
  key: string;
  label: string;
  fullDateStr: string;
}

const quickDateOptions: QuickDateOption[] = [
  { key: 'mon', label: '周一 (8/17)', fullDateStr: '8月17日 (周一)' },
  { key: 'tue', label: '周二 (8/18)', fullDateStr: '8月18日 (周二)' },
  { key: 'wed', label: '周三 (8/19)', fullDateStr: '8月19日 (周三)' },
  { key: 'thu', label: '周四 (8/20)', fullDateStr: '8月20日 (周四)' },
  { key: 'fri', label: '周五 (8/21)', fullDateStr: '8月21日 (周五)' },
  { key: 'custom', label: '其他', fullDateStr: '' },
];

const selectedDateKey = ref('fri');
const customDateValue = ref<any>(null);

function handleAddNextPlan() {
  const text = newPlanText.value.trim();
  if (!text) {
    message.warning('请输入计划内容要点');
    return;
  }

  let finalDueDate = '8月21日 (周五)';
  if (selectedDateKey.value === 'custom') {
    if (customDateValue.value) {
      finalDueDate = customDateValue.value.format
        ? customDateValue.value.format('M月D日')
        : String(customDateValue.value);
    } else {
      finalDueDate = '自定义日期';
    }
  } else {
    const found = quickDateOptions.find((o) => o.key === selectedDateKey.value);
    if (found) finalDueDate = found.fullDateStr;
  }

  const nextNum = nextWeekPlans.value.length + 1;
  nextWeekPlans.value.push({
    id: `next-${Date.now()}`,
    code: nextNum < 10 ? `0${nextNum}` : `${nextNum}`,
    content: text,
    dueDate: finalDueDate,
    entity: '新增任务',
  });

  newPlanText.value = '';
  selectedDateKey.value = 'fri';
  customDateValue.value = null;
  isAddingNextPlan.value = false;
  message.success('已成功新增下周工作计划');
}

// 左侧折叠时间树 Mock 数据 (包含未读评语红点标记)
interface WeekNode {
  id: string;
  year: number;
  month: number;
  weekNum: number;
  weekLabel: string;
  dateRange: string;
  status: 'APPROVED' | 'DRAFT' | 'SUBMITTED';
  statusLabel: string;
  score?: number;
  hasUnreadComment?: boolean;
}

interface MonthGroup {
  label: string; // "2026 年 8 月"
  collapsed: boolean;
  weeks: WeekNode[];
}

const timeTreeData = ref<MonthGroup[]>([
  {
    label: '2026 年 8 月',
    collapsed: false,
    weeks: [
      {
        id: '2026-w33',
        year: 2026,
        month: 8,
        weekNum: 33,
        weekLabel: '2026-W33 周报',
        dateRange: '2026-08-10 -- 2026-08-17',
        status: 'DRAFT',
        statusLabel: '草稿',
      },
      {
        id: '2026-w32',
        year: 2026,
        month: 8,
        weekNum: 32,
        weekLabel: '2026-W32 周报',
        dateRange: '2026-08-03 -- 2026-08-09',
        status: 'APPROVED',
        statusLabel: '已评语',
        score: 95,
        hasUnreadComment: true, // 初始代表有主管评语红点
      },
    ],
  },
  {
    label: '2026 年 7 月',
    collapsed: true,
    weeks: [
      {
        id: '2026-w31',
        year: 2026,
        month: 7,
        weekNum: 31,
        weekLabel: '2026-W31 周报',
        dateRange: '2026-07-27 -- 2026-08-02',
        status: 'APPROVED',
        statusLabel: '已评语',
        score: 98,
        hasUnreadComment: true, // 初始带有红点
      },
      {
        id: '2026-w30',
        year: 2026,
        month: 7,
        weekNum: 30,
        weekLabel: '2026-W30 周报',
        dateRange: '2026-07-20 -- 2026-07-26',
        status: 'APPROVED',
        statusLabel: '已评语',
        score: 92,
      },
    ],
  },
]);

// 当前选中的周报
const activeWeekId = ref('2026-w33');
const activeWeekNode = computed(
  () =>
    timeTreeData.value
      .flatMap((m) => m.weeks)
      .find((w) => w.id === activeWeekId.value) ||
    timeTreeData.value[0]!.weeks[0]!,
);

function selectWeekNode(week: WeekNode) {
  activeWeekId.value = week.id;
  if (week.hasUnreadComment) {
    week.hasUnreadComment = false; // 点击后红点消除
    message.info(`已查阅 ${week.weekLabel} 的最新评语与反馈`);
  }
}

function toggleMonthCollapse(group: MonthGroup) {
  group.collapsed = !group.collapsed;
}

// 动态本周工作列表
const localWorkItems = ref<AiWorkWorkItem[]>([...aiWorkReportItems]);

const visibleItems = computed(() =>
  localWorkItems.value.filter(
    (item) => item.id !== 'report-huada' || store.state.missingWorkAdded,
  ),
);

// 上周计划追踪
const lastWeekPlan = computed(() => [
  {
    id: 'plan-quote',
    description: '完成报价模块接口开发与单元测试',
    status: 'done' as const,
    note: '已按期完成核心接口开发与全链路自测',
  },
  {
    id: 'plan-huada',
    description: '华达现场打印流程对接与需求确认',
    status: 'done' as const,
    note: '已与客户完成验收口径确认，现场问题已排查完毕',
  },
  {
    id: 'plan-customer-b',
    description: '完成客户 B 接口联调及环境部署',
    status: 'delayed' as const,
    note: store.state.delayExplained
      ? `客户测试环境未准备完成，预计延期至 ${store.state.delayDueDate || '下周三'}`
      : '客户测试环境未准备完成，本周未完成（待补充说明）',
  },
]);

const planStats = computed(() => {
  const done = lastWeekPlan.value.filter((p) => p.status === 'done').length;
  return { done, total: lastWeekPlan.value.length };
});

// 下周工作计划
const nextWeekPlans = ref([
  {
    id: 'next-1',
    code: '01',
    content: '推进报价平台 V2 联调与集成测试',
    dueDate: '8月19日 (周三)',
    entity: '报价平台 V2',
  },
  {
    id: 'next-2',
    code: '02',
    content: '完成客户 B 接口上线与验收演示',
    dueDate: '8月20日 (周四)',
    entity: '客户 B 集成',
  },
  {
    id: 'next-3',
    code: '03',
    content: '长鑫5期打印接口文档编写与交接',
    dueDate: '8月21日 (周五)',
    entity: '长鑫5期打印',
  },
]);

// 点赞与评论状态
const liked = ref(false);
const likeCount = ref(3);

function toggleLike() {
  liked.value = !liked.value;
  likeCount.value += liked.value ? 1 : -1;
  message.success(liked.value ? '感谢您的点赞！' : '已取消点赞');
}

// 嵌套评论与回复数据结构
interface CommentReply {
  id: string;
  author: string;
  role: string;
  replyTo: string;
  time: string;
  content: string;
}

interface MainComment {
  id: string;
  author: string;
  role: string;
  time: string;
  content: string;
  score?: number;
  replies: CommentReply[];
}

const commentsList = ref<MainComment[]>([
  {
    id: 'c1',
    author: '李经理 (技术主管)',
    role: '主管',
    time: '2026-08-10 10:15',
    content:
      '本周工作高效，华达现场响应迅速，报价平台按计划推进。客户 B 接口延期原因清晰，请下周三前重点攻坚突破！',
    score: 5,
    replies: [
      {
        id: 'r1',
        author: '张三 (我)',
        role: '作者',
        replyTo: '李经理',
        time: '2026-08-10 10:30',
        content:
          '收到李经理！下周三联调环境准备就绪后，我会第一时间安排全链路验证。',
      },
    ],
  },
]);

const activeReplyTarget = ref<MainComment | null>(null);
const newCommentText = ref('');

function replyToComment(comment: MainComment) {
  activeReplyTarget.value = comment;
}

function cancelReply() {
  activeReplyTarget.value = null;
}

function submitComment() {
  const text = newCommentText.value.trim();
  if (!text) return;

  if (activeReplyTarget.value) {
    if (!activeReplyTarget.value.replies) {
      activeReplyTarget.value.replies = [];
    }
    const targetName = activeReplyTarget.value.author.split(' ')[0] || '主管';
    activeReplyTarget.value.replies.push({
      id: `r-${Date.now()}`,
      author: '张三 (我)',
      role: '作者',
      replyTo: targetName,
      time: '刚刚',
      content: text,
    });
    message.success(`已成功回复 ${targetName}`);
    activeReplyTarget.value = null;
  } else {
    commentsList.value.push({
      id: `c-${Date.now()}`,
      author: '张三 (我)',
      role: '作者',
      time: '刚刚',
      content: text,
      replies: [],
    });
    message.success('评论已发表');
  }
  newCommentText.value = '';
}

// AI 完整度检查项
const completenessChecks = computed(() => [
  {
    id: 'missing-huada',
    icon: 'lucide:alert-triangle',
    level: 'warning' as const,
    label: '华达现场打印问题（8/5）未纳入周报',
    action: '一键加入',
    done: store.state.missingWorkAdded,
    onAction: () => {
      store.addMissingWork();
      message.success('华达现场问题已加入周报，完整度提升');
    },
  },
  {
    id: 'commitment-b',
    icon: 'lucide:flag',
    level: 'alert' as const,
    label: '上周承诺"客户 B 接口联调"进展未说明',
    action: '说明进展',
    done: store.state.delayExplained,
    onAction: () => explainDelay(),
  },
  {
    id: 'plan-time',
    icon: 'lucide:clock',
    level: 'info' as const,
    label: '下周计划缺少明确交付日期',
    action: '一键完善',
    done: store.state.delayExplained,
    onAction: () => {
      message.success('已自动建议并补充下周交付节点时间');
    },
  },
]);

const pendingChecks = computed(
  () => completenessChecks.value.filter((c) => !c.done).length,
);

function explainDelay() {
  Modal.confirm({
    title: '补充"客户 B 接口联调"的延期说明',
    content:
      'AI 检测到这是上周承诺事项，本周尚未完成。请说明当前进展与预计完成时间。',
    okText: '预计下周三完成',
    cancelText: '取消',
    onOk: () => {
      store.explainDelay('下周三');
      message.success('延期说明已记录，完整度提升');
    },
  });
}

function onEntityPick(payload: { name: string; type: keyof AiWorkEntities }) {
  pickedEntity.value = payload;
  entityOpen.value = true;
}

function aiPolishReport() {
  message.loading({ content: 'AI 正在分析并润色周报表达...', key: 'polish' });
  setTimeout(() => {
    message.success({
      content: '周报内容已由 AI 完成语法精炼与重点高亮优化！',
      key: 'polish',
    });
  }, 1000);
}

function submitReport() {
  if (pendingChecks.value > 0) {
    Modal.confirm({
      title: `还有 ${pendingChecks.value} 项建议未完善`,
      content: '完善后可获得更高的工作质量评分。是否仍然提交当前周报？',
      okText: '仍然提交',
      cancelText: '继续完善',
      onOk: () => doSubmit(),
    });
    return;
  }
  doSubmit();
}

function doSubmit() {
  store.submitReport();
  activeWeekNode.value.status = 'SUBMITTED';
  activeWeekNode.value.statusLabel = '待审阅';
  message.success(`第 ${activeWeekNode.value.weekNum} 周周报已成功提交至主管`);
}
</script>

<template>
  <!-- 1. 底层 (Background)：全局统一 #F4F5F7 极浅灰底 -->
  <div
    class="my-report-wrapper h-full max-h-[calc(100vh-65px)] overflow-y-auto bg-[#F4F5F7] p-4 text-[#111827]"
  >
    <div class="my-report-grid">
      <!-- 2. 中层：左侧时间过滤栏 (纯白底色，选中项带 #F0FDF4 微淡绿底与 3px 指示条，含评语红点) -->
      <aside
        class="time-tree-sidebar sticky top-0 max-h-[calc(100vh-100px)] self-start overflow-y-auto rounded-xl border border-[#E5E7EB] bg-white p-3.5"
      >
        <div
          class="sidebar-header flex items-center justify-between border-b border-[#F1F5F9] pb-3"
        >
          <span class="text-xs font-bold text-[#0F172A]">时间过滤</span>
          <span class="text-[10px] text-[#94A3B8]">按月折叠</span>
        </div>

        <div class="time-tree-body mt-2.5 space-y-2.5 overflow-y-auto">
          <div
            v-for="group in timeTreeData"
            :key="group.label"
            class="month-group-item"
          >
            <!-- 可点击折叠的月份标题 -->
            <button
              type="button"
              class="month-header-btn flex w-full items-center justify-between rounded px-1.5 py-1 transition-colors hover:bg-[#F8FAFC]"
              @click="toggleMonthCollapse(group)"
            >
              <div
                class="flex items-center gap-1.5 text-xs font-semibold text-[#475569]"
              >
                <Icon
                  :icon="
                    group.collapsed ? 'lucide:folder' : 'lucide:folder-open'
                  "
                  class="size-3.5 text-[#64748B]"
                />
                <span>{{ group.label }}</span>
              </div>
              <Icon
                :icon="
                  group.collapsed
                    ? 'lucide:chevron-right'
                    : 'lucide:chevron-down'
                "
                class="size-3 text-[#94A3B8]"
              />
            </button>

            <!-- 周报列表节点 (选中态: #F0FDF4 淡绿底 + 左侧 3px 指示条；有评语未读时带红点) -->
            <div
              v-show="!group.collapsed"
              class="weeks-list ml-2 mt-1 space-y-1 border-l border-[#E2E8F0] pl-2"
            >
              <button
                v-for="week in group.weeks"
                :key="week.id"
                type="button"
                class="week-node-card flex w-full items-center justify-between rounded-r-lg p-2 text-left transition-all"
                :class="
                  activeWeekId === week.id
                    ? 'border-l-3 shadow-2xs border-l-[#059669] bg-[#F0FDF4] pl-2.5 font-bold text-[#064E3B]'
                    : 'pl-2 text-[#475569] hover:bg-[#F8FAFC]'
                "
                @click="selectWeekNode(week)"
              >
                <div class="flex min-w-0 flex-col">
                  <div class="flex items-center gap-1.5">
                    <span class="truncate text-xs">{{ week.weekLabel }}</span>
                    <!-- 未读评语/评论红点提示 (点击后自动消除) -->
                    <span
                      v-if="week.hasUnreadComment"
                      class="inline-block size-2 flex-none animate-pulse rounded-full bg-[#EF4444]"
                      title="有主管未读评语/反馈"
                    ></span>
                  </div>
                  <span
                    class="text-[10px]"
                    :class="
                      activeWeekId === week.id
                        ? 'text-[#047857]'
                        : 'text-[#94A3B8]'
                    "
                  >
                    {{
                      week.dateRange
                        ? week.dateRange.split(' -- ')[0]
                        : week.weekLabel
                    }}
                  </span>
                </div>

                <div class="flex-none">
                  <span
                    v-if="week.score"
                    class="rounded bg-[#DCFCE7] px-1 py-0.5 text-[10px] font-medium text-[#059669]"
                  >
                    {{ week.score }}分
                  </span>
                  <span
                    v-else
                    class="rounded bg-[#F1F5F9] px-1 py-0.5 text-[10px] text-[#64748B]"
                  >
                    {{ week.statusLabel }}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- 3. 顶层 (Core Canvas)：置顶抬起的大白卡片 (16px 圆角 + 0 4px 20px rgba(0,0,0,0.06) 浮空阴影) -->
      <main
        class="report-paper-card flex flex-col gap-8 rounded-2xl border border-[#E2E8F0]/80 bg-white p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
      >
        <!-- 大卡片 Header -->
        <header
          class="paper-header flex items-start justify-between border-b border-[#F1F5F9] pb-6"
        >
          <div class="space-y-1">
            <div class="flex items-center gap-3">
              <h1
                class="margin-none text-2xl font-black tracking-tight text-[#0F172A]"
              >
                {{ activeWeekNode.weekLabel }}
              </h1>
              <span
                class="rounded px-2 py-0.5 text-xs font-medium"
                :class="
                  activeWeekNode.status === 'APPROVED'
                    ? 'bg-[#DCFCE7] text-[#15803D]'
                    : activeWeekNode.status === 'SUBMITTED'
                      ? 'bg-[#FFEDD5] text-[#C2410C]'
                      : 'bg-[#F1F5F9] text-[#475569]'
                "
              >
                ● {{ activeWeekNode.statusLabel }}
              </span>
            </div>
            <p
              class="margin-none flex items-center gap-2 pt-1 text-xs text-[#64748B]"
            >
              <span>{{ activeWeekNode.dateRange }}</span>
              <span>·</span>
              <span>提交人：张三 (产品研发部)</span>
            </p>
          </div>

          <!-- 右侧微型进度与操作 -->
          <div class="flex items-center gap-3">
            <div
              class="flex items-center gap-2 rounded-lg border border-[#F1F5F9] bg-[#F8FAFC] px-3 py-1.5"
            >
              <span class="text-xs font-medium text-[#64748B]">按期完成:</span>
              <span class="text-xs font-bold text-[#059669]">
                {{ planStats.done }}/{{ planStats.total }}
              </span>
            </div>

            <Button
              v-if="activeWeekNode.status === 'DRAFT'"
              size="middle"
              class="border-[#E2E8F0] text-[#334155] hover:text-[#0F172A]"
              @click="aiPolishReport"
            >
              <Icon icon="lucide:sparkles" class="mr-1 text-[#059669]" />
              AI 润色
            </Button>
            <Button
              v-if="activeWeekNode.status === 'DRAFT'"
              type="primary"
              size="middle"
              class="border-none bg-[#0F172A] hover:bg-[#1E293B]"
              @click="submitReport"
            >
              提交周报
            </Button>
          </div>
        </header>

        <!-- 一、 上周计划完成跟踪 (Timeline 左侧时间轴样式) -->
        <section class="paper-section space-y-3">
          <h2
            class="margin-none text-base font-bold tracking-tight text-[#0F172A]"
          >
            一、 上周计划完成跟踪
          </h2>

          <div
            class="relative ml-1 space-y-4 border-l-2 border-[#E2E8F0] pl-5 pt-1"
          >
            <div
              v-for="plan in lastWeekPlan"
              :key="plan.id"
              class="group relative flex items-start justify-between gap-4"
            >
              <!-- Timeline 圆点 -->
              <span
                class="absolute -left-[25px] top-1 size-2.5 rounded-full ring-4 ring-white"
                :class="
                  plan.status === 'done' ? 'bg-[#10B981]' : 'bg-[#EF4444]'
                "
              ></span>

              <div class="space-y-0.5">
                <div class="text-xs font-semibold text-[#0F172A]">
                  {{ plan.description }}
                </div>
                <p class="m-0 text-xs leading-normal text-[#64748B]">
                  {{ plan.note }}
                </p>
              </div>

              <!-- Status Indicator -->
              <span
                v-if="plan.status === 'done'"
                class="inline-flex flex-none items-center gap-1.5 text-xs font-medium text-[#059669]"
              >
                ● 按时完成
              </span>
              <span
                v-else
                class="inline-flex flex-none items-center gap-1.5 rounded bg-[#FEF2F2] px-2 py-0.5 text-xs font-medium text-[#DC2626]"
              >
                ● 延期
              </span>
            </div>
          </div>
        </section>

        <!-- 二、 本周工作内容成果 (卡片内部内联文本框编辑 + 【我的工作】同一侧滑抽屉) -->
        <section class="paper-section space-y-3">
          <div class="flex items-center justify-between">
            <h2
              class="margin-none text-base font-bold tracking-tight text-[#0F172A]"
            >
              二、 本周工作内容成果
            </h2>
            <span class="text-xs text-[#94A3B8]">
              由【我的工作】数据自动聚合
            </span>
          </div>

          <div class="space-y-3">
            <article
              v-for="item in visibleItems"
              :key="item.id"
              class="space-y-2.5 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-4 transition-all hover:border-[#E2E8F0]"
              :class="
                item.status === '已完成'
                  ? 'border-l-4 border-l-[#10B981]'
                  : 'border-l-4 border-l-[#F59E0B]'
              "
            >
              <!-- 事项 Header (包含详情与内联编辑触发按钮) -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <h3 class="margin-none text-sm font-bold text-[#0F172A]">
                    {{ item.title }}
                  </h3>
                  <span
                    v-if="item.status"
                    class="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    :class="
                      item.status === '已完成'
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : 'bg-[#FEF3C7] text-[#B45309]'
                    "
                  >
                    {{ item.status }}
                  </span>
                </div>

                <div class="flex items-center gap-2.5">
                  <Button
                    type="link"
                    size="small"
                    class="flex h-auto items-center gap-0.5 p-0 text-xs font-semibold text-[#059669] hover:text-[#047857]"
                    @click="openItemDetail(item)"
                  >
                    <Icon icon="lucide:panel-right-open" class="size-3.5" />
                    <span>详情</span>
                  </Button>
                  <Button
                    v-if="
                      activeWeekNode.status === 'DRAFT' &&
                      editingItemId !== item.id
                    "
                    type="link"
                    size="small"
                    class="flex h-auto items-center gap-0.5 p-0 text-xs text-[#64748B] hover:text-[#0F172A]"
                    @click="startInlineEdit(item)"
                  >
                    <Icon icon="lucide:pencil" class="size-3.5" />
                    <span>编辑描述</span>
                  </Button>
                </div>
              </div>

              <!-- 卡片内部直接内联文本框编辑 -->
              <div v-if="editingItemId === item.id" class="space-y-2 pt-1">
                <Input.TextArea
                  v-model:value="inlineEditingText"
                  :rows="3"
                  class="rounded-xl border-[#059669] bg-white p-2.5 text-xs text-[#0F172A] focus:ring-1 focus:ring-[#059669]"
                />
                <div class="flex items-center justify-end gap-2">
                  <Button
                    size="small"
                    class="rounded-lg text-xs"
                    @click="cancelInlineEdit"
                  >
                    取消
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    class="rounded-lg border-none bg-[#059669] px-3 text-xs hover:bg-[#047857]"
                    @click="saveInlineEdit(item)"
                  >
                    保存修改
                  </Button>
                </div>
              </div>

              <!-- 正常模式：展示正文文本 -->
              <p v-else class="m-0 text-xs leading-relaxed text-[#334155]">
                {{ item.content }}
              </p>

              <!-- 关联资料与关联实体 -->
              <div
                class="flex w-full flex-wrap items-start justify-between gap-3 border-t border-[#E2E8F0]/60 pt-1.5"
              >
                <div
                  class="flex min-w-[220px] flex-1 basis-[48%] flex-wrap items-center gap-2 text-xs"
                >
                  <span
                    class="flex-none text-[11px] font-medium text-[#94A3B8]"
                  >
                    关联资料:
                  </span>
                  <MaterialList
                    :materials="item.materials"
                    :show-label="false"
                    variant="minimal"
                  />
                </div>

                <div
                  v-if="item.entities"
                  class="ml-auto flex min-w-[220px] flex-1 basis-[48%] flex-wrap items-center justify-end gap-2 text-xs"
                >
                  <span
                    class="flex-none text-[11px] font-medium text-[#94A3B8]"
                  >
                    关联实体:
                  </span>
                  <EntityTags
                    :entities="item.entities"
                    :show-group-title="false"
                    :clickable="true"
                    variant="minimal"
                    @pick="onEntityPick"
                  />
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- 三、 下周工作计划承诺 (结构化 01 02 03 序号 + 淡底色微行) -->
        <section class="paper-section space-y-3">
          <div class="flex items-center justify-between">
            <h2
              class="margin-none text-base font-bold tracking-tight text-[#0F172A]"
            >
              三、 下周工作计划承诺
            </h2>
            <Button
              v-if="activeWeekNode.status === 'DRAFT'"
              type="link"
              size="small"
              class="h-auto p-0 text-xs font-semibold text-[#059669] hover:text-[#047857]"
              @click="isAddingNextPlan = true"
            >
              + 新增下周计划
            </Button>
          </div>

          <div class="space-y-2">
            <div
              v-for="plan in nextWeekPlans"
              :key="plan.id"
              class="flex items-center justify-between gap-4 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-3 transition-colors hover:bg-[#F1F5F9]/70"
            >
              <div class="flex items-center gap-3">
                <!-- 01 / 02 / 03 结构化粗体数字 -->
                <span class="w-5 font-mono text-xs font-black text-[#059669]">
                  {{ plan.code }}
                </span>
                <span class="text-xs font-semibold text-[#0F172A]">
                  {{ plan.content }}
                </span>
              </div>

              <!-- 降级标签与优雅时间文字 -->
              <div class="flex items-center gap-3 text-xs">
                <span
                  class="rounded bg-[#E2E8F0]/70 px-2 py-0.5 text-[11px] text-[#475569]"
                >
                  {{ plan.entity }}
                </span>
                <span class="font-mono text-[11px] text-[#94A3B8]">
                  {{ plan.dueDate }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- 底部：点赞与评论互动区 (支持嵌套缩进回复) -->
        <section class="paper-section space-y-4 border-t border-[#F1F5F9] pt-6">
          <!-- 互动点赞栏 -->
          <div
            class="flex items-center justify-between rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] px-4 py-2.5"
          >
            <div class="flex items-center gap-3">
              <Button
                size="small"
                class="flex items-center gap-1.5 rounded-lg border-[#E2E8F0] text-xs font-medium text-[#334155] hover:bg-[#F1F5F9]"
                @click="toggleLike"
              >
                <Icon
                  icon="lucide:thumbs-up"
                  class="size-3.5"
                  :class="
                    liked ? 'fill-[#059669] text-[#059669]' : 'text-[#64748B]'
                  "
                />
                <span>{{ liked ? '已点赞' : '赞' }}</span>
                <span class="font-bold text-[#0F172A]">({{ likeCount }})</span>
              </Button>

              <div class="ml-1 flex items-center -space-x-1">
                <Avatar
                  class="size-5 border border-white bg-[#2563EB] text-[9px]"
                >
                  李
                </Avatar>
                <Avatar
                  class="size-5 border border-white bg-[#9333EA] text-[9px]"
                >
                  王
                </Avatar>
                <Avatar
                  class="size-5 border border-white bg-[#EA580C] text-[9px]"
                >
                  刘
                </Avatar>
              </div>
              <span class="text-xs text-[#64748B]">
                李经理、王总等 {{ likeCount }} 人觉得赞
              </span>
            </div>

            <span class="text-xs text-[#94A3B8]">
              {{ commentsList.length }} 条讨论
            </span>
          </div>

          <!-- 评论与嵌套回复列表 -->
          <div class="comments-section space-y-3">
            <h3 class="margin-none text-xs font-bold text-[#0F172A]">
              讨论与评语反馈
            </h3>

            <div
              v-for="comment in commentsList"
              :key="comment.id"
              class="space-y-2.5 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-3.5"
            >
              <!-- 主评论 Header -->
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold text-[#0F172A]">
                    {{ comment.author }}
                  </span>
                  <span
                    class="py-0.2 rounded px-1.5 text-[10px] font-medium"
                    :class="
                      comment.role === '主管'
                        ? 'bg-[#DCFCE7] text-[#15803D]'
                        : 'bg-[#E2E8F0] text-[#475569]'
                    "
                  >
                    {{ comment.role }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <span class="text-[10px] text-[#94A3B8]">
                    {{ comment.time }}
                  </span>
                  <Button
                    type="link"
                    size="small"
                    class="h-auto p-0 text-xs font-medium text-[#64748B] hover:text-[#0F172A]"
                    @click="replyToComment(comment)"
                  >
                    回复
                  </Button>
                </div>
              </div>

              <!-- 主评论正文 -->
              <p class="m-0 text-xs leading-relaxed text-[#334155]">
                {{ comment.content }}
              </p>

              <div v-if="comment.score" class="flex items-center gap-1 pt-0.5">
                <span class="text-[10px] text-[#94A3B8]">综合评分:</span>
                <Rate :value="comment.score" disabled class="text-xs" />
              </div>

              <!-- 嵌套回复区域 (缩进 + 左侧绿色指示条 + 显示：回复 李经理) -->
              <div
                v-if="comment.replies && comment.replies.length > 0"
                class="ml-1 mt-2.5 space-y-2 rounded-r-lg border-l-2 border-l-[#059669]/40 bg-[#F1F5F9]/60 p-2.5 pl-3"
              >
                <div
                  v-for="reply in comment.replies"
                  :key="reply.id"
                  class="space-y-1"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5 text-xs">
                      <span class="font-bold text-[#0F172A]">
                        {{ reply.author }}
                      </span>
                      <span class="text-[11px] text-[#64748B]">回复</span>
                      <span class="text-xs font-bold text-[#059669]">
                        @{{ reply.replyTo }}
                      </span>
                      <span
                        class="py-0.2 scale-90 rounded bg-[#E2E8F0] px-1 text-[10px] text-[#475569]"
                      >
                        {{ reply.role }}
                      </span>
                    </div>
                    <span class="text-[10px] text-[#94A3B8]">
                      {{ reply.time }}
                    </span>
                  </div>

                  <p class="m-0 pl-0.5 text-xs leading-relaxed text-[#334155]">
                    {{ reply.content }}
                  </p>
                </div>
              </div>
            </div>

            <!-- 发表评论/回复输入框 -->
            <div class="space-y-1.5 pt-2">
              <div
                v-if="activeReplyTarget"
                class="flex items-center justify-between rounded-lg border border-[#DCFCE7] bg-[#F0FDF4] px-3 py-1 text-xs text-[#059669]"
              >
                <span>
                  正在回复
                  <strong>@{{ activeReplyTarget.author }}</strong>
                </span>
                <button
                  type="button"
                  class="font-bold text-[#94A3B8] hover:text-[#0F172A]"
                  @click="cancelReply"
                >
                  ✕ 取消回复
                </button>
              </div>

              <div class="flex items-start gap-2">
                <Input.TextArea
                  v-model:value="newCommentText"
                  :placeholder="
                    activeReplyTarget
                      ? `回复 @${activeReplyTarget.author}...`
                      : '写下补充意见或评论...'
                  "
                  :rows="2"
                  class="rounded-xl border-[#E2E8F0] bg-[#F8FAFC] text-xs focus:bg-white"
                />
                <Button
                  type="primary"
                  size="small"
                  class="h-14 rounded-xl border-none bg-[#0F172A] px-4 hover:bg-[#1E293B]"
                  @click="submitComment"
                >
                  {{ activeReplyTarget ? '回复' : '发送' }}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <!-- 4. 右侧：AI 助手与完整度检测面板 (色彩收敛为中性灰/蓝灰，做轻量辅助) -->
      <aside
        class="ai-assistant-sidebar sticky top-0 flex max-h-[calc(100vh-100px)] flex-col gap-3.5 self-start overflow-y-auto"
      >
        <!-- 周报完整度卡片 -->
        <article class="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <span class="text-xs text-[#64748B]">周报质量完整度</span>
          <div class="my-1 flex items-baseline gap-2">
            <strong class="text-3xl font-extrabold text-[#1E293B]">
              {{ store.state.completeness }}%
            </strong>
            <span
              class="rounded bg-[#F1F5F9] px-2 py-0.5 text-xs font-medium text-[#475569]"
            >
              辅助质检中
            </span>
          </div>

          <Progress
            :percent="store.state.completeness"
            :show-info="false"
            stroke-color="#475569"
            class="m-0"
          />
          <p class="mt-2 text-[11px] leading-normal text-[#94A3B8]">
            基于 AI 完整度规则计算，自动提示工作附件佐证与承诺兑现率。
          </p>
        </article>

        <!-- AI 建议与待完善提醒 -->
        <article class="rounded-xl border border-[#E2E8F0] bg-white p-4">
          <h3
            class="mb-3 flex items-center gap-1.5 text-xs font-bold text-[#1E293B]"
          >
            <Icon icon="lucide:sparkles" class="size-3.5 text-[#475569]" />
            <span>AI 智能完善建议</span>
          </h3>

          <div class="space-y-2">
            <div
              v-for="check in completenessChecks"
              :key="check.id"
              class="rounded-lg border p-2 text-xs"
              :class="
                check.done
                  ? 'border-[#F1F5F9] bg-[#F8FAFC]'
                  : 'border-[#FEE2E2] bg-[#FEF2F2]'
              "
            >
              <div class="flex items-start justify-between gap-1.5">
                <div class="flex items-start gap-1.5">
                  <Icon
                    :icon="check.done ? 'lucide:check-circle-2' : check.icon"
                    class="mt-0.5 size-3.5 flex-none"
                    :class="check.done ? 'text-[#475569]' : 'text-[#DC2626]'"
                  />
                  <span
                    class="leading-tight"
                    :class="
                      check.done
                        ? 'text-[#94A3B8] line-through'
                        : 'font-medium text-[#0F172A]'
                    "
                  >
                    {{ check.label }}
                  </span>
                </div>

                <Button
                  v-if="!check.done"
                  type="link"
                  size="small"
                  class="h-auto flex-none p-0 text-xs font-semibold text-[#DC2626] hover:text-[#B91C1C]"
                  @click="check.onAction"
                >
                  {{ check.action }}
                </Button>
                <span v-else class="text-[10px] font-medium text-[#475569]">
                  已补全
                </span>
              </div>
            </div>
          </div>
        </article>

        <!-- 操作按钮块 (移除了“查阅全链工作证据”按钮) -->
        <article
          class="space-y-2 rounded-xl border border-[#E2E8F0] bg-white p-4"
        >
          <Button
            block
            type="primary"
            class="border-none bg-[#0F172A] hover:bg-[#1E293B]"
            @click="aiPolishReport"
          >
            <Icon icon="lucide:sparkles" />
            AI 自动润色语言
          </Button>
        </article>
      </aside>
    </div>

    <!-- 嵌入复用【我的工作】统一事项侧滑详情抽屉 (WorkItemDetailDrawer) -->
    <WorkItemDetailDrawer
      v-model:open="detailDrawerOpen"
      :item="currentDetailItem"
      @pick-entity="onEntityPick"
    />

    <!-- 弹窗：新增下周计划 (包含周一至周五 + 其他 Quick Date Picker) -->
    <Modal
      v-model:open="isAddingNextPlan"
      title="新增下周工作计划"
      ok-text="确认添加"
      cancel-text="取消"
      @ok="handleAddNextPlan"
    >
      <Form layout="vertical" class="mt-3 space-y-3">
        <Form.Item label="计划内容要点" required>
          <Input.TextArea
            v-model:value="newPlanText"
            :rows="3"
            placeholder="如：完成报价平台 V2 模块联调与接口测试..."
            class="rounded-xl text-xs"
          />
        </Form.Item>

        <Form.Item label="预计完成时间" required>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="opt in quickDateOptions"
              :key="opt.key"
              type="button"
              class="rounded-xl border px-2.5 py-2 text-center text-xs font-medium transition-all"
              :class="
                selectedDateKey === opt.key
                  ? 'shadow-2xs border-[#059669] bg-[#F0FDF4] font-bold text-[#059669]'
                  : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9]'
              "
              @click="selectedDateKey = opt.key"
            >
              {{ opt.label }}
            </button>
          </div>

          <div v-if="selectedDateKey === 'custom'" class="mt-2.5">
            <DatePicker
              v-model:value="customDateValue"
              placeholder="选择自定义完成日期"
              class="w-full rounded-xl border-[#E2E8F0] text-xs"
            />
          </div>
        </Form.Item>
      </Form>
    </Modal>

    <EntityContextDrawer
      v-model:open="entityOpen"
      :entity="pickedEntity"
      mode="personal"
    />
  </div>
</template>

<style scoped>
.my-report-grid {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr) 260px;
  gap: 16px;
  width: 100%;
}

@media (max-width: 1280px) {
  .my-report-grid {
    grid-template-columns: 190px minmax(0, 1fr) 240px;
  }
}
</style>
