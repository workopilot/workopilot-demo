<!-- 团队周报 AI 汇总驾驶舱 (支持左侧周次树、中间 AI 生成的多部门周报动态切换、右侧部门人员评分排名榜及实体穿透) -->
<script setup lang="ts">
import type { EntityPick } from '../components/entity-context-drawer.vue';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Tag } from 'ant-design-vue';

import EntityContextDrawer from '../components/entity-context-drawer.vue';
import PersonDetailDrawer from '../components/person-detail-drawer.vue';

// ----------------------------------------------------
// 1. 左侧时间树数据 (月份与周节点)
// ----------------------------------------------------
interface WeekNode {
  id: string;
  year: number;
  month: number;
  weekNum: number;
  weekLabel: string;
  dateRange: string;
  isCurrent?: boolean;
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
        isCurrent: true,
      },
      {
        id: '2026-w31',
        year: 2026,
        month: 8,
        weekNum: 31,
        weekLabel: '2026-W31 周报',
        dateRange: '2026-07-27 -- 2026-08-02',
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
      },
    ],
  },
]);

const activeWeekId = ref('2026-w32');
function selectWeekNode(week: WeekNode) {
  activeWeekId.value = week.id;
}

// ----------------------------------------------------
// 2. 部门过滤器与数据
// ----------------------------------------------------
interface DepartmentInfo {
  id: string;
  name: string;
  memberCount: number;
  submittedCount: number;
  avgScore: number;
  riskCount: number;
}

const departments = ref<DepartmentInfo[]>([
  {
    id: 'ops',
    name: '运维部',
    memberCount: 5,
    submittedCount: 5,
    avgScore: 88,
    riskCount: 3,
  },
  {
    id: 'dev',
    name: '产研部',
    memberCount: 12,
    submittedCount: 11,
    avgScore: 90,
    riskCount: 1,
  },
  {
    id: 'sol',
    name: '实施部',
    memberCount: 6,
    submittedCount: 6,
    avgScore: 91,
    riskCount: 1,
  },
  {
    id: 'mkt',
    name: '市场部',
    memberCount: 6,
    submittedCount: 5,
    avgScore: 84,
    riskCount: 1,
  },
]);

const activeDeptId = ref('ops');

const activeDept = computed(() => {
  return (
    departments.value.find((d) => d.id === activeDeptId.value) ||
    departments.value[0]!
  );
});

// ----------------------------------------------------
// 3. 部门 AI 周报结构化模板数据
// ----------------------------------------------------
interface RiskCard {
  entityType: EntityPick['type'];
  entityName: string;
  title: string;
  riskLevel: string;
  riskColor: 'orange' | 'red' | 'yellow';
  bulletTitle?: string;
  bullets?: string[];
  description?: string;
  aiJudgement: string;
  suggestions: string[];
}

interface DepartmentAiReport {
  statusTag: string;
  statusColor: 'error' | 'success' | 'warning';
  overview: string;
  risks: RiskCard[];
  qualityAlerts?: {
    conclusion?: string;
    items: string[];
    title: string;
  };
  normalItems: string[];
  personnelInsights: {
    content: string;
    personName: string;
    tag: string;
    tagColor: 'blue' | 'green' | 'orange';
  }[];
  nextActions: string[];
  executiveSummary: string;
  executiveHighlight: string;
}

const deptAiReports = computed<Record<string, DepartmentAiReport>>(() => ({
  // A. 【运维部 AI 周报】
  ops: {
    statusTag: '本周状态：🟡 整体稳定，3 项问题需关注',
    statusColor: 'warning',
    overview:
      '本周共处理客户问题 126 项，整体响应正常，重大故障 1 起，已恢复。AI 识别出 1 项客户经营异常、1 项重复故障风险、1 项人员负荷风险。',
    risks: [
      {
        entityType: 'customers',
        entityName: '华辰科技',
        title: '暂停客户仍持续产生运维投入',
        riskLevel: '高',
        riskColor: 'red',
        bulletTitle: '销售侧已将客户状态更新为「暂停续费」，但本周运维仍提供：',
        bullets: [
          '客户问题回复 8 次',
          '远程处理 3 次',
          '上门服务 1 次 (预计投入约 1.5 人天)',
        ],
        aiJudgement:
          '客户商业状态与运维服务状态不一致，存在无合同持续投入服务资源的风险。',
        suggestions: [
          '与销售确认当前服务边界。如已过免费服务期，建议调整服务等级，并推动销售重新确认续费意向。',
        ],
      },
      {
        entityType: 'customers',
        entityName: '鑫达集团',
        title: '同类问题连续出现',
        riskLevel: '重复故障',
        riskColor: 'orange',
        description:
          '本周发生 5 次“审批消息推送失败”，过去 3 周累计出现 11 次。虽然每次均已恢复，但当前处理方式仍以临时修复为主。',
        aiJudgement:
          '该问题已由普通工单转变为重复性产品问题，继续按单次故障处理将持续消耗运维资源。',
        suggestions: [
          '升级为产品缺陷，安排研发进行根因排查，不再由运维重复处理。',
        ],
      },
      {
        entityType: 'people',
        entityName: '王强',
        title: '工作负荷偏高',
        riskLevel: '负荷预警',
        riskColor: 'orange',
        description:
          '王强本周处理 38 项客户问题，占部门总量约 30%，同时承担 2 次现场支持。当前暂无明显服务质量下降，但工作量连续两周高于团队平均水平。',
        aiJudgement: '连续高负荷运转易引发关键人员疲劳与服务质量隐患。',
        suggestions: [
          '适当分流常规客户问题，避免关键客户支持长期集中在单一人员。',
        ],
      },
    ],
    qualityAlerts: {
      title: '🟡 服务质量提醒',
      items: [
        '3 个工单首次响应超过目标时间',
        '2 个客户问题连续两周未彻底关闭',
        '本周新增 7 个重复问题，其中 4 个集中在消息与接口模块',
        '暂未发现明显客户投诉升级',
      ],
      conclusion:
        '整体服务质量稳定，但重复问题比例有所增加，建议减少“解决一次算一次”的处理方式。',
    },
    normalItems: [
      '核心客户重大问题均已恢复',
      '重点客户现场支持按计划完成',
      '本周无严重 SLA 违约',
      '新上线客户运行状态正常',
    ],
    personnelInsights: [
      {
        personName: '李明',
        tag: '表现突出',
        tagColor: 'green',
        content:
          '本周处理 2 起复杂接口问题，并主动补充知识库文档，可减少后续重复排查。',
      },
      {
        personName: '王强',
        tag: '建议关注负荷',
        tagColor: 'orange',
        content: '问题处理量连续两周偏高，建议进行适当任务分流。',
      },
    ],
    nextActions: [
      '确认华辰科技暂停后的服务策略',
      '推动鑫达集团重复故障进入研发缺陷处理',
      '分流王强部分客户支持工作',
      '关注连续未关闭工单，避免演变为客户投诉',
    ],
    executiveSummary:
      '运维部门当前不存在重大服务风险，但已经出现“客户状态与服务投入不一致”和“重复问题持续消耗人力”两类管理问题。',
    executiveHighlight:
      '👉 下周重点不应继续增加运维处理量，而应优先减少无效服务投入和重复性故障。',
  },

  // B. 【产研部 AI 周报】
  dev: {
    statusTag: '本周状态：🟡 整体正常，1 项跨部门交付风险需关注',
    statusColor: 'warning',
    overview:
      '本周版本研发整体按计划推进，AI 在销售与研发周报交叉分析中发现 1 项客户承诺尚未进入研发计划。',
    risks: [
      {
        entityType: 'customers',
        entityName: '华科集团',
        title: '销售已承诺功能，但研发侧暂无对应计划',
        riskLevel: '跨部门风险',
        riskColor: 'red',
        bulletTitle: '销售周报显示：',
        bullets: [
          '客户提出“批量导入审批单”功能需求',
          '销售已向客户反馈预计 9 月版本支持',
          '该功能被作为续约谈判的重要条件',
        ],
        description:
          '研发侧当前情况：本周需求池中未发现对应需求，暂无产品评审记录，9 月版本排期中未安排该功能，且当前版本资源已接近满负荷。',
        aiJudgement:
          '销售已形成明确客户预期，但产研侧尚未进入需求评估和开发排期，存在后续无法按期交付的风险。如果临近交付再临时插入，可能进一步影响当前版本计划。',
        suggestions: [
          '本周确认销售承诺的具体范围和时间',
          '由产品经理补充需求评估',
          '如无法按原时间交付，应尽早由销售调整客户预期',
          '后续重要客户承诺建议增加“研发确认”环节',
        ],
      },
    ],
    normalItems: [
      '主线 SPRINT 研发按期推进，代码单元测试覆盖率达 91.5%',
      '智能周报工作台 UI 与接口联调顺利完成',
      '核心底层模块未发现严重阻塞类 Bug',
    ],
    personnelInsights: [
      {
        personName: '王五',
        tag: '架构卓越',
        tagColor: 'green',
        content: '完成二期重构设计文档编写，高分通过评审。',
      },
      {
        personName: '张三',
        tag: '重点协助',
        tagColor: 'orange',
        content: '负责的宏远科技接口跟进存在外部卡点，需协助催办。',
      },
    ],
    nextActions: [
      '华科集团需求是否正式进入评审',
      '是否需要调整 9 月版本范围',
      '是否存在其他“销售已承诺、研发未排期”的类似事项',
    ],
    executiveSummary:
      '当前问题不是研发进度异常，而是“销售承诺与研发计划尚未对齐”。',
    executiveHighlight: '👉 建议优先处理客户预期，避免问题在交付阶段暴露。',
  },

  // C. 【实施部 AI 周报】
  sol: {
    statusTag: '本周状态：🟡 项目整体可控，1 个项目存在范围失控风险',
    statusColor: 'warning',
    overview:
      '本周实施项目整体正常，AI 识别出华辰集团项目需求持续扩张，但合同及商务范围尚未同步调整。',
    risks: [
      {
        entityType: 'projects',
        entityName: '华辰集团',
        title: '新增需求持续增加，合同范围未同步变更',
        riskLevel: '范围风险',
        riskColor: 'red',
        bulletTitle: '近 3 周实施周报显示，客户陆续新增：',
        bullets: [
          '新增 2 类审批流程',
          '增加移动端特殊展示需求',
          '增加历史数据迁移范围',
          '新增 3 张经营分析报表',
          '要求额外提供一次现场培训',
        ],
        description:
          '实施团队目前已投入部分工作，本周新增投入约 2 人天。销售及合同侧暂未发现：补充报价、合同变更、项目范围确认单、新增交付周期确认。',
        aiJudgement:
          '项目实际交付范围正在持续扩大，但商务范围没有同步变化。若继续默认承接，可能导致项目延期、实施成本增加、后续验收边界不清。',
        suggestions: [
          '暂停继续接受非原合同范围内的新需求',
          '与销售共同确认新增需求清单',
          '区分“合同内调整”和“新增收费需求”',
          '对涉及较大工作量的需求推动补充报价或变更单',
          '同步调整项目交付时间，避免原计划失真',
        ],
      },
    ],
    qualityAlerts: {
      title: '🟡 项目提醒',
      items: [
        '目前项目总体进度约 70%',
        '如果新增需求全部纳入当前阶段，预计会对原上线时间产生影响',
      ],
      conclusion: '需严格管理项目范围，避免无界蔓延。',
    },
    normalItems: [
      '客户硬件机房摸底完成，网络拓扑确认无误',
      '实施团队现场交付满意度保持 95% 以上',
    ],
    personnelInsights: [
      {
        personName: '张伟',
        tag: '沟通顺畅',
        tagColor: 'green',
        content: '积极与客户现场负责人保持良好沟通，关系稳固。',
      },
    ],
    nextActions: [
      '新增需求是否完成范围确认',
      '销售是否启动商务变更',
      '项目上线时间是否需要重新确认',
      '实施团队是否仍存在未授权的额外投入',
    ],
    executiveSummary:
      '当前最大的风险不是项目做不完，而是“做得越来越多，但合同和收入没有跟着增加”。',
    executiveHighlight: '👉 建议先明确边界，再继续投入。',
  },

  // D. 【市场部 AI 周报】
  mkt: {
    statusTag: '本周状态：🟡 整体推进，1 项线索转化效率需要提升',
    statusColor: 'warning',
    overview:
      '本周新增商务线索 18 条，AI 识别出部分高价值线索跟进频次不足，需要重点协助线索二次挖掘。',
    risks: [
      {
        entityType: 'customers',
        entityName: '宏远科技',
        title: '连续 3 周无实质推进，方案沟通卡点',
        riskLevel: '推进卡点',
        riskColor: 'orange',
        description:
          '第 1 周完成产品演示；第 2 周等待反馈；第 3 周再次沟通仍未确认下一步节点。',
        aiJudgement: '跟进动作重复，尚未接触明确决策人，存在商机停滞风险。',
        suggestions: [
          '建议由主管参与下一次沟通，推动确认决策人、预算及预计采购时间。',
        ],
      },
    ],
    normalItems: [
      '行业展会收集到 18 条高质量商务线索',
      '宣传白皮书与 Demo 视频制作完毕并发布',
    ],
    personnelInsights: [
      {
        personName: '李四',
        tag: '拓展积极',
        tagColor: 'green',
        content: '完成了 3 场客户线上面对面演示，反馈良好。',
      },
    ],
    nextActions: [
      '安排主管协同拜访宏远科技关键决策人',
      '完成本月商机管道清理与复盘',
    ],
    executiveSummary:
      '市场拓展整体态势良好，但需警惕大客户跟进周期拉长导致的转化率下降。',
    executiveHighlight: '👉 建议建立针对高价值卡点客户的专项协同拜访机制。',
  },
}));

const currentAiReport = computed(() => {
  return deptAiReports.value[activeDeptId.value] || deptAiReports.value.ops!;
});

// ----------------------------------------------------
// 4. 右侧侧边栏：部门人员周报评分与排名榜
// ----------------------------------------------------
interface MemberRank {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  score: null | number;
  status: 'approved' | 'pending' | 'unsubmitted';
  tag: string;
  tagColor: 'blue' | 'default' | 'green' | 'orange' | 'red';
  summary: string;
}

const deptRankings = computed<Record<string, MemberRank[]>>(() => ({
  ops: [
    {
      rank: 1,
      id: 'li-ming',
      name: '李明',
      avatar: '李',
      score: 95,
      status: 'approved',
      tag: '表现突出',
      tagColor: 'green',
      summary: '处理 2 起复杂接口问题，主动补全知识库。',
    },
    {
      rank: 2,
      id: 'zhao-liu',
      name: '赵六',
      avatar: '赵',
      score: 92,
      status: 'approved',
      tag: '交付稳健',
      tagColor: 'green',
      summary: '响应及时，重大故障处理迅速。',
    },
    {
      rank: 3,
      id: 'sun-min',
      name: '孙敏',
      avatar: '孙',
      score: 88,
      status: 'approved',
      tag: '正常推进',
      tagColor: 'blue',
      summary: '日常巡检与环境维稳正常。',
    },
    {
      rank: 4,
      id: 'wang-qiang',
      name: '王强',
      avatar: '王',
      score: 82,
      status: 'pending',
      tag: '负荷偏高',
      tagColor: 'orange',
      summary: '工单处理量占部门 30%，建议分流。',
    },
    {
      rank: 5,
      id: 'zhou-j',
      name: '周杰',
      avatar: '周',
      score: 80,
      status: 'pending',
      tag: '需关切',
      tagColor: 'orange',
      summary: '工单首次响应时效稍有延迟。',
    },
  ],
  dev: [
    {
      rank: 1,
      id: 'wang-wu',
      name: '王五',
      avatar: '王',
      score: 95,
      status: 'approved',
      tag: '架构卓越',
      tagColor: 'green',
      summary: '完成二期重构设计文档编写，高分通过。',
    },
    {
      rank: 2,
      id: 'li-si',
      name: '李四',
      avatar: '李',
      score: 88,
      status: 'pending',
      tag: '进度良好',
      tagColor: 'blue',
      summary: '完成需求分析与测试脚本开发。',
    },
    {
      rank: 3,
      id: 'zhang-san',
      name: '张三',
      avatar: '张',
      score: 85,
      status: 'pending',
      tag: '重点协助',
      tagColor: 'orange',
      summary: '外部接口协调卡点，需主管协助。',
    },
    {
      rank: 4,
      id: 'chen-chen',
      name: '陈晨',
      avatar: '陈',
      score: null,
      status: 'unsubmitted',
      tag: '未提交',
      tagColor: 'default',
      summary: '暂未提交本周周报。',
    },
  ],
  sol: [
    {
      rank: 1,
      id: 'zhang-wei',
      name: '张伟',
      avatar: '张',
      score: 96,
      status: 'approved',
      tag: '现场交付佳',
      tagColor: 'green',
      summary: '现场环境部署完备，客户满意度高。',
    },
    {
      rank: 2,
      id: 'wang-min',
      name: '王敏',
      avatar: '王',
      score: 91,
      status: 'approved',
      tag: '细致严谨',
      tagColor: 'green',
      summary: '完成历史数据迁移预审。',
    },
    {
      rank: 3,
      id: 'liu-yang',
      name: '刘洋',
      avatar: '刘',
      score: 89,
      status: 'pending',
      tag: '按计划',
      tagColor: 'blue',
      summary: '完成培训文档与操作手册。',
    },
  ],
  mkt: [
    {
      rank: 1,
      id: 'li-si-mkt',
      name: '李四',
      avatar: '李',
      score: 93,
      status: 'approved',
      tag: '线索丰富',
      tagColor: 'green',
      summary: '展会收集 18 条意向线索。',
    },
    {
      rank: 2,
      id: 'zhou-hua',
      name: '周华',
      avatar: '周',
      score: 87,
      status: 'pending',
      tag: '推进中',
      tagColor: 'blue',
      summary: '二期宣传白皮书策划完备。',
    },
  ],
}));

const currentMemberRanks = computed(() => {
  return deptRankings.value[activeDeptId.value] || deptRankings.value.ops!;
});

// ----------------------------------------------------
// 5. 统一实体 Context 穿透 Drawer 控制
// ----------------------------------------------------
const entityDrawerOpen = ref(false);
const selectedEntity = ref<EntityPick | null>(null);

function handlePickEntity(type: EntityPick['type'], name: string) {
  selectedEntity.value = { type, name };
  entityDrawerOpen.value = true;
}

// ----------------------------------------------------
// 6. 人员画像与历周周报预览 Drawer 控制
// ----------------------------------------------------
const personDrawerOpen = ref(false);
const selectedPersonName = ref<null | string>(null);

function handlePickPerson(name: string) {
  selectedPersonName.value = name;
  personDrawerOpen.value = true;
}

function handleEntityOrPerson(type: EntityPick['type'], name: string) {
  if (type === 'people') {
    handlePickPerson(name);
  } else {
    handlePickEntity(type, name);
  }
}
</script>

<template>
  <div
    class="team-weekly-report-page h-full max-h-[calc(100vh-65px)] overflow-y-auto bg-[#F4F5F7] p-4 pb-16 text-[#1E293B]"
  >
    <!-- 1. 顶栏 Header -->
    <header
      class="mb-4 flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex size-9 items-center justify-center rounded-xl bg-[#EFF6FF] font-bold text-[#2563EB]"
        >
          <Icon icon="lucide:bar-chart-3" class="size-5" />
        </div>
        <div>
          <h1
            class="margin-none text-base font-bold leading-snug text-[#0F172A]"
          >
            团队周报 AI 汇总驾驶舱
          </h1>
          <p class="margin-none text-xs text-[#64748B]">
            多部门周报 AI 自动化挖掘、关联风险诊断与全员评分榜
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <span
          class="rounded-full border border-[#A7F3D0] bg-[#ECFDF5] px-3 py-1 text-xs font-bold text-[#047857]"
        >
          🤖 AI 自动深度汇总生成
        </span>
      </div>
    </header>

    <!-- 2. 主三栏结构：左侧时间树 + 中间 AI 部门周报 + 右侧排名榜 -->
    <div class="main-layout flex items-start gap-4">
      <!-- 左侧时间树面板 -->
      <aside
        class="left-tree-panel sticky top-0 max-h-[calc(100vh-140px)] w-60 flex-none self-start overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
      >
        <div
          class="mb-2 flex items-center justify-between border-b border-[#F1F5F9] px-1 pb-2"
        >
          <span
            class="flex items-center gap-1 text-xs font-bold text-[#475569]"
          >
            <Icon icon="lucide:calendar" class="size-3.5 text-[#2563EB]" />
            周报期次列表
          </span>
          <span class="text-[10px] text-[#94A3B8]">全员只读查看</span>
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
                  ? 'border-l-3 border-l-[#2563EB] bg-[#EFF6FF] pl-2.5 font-bold text-[#1E40AF]'
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
                      ? 'text-[#1D4ED8]'
                      : 'text-[#94A3B8]'
                  "
                >
                  {{
                    (week.dateRange || '').split(' -- ')[0] || week.weekLabel
                  }}
                </span>
              </div>

              <span
                v-if="week.isCurrent"
                class="rounded bg-[#DBEAFE] px-1.5 py-0.5 text-[10px] font-medium text-[#2563EB]"
              >
                本周
              </span>
            </button>
          </div>
        </div>
      </aside>

      <!-- 中间主工作区 (部门选择切换 + AI 部门周报正文) -->
      <main class="center-main-panel min-w-0 flex-1 space-y-4">
        <!-- 部门过滤器按钮 -->
        <section
          class="flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white p-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
        >
          <div class="flex items-center gap-2 overflow-x-auto">
            <span
              class="flex flex-none items-center gap-1 text-xs font-bold text-[#64748B]"
            >
              <Icon icon="lucide:building-2" class="size-4 text-[#2563EB]" />
              选择部门切换查看:
            </span>

            <button
              v-for="dept in departments"
              :key="dept.id"
              type="button"
              class="flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all"
              :class="
                activeDeptId === dept.id
                  ? 'shadow-xs bg-[#2563EB] font-bold text-white'
                  : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9]'
              "
              @click="activeDeptId = dept.id"
            >
              <span>{{ dept.name }}</span>
              <span class="text-[10px] opacity-85">
                ({{ dept.submittedCount }}/{{ dept.memberCount }}人)
              </span>
            </button>
          </div>

          <div class="flex items-center gap-2 text-xs">
            <span class="text-[#64748B]">部门均分:</span>
            <span class="font-mono text-sm font-bold text-[#059669]">
              {{ activeDept.avgScore }} 分
            </span>
          </div>
        </section>

        <!-- AI 部门周报正文卡片 (样式严格保持统一高品质) -->
        <article
          class="space-y-6 rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
        >
          <!-- 1. 周报大标题与核心 Overview -->
          <div
            class="space-y-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-5"
          >
            <div
              class="flex items-center justify-between border-b border-[#E2E8F0] pb-3"
            >
              <div>
                <h1
                  class="margin-none flex items-center gap-2 text-xl font-bold leading-tight text-[#0F172A]"
                >
                  <span
                    class="flex size-7 items-center justify-center rounded-xl bg-[#2563EB] text-xs text-white"
                  >
                    <Icon icon="lucide:file-text" class="size-4" />
                  </span>
                  {{ activeDept.name }} AI 周报
                </h1>
                <p class="margin-none mt-1 text-xs text-[#64748B]">
                  统计周期：2026-W32 (08.03 -- 08.09) | 汇总周报来源：{{
                    activeDept.submittedCount
                  }}
                  份提交
                </p>
              </div>

              <Tag
                color="warning"
                class="rounded-full border-none px-3 py-1 text-xs font-bold"
              >
                {{ currentAiReport.statusTag }}
              </Tag>
            </div>

            <p class="margin-none text-xs leading-relaxed text-[#334155]">
              {{ currentAiReport.overview }}
            </p>
          </div>

          <!-- 2. 🔴 重点/跨部门风险 (核心卡片) -->
          <section
            v-if="currentAiReport.risks && currentAiReport.risks.length > 0"
            class="space-y-3"
          >
            <h2
              class="margin-none flex items-center gap-2 border-l-4 border-l-[#EF4444] pl-2.5 text-sm font-bold text-[#0F172A]"
            >
              🔴 重点风险事项与 AI 判断
            </h2>

            <div class="space-y-3">
              <div
                v-for="(risk, index) in currentAiReport.risks"
                :key="risk.title"
                class="shadow-xs space-y-3 rounded-xl border border-[#E2E8F0] bg-white p-4 transition-all hover:border-[#EF4444]"
              >
                <!-- 卡片头部：实名锚点 + 风险类型 -->
                <div class="flex items-center justify-between">
                  <h3
                    class="margin-none flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
                  >
                    <span
                      class="cursor-pointer font-bold text-[#2563EB] hover:underline"
                      @click="
                        handleEntityOrPerson(risk.entityType, risk.entityName)
                      "
                    >
                      {{ index + 1 }}. {{ risk.entityName }}
                    </span>
                    <span class="font-normal text-[#64748B]">
                      ｜ {{ risk.title }}
                    </span>
                  </h3>
                  <Tag :color="risk.riskColor" class="scale-90 font-bold">
                    {{ risk.riskLevel }}
                  </Tag>
                </div>

                <!-- 描述或 Bullet 列表 -->
                <div
                  class="space-y-1 border-l-2 border-[#E2E8F0] pl-2 text-xs leading-relaxed text-[#475569]"
                >
                  <p
                    v-if="risk.bulletTitle"
                    class="margin-none font-semibold text-[#334155]"
                  >
                    {{ risk.bulletTitle }}
                  </p>
                  <ul
                    v-if="risk.bullets && risk.bullets.length > 0"
                    class="margin-none list-disc space-y-0.5 pl-4 text-[11px] text-[#64748B]"
                  >
                    <li v-for="b in risk.bullets" :key="b">{{ b }}</li>
                  </ul>
                  <p
                    v-if="risk.description"
                    class="margin-none pt-1 text-[11px] text-[#475569]"
                  >
                    {{ risk.description }}
                  </p>
                </div>

                <!-- AI 判断与建议网格 -->
                <div class="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                  <div
                    class="rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] p-2.5 text-[#991B1B]"
                  >
                    <strong>AI 判断：</strong>
                    {{ risk.aiJudgement }}
                  </div>

                  <div
                    class="space-y-1 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] p-2.5 text-[#1E40AF]"
                  >
                    <strong>建议负责人：</strong>
                    <ol
                      v-if="risk.suggestions.length > 1"
                      class="margin-none list-decimal space-y-0.5 pl-4 text-[11px]"
                    >
                      <li v-for="s in risk.suggestions" :key="s">{{ s }}</li>
                    </ol>
                    <p v-else class="margin-none inline text-[11px]">
                      {{ risk.suggestions[0] }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 3. 🟡 服务质量/项目提醒 (若有) -->
          <section
            v-if="currentAiReport.qualityAlerts"
            class="space-y-2 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-4"
          >
            <h2
              class="margin-none flex items-center gap-1.5 text-xs font-bold text-[#92400E]"
            >
              <Icon icon="lucide:alert-triangle" class="size-4" />
              {{ currentAiReport.qualityAlerts.title }}
            </h2>
            <ul class="margin-none space-y-1 pl-4 text-xs text-[#78350F]">
              <li v-for="qa in currentAiReport.qualityAlerts.items" :key="qa">
                {{ qa }}
              </li>
            </ul>
            <p
              v-if="currentAiReport.qualityAlerts.conclusion"
              class="margin-none border-t border-[#FDE68A] pt-1 text-[11px] font-medium text-[#B45309]"
            >
              💡 结论：{{ currentAiReport.qualityAlerts.conclusion }}
            </p>
          </section>

          <!-- 4. 🟢 本周正常事项 -->
          <section
            class="space-y-2 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4"
          >
            <h2
              class="margin-none flex items-center gap-1.5 text-xs font-bold text-[#166534]"
            >
              <Icon icon="lucide:check-circle-2" class="size-4" />
              🟢 本周正常事项
            </h2>
            <ul class="margin-none space-y-1 pl-4 text-xs text-[#14532D]">
              <li v-for="item in currentAiReport.normalItems" :key="item">
                {{ item }}
              </li>
            </ul>
          </section>

          <!-- 5. 👥 人员洞察 -->
          <section
            v-if="
              currentAiReport.personnelInsights &&
              currentAiReport.personnelInsights.length > 0
            "
            class="space-y-2"
          >
            <h2
              class="margin-none flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
            >
              <Icon icon="lucide:users" class="size-4 text-[#2563EB]" />
              👥 部门人员洞察
            </h2>

            <div class="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
              <div
                v-for="p in currentAiReport.personnelInsights"
                :key="p.personName"
                class="space-y-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3"
              >
                <span class="flex items-center gap-1 font-bold text-[#0F172A]">
                  <span
                    class="cursor-pointer text-[#2563EB] hover:underline"
                    @click="handlePickPerson(p.personName)"
                  >
                    {{ p.personName }}
                  </span>
                  <Tag
                    :color="p.tagColor"
                    class="margin-none scale-90 font-bold"
                  >
                    {{ p.tag }}
                  </Tag>
                </span>
                <p class="margin-none text-[11px] text-[#64748B]">
                  {{ p.content }}
                </p>
              </div>
            </div>
          </section>

          <!-- 6. 📌 下周管理关注 & AI 综合判断 -->
          <section class="space-y-3 border-t border-[#E2E8F0] pt-2">
            <div class="space-y-2">
              <h2
                class="margin-none flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
              >
                <Icon icon="lucide:target" class="size-4 text-[#2563EB]" />
                📌 下周管理关注动作
              </h2>
              <ol class="margin-none space-y-1 pl-4 text-xs text-[#334155]">
                <li v-for="act in currentAiReport.nextActions" :key="act">
                  {{ act }}
                </li>
              </ol>
            </div>

            <!-- AI 综合判断 -->
            <div
              class="shadow-xs space-y-1 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 text-xs leading-relaxed text-[#1E40AF]"
            >
              <span class="block flex items-center gap-1 text-sm font-bold">
                <Icon icon="lucide:sparkles" class="size-4 text-[#2563EB]" />
                AI 综合判断
              </span>
              <p class="margin-none">
                {{ currentAiReport.executiveSummary }}
              </p>
              <p class="margin-none pt-1 font-bold text-[#1D4ED8]">
                {{ currentAiReport.executiveHighlight }}
              </p>
            </div>
          </section>
        </article>
      </main>

      <!-- 右侧侧边栏：部门人员周报评分排名榜 -->
      <aside
        class="right-rank-panel sticky top-0 max-h-[calc(100vh-140px)] w-72 flex-none space-y-4 self-start overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
      >
        <div
          class="flex items-center justify-between border-b border-[#F1F5F9] pb-2"
        >
          <h2
            class="margin-none flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
          >
            <Icon icon="lucide:trophy" class="size-4 text-[#D97706]" />
            {{ activeDept.name }}周报评分榜
          </h2>
          <span class="font-mono text-[10px] text-[#64748B]">按分排序</span>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="item in currentMemberRanks"
            :key="item.id"
            class="hover:shadow-xs cursor-pointer space-y-1.5 rounded-xl border p-3 transition-all"
            :class="
              item.rank === 1
                ? 'border-[#FDE68A] bg-[#FFFBEB]'
                : item.rank === 2
                  ? 'border-[#E2E8F0] bg-[#F8FAFC]'
                  : item.rank === 3
                    ? 'border-[#FFEDD5] bg-[#FFF7ED]'
                    : 'border-[#E2E8F0] bg-white'
            "
            @click="handlePickPerson(item.name)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span
                  class="flex size-5 items-center justify-center rounded-full text-[10px] font-bold"
                  :class="
                    item.rank === 1
                      ? 'bg-[#F59E0B] text-white'
                      : item.rank === 2
                        ? 'bg-[#94A3B8] text-white'
                        : item.rank === 3
                          ? 'bg-[#D97706] text-white'
                          : 'bg-[#E2E8F0] text-[#64748B]'
                  "
                >
                  {{ item.rank }}
                </span>

                <span class="text-xs font-bold text-[#0F172A]">
                  {{ item.name }}
                </span>
              </div>

              <div class="flex items-center gap-1.5">
                <Tag
                  :color="item.tagColor"
                  class="margin-none scale-90 font-medium"
                >
                  {{ item.tag }}
                </Tag>
                <span
                  v-if="item.score"
                  class="font-mono text-xs font-bold text-[#059669]"
                >
                  {{ item.score }}分
                </span>
                <span v-else class="text-[10px] text-[#94A3B8]">未分</span>
              </div>
            </div>

            <p
              class="margin-none line-clamp-2 pl-7 text-[11px] leading-tight text-[#64748B]"
            >
              {{ item.summary }}
            </p>
          </div>
        </div>
      </aside>
    </div>

    <!-- 统一实体 Context 穿透 Drawer -->
    <EntityContextDrawer
      v-model:open="entityDrawerOpen"
      :entity="selectedEntity"
    />

    <!-- 人员画像与历周周报预览 Drawer -->
    <PersonDetailDrawer
      v-model:open="personDrawerOpen"
      :person-name="selectedPersonName"
    />
  </div>
</template>

<style scoped>
.team-weekly-report-page {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
