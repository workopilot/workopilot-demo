<!-- 周报审核页面 (支持 2 个独立解耦卡片：【1. 员工周报卡片】 + 【2. AI分析与主管审批卡片】，支持统一实体穿透 Drawer) -->
<script setup lang="ts">
import type { EntityPick } from '../components/entity-context-drawer.vue';

import type { AiWorkEntities, AiWorkWorkItem } from '#/types/ai-work';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Input, InputNumber, message, Tag } from 'ant-design-vue';

import { aiWorkWorkItems } from '#/api/mock-data-ai-work';
import { useAiWorkDemoStore } from '#/store/ai-work-demo';

import EntityContextDrawer from '../components/entity-context-drawer.vue';
import EntityTags from '../components/entity-tags.vue';
import MaterialList from '../components/material-list.vue';
import WorkItemDetailDrawer from '../components/work-item-detail-drawer.vue';

const store = useAiWorkDemoStore();

// ----------------------------------------------------
// 1. 事项侧滑抽屉 & 实体 Context 抽屉控制
// ----------------------------------------------------
const detailDrawerOpen = ref(false);
const selectedWorkItem = ref<AiWorkWorkItem | null>(null);

function openWorkItemDetail(item: AiWorkWorkItem) {
  selectedWorkItem.value = item;
  detailDrawerOpen.value = true;
}

// 统一实体穿透 Drawer 控制
const entityDrawerOpen = ref(false);
const selectedEntity = ref<EntityPick | null>(null);

function handleEntityPick(payload: {
  name: string;
  type: keyof AiWorkEntities;
}) {
  selectedEntity.value = payload;
  entityDrawerOpen.value = true;
}

// ----------------------------------------------------
// 2. 左侧时间树数据 (月份与周节点，带有未审核角标)
// ----------------------------------------------------
interface WeekNode {
  id: string;
  year: number;
  month: number;
  weekNum: number;
  weekLabel: string;
  dateRange: string;
  pendingCount?: number;
  isApproved?: boolean;
}

interface MonthGroup {
  monthLabel: string;
  collapsed: boolean;
  weeks: WeekNode[];
}

const timeTreeData = ref<MonthGroup[]>([
  {
    monthLabel: '2026 年 8 月',
    collapsed: false,
    weeks: [
      {
        id: '2026-w32',
        year: 2026,
        month: 8,
        weekNum: 32,
        weekLabel: '2026-W32 周报',
        dateRange: '2026-08-03 -- 2026-08-09',
        pendingCount: store.state.reviewDecision === 'approved' ? 1 : 2,
      },
      {
        id: '2026-w31',
        year: 2026,
        month: 8,
        weekNum: 31,
        weekLabel: '2026-W31 周报',
        dateRange: '2026-07-27 -- 2026-08-02',
        isApproved: true,
      },
    ],
  },
  {
    monthLabel: '2026 年 7 月',
    collapsed: true,
    weeks: [
      {
        id: '2026-w30',
        year: 2026,
        month: 7,
        weekNum: 30,
        weekLabel: '2026-W30 周报',
        dateRange: '2026-07-20 -- 2026-07-26',
        isApproved: true,
      },
    ],
  },
]);

const activeWeekId = ref('2026-w32');
function selectWeekNode(week: WeekNode) {
  activeWeekId.value = week.id;
}

// ----------------------------------------------------
// 3. 右侧顶部双层过滤器 (第一行部门，第二行人员)
// ----------------------------------------------------
interface DepartmentItem {
  id: string;
  name: string;
  submittedCount: number;
  totalCount: number;
}

interface EmployeeItem {
  id: string;
  name: string;
  avatar: string;
  deptId: string;
  status: 'approved' | 'pending' | 'unsubmitted';
  score?: number;
  aiSuggestedScore: number;
  aiSuggestedComment: string;
}

const departments = ref<DepartmentItem[]>([
  { id: 'dev', name: '开发部', submittedCount: 11, totalCount: 12 },
  { id: 'mkt', name: '市场部', submittedCount: 3, totalCount: 6 },
  { id: 'ops', name: '运维部', submittedCount: 5, totalCount: 5 },
]);

const activeDeptId = ref('dev');

const allEmployees = ref<EmployeeItem[]>([
  {
    id: 'zhang-san',
    name: '张三',
    avatar: '张',
    deptId: 'dev',
    status: store.state.reviewDecision === 'approved' ? 'approved' : 'pending',
    score: store.state.reviewDecision === 'approved' ? 85 : undefined,
    aiSuggestedScore: 85,
    aiSuggestedComment:
      '总体推进尚可，但宏远科技项目连续 3 周无实质进展，商机存在停滞风险。建议核实采购意向并由主管跟进，通过并提示协助。',
  },
  {
    id: 'li-si',
    name: '李四',
    avatar: '李',
    deptId: 'dev',
    status: 'pending',
    aiSuggestedScore: 88,
    aiSuggestedComment: '本周完成客户 B 需求分析与测试用例编写，整体进度良好。',
  },
  {
    id: 'wang-wu',
    name: '王五',
    avatar: '王',
    deptId: 'dev',
    status: 'approved',
    score: 95,
    aiSuggestedScore: 95,
    aiSuggestedComment:
      '架构设计文档极其规范，完成跨部门代码评审。予以高分通过。',
  },
  {
    id: 'zhao-liu',
    name: '赵六',
    avatar: '赵',
    deptId: 'dev',
    status: 'approved',
    score: 90,
    aiSuggestedScore: 90,
    aiSuggestedComment: '完成前端核心视图构建，响应及时。',
  },
  {
    id: 'chen-chen',
    name: '陈晨',
    avatar: '陈',
    deptId: 'dev',
    status: 'unsubmitted',
    aiSuggestedScore: 0,
    aiSuggestedComment: '未提交。',
  },
  {
    id: 'sun-min',
    name: '孙敏',
    avatar: '孙',
    deptId: 'dev',
    status: 'unsubmitted',
    aiSuggestedScore: 0,
    aiSuggestedComment: '未提交。',
  },
]);

const filteredEmployees = computed(() => {
  const list = allEmployees.value.filter(
    (e) => e.deptId === activeDeptId.value,
  );
  return list.toSorted((a, b) => {
    const aVal = a.status === 'unsubmitted' ? 1 : 0;
    const bVal = b.status === 'unsubmitted' ? 1 : 0;
    return aVal - bVal;
  });
});

const activeEmpId = ref('zhang-san');

const activeEmployee = computed(() => {
  return (
    allEmployees.value.find((e) => e.id === activeEmpId.value) ||
    filteredEmployees.value[0] ||
    allEmployees.value[0]!
  );
});

// ----------------------------------------------------
// 4. 领导打分与评价状态 (默认预填 AI 提供的内容)
// ----------------------------------------------------
const leaderScore = ref<number>(activeEmployee.value.aiSuggestedScore);
const leaderComment = ref<string>(activeEmployee.value.aiSuggestedComment);

// 评论列表动态绑定
const commentsList = ref([
  {
    id: 'c-1',
    author: '李经理 (主管批复)',
    time: store.state.reviewDecision === 'approved' ? '刚刚' : '08/03 10:35',
    score: 85,
    content: activeEmployee.value.aiSuggestedComment,
    isLeader: true,
  },
  {
    id: 'c-2',
    author: '张三',
    time: '08/03 14:20',
    content: '收到！宏远科技已约好本周四再次拜访，届时一定推动决策人出面。',
    isLeader: false,
  },
]);

function selectEmployee(emp: EmployeeItem) {
  activeEmpId.value = emp.id;
  leaderScore.value = emp.score || emp.aiSuggestedScore;
  leaderComment.value = emp.aiSuggestedComment;
}

function selectDept(deptId: string) {
  activeDeptId.value = deptId;
  const first = filteredEmployees.value[0];
  if (first) {
    selectEmployee(first);
  }
}

// 极简单按钮审批确认
function handleApprove() {
  const emp = activeEmployee.value;
  emp.status = 'approved';
  emp.score = leaderScore.value;

  store.approveReport();

  const newComment = {
    id: `comment-${Date.now()}`,
    author: '李经理 (主管批复)',
    time: '刚刚',
    score: leaderScore.value,
    content: leaderComment.value,
    isLeader: true,
  };

  commentsList.value.unshift(newComment);

  message.success(
    `审批成功！已通过 ${emp.name} 的周报 (打分: ${leaderScore.value}分)，批复已同步至员工！`,
  );
}

// 本周展示的工作事项列表
const currentReportItems = computed(() => aiWorkWorkItems.slice(0, 4));
</script>

<template>
  <div
    class="weekly-audit-page h-full max-h-[calc(100vh-65px)] overflow-y-auto bg-[#F4F5F7] p-4 text-[#1E293B]"
  >
    <!-- 1. 顶部 Header -->
    <header
      class="mb-4 flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex size-9 items-center justify-center rounded-xl bg-[#F0FDF4] font-bold text-[#059669]"
        >
          <Icon icon="lucide:shield-check" class="size-5" />
        </div>
        <div>
          <h1
            class="margin-none text-base font-bold leading-snug text-[#0F172A]"
          >
            周报审核工作台
          </h1>
          <p class="margin-none text-xs text-[#64748B]">
            产品研发部 · 2026年第 32 周 · 快速审批打分与 AI 智能建议
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Tag
          color="green"
          class="rounded-full border-none px-2.5 py-0.5 text-xs font-semibold"
        >
          ● 待审核队列: {{ store.pendingReviewCount }} 人
        </Tag>
      </div>
    </header>

    <!-- 2. 主主体：左侧时间树 + 右侧工作区 -->
    <div class="main-layout flex items-start gap-4">
      <!-- 左侧时间树面板 -->
      <aside
        class="left-tree-panel sticky top-0 max-h-[calc(100vh-120px)] w-64 flex-none self-start overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
      >
        <div
          class="mb-2 flex items-center justify-between border-b border-[#F1F5F9] px-1 pb-2"
        >
          <span
            class="flex items-center gap-1 text-xs font-bold text-[#475569]"
          >
            <Icon icon="lucide:calendar" class="size-3.5 text-[#059669]" />
            周报期次列表
          </span>
          <span class="text-[10px] text-[#94A3B8]">按月折叠</span>
        </div>

        <div
          v-for="group in timeTreeData"
          :key="group.monthLabel"
          class="month-group mb-2"
        >
          <button
            type="button"
            class="flex w-full cursor-pointer items-center justify-between rounded-lg p-1.5 text-xs font-semibold text-[#334155] transition-colors hover:bg-[#F8FAFC]"
            @click="group.collapsed = !group.collapsed"
          >
            <div class="flex items-center gap-1.5">
              <Icon
                :icon="group.collapsed ? 'lucide:folder' : 'lucide:folder-open'"
                class="size-3.5 text-[#64748B]"
              />
              <span>{{ group.monthLabel }}</span>
            </div>
            <Icon
              :icon="
                group.collapsed ? 'lucide:chevron-right' : 'lucide:chevron-down'
              "
              class="size-3 text-[#94A3B8]"
            />
          </button>

          <div
            v-show="!group.collapsed"
            class="weeks-list ml-2 mt-1 space-y-1 border-l border-[#E2E8F0] pl-2"
          >
            <button
              v-for="week in group.weeks"
              :key="week.id"
              type="button"
              class="flex w-full cursor-pointer items-center justify-between rounded-r-lg p-2 text-left text-xs transition-all"
              :class="
                activeWeekId === week.id
                  ? 'border-l-3 border-l-[#059669] bg-[#F0FDF4] pl-2.5 font-bold text-[#064E3B]'
                  : 'pl-2 text-[#475569] hover:bg-[#F8FAFC]'
              "
              @click="selectWeekNode(week)"
            >
              <div class="flex min-w-0 flex-col">
                <span>{{ week.weekLabel }}</span>
                <span
                  class="text-[10px]"
                  :class="
                    activeWeekId === week.id
                      ? 'text-[#047857]'
                      : 'text-[#94A3B8]'
                  "
                >
                  {{
                    (week.dateRange || '').split(' -- ')[0] || week.weekLabel
                  }}
                </span>
              </div>

              <!-- 待审核数字角标 Badge -->
              <div class="flex-none">
                <span
                  v-if="week.pendingCount && week.pendingCount > 0"
                  class="inline-flex size-5 animate-pulse items-center justify-center rounded-full bg-[#EF4444] text-[10px] font-bold text-white"
                  title="未审核件数"
                >
                  {{ week.pendingCount }}
                </span>
                <span
                  v-else-if="week.isApproved"
                  class="rounded bg-[#DCFCE7] px-1.5 py-0.5 text-[10px] font-medium text-[#059669]"
                >
                  已审批
                </span>
              </div>
            </button>
          </div>
        </div>
      </aside>

      <!-- 右侧主工作区 (双层过滤器 + 卡片1:员工周报卡片 + 卡片2:AI分析与主管审批卡片) -->
      <main class="right-main-panel min-w-0 flex-1 space-y-4 pb-12">
        <!-- 过滤器卡片 -->
        <section
          class="filter-card space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
        >
          <!-- 第一行：部门选择 -->
          <div
            class="flex items-center gap-2 overflow-x-auto border-b border-[#F1F5F9] pb-1"
          >
            <span
              class="flex flex-none items-center gap-1 text-xs font-bold text-[#64748B]"
            >
              <Icon icon="lucide:building-2" class="size-3.5 text-[#059669]" />
              部门维度:
            </span>

            <button
              v-for="dept in departments"
              :key="dept.id"
              type="button"
              class="flex flex-none cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1 text-xs font-medium transition-all"
              :class="
                activeDeptId === dept.id
                  ? 'shadow-xs bg-[#059669] font-bold text-white'
                  : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9]'
              "
              @click="selectDept(dept.id)"
            >
              <span>{{ dept.name }}</span>
              <span class="text-[10px] opacity-85">
                ({{ dept.submittedCount }}/{{ dept.totalCount }})
              </span>
            </button>
          </div>

          <!-- 第二行：部门内部人员选择 -->
          <div class="flex items-center gap-2 overflow-x-auto pt-1">
            <span
              class="flex flex-none items-center gap-1 text-xs font-bold text-[#64748B]"
            >
              <Icon icon="lucide:users" class="size-3.5 text-[#059669]" />
              团队人员:
            </span>

            <button
              v-for="emp in filteredEmployees"
              :key="emp.id"
              type="button"
              class="flex flex-none cursor-pointer items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-all"
              :class="[
                activeEmpId === emp.id
                  ? 'shadow-xs border-[#059669] bg-[#F0FDF4] font-bold text-[#064E3B]'
                  : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]',
                emp.status === 'unsubmitted' ? 'bg-[#F8FAFC] opacity-60' : '',
              ]"
              @click="selectEmployee(emp)"
            >
              <span
                class="size-2 flex-none rounded-full"
                :class="
                  emp.status === 'approved'
                    ? 'bg-[#10B981]'
                    : emp.status === 'pending'
                      ? 'animate-pulse bg-[#3B82F6]'
                      : 'bg-[#94A3B8]'
                "
              ></span>

              <span>{{ emp.name }}</span>

              <span
                v-if="emp.score"
                class="font-mono text-[10px] font-bold text-[#059669]"
              >
                {{ emp.score }}分
              </span>
            </button>
          </div>
        </section>

        <!-- =================================------------------- -->
        <!-- 📦 【卡片 1：员工周报卡片 (Employee Weekly Report Card)】 -->
        <!-- =================================------------------- -->
        <article
          class="report-card-1 space-y-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
        >
          <!-- 卡片 1 Header -->
          <header
            class="flex items-center justify-between border-b border-[#F1F5F9] pb-4"
          >
            <div class="flex items-center gap-3">
              <div
                class="shadow-xs flex size-10 items-center justify-center rounded-full bg-[#0D6853] text-base font-bold text-white"
              >
                {{ activeEmployee.avatar }}
              </div>
              <div>
                <h2 class="margin-none text-base font-bold text-[#0F172A]">
                  {{ activeEmployee.name }} · 2026年第 32 周周报卡片
                </h2>
                <p class="margin-none text-xs text-[#64748B]">
                  提交时间: 2026-08-07 17:26 | 部门: 产品研发部 | 整体完成度:
                  93%
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <Tag
                :color="
                  activeEmployee.status === 'approved'
                    ? 'green'
                    : activeEmployee.status === 'pending'
                      ? 'blue'
                      : 'default'
                "
                class="rounded-lg px-3 py-1 text-xs font-bold"
              >
                {{
                  activeEmployee.status === 'approved'
                    ? '✓ 已审批通过'
                    : activeEmployee.status === 'pending'
                      ? '● 待主管审批'
                      : '未提交'
                }}
              </Tag>
            </div>
          </header>

          <!-- 上周承诺追溯与兑现 -->
          <section class="space-y-2">
            <h3
              class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F172A]"
            >
              <Icon icon="lucide:check-square" class="size-4 text-[#059669]" />
              上周承诺追溯与兑现
            </h3>

            <div class="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
              <div
                class="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3"
              >
                <div>
                  <span class="block font-bold text-[#0F172A]">
                    完成报价模块接口开发
                  </span>
                  <span class="text-[11px] text-[#64748B]">
                    按期完成单元测试与测试提交
                  </span>
                </div>
                <Tag color="green" class="font-bold">已按期完成</Tag>
              </div>

              <div
                class="flex items-center justify-between rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3"
              >
                <div>
                  <span class="block font-bold text-[#92400E]">
                    完成客户 B 接口联调及环境部署
                  </span>
                  <span class="text-[11px] text-[#B45309]">
                    客户测试环境未就绪，延期至下周三
                  </span>
                </div>
                <Tag color="orange" class="font-bold">延期 1 周</Tag>
              </div>
            </div>
          </section>

          <!-- 本周核心成果 (卡片化，点击触发 Drawer) -->
          <section class="space-y-3">
            <h3
              class="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#0F172A]"
            >
              <span class="flex items-center gap-1.5">
                <Icon icon="lucide:zap" class="size-4 text-[#059669]" />
                本周工作事项与成果 (点击可侧滑查看完整详情)
              </span>
              <span class="text-[11px] font-normal text-[#94A3B8]">
                点击右侧 [详情] 穿透查看
              </span>
            </h3>

            <div class="space-y-3">
              <div
                v-for="item in currentReportItems"
                :key="item.id"
                class="shadow-xs cursor-pointer space-y-2 rounded-xl border border-l-4 border-[#E2E8F0] border-l-[#10B981] bg-[#F8FAFC] p-4 text-xs transition-all hover:border-[#10B981]"
                @click="openWorkItemDetail(item)"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-bold text-[#0F172A]">
                      {{ item.title }}
                    </span>
                    <Tag color="green" class="scale-90 font-medium">
                      {{ item.status }}
                    </Tag>
                  </div>

                  <Button
                    size="small"
                    type="link"
                    class="flex items-center gap-1 p-0 font-bold text-[#059669] hover:text-[#047857]"
                    @click.stop="openWorkItemDetail(item)"
                  >
                    <Icon icon="lucide:panel-right-open" class="size-3.5" />
                    查看详情与资料
                  </Button>
                </div>

                <p class="margin-none text-xs leading-relaxed text-[#475569]">
                  {{ item.summary }}
                </p>

                <!-- 关联材料与实体 (实体标签统一响应 handleEntityPick 穿透点击) -->
                <div
                  class="flex flex-wrap items-center justify-between gap-2 border-t border-[#E2E8F0]/60 pt-2"
                >
                  <div v-if="item.materials && item.materials.length > 0">
                    <MaterialList :materials="item.materials" />
                  </div>
                  <div v-if="item.entities">
                    <EntityTags
                      :entities="item.entities"
                      :clickable="true"
                      @pick="handleEntityPick"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 下周计划 -->
          <section class="space-y-2">
            <h3
              class="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0F172A]"
            >
              <Icon icon="lucide:calendar-days" class="size-4 text-[#059669]" />
              下周计划事项
            </h3>
            <div
              class="space-y-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-xs text-[#334155]"
            >
              <div class="flex items-start gap-2">
                <span
                  class="mt-0.5 flex size-5 flex-none items-center justify-center rounded-full bg-[#E2E8F0] text-[10px] font-bold text-[#475569]"
                >
                  1
                </span>
                <div>
                  <span class="font-bold text-[#0F172A]">
                    推进宏远科技与客户 B 接口联调与闭环测试
                  </span>
                  <p class="margin-none text-[11px] text-[#64748B]">
                    预计完成日期：下周三 (08月12日)
                  </p>
                </div>
              </div>
              <div class="flex items-start gap-2">
                <span
                  class="mt-0.5 flex size-5 flex-none items-center justify-center rounded-full bg-[#E2E8F0] text-[10px] font-bold text-[#475569]"
                >
                  2
                </span>
                <div>
                  <span class="font-bold text-[#0F172A]">
                    持续跟进华达打印复测效果并整理阶段报告
                  </span>
                  <p class="margin-none text-[11px] text-[#64748B]">
                    预计完成日期：下周五 (08月14日)
                  </p>
                </div>
              </div>
            </div>
          </section>
        </article>

        <!-- =================================------------------- -->
        <!-- 🧠 【卡片 2：AI 分析与主管审批卡片 (AI Analysis & Manager Approval Card)】 -->
        <!-- =================================------------------- -->
        <article
          class="report-card-2 space-y-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
        >
          <!-- 1. AI 智能分析与挖掘浅色大框 (对应参考截图样式) -->
          <section
            class="ai-analysis-container shadow-xs space-y-4 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5"
          >
            <!-- 顶层 Header -->
            <div
              class="flex items-center justify-between border-b border-[#E2E8F0] pb-3"
            >
              <div>
                <h3
                  class="margin-none flex items-center gap-2 text-base font-bold text-[#0F172A]"
                >
                  <span
                    class="shadow-xs flex size-6 items-center justify-center rounded-lg bg-[#059669] text-xs text-white"
                  >
                    <Icon icon="lucide:sparkles" class="size-3.5" />
                  </span>
                  AI 周报智能分析与风险挖掘
                </h3>
                <p class="margin-none mt-0.5 text-xs text-[#64748B]">
                  本周工作量正常，但 2
                  个重点客户推进速度偏慢，其中宏远科技存在商机停滞风险。
                </p>
              </div>

              <div class="flex items-center gap-3">
                <span
                  class="rounded-full border border-[#FDE68A] bg-[#FFFBEB] px-3 py-1 text-xs font-bold text-[#B45309]"
                >
                  整体状态：🟡 需关注
                </span>
                <div class="text-right">
                  <span class="block text-xs text-[#64748B]">AI 推荐打分</span>
                  <span class="font-mono text-lg font-bold text-[#059669]">
                    85
                    <span class="text-xs font-normal text-[#94A3B8]">
                      / 100
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <!-- 中间：重点客户/事项三列纯白卡片矩阵 -->
            <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
              <!-- 卡片 1: 宏远科技 -->
              <div
                class="shadow-xs flex flex-col justify-between space-y-3 rounded-xl border border-[#E2E8F0] bg-white p-4"
              >
                <div>
                  <div class="flex items-center justify-between pb-2">
                    <span
                      class="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
                    >
                      <Icon
                        icon="lucide:building"
                        class="size-4 text-[#3B82F6]"
                      />
                      宏远科技
                    </span>
                    <span
                      class="rounded border border-[#FCA5A5] bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-medium text-[#991B1B]"
                    >
                      存在风险
                    </span>
                  </div>

                  <p
                    class="margin-none mb-2 text-xs font-semibold leading-snug text-[#334155]"
                  >
                    连续 3 周处于“方案沟通”阶段，未出现明确决策进展
                  </p>

                  <div
                    class="my-2 border-b border-dashed border-[#E2E8F0]"
                  ></div>

                  <ul
                    class="margin-none list-none space-y-1.5 pl-0 text-[11px] text-[#64748B]"
                  >
                    <li class="flex items-start gap-1">
                      <span class="text-[#94A3B8]">•</span>
                      <span>
                        <strong>第 1 周：</strong>
                        完成产品演示，客户表示内部讨论
                      </span>
                    </li>
                    <li class="flex items-start gap-1">
                      <span class="text-[#94A3B8]">•</span>
                      <span>
                        <strong>第 2 周：</strong>
                        持续跟进，等待业务负责人反馈
                      </span>
                    </li>
                    <li class="flex items-start gap-1">
                      <span class="text-[#94A3B8]">•</span>
                      <span>
                        <strong>第 3 周：</strong>
                        再次沟通，仍未确认下一步时间
                      </span>
                    </li>
                  </ul>
                </div>

                <div
                  class="rounded-lg border-t border-[#F1F5F9] bg-[#FEF2F2]/50 p-2 pt-2 text-[11px] font-medium text-[#991B1B]"
                >
                  🤖 智能判断：动作重复，未接触决策人，存在商机停滞风险。
                </div>
              </div>

              <!-- 卡片 2: 华科智能 -->
              <div
                class="shadow-xs flex flex-col justify-between space-y-3 rounded-xl border border-[#E2E8F0] bg-white p-4"
              >
                <div>
                  <div class="flex items-center justify-between pb-2">
                    <span
                      class="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
                    >
                      <Icon
                        icon="lucide:file-text"
                        class="size-4 text-[#D97706]"
                      />
                      华科智能
                    </span>
                    <span
                      class="rounded border border-[#FDE68A] bg-[#FFFBEB] px-2 py-0.5 text-[11px] font-medium text-[#B45309]"
                    >
                      需关注
                    </span>
                  </div>

                  <p
                    class="margin-none mb-2 text-xs font-semibold leading-snug text-[#334155]"
                  >
                    报价已发送 8 天暂无反馈，建议摸清客户异议
                  </p>

                  <div
                    class="my-2 border-b border-dashed border-[#E2E8F0]"
                  ></div>

                  <ul
                    class="margin-none list-none space-y-1.5 pl-0 text-[11px] text-[#64748B]"
                  >
                    <li class="flex items-start gap-1">
                      <span class="text-[#94A3B8]">•</span>
                      <span>本周需确认价格关切与预算匹配度</span>
                    </li>
                    <li class="flex items-start gap-1">
                      <span class="text-[#94A3B8]">•</span>
                      <span>了解是否存在友商/竞品低价参与竞争</span>
                    </li>
                    <li class="flex items-start gap-1">
                      <span class="text-[#94A3B8]">•</span>
                      <span>确认客户采购流程与签单节点</span>
                    </li>
                  </ul>
                </div>

                <div
                  class="rounded-lg border-t border-[#F1F5F9] bg-[#FFFBEB]/50 p-2 pt-2 text-[11px] font-medium text-[#92400E]"
                >
                  💡 动作建议：主动进行二轮报价沟通，消除价格顾虑。
                </div>
              </div>

              <!-- 卡片 3: 新城集团 -->
              <div
                class="shadow-xs flex flex-col justify-between space-y-3 rounded-xl border border-[#E2E8F0] bg-white p-4"
              >
                <div>
                  <div class="flex items-center justify-between pb-2">
                    <span
                      class="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
                    >
                      <Icon
                        icon="lucide:check-circle-2"
                        class="size-4 text-[#059669]"
                      />
                      新城集团
                    </span>
                    <span
                      class="rounded border border-[#A7F3D0] bg-[#ECFDF5] px-2 py-0.5 text-[11px] font-medium text-[#166534]"
                    >
                      按计划进行
                    </span>
                  </div>

                  <p
                    class="margin-none mb-2 text-xs font-semibold leading-snug text-[#334155]"
                  >
                    推进正常，已进入技术交流与方案深度碰撞阶段
                  </p>

                  <div
                    class="my-2 border-b border-dashed border-[#E2E8F0]"
                  ></div>

                  <ul
                    class="margin-none list-none space-y-1.5 pl-0 text-[11px] text-[#64748B]"
                  >
                    <li class="flex items-start gap-1">
                      <span class="text-[#94A3B8]">•</span>
                      <span>完成架构方案首轮沟通，反馈良好</span>
                    </li>
                    <li class="flex items-start gap-1">
                      <span class="text-[#94A3B8]">•</span>
                      <span>准备下周三与技术团队进行 Demo 演示</span>
                    </li>
                    <li class="flex items-start gap-1">
                      <span class="text-[#94A3B8]">•</span>
                      <span>暂无明显风险，正常按排期推进</span>
                    </li>
                  </ul>
                </div>

                <div
                  class="rounded-lg border-t border-[#F1F5F9] bg-[#ECFDF5]/50 p-2 pt-2 text-[11px] font-medium text-[#166534]"
                >
                  ✅ 良好趋势：保持交流节奏，准备技术评审。
                </div>
              </div>
            </div>

            <!-- 底部 Core Conclusion 核心结论 -->
            <div
              class="flex items-start gap-2 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3.5 text-xs text-[#78350F]"
            >
              <span class="text-base leading-none">💡</span>
              <div class="leading-relaxed">
                <strong>核心结论与主管协助建议：</strong>
                建议与张伟确认宏远科技真实采购意向，并考虑由主管参与下一次沟通，推动确认决策人、预算及预计采购时间；同时关注华科智能报价反馈，补充新增商机拓展动作。
              </div>
            </div>
          </section>

          <!-- 2. 领导审批确认区 (单个极简确认按钮) -->
          <section
            class="leader-approval-box space-y-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
          >
            <div class="flex items-center justify-between">
              <span
                class="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
              >
                <Icon icon="lucide:edit-3" class="size-4 text-[#059669]" />
                主管打分与审批确认
              </span>

              <div class="flex items-center gap-2">
                <span class="text-xs text-[#64748B]">主管打分:</span>
                <InputNumber
                  v-model:value="leaderScore"
                  :min="0"
                  :max="100"
                  size="small"
                  class="w-20 rounded-lg font-mono font-bold"
                />
                <span class="text-xs text-[#64748B]">分</span>
              </div>
            </div>

            <div>
              <Input.TextArea
                v-model:value="leaderComment"
                :rows="2"
                placeholder="在此编写主管批复，默认已同步 AI 推荐评语..."
                class="rounded-xl border-[#CBD5E1] text-xs"
              />
            </div>

            <div class="flex items-center justify-end pt-1">
              <Button
                type="primary"
                size="large"
                class="rounded-xl border-none bg-[#059669] px-8 font-bold shadow-md hover:bg-[#047857]"
                @click="handleApprove"
              >
                🚀 确认 (批复并同步)
              </Button>
            </div>
          </section>

          <!-- 3. 评语与互动评论区域 -->
          <section
            class="comments-section space-y-3 border-t border-[#F1F5F9] pt-4"
          >
            <h4
              class="m-0 flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
            >
              <Icon
                icon="lucide:message-square"
                class="size-4 text-[#059669]"
              />
              评语与互动评论 (已同步给员工)
            </h4>

            <div class="space-y-2">
              <div
                v-for="c in commentsList"
                :key="c.id"
                class="rounded-xl border p-3 text-xs transition-all"
                :class="
                  c.isLeader
                    ? 'border-[#DCFCE7] bg-[#F0FDF4] text-[#064E3B]'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#334155]'
                "
              >
                <div class="mb-1 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="font-bold">{{ c.author }}</span>
                    <Tag
                      v-if="c.score"
                      color="green"
                      class="scale-90 font-mono"
                    >
                      {{ c.score }}分
                    </Tag>
                  </div>
                  <span class="text-[10px] text-[#94A3B8]">{{ c.time }}</span>
                </div>
                <p class="m-0 text-xs leading-relaxed">{{ c.content }}</p>
              </div>
            </div>
          </section>
        </article>
      </main>
    </div>

    <!-- 侧滑抽屉 1: 工作事项侧滑抽屉 (WorkItemDetailDrawer) -->
    <WorkItemDetailDrawer
      v-model:open="detailDrawerOpen"
      :item="selectedWorkItem"
      @pick-entity="handleEntityPick"
    />

    <!-- 侧滑抽屉 2: 统一实体 Context 穿透抽屉 (EntityContextDrawer) -->
    <EntityContextDrawer
      v-model:open="entityDrawerOpen"
      :entity="selectedEntity"
    />
  </div>
</template>

<style scoped>
.weekly-audit-page {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
