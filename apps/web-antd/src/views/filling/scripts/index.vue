<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  ConfigProvider,
  Drawer,
  Input,
  InputPassword,
  message,
  Modal,
  Pagination,
  Radio,
  RadioGroup,
  Select,
  Table,
  Tabs,
  Tag,
  Textarea,
  theme,
} from 'ant-design-vue';

const router = useRouter();

// Mock Systems
const systems = ref([
  { id: 's_1', name: 'SAP S/4HANA (总部)', icon: 'lucide:database' },
  { id: 's_2', name: '用友 NC Cloud', icon: 'lucide:cloud' },
  { id: 's_3', name: '自研差旅平台', icon: 'lucide:plane' },
]);
const selectedSystem = ref('s_1');

// 单据类型数据（按系统分类）
const billTypesBySystem = ref<
  Record<string, Array<{ id: string; name: string }>>
>({
  s_1: [
    { id: 'travel_expense', name: '差旅报销单' },
    { id: 'payment', name: '对公付款申请单' },
    { id: 'personal_expense', name: '个人报销单' },
  ],
  s_2: [
    { id: 'leave', name: '请假申请单' },
    { id: 'payment', name: '对公付款单' },
  ],
  s_3: [{ id: 'travel_expense', name: '差旅报销单' }],
});

// 根据选中系统筛选单据类型
const systemConfigs = ref<Record<string, any>>({
  s_1: {
    id: 's_1',
    name: 'SAP S/4HANA (总部)',
    authPolicy: 'global',
    fillStrategy: 'direct_submit',
    agentUsername: 'robot_sap',
    agentPassword: '**********',
  },
  s_2: {
    id: 's_2',
    name: '用友 NC Cloud',
    authPolicy: 'user',
    fillStrategy: 'submit_confirm',
    agentUsername: '',
    agentPassword: '',
  },
  s_3: {
    id: 's_3',
    name: '自研差旅平台',
    authPolicy: 'global',
    fillStrategy: 'direct_submit',
    agentUsername: 'robot_travel',
    agentPassword: '**********',
  },
});

// ── System Config Drawer ──
const sysConfigDrawerVisible = ref(false);
const sysConfigForm = ref<any>({});

function openSysConfig(sys: any) {
  sysConfigForm.value = {
    ...(systemConfigs.value[sys.id] ?? {
      id: sys.id,
      name: sys.name,
      authPolicy: 'global',
      fillStrategy: 'direct_submit',
      agentUsername: '',
      agentPassword: '',
    }),
  };
  sysConfigDrawerVisible.value = true;
}

function saveSysConfig() {
  systemConfigs.value[sysConfigForm.value.id] = { ...sysConfigForm.value };
  message.success('系统登录策略已保存');
  sysConfigDrawerVisible.value = false;
}

// Tab
const activeTab = ref('business');

// Mock Data (each item has a systemId)
const allDocuments = ref([
  {
    id: 'd_1',
    systemId: 's_1',
    code: 'DOC_EXP_001',
    name: '研发中心差旅报销单',
    billType: 'travel_expense',
    requiredFields: [
      {
        code: 'amount',
        name: '报销总额',
        type: 'number',
        defaultValue: '',
        options: '',
        desc: '总金额',
        ui: 'input',
      },
      {
        code: 'invoice_details',
        name: '发票明细',
        type: 'string',
        defaultValue: '',
        options: '',
        desc: '多张用逗号分隔',
        ui: 'textarea',
      },
      {
        code: 'cost_center',
        name: '成本中心',
        type: 'string',
        defaultValue: '',
        options: '研发部,市场部',
        desc: '',
        ui: 'select',
      },
      {
        code: 'reason',
        name: '出差事由',
        type: 'string',
        defaultValue: '',
        options: '',
        desc: '',
        ui: 'textarea',
      },
    ],
    apiEnabled: false,
    fillStrategy: 'submit_confirm',
    executorType: 'playwright',
    updateTime: '2024-03-05 16:30',
  },
  {
    id: 'd_2',
    systemId: 's_1',
    code: 'DOC_PAY_002',
    name: '对公付款申请-耗材',
    billType: 'payment',
    requiredFields: [
      {
        code: 'vendor',
        name: '供应商名称',
        type: 'string',
        defaultValue: '',
        options: '',
        desc: '',
        ui: 'input',
      },
      {
        code: 'amount',
        name: '付款总额',
        type: 'number',
        defaultValue: '',
        options: '',
        desc: '',
        ui: 'input',
      },
      {
        code: 'bank_account',
        name: '銀行账号',
        type: 'string',
        defaultValue: '',
        options: '',
        desc: '',
        ui: 'input',
      },
    ],
    apiEnabled: true,
    fillStrategy: 'direct_submit',
    executorType: 'plugin',
    updateTime: '2024-03-04 11:20',
  },
  {
    id: 'd_3',
    systemId: 's_2',
    code: 'DOC_YY_001',
    name: '用友请假申请单',
    billType: 'leave',
    requiredFields: [
      {
        code: 'leave_type',
        name: '假期类型',
        type: 'string',
        defaultValue: '年假',
        options: '事假,病假,年假,调休',
        desc: '',
        ui: 'select',
      },
      {
        code: 'start_date',
        name: '开始日期',
        type: 'string',
        defaultValue: '',
        options: '',
        desc: 'YYYY-MM-DD',
        ui: 'input',
      },
      {
        code: 'end_date',
        name: '结束日期',
        type: 'string',
        defaultValue: '',
        options: '',
        desc: 'YYYY-MM-DD',
        ui: 'input',
      },
      {
        code: 'reason',
        name: '请假事由',
        type: 'string',
        defaultValue: '',
        options: '',
        desc: '',
        ui: 'textarea',
      },
    ],
    apiEnabled: false,
    fillStrategy: 'fill_only',
    executorType: 'rpa',
    updateTime: '2024-03-01 09:00',
  },
  {
    id: 'd_4',
    systemId: 's_2',
    code: 'DOC_YY_002',
    name: '用友对公付款单',
    billType: 'payment',
    requiredFields: [
      {
        code: 'vendor',
        name: '供应商',
        type: 'string',
        defaultValue: '',
        options: '',
        desc: '',
        ui: 'input',
      },
      {
        code: 'invoice_amount',
        name: '开票额度',
        type: 'number',
        defaultValue: '',
        options: '',
        desc: '',
        ui: 'input',
      },
      {
        code: 'pay_method',
        name: '付款方式',
        type: 'string',
        defaultValue: '电汇',
        options: '电汇,承兑,现金',
        desc: '',
        ui: 'select',
      },
    ],
    apiEnabled: false,
    fillStrategy: 'direct_submit',
    executorType: 'playwright',
    updateTime: '2024-02-28 14:30',
  },
  {
    id: 'd_5',
    systemId: 's_3',
    code: 'DOC_ZY_001',
    name: '自研平台差旅报销单',
    billType: 'travel_expense',
    requiredFields: [
      {
        code: 'trip_info',
        name: '行程信息',
        type: 'string',
        defaultValue: '',
        options: '',
        desc: '',
        ui: 'textarea',
      },
      {
        code: 'amount',
        name: '开销金额',
        type: 'number',
        defaultValue: '',
        options: '',
        desc: '',
        ui: 'input',
      },
      {
        code: 'project_id',
        name: '项目编号',
        type: 'string',
        defaultValue: '',
        options: '',
        desc: '',
        ui: 'input',
      },
    ],
    apiEnabled: true,
    fillStrategy: 'submit_confirm',
    updateTime: '2024-03-03 17:00',
  },
]);

const allCommonScripts = ref([
  {
    id: 'cs_1',
    systemId: 's_1',
    name: 'SAP_前端节点通行登录策略',
    desc: '处理标准登录与多端互踢确认框',
    updateTime: '2024-03-01',
  },
  {
    id: 'cs_2',
    systemId: 's_2',
    name: 'NC_统一登录身份认证',
    desc: '处理用友 NC SSO 登录跳转逻辑',
    updateTime: '2024-03-02',
  },
  {
    id: 'cs_3',
    systemId: 's_3',
    name: '自研平台登录+Token获取',
    desc: '企业内部 OAuth2 登录并获取访问 Token',
    updateTime: '2024-03-04',
  },
]);

// Computed filtered by selected system
const documents = computed(() =>
  allDocuments.value.filter((d) => d.systemId === selectedSystem.value),
);
const commonScripts = computed(() =>
  allCommonScripts.value.filter((s) => s.systemId === selectedSystem.value),
);

function handleStudio(_record: any) {
  router.push('/agent/smart_filling/scripts/studio');
}

function handleTaskOrchestration(_record: any) {
  router.push('/agent/smart_filling/scripts/task-orchestration');
}

function handleStepConfig(record: any) {
  router.push(`/agent/smart_filling/scripts/step-config?id=${record.id}`);
}

// ────── Doc Form Drawer (进行新增或编辑单据基本信息) ──────
const docDrawerVisible = ref(false);
const docDrawerMode = ref<'add' | 'edit'>('add');
const editingDocForm = ref<any>({
  code: '',
  name: '',
  billType: '',
  desc: '',
  systemId: 's_1',
  fillStrategy: 'direct_submit',
  executorType: 'rpa',
  requiredFields: [],
});

// 根据选中系统筛选单据类型
const availableBillTypes = computed(() => {
  return billTypesBySystem.value[editingDocForm.value.systemId] || [];
});

// 监听系统切换，清空单据类型（仅在编辑模式下且系统真正改变时）
watch(
  () => editingDocForm.value.systemId,
  (newSystemId, oldSystemId) => {
    // 只在系统真正改变时处理单据类型，避免初始化时被清空
    if (oldSystemId && oldSystemId !== newSystemId) {
      const currentBillType = editingDocForm.value.billType;
      const newSystemBillTypes = billTypesBySystem.value[newSystemId] || [];
      const existsInNewSystem = newSystemBillTypes.some(
        (t) => t.id === currentBillType,
      );

      // 只有当前单据类型在新系统中不存在时才清空
      if (!existsInNewSystem) {
        editingDocForm.value.billType = '';
      }
    }
  },
);

function openAddDoc() {
  docDrawerMode.value = 'add';
  editingDocForm.value = {
    code: '',
    name: '',
    billType: '',
    desc: '',
    systemId: selectedSystem.value,
    fillStrategy: 'direct_submit',
    executorType: 'rpa',
    requiredFields: [],
  };
  docDrawerVisible.value = true;
}

function openEditDoc(doc: any) {
  docDrawerMode.value = 'edit';
  editingDocForm.value = { ...doc, systemId: selectedSystem.value };
  docDrawerVisible.value = true;
}

function saveDocForm() {
  message.success(
    docDrawerMode.value === 'add' ? '单据已成功添加' : '单据信息已更新',
  );
  docDrawerVisible.value = false;
}

// ────── Field Metadata Form Drawer (字段元数据) ──────
const fieldMetaDrawerVisible = ref(false);
const editingFieldMetaDoc = ref<any>(null);

function openFieldMetaDrawer(doc: any) {
  editingFieldMetaDoc.value = doc;
  fieldMetaDrawerVisible.value = true;
}

function closeFieldMetaDrawer() {
  fieldMetaDrawerVisible.value = false;
  editingFieldMetaDoc.value = null;
  message.success('字段元数据已更新');
}

function addFieldMeta() {
  if (editingFieldMetaDoc.value) {
    if (!editingFieldMetaDoc.value.requiredFields) {
      editingFieldMetaDoc.value.requiredFields = [];
    }
    editingFieldMetaDoc.value.requiredFields.push({
      code: `field_${Date.now()}`,
      name: '新字段',
      type: 'string',
      defaultValue: '',
      options: '',
      desc: '',
      ui: 'input',
      getInfoPrompt: '',
      fillingDataPrompt: '',
      fillFormPrompt: '',
      previewFillPrompt: '',
    });
  }
}

function removeFieldMeta(index: number) {
  if (editingFieldMetaDoc.value) {
    editingFieldMetaDoc.value.requiredFields.splice(index, 1);
  }
}

// ────── Common Script Form Drawer (通用脚本配置) ──────
const scriptDrawerVisible = ref(false);
const scriptDrawerMode = ref<'add' | 'edit'>('add');
const editingScriptForm = ref<any>({
  id: '',
  code: '',
  name: '',
  systemId: 's_1',
  desc: '',
});

function openAddScript() {
  scriptDrawerMode.value = 'add';
  editingScriptForm.value = {
    code: '',
    name: '',
    systemId: selectedSystem.value,
    desc: '',
  };
  scriptDrawerVisible.value = true;
}

function openEditScript(scr: any) {
  scriptDrawerMode.value = 'edit';
  editingScriptForm.value = { ...scr, systemId: selectedSystem.value };
  scriptDrawerVisible.value = true;
}

function saveScriptForm() {
  message.success(
    scriptDrawerMode.value === 'add' ? '通用脚本已创建' : '通用脚本信息已更新',
  );
  scriptDrawerVisible.value = false;
}

// ────── Plugin Marketplace Modal ──────
const toolModalVisible = ref(false);
const toolSearch = ref('');
const toolPage = ref(1);
const toolPageSize = 6;

const allPlugins = ref([
  {
    id: 'p_01',
    name: 'OCR 凭证识别',
    category: '内置',
    desc: '自动识别发票、小票、增值税发票图片，结构化输出金额、日期与税号。',
    icon: 'lucide:scan-text',
    added: true,
  },
  {
    id: 'p_02',
    name: '标准税率查询',
    category: '内置',
    desc: '覆盖全国行业税率库，支持增值税、个税、附加税率自动换算。',
    icon: 'lucide:calculator',
    added: true,
  },
  {
    id: 'p_03',
    name: '内部岗位与职级查询',
    category: 'MCP',
    desc: '接入企业 HR 系统，实时查询员工岗位、职级、成本中心和汇报线信息。',
    icon: 'lucide:users',
    added: true,
  },
  {
    id: 'p_04',
    name: '差旅日期推算',
    category: '内置',
    desc: '基于法定节假日数据，智能推算实际出差天数，自动剔除非工作日。',
    icon: 'lucide:calendar-clock',
    added: false,
  },
  {
    id: 'p_05',
    name: '地图里程测算',
    category: 'MCP',
    desc: '调用高德地图 API 计算两点之间的实际驾车/网约车里程，辅助车费合理性校验。',
    icon: 'lucide:map',
    added: false,
  },
  {
    id: 'p_06',
    name: '汇率实时转换',
    category: '内置',
    desc: '接入央行及主流平台实时汇率数据，支持外币费用自动折算为人民币。',
    icon: 'lucide:dollar-sign',
    added: false,
  },
  {
    id: 'p_07',
    name: '审批人查询 API',
    category: 'MCP',
    desc: '根据申请人工号与申请类型，自动查询对应审批链，填充审批人字段。',
    icon: 'lucide:git-branch',
    added: false,
  },
  {
    id: 'p_08',
    name: 'Playwright MCP',
    category: 'MCP',
    desc: '将 Playwright 操作能力封装为可调用工具，支持无头浏览器驱动业务系统配合录制脚本执行。',
    icon: 'lucide:monitor-play',
    added: false,
  },
  {
    id: 'p_09',
    name: '合规黑名单校验',
    category: '内置',
    desc: '查询供应商或收款方是否在企业合规黑名单中，联动填报拦截逻辑。',
    icon: 'lucide:shield-check',
    added: false,
  },
  {
    id: 'p_10',
    name: '自定义 REST API 调用',
    category: 'Custom',
    desc: '配置任意企业内部 REST API Endpoint，将其能力包装成智能体可直接调用的工具。',
    icon: 'lucide:webhook',
    added: false,
  },
  {
    id: 'p_11',
    name: '邮件附件解析',
    category: '内置',
    desc: '自动从指定邮箱中读取并解析报销相关附件（PDF 发票等），省去手动下载环节。',
    icon: 'lucide:mail',
    added: false,
  },
  {
    id: 'p_12',
    name: '钉钉/飞书消息通知',
    category: 'MCP',
    desc: '在填报完成、审批通过或被驳回时，通过钉钉/飞书机器人向申请人发送实时通知。',
    icon: 'lucide:bell',
    added: false,
  },
]);

const filteredPlugins = computed(() => {
  const q = toolSearch.value.trim().toLowerCase();
  return q
    ? allPlugins.value.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q),
      )
    : allPlugins.value;
});

const pagedPlugins = computed(() => {
  const start = (toolPage.value - 1) * toolPageSize;
  return filteredPlugins.value.slice(start, start + toolPageSize);
});

function togglePlugin(plugin: any) {
  plugin.added = !plugin.added;
  message.success(
    plugin.added
      ? `已添加「${plugin.name}」到当前智能体`
      : `已移除「${plugin.name}」`,
  );
}

const toolColumns = [
  { title: '工具名称', dataIndex: 'name', key: 'name', width: 200 },
  { title: '类型', dataIndex: 'category', key: 'category', width: 90 },
  { title: '功能描述', dataIndex: 'desc', key: 'desc' },
  { title: '操作', key: 'action', width: 100, align: 'center' as const },
];
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline -->
  <ConfigProvider :theme="{ algorithm: theme.defaultAlgorithm }">
    <div class="flex h-full overflow-hidden bg-white">
      <!-- Left Sidebar: Systems -->
      <div
        class="z-10 flex w-72 shrink-0 flex-col border-r border-slate-200 bg-white shadow-[2px_0_8px_rgba(0,0,0,0.02)]"
      >
        <div class="border-b border-slate-100 p-6 pb-4">
          <h2 class="m-0 text-lg font-bold text-slate-900">所属系统</h2>
          <p class="mt-1 text-xs text-slate-500">选择目标系统以配置业务单据</p>
        </div>
        <div class="flex-1 space-y-1 overflow-y-auto p-3">
          <div
            v-for="sys in systems"
            :key="sys.id"
            class="group flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all"
            :class="
              selectedSystem === sys.id
                ? 'border-indigo-100 bg-indigo-50 shadow-sm'
                : 'border-transparent text-slate-600 hover:bg-white'
            "
            @click="selectedSystem = sys.id"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              :class="
                selectedSystem === sys.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-500'
              "
            >
              <Icon :icon="sys.icon" class="size-4" />
            </div>
            <span
              class="flex-1 truncate text-sm font-semibold"
              :class="
                selectedSystem === sys.id ? 'text-indigo-900' : 'text-slate-700'
              "
            >
              {{ sys.name }}
            </span>
            <!-- Gear icon (visible on hover or when selected) -->
            <button
              class="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 opacity-0 transition-opacity hover:bg-slate-200 hover:text-slate-700 group-hover:opacity-100"
              :class="
                selectedSystem === sys.id
                  ? '!text-indigo-400 !opacity-100 hover:!bg-indigo-100 hover:!text-indigo-700'
                  : ''
              "
              @click.stop="openSysConfig(sys)"
              title="配置登录策略"
            >
              <Icon icon="lucide:settings-2" class="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      <!-- Right Content Area -->
      <div class="flex flex-1 flex-col overflow-y-auto p-6 md:p-8">
        <!-- List View -->
        <div class="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <div class="flex items-end justify-between">
            <div>
              <h1 class="mb-1 text-2xl font-bold tracking-tight text-slate-900">
                单据与脚本管理
              </h1>
              <p class="text-sm font-medium text-slate-500">
                配置系统中各类业务表单的基本信息、大语言模型生成约束和执行动作。
              </p>
            </div>
          </div>

          <div
            class="flex-1 rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm"
          >
            <Tabs v-model:active-key="activeTab" class="custom-tabs">
              <Tabs.TabPane key="business" tab="业务单据类型配置">
                <!-- 添加单据类型按钮 -->
                <div class="mb-4 flex justify-end">
                  <Button
                    type="primary"
                    class="!rounded-lg !bg-slate-900"
                    @click="openAddDoc"
                  >
                    <Icon icon="lucide:plus" class="mr-1" />
                    添加单据类型
                  </Button>
                </div>

                <!-- Document Cards -->
                <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div
                    v-for="doc in documents"
                    :key="doc.id"
                    class="group flex flex-col justify-between rounded-2xl border border-slate-200 p-5 transition-shadow hover:shadow-md"
                  >
                    <div>
                      <div class="mb-3 flex items-start justify-between">
                        <div>
                          <div
                            class="mb-1 font-mono text-[10px] font-bold tracking-wider text-slate-400"
                          >
                            {{ doc.code }}
                          </div>
                          <h3 class="m-0 text-lg font-bold text-slate-900">
                            {{ doc.name }}
                          </h3>
                        </div>
                        <Button
                          type="text"
                          shape="circle"
                          class="text-slate-400 hover:text-slate-900"
                          @click="openEditDoc(doc)"
                        >
                          <Icon icon="lucide:edit-3" class="size-4" />
                        </Button>
                      </div>
                    </div>

                    <!-- 元数据摘要区域 -->
                    <div class="mb-4">
                      <div
                        class="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-500"
                      >
                        <span>AI 自动提取必填项摘要</span>
                        <Button
                          type="link"
                          size="small"
                          class="!h-auto !p-0 !text-[10px]"
                          @click.stop="openFieldMetaDrawer(doc)"
                        >
                          <Icon
                            icon="lucide:settings-2"
                            class="mr-0.5 size-3"
                          />
                          元数据管理
                        </Button>
                      </div>
                      <div class="flex flex-wrap gap-1.5">
                        <Tag
                          :bordered="false"
                          v-for="(field, index) in doc.requiredFields"
                          :key="index"
                          class="!m-0 !bg-slate-100 !text-xs font-medium !text-slate-600"
                        >
                          {{ field.name }}
                        </Tag>
                      </div>
                    </div>

                    <div
                      class="flex items-center justify-between border-t border-slate-100 pt-4"
                    >
                      <div class="flex items-center gap-4">
                        <span class="text-[10px] font-semibold text-slate-400">
                          {{ doc.updateTime }} 更新
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <Button
                          size="small"
                          class="!rounded-md !border-slate-200 font-medium !text-blue-600 hover:!bg-blue-50 hover:!text-blue-700"
                          @click="handleStepConfig(doc)"
                        >
                          <Icon icon="lucide:book-open-check" class="mr-1" />
                          数据收集步骤配置
                        </Button>
                        <Button
                          size="small"
                          type="primary"
                          class="!rounded-md border-none !bg-slate-900 font-medium shadow"
                          @click="handleTaskOrchestration(doc)"
                        >
                          任务编排
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Tabs.TabPane>

              <Tabs.TabPane key="common" tab="脚本配置">
                <div class="flex flex-col gap-3">
                  <div class="mb-2 flex justify-end">
                    <Button
                      type="primary"
                      size="small"
                      class="!rounded-lg !border-none !bg-slate-900 !font-semibold"
                      @click="openAddScript"
                    >
                      <Icon icon="lucide:plus" class="mr-1" />
                      新建脚本
                    </Button>
                  </div>
                  <div
                    v-for="scr in commonScripts"
                    :key="scr.id"
                    class="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 text-sm"
                  >
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                      >
                        <Icon icon="lucide:blocks" class="size-4" />
                      </div>
                      <div>
                        <div class="font-bold text-slate-800">
                          {{ scr.name }}
                        </div>
                        <div class="mt-0.5 text-xs text-slate-500">
                          {{ scr.desc }}
                        </div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <Button
                        size="small"
                        class="!rounded-md !border-slate-200"
                        @click="openEditScript(scr)"
                      >
                        属性配置
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        class="!rounded-md !border-none !bg-slate-900 !font-medium"
                        @click="handleStudio(scr)"
                      >
                        脚本配置
                      </Button>
                    </div>
                  </div>
                </div>
              </Tabs.TabPane>
            </Tabs>
          </div>
        </div>
      </div>

      <!-- Doc Form Drawer (新增/编辑业务单据基本信息) -->
      <Drawer
        :open="docDrawerVisible"
        @close="docDrawerVisible = false"
        placement="right"
        width="520"
        :closable="false"
        class="doc-form-drawer"
      >
        <div class="flex h-full flex-col">
          <!-- Header -->
          <div
            class="mb-6 flex shrink-0 items-center justify-between border-b border-slate-100 pb-5"
          >
            <div class="flex items-center gap-3">
              <Button
                type="text"
                shape="circle"
                class="!bg-slate-100 text-slate-500 hover:text-slate-900"
                @click="docDrawerVisible = false"
              >
                <Icon icon="lucide:x" class="size-5" />
              </Button>
              <div>
                <h2 class="m-0 text-lg font-bold text-slate-900">
                  {{
                    docDrawerMode === 'add' ? '新增单据类型' : '编辑单据类型'
                  }}
                </h2>
                <p class="mt-0.5 text-xs text-slate-400">填写基础信息</p>
              </div>
            </div>
            <Button
              type="primary"
              class="!rounded-lg !bg-slate-900"
              @click="saveDocForm"
            >
              保存
            </Button>
          </div>

          <!-- Form fields -->
          <div class="flex-1 space-y-6 overflow-y-auto">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-600">
                  单据类型编码
                  <span class="text-red-400">*</span>
                </label>
                <Input
                  v-model:value="editingDocForm.code"
                  placeholder="如: DOC_EXP_001"
                  class="!rounded-xl !bg-white"
                />
                <p class="text-[10px] text-slate-400">
                  建议使用大写字母加下划线，全局唯一
                </p>
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-600">
                  单据类型名称
                  <span class="text-red-400">*</span>
                </label>
                <Input
                  v-model:value="editingDocForm.name"
                  placeholder="如: 研发中心差旅报销单"
                  class="!rounded-xl !bg-white"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-600">
                单据类型
                <span class="text-red-400">*</span>
              </label>
              <Select
                v-model:value="editingDocForm.billType"
                placeholder="请选择单据类型"
                class="!w-full !rounded-xl !bg-white"
                :options="
                  availableBillTypes.map((t) => ({
                    label: t.name,
                    value: t.id,
                  }))
                "
                :field-names="{ label: 'label', value: 'value' }"
                :disabled="!editingDocForm.systemId"
              />
              <p class="text-[10px] text-slate-400">
                根据所属系统自动筛选可用的单据类型
              </p>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-600">
                单据类型说明
              </label>
              <Textarea
                v-model:value="editingDocForm.desc"
                :rows="3"
                placeholder="简要描述该单据类型的业务场景与使用条件"
                class="!rounded-xl !border-slate-200 !bg-white"
              />
            </div>

            <!-- 执行器 (Executor) 类型选择 -->
            <div class="space-y-3">
              <label class="text-xs font-bold text-slate-600">
                执行器 (Executor)
              </label>
              <RadioGroup
                v-model:value="editingDocForm.executorType"
                class="flex w-full flex-col gap-3"
              >
                <Radio
                  value="playwright"
                  class="!mr-0 !flex !h-auto cursor-pointer !items-start rounded-xl border bg-slate-50 p-4 transition-all"
                  :class="
                    editingDocForm.executorType === 'playwright'
                      ? '!border-indigo-400 !bg-indigo-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  "
                >
                  <span>
                    <div class="ml-2 flex flex-col">
                      <span
                        class="flex items-center gap-2 text-sm font-semibold text-slate-900"
                      >
                        <Icon
                          icon="lucide:monitor"
                          class="size-4 text-emerald-500"
                        />
                        Playwright
                      </span>
                      <span
                        class="mt-1 text-xs leading-relaxed text-slate-500"
                      ></span>
                    </div>
                  </span>
                </Radio>
                <Radio
                  value="plugin"
                  class="!mr-0 !flex !h-auto cursor-pointer !items-start rounded-xl border bg-slate-50 p-4 transition-all"
                  :class="
                    editingDocForm.executorType === 'plugin'
                      ? '!border-indigo-400 !bg-indigo-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  "
                >
                  <span>
                    <div class="ml-2 flex flex-col">
                      <span
                        class="flex items-center gap-2 text-sm font-semibold text-slate-900"
                      >
                        <Icon
                          icon="lucide:puzzle"
                          class="size-4 text-indigo-500"
                        />
                        浏览器插件
                      </span>
                      <span
                        class="mt-1 text-xs leading-relaxed text-slate-500"
                      ></span>
                    </div>
                  </span>
                </Radio>
                <Radio
                  value="rpa"
                  class="!mr-0 !flex !h-auto cursor-pointer !items-start rounded-xl border bg-slate-50 p-4 transition-all"
                  :class="
                    editingDocForm.executorType === 'rpa'
                      ? '!border-indigo-400 !bg-indigo-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  "
                >
                  <span>
                    <div class="ml-2 flex flex-col">
                      <span
                        class="flex items-center gap-2 text-sm font-semibold text-slate-900"
                      >
                        <Icon
                          icon="lucide:bot"
                          class="size-4 text-emerald-500"
                        />
                        RPA
                      </span>
                      <span
                        class="mt-1 text-xs leading-relaxed text-slate-500"
                      ></span>
                    </div>
                  </span>
                </Radio>
              </RadioGroup>
            </div>
          </div>
        </div>
      </Drawer>

      <!-- Script Form Drawer (新增/编辑通用脚本基本属性) -->
      <Drawer
        :open="scriptDrawerVisible"
        @close="scriptDrawerVisible = false"
        placement="right"
        width="480"
        :closable="false"
        class="script-form-drawer"
      >
        <div class="flex h-full flex-col">
          <!-- Header -->
          <div
            class="mb-6 flex shrink-0 items-center justify-between border-b border-slate-100 pb-5"
          >
            <div class="flex items-center gap-3">
              <Button
                type="text"
                shape="circle"
                class="!bg-slate-100 text-slate-500 hover:text-slate-900"
                @click="scriptDrawerVisible = false"
              >
                <Icon icon="lucide:x" class="size-5" />
              </Button>
              <div>
                <h2 class="m-0 text-lg font-bold text-slate-900">
                  {{ scriptDrawerMode === 'add' ? '新建脚本' : '脚本属性配置' }}
                </h2>
                <p class="mt-0.5 text-xs text-slate-400">
                  脚本可被各业务单据的「任务编排」配置引入
                </p>
              </div>
            </div>
            <Button
              type="primary"
              class="!rounded-lg !bg-slate-900"
              @click="saveScriptForm"
            >
              保存
            </Button>
          </div>

          <!-- Form fields -->
          <div class="flex-1 space-y-5 overflow-y-auto">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-600">
                  脚本编号
                  <span class="text-red-400">*</span>
                </label>
                <Input
                  v-model:value="editingScriptForm.code"
                  placeholder="如: SCR_LOGIN_SAP"
                  class="!rounded-xl !bg-white"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-600">
                  脚本名称
                  <span class="text-red-400">*</span>
                </label>
                <Input
                  v-model:value="editingScriptForm.name"
                  placeholder="如: SAP 通行登录策略"
                  class="!rounded-xl !bg-white"
                />
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold text-slate-600">
                脚本功能描述
              </label>
              <Textarea
                v-model:value="editingScriptForm.desc"
                :rows="4"
                placeholder="描述此脚本的职责，例如：处理 SAP 登录页面弹出的多端互踢确认框，并在确认后正确回调至目标页面..."
                class="!rounded-xl !border-slate-200 !bg-white"
              />
            </div>

            <div
              class="flex gap-3 rounded-2xl border border-blue-100/80 bg-blue-50/50 p-4"
            >
              <Icon
                icon="lucide:info"
                class="mt-0.5 size-4 shrink-0 text-blue-500"
              />
              <p class="m-0 text-[11px] leading-relaxed text-blue-700/80">
                请前往
                <strong>「脚本配置」</strong>
                页面上传脚本文件。可在各个业务单据类型卡片上的「任务编排」选择填报脚本
              </p>
            </div>
          </div>
        </div>
      </Drawer>

      <!-- Browse Tools Modal - Full Featured Marketplace -->
      <Modal
        v-model:open="toolModalVisible"
        title="插件市场 / MCP 工具库"
        width="920px"
        :footer="null"
        class="tool-market-modal"
      >
        <!-- Modal Header Area -->
        <div class="mb-5 flex items-center justify-between pt-1">
          <div>
            <p class="m-0 text-sm text-slate-500">
              共
              <span class="font-bold text-slate-800">
                {{ allPlugins.length }}
              </span>
              个工具，已关联
              <span class="font-bold text-emerald-600">
                {{ allPlugins.filter((p) => p.added).length }}
              </span>
              个到当前智能体。
            </p>
          </div>
          <Input.Search
            v-model:value="toolSearch"
            placeholder="搜索工具名称或功能描述..."
            class="!w-72"
            allow-clear
            @change="toolPage = 1"
          />
        </div>

        <!-- Table -->
        <Table
          :data-source="pagedPlugins"
          :columns="toolColumns"
          row-key="id"
          :pagination="false"
          size="middle"
          class="tool-market-table"
          :row-class-name="(record) => (record.added ? 'tool-row-added' : '')"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div class="flex items-center gap-2.5">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100"
                  :class="
                    record.added
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-400'
                  "
                >
                  <Icon :icon="record.icon" class="size-4" />
                </div>
                <span class="text-sm font-semibold text-slate-800">
                  {{ record.name }}
                </span>
              </div>
            </template>
            <template v-else-if="column.key === 'category'">
              <Tag
                :color="
                  record.category === 'MCP'
                    ? 'purple'
                    : record.category === 'Custom'
                      ? 'orange'
                      : 'default'
                "
                :bordered="false"
                class="!text-[10px] !font-bold uppercase tracking-wider"
              >
                {{ record.category }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <Button
                v-if="!record.added"
                size="small"
                type="primary"
                class="!rounded-lg !border-emerald-600 !bg-emerald-600 !text-xs font-semibold hover:!bg-emerald-700"
                @click="togglePlugin(record)"
              >
                + 添加
              </Button>
              <Button
                v-else
                size="small"
                danger
                class="!rounded-lg !text-xs font-semibold"
                @click="togglePlugin(record)"
              >
                移除
              </Button>
            </template>
          </template>
        </Table>

        <!-- Pagination & Footer -->
        <div
          class="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"
        >
          <span class="text-xs text-slate-400">
            共找到 {{ filteredPlugins.length }} 个工具
          </span>
          <div class="flex items-center gap-4">
            <Pagination
              v-model:current="toolPage"
              :total="filteredPlugins.length"
              :page-size="toolPageSize"
              :show-size-changer="false"
              size="small"
            />
            <Button
              type="primary"
              class="!rounded-lg !border-none !bg-slate-900"
              @click="toolModalVisible = false"
            >
              完成配置
            </Button>
          </div>
        </div>
      </Modal>

      <!-- System Config Drawer -->
      <Drawer
        :open="sysConfigDrawerVisible"
        @close="sysConfigDrawerVisible = false"
        placement="right"
        width="480"
        :closable="false"
        class="sys-config-drawer"
      >
        <div class="flex h-full flex-col">
          <!-- Header -->
          <div
            class="mb-6 flex shrink-0 items-center justify-between border-b border-slate-100 pb-5"
          >
            <div class="flex items-center gap-3">
              <button
                class="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900"
                @click="sysConfigDrawerVisible = false"
              >
                <Icon icon="lucide:x" class="size-5" />
              </button>
              <div>
                <h2 class="m-0 text-lg font-bold text-slate-900">
                  登录授权策略配置
                </h2>
                <p class="mt-0.5 text-xs text-slate-400">
                  {{ sysConfigForm.name }}
                </p>
              </div>
            </div>
            <Button
              type="primary"
              class="!rounded-lg !bg-slate-900"
              @click="saveSysConfig"
            >
              保存策略
            </Button>
          </div>

          <!-- Form -->
          <div class="flex-1 space-y-6 overflow-y-auto">
            <!-- Fill Strategy -->
            <div class="space-y-4">
              <h3
                class="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-widest text-slate-500"
              >
                执行填报策略 (Execution Strategy)
              </h3>
              <RadioGroup
                v-model:value="sysConfigForm.fillStrategy"
                class="flex w-full flex-col gap-3"
              >
                <Radio
                  value="direct_submit"
                  class="!mr-0 !flex !h-auto cursor-pointer !items-center rounded-xl border bg-white p-4 transition-all"
                  :class="
                    sysConfigForm.fillStrategy === 'direct_submit'
                      ? '!border-indigo-400 !bg-indigo-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  "
                >
                  <div class="ml-2 flex flex-col">
                    <span class="text-sm font-semibold text-slate-900">
                      直接提交
                    </span>
                    <span class="mt-1 text-xs leading-relaxed text-slate-500">
                      智能体自动完成提取、填写及目标系统的最终提交流程。
                    </span>
                  </div>
                </Radio>
                <Radio
                  value="fill_only"
                  class="!mr-0 !flex !h-auto cursor-pointer !items-center rounded-xl border bg-white p-4 transition-all"
                  :class="
                    sysConfigForm.fillStrategy === 'fill_only'
                      ? '!border-indigo-400 !bg-indigo-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  "
                >
                  <div class="ml-2 flex flex-col">
                    <span class="text-sm font-semibold text-slate-900">
                      只填不提
                    </span>
                    <span class="mt-1 text-xs leading-relaxed text-slate-500">
                      智能体仅完成表单内容的自动填写（保存草稿），不执行提交。
                    </span>
                  </div>
                </Radio>
                <Radio
                  value="submit_confirm"
                  class="!mr-0 !flex !h-auto cursor-pointer !items-center rounded-xl border bg-white p-4 transition-all"
                  :class="
                    sysConfigForm.fillStrategy === 'submit_confirm'
                      ? '!border-indigo-400 !bg-indigo-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  "
                >
                  <div class="ml-2 flex flex-col">
                    <span class="text-sm font-semibold text-slate-900">
                      提交确认
                    </span>
                    <span class="mt-1 text-xs leading-relaxed text-slate-500">
                      填写完成后停留并向用户提示确认，人工确认确认无误后再指令提交。
                    </span>
                  </div>
                </Radio>
              </RadioGroup>
            </div>

            <!-- Auth Policy -->
            <div class="space-y-4">
              <h3
                class="border-b border-slate-100 pb-2 text-xs font-bold uppercase tracking-widest text-slate-500"
              >
                账户授权策略 (Account Policy)
              </h3>
              <RadioGroup
                v-model:value="sysConfigForm.authPolicy"
                class="flex w-full flex-col gap-3"
              >
                <Radio
                  value="global"
                  class="!mr-0 !flex !h-auto cursor-pointer !items-start rounded-xl border bg-white p-4 transition-all"
                  :class="
                    sysConfigForm.authPolicy === 'global'
                      ? '!border-indigo-400 !bg-indigo-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  "
                >
                  <div class="ml-2 flex flex-col">
                    <span
                      class="flex items-center gap-2 text-sm font-semibold text-slate-900"
                    >
                      <Icon icon="lucide:bot" class="size-4 text-indigo-500" />
                      全局代理账号 (Global Agent)
                    </span>
                    <span class="mt-1.5 text-xs leading-relaxed text-slate-500">
                      管理员统一配置账号密码，所有填报任务均使用「机器人代理账号」操作目标系统。
                    </span>
                  </div>
                </Radio>
                <Radio
                  value="user"
                  class="!mr-0 !flex !h-auto cursor-pointer !items-start rounded-xl border bg-white p-4 transition-all"
                  :class="
                    sysConfigForm.authPolicy === 'user'
                      ? '!border-indigo-400 !bg-indigo-50/60 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  "
                >
                  <div class="ml-2 flex flex-col">
                    <span
                      class="flex items-center gap-2 text-sm font-semibold text-slate-900"
                    >
                      <Icon
                        icon="lucide:user"
                        class="size-4 text-emerald-500"
                      />
                      终端用户授权 (User Auth)
                    </span>
                    <span class="mt-1.5 text-xs leading-relaxed text-slate-500">
                      无需配置统一密码，填报时拉起 SSO 或索要用户专属
                      Token，操作可溯源。
                    </span>
                  </div>
                </Radio>
              </RadioGroup>
            </div>

            <!-- Agent Credentials (only when global) -->
            <div
              v-if="sysConfigForm.authPolicy === 'global'"
              class="space-y-4 rounded-2xl border border-dashed border-slate-200 bg-white p-4"
            >
              <h3
                class="text-xs font-bold uppercase tracking-widest text-slate-500"
              >
                代理机器人账户凭证
              </h3>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-600">代理账号</label>
                <Input
                  v-model:value="sysConfigForm.agentUsername"
                  placeholder="请输入代理机器人账户名"
                  class="!rounded-xl !bg-white"
                />
              </div>
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-600">
                  代理密码 / Token
                </label>
                <InputPassword
                  v-model:value="sysConfigForm.agentPassword"
                  placeholder="输入密码（将被加密存储）"
                  class="!rounded-xl !bg-white"
                />
              </div>
              <div class="flex items-center gap-2 text-[11px] text-slate-500">
                <Icon
                  icon="lucide:shield-check"
                  class="size-3.5 shrink-0 text-emerald-500"
                />
                凭证经 AES-256 加密后存储，平台内不可见原文
              </div>
            </div>

            <!-- Test connectivity -->
            <div
              class="flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/50 p-4"
            >
              <div class="flex items-center gap-2 text-xs text-blue-700">
                <Icon icon="lucide:wifi" class="size-4" />
                <span>可测试连通性，验证账户是否有效</span>
              </div>
              <Button
                size="small"
                class="!rounded-lg !border-blue-200 !text-blue-600 hover:!border-blue-400"
              >
                <Icon icon="lucide:play" class="mr-1 size-3.5" />
                测试连接
              </Button>
            </div>
          </div>
        </div>
      </Drawer>
      <!-- Field Metadata Drawer -->
      <Drawer
        :open="fieldMetaDrawerVisible"
        @close="closeFieldMetaDrawer"
        placement="right"
        width="900"
        :closable="false"
        class="field-meta-drawer"
      >
        <div v-if="editingFieldMetaDoc" class="flex h-full flex-col">
          <div
            class="mb-6 flex shrink-0 items-center justify-between border-b border-slate-100 pb-5"
          >
            <div class="flex items-center gap-3">
              <Button
                type="text"
                shape="circle"
                class="!bg-slate-100 text-slate-500 hover:text-slate-900"
                @click="closeFieldMetaDrawer"
              >
                <Icon icon="lucide:x" class="size-5" />
              </Button>
              <div>
                <h2 class="m-0 text-lg font-bold text-slate-900">
                  字段元数据管理
                </h2>
                <p class="mt-0.5 text-xs text-slate-400">
                  配置 {{ editingFieldMetaDoc.name }} ({{
                    editingFieldMetaDoc.code
                  }}) 提取字段信息及其 UI 表现
                </p>
              </div>
            </div>
            <div class="flex gap-2">
              <Button
                type="primary"
                ghost
                class="!rounded-lg"
                @click="addFieldMeta"
              >
                <Icon icon="lucide:plus" class="mr-1" />
                添加字段
              </Button>
              <Button
                type="primary"
                class="!rounded-lg !bg-slate-900"
                @click="closeFieldMetaDrawer"
              >
                完成维护
              </Button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto overflow-x-hidden">
            <Table
              :data-source="editingFieldMetaDoc.requiredFields"
              :pagination="false"
              row-key="code"
              size="small"
              bordered
              class="custom-meta-table mt-4 w-full"
            >
              <Table.Column title="字段编码" data-index="code" width="120">
                <template #default="{ record }">
                  <Input
                    v-model:value="record.code"
                    size="small"
                    class="!text-xs"
                  />
                </template>
              </Table.Column>
              <Table.Column title="名称" data-index="name" width="120">
                <template #default="{ record }">
                  <Input
                    v-model:value="record.name"
                    size="small"
                    class="!text-xs"
                  />
                </template>
              </Table.Column>
              <Table.Column
                title="默认值"
                data-index="defaultValue"
                width="100"
              >
                <template #default="{ record }">
                  <Input
                    v-model:value="record.defaultValue"
                    size="small"
                    class="!text-xs"
                    placeholder="可选"
                  />
                </template>
              </Table.Column>
              <Table.Column title="数据类型" data-index="type" width="100">
                <template #default="{ record }">
                  <Select
                    v-model:value="record.type"
                    size="small"
                    class="w-full !text-xs"
                  >
                    <Select.Option value="string">文本 (String)</Select.Option>
                    <Select.Option value="number">数字 (Number)</Select.Option>
                    <Select.Option value="boolean">
                      布尔 (Boolean)
                    </Select.Option>
                    <Select.Option value="array">数组 (Array)</Select.Option>
                  </Select>
                </template>
              </Table.Column>
              <Table.Column title="UI 组件" data-index="ui" width="120">
                <template #default="{ record }">
                  <Select
                    v-model:value="record.ui"
                    size="small"
                    class="w-full !text-xs"
                  >
                    <Select.Option value="input">单行文本</Select.Option>
                    <Select.Option value="textarea">多行文本</Select.Option>
                    <Select.Option value="select">下拉单选</Select.Option>
                    <Select.Option value="switch">开关控件</Select.Option>
                    <Select.Option value="table">子表单(表格)</Select.Option>
                  </Select>
                </template>
              </Table.Column>
              <Table.Column
                title="选项数据(字典)"
                data-index="options"
                width="150"
              >
                <template #default="{ record }">
                  <Input
                    v-model:value="record.options"
                    size="small"
                    class="!text-xs"
                    placeholder="逗号分隔字典"
                  />
                </template>
              </Table.Column>
              <Table.Column title="字段描述" data-index="desc">
                <template #default="{ record }">
                  <Input
                    v-model:value="record.desc"
                    size="small"
                    class="!text-xs"
                    placeholder="说明信息"
                  />
                </template>
              </Table.Column>
              <Table.Column
                title="获取信息提示词"
                data-index="getInfoPrompt"
                width="200"
              >
                <template #default="{ record }">
                  <Input.TextArea
                    v-model:value="record.getInfoPrompt"
                    size="small"
                    class="!text-xs"
                    placeholder="配置获取字段信息的提示词"
                    :rows="2"
                  />
                </template>
              </Table.Column>
              <Table.Column
                title="数据处理提示词"
                data-index="fillingDataPrompt"
                width="200"
              >
                <template #default="{ record }">
                  <Input.TextArea
                    v-model:value="record.fillingDataPrompt"
                    size="small"
                    class="!text-xs"
                    placeholder="配置数据处理的提示词"
                    :rows="2"
                  />
                </template>
              </Table.Column>
              <Table.Column
                title="填写单据提示词"
                data-index="fillFormPrompt"
                width="200"
              >
                <template #default="{ record }">
                  <Input.TextArea
                    v-model:value="record.fillFormPrompt"
                    size="small"
                    class="!text-xs"
                    placeholder="配置填写单据的提示词"
                    :rows="2"
                  />
                </template>
              </Table.Column>
              <Table.Column
                title="预览填报提示词"
                data-index="previewFillPrompt"
                width="200"
              >
                <template #default="{ record }">
                  <Input.TextArea
                    v-model:value="record.previewFillPrompt"
                    size="small"
                    class="!text-xs"
                    placeholder="配置预览填报的提示词"
                    :rows="2"
                  />
                </template>
              </Table.Column>
              <Table.Column title="操作" width="60" align="center">
                <template #default="{ index }">
                  <Button
                    type="text"
                    danger
                    size="small"
                    class="!p-0"
                    @click="removeFieldMeta(index)"
                  >
                    <Icon icon="lucide:trash-2" class="size-4" />
                  </Button>
                </template>
              </Table.Column>
            </Table>
          </div>
        </div>
      </Drawer>
    </div>
  </ConfigProvider>
</template>

<style scoped>
:deep(.ant-tabs-nav) {
  @apply mb-4 border-b border-slate-200;
}

:deep(.ant-tabs-tab) {
  @apply !px-4 !py-2.5 !font-medium !text-slate-600;

  transition: color 0.2s ease;
}

:deep(.ant-tabs-tab:hover) {
  @apply !text-blue-500;
}

:deep(.ant-tabs-tab.ant-tabs-tab-active) {
  @apply !font-semibold !text-blue-700;
}

:deep(.custom-meta-table .ant-table-thead .ant-table-cell) {
  @apply !bg-white !py-3 !text-[11px] !font-bold uppercase tracking-wider !text-slate-500;
}

:deep(.custom-meta-table .ant-table-tbody .ant-table-cell) {
  @apply !py-2 !align-middle;
}

:deep(.custom-meta-table .ant-input) {
  @apply !h-[30px] !border-slate-200 !bg-white/50 !py-1 transition-all hover:!border-indigo-400 hover:!bg-white focus:!border-indigo-500 focus:!bg-white focus:!ring-2 focus:!ring-indigo-500/20;
}

:deep(.custom-meta-table .ant-select-selector) {
  @apply !h-[30px] !border-slate-200 !bg-white/50 transition-all hover:!border-indigo-400 hover:!bg-white focus:!border-indigo-500 focus:!bg-white focus:!ring-2 focus:!ring-indigo-500/20;
}

:deep(.custom-meta-table .ant-select-selection-search-input) {
  @apply !h-[28px];
}

:deep(.custom-meta-table .ant-select-selection-item) {
  /* align with the new height */
  line-height: 28px !important;
}

:deep(.custom-subpage-drawer .ant-drawer-content-wrapper) {
  @apply !shadow-[-20px_0_40px_-20px_rgba(0,0,0,0.1)];
}

:deep(.custom-subpage-drawer .ant-drawer-body) {
  @apply !p-0 !px-8;
}

:deep(.tool-market-table .tool-row-added) {
  background-color: rgb(236 253 245 / 50%);
}

:deep(.tool-market-table .ant-table-thead .ant-table-cell) {
  @apply !bg-white !text-xs !font-bold !text-slate-500;
}
</style>
