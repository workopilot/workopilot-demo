<!-- 周报设置 (WeeklySettings.vue) -->
<!-- 提供团队周报生成时间设置、部门重点关注提示词设置、四大实体挖掘与总结内置提示词设置 -->
<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Select,
  Slider,
  Switch,
  Tag,
  Tree,
} from 'ant-design-vue';

// ----------------------------------------------------
// 1. 顶部 Tab 与状态定义
// ----------------------------------------------------
const activeTab = ref<'department-prompts' | 'entity-prompts' | 'timing'>(
  'timing',
);

// ----------------------------------------------------
// 2. 菜单 1：团队周报生成日期设置
// ----------------------------------------------------
const globalSetting = ref({
  defaultDay: '周六',
  defaultTime: '08:00',
  deadlineHours: '24',
  autoDraft: true,
  notifyChannels: ['wework', 'email', 'assistant'],
});

interface DeptTimingOverride {
  deptId: string;
  deptName: string;
  isInherit: boolean;
  customDay: string;
  customTime: string;
  notifyMode: string;
  status: '已暂停' | '运行中';
}

const deptTimingList = ref<DeptTimingOverride[]>([
  {
    deptId: 'dev',
    deptName: '开发部',
    isInherit: true,
    customDay: '周六',
    customTime: '08:00',
    notifyMode: '强提醒 (企微+邮件)',
    status: '运行中',
  },
  {
    deptId: 'ops',
    deptName: '运维部',
    isInherit: false,
    customDay: '周五',
    customTime: '18:00',
    notifyMode: '交接班卡片提醒',
    status: '运行中',
  },
  {
    deptId: 'impl',
    deptName: '实施部',
    isInherit: false,
    customDay: '周日',
    customTime: '20:00',
    notifyMode: '企微单聊提醒',
    status: '运行中',
  },
  {
    deptId: 'mkt',
    deptName: '市场部',
    isInherit: true,
    customDay: '周六',
    customTime: '08:00',
    notifyMode: '默认提醒',
    status: '运行中',
  },
]);

// 部门编辑 Modal
const editTimingModalOpen = ref(false);
const editingDept = ref<DeptTimingOverride | null>(null);

function openEditDeptTiming(dept: DeptTimingOverride) {
  editingDept.value = { ...dept };
  editTimingModalOpen.value = true;
}

function saveDeptTiming() {
  if (editingDept.value) {
    const idx = deptTimingList.value.findIndex(
      (d) => d.deptId === editingDept.value!.deptId,
    );
    if (idx !== -1) {
      deptTimingList.value[idx] = { ...editingDept.value };
    }
  }
  editTimingModalOpen.value = false;
  message.success('部门生成时间配置更新成功！');
}

// ----------------------------------------------------
// 3. 菜单 2：部门周报汇报设置 (部门树 + 重点关注提示词)
// ----------------------------------------------------
const selectedDeptKey = ref<string>('dev');

const deptTreeData = [
  {
    title: '🏢 集团总部 (全局配置)',
    key: 'group',
    children: [
      { title: '💻 开发部 (12人)', key: 'dev' },
      { title: '⚙️ 运维部 (8人)', key: 'ops' },
      { title: '🚀 实施部 (10人)', key: 'impl' },
      { title: '📢 市场部 (5人)', key: 'mkt' },
    ],
  },
];

interface DeptPromptConfig {
  deptName: string;
  supervisor: string;
  sensitivity: number;
  focusPrompt: string;
}

const deptPromptsMap = ref<Record<string, DeptPromptConfig>>({
  group: {
    deptName: '集团总部',
    supervisor: '张总 (集团 VP)',
    sensitivity: 80,
    focusPrompt:
      '你是一个集团级管理 AI 助手。在总结全集团周报时，请重点挖掘：1. 跨部门交付阻塞事项；2. 重点客户合同履约风险；3. 核心项目进度偏差。',
  },
  dev: {
    deptName: '开发部',
    supervisor: '张主管 (开发总监)',
    sensitivity: 85,
    focusPrompt:
      '你是一个资深的研发管理 AI 助手。在分析和总结【开发部】周报时，请重点挖掘并提炼以下内容：\n1. 【口头承诺脱节】：检查销售/市场是否已向客户承诺功能，但研发侧未入需求池和版本排期；\n2. 【技术卡扣】：挖掘是否有分布式事务、SQL 慢查询（>300ms）、第三方接口依赖阻塞；\n3. 【交付版本进度】：核对当前大版本上线日期的延期风险及自动化测试覆盖率低于 85% 的模块。',
  },
  ops: {
    deptName: '运维部',
    supervisor: '李经理 (运维负责人)',
    sensitivity: 90,
    focusPrompt:
      '你是一个资深的系统运维 AI 助手。在分析【运维部】周报时，请重点挖掘：\n1. 【现场故障与丢单】：线上环境出单失败、断连工单及丢单率情况；\n2. 【专线网络与重连】：客户现场网络波动及自动重连机制的稳定性；\n3. 【资源巡检与审计】：每日日志巡检报告中的安全隐患。',
  },
  impl: {
    deptName: '实施部',
    supervisor: '赵总监 (交付负责人)',
    sensitivity: 85,
    focusPrompt:
      '你是一个工程交付 AI 助手。在分析【实施部】周报时，请重点挖掘：\n1. 【现场验收进度】：客户现场环境搭建、演示验收与签字节点；\n2. 【产研支持需求】：实施过程中需要产品/开发协助紧急修复的问题；\n3. 【客户满意度与出差报销】：项目现场客户反馈与差旅成本控制。',
  },
  mkt: {
    deptName: '市场部',
    supervisor: '周经理 (商务总监)',
    sensitivity: 75,
    focusPrompt:
      '你是一个商务与商机 AI 助手。在分析【市场部】周报时，请重点挖掘：\n1. 【商机推进与 ROI】：重点客户 ROI 计算器演示与决策链拜访；\n2. 【客户需求承诺】：销售/商务向客户承诺的交付日期，是否已同步给实施与研发；\n3. 【续费与商机转换】：即将到期客户的续费意向与风险评估。',
  },
});

const currentDeptPrompt = computed({
  get() {
    return (
      deptPromptsMap.value[selectedDeptKey.value] || deptPromptsMap.value.dev!
    );
  },
  set(val) {
    deptPromptsMap.value[selectedDeptKey.value] = val;
  },
});

function saveDeptPromptConfig() {
  message.success(
    `已保存【${currentDeptPrompt.value.deptName}】的重点关注提示词！`,
  );
}

// ----------------------------------------------------
// 4. 菜单 3：实体提取与总结设置
// ----------------------------------------------------
const selectedEntityType = ref<'customer' | 'people' | 'product' | 'project'>(
  'project',
);

interface EntityPromptConfig {
  type: string;
  name: string;
  icon: string;
  extractPrompt: string;
  summaryPrompt: string;
  similarityThreshold: number;
  autoAlias: boolean;
}

const entityPromptsMap = ref<Record<string, EntityPromptConfig>>({
  project: {
    type: 'project',
    name: '项目实体 (Project)',
    icon: 'lucide:folder-git-2',
    extractPrompt:
      '从员工提交的连续周报文本与关联事项中，自动识别并提取符合规则的【项目名称】、【迭代版本】与【关联交付节点】。若识别到简写（如“报价V2”、“智能打印”），自动映射为标准项目名称。',
    summaryPrompt:
      '针对选定的【项目实体】，在跨部门周报汇总与穿透面板中，生成以下维度的数据洞察：\n1. 【总体健壮度】：计算该项目参与人员的整体进展正常率与异常报警数；\n2. 【跨部门协同卡扣】：自动提炼开发、运维、实施在项目交接中的卡扣事项；\n3. 【高管洞察建议】：为项目经理提供 1~2 条前瞻性的排期干预与资源调配建议。',
    similarityThreshold: 85,
    autoAlias: true,
  },
  customer: {
    type: 'customer',
    name: '客户实体 (Customer)',
    icon: 'lucide:building-2',
    extractPrompt:
      '识别周报中提及的【客户公司名称】、【客户方联系人】及【合同状态】。支持模糊匹配与缩写，如“华辰”匹配“华辰科技”。',
    summaryPrompt:
      '针对【客户实体】，提取并总结：\n1. 【服务保障人天】：汇总开发、实施、运维在该客户上的总投入工时；\n2. 【商业续费风险】：识别是否存在“已暂停续费但仍投入大量运维”的合同失配风险；\n3. 【客户承诺跟踪】：追踪销售对客户承诺功能的兑现进度。',
    similarityThreshold: 90,
    autoAlias: true,
  },
  product: {
    type: 'product',
    name: '产品实体 (Product)',
    icon: 'lucide:package',
    extractPrompt:
      '提取周报中涉及的产品模块（如“报价模块”、“打印引擎”、“审批工作流”），分析模块维度的改进项。',
    summaryPrompt:
      '针对【产品实体】，提炼：\n1. 核心功能点的迭代完成率与测试覆盖率；\n2. 客户集中反馈的易用性与性能瓶颈；\n3. 下个版本的产品规划建议。',
    similarityThreshold: 80,
    autoAlias: true,
  },
  people: {
    type: 'people',
    name: '人员实体 (People)',
    icon: 'lucide:user-check',
    extractPrompt:
      '识别团队成员姓名、部门岗位、下周承诺与历史提交记录，打通全年度周报履历。',
    summaryPrompt:
      '针对【人员实体】，总结：\n1. 个人周报提报完整度与 AI 评分；\n2. 本周高光战果与核心贡献；\n3. 负荷饱和度与延期风险诊断。',
    similarityThreshold: 95,
    autoAlias: false,
  },
});

const currentEntityPrompt = computed({
  get() {
    return (
      entityPromptsMap.value[selectedEntityType.value] ||
      entityPromptsMap.value.project!
    );
  },
  set(val) {
    entityPromptsMap.value[selectedEntityType.value] = val;
  },
});

function saveEntityPromptConfig() {
  message.success(
    `已保存【${currentEntityPrompt.value.name}】的内置提示词配置！`,
  );
}

function saveGlobalAll() {
  message.success('周报全局设置与 AI 策略配置保存成功！');
}
</script>

<template>
  <div
    class="weekly-settings-page h-full max-h-[calc(100vh-65px)] overflow-y-auto bg-[#F4F5F7] p-5 pb-20 text-[#1E293B]"
  >
    <!-- 1. 顶栏 Header -->
    <header
      class="mb-5 flex items-center justify-between rounded-2xl border border-[#E2E8F0] bg-white px-6 py-4 shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex size-10 items-center justify-center rounded-xl bg-[#EFF6FF] font-bold text-[#2563EB]"
        >
          <Icon icon="lucide:settings-2" class="size-5.5" />
        </div>
        <div>
          <h1
            class="margin-none text-base font-bold leading-snug text-[#0F172A]"
          >
            周报全局配置与 AI 策略中心
          </h1>
          <p class="margin-none text-xs text-[#64748B]">
            设置团队周报定时生成规则、各部门 AI 重点关注 Prompt
            与四大核心实体的自动挖掘总结内置提示词
          </p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <Button
          class="flex items-center gap-1.5 rounded-xl text-xs font-bold"
          @click="message.info('已恢复系统默认设置')"
        >
          <Icon icon="lucide:rotate-ccw" class="size-3.5" />
          重置默认
        </Button>
        <Button
          type="primary"
          class="flex items-center gap-1.5 rounded-xl bg-[#2563EB] text-xs font-bold shadow-sm"
          @click="saveGlobalAll"
        >
          <Icon icon="lucide:save" class="size-3.5" />
          保存全局配置
        </Button>
      </div>
    </header>

    <!-- 2. 主体 Tab 切换导航 -->
    <div
      class="shadow-xs mb-5 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white"
    >
      <div
        class="flex items-center border-b border-[#F1F5F9] bg-[#F8FAFC] px-4"
      >
        <button
          type="button"
          class="flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-bold transition-all"
          :class="
            activeTab === 'timing'
              ? 'border-[#2563EB] bg-white text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          "
          @click="activeTab = 'timing'"
        >
          <Icon icon="lucide:calendar-clock" class="size-4" />
          1. 团队周报生成日期设置
        </button>

        <button
          type="button"
          class="flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-bold transition-all"
          :class="
            activeTab === 'department-prompts'
              ? 'border-[#2563EB] bg-white text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          "
          @click="activeTab = 'department-prompts'"
        >
          <Icon icon="lucide:brain-circuit" class="size-4" />
          2. 部门周报汇报设置 (重点关注 Prompt)
        </button>

        <button
          type="button"
          class="flex cursor-pointer items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-bold transition-all"
          :class="
            activeTab === 'entity-prompts'
              ? 'border-[#2563EB] bg-white text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
          "
          @click="activeTab = 'entity-prompts'"
        >
          <Icon icon="lucide:layers" class="size-4" />
          3. 实体提取与总结设置 (内置 Prompt)
        </button>
      </div>

      <!-- 内容区 1：团队周报生成日期设置 -->
      <div v-if="activeTab === 'timing'" class="space-y-6 p-6">
        <!-- 默认生成规则 -->
        <Card
          title="🏢 集团默认生成与催报规则"
          class="shadow-2xs rounded-xl border-[#E2E8F0]"
        >
          <div class="grid grid-cols-1 gap-6 text-xs md:grid-cols-3">
            <div class="space-y-2">
              <label class="block font-bold text-[#0F172A]">
                默认生成日期与时间
              </label>
              <div class="flex items-center gap-2">
                <Select
                  v-model:value="globalSetting.defaultDay"
                  class="w-28 text-xs"
                >
                  <Select.Option value="周五">每周五</Select.Option>
                  <Select.Option value="周六">每周六 (推荐)</Select.Option>
                  <Select.Option value="周日">每周日</Select.Option>
                </Select>
                <Select
                  v-model:value="globalSetting.defaultTime"
                  class="w-28 text-xs"
                >
                  <Select.Option value="08:00">08:00 AM</Select.Option>
                  <Select.Option value="12:00">12:00 PM</Select.Option>
                  <Select.Option value="18:00">18:00 PM</Select.Option>
                  <Select.Option value="20:00">20:00 PM</Select.Option>
                </Select>
              </div>
              <p class="text-[11px] text-[#94A3B8]">
                全集团员工无特殊定制时，按此时间自动抓取数据并汇总草稿周报
              </p>
            </div>

            <div class="space-y-2">
              <label class="block font-bold text-[#0F172A]">
                催报与限期审核窗口
              </label>
              <Select
                v-model:value="globalSetting.deadlineHours"
                class="w-full text-xs"
              >
                <Select.Option value="12">生成后 12 小时内</Select.Option>
                <Select.Option value="24">
                  生成后 24 小时内 (推荐)
                </Select.Option>
                <Select.Option value="48">生成后 48 小时内</Select.Option>
              </Select>
              <p class="text-[11px] text-[#94A3B8]">
                超时未提交的周报将标记为【延期提交】，并向部门主管发出预警
              </p>
            </div>

            <div class="space-y-2">
              <label class="block font-bold text-[#0F172A]">
                超时自动提报设置
              </label>
              <div
                class="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2.5"
              >
                <span>自动提交 AI 预制草稿</span>
                <Switch
                  v-model:checked="globalSetting.autoDraft"
                  size="small"
                />
              </div>
              <p class="text-[11px] text-[#94A3B8]">
                启用后，截止时间到达时若员工未编辑，自动帮其提交草稿
              </p>
            </div>
          </div>
        </Card>

        <!-- 部门差异化规则表格 -->
        <Card
          title="⚙️ 部门差异化生成日期定制"
          class="shadow-2xs rounded-xl border-[#E2E8F0]"
        >
          <template #extra>
            <span class="text-xs text-[#64748B]">
              可为特定部门（如运维部、出差实施部）单独设定提交时间
            </span>
          </template>

          <div
            class="divide-y divide-[#F1F5F9] overflow-hidden rounded-xl border border-[#E2E8F0] text-xs"
          >
            <div
              v-for="dept in deptTimingList"
              :key="dept.deptId"
              class="flex items-center justify-between gap-4 bg-white p-4 transition-colors hover:bg-[#F8FAFC]"
            >
              <div class="flex min-w-[150px] items-center gap-3">
                <div
                  class="flex size-8 items-center justify-center rounded-lg bg-[#EFF6FF] font-bold text-[#2563EB]"
                >
                  <Icon icon="lucide:building-2" class="size-4" />
                </div>
                <div>
                  <span class="block font-bold text-[#0F172A]">
                    {{ dept.deptName }}
                  </span>
                  <Tag
                    :color="dept.isInherit ? 'blue' : 'purple'"
                    class="scale-85 margin-none border-none"
                  >
                    {{ dept.isInherit ? '继承默认规则' : '独立定制规则' }}
                  </Tag>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-[#64748B]">生成时间：</span>
                <span
                  class="rounded bg-[#F1F5F9] px-2 py-0.5 font-mono font-bold text-[#0F172A]"
                >
                  每{{ dept.customDay }} {{ dept.customTime }}
                </span>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-[#64748B]">提醒策略：</span>
                <span class="font-medium text-[#334155]">
                  {{ dept.notifyMode }}
                </span>
              </div>

              <div class="flex items-center gap-3">
                <Tag color="green" class="border-none font-bold">
                  {{ dept.status }}
                </Tag>
                <Button
                  type="link"
                  size="small"
                  class="p-0 font-bold text-[#2563EB]"
                  @click="openEditDeptTiming(dept)"
                >
                  编辑定时规则
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <!-- 内容区 2：部门周报汇报设置 (重点关注 Prompt) -->
      <div v-else-if="activeTab === 'department-prompts'" class="p-6">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-4">
          <!-- 左侧：部门树 -->
          <div
            class="space-y-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
          >
            <h3
              class="margin-none flex items-center gap-1.5 text-xs font-bold text-[#0F172A]"
            >
              <Icon icon="lucide:network" class="size-4 text-[#2563EB]" />
              选择目标部门
            </h3>
            <Tree
              v-model:selected-keys="selectedDeptKey"
              :tree-data="deptTreeData"
              default-expand-all="true"
              class="bg-transparent text-xs"
            />
          </div>

          <!-- 右侧：选中的部门 Focus Prompt 设置 -->
          <div
            class="space-y-5 rounded-xl border border-[#E2E8F0] bg-white p-5 md:col-span-3"
          >
            <div
              class="flex items-center justify-between border-b border-[#F1F5F9] pb-3"
            >
              <div>
                <h3
                  class="margin-none flex items-center gap-2 text-sm font-bold text-[#0F172A]"
                >
                  【{{ currentDeptPrompt.deptName }}】重点关注提示词设置
                </h3>
                <span class="text-xs text-[#64748B]">
                  默认主管：{{ currentDeptPrompt.supervisor }}
                </span>
              </div>
              <Button
                type="primary"
                size="small"
                class="bg-[#2563EB] text-xs font-bold"
                @click="saveDeptPromptConfig"
              >
                保存部门提示词
              </Button>
            </div>

            <!-- Prompt 文本域 -->
            <div class="space-y-2">
              <label
                class="block flex items-center justify-between text-xs font-bold text-[#0F172A]"
              >
                <span>AI 重点关注 Prompt (系统将自动注入该部门周报分析流)</span>
                <span class="text-[11px] text-[#94A3B8]">
                  支持设置该部门专属的风控拦截规则
                </span>
              </label>
              <Input.TextArea
                v-model:value="currentDeptPrompt.focusPrompt"
                :rows="8"
                class="rounded-xl border-[#E2E8F0] bg-[#F8FAFC] p-3 font-mono text-xs text-[#334155]"
              />
            </div>

            <!-- 其它高级选项 -->
            <div class="grid grid-cols-1 gap-4 pt-2 text-xs md:grid-cols-2">
              <div class="space-y-1.5">
                <label class="font-bold text-[#0F172A]">
                  AI 风险告警敏感度
                </label>
                <Slider
                  v-model:value="currentDeptPrompt.sensitivity"
                  :min="50"
                  :max="100"
                />
                <span class="text-[11px] text-[#64748B]">
                  当前敏感度：{{ currentDeptPrompt.sensitivity }}%
                  (用于卡扣诊断与前置预警)
                </span>
              </div>

              <div class="space-y-1.5">
                <label class="font-bold text-[#0F172A]">
                  默认风控卡片派发主管
                </label>
                <Input
                  v-model:value="currentDeptPrompt.supervisor"
                  class="text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 内容区 3：实体提取与总结设置 (内置 Prompt) -->
      <div v-else-if="activeTab === 'entity-prompts'" class="p-6">
        <div class="grid grid-cols-1 gap-6 md:grid-cols-4">
          <!-- 左侧：实体类型选择列表 -->
          <div class="space-y-2">
            <h3 class="margin-none mb-3 text-xs font-bold text-[#0F172A]">
              四大核心实体类型
            </h3>
            <button
              v-for="(ent, typeKey) in entityPromptsMap"
              :key="typeKey"
              type="button"
              class="flex w-full cursor-pointer items-center justify-between rounded-xl border p-3 text-left text-xs font-bold transition-all"
              :class="
                selectedEntityType === typeKey
                  ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                  : 'border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC]'
              "
              @click="selectedEntityType = typeKey as any"
            >
              <div class="flex items-center gap-2">
                <Icon :icon="ent.icon" class="size-4" />
                <span>{{ ent.name }}</span>
              </div>
              <Icon icon="lucide:chevron-right" class="size-3.5 opacity-60" />
            </button>
          </div>

          <!-- 右侧：选中实体的内置 Prompt 深入配置 -->
          <div
            class="space-y-5 rounded-xl border border-[#E2E8F0] bg-white p-5 md:col-span-3"
          >
            <div
              class="flex items-center justify-between border-b border-[#F1F5F9] pb-3"
            >
              <div class="flex items-center gap-2">
                <Icon
                  :icon="currentEntityPrompt.icon"
                  class="size-5 text-[#2563EB]"
                />
                <h3 class="margin-none text-sm font-bold text-[#0F172A]">
                  {{ currentEntityPrompt.name }} · 内置挖掘与总结 Prompt
                </h3>
              </div>
              <Button
                type="primary"
                size="small"
                class="bg-[#2563EB] text-xs font-bold"
                @click="saveEntityPromptConfig"
              >
                保存实体提示词
              </Button>
            </div>

            <!-- 1. 实体识别与抽取 Prompt -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-[#0F172A]">
                1. 实体自动挖掘与识别 Prompt (Extraction Prompt)
              </label>
              <Input.TextArea
                v-model:value="currentEntityPrompt.extractPrompt"
                :rows="3"
                class="rounded-xl border-[#E2E8F0] bg-[#F8FAFC] p-3 font-mono text-xs text-[#334155]"
              />
            </div>

            <!-- 2. 实体总结与风控 Prompt -->
            <div class="space-y-2">
              <label class="block text-xs font-bold text-[#0F172A]">
                2. 实体 Context 全景总结 Prompt (Summary & Risk Prompt)
              </label>
              <Input.TextArea
                v-model:value="currentEntityPrompt.summaryPrompt"
                :rows="6"
                class="rounded-xl border-[#E2E8F0] bg-[#F8FAFC] p-3 font-mono text-xs text-[#334155]"
              />
            </div>

            <!-- 3. 高级识别规则 -->
            <div
              class="grid grid-cols-1 gap-4 border-t border-[#F1F5F9] pt-2 text-xs md:grid-cols-2"
            >
              <div class="space-y-1.5">
                <label class="font-bold text-[#0F172A]">
                  语义匹配相似度阈值
                </label>
                <Slider
                  v-model:value="currentEntityPrompt.similarityThreshold"
                  :min="60"
                  :max="100"
                />
                <span class="text-[11px] text-[#64748B]">
                  当前阈值：{{ currentEntityPrompt.similarityThreshold }}%
                </span>
              </div>

              <div class="space-y-1.5">
                <label class="font-bold text-[#0F172A]">
                  AI 自动联想别名补全
                </label>
                <div
                  class="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2"
                >
                  <span>自动将别名/缩写映射为标准实体</span>
                  <Switch
                    v-model:checked="currentEntityPrompt.autoAlias"
                    size="small"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. 部门定时规则编辑 Modal -->
    <Modal
      v-model:open="editTimingModalOpen"
      :title="`编辑【${editingDept?.deptName}】周报生成规则`"
      ok-text="保存更改"
      cancel-text="取消"
      @ok="saveDeptTiming"
    >
      <div v-if="editingDept" class="space-y-4 py-3 text-xs">
        <div
          class="flex items-center justify-between rounded-xl bg-[#F8FAFC] p-3"
        >
          <span class="font-bold">使用集团默认定时规则</span>
          <Switch v-model:checked="editingDept.isInherit" />
        </div>

        <div v-if="!editingDept.isInherit" class="space-y-3 pt-2">
          <div class="space-y-1">
            <label class="font-bold">定制生成日期与时间</label>
            <div class="flex gap-2">
              <Select
                v-model:value="editingDept.customDay"
                class="w-full text-xs"
              >
                <Select.Option value="周五">每周五</Select.Option>
                <Select.Option value="周六">每周六</Select.Option>
                <Select.Option value="周日">每周日</Select.Option>
              </Select>
              <Select
                v-model:value="editingDept.customTime"
                class="w-full text-xs"
              >
                <Select.Option value="18:00">18:00 PM</Select.Option>
                <Select.Option value="20:00">20:00 PM</Select.Option>
                <Select.Option value="08:00">08:00 AM</Select.Option>
              </Select>
            </div>
          </div>

          <div class="space-y-1">
            <label class="font-bold">通知提醒策略</label>
            <Input v-model:value="editingDept.notifyMode" class="text-xs" />
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.weekly-settings-page {
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>
