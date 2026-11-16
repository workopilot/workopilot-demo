<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  Form,
  Input,
  message,
  Modal,
  Space,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import CodeEditor from '#/components/CodeEditor/index.vue';

const route = useRoute();
const router = useRouter();
const docId = route.query.id as string;

const allDocs: Record<string, any> = {
  d_1: {
    id: 'd_1',
    code: 'DOC_EXP_001',
    name: '研发中心差旅报销单',
    system: 'SAP S/4HANA (总部)',
    requiredFields: ['报销总额', '发票明细', '成本中心', '出差事由'],
  },
  d_2: {
    id: 'd_2',
    code: 'DOC_PAY_002',
    name: '对公付款申请-耗材',
    system: 'SAP S/4HANA (总部)',
    requiredFields: ['供应商名称', '付款总额', '银行账号'],
  },
  d_3: {
    id: 'd_3',
    code: 'DOC_YY_001',
    name: '用友请假申请单',
    system: '用友 NC Cloud',
    requiredFields: ['假期类型', '开始日期', '结束日期', '请假事由'],
  },
  d_4: {
    id: 'd_4',
    code: 'DOC_YY_002',
    name: '用友对公付款单',
    system: '用友 NC Cloud',
    requiredFields: ['供应商', '开票额度', '付款方式'],
  },
  d_5: {
    id: 'd_5',
    code: 'DOC_ZY_001',
    name: '自研平台差旅报销单',
    system: '自研差旅平台',
    requiredFields: ['行程信息', '开销金额', '项目编号'],
  },
};

const docInfo = computed(() => allDocs[docId] || allDocs.d_1);

interface StepConfig {
  id: string;
  name: string;
  prompt: string;
  ruleIds: string[];
  order: number;
}

const steps = ref<StepConfig[]>([
  {
    id: '1',
    name: '关联差旅申请单与行程确认',
    prompt:
      '根据用户的报销描述，匹配已审批通过的差旅申请单，让用户选择关联。\n\n流程：\n1. 展示匹配的差旅申请单列表，预选最相关的申请单\n2. 用户确认后，根据申请单明细生成行程列表\n3. 用户可修改行程（增删改），需记录差异说明\n\n可用工具：\n- 差旅日期推算：智能推算实际出差天数\n- 地图里程测算：计算两点之间的驾车里程',
    ruleIds: [],
    order: 1,
  },
  {
    id: '2',
    name: '收集单头信息',
    prompt:
      '根据用户选择的单据类型和报销描述，推断并填充单头信息。\n\n需要推断的字段：\n- 公司（根据用户描述匹配对应公司）\n- 预算类别（全年预算 / 项目预算）\n- 项目（选择项目预算后需选择具体项目）\n- 事项描述（根据用户描述提炼）\n- 申请人（当前登录人自动带出）\n- 部门（自动匹配）\n- 业务大类\n- 币种（默认RMB_人民币）\n\n可用工具：\n- 内部岗位与职级查询：查询员工所属部门信息\n\n以表格形式展示推断结果，让用户确认或修改。',
    ruleIds: [],
    order: 2,
  },
  {
    id: '3',
    name: '发票筛选与费用明细确认',
    prompt:
      '根据出差日期、公司等条件从发票池中筛选匹配的发票，生成费用明细。\n\n流程：\n1. 根据出差日期范围和公司筛选发票\n2. 按科目分类（火车票、住宿费、市内交通费等）\n3. 生成费用明细表，展示发票金额和报销金额\n4. 用户可调整报销金额、补充附件（如水单）\n5. 自动计算差旅补贴\n\n可用工具：\n- OCR 凭证识别：识别发票图片中的信息\n- 标准税率查询：查询适用税率\n- 汇率实时转换：外币费用折算\n\n规则引用：根据已关联的规则校验字段完整性',
    ruleIds: ['住宿费规则', '火车票规则'],
    order: 3,
  },
  {
    id: '4',
    name: '生成待办卡片',
    prompt:
      '根据确认的费用明细，生成差旅报销单待办卡片。\n\n卡片内容：\n- 单据编号\n- 合计金额\n- 关联申请单数量\n- 发票数量\n- 费用明细项数\n- 行程段数\n\n告知用户可点击「立即处理」查看完整单据内容并提交。',
    ruleIds: [],
    order: 4,
  },
]);

const currentStepId = ref(steps.value[2]?.id || '');
const currentStep = computed(() =>
  steps.value.find((s) => s.id === currentStepId.value),
);
const activeMenu = ref<'docPrompt' | string>('docPrompt');
const docPrompt = ref(
  '角色：你是一个专业的【差旅报销单填报助手】。\n职责：根据用户提供的聊天记录、发票截图等杂乱信息，精准提取并梳理填报系统所需的字段。\n\n全局约束：\n1. 报销金额必须完全匹配发票金额。\n2. 所有费用必须有对应的发票或凭证支撑。\n3. 住宿费必须提供水单附件。',
);

const toolModalVisible = ref(false);

const mountedTools = [
  {
    name: 'OCR 凭证识别',
    icon: 'lucide:scan-text',
    category: '内置',
    desc: '自动识别发票、小票、增值税发票图片，结构化输出金额、日期与税号。',
  },
  {
    name: '标准税率查询',
    icon: 'lucide:calculator',
    category: '内置',
    desc: '覆盖全国行业税率库，支持增值税、个税、附加税率自动换算。',
  },
  {
    name: '内部岗位与职级查询',
    icon: 'lucide:users',
    category: 'MCP',
    desc: '接入企业 HR 系统，实时查询员工岗位、职级、成本中心和汇报线信息。',
  },
  {
    name: '差旅日期推算',
    icon: 'lucide:calendar-clock',
    category: '内置',
    desc: '基于法定节假日数据，智能推算实际出差天数，自动剔除非工作日。',
  },
  {
    name: '地图里程测算',
    icon: 'lucide:map',
    category: 'MCP',
    desc: '调用高德地图 API 计算两点之间的实际驾车/网约车里程，辅助车费合理性校验。',
  },
  {
    name: '汇率实时转换',
    icon: 'lucide:dollar-sign',
    category: '内置',
    desc: '接入央行及主流平台实时汇率数据，支持外币费用自动折算为人民币。',
  },
  {
    name: '审批人查询 API',
    icon: 'lucide:git-branch',
    category: 'MCP',
    desc: '根据申请人工号与申请类型，自动查询对应审批链，填充审批人字段。',
  },
  {
    name: 'Playwright MCP',
    icon: 'lucide:monitor-play',
    category: 'MCP',
    desc: '将 Playwright 操作能力封装为可调用工具，支持无头浏览器驱动业务系统配合录制脚本执行。',
  },
  {
    name: '合规黑名单校验',
    icon: 'lucide:shield-check',
    category: '内置',
    desc: '查询供应商或收款方是否在企业合规黑名单中，联动填报拦截逻辑。',
  },
  {
    name: '自定义 REST API 调用',
    icon: 'lucide:webhook',
    category: 'Custom',
    desc: '配置任意企业内部 REST API Endpoint，将其能力包装成智能体可直接调用的工具。',
  },
  {
    name: '邮件附件解析',
    icon: 'lucide:mail',
    category: '内置',
    desc: '自动从指定邮箱中读取并解析报销相关附件（PDF 发票等），省去手动下载环节。',
  },
  {
    name: '钉钉/飞书消息通知',
    icon: 'lucide:bell',
    category: 'MCP',
    desc: '在填报完成、审批通过或被驳回时，通过钉钉/飞书机器人向申请人发送实时通知。',
  },
];

const editingStep = ref<null | StepConfig>(null);
const stepEditVisible = ref(false);

function openStepEdit(step: StepConfig) {
  editingStep.value = step;
  stepEditVisible.value = true;
}

function handleStepEditOk() {
  stepEditVisible.value = false;
  editingStep.value = null;
}

function addStep() {
  const newId = String(Date.now());
  steps.value.push({
    id: newId,
    name: `步骤 ${steps.value.length + 1}`,
    prompt: '',
    ruleIds: [],
    order: steps.value.length + 1,
  });
  currentStepId.value = newId;
}

function deleteStep(id: string) {
  const idx = steps.value.findIndex((s) => s.id === id);
  if (idx === -1) return;
  steps.value.splice(idx, 1);
  if (currentStepId.value === id)
    currentStepId.value = steps.value[0]?.id || '';
}

function moveStep(id: string, direction: 'down' | 'up') {
  const idx = steps.value.findIndex((s) => s.id === id);
  if (idx === -1) return;
  const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
  if (targetIdx < 0 || targetIdx >= steps.value.length) return;
  const temp = steps.value[idx]!;
  steps.value[idx] = steps.value[targetIdx]!;
  steps.value[targetIdx] = temp;
  steps.value.forEach((s, i) => (s.order = i + 1));
}

function handleSave() {
  message.success('步骤配置已保存');
}
function goBack() {
  router.push('/agent/smart_filling/scripts');
}

function removeRuleId(rid: string) {
  if (!currentStep.value) return;
  currentStep.value.ruleIds = currentStep.value.ruleIds.filter(
    (r) => r !== rid,
  );
}

const showRuleSelector = ref(false);
const selectedRuleIds = ref<string[]>([]);

const availableRules = [
  { id: 'fr_1', name: '住宿费规则', auditTypes: ['住宿费'] },
  { id: 'fr_2', name: '火车票规则', auditTypes: ['火车票'] },
  { id: 'fr_3', name: '市内交通费规则', auditTypes: ['市内交通费'] },
];

function toggleRuleSelect(name: string) {
  const idx = selectedRuleIds.value.indexOf(name);
  if (idx === -1) {
    selectedRuleIds.value.push(name);
  } else {
    selectedRuleIds.value.splice(idx, 1);
  }
}

function openRuleSelector() {
  selectedRuleIds.value = currentStep.value
    ? [...currentStep.value.ruleIds]
    : [];
  showRuleSelector.value = true;
}

function handleAddRules() {
  if (!currentStep.value) return;
  selectedRuleIds.value.forEach((name) => {
    if (!currentStep.value!.ruleIds.includes(name))
      currentStep.value!.ruleIds.push(name);
  });
  showRuleSelector.value = false;
}
</script>

<template>
  <div class="flex h-full flex-col bg-gray-50">
    <header class="z-10 shrink-0 border-b bg-white px-6 py-3 shadow-sm">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button
            type="text"
            shape="circle"
            class="!flex !items-center !justify-center bg-slate-50 text-slate-500 hover:bg-slate-100"
            @click="goBack"
          >
            <Icon icon="lucide:arrow-left" class="size-5" />
          </Button>
          <div>
            <h2 class="m-0 text-lg font-bold text-slate-900">
              数据收集步骤配置
            </h2>
            <p class="m-0 text-xs text-slate-400">
              {{ docInfo.code }} · {{ docInfo.name }} · {{ docInfo.system }}
            </p>
          </div>
        </div>
        <Space>
          <Button @click="goBack">取消</Button>
          <Button type="primary" class="!bg-slate-900" @click="handleSave">
            <Icon icon="lucide:save" class="mr-1 size-4" />
            保存配置
          </Button>
        </Space>
      </div>
    </header>

    <div class="grid min-h-0 flex-1 grid-cols-12 gap-0 overflow-hidden">
      <div class="col-span-3 flex flex-col overflow-hidden border-r bg-white">
        <div class="space-y-0.5 border-b p-3">
          <div
            class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all"
            :class="
              activeMenu === 'docPrompt'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50'
            "
            @click="activeMenu = 'docPrompt'"
          >
            <Icon icon="lucide:file-text" class="size-4" />
            <span>单据提示词配置</span>
          </div>
        </div>
        <div class="flex items-center justify-between px-4 py-3">
          <h3 class="m-0 text-sm font-bold text-slate-700">步骤列表</h3>
          <Button
            size="small"
            type="primary"
            class="!rounded-lg !bg-slate-900"
            @click="addStep"
          >
            <Icon icon="lucide:plus" class="mr-1 size-3" />
            新增步骤
          </Button>
        </div>
        <div class="flex-1 space-y-1 overflow-y-auto p-3">
          <div
            v-for="(step, index) in steps"
            :key="step.id"
            class="group cursor-pointer rounded-xl border p-3 transition-all"
            :class="
              activeMenu === step.id
                ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
            "
            @click="
              activeMenu = step.id;
              currentStepId = step.id;
            "
          >
            <div class="flex items-center justify-between">
              <div class="flex min-w-0 items-center gap-2">
                <span
                  class="flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                  :class="
                    activeMenu === step.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  "
                >
                  {{ index + 1 }}
                </span>
                <span
                  class="truncate text-sm font-medium"
                  :class="
                    activeMenu === step.id
                      ? 'text-indigo-900'
                      : 'text-slate-700'
                  "
                >
                  {{ step.name }}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <Tooltip title="编辑">
                  <Button
                    type="text"
                    size="small"
                    class="!h-auto !p-1 !text-slate-400 hover:!text-blue-500"
                    @click.stop="openStepEdit(step)"
                  >
                    <Icon icon="lucide:edit" class="size-3" />
                  </Button>
                </Tooltip>
                <div
                  class="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Tooltip title="上移">
                    <Button
                      type="text"
                      size="small"
                      class="!h-auto !p-1 !text-slate-400 hover:!text-slate-700"
                      :disabled="index === 0"
                      @click.stop="moveStep(step.id, 'up')"
                    >
                      <Icon icon="lucide:arrow-up" class="size-3" />
                    </Button>
                  </Tooltip>
                  <Tooltip title="下移">
                    <Button
                      type="text"
                      size="small"
                      class="!h-auto !p-1 !text-slate-400 hover:!text-slate-700"
                      :disabled="index === steps.length - 1"
                      @click.stop="moveStep(step.id, 'down')"
                    >
                      <Icon icon="lucide:arrow-down" class="size-3" />
                    </Button>
                  </Tooltip>
                  <Tooltip title="删除">
                    <Button
                      type="text"
                      size="small"
                      danger
                      class="!h-auto !p-1"
                      @click.stop="deleteStep(step.id)"
                    >
                      <Icon icon="lucide:trash-2" class="size-3" />
                    </Button>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 单据提示词配置 -->
      <div
        v-if="activeMenu === 'docPrompt'"
        class="col-span-9 flex flex-col overflow-hidden bg-white p-6"
      >
        <div class="mb-4 flex items-center justify-between">
          <div>
            <h3 class="text-base font-bold text-slate-800">单据提示词配置</h3>
            <p class="mt-1 text-xs text-slate-400">
              定义该单据填报智能体的基础人设、工作流约定和约束边界，所有步骤共享此上下文。
            </p>
          </div>
          <Button
            size="small"
            class="!rounded-lg"
            @click="toolModalVisible = true"
          >
            <Icon icon="lucide:book-open" class="mr-1 size-3" />
            查看工具挂载清单
          </Button>
        </div>
        <div class="relative flex-1 overflow-hidden rounded-lg border">
          <CodeEditor
            v-model:value="docPrompt"
            mode="text"
            placeholder="编写单据级别的系统提示词..."
            class="h-full"
          />
        </div>
      </div>

      <!-- 步骤配置 -->
      <template v-if="activeMenu !== 'docPrompt'">
        <div class="col-span-5 overflow-y-auto bg-white p-6">
          <template v-if="currentStep">
            <div class="mb-4">
              <h3 class="text-base font-bold text-slate-800">
                {{ currentStep.name }}
              </h3>
            </div>
            <Form layout="vertical" class="max-w-3xl">
              <Form.Item label="步骤名称" required>
                <Input
                  v-model:value="currentStep.name"
                  placeholder="如：收集发票信息"
                />
              </Form.Item>
              <div class="mb-4 rounded-lg border border-slate-200">
                <div class="flex items-center justify-between px-4 py-3">
                  <div class="flex items-center gap-2">
                    <Icon
                      icon="lucide:shield-check"
                      class="size-4 text-slate-400"
                    />
                    <span class="text-sm font-bold text-slate-700">
                      规则配置
                    </span>
                    <span class="text-xs text-slate-400">
                      已关联 {{ currentStep.ruleIds?.length || 0 }} 条规则
                    </span>
                  </div>
                  <div class="flex items-center gap-2">
                    <Button
                      size="small"
                      class="!rounded-lg"
                      @click="openRuleSelector"
                    >
                      <Icon icon="lucide:plus" class="mr-1 size-3" />
                      添加规则
                    </Button>
                    <Button
                      size="small"
                      class="!rounded-lg"
                      @click="router.push('/agent/smart_filling/rules')"
                    >
                      <Icon icon="lucide:external-link" class="mr-1 size-3" />
                      管理规则
                    </Button>
                  </div>
                </div>
                <div
                  v-if="currentStep.ruleIds?.length"
                  class="border-t border-slate-100 px-4 py-3"
                >
                  <div class="flex flex-wrap gap-2">
                    <div
                      v-for="rid in currentStep.ruleIds"
                      :key="rid"
                      class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-sm"
                    >
                      <Icon
                        icon="lucide:check-circle"
                        class="size-3.5 text-green-500"
                      />
                      <span class="text-xs font-medium text-slate-700">
                        {{ rid }}
                      </span>
                      <Icon
                        icon="lucide:x"
                        class="size-3 cursor-pointer text-slate-400 hover:text-red-500"
                        @click="removeRuleId(rid)"
                      />
                    </div>
                  </div>
                </div>
                <div
                  v-else
                  class="border-t border-slate-100 px-4 py-4 text-center text-sm text-slate-400"
                >
                  暂无关联规则，点击「添加规则」选择规则，或「管理规则」前往创建
                </div>
              </div>
              <Modal
                v-model:open="showRuleSelector"
                title="选择规则"
                width="500px"
                @ok="handleAddRules"
              >
                <div class="space-y-2">
                  <div
                    v-for="rule in availableRules"
                    :key="rule.id"
                    class="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all"
                    :class="
                      selectedRuleIds.includes(rule.name)
                        ? 'border-indigo-300 bg-indigo-50'
                        : 'border-slate-200 hover:border-slate-300'
                    "
                    @click="toggleRuleSelect(rule.name)"
                  >
                    <Icon
                      :icon="
                        selectedRuleIds.includes(rule.name)
                          ? 'lucide:check-circle'
                          : 'lucide:circle'
                      "
                      class="size-5 shrink-0"
                      :class="
                        selectedRuleIds.includes(rule.name)
                          ? 'text-indigo-600'
                          : 'text-slate-300'
                      "
                    />
                    <div>
                      <div class="text-sm font-medium text-slate-800">
                        {{ rule.name }}
                      </div>
                      <div class="text-xs text-slate-500">
                        {{ rule.auditTypes?.join('、') || '' }}
                      </div>
                    </div>
                  </div>
                </div>
              </Modal>
            </Form>
          </template>
          <div
            v-else
            class="flex h-full items-center justify-center text-slate-400"
          >
            请先添加步骤
          </div>
        </div>

        <div class="col-span-4 flex flex-col overflow-hidden border-l bg-white">
          <div class="flex items-center justify-between border-b px-4 py-3">
            <h3 class="m-0 text-sm font-bold text-slate-700">
              步骤提示词（Prompt）
            </h3>
            <Button
              size="small"
              class="!rounded-lg"
              @click="toolModalVisible = true"
            >
              <Icon icon="lucide:book-open" class="mr-1 size-3" />
              查看工具挂载清单
            </Button>
          </div>
          <div class="flex-1 overflow-hidden p-3">
            <div class="relative h-full overflow-hidden rounded-lg border">
              <CodeEditor
                v-if="currentStep"
                :key="currentStep.id"
                v-model:value="currentStep.prompt"
                mode="text"
                placeholder="编写该步骤的 AI 提示词，描述该步骤的目标、流程和可用工具..."
                class="h-full"
              />
            </div>
          </div>
        </div>
      </template>
    </div>

    <Modal
      v-model:open="stepEditVisible"
      title="编辑步骤"
      width="420px"
      @ok="handleStepEditOk"
    >
      <Form v-if="editingStep" layout="vertical">
        <Form.Item label="步骤名称" required>
          <Input v-model:value="editingStep.name" placeholder="步骤名称" />
        </Form.Item>
      </Form>
    </Modal>

    <Modal
      v-model:open="toolModalVisible"
      title="工具挂载清单"
      width="720px"
      :footer="null"
    >
      <div class="flex max-h-[60vh] flex-col gap-2 overflow-y-auto">
        <div
          v-for="tool in mountedTools"
          :key="tool.name"
          class="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-indigo-200 hover:bg-indigo-50/30"
        >
          <div
            class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500"
          >
            <Icon :icon="tool.icon" class="size-4" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-slate-800">
                {{ tool.name }}
              </span>
              <Tag
                :bordered="false"
                class="!text-[10px] !font-bold uppercase tracking-wider"
                :color="
                  tool.category === 'MCP'
                    ? 'purple'
                    : tool.category === 'Custom'
                      ? 'orange'
                      : 'default'
                "
              >
                {{ tool.category }}
              </Tag>
            </div>
            <p class="m-0 mt-0.5 text-xs leading-relaxed text-slate-500">
              {{ tool.desc }}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template>
