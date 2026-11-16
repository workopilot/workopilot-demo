<!-- 重点关注页面 (重构版) -->
<!-- 布局参考【待我审批】：左侧为月+周次树，右侧顶部为部门过滤器，下侧列出各部门重点关注/风险事项，包含负责人、AI判断、实体穿透与点击唤起事项详情侧滑栏 -->
<script setup lang="ts">
import type { EntityPick } from '../components/entity-context-drawer.vue';

import type { AiWorkWorkItem } from '#/types/ai-work';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Tag } from 'ant-design-vue';

import EntityContextDrawer from '../components/entity-context-drawer.vue';
import EntityTags from '../components/entity-tags.vue';
import MaterialList from '../components/material-list.vue';
import PersonDetailDrawer from '../components/person-detail-drawer.vue';
import WorkItemDetailDrawer from '../components/work-item-detail-drawer.vue';

// ----------------------------------------------------
// 1. 数据结构定义
// ----------------------------------------------------
export interface FocusRiskItem {
  id: string;
  title: string;
  deptId: 'dev' | 'impl' | 'mkt' | 'ops';
  deptName: string;
  owner: string;
  ownerAvatar: string;
  ownerRole: string;
  riskLevel: '中风险' | '低风险' | '高风险';
  riskColor: 'blue' | 'orange' | 'red' | 'yellow';
  category: string; // 如：无合同服务、接口阻塞、交付受阻、范围失控
  summary: string;
  aiJudgement: string;
  aiSuggestion: string;
  dueDate: string;
  weekId: string;
  entities: {
    customers?: string[];
    people?: string[];
    products?: string[];
    projects?: string[];
  };
  materials?: Array<{
    duration?: string;
    id: string;
    name: string;
    size?: string;
    type: string;
  }>;
  detailItem: AiWorkWorkItem;
}

// ----------------------------------------------------
// 2. 左侧时间树数据 (月份与周节点)
// ----------------------------------------------------
interface WeekNode {
  id: string;
  year: number;
  month: number;
  weekNum: number;
  weekLabel: string;
  dateRange: string;
  riskCount: number;
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
        riskCount: 6,
      },
      {
        id: '2026-w31',
        year: 2026,
        month: 8,
        weekNum: 31,
        weekLabel: '2026-W31 周报',
        dateRange: '2026-07-27 -- 2026-08-02',
        riskCount: 3,
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
        riskCount: 2,
      },
    ],
  },
]);

const activeWeekId = ref('2026-w32');

function selectWeekNode(week: WeekNode) {
  activeWeekId.value = week.id;
}

function toggleMonthCollapse(group: MonthGroup) {
  group.collapsed = !group.collapsed;
}

// ----------------------------------------------------
// 3. 部门与风险级别过滤器
// ----------------------------------------------------
interface DepartmentTab {
  id: string;
  name: string;
}

const departments: DepartmentTab[] = [
  { id: 'all', name: '全部部门' },
  { id: 'dev', name: '开发部' },
  { id: 'ops', name: '运维部' },
  { id: 'impl', name: '实施部' },
  { id: 'mkt', name: '市场部' },
];

const activeDeptId = ref<string>('all');
const activeRiskLevel = ref<string>('all');

// ----------------------------------------------------
// 4. 重点/风险事项 Mock 数据
// ----------------------------------------------------
const allRiskItems = ref<FocusRiskItem[]>([
  {
    id: 'f-ops-1',
    title: '华辰科技｜暂停客户仍持续产生运维投入',
    deptId: 'ops',
    deptName: '运维部',
    owner: '李明',
    ownerAvatar: '李',
    ownerRole: '资深运维工程师',
    riskLevel: '高风险',
    riskColor: 'red',
    category: '无合同服务',
    summary:
      '销售侧已将客户状态更新为「暂停续费」，但本周运维仍提供客户问题回复 8 次、远程处理 3 次、上门服务 1 次，预计投入约 1.5 人天。',
    aiJudgement:
      '客户商业状态与运维服务状态不一致，存在无合同持续投入服务资源的沉没成本风险。',
    aiSuggestion:
      '建议主管立即暂停非紧急上门服务，由销售侧与客户明确续约意向后再行支持。',
    dueDate: '2026-08-14 (周五前)',
    weekId: '2026-w32',
    entities: {
      customers: ['华辰科技'],
      projects: ['华辰运维支持项目'],
      people: ['李明', '王主管'],
    },
    materials: [
      {
        id: 'fm-1',
        name: '华辰科技服务记录汇总.pdf',
        type: 'document',
        size: '1.8 MB',
      },
    ],
    detailItem: {
      id: 'f-ops-1-detail',
      title: '华辰科技｜暂停客户运维投入风险排查',
      status: '处理中',
      deliverables: '完成服务工单审计与销售侧对齐',
      content:
        '本周处理华辰科技相关问题 8 起，远程调试 3 次，上门服务 1 次。销售端标记为暂停续费状态，需确认服务合同边界。',
      entities: {
        customers: ['华辰科技'],
        projects: ['华辰运维支持项目'],
        people: ['李明'],
      },
      materials: [
        {
          id: 'fm-1',
          name: '华辰科技服务记录汇总.pdf',
          type: 'document',
          size: '1.8 MB',
        },
      ],
      aiAnalysis: {
        completenessScore: 82,
        intensityScore: 88,
        riskLevel: '高风险',
        highlight: '客户处于暂停续费期，服务资源仍持续流出。',
        suggestions: ['要求销售介入核实合同状态', '冻结非故障级现场服务'],
      },
    },
  },
  {
    id: 'f-dev-1',
    title: '客户 B｜测试环境未准备就绪，接口联调严重阻塞',
    deptId: 'dev',
    deptName: '开发部',
    owner: '张三',
    ownerAvatar: '张',
    ownerRole: '高级 Vue 前端工程师',
    riskLevel: '高风险',
    riskColor: 'red',
    category: '外部依赖阻塞',
    summary:
      '客户 B 侧的测试环境持续无法连通，导致原本计划本周完成的报价接口联调未能如期推进，已产生延期 1 周。',
    aiJudgement:
      '承诺事项因外部依赖未落地产生滞后，若下周三前仍无法连通将直接影响 9 月版本上线节点。',
    aiSuggestion:
      '建议项目经理与客户 B 技术负责人电话会议沟通，明确测试环境恢复的时间节点。',
    dueDate: '2026-08-13 (下周三前)',
    weekId: '2026-w32',
    entities: {
      customers: ['客户 B'],
      projects: ['客户 B 集成项目'],
      people: ['张三', '李经理'],
    },
    materials: [
      {
        id: 'fm-2',
        name: '客户 B 接口联调阻塞说明.docx',
        type: 'document',
        size: '640 KB',
      },
    ],
    detailItem: {
      id: 'f-dev-1-detail',
      title: '客户 B 接口联调环境卡点与延期说明',
      status: '延期中',
      deliverables: '完成环境连通与全链路接口测试',
      content:
        '由于客户 B 测试环境无法访问，本周联调进度暂停。已准备好联调代码与测试脚本，等待环境就绪。',
      entities: {
        customers: ['客户 B'],
        projects: ['客户 B 集成项目'],
        people: ['张三'],
      },
      materials: [
        {
          id: 'fm-2',
          name: '客户 B 接口联调阻塞说明.docx',
          type: 'document',
          size: '640 KB',
        },
      ],
      aiAnalysis: {
        completenessScore: 78,
        intensityScore: 85,
        riskLevel: '高风险',
        highlight: '外部依赖阻塞，存在版本排期连带延期风险。',
        suggestions: ['升级至项目经理层级协调环境'],
      },
    },
  },
  {
    id: 'f-impl-1',
    title: '华科集团｜销售已承诺批量导入功能，但研发排期未覆盖',
    deptId: 'impl',
    deptName: '实施部',
    owner: '赵六',
    ownerAvatar: '赵',
    ownerRole: '实施项目经理',
    riskLevel: '高风险',
    riskColor: 'red',
    category: '跨部门风险',
    summary:
      '销售周报显示已向华科集团承诺 9 月支持「批量导入审批单」功能作为续约条件，但产研需求池与排期中未找到该需求。',
    aiJudgement:
      '销售形成明确客户预期，但产研侧尚未评估开发排期，临近交付临时插入可能打乱正常版本迭代。',
    aiSuggestion:
      '建议产研负责人与销售负责人本周召集需求评审会，确认该功能的技术可行性与排期。',
    dueDate: '2026-08-15 (本周六前)',
    weekId: '2026-w32',
    entities: {
      customers: ['华科集团'],
      projects: ['华科实施二期'],
      people: ['赵六', '张三'],
    },
    materials: [
      {
        id: 'fm-3',
        name: '华科集团批量导入需求说明.pdf',
        type: 'document',
        size: '2.1 MB',
      },
    ],
    detailItem: {
      id: 'f-impl-1-detail',
      title: '华科集团｜销售承诺需求与研发排期偏差风险',
      status: '待评估',
      deliverables: '完成需求评估与排期确认',
      content:
        '客户要求 9 月交付批量导入审批单，销售已做口头承诺。目前实施侧需协助产研完成需求细节梳理。',
      entities: {
        customers: ['华科集团'],
        projects: ['华科实施二期'],
        people: ['赵六'],
      },
      materials: [
        {
          id: 'fm-3',
          name: '华科集团批量导入需求说明.pdf',
          type: 'document',
          size: '2.1 MB',
        },
      ],
      aiAnalysis: {
        completenessScore: 75,
        intensityScore: 80,
        riskLevel: '高风险',
        highlight: '销售预期与研发计划不一致，交付风险高。',
        suggestions: ['组织产研销售联合评审', '评估替代变通方案'],
      },
    },
  },
  {
    id: 'f-ops-2',
    title: '鑫达集团｜同类网络波动故障连续发生 3 次',
    deptId: 'ops',
    deptName: '运维部',
    owner: '王强',
    ownerAvatar: '王',
    ownerRole: '现场支持专员',
    riskLevel: '中风险',
    riskColor: 'orange',
    category: '重复故障风险',
    summary:
      '近两周内鑫达集团现场连续出现 3 次数据同步断连，虽单次均在 15 分钟内恢复，但根因尚未彻底解决。',
    aiJudgement:
      '频繁微小故障容易磨损客户满意度，且高负荷下的应急处置存在二次误操作隐患。',
    aiSuggestion:
      '建议排查专线网络质量并配置自动重连重试机制，形成根因排查报告。',
    dueDate: '2026-08-16 (本周日)',
    weekId: '2026-w32',
    entities: {
      customers: ['鑫达集团'],
      projects: ['鑫达数据同步'],
      people: ['王强'],
    },
    materials: [
      {
        id: 'fm-4',
        name: '鑫达断连故障日志分析.log',
        type: 'document',
        size: '450 KB',
      },
    ],
    detailItem: {
      id: 'f-ops-2-detail',
      title: '鑫达集团网络波动重复故障根因排查',
      status: '处理中',
      deliverables: '输出网络重连调优方案',
      content:
        '近两周处理断连工单 3 次，恢复迅速但故障复发率高。正与客户网管对接抓包分析。',
      entities: {
        customers: ['鑫达集团'],
        projects: ['鑫达数据同步'],
        people: ['王强'],
      },
      materials: [
        {
          id: 'fm-4',
          name: '鑫达断连故障日志分析.log',
          type: 'document',
          size: '450 KB',
        },
      ],
      aiAnalysis: {
        completenessScore: 85,
        intensityScore: 92,
        riskLevel: '中风险',
        highlight: '重复故障风险，需深挖根因。',
        suggestions: ['增加网络抓包监控', '优化重试逻辑'],
      },
    },
  },
  {
    id: 'f-dev-2',
    title: '报价平台 V2｜联调缺陷待清零与性能瓶颈',
    deptId: 'dev',
    deptName: '开发部',
    owner: '李四',
    ownerAvatar: '李',
    ownerRole: '后端开发工程师',
    riskLevel: '中风险',
    riskColor: 'orange',
    category: '质量瓶颈',
    summary:
      '报价平台 V2 目前尚有 4 个中级缺陷未闭环，并发高峰期 SQL 查询响应超过 600ms。',
    aiJudgement:
      '性能指标距离上线标准（300ms以内）仍有差距，需加速 SQL 索引与缓存重构。',
    aiSuggestion:
      '建议李四集中精力进行数据库慢查询分析，下周一前完成回归测试。',
    dueDate: '2026-08-17 (下周一)',
    weekId: '2026-w32',
    entities: {
      projects: ['报价平台 V2'],
      products: ['报价模块'],
      people: ['李四'],
    },
    materials: [
      {
        id: 'fm-5',
        name: '报价平台性能压测报告.pdf',
        type: 'document',
        size: '3.2 MB',
      },
    ],
    detailItem: {
      id: 'f-dev-2-detail',
      title: '报价平台 V2 性能调优与缺陷清零',
      status: '优化中',
      deliverables: 'SQL 性能压测达标报告',
      content: '已完成慢查询定位，新增 2 处复合索引，压测响应耗时已改善 40%。',
      entities: {
        projects: ['报价平台 V2'],
        products: ['报价模块'],
        people: ['李四'],
      },
      materials: [
        {
          id: 'fm-5',
          name: '报价平台性能压测报告.pdf',
          type: 'document',
          size: '3.2 MB',
        },
      ],
      aiAnalysis: {
        completenessScore: 88,
        intensityScore: 88,
        riskLevel: '中风险',
        highlight: '性能指标正在收敛，需持续压测。',
        suggestions: ['增加 Redis 缓存覆盖'],
      },
    },
  },
  {
    id: 'f-mkt-1',
    title: '宏远科技｜大客户续约意向停滞与方案修改',
    deptId: 'mkt',
    deptName: '市场部',
    owner: '周华',
    ownerAvatar: '周',
    ownerRole: '资深市场经理',
    riskLevel: '低风险',
    riskColor: 'yellow',
    category: '商机跟进',
    summary:
      '宏远科技连续 3 周未推进二期方案签署，客户反馈预算审批流程延长，需协助提供 ROI 投资回报分析。',
    aiJudgement: '大客户商机跟进节奏放缓，存在因预算紧缩被竞争对手切入的隐患。',
    aiSuggestion:
      '建议联合产品经理补充 ROI 计算器文档，下周二前拜访客户决策链。',
    dueDate: '2026-08-18 (下周二)',
    weekId: '2026-w32',
    entities: {
      customers: ['宏远科技'],
      projects: ['宏远二期拓展'],
      people: ['周华'],
    },
    materials: [
      {
        id: 'fm-6',
        name: '宏远科技 ROI 投资回报测算.xlsx',
        type: 'document',
        size: '1.1 MB',
      },
    ],
    detailItem: {
      id: 'f-mkt-1-detail',
      title: '宏远科技续约商机突破与 ROI 方案拜访',
      status: '跟进中',
      deliverables: '完成决策链拜访与方案提报',
      content:
        '已完成 ROI 测算表初稿，计划下周二前往客户现场进行二期方案讲解。',
      entities: {
        customers: ['宏远科技'],
        projects: ['宏远二期拓展'],
        people: ['周华'],
      },
      materials: [
        {
          id: 'fm-6',
          name: '宏远科技 ROI 投资回报测算.xlsx',
          type: 'document',
          size: '1.1 MB',
        },
      ],
      aiAnalysis: {
        completenessScore: 80,
        intensityScore: 78,
        riskLevel: '低风险',
        highlight: '商机跟进顺畅，准备资料充分。',
        suggestions: ['引入技术专家协同现场交流'],
      },
    },
  },
]);

// 过滤后的重点关注事项列表
const filteredRiskItems = computed(() => {
  return allRiskItems.value.filter((item) => {
    // 部门过滤
    const deptMatch =
      activeDeptId.value === 'all' || item.deptId === activeDeptId.value;
    // 风险级别过滤
    const levelMatch =
      activeRiskLevel.value === 'all' ||
      (activeRiskLevel.value === 'high' && item.riskLevel === '高风险') ||
      (activeRiskLevel.value === 'medium' && item.riskLevel === '中风险') ||
      (activeRiskLevel.value === 'low' && item.riskLevel === '低风险');

    return deptMatch && levelMatch;
  });
});

// 计算各部门风险事项计数
const deptCounts = computed(() => {
  const counts: Record<string, number> = {
    all: allRiskItems.value.length,
    dev: 0,
    ops: 0,
    impl: 0,
    mkt: 0,
  };
  for (const item of allRiskItems.value) {
    if (counts[item.deptId] !== undefined) {
      counts[item.deptId]!++;
    }
  }
  return counts;
});

// ----------------------------------------------------
// 5. 侧滑抽屉控制 (事项详情 Drawer / 实体 Drawer / 人员画像 Drawer)
// ----------------------------------------------------
// A. 事项详情 Drawer
const detailDrawerOpen = ref(false);
const selectedWorkItem = ref<AiWorkWorkItem | null>(null);

function openWorkItemDetail(item: FocusRiskItem) {
  selectedWorkItem.value = item.detailItem;
  detailDrawerOpen.value = true;
}

// B. 实体 Context Drawer
const entityDrawerOpen = ref(false);
const selectedEntity = ref<EntityPick | null>(null);

function handlePickEntity(type: EntityPick['type'], name: string) {
  if (type === 'people') {
    handlePickPerson(name);
  } else {
    selectedEntity.value = { type, name };
    entityDrawerOpen.value = true;
  }
}

// C. 人员画像 Drawer
const personDrawerOpen = ref(false);
const selectedPersonName = ref<null | string>(null);

function handlePickPerson(name: string) {
  selectedPersonName.value = name;
  personDrawerOpen.value = true;
}
</script>

<template>
  <div
    class="focus-page h-full max-h-[calc(100vh-65px)] overflow-y-auto bg-[#F4F5F7] p-4 pb-16 text-[#1E293B]"
  >
    <!-- 1. 顶栏 Header -->
    <header
      class="mb-4 flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex size-9 items-center justify-center rounded-xl bg-[#FEF2F2] font-bold text-[#EF4444]"
        >
          <Icon icon="lucide:shield-alert" class="size-5" />
        </div>
        <div>
          <h1
            class="margin-none text-base font-bold leading-snug text-[#0F172A]"
          >
            重点关注与风险事项雷达
          </h1>
          <p class="margin-none text-xs text-[#64748B]">
            自动识别跨部门周报中的重复故障、无合同服务、接口卡点与承诺偏差（共识别
            {{ allRiskItems.length }} 项风险事项）
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Tag
          color="red"
          class="rounded-full border-none px-3 py-1 text-xs font-bold"
        >
          ● {{ deptCounts.all }} 项重点风险
        </Tag>
      </div>
    </header>

    <!-- 2. 主体 Grid 布局：左侧时间树 + 右侧主工作区 -->
    <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[240px_1fr]">
      <!-- 左侧时间树边栏 (纯白底色，支持月份折叠与周次选择) -->
      <aside
        class="time-tree-sidebar sticky top-0 max-h-[calc(100vh-140px)] self-start overflow-y-auto rounded-2xl border border-[#E5E7EB] bg-white p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
      >
        <div
          class="sidebar-header flex items-center justify-between border-b border-[#F1F5F9] pb-3"
        >
          <span
            class="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
          >
            <Icon icon="lucide:calendar-days" class="size-4 text-[#EF4444]" />
            周报归档节点
          </span>
          <span class="text-[10px] text-[#94A3B8]">按月折叠</span>
        </div>

        <div class="time-tree-body mt-2.5 space-y-2.5">
          <div
            v-for="group in timeTreeData"
            :key="group.monthLabel"
            class="month-group-item"
          >
            <!-- 可点击折叠的月份标题 -->
            <button
              type="button"
              class="month-header-btn flex w-full cursor-pointer items-center justify-between rounded px-1.5 py-1 transition-colors hover:bg-[#F8FAFC]"
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
                <span>{{ group.monthLabel }}</span>
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

            <!-- 周节点列表 -->
            <div
              v-show="!group.collapsed"
              class="weeks-list ml-2 mt-1 space-y-1 border-l border-[#E2E8F0] pl-2"
            >
              <button
                v-for="week in group.weeks"
                :key="week.id"
                type="button"
                class="week-node-card flex w-full cursor-pointer items-center justify-between rounded-r-lg p-2 text-left transition-all"
                :class="
                  activeWeekId === week.id
                    ? 'border-l-3 shadow-2xs border-l-[#EF4444] bg-[#FEF2F2] pl-2.5 font-bold text-[#991B1B]'
                    : 'pl-2 text-[#475569] hover:bg-[#F8FAFC]'
                "
                @click="selectWeekNode(week)"
              >
                <div class="flex min-w-0 flex-col">
                  <span class="truncate text-xs">{{ week.weekLabel }}</span>
                  <span
                    class="text-[10px]"
                    :class="
                      activeWeekId === week.id
                        ? 'text-[#B91C1C]'
                        : 'text-[#94A3B8]'
                    "
                  >
                    {{ week.dateRange.split(' -- ')[0] }}
                  </span>
                </div>

                <Tag color="red" class="scale-85 margin-none font-bold">
                  {{ week.riskCount }}项
                </Tag>
              </button>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧主工作区 (部门过滤器 + 重点关注/风险事项卡片列表) -->
      <main class="right-main-panel min-w-0 flex-1 space-y-4">
        <!-- 部门与级别过滤器卡片 -->
        <section
          class="filter-card space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
        >
          <!-- 第一行：部门选择 Tabs -->
          <div
            class="flex items-center gap-2 overflow-x-auto border-b border-[#F1F5F9] pb-1"
          >
            <span
              class="flex flex-none items-center gap-1 text-xs font-bold text-[#64748B]"
            >
              <Icon icon="lucide:building-2" class="size-3.5 text-[#2563EB]" />
              部门维度:
            </span>

            <button
              v-for="dept in departments"
              :key="dept.id"
              type="button"
              class="flex flex-none cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all"
              :class="
                activeDeptId === dept.id
                  ? 'shadow-xs bg-[#2563EB] font-bold text-white'
                  : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9]'
              "
              @click="activeDeptId = dept.id"
            >
              <span>{{ dept.name }}</span>
              <span class="text-[10px] opacity-85">
                ({{ deptCounts[dept.id] || 0 }})
              </span>
            </button>
          </div>

          <!-- 第二行：风险级别快速筛选 -->
          <div class="flex items-center gap-2 overflow-x-auto pt-0.5">
            <span
              class="flex flex-none items-center gap-1 text-xs font-bold text-[#64748B]"
            >
              <Icon icon="lucide:filter" class="size-3.5 text-[#2563EB]" />
              风险级别:
            </span>

            <button
              v-for="lvl in [
                { id: 'all', label: '全部级别' },
                { id: 'high', label: '🔴 高风险' },
                { id: 'medium', label: '🟠 中风险' },
                { id: 'low', label: '🟡 低风险' },
              ]"
              :key="lvl.id"
              type="button"
              class="flex-none cursor-pointer rounded-lg border px-3 py-1 text-xs transition-all"
              :class="
                activeRiskLevel === lvl.id
                  ? 'shadow-2xs border-[#2563EB] bg-[#EFF6FF] font-bold text-[#1E40AF]'
                  : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
              "
              @click="activeRiskLevel = lvl.id"
            >
              {{ lvl.label }}
            </button>
          </div>
        </section>

        <!-- 重点关注/风险事项列表 (卡片化，包含负责人、AI诊断、实体标签，点击唤起侧滑栏) -->
        <section class="space-y-4">
          <div
            v-for="item in filteredRiskItems"
            :key="item.id"
            class="risk-item-card group cursor-pointer space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] transition-all hover:border-[#2563EB]"
            @click="openWorkItemDetail(item)"
          >
            <!-- 1. 卡片 Header：风险图标 + 标题 + 风险/类型 Badge -->
            <div
              class="flex items-start justify-between border-b border-[#F1F5F9] pb-3"
            >
              <div class="flex items-start gap-3">
                <div
                  class="shadow-2xs mt-0.5 flex size-10 flex-none items-center justify-center rounded-xl text-lg font-bold"
                  :class="
                    item.riskColor === 'red'
                      ? 'bg-[#FEF2F2] text-[#EF4444]'
                      : item.riskColor === 'orange'
                        ? 'bg-[#FFFBEB] text-[#D97706]'
                        : 'bg-[#EFF6FF] text-[#2563EB]'
                  "
                >
                  <Icon icon="lucide:triangle-alert" class="size-5" />
                </div>

                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <h2
                      class="margin-none text-sm font-bold text-[#0F172A] transition-colors group-hover:text-[#2563EB]"
                    >
                      {{ item.title }}
                    </h2>
                    <Tag
                      :color="
                        item.riskColor === 'red'
                          ? 'error'
                          : item.riskColor === 'orange'
                            ? 'warning'
                            : 'processing'
                      "
                      class="margin-none scale-90 border-none font-bold"
                    >
                      {{ item.riskLevel }}
                    </Tag>
                    <Tag
                      class="margin-none scale-90 border-none bg-[#F1F5F9] font-medium text-[#475569]"
                    >
                      {{ item.category }}
                    </Tag>
                  </div>

                  <!-- 负责人与所属部门 -->
                  <div
                    class="margin-none mt-1.5 flex items-center gap-3 text-xs text-[#64748B]"
                  >
                    <span
                      class="flex items-center gap-1.5 font-medium text-[#0F172A]"
                    >
                      <span
                        class="flex size-5 cursor-pointer items-center justify-center rounded-full bg-[#2563EB] text-[10px] font-bold text-white hover:opacity-80"
                        @click.stop="handlePickPerson(item.owner)"
                      >
                        {{ item.ownerAvatar }}
                      </span>
                      <span
                        class="cursor-pointer text-[#2563EB] hover:underline"
                        @click.stop="handlePickPerson(item.owner)"
                      >
                        负责人：{{ item.owner }}
                      </span>
                    </span>
                    <span>·</span>
                    <span>
                      部门：{{ item.deptName }} ({{ item.ownerRole }})
                    </span>
                    <span>·</span>
                    <span
                      class="flex items-center gap-1 font-medium text-[#EF4444]"
                    >
                      <Icon icon="lucide:clock" class="size-3.5" />
                      节点目标：{{ item.dueDate }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 右侧穿透查看详情按钮 -->
              <Button
                type="primary"
                size="small"
                class="shadow-2xs flex flex-none items-center gap-1 rounded-xl border-none bg-[#EFF6FF] px-3.5 py-1 text-xs font-bold text-[#2563EB] hover:bg-[#2563EB] hover:text-white"
                @click.stop="openWorkItemDetail(item)"
              >
                <Icon icon="lucide:panel-right-open" class="size-3.5" />
                查看事项详情 (侧滑)
              </Button>
            </div>

            <!-- 2. 正文摘要描述 -->
            <p class="margin-none text-xs leading-relaxed text-[#334155]">
              {{ item.summary }}
            </p>

            <!-- 3. AI 诊断与建议 Callout -->
            <div
              class="space-y-1.5 rounded-xl border p-3.5 text-xs"
              :class="
                item.riskColor === 'red'
                  ? 'border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]'
                  : item.riskColor === 'orange'
                    ? 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]'
                    : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]'
              "
            >
              <div class="flex items-center gap-1.5 text-xs font-bold">
                <Icon icon="lucide:sparkles" class="size-4" />
                <span>AI 判定与建议：</span>
              </div>
              <p class="margin-none leading-relaxed">
                <strong>AI 判定：</strong>
                {{ item.aiJudgement }}
              </p>
              <p class="margin-none leading-relaxed">
                <strong>改进建议：</strong>
                {{ item.aiSuggestion }}
              </p>
            </div>

            <!-- 4. 底部栏：关联实体与关联资料 -->
            <div
              class="flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F5F9] pt-1 text-xs"
            >
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-[11px] font-medium text-[#94A3B8]">
                  关联实体:
                </span>
                <EntityTags
                  :entities="item.entities"
                  :show-group-title="false"
                  :clickable="true"
                  variant="minimal"
                  @pick="(p) => handlePickEntity(p.type, p.name)"
                />
              </div>

              <div
                v-if="item.materials && item.materials.length > 0"
                class="flex items-center gap-2"
              >
                <span class="text-[11px] font-medium text-[#94A3B8]">
                  证明资料:
                </span>
                <MaterialList
                  :materials="item.materials"
                  :show-label="false"
                  variant="minimal"
                />
              </div>
            </div>
          </div>

          <!-- 无数据提示 -->
          <div
            v-if="filteredRiskItems.length === 0"
            class="space-y-2 rounded-2xl border border-[#E2E8F0] bg-white p-12 text-center text-[#94A3B8]"
          >
            <Icon
              icon="lucide:check-circle-2"
              class="mx-auto size-10 text-[#059669]"
            />
            <p class="margin-none text-xs font-bold text-[#0F172A]">
              该筛选条件下暂无风险事项
            </p>
            <p class="margin-none text-[11px]">
              已识别项均已排查闭环或暂无对应部门卡点
            </p>
          </div>
        </section>
      </main>
    </div>

    <!-- 事项详情侧滑栏 Drawer (WorkItemDetailDrawer) -->
    <WorkItemDetailDrawer
      v-model:open="detailDrawerOpen"
      :item="selectedWorkItem"
    />

    <!-- 实体 Context 穿透 Drawer (EntityContextDrawer) -->
    <EntityContextDrawer
      v-model:open="entityDrawerOpen"
      :entity="selectedEntity"
      mode="team"
    />

    <!-- 人员画像 Drawer (PersonDetailDrawer) -->
    <PersonDetailDrawer
      v-model:open="personDrawerOpen"
      :person-name="selectedPersonName"
    />
  </div>
</template>

<style scoped>
.focus-page {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
