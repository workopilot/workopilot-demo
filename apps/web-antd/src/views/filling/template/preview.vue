<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Divider, message, Modal, Radio, Tag } from 'ant-design-vue';

const router = useRouter();
const route = useRoute();

const tplId = route.params.id as string;

// Mock Templates detail (same as list, but with full prompt)
const templates: Record<string, any> = {
  tpl_1: {
    id: 'tpl_1',
    title: '典型差旅报销单',
    description:
      '适用于标准差旅报销场景，包含行程提取、发票查验及合规审查规则。',
    icon: 'lucide:plane',
    color: '#0ea5e9',
    bgColor: '#e0f2fe',
    tags: ['财务', '报销', '高频'],
    rulesCount: 5,
    promptCount: 12,
    prompt: `角色：你是一个专业的【智能差旅报销单填报助手】。
职责：你的主要任务是根据用户提供的聊天记录、发票截图、机票订单等杂乱信息，精准提取并梳理填报系统所需的字段。

你需要严格遵循以下约束规则：
=======================
1. 【金额匹配】报销金额必须完全匹配发票金额，精确到分，不得四舍五入。
2. 【出租车费分类】差旅途中产生的出租车、网约车费用，一律归类为【差旅交通费】，不得选择【加班打车】。
3. 【高铁座位等级】高铁报销默认按二等座核准，VP 及以上职级支持一等座，若发现等级不符需自动降级处理并告知用户。
4. 【餐饮拆分规则】餐饮报销如果包含酒水，酒水部分必须独立拆分至"业务招待费"类目，不得混入"餐费"。
5. 【外币换算】如存在境外发票，请调用汇率工具将外币金额自动换算为人民币，汇率以出差发生日为准。

你需要提取的核心字段：
- 报销总金额（元，保留两位小数）
- 发票明细（张数、类型、金额）
- 出差起止日期
- 出差目的地
- 成本中心/部门代码
- 出差事由（一句话描述）`,
    requiredFields: [
      '报销总额',
      '发票明细',
      '成本中心',
      '出差事由',
      '出差日期',
      '目的地',
    ],
  },
  tpl_2: {
    id: 'tpl_2',
    title: '通用请假申请单',
    description: '标准化的请假申请模板，自带考勤规则及假期类型自动判断提示词。',
    icon: 'lucide:calendar-clock',
    color: '#10b981',
    bgColor: '#d1fae5',
    tags: ['人事', '考勤'],
    rulesCount: 3,
    promptCount: 8,
    prompt: `角色：你是一个专业的【智能请假申请单填报助手】。
职责：根据员工的请假描述信息，自动判断假期类型、计算请假时长，并整理填报所需字段。

你需要严格遵循以下约束规则：
=======================
1. 【假期类型判断】根据员工叙述自动判断：病假、年假、事假、调休、婚假、产假等。
2. 【工作日计算】请假时长只计算工作日，需调用差旅日期推算工具排除节假日。
3. 【年假余额校验】申请年假时，需检查员工剩余年假天数，不足时发出警告。

你需要提取的核心字段：
- 假期类型
- 开始日期 / 结束日期
- 请假天数（工作日）
- 请假事由`,
    requiredFields: [
      '假期类型',
      '开始日期',
      '结束日期',
      '请假天数',
      '请假事由',
    ],
  },
  tpl_3: {
    id: 'tpl_3',
    title: '标准化运维工单',
    description:
      'IT 或运维事件单，包含从聊天记录中自动抽取故障现象及定级的规则。',
    icon: 'lucide:wrench',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    tags: ['IT', '运维', '工单'],
    rulesCount: 6,
    promptCount: 15,
    prompt: `角色：你是一个专业的【智能 IT 运维工单填报助手】。
职责：从用户描述的故障现象、聊天记录或截图中提取关键信息，自动生成标准化运维工单。

你需要严格遵循以下约束规则：
=======================
1. 【故障定级】根据影响范围自动判断：P0（全线阻断）/ P1（核心功能受损）/ P2（边缘功能异常）/ P3（轻微问题）。
2. 【时间提取】从描述中精准提取故障发现时间，格式为 YYYY-MM-DD HH:mm。
3. 【影响范围】明确列出故障影响的系统模块或用户群体。

你需要提取的核心字段：
- 故障标题（简洁描述）
- 故障等级（P0-P3）
- 发现时间
- 故障现象（详细描述）
- 影响范围
- 处理负责人`,
    requiredFields: [
      '故障标题',
      '故障等级',
      '发现时间',
      '故障现象',
      '影响范围',
    ],
  },
  tpl_4: {
    id: 'tpl_4',
    title: '对公付款申请',
    description:
      '标准的供应商对公付款模板，含合同金额对比、收款方账户验证规则。',
    icon: 'lucide:building-2',
    color: '#f59e0b',
    bgColor: '#fef3c7',
    tags: ['财务', '付款'],
    rulesCount: 8,
    promptCount: 20,
    prompt: `角色：你是一个专业的【智能对公付款申请单填报助手】。
职责：根据付款申请的合同、发票及沟通记录，提取并填写付款申请所需的全部字段。

你需要严格遵循以下约束规则：
=======================
1. 【金额一致性】付款金额不得超过合同约定金额，若超出需要人工审批确认。
2. 【供应商校验】付款前需通过合规黑名单工具校验收款方资质，黑名单内供应商禁止付款。
3. 【账户验证】银行账号需与合同附件中的账户完全一致，不一致时禁止提交并告警。
4. 【税率处理】含税与不含税金额需分别填写，税额由系统自动计算。

你需要提取的核心字段：
- 收款方名称
- 银行账号 / 开户行
- 付款金额（含税/不含税）
- 付款事由
- 关联合同编号
- 付款期限`,
    requiredFields: [
      '收款方名称',
      '银行账号',
      '付款金额',
      '付款事由',
      '合同编号',
    ],
  },
};

const tpl = ref(templates[tplId] || templates.tpl_1);

// Apply Modal
const applyModalVisible = ref(false);
const systems = ref([
  { id: 's_1', name: 'SAP S/4HANA (总部)', icon: 'lucide:database' },
  { id: 's_2', name: '用友 NC Cloud', icon: 'lucide:cloud' },
  { id: 's_3', name: '自研差旅平台', icon: 'lucide:plane' },
]);
const selectedSystemId = ref('s_1');

function openApplyModal() {
  selectedSystemId.value = 's_1';
  applyModalVisible.value = true;
}

function confirmApply() {
  const sys = systems.value.find((s) => s.id === selectedSystemId.value);
  message.success(
    `已将「${tpl.value.title}」应用至 [${sys?.name}]，单据初稿创建成功！`,
  );
  applyModalVisible.value = false;
  router.push('/agent/smart_filling/scripts');
}
</script>

<template>
  <div class="min-h-screen bg-slate-50/50">
    <!-- Top Navigation Bar -->
    <header
      class="sticky top-0 z-20 border-b border-slate-200 bg-white shadow-sm"
    >
      <div
        class="mx-auto flex h-14 max-w-5xl items-center justify-between px-6"
      >
        <div class="flex items-center gap-3">
          <Button
            type="text"
            shape="circle"
            class="!flex !items-center !justify-center bg-slate-50 text-slate-500 hover:text-slate-900"
            @click="router.back()"
          >
            <Icon icon="lucide:arrow-left" class="size-5" />
          </Button>
          <Divider type="vertical" class="h-5" />
          <span class="text-sm text-slate-500">模板中心</span>
          <Icon icon="lucide:chevron-right" class="size-4 text-slate-300" />
          <span class="text-sm font-bold text-slate-900">{{ tpl.title }}</span>
        </div>
        <Button
          type="primary"
          size="middle"
          class="!rounded-xl !bg-slate-900 !px-6 !font-semibold shadow"
          @click="openApplyModal"
        >
          <Icon icon="lucide:zap" class="mr-1.5 size-4" />
          应用此模板
        </Button>
      </div>
    </header>

    <!-- Page Body -->
    <div class="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-10">
      <!-- Template Hero -->
      <div class="flex items-start gap-6">
        <div
          class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-sm"
          :style="{ backgroundColor: tpl.bgColor, color: tpl.color }"
        >
          <Icon :icon="tpl.icon" class="size-8" />
        </div>
        <div class="flex-1">
          <div class="mb-2 flex flex-wrap items-center gap-3">
            <h1 class="m-0 text-2xl font-bold text-slate-900">
              {{ tpl.title }}
            </h1>
            <Tag
              v-for="tag in tpl.tags"
              :key="tag"
              :bordered="false"
              class="!m-0 !rounded-md !bg-slate-100 !text-xs !font-medium !text-slate-600"
            >
              {{ tag }}
            </Tag>
          </div>
          <p class="m-0 text-sm leading-relaxed text-slate-500">
            {{ tpl.description }}
          </p>
          <div
            class="mt-3 flex items-center gap-5 text-xs font-semibold text-slate-400"
          >
            <span class="flex items-center gap-1.5">
              <Icon icon="lucide:book-open-check" class="size-4" />
              {{ tpl.rulesCount }} 条内置规则
            </span>
            <span class="flex items-center gap-1.5">
              <Icon icon="lucide:brain-circuit" class="size-4" />
              {{ tpl.promptCount }} 个提取Prompt
            </span>
          </div>
        </div>
      </div>

      <!-- Required Fields Preview -->
      <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2
          class="mb-4 flex items-center gap-2 text-base font-bold text-slate-800"
        >
          <Icon icon="lucide:sparkles" class="size-5 text-amber-500" />
          AI 需提取的核心字段
        </h2>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="field in tpl.requiredFields"
            :key="field"
            class="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700"
          >
            <Icon
              icon="lucide:check-circle-2"
              class="size-3.5 text-indigo-400"
            />
            {{ field }}
          </div>
        </div>
      </div>

      <!-- System Prompt Preview -->
      <div
        class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div
          class="flex items-center gap-2 border-b border-slate-100 bg-slate-50/50 px-6 py-4"
        >
          <Icon
            icon="lucide:bot-message-square"
            class="size-5 text-indigo-600"
          />
          <h2 class="m-0 text-base font-bold text-slate-800">
            智能体提示词 (System Prompt)
          </h2>
          <span class="ml-auto text-xs text-slate-400">
            应用后可在单据配置中继续编辑
          </span>
        </div>
        <div class="p-6">
          <pre
            class="whitespace-pre-wrap rounded-xl border border-indigo-100/60 bg-gradient-to-br from-indigo-50/30 to-slate-50 p-5 font-mono text-sm leading-relaxed text-slate-700"
            >{{ tpl.prompt }}</pre
          >
        </div>
      </div>
    </div>

    <!-- Apply System Selection Modal -->
    <Modal
      v-model:open="applyModalVisible"
      title="选择目标系统"
      width="480px"
      @ok="confirmApply"
      :ok-button-props="{
        class: '!bg-slate-900 !rounded-lg !border-none !font-semibold',
      }"
      :cancel-button-props="{ class: '!rounded-lg' }"
      ok-text="确认应用，创建单据"
      cancel-text="取消"
    >
      <p class="mb-5 mt-2 text-sm text-slate-500">
        将「
        <strong>{{ tpl.title }}</strong>
        」模板应用到以下系统，系统将自动创建一个初始单据配置，并将模板提示词作为默认
        System Prompt 填入。
      </p>
      <div class="space-y-2">
        <Radio.Group v-model:value="selectedSystemId" class="w-full">
          <div
            v-for="sys in systems"
            :key="sys.id"
            class="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3.5 transition-all"
            :class="
              selectedSystemId === sys.id
                ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                : 'border-slate-200 hover:bg-slate-50'
            "
            @click="selectedSystemId = sys.id"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              :class="
                selectedSystemId === sys.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-400'
              "
            >
              <Icon :icon="sys.icon" class="size-4" />
            </div>
            <span
              class="flex-1 text-sm font-semibold"
              :class="
                selectedSystemId === sys.id
                  ? 'text-indigo-900'
                  : 'text-slate-700'
              "
            >
              {{ sys.name }}
            </span>
            <Radio :value="sys.id" />
          </div>
        </Radio.Group>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
pre {
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
}
</style>
