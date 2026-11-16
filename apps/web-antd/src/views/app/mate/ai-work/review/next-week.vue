<!-- 全团队下周精力聚焦与排期驾驶舱 (NextWeek.vue) -->
<!-- 支持【大团队极简高密矩阵】与【微观卡片】模式，解决 50+ 人多项目/多部门展不开的痛点 -->
<script setup lang="ts">
import type { EntityPick } from '../components/entity-context-drawer.vue';

import type { AiWorkWorkItem } from '#/types/ai-work';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Progress, Tag, Tooltip } from 'ant-design-vue';

import EntityContextDrawer from '../components/entity-context-drawer.vue';
import EntityTags from '../components/entity-tags.vue';
import PersonDetailDrawer from '../components/person-detail-drawer.vue';
import WorkItemDetailDrawer from '../components/work-item-detail-drawer.vue';

// ----------------------------------------------------
// 1. 数据结构定义
// ----------------------------------------------------
export interface NextWeekCommitment {
  id: string;
  code: string;
  title: string;
  deptId: string;
  deptName: string;
  roleGroup:
    | '交付实施组'
    | '前端开发组'
    | '后端开发组'
    | '市场商务组'
    | '运维保障组';
  owner: string;
  ownerAvatar: string;
  ownerRole: string;
  project: string;
  customer?: string;
  dueDate: string;
  priority: '前置攻坚' | '常规推进' | '紧急交付' | '风险防范';
  priorityColor: 'blue' | 'orange' | 'purple' | 'red';
  summary: string;
  entities: {
    customers?: string[];
    people?: string[];
    products?: string[];
    projects?: string[];
  };
  detailItem: AiWorkWorkItem;
}

interface ProjectHeatmap {
  id: string;
  name: string;
  peopleCount: number;
  commitmentCount: number;
  percentage: number;
  color: string;
  status: '主力攻坚' | '即将受验' | '稳定迭代' | '资源受限';
}

interface CustomerHeatmap {
  id: string;
  name: string;
  peopleCount: number;
  commitmentCount: number;
  riskStatus: '合同失配' | '商机攻坚' | '正常保驾' | '需要关注';
  riskColor: 'blue' | 'green' | 'orange' | 'red';
}

// ----------------------------------------------------
// 2. 热力概览数据 (项目与客户分布)
// ----------------------------------------------------
const projectHeatmaps = ref<ProjectHeatmap[]>([
  {
    id: 'p-1',
    name: '报价平台 V2',
    peopleCount: 8,
    commitmentCount: 14,
    percentage: 42,
    color: '#2563EB',
    status: '主力攻坚',
  },
  {
    id: 'p-2',
    name: '华达智能打印',
    peopleCount: 5,
    commitmentCount: 8,
    percentage: 24,
    color: '#059669',
    status: '稳定迭代',
  },
  {
    id: 'p-3',
    name: '客户 B 集成',
    peopleCount: 4,
    commitmentCount: 6,
    percentage: 18,
    color: '#D97706',
    status: '资源受限',
  },
  {
    id: 'p-4',
    name: '长鑫5期打印',
    peopleCount: 3,
    commitmentCount: 4,
    percentage: 16,
    color: '#7C3AED',
    status: '即将受验',
  },
]);

const customerHeatmaps = ref<CustomerHeatmap[]>([
  {
    id: 'c-1',
    name: '华辰科技',
    peopleCount: 3,
    commitmentCount: 5,
    riskStatus: '合同失配',
    riskColor: 'red',
  },
  {
    id: 'c-2',
    name: '华科集团',
    peopleCount: 4,
    commitmentCount: 6,
    riskStatus: '需要关注',
    riskColor: 'orange',
  },
  {
    id: 'c-3',
    name: '鑫达集团',
    peopleCount: 2,
    commitmentCount: 3,
    riskStatus: '正常保驾',
    riskColor: 'green',
  },
  {
    id: 'c-4',
    name: '宏远科技',
    peopleCount: 2,
    commitmentCount: 2,
    riskStatus: '商机攻坚',
    riskColor: 'blue',
  },
]);

// ----------------------------------------------------
// 3. 维度与密度模式控制
// ----------------------------------------------------
// 视图切换：按项目 / 按部门 / 全量清单
const activeView = ref<'department' | 'list' | 'project'>('project');
// 展示密度模式：compact（大团队极简高密） vs detailed（小团队卡片）
const displayDensity = ref<'compact' | 'detailed'>('compact');

const selectedProjectFilter = ref<string>('all');
const selectedDeptFilter = ref<string>('all');

// 折叠展开控制状态：记录展开的项目 key
const expandedProjects = ref<Record<string, boolean>>({});

function toggleProjectExpand(projName: string) {
  expandedProjects.value[projName] = !expandedProjects.value[projName];
}

// ----------------------------------------------------
// 4. 全量承诺 Mock 数据 (覆盖 10+ 员工，多种小组)
// ----------------------------------------------------
const allCommitments = ref<NextWeekCommitment[]>([
  {
    id: 'nw-1',
    code: '01',
    title: '推进报价平台 V2 联调与全链路集成测试',
    deptId: 'dev',
    deptName: '开发部',
    roleGroup: '前端开发组',
    owner: '张三',
    ownerAvatar: '张',
    ownerRole: '高级 Vue 前端工程师',
    project: '报价平台 V2',
    dueDate: '8月19日',
    priority: '前置攻坚',
    priorityColor: 'purple',
    summary:
      '完成报价平台 V2 前后端全接口对齐，重点验证分布式会话与审批流推送，确保测试覆盖率 90% 以上。',
    entities: {
      projects: ['报价平台 V2'],
      products: ['报价模块'],
      people: ['张三'],
    },
    detailItem: {
      id: 'nw-1-detail',
      title: '报价平台 V2 全链路集成测试',
      status: '按计划推进',
      deliverables: '通过自动化测试用例集',
      content: '下周二前重点完成自动化联调与错误捕获机制。',
      entities: { projects: ['报价平台 V2'], people: ['张三'] },
    },
  },
  {
    id: 'nw-2',
    code: '02',
    title: '完成客户 B 接口上线与验收演示准备',
    deptId: 'dev',
    deptName: '开发部',
    roleGroup: '前端开发组',
    owner: '张三',
    ownerAvatar: '张',
    ownerRole: '高级 Vue 前端工程师',
    project: '客户 B 集成',
    customer: '客户 B',
    dueDate: '8月20日',
    priority: '紧急交付',
    priorityColor: 'red',
    summary: '协助客户 B 调通测试环境后第一时间进行线上数据连通验证。',
    entities: {
      customers: ['客户 B'],
      projects: ['客户 B 集成'],
      people: ['张三'],
    },
    detailItem: {
      id: 'nw-2-detail',
      title: '客户 B 接口上线验收演示',
      status: '重点前置',
      deliverables: '交付线上集成演示与文档',
      content: '客户环境恢复后立即联调，确保周三完成演示走查。',
      entities: { customers: ['客户 B'], people: ['张三'] },
    },
  },
  {
    id: 'nw-3',
    code: '03',
    title: '报价平台慢查询 SQL 优化与 Redis 缓存',
    deptId: 'dev',
    deptName: '开发部',
    roleGroup: '后端开发组',
    owner: '李四',
    ownerAvatar: '李',
    ownerRole: '后端开发工程师',
    project: '报价平台 V2',
    dueDate: '8月18日',
    priority: '常规推进',
    priorityColor: 'blue',
    summary: '解决并发查询 600ms 延时瓶颈，新增两处复合索引降至 250ms 内。',
    entities: { projects: ['报价平台 V2'], people: ['李四'] },
    detailItem: {
      id: 'nw-3-detail',
      title: '报价平台 SQL 慢查询性能调优',
      status: '按计划推进',
      deliverables: '输出压测报告与 SQL 优化脚本',
      content: '重构持久层查询逻辑，解决大表分页慢查问题。',
      entities: { projects: ['报价平台 V2'], people: ['李四'] },
    },
  },
  {
    id: 'nw-4',
    code: '04',
    title: '报价平台分布式事务 MQ 消费幂等校验',
    deptId: 'dev',
    deptName: '开发部',
    roleGroup: '后端开发组',
    owner: '李四',
    ownerAvatar: '李',
    ownerRole: '后端开发工程师',
    project: '报价平台 V2',
    dueDate: '8月21日',
    priority: '常规推进',
    priorityColor: 'blue',
    summary: '补充 MQ 消费去重逻辑，确保并发高峰期分布式事务一致性。',
    entities: { projects: ['报价平台 V2'], people: ['李四'] },
    detailItem: {
      id: 'nw-4-detail',
      title: 'MQ 消费幂等校验重构',
      status: '按计划推进',
      deliverables: '通过 MQ 压测闭环',
      content: '补齐去重 Token 与 Redis 防重锁。',
      entities: { projects: ['报价平台 V2'], people: ['李四'] },
    },
  },
  {
    id: 'nw-5',
    code: '05',
    title: '华达现场打印出单稳定性观察与日志巡检',
    deptId: 'ops',
    deptName: '运维部',
    roleGroup: '运维保障组',
    owner: '李明',
    ownerAvatar: '李',
    ownerRole: '资深运维工程师',
    project: '华达智能打印',
    customer: '华达',
    dueDate: '8月21日',
    priority: '常规推进',
    priorityColor: 'blue',
    summary: '每日对华达打印日志自动化巡检，防范重发及丢单异常。',
    entities: {
      customers: ['华达'],
      projects: ['华达智能打印'],
      people: ['李明'],
    },
    detailItem: {
      id: 'nw-5-detail',
      title: '华达现场打印稳定性保障',
      status: '按计划推进',
      deliverables: '输出现场日志审计周报',
      content: '保持现场出单监控，丢单第一时间远程干预。',
      entities: { customers: ['华达'], people: ['李明'] },
    },
  },
  {
    id: 'nw-6',
    code: '06',
    title: '华科集团「批量导入审批单」需求排期评估',
    deptId: 'impl',
    deptName: '实施部',
    roleGroup: '交付实施组',
    owner: '赵六',
    ownerAvatar: '赵',
    ownerRole: '实施项目经理',
    project: '华科实施二期',
    customer: '华科集团',
    dueDate: '8月19日',
    priority: '前置攻坚',
    priorityColor: 'purple',
    summary: '组织销售与产研召开需求评审会，协助产研确定 9 月版本排期。',
    entities: {
      customers: ['华科集团'],
      projects: ['华科实施二期'],
      people: ['赵六'],
    },
    detailItem: {
      id: 'nw-6-detail',
      title: '华科集团批量导入需求对齐',
      status: '重点前置',
      deliverables: '完成规格说明书与开发估工',
      content: '明确批量导入模版字段与校验提示。',
      entities: { customers: ['华科集团'], people: ['赵六'] },
    },
  },
  {
    id: 'nw-7',
    code: '07',
    title: '鑫达专线网络重连机制调优与抓包报告',
    deptId: 'ops',
    deptName: '运维部',
    roleGroup: '运维保障组',
    owner: '王强',
    ownerAvatar: '王',
    ownerRole: '现场支持专员',
    project: '鑫达数据同步',
    customer: '鑫达集团',
    dueDate: '8月20日',
    priority: '风险防范',
    priorityColor: 'orange',
    summary: '在同步服务中嵌入退避重连逻辑，规避网络微小波动工单。',
    entities: {
      customers: ['鑫达集团'],
      projects: ['鑫达数据同步'],
      people: ['王强'],
    },
    detailItem: {
      id: 'nw-7-detail',
      title: '鑫达自动重连机制调优',
      status: '防范延期',
      deliverables: '发布防断连补丁包',
      content: '针对断连问题部署重试脚本，降低现场干预。',
      entities: { customers: ['鑫达集团'], people: ['王强'] },
    },
  },
  {
    id: 'nw-8',
    code: '08',
    title: '宏远科技二期 ROI 投资回报方案编制与拜访',
    deptId: 'mkt',
    deptName: '市场部',
    roleGroup: '市场商务组',
    owner: '周华',
    ownerAvatar: '周',
    ownerRole: '资深市场经理',
    project: '宏远二期拓展',
    customer: '宏远科技',
    dueDate: '8月18日',
    priority: '前置攻坚',
    priorityColor: 'purple',
    summary: '完善 ROI 计算器并准备拜访演示，推进二期商机签署。',
    entities: {
      customers: ['宏远科技'],
      projects: ['宏远二期拓展'],
      people: ['周华'],
    },
    detailItem: {
      id: 'nw-8-detail',
      title: '宏远科技 ROI 方案演示',
      status: '重点前置',
      deliverables: '完成决策链拜访',
      content: '向客户讲解 ROI 收益模型，促成合同签订。',
      entities: { customers: ['宏远科技'], people: ['周华'] },
    },
  },
]);

// ----------------------------------------------------
// 5. 数据计算 (部门维度矩阵 + 项目维度成员高密分组)
// ----------------------------------------------------
interface EmployeeMatrixRow {
  owner: string;
  ownerAvatar: string;
  ownerRole: string;
  deptId: string;
  deptName: string;
  roleGroup: string;
  commitments: NextWeekCommitment[];
}

const employeeMatrix = computed<EmployeeMatrixRow[]>(() => {
  const map: Record<string, EmployeeMatrixRow> = {};
  for (const item of allCommitments.value) {
    if (!map[item.owner]) {
      map[item.owner] = {
        owner: item.owner,
        ownerAvatar: item.ownerAvatar,
        ownerRole: item.ownerRole,
        deptId: item.deptId,
        deptName: item.deptName,
        roleGroup: item.roleGroup,
        commitments: [],
      };
    }
    map[item.owner]!.commitments.push(item);
  }
  return Object.values(map);
});

// 按部门 & 角色小组分组的矩阵数据
const matrixByDepartment = computed(() => {
  const result: Record<
    string,
    { deptName: string; groups: Record<string, EmployeeMatrixRow[]> }
  > = {};

  for (const row of employeeMatrix.value) {
    if (
      selectedDeptFilter.value !== 'all' &&
      row.deptId !== selectedDeptFilter.value
    ) {
      continue;
    }
    if (!result[row.deptId]) {
      result[row.deptId] = { deptName: row.deptName, groups: {} };
    }
    const groupKey = row.roleGroup;
    if (!result[row.deptId]!.groups[groupKey]) {
      result[row.deptId]!.groups[groupKey] = [];
    }
    result[row.deptId]!.groups[groupKey]!.push(row);
  }
  return result;
});

// 按项目分组
const commitmentsByProject = computed(() => {
  const map: Record<string, NextWeekCommitment[]> = {};
  for (const item of allCommitments.value) {
    const key = item.project || '其他事项';
    if (!map[key]) {
      map[key] = [];
    }
    map[key]!.push(item);
  }
  return map;
});

// 【核心优化】：在项目维度内，将事项按【参与成员】进行二次高密分组！
interface ProjectMemberSummaryGroup {
  owner: string;
  ownerAvatar: string;
  ownerRole: string;
  deptName: string;
  commitments: NextWeekCommitment[];
}

const projectMembersSummary = computed(() => {
  const result: Record<string, ProjectMemberSummaryGroup[]> = {};

  for (const [projName, items] of Object.entries(commitmentsByProject.value)) {
    // 项目过滤
    if (
      selectedProjectFilter.value !== 'all' &&
      projName !== selectedProjectFilter.value
    ) {
      continue;
    }

    const memberMap: Record<string, ProjectMemberSummaryGroup> = {};
    for (const item of items) {
      if (!memberMap[item.owner]) {
        memberMap[item.owner] = {
          owner: item.owner,
          ownerAvatar: item.ownerAvatar,
          ownerRole: item.ownerRole,
          deptName: item.deptName,
          commitments: [],
        };
      }
      memberMap[item.owner]!.commitments.push(item);
    }
    result[projName] = Object.values(memberMap);
  }

  return result;
});

// 全量筛选清单
const filteredCommitments = computed(() => {
  return allCommitments.value.filter((item) => {
    const projectMatch =
      selectedProjectFilter.value === 'all' ||
      item.project === selectedProjectFilter.value;
    const deptMatch =
      selectedDeptFilter.value === 'all' ||
      item.deptId === selectedDeptFilter.value;
    return projectMatch && deptMatch;
  });
});

// ----------------------------------------------------
// 6. 侧滑抽屉控制
// ----------------------------------------------------
const detailDrawerOpen = ref(false);
const selectedWorkItem = ref<AiWorkWorkItem | null>(null);

function openCommitmentDetail(item: NextWeekCommitment) {
  selectedWorkItem.value = item.detailItem;
  detailDrawerOpen.value = true;
}

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

const personDrawerOpen = ref(false);
const selectedPersonName = ref<null | string>(null);

function handlePickPerson(name: string) {
  selectedPersonName.value = name;
  personDrawerOpen.value = true;
}
</script>

<template>
  <div
    class="next-week-page h-full max-h-[calc(100vh-65px)] overflow-y-auto bg-[#F4F5F7] p-4 pb-16 text-[#1E293B]"
  >
    <!-- 1. 顶栏 Header -->
    <header
      class="mb-4 flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white px-5 py-3.5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex size-9 items-center justify-center rounded-xl bg-[#ECFDF5] font-bold text-[#059669]"
        >
          <Icon icon="lucide:calendar-range" class="size-5" />
        </div>
        <div>
          <h1
            class="margin-none text-base font-bold leading-snug text-[#0F172A]"
          >
            全团队下周精力聚焦与排期驾驶舱
          </h1>
          <p class="margin-none text-xs text-[#64748B]">
            聚合全员周报“下周工作计划承诺”，提供【高密成员矩阵】与【项目聚合】视角，前置防范资源排期冲突
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Tag
          color="green"
          class="rounded-full border-none px-3 py-1 text-xs font-bold"
        >
          ● 下周规划 36 项承诺
        </Tag>
        <Tag
          color="blue"
          class="rounded-full border-none px-3 py-1 text-xs font-bold"
        >
          覆盖 6 个重点项目
        </Tag>
      </div>
    </header>

    <!-- 2. 全员资源聚焦热力卡片榜 (3 卡齐排) -->
    <section class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
      <!-- 卡片 1：项目精力分布热力榜 -->
      <article
        class="space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
      >
        <div
          class="flex items-center justify-between border-b border-[#F1F5F9] pb-2"
        >
          <h2
            class="margin-none flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
          >
            <Icon icon="lucide:chart-pie" class="size-4 text-[#2563EB]" />
            下周项目人力分配 TOP 榜
          </h2>
          <span class="text-[10px] text-[#94A3B8]">按人员占比</span>
        </div>

        <div class="space-y-2.5 pt-1">
          <div
            v-for="proj in projectHeatmaps"
            :key="proj.id"
            class="space-y-1 text-xs"
          >
            <div class="flex items-center justify-between text-[11px]">
              <span
                class="flex items-center gap-1 font-semibold text-[#0F172A]"
              >
                {{ proj.name }}
                <Tag class="scale-80 margin-none font-normal" color="blue">
                  {{ proj.status }}
                </Tag>
              </span>
              <span class="font-mono text-[#64748B]">
                <strong>{{ proj.peopleCount }}</strong>
                人 ({{ proj.commitmentCount }}项)
              </span>
            </div>
            <Progress
              :percent="proj.percentage"
              :stroke-color="proj.color"
              :show-info="false"
              size="small"
            />
          </div>
        </div>
      </article>

      <!-- 卡片 2：重点客户服务保障榜 -->
      <article
        class="space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
      >
        <div
          class="flex items-center justify-between border-b border-[#F1F5F9] pb-2"
        >
          <h2
            class="margin-none flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
          >
            <Icon icon="lucide:building-2" class="size-4 text-[#059669]" />
            重点客户下周排期保障
          </h2>
          <span class="text-[10px] text-[#94A3B8]">风控视角</span>
        </div>

        <div class="space-y-2 pt-1">
          <div
            v-for="cust in customerHeatmaps"
            :key="cust.id"
            class="flex items-center justify-between rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-2 text-xs"
          >
            <div>
              <span class="block font-bold text-[#0F172A]">
                {{ cust.name }}
              </span>
              <span class="text-[10px] text-[#64748B]">
                已排期 {{ cust.peopleCount }} 人 ·
                {{ cust.commitmentCount }} 项计划
              </span>
            </div>
            <Tag :color="cust.riskColor" class="border-none font-bold">
              {{ cust.riskStatus }}
            </Tag>
          </div>
        </div>
      </article>

      <!-- 卡片 3：AI 下周战略聚焦诊断 -->
      <article
        class="space-y-2.5 rounded-2xl border border-[#A7F3D0] bg-[#ECFDF5] p-4 text-xs text-[#065F46] shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
      >
        <div
          class="flex items-center justify-between border-b border-[#A7F3D0]/60 pb-2"
        >
          <h2
            class="margin-none flex items-center gap-1.5 text-xs font-bold text-[#064E3B]"
          >
            <Icon icon="lucide:sparkles" class="size-4 text-[#059669]" />
            AI 下周全员聚焦诊断与建议
          </h2>
          <span class="text-[10px] font-medium text-[#047857]">智能前瞻</span>
        </div>

        <p class="margin-none leading-relaxed">
          <strong>🎯 核心聚焦：</strong>
          下周全员
          <strong>66%</strong>
          的研发精力集中在【报价平台
          V2】与【华达智能打印】，资源聚集度高，利于大版本攻坚。
        </p>

        <p
          class="margin-none rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] p-2 leading-relaxed text-[#991B1B]"
        >
          <strong>⚠️ 前置预警：</strong>
          【华科集团】销售已承诺 9 月上线批量导入，但下周仅 1
          项预研排期；【华辰科技】处于暂停续费期，但仍排期了 3
          项运维投入，建议主管干预。
        </p>
      </article>
    </section>

    <!-- 3. 主体控制栏：维度 Views + 展示密度切换 Switcher -->
    <div class="space-y-4">
      <section
        class="shadow-xs flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-white p-3"
      >
        <!-- 左侧：维度切换 -->
        <div class="flex items-center gap-1.5 rounded-xl bg-[#F1F5F9] p-1">
          <button
            type="button"
            class="flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all"
            :class="
              activeView === 'project'
                ? 'shadow-xs bg-white text-[#2563EB]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            "
            @click="activeView = 'project'"
          >
            <Icon icon="lucide:boxes" class="size-3.5" />
            按项目 / 客户看下周 (已高密收纳)
          </button>

          <button
            type="button"
            class="flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all"
            :class="
              activeView === 'department'
                ? 'shadow-xs bg-white text-[#2563EB]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            "
            @click="activeView = 'department'"
          >
            <Icon icon="lucide:building" class="size-3.5" />
            按部门 / 人员看排期
          </button>

          <button
            type="button"
            class="flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all"
            :class="
              activeView === 'list'
                ? 'shadow-xs bg-white text-[#2563EB]'
                : 'text-[#64748B] hover:text-[#0F172A]'
            "
            @click="activeView = 'list'"
          >
            <Icon icon="lucide:list-todo" class="size-3.5" />
            下周全量承诺清单
          </button>
        </div>

        <!-- 右侧：高密极简模式 VS 卡片模式 切换 (专门针对大团队管理优化) -->
        <div class="flex items-center gap-3 text-xs">
          <div
            class="flex items-center gap-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-1"
          >
            <button
              type="button"
              class="flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all"
              :class="
                displayDensity === 'compact'
                  ? 'shadow-2xs bg-[#2563EB] text-white'
                  : 'text-[#64748B] hover:bg-[#F1F5F9]'
              "
              @click="displayDensity = 'compact'"
            >
              <Icon icon="lucide:layout-list" class="size-3" />
              ⚡ 大团队成员矩阵 (收纳平铺)
            </button>
            <button
              type="button"
              class="flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-all"
              :class="
                displayDensity === 'detailed'
                  ? 'shadow-2xs bg-[#2563EB] text-white'
                  : 'text-[#64748B] hover:bg-[#F1F5F9]'
              "
              @click="displayDensity = 'detailed'"
            >
              <Icon icon="lucide:layout-grid" class="size-3" />
              📰 事项大卡片平铺
            </button>
          </div>

          <!-- 下拉过滤 -->
          <select
            v-if="activeView === 'project'"
            v-model="selectedProjectFilter"
            class="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
          >
            <option value="all">全部项目</option>
            <option value="报价平台 V2">报价平台 V2</option>
            <option value="华达智能打印">华达智能打印</option>
            <option value="客户 B 集成">客户 B 集成</option>
            <option value="长鑫5期打印">长鑫5期打印</option>
          </select>

          <select
            v-else
            v-model="selectedDeptFilter"
            class="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-xs text-[#0F172A] focus:border-[#2563EB] focus:outline-none"
          >
            <option value="all">全部部门</option>
            <option value="dev">开发部</option>
            <option value="ops">运维部</option>
            <option value="impl">实施部</option>
            <option value="mkt">市场部</option>
          </select>
        </div>
      </section>

      <!-- 视图 A：按项目 / 客户聚合视图 (优化重构：大团队下高密聚合成员，防止卡片堆叠) -->
      <div v-if="activeView === 'project'" class="space-y-4">
        <div
          v-for="(memberGroups, projName) in projectMembersSummary"
          :key="projName"
          class="project-card shadow-xs space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5"
        >
          <!-- 项目 Header -->
          <div
            class="flex items-center justify-between border-b border-[#F1F5F9] pb-3"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="flex size-8 items-center justify-center rounded-xl bg-[#EFF6FF] font-bold text-[#2563EB]"
              >
                <Icon icon="lucide:folder-git-2" class="size-4.5" />
              </div>
              <div>
                <h2
                  class="margin-none flex items-center gap-2 text-sm font-bold text-[#0F172A]"
                >
                  {{ projName }}
                  <Tag
                    color="blue"
                    class="margin-none scale-90 border-none font-bold"
                  >
                    共
                    {{ memberGroups.map((g) => g.commitments).flat().length }}
                    项下周承诺
                  </Tag>
                </h2>
                <p class="margin-none text-[11px] text-[#64748B]">
                  下周共 {{ memberGroups.length }} 名成员参与排期：{{
                    memberGroups.map((g) => g.owner).join('、')
                  }}
                </p>
              </div>
            </div>

            <!-- 模式为 compact 时提供折叠与展开功能 -->
            <Button
              v-if="displayDensity === 'compact' && memberGroups.length > 3"
              type="text"
              size="small"
              class="flex items-center gap-1 text-xs font-medium text-[#2563EB]"
              @click="toggleProjectExpand(projName)"
            >
              <span>
                {{
                  expandedProjects[projName]
                    ? '收起部分排期'
                    : `展开全部 (${memberGroups.length}人排期)`
                }}
              </span>
              <Icon
                :icon="
                  expandedProjects[projName]
                    ? 'lucide:chevron-up'
                    : 'lucide:chevron-down'
                "
                class="size-3.5"
              />
            </Button>
          </div>

          <!-- 模式 1: ⚡ 极简成员高密行模式 (8个人 16项承诺自动压缩为 8 行，高度立减 70%) -->
          <div v-if="displayDensity === 'compact'" class="space-y-2">
            <div
              class="divide-y divide-[#F1F5F9] overflow-hidden rounded-xl border border-[#F1F5F9]"
            >
              <div
                v-for="member in expandedProjects[projName]
                  ? memberGroups
                  : memberGroups.slice(0, 3)"
                :key="member.owner"
                class="project-member-row flex flex-wrap items-center justify-between gap-3 bg-white p-3 text-xs transition-colors hover:bg-[#F8FAFC]"
              >
                <!-- 成员个人属性 (左) -->
                <div
                  class="group flex min-w-[170px] cursor-pointer items-center gap-2.5"
                  @click="handlePickPerson(member.owner)"
                >
                  <span
                    class="shadow-2xs flex size-7 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white transition-transform group-hover:scale-105"
                  >
                    {{ member.ownerAvatar }}
                  </span>
                  <div>
                    <span
                      class="block font-bold text-[#0F172A] transition-colors group-hover:text-[#2563EB]"
                    >
                      {{ member.owner }}
                    </span>
                    <span class="block text-[10px] text-[#94A3B8]">
                      {{ member.deptName }} · {{ member.ownerRole }}
                    </span>
                  </div>
                </div>

                <!-- 成员在该项目下的下周承诺胶囊行 (中) -->
                <div
                  class="flex min-w-[280px] flex-1 flex-wrap items-center gap-2"
                >
                  <Tooltip
                    v-for="cmt in member.commitments"
                    :key="cmt.id"
                    :title="cmt.summary"
                    placement="top"
                  >
                    <button
                      type="button"
                      class="commitment-pill hover:shadow-2xs flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1 text-left text-xs font-medium transition-all"
                      :class="
                        cmt.priorityColor === 'red'
                          ? 'border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B] hover:bg-[#FEE2E2]'
                          : cmt.priorityColor === 'purple'
                            ? 'border-[#D8B4FE] bg-[#F3E8FF] text-[#6B21A8] hover:bg-[#E9D5FF]'
                            : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF] hover:bg-[#DBEAFE]'
                      "
                      @click="openCommitmentDetail(cmt)"
                    >
                      <span class="font-mono font-bold opacity-80">
                        {{ cmt.code }}
                      </span>
                      <span class="max-w-[220px] truncate font-semibold">
                        {{ cmt.title }}
                      </span>
                      <span class="font-mono text-[10px] opacity-75">
                        ({{ cmt.dueDate }})
                      </span>
                    </button>
                  </Tooltip>
                </div>

                <!-- 事项计数 (右) -->
                <div class="flex flex-none items-center gap-2">
                  <Tag
                    color="blue"
                    class="margin-none scale-90 border-none font-bold"
                  >
                    {{ member.commitments.length }} 项承诺
                  </Tag>
                </div>
              </div>
            </div>
          </div>

          <!-- 模式 2: 📰 事项大卡片平铺 (经典独立卡片模式) -->
          <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div
              v-for="item in memberGroups.map((g) => g.commitments).flat()"
              :key="item.id"
              class="group cursor-pointer space-y-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 transition-all hover:border-[#2563EB]"
              @click="openCommitmentDetail(item)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-mono text-xs font-black text-[#059669]">
                    {{ item.code }}
                  </span>
                  <span
                    class="max-w-[240px] truncate text-xs font-bold text-[#0F172A] transition-colors group-hover:text-[#2563EB]"
                  >
                    {{ item.title }}
                  </span>
                </div>
                <Tag
                  :color="
                    item.priorityColor === 'red'
                      ? 'red'
                      : item.priorityColor === 'purple'
                        ? 'purple'
                        : 'blue'
                  "
                  class="scale-85 margin-none border-none font-bold"
                >
                  {{ item.priority }}
                </Tag>
              </div>

              <p
                class="margin-none line-clamp-2 text-xs leading-relaxed text-[#475569]"
              >
                {{ item.summary }}
              </p>

              <div
                class="flex items-center justify-between border-t border-[#F1F5F9] pt-1 text-[11px] text-[#64748B]"
              >
                <span
                  class="flex cursor-pointer items-center gap-1 font-bold text-[#2563EB] hover:underline"
                  @click.stop="handlePickPerson(item.owner)"
                >
                  <span
                    class="flex size-4 items-center justify-center rounded-full bg-[#2563EB] text-[9px] text-white"
                  >
                    {{ item.ownerAvatar }}
                  </span>
                  {{ item.owner }} ({{ item.deptName }})
                </span>
                <span class="font-mono text-[#94A3B8]">{{ item.dueDate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 视图 B：按部门 / 人员看排期 -->
      <div v-else-if="activeView === 'department'" class="space-y-4">
        <div v-if="displayDensity === 'compact'" class="space-y-4">
          <div
            v-for="(deptData, deptId) in matrixByDepartment"
            :key="deptId"
            class="dept-matrix-card shadow-xs space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5"
          >
            <div
              class="flex items-center justify-between border-b border-[#F1F5F9] pb-3"
            >
              <div class="flex items-center gap-2">
                <Icon icon="lucide:building-2" class="size-5 text-[#2563EB]" />
                <h2 class="margin-none text-sm font-bold text-[#0F172A]">
                  {{ deptData.deptName }}
                </h2>
                <Tag color="blue" class="border-none font-bold">
                  包含
                  {{ Object.values(deptData.groups).flat().length }} 名成员排期
                </Tag>
              </div>
              <span class="text-xs text-[#94A3B8]">已按角色小组高密拆解</span>
            </div>

            <div class="space-y-3">
              <div
                v-for="(rows, groupName) in deptData.groups"
                :key="groupName"
                class="role-group-container space-y-2"
              >
                <div
                  class="border-l-3 flex items-center gap-1.5 rounded-lg border-l-[#2563EB] bg-[#F8FAFC] px-3 py-1.5 text-xs font-bold text-[#475569]"
                >
                  <span>{{ groupName }}</span>
                  <span class="text-[10px] font-normal text-[#94A3B8]">
                    ({{ rows.length }}人)
                  </span>
                </div>

                <div
                  class="divide-y divide-[#F1F5F9] overflow-hidden rounded-xl border border-[#F1F5F9]"
                >
                  <div
                    v-for="row in rows"
                    :key="row.owner"
                    class="matrix-row flex flex-wrap items-center justify-between gap-3 bg-white p-3 text-xs transition-colors hover:bg-[#F8FAFC]"
                  >
                    <div
                      class="group flex min-w-[180px] cursor-pointer items-center gap-2.5"
                      @click="handlePickPerson(row.owner)"
                    >
                      <span
                        class="shadow-2xs flex size-7 items-center justify-center rounded-full bg-[#2563EB] text-xs font-bold text-white transition-transform group-hover:scale-105"
                      >
                        {{ row.ownerAvatar }}
                      </span>
                      <div>
                        <span
                          class="block font-bold text-[#0F172A] transition-colors group-hover:text-[#2563EB]"
                        >
                          {{ row.owner }}
                        </span>
                        <span class="block text-[10px] text-[#94A3B8]">
                          {{ row.ownerRole }}
                        </span>
                      </div>
                    </div>

                    <div
                      class="flex min-w-[300px] flex-1 flex-wrap items-center gap-2"
                    >
                      <Tooltip
                        v-for="cmt in row.commitments"
                        :key="cmt.id"
                        :title="`${cmt.project ? `[${cmt.project}] ` : ''}${cmt.summary}`"
                        placement="top"
                      >
                        <button
                          type="button"
                          class="commitment-pill hover:shadow-2xs flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1 text-left text-xs font-medium transition-all"
                          :class="
                            cmt.priorityColor === 'red'
                              ? 'border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B] hover:bg-[#FEE2E2]'
                              : cmt.priorityColor === 'purple'
                                ? 'border-[#D8B4FE] bg-[#F3E8FF] text-[#6B21A8] hover:bg-[#E9D5FF]'
                                : 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF] hover:bg-[#DBEAFE]'
                          "
                          @click="openCommitmentDetail(cmt)"
                        >
                          <span class="font-mono font-bold opacity-80">
                            {{ cmt.code }}
                          </span>
                          <span class="max-w-[200px] truncate font-semibold">
                            {{ cmt.title }}
                          </span>
                          <span class="font-mono text-[10px] opacity-75">
                            ({{ cmt.dueDate }})
                          </span>
                        </button>
                      </Tooltip>
                    </div>

                    <div class="flex flex-none items-center gap-2">
                      <Tag
                        color="green"
                        class="margin-none scale-90 border-none font-bold"
                      >
                        {{ row.commitments.length }} 项承诺
                      </Tag>
                      <Button
                        type="link"
                        size="small"
                        class="p-0 text-xs font-bold text-[#2563EB]"
                        @click="handlePickPerson(row.owner)"
                      >
                        查看周报
                        <Icon icon="lucide:chevron-right" class="size-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div
            v-for="row in employeeMatrix"
            :key="row.owner"
            class="employee-card shadow-xs space-y-3 rounded-2xl border border-[#E2E8F0] bg-white p-5"
          >
            <div
              class="flex items-center justify-between border-b border-[#F1F5F9] pb-3"
            >
              <div class="flex items-center gap-3">
                <span
                  class="flex size-8 items-center justify-center rounded-full bg-[#2563EB] font-bold text-white"
                >
                  {{ row.ownerAvatar }}
                </span>
                <div>
                  <h3 class="margin-none text-sm font-bold text-[#0F172A]">
                    {{ row.owner }}
                    <span class="text-xs font-normal text-[#64748B]">
                      ({{ row.ownerRole }} · {{ row.deptName }})
                    </span>
                  </h3>
                </div>
              </div>
              <Tag color="blue" class="border-none font-bold">
                下周计划 {{ row.commitments.length }} 项
              </Tag>
            </div>

            <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div
                v-for="item in row.commitments"
                :key="item.id"
                class="cursor-pointer space-y-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 transition-all hover:border-[#2563EB]"
                @click="openCommitmentDetail(item)"
              >
                <div class="flex items-center justify-between">
                  <span class="font-mono text-xs font-black text-[#059669]">
                    {{ item.code }}
                  </span>
                  <Tag
                    :color="item.priorityColor === 'red' ? 'red' : 'blue'"
                    class="scale-85 margin-none border-none font-bold"
                  >
                    {{ item.priority }}
                  </Tag>
                </div>
                <h4 class="margin-none text-xs font-bold text-[#0F172A]">
                  {{ item.title }}
                </h4>
                <p class="margin-none line-clamp-2 text-xs text-[#64748B]">
                  {{ item.summary }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 视图 C：下周全量承诺清单 -->
      <div v-else class="space-y-3">
        <div
          v-for="item in filteredCommitments"
          :key="item.id"
          class="shadow-xs group cursor-pointer space-y-2.5 rounded-2xl border border-[#E2E8F0] bg-white p-4 transition-all hover:border-[#2563EB]"
          @click="openCommitmentDetail(item)"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <span
                class="rounded-md bg-[#ECFDF5] px-2 py-0.5 font-mono text-sm font-black text-[#059669]"
              >
                {{ item.code }}
              </span>
              <h3
                class="margin-none text-sm font-bold text-[#0F172A] transition-colors group-hover:text-[#2563EB]"
              >
                {{ item.title }}
              </h3>
              <Tag
                :color="
                  item.priorityColor === 'red'
                    ? 'red'
                    : item.priorityColor === 'purple'
                      ? 'purple'
                      : 'blue'
                "
                class="margin-none scale-90 border-none font-bold"
              >
                {{ item.priority }}
              </Tag>
            </div>

            <div class="flex items-center gap-3 text-xs">
              <span
                class="flex cursor-pointer items-center gap-1 font-bold text-[#2563EB]"
                @click.stop="handlePickPerson(item.owner)"
              >
                负责人：{{ item.owner }} ({{ item.deptName }})
              </span>
              <span class="font-mono text-[#94A3B8]">
                截止：{{ item.dueDate }}
              </span>
            </div>
          </div>

          <p class="margin-none text-xs leading-relaxed text-[#334155]">
            {{ item.summary }}
          </p>

          <div
            class="flex items-center justify-between border-t border-[#F1F5F9] pt-1 text-xs"
          >
            <EntityTags
              :entities="item.entities"
              :show-group-title="false"
              :clickable="true"
              variant="minimal"
              @pick="(p) => handlePickEntity(p.type, p.name)"
            />

            <Button
              type="link"
              size="small"
              class="flex items-center gap-1 p-0 text-xs font-bold text-[#2563EB]"
              @click.stop="openCommitmentDetail(item)"
            >
              查看承诺详情与排期
              <Icon icon="lucide:chevron-right" class="size-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- 侧滑抽屉控制 -->
    <WorkItemDetailDrawer
      v-model:open="detailDrawerOpen"
      :item="selectedWorkItem"
    />

    <EntityContextDrawer
      v-model:open="entityDrawerOpen"
      :entity="selectedEntity"
      mode="team"
    />

    <PersonDetailDrawer
      v-model:open="personDrawerOpen"
      :person-name="selectedPersonName"
    />
  </div>
</template>

<style scoped>
.next-week-page {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.commitment-pill {
  box-shadow: 0 1px 2px rgb(0 0 0 / 3%);
}
</style>
