<!-- 统一实体 Context 穿透抽屉 (EntityContextDrawer) -->
<!-- 针对项目、客户、人员、产品等不同实体，定制差异化的【基本信息】与【专业 AI 总结】 -->
<script setup lang="ts">
import type { AiWorkEntities } from '#/types/ai-work';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Drawer, Modal, Tag } from 'ant-design-vue';

import MaterialList from './material-list.vue';

export interface EntityPick {
  type: keyof AiWorkEntities;
  name: string;
}

const props = withDefaults(
  defineProps<{
    entity?: EntityPick | null;
    mode?: 'personal' | 'team';
    open: boolean;
  }>(),
  {
    entity: null,
    mode: 'team',
  },
);

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
}>();

const open = computed({
  get: () => props.open,
  set: (v) => emit('update:open', v),
});

// 实体元信息配置
const typeMeta: Record<
  EntityPick['type'],
  { bg: string; color: string; icon: string; label: string }
> = {
  customers: {
    icon: 'lucide:building-2',
    label: '客户实体',
    color: '#2563EB',
    bg: '#EFF6FF',
  },
  people: {
    icon: 'lucide:user-round',
    label: '人员实体',
    color: '#EA580C',
    bg: '#FFF7ED',
  },
  products: {
    icon: 'lucide:layers',
    label: '产品实体',
    color: '#16A34A',
    bg: '#F0FDF4',
  },
  projects: {
    icon: 'lucide:briefcase-business',
    label: '项目实体',
    color: '#0D6853',
    bg: '#E8FFEA',
  },
};

const currentMeta = computed(() =>
  props.entity ? typeMeta[props.entity.type] : null,
);

// -----------------------------------------------------------------
// 1. 实体差异化【基本信息】数据结构
// -----------------------------------------------------------------
interface EntityDetailData {
  statusLabel: string;
  statusColor: 'blue' | 'default' | 'green' | 'orange' | 'red';
  // 不同实体定制的键值对 KV 结构
  kvFields: { highlight?: boolean; label: string; value: string }[];
  // 项目专属：描述
  description?: string;
  // 专业 AI 视角总结
  aiSummary: string;
}

const entityDetail = computed<EntityDetailData>(() => {
  if (!props.entity) {
    return {
      statusLabel: '正常推进',
      statusColor: 'green',
      kvFields: [],
      aiSummary: '',
    };
  }

  const name = props.entity.name;
  const type = props.entity.type;

  // A. 【项目实体 (projects)】
  if (type === 'projects') {
    const isRisk = name.includes('宏远') || name.includes('打印');
    return {
      statusLabel: isRisk ? '存在风险 / 推进卡点' : '正常推进中',
      statusColor: isRisk ? 'red' : 'green',
      kvFields: [
        { label: '项目经理', value: '王主管 (解决方案部)' },
        {
          label: '关联客户',
          value: name.includes('宏远') ? '宏远科技集团' : '新城集团',
        },
        { label: '立项日期', value: '2026-03-15' },
        { label: '预计交付', value: '2026-10-31' },
      ],
      description: `针对「${name}」研发数字化中台与流程审批自动化部署，涵盖 6 个子模块联调。`,
      aiSummary: isRisk
        ? `🤖 项目经理视角总结：当前项目整体健康度为 🟡 偏低。项目推进最大的卡点集中在第三方系统适配与商务沟通延期，已连续 3 周无实质性突破。存在项目期次拖延与需求蔓延风险。建议项目经理立即安排高层干预，明确单方接口交付基线。`
        : `🤖 项目经理视角总结：当前项目整体健康度为 🟢 良好。各项子任务均按 SPRINT 计划推进，代码与架构交付符合预期，风险可控。建议保持当前研发节奏，准备下周中期的阶段 Demo 验收。`,
    };
  }

  // B. 【客户实体 (customers)】
  if (type === 'customers') {
    const isWarn = name.includes('华科') || name.includes('宏远');
    return {
      statusLabel: isWarn ? '商务卡点 / 报价待确认' : '深度合作中',
      statusColor: isWarn ? 'orange' : 'green',
      kvFields: [
        { label: '客户名称', value: name },
        { label: '核心联系人', value: '张总 (CTO / 决策人)' },
        { label: '客户行业', value: '智能制造 / 高新技术企业' },
        { label: '预估商机额', value: '￥120.00 万元', highlight: true },
      ],
      description: `重点跟进的工业自动化客户，关注系统稳定性、私有化部署成本及后期维护支持。`,
      aiSummary: isWarn
        ? `🤖 客户总监视角总结：该客户商务报价已发出 8 天，周报显示沟通仍停留在中层技术对话，尚未触达关键决策人张总。存在友商低价拦截与商机停滞风险。建议由主管介入协助做决策层二次商务拜访。`
        : `🤖 客户总监视角总结：客户关系稳固，交流顺畅。客户对近期技术 Demo 演示反馈积极，预计本月底前可签署二期运维框架协议。`,
    };
  }

  // C. 【人员实体 (people)】
  if (type === 'people') {
    return {
      statusLabel: '在职 / 活跃交付',
      statusColor: 'green',
      kvFields: [
        { label: '所属部门', value: '产品研发部 · 前端组' },
        { label: '岗位职称', value: '资深 Vue 前端开发工程师' },
        { label: '直接主管', value: '李经理' },
        { label: '核心负责', value: '智能周报工作台与 UI 交互' },
      ],
      description: `负责前端 UI 架构搭建、AI 工作事项流交互及底层可视化组件开发。`,
      aiSummary: `🤖 团队主管视角总结：${name} 工作态度严谨，近 6 个月周报提交及时率 100%。本周承接了 3 项核心研发任务，交付质量较高。但在跟进「宏远科技」接口时存在外部依赖卡点，建议主管协助协调后端资源支持。`,
    };
  }

  // D. 【产品实体 (products)】
  return {
    statusLabel: '稳定迭代中',
    statusColor: 'blue',
    kvFields: [
      { label: '产品版本', value: 'V5.2.0-Alpha' },
      { label: '产品负责人', value: '赵六 (PO)' },
      { label: '迭代周期', value: '2026 Q3 专项 Sprint' },
      { label: '涵盖模块', value: '8 个核心业务模块' },
    ],
    description: `企业级智能工作流与周报管理产品，集成了 AI 风险挖掘与可视化看板。`,
    aiSummary: `🤖 产品经理视角总结：产品当前整体稳定度达到 98.5%，关联的各模块周报事项进度正常。本周研发重点集中在 AI 风险挖掘算法优化与 UI 样式微调，暂无严重 Bug 阻塞。`,
  };
});

// -----------------------------------------------------------------
// 2. 模拟长达一年的跨周次关联数据结构
// -----------------------------------------------------------------
export interface EmployeeWorkLog {
  empId: string;
  empName: string;
  avatar: string;
  department: string;
  itemTitle: string;
  summary: string;
  status: string;
  materials: any[];
}

export interface HistoricalWeekNode {
  weekKey: string;
  weekLabel: string;
  dateRange: string;
  collapsed: boolean;
  employees: EmployeeWorkLog[];
}

const historyTree = ref<HistoricalWeekNode[]>([]);

// 悬浮窗弹窗控制 (Floating Modal)
const modalVisible = ref(false);
const currentModalLog = ref<EmployeeWorkLog | null>(null);
const currentModalWeek = ref<HistoricalWeekNode | null>(null);

function openUserWorkLogModal(week: HistoricalWeekNode, emp: EmployeeWorkLog) {
  currentModalWeek.value = week;
  currentModalLog.value = emp;
  modalVisible.value = true;
}

// 生成该实体的长周期关联历史
function buildHistoryTree(entityName: string) {
  historyTree.value = [
    {
      weekKey: '2026-w32',
      weekLabel: '2026年 08月 W32 周',
      dateRange: '08/03 -- 08/09',
      collapsed: false,
      employees: [
        {
          empId: 'zhangsan',
          empName: '张三',
          avatar: '张',
          department: '产品研发部',
          itemTitle: `完成「${entityName}」核心接口开发与单元测试`,
          summary: `按照需求排期，完成了针对「${entityName}」核心逻辑及数据库适配，单元测试覆盖率达 92%，准备联调。`,
          status: '已按期完成',
          materials: [
            {
              id: 'm-1',
              name: '接口映射与测试报告.pdf',
              type: 'document',
              size: '1.8 MB',
            },
          ],
        },
        {
          empId: 'lisi',
          empName: '李四',
          avatar: '李',
          department: '市场拓展部',
          itemTitle: `针对「${entityName}」开展第 3 轮商务拜访与沟通`,
          summary: `再次约见商务代表，对方表示价格预算需二次审批，未给出明确采购时间节点。`,
          status: '进行中',
          materials: [
            {
              id: 'm-2',
              name: '拜访记录录音.m4a',
              type: 'audio',
              size: '4.2 MB',
              duration: '05:20',
            },
          ],
        },
        {
          empId: 'wangwu',
          empName: '王五',
          avatar: '王',
          department: '解决方案部',
          itemTitle: `编写「${entityName}」二期定制白皮书`,
          summary: `完成架构方案初稿，并向客户技术团队做第一轮方案解说。`,
          status: '已完成',
          materials: [],
        },
      ],
    },
    {
      weekKey: '2026-w31',
      weekLabel: '2026年 08月 W31 周',
      dateRange: '07/27 -- 08/02',
      collapsed: false,
      employees: [
        {
          empId: 'lisi',
          empName: '李四',
          avatar: '李',
          department: '市场拓展部',
          itemTitle: `完成「${entityName}」产品演示与需求答疑`,
          summary: `进行现场 Demo 演示，客户对统计分析模块反响积极。`,
          status: '已完成',
          materials: [
            {
              id: 'm-3',
              name: '产品演示PPT.pdf',
              type: 'meeting',
              size: '6.5 MB',
            },
          ],
        },
        {
          empId: 'wangwu',
          empName: '王五',
          avatar: '王',
          department: '解决方案部',
          itemTitle: `梳理「${entityName}」硬件集成与部署可行性`,
          summary: `摸底对方机房环境，确认网络拓扑与安全防护规则。`,
          status: '已完成',
          materials: [],
        },
      ],
    },
    {
      weekKey: '2026-w28',
      weekLabel: '2026年 07月 W28 周',
      dateRange: '07/06 -- 07/12',
      collapsed: true,
      employees: [
        {
          empId: 'wangwu',
          empName: '王五',
          avatar: '王',
          department: '解决方案部',
          itemTitle: `首次接入「${entityName}」线索评估与架构拟定`,
          summary: `完成线索初审，确认为重点级跟进项目。`,
          status: '已完成',
          materials: [],
        },
      ],
    },
    {
      weekKey: '2026-w19',
      weekLabel: '2026年 05月 W19 周',
      dateRange: '05/04 -- 05/10',
      collapsed: true,
      employees: [
        {
          empId: 'zhaoliu',
          empName: '赵六',
          avatar: '赵',
          department: '架构评审组',
          itemTitle: `「${entityName}」跨部门技术立项评审`,
          summary: `完成项目可行性论证，予以立项批准。`,
          status: '已完成',
          materials: [],
        },
      ],
    },
    {
      weekKey: '2026-w11',
      weekLabel: '2026年 03月 W11 周',
      dateRange: '03/09 -- 03/15',
      collapsed: true,
      employees: [
        {
          empId: 'lisi',
          empName: '李四',
          avatar: '李',
          department: '市场拓展部',
          itemTitle: `建立「${entityName}」初始合作意向联系`,
          summary: `通过行业展会初步接触对方 CT0，达成意向建立。`,
          status: '初始建立',
          materials: [],
        },
      ],
    },
  ];
}

// 动态区分个人模式 (仅展示自己提报的事项) vs 团队审批模式 (展示全员)
const displayHistoryTree = computed(() => {
  if (props.mode === 'personal') {
    return historyTree.value
      .map((week) => ({
        ...week,
        employees: week.employees.filter(
          (emp) => emp.empName === '张三' || emp.empId === 'zhangsan',
        ),
      }))
      .filter((week) => week.employees.length > 0);
  }
  return historyTree.value;
});

watch(
  () => props.entity,
  (val) => {
    if (val) {
      buildHistoryTree(val.name);
    }
  },
  { immediate: true },
);
</script>

<template>
  <Drawer
    v-model:open="open"
    :width="540"
    placement="right"
    :title="null"
    class="entity-context-drawer"
  >
    <div v-if="entity && currentMeta" class="space-y-4 text-xs text-[#334155]">
      <!-- 1. 顶部实体 Header Card (分类定制基本信息 + AI视角总结) -->
      <header
        class="shadow-xs space-y-3 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              class="shadow-xs flex size-11 items-center justify-center rounded-xl font-bold text-white"
              :style="{ backgroundColor: currentMeta.color }"
            >
              <Icon :icon="currentMeta.icon" class="size-6" />
            </div>

            <div>
              <span
                class="text-[11px] font-bold tracking-wide"
                :style="{ color: currentMeta.color }"
              >
                {{ currentMeta.label }}
              </span>
              <h2
                class="margin-none text-base font-bold leading-snug text-[#0F172A]"
              >
                {{ entity.name }}
              </h2>
            </div>
          </div>

          <Tag
            :color="entityDetail.statusColor"
            class="rounded-lg border-none px-2.5 py-0.5 text-xs font-bold"
          >
            ● {{ entityDetail.statusLabel }}
          </Tag>
        </div>

        <!-- 项目/实体描述段落 (若有) -->
        <p
          v-if="entityDetail.description"
          class="margin-none rounded-xl border border-[#E2E8F0] bg-white p-2.5 text-[11px] leading-relaxed text-[#64748B]"
        >
          <strong class="text-[#334155]">描述:</strong>
          {{ entityDetail.description }}
        </p>

        <!-- 实体专属基本信息 KV 网格 (项目/客户/人员各自不同) -->
        <div
          class="grid grid-cols-2 gap-2 rounded-xl border border-[#E2E8F0] bg-white p-3 text-[11px]"
        >
          <div v-for="field in entityDetail.kvFields" :key="field.label">
            <span class="text-[#94A3B8]">{{ field.label }}:</span>
            <span
              class="ml-1 font-bold"
              :class="
                field.highlight
                  ? 'font-mono text-xs text-[#059669]'
                  : 'text-[#0F172A]'
              "
            >
              {{ field.value }}
            </span>
          </div>
        </div>

        <!-- 视角专属 AI 智能总结 (项目经理 / 客户总监 / 团队主管视角) -->
        <div
          class="rounded-xl border p-3 text-xs leading-relaxed"
          :class="
            entityDetail.statusColor === 'red'
              ? 'border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]'
              : entityDetail.statusColor === 'orange'
                ? 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]'
                : 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]'
          "
        >
          {{ entityDetail.aiSummary }}
        </div>
      </header>

      <!-- 2. 下方：全量关联周报树状记录 (列表展示，点击人名唤起悬浮窗 Modal) -->
      <section class="space-y-3 border-t border-[#E2E8F0] pt-2">
        <div class="flex items-center justify-between">
          <h3
            class="margin-none flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
          >
            <Icon icon="lucide:list-tree" class="size-4 text-[#059669]" />
            {{
              mode === 'personal'
                ? '我提报的历史关联事项记录'
                : '全量部门人员关联历史 (点击人名悬浮窗查看)'
            }}
          </h3>
          <span class="text-[10px] text-[#94A3B8]">
            {{ mode === 'personal' ? '个人提报筛选' : '涵盖过去 6 个月' }}
          </span>
        </div>

        <div class="space-y-3">
          <div
            v-for="week in displayHistoryTree"
            :key="week.weekKey"
            class="shadow-xs space-y-2 rounded-2xl border border-[#E2E8F0] bg-white p-3.5"
          >
            <!-- 周节点 Header -->
            <div
              class="flex cursor-pointer items-center justify-between border-b border-[#F1F5F9] pb-1.5"
              @click="week.collapsed = !week.collapsed"
            >
              <div class="flex items-center gap-2">
                <Icon
                  :icon="
                    week.collapsed ? 'lucide:folder' : 'lucide:folder-open'
                  "
                  class="size-4 text-[#059669]"
                />
                <span class="text-xs font-bold text-[#0F172A]">
                  {{ week.weekLabel }}
                </span>
                <span class="text-[10px] text-[#94A3B8]">
                  ({{ week.dateRange }})
                </span>
              </div>

              <div class="flex items-center gap-2">
                <span
                  class="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-medium text-[#64748B]"
                >
                  {{ week.employees.length }} 人关联
                </span>
                <Icon
                  :icon="
                    week.collapsed
                      ? 'lucide:chevron-right'
                      : 'lucide:chevron-down'
                  "
                  class="size-3.5 text-[#94A3B8]"
                />
              </div>
            </div>

            <!-- 周节点展开内容：点击具体人名按钮，弹出 Floating Modal 悬浮窗展示 -->
            <div v-show="!week.collapsed" class="flex flex-wrap gap-2 pt-1">
              <button
                v-for="emp in week.employees"
                :key="emp.empId"
                type="button"
                class="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-xs text-[#334155] transition-all hover:border-[#059669] hover:bg-[#F0FDF4] hover:text-[#064E3B]"
                @click="openUserWorkLogModal(week, emp)"
              >
                <span class="size-2 rounded-full bg-[#059669]"></span>
                <span class="font-bold">{{ emp.empName }}</span>
                <span class="text-[10px] text-[#64748B]">
                  ({{ emp.department }})
                </span>
                <Icon
                  icon="lucide:external-link"
                  class="ml-0.5 size-3 text-[#059669]"
                />
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. 悬浮窗 (Floating Modal Window) 展示特定员工在该周的事项详情 -->
      <Modal
        v-model:open="modalVisible"
        :footer="null"
        :width="500"
        title="员工周报事项关联详情"
        centered
        class="work-log-floating-modal"
      >
        <div
          v-if="currentModalLog && currentModalWeek"
          class="space-y-4 pt-2 text-xs text-[#334155]"
        >
          <!-- 悬浮窗 Header -->
          <div
            class="flex items-center justify-between rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-3.5"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="shadow-xs flex size-9 items-center justify-center rounded-full bg-[#059669] text-sm font-bold text-white"
              >
                {{ currentModalLog.avatar }}
              </div>
              <div>
                <span class="block text-sm font-bold text-[#0F172A]">
                  {{ currentModalLog.empName }}
                </span>
                <span class="text-[11px] text-[#64748B]">
                  {{ currentModalLog.department }}
                </span>
              </div>
            </div>

            <div class="text-right">
              <Tag
                color="green"
                class="mb-1 border-none px-2 py-0.5 text-xs font-bold"
              >
                {{ currentModalLog.status }}
              </Tag>
              <span class="block font-mono text-[10px] text-[#64748B]">
                {{ currentModalWeek.weekLabel }}
              </span>
            </div>
          </div>

          <!-- 事项标题与成果细节 -->
          <div
            class="space-y-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
          >
            <div>
              <span
                class="mb-0.5 block text-[10px] font-semibold text-[#94A3B8]"
              >
                关联事项标题:
              </span>
              <span class="block text-xs font-bold leading-snug text-[#0F172A]">
                {{ currentModalLog.itemTitle }}
              </span>
            </div>

            <div class="border-t border-[#E2E8F0] pt-2">
              <span
                class="mb-0.5 block text-[10px] font-semibold text-[#94A3B8]"
              >
                成果说明与进展:
              </span>
              <p class="margin-none text-[11px] leading-relaxed text-[#475569]">
                {{ currentModalLog.summary }}
              </p>
            </div>
          </div>

          <!-- 挂载的资料 -->
          <div
            v-if="
              currentModalLog.materials && currentModalLog.materials.length > 0
            "
            class="space-y-1.5"
          >
            <span
              class="flex items-center gap-1 text-xs font-bold text-[#0F172A]"
            >
              <Icon icon="lucide:paperclip" class="size-3.5 text-[#059669]" />
              阶段性挂载资料
            </span>
            <MaterialList :materials="currentModalLog.materials" />
          </div>

          <div class="flex justify-end pt-2">
            <Button
              type="primary"
              class="rounded-lg border-none bg-[#059669] px-5 font-bold hover:bg-[#047857]"
              @click="modalVisible = false"
            >
              关闭窗口
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  </Drawer>
</template>

<style scoped>
.entity-context-drawer {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
