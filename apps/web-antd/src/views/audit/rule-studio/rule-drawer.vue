<script setup lang="ts">
import type { AuditRule, DataSourceType } from '#/types/audit';
import type { Policy, PolicyClause } from '#/types/policy';

import { computed, onMounted, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { createAuditRuleApi, updateAuditRuleApi } from '#/api/audit';
import { getPoliciesApi, getPolicyClausesApi } from '#/api/policy';
import CodeEditor from '#/components/CodeEditor/index.vue';
import { deepClone } from '#/utils/deep-clone';

const props = defineProps<{
  open: boolean;
  record?: AuditRule;
}>();

const emit = defineEmits(['update:open', 'success', 'test']);

const loading = ref(false);
const isUpdate = computed(() => !!props.record?.id);
const title = computed(() => (isUpdate.value ? '编辑规则' : '新建规则'));

const formState = ref<Partial<AuditRule>>({
  scope: 'line',
  status: 'active',
  dataSources: [],
  tools: [],
  prompt: '',
});

// --- State for Policy Selection ---
const policies = ref<Policy[]>([]);
const policyClauses = ref<PolicyClause[]>([]);
const currentPolicyId = ref<string | undefined>(undefined);
const loadingPolicies = ref(false);
const loadingClauses = ref(false);
onMounted(async () => {
  loadingPolicies.value = true;
  try {
    const res = await getPoliciesApi();
    policies.value = res.data;
  } finally {
    loadingPolicies.value = false;
  }
});

// Watch policy selection to fetch clauses
watch(currentPolicyId, async (newVal) => {
  if (newVal) {
    loadingClauses.value = true;
    selectedRowKeys.value = []; // Clear selection when switching policy
    try {
      const res = await getPolicyClausesApi(newVal);
      policyClauses.value = res.data;
    } finally {
      loadingClauses.value = false;
    }
  } else {
    policyClauses.value = [];
  }
});

// --- Mock Data & Modal Logic ---
const allAttachments = [
  { key: '增值税发票', title: '增值税发票', code: 'ATT_001', group: '发票类' },
  { key: '酒店水单', title: '酒店水单', code: 'ATT_002', group: '单据类' },
  { key: '行程单', title: '行程单', code: 'ATT_003', group: '单据类' },
  { key: '支付凭证', title: '支付凭证', code: 'ATT_004', group: '凭证类' },
  { key: '合同文件', title: '合同文件', code: 'ATT_005', group: '合同类' },
];

const attachmentGroups = [...new Set(allAttachments.map((a) => a.group))];

// const allPolicies = ... // Removed in favor of API

const allPlugins = [
  {
    key: 'srv_1',
    title: '获取人员级别',
    pluginName: 'HR插件',
    serviceId: 'get_level',
    code: 'PLG_001',
    description: `[ 
   { 
     "name": "target_user_id",   // 接口参数名 
     "type": "string", 
     "required": true, 
     "in": "query",              // 参数位置: query / body / path 
     "description": "HR系统中的工号" 
   }, 
   { 
     "name": "query_year", 
     "type": "string", 
     "required": false, 
     "description": "查询年份，格式 YYYY" 
   } 
 ]`,
  },
  {
    key: 'srv_2',
    title: '获取岗位信息',
    pluginName: 'HR插件',
    serviceId: 'get_position',
    code: 'PLG_002',
    description: `[ 
   { 
     "name": "target_user_id",   // 接口参数名 
     "type": "string", 
     "required": true, 
     "in": "query",              // 参数位置: query / body / path 
     "description": "HR系统中的工号" 
   }
 ]`,
  },
  {
    key: 'srv_3',
    title: '计算两地距离',
    pluginName: '地图服务',
    serviceId: 'calc_distance',
    code: 'PLG_003',
  },
  {
    key: 'srv_4',
    title: '汇率查询',
    pluginName: '财务工具',
    serviceId: 'exchange_rate',
    code: 'PLG_004',
  },
];

const modalVisible = ref(false);
const currentModalType = ref<DataSourceType | null>(null);
const searchText = ref('');
const selectedRowKeys = ref<string[]>([]);
const filterGroup = ref<string | undefined>(undefined);

const modalTitle = computed(() => {
  if (currentModalType.value === 'ATTACH') return '添加审核附件';
  if (currentModalType.value === 'POLICY') return '添加审核制度';
  if (currentModalType.value === 'PLUGIN') return '添加数据源插件';
  return '选择数据';
});

const modalDataSource = computed(() => {
  const text = searchText.value.toLowerCase();
  let source: any[] = [];
  switch (currentModalType.value) {
    case 'ATTACH': {
      source = allAttachments;
      break;
    }
    case 'PLUGIN': {
      source = allPlugins;
      // No default
      break;
    }
    case 'POLICY': {
      // Return clauses, optionally filtered by search text
      return policyClauses.value.filter((item) => {
        const t = text;
        return (
          !t ||
          item.title.includes(t) ||
          item.clauseCode.includes(t) ||
          item.content.includes(t)
        );
      });
    }
  }

  return source.filter((item) => {
    const matchText =
      item.title.includes(text) ||
      (item.pluginName && item.pluginName.includes(text)) ||
      (item.code && item.code.toLowerCase().includes(text));
    const matchGroup = !filterGroup.value || item.group === filterGroup.value;
    return matchText && matchGroup;
  });
});

const modalColumns = computed(() => {
  const baseCols = [
    { title: '编号', dataIndex: 'code', width: 120 },
    { title: '名称', dataIndex: 'title' },
  ];
  if (currentModalType.value === 'PLUGIN') {
    return [...baseCols, { title: '所属插件', dataIndex: 'pluginName' }];
  }
  if (currentModalType.value === 'ATTACH') {
    return [
      { title: '编号', dataIndex: 'code', width: 100 },
      { title: '分类名称', dataIndex: 'title' },
      { title: '附件组', dataIndex: 'group' },
    ];
  }
  if (currentModalType.value === 'POLICY') {
    return [
      { title: '编号', dataIndex: 'clauseCode', width: 100 },
      { title: '名称', dataIndex: 'title' },
      {
        title: '正文',
        dataIndex: 'content',
        customRender: ({ text }: { text: string }) => {
          const t = text ? text.replaceAll(/<[^>]+>/g, '') : '';
          return t.length > 20 ? `${t.slice(0, 20)}...` : t;
        },
      },
    ];
  }
  return baseCols;
});

const selectedAttachmentItems = computed(() => {
  const cats =
    formState.value.dataSources?.find((d) => d.type === 'ATTACH')?.filterCats ||
    [];
  return cats.map((c) => {
    // Try to find the original item to get extra info if needed, or just use the key/title
    // The key stored in filterCats is currently the title (legacy logic).
    // Let's keep it simple as per original logic.
    return { title: c, key: c };
  });
});

const selectedPolicyItems = computed(() => {
  const items: any[] = [];
  formState.value.dataSources
    ?.filter((d) => d.type === 'POLICY')
    .forEach((d) => {
      if (d.clauses && d.clauses.length > 0) {
        d.clauses.forEach((c) => {
          items.push({
            key: c.id,
            title: c.title,
            subtitle: d.policyName,
            content: c.content,
            policyId: d.policyId,
          });
        });
      } else {
        // Fallback for legacy data or full policy selection (if any)
        items.push({
          key: d.policyId, // This might clash if multiple policies selected as full
          title: d.policyName || d.policyId,
          subtitle: '整本制度',
          policyId: d.policyId,
          isFullPolicy: true,
        });
      }
    });
  return items;
});

const selectedPluginItems = computed(() => {
  return (
    formState.value.dataSources
      ?.filter((d) => d.type === 'PLUGIN')
      .map((d) => {
        const plug = allPlugins.find((p) => p.key === d.serviceId);
        const hasParams = !!plug?.description;
        // Simple check: if hasParams, check if d.params is not empty.
        const isConfigured =
          !hasParams || (d.params && Object.keys(d.params).length > 0);

        return {
          title:
            d.serviceName ||
            allPlugins.find((p) => p.key === d.serviceId)?.title ||
            d.serviceId,
          subtitle: allPlugins.find((p) => p.key === d.serviceId)?.pluginName,
          key: d.serviceId,
          hasParams,
          isConfigured,
        };
      }) || []
  );
});

// --- Plugin Params Configuration ---
const pluginParamsVisible = ref(false);
const currentEditingPluginKey = ref('');
const parsedParamsList = ref<any[]>([]);
const editingParams = ref<Record<string, string>>({});
const activeParamName = ref('');

const keywords = [
  { name: '单据id', value: '{{bill.id}}' },
  { name: '单据编号', value: '{{bill.header.billcode}}' },
  { name: '单据类型编码', value: '{{bill.header.type_code}}' },
  { name: '单据申请人', value: '{{bill.header.applicant}}' },
  { name: '附件id数组', value: '{{bill.attachment_ids}}' },
  { name: '明细id数组', value: '{{bill.detail_ids}}' },
];

function handleConfigPlugin(item: any) {
  const pluginDef = allPlugins.find((p) => p.key === item.key);
  if (!pluginDef || !pluginDef.description) {
    message.warning('该插件无入参配置');
    return;
  }

  try {
    // Strip comments (simple regex for // comments)
    const jsonStr = pluginDef.description.replaceAll(/\/\/.*$/gm, '');
    parsedParamsList.value = JSON.parse(jsonStr);

    // Load existing values
    const dsItem = formState.value.dataSources?.find(
      (d) => d.type === 'PLUGIN' && d.serviceId === item.key,
    );
    editingParams.value = { ...dsItem?.params };

    currentEditingPluginKey.value = item.key;
    pluginParamsVisible.value = true;
  } catch (error) {
    console.error(error);
    message.error('入参配置解析失败');
  }
}

function handleSaveParams() {
  const dsItem = formState.value.dataSources?.find(
    (d) => d.type === 'PLUGIN' && d.serviceId === currentEditingPluginKey.value,
  );
  if (dsItem) {
    dsItem.params = { ...editingParams.value };
  }
  pluginParamsVisible.value = false;
}

function handleParamFocus(name: string) {
  activeParamName.value = name;
}

function insertKeyword(kw: string) {
  if (!activeParamName.value) return;
  const currentVal = editingParams.value[activeParamName.value] || '';
  editingParams.value[activeParamName.value] = currentVal + kw;
}

function openAddModal(type: DataSourceType) {
  currentModalType.value = type;
  searchText.value = '';
  filterGroup.value = undefined;
  selectedRowKeys.value = [];

  if (type === 'POLICY') {
    currentPolicyId.value = undefined;
    policyClauses.value = [];
  }

  modalVisible.value = true;
}

function handleModalOk() {
  if (!currentModalType.value) return;

  switch (currentModalType.value) {
    case 'ATTACH': {
      let ds = formState.value.dataSources?.find((d) => d.type === 'ATTACH');
      if (!ds) {
        ds = { type: 'ATTACH', filterCats: [] };
        if (!formState.value.dataSources) formState.value.dataSources = [];
        formState.value.dataSources.push(ds);
      }
      // For Attach, key is the title/value itself
      const newCats = selectedRowKeys.value;
      ds.filterCats = [...new Set([...(ds.filterCats || []), ...newCats])];

      break;
    }
    case 'PLUGIN': {
      if (!formState.value.dataSources) formState.value.dataSources = [];
      selectedRowKeys.value.forEach((key) => {
        const plug = allPlugins.find((p) => p.key === key);
        if (
          plug &&
          !formState.value.dataSources?.some(
            (d) => d.type === 'PLUGIN' && d.serviceId === key,
          )
        ) {
          formState.value.dataSources.push({
            type: 'PLUGIN',
            serviceId: key,
            serviceName: plug.title,
            pluginId: plug.pluginName,
          });
        }
      });

      break;
    }
    case 'POLICY': {
      if (!formState.value.dataSources) formState.value.dataSources = [];

      const policyId = currentPolicyId.value;
      if (!policyId) return;

      const policy = policies.value.find((p) => p.id === policyId);
      if (!policy) return;

      const selectedClausesList = policyClauses.value.filter((c) =>
        selectedRowKeys.value.includes(c.id),
      );

      if (selectedClausesList.length === 0) return;

      // Find existing DataSource for this policy
      let ds = formState.value.dataSources.find(
        (d) => d.type === 'POLICY' && d.policyId === policyId,
      );
      if (!ds) {
        ds = {
          type: 'POLICY',
          policyId: policy.id,
          policyName: policy.name,
          clauses: [],
        };
        formState.value.dataSources.push(ds);
      }
      if (!ds.clauses) ds.clauses = [];

      // Add new clauses if not exist
      selectedClausesList.forEach((c) => {
        if (!ds!.clauses!.some((existing) => existing.id === c.id)) {
          ds!.clauses!.push({ id: c.id, title: c.title, content: c.content });
        }
      });

      break;
    }
    // No default
  }
  modalVisible.value = false;
}

function removeItem(type: DataSourceType, key: string) {
  switch (type) {
    case 'ATTACH': {
      const ds = formState.value.dataSources?.find((d) => d.type === 'ATTACH');
      if (ds && ds.filterCats) {
        ds.filterCats = ds.filterCats.filter((c) => c !== key);
      }

      break;
    }
    case 'PLUGIN': {
      const idx = formState.value.dataSources?.findIndex(
        (d) => d.type === 'PLUGIN' && d.serviceId === key,
      );
      if (idx !== undefined && idx !== -1)
        formState.value.dataSources?.splice(idx, 1);

      break;
    }
    case 'POLICY': {
      const idx = formState.value.dataSources?.findIndex(
        (d) => d.type === 'POLICY' && d.policyId === key,
      );
      if (idx !== undefined && idx !== -1)
        formState.value.dataSources?.splice(idx, 1);

      break;
    }
    // No default
  }
}
function removePolicyItem(item: any) {
  const ds = formState.value.dataSources?.find(
    (d) => d.type === 'POLICY' && d.policyId === item.policyId,
  );
  if (ds && ds.clauses) {
    ds.clauses = ds.clauses.filter((c) => c.id !== item.key);
    if (ds.clauses.length === 0) {
      // Remove the data source if no clauses left
      const idx = formState.value.dataSources?.indexOf(ds);
      if (idx !== undefined && idx !== -1) {
        formState.value.dataSources?.splice(idx, 1);
      }
    }
  } else if (ds && item.isFullPolicy) {
    // Legacy or full policy removal
    const idx = formState.value.dataSources?.indexOf(ds);
    if (idx !== undefined && idx !== -1) {
      formState.value.dataSources?.splice(idx, 1);
    }
  }
}

const previewVisible = ref(false);
const previewTitle = ref('');
const previewContent = ref('');

function showPreview(item: any) {
  previewTitle.value = item.title;
  previewContent.value = item.content;
  previewVisible.value = true;
}

// ------------------------------

const categoryOptions = [
  { label: '住宿费', value: '住宿费' },
  { label: '业务招待费', value: '业务招待费' },
  { label: '交通费', value: '交通费' },
];

const availableTools = [
  {
    label: '汇率查询',
    value: 'exchange_rate',
    desc: '查询实时汇率信息',
    icon: 'lucide:coins',
  },
  {
    label: '联网搜索',
    value: 'web_search',
    desc: '利用搜索引擎验证信息',
    icon: 'lucide:globe',
  },
  {
    label: 'OCR识别',
    value: 'ocr_extract',
    desc: '提取图片/PDF中的文字',
    icon: 'lucide:scan-text',
  },
];

// State for Data Sources management
const activeTab = ref('context');

watch(
  () => props.open,
  (val) => {
    if (val) {
      formState.value = props.record
        ? deepClone(props.record)
        : {
            scope: 'line',
            status: 'active',
            dataSources: [],
            tools: [],
            prompt:
              '从财务角度仔细审核一下内容： \n   1. 审核如果是物业费用必须要提供了水单 \n   2. 必须提供审核凭证附件 \n   3. 支付凭证附件上的金额要大于费用明细的数据',
            code: `RULE_${Date.now()}`, // Mock auto-gen
          };
    }
  },
);

async function handleSubmit() {
  try {
    loading.value = true;
    if (isUpdate.value && props.record?.id) {
      await updateAuditRuleApi(props.record.id, formState.value);
      message.success('更新成功');
    } else {
      await createAuditRuleApi(formState.value);
      message.success('创建成功');
    }
    emit('success');
    handleClose();
  } catch {
    message.error('保存失败');
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit('update:open', false);
}

function handleTest() {
  emit('test', formState.value);
}

function insertVariable(variable: string) {
  formState.value.prompt += ` {{${variable}}} `;
}

function handleToolCheck(value: string, checked: boolean) {
  if (!formState.value.tools) formState.value.tools = [];
  if (checked) {
    if (!formState.value.tools.includes(value)) {
      formState.value.tools.push(value);
    }
  } else {
    formState.value.tools = formState.value.tools.filter((t) => t !== value);
  }
}
</script>

<template>
  <Drawer
    :open="open"
    :title="title"
    width="90%"
    @close="handleClose"
    :mask-closable="false"
    placement="right"
    :body-style="{
      padding: '0',
      height: 'calc(100vh - 55px)',
      overflow: 'hidden',
    }"
  >
    <div class="flex h-full flex-col bg-gray-50">
      <!-- Toolbar -->
      <div
        class="flex items-center justify-between border-b bg-white px-4 py-2"
      >
        <Space>
          <Tag color="blue" v-if="isUpdate">
            版本: {{ record?.version || 'V1.0' }}
          </Tag>
          <Tag color="green" v-if="formState.status === 'active'">启用</Tag>
          <Tag color="red" v-else>禁用</Tag>
        </Space>
        <Space>
          <Button @click="handleTest">
            <template #icon><Icon icon="lucide:flask-conical" /></template>
            进入测试沙箱
          </Button>
          <Button type="primary" :loading="loading" @click="handleSubmit">
            <template #icon><Icon icon="lucide:save" /></template>
            保存配置
          </Button>
        </Space>
      </div>

      <!-- Main Layout: 3 Columns -->
      <div class="grid flex-1 grid-cols-12 gap-0 overflow-hidden">
        <!-- Left: Metadata -->
        <div class="col-span-3 overflow-y-auto border-r bg-white p-4">
          <h3 class="mb-4 font-bold text-gray-700">基础元数据</h3>
          <Form layout="vertical" :model="formState">
            <Form.Item label="规则名称" required>
              <Input
                v-model:value="formState.name"
                placeholder="如：住宿费-城市限额检查"
              />
            </Form.Item>
            <Form.Item label="规则编码">
              <Input
                v-model:value="formState.code"
                :disabled="!!props.record?.id"
              />
            </Form.Item>
            <Form.Item label="作用域">
              <Radio.Group v-model:value="formState.scope" button-style="solid">
                <Radio.Button value="entire">整单级</Radio.Button>
                <Radio.Button value="line">行级</Radio.Button>
              </Radio.Group>
            </Form.Item>
            <Form.Item label="适用科目" v-if="formState.scope === 'line'">
              <Select
                v-model:value="formState.applicableCategories"
                mode="multiple"
                :options="categoryOptions"
                placeholder="请选择科目"
              />
            </Form.Item>
            <Form.Item label="规则描述">
              <Input.TextArea v-model:value="formState.description" :rows="3" />
            </Form.Item>
            <Form.Item label="状态">
              <Radio.Group v-model:value="formState.status">
                <Radio value="active">启用</Radio>
                <Radio value="inactive">禁用</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </div>

        <!-- Middle: Context & Capabilities -->
        <div class="col-span-4 overflow-y-auto border-r bg-gray-50 p-4">
          <h3 class="mb-4 font-bold text-gray-700">上下文与能力</h3>

          <Tabs v-model:active-key="activeTab">
            <Tabs.TabPane key="context" tab="审核数据源">
              <Alert
                message="请配置本规则依赖的审核数据源（附件、制度及插件）。系统会将选中的数据自动注入到审核智能体的上下文中。请仅勾选必要数据，避免无关信息干扰审核准确性。"
                type="info"
                show-icon
                class="mb-4"
              />
              <div class="flex flex-col gap-4">
                <!-- Card 1: Attachments -->
                <Card size="small">
                  <template #title>
                    <Space>
                      <Icon icon="lucide:paperclip" class="size-4" />
                      审核附件
                    </Space>
                  </template>
                  <template #extra>
                    <Button
                      type="link"
                      size="small"
                      @click="openAddModal('ATTACH')"
                    >
                      添加
                    </Button>
                  </template>
                  <div class="flex flex-col gap-2 rounded-md bg-gray-50 p-2">
                    <div
                      v-if="selectedAttachmentItems.length === 0"
                      class="py-2 text-center text-xs text-gray-400"
                    >
                      暂无附件
                    </div>
                    <div
                      v-for="item in selectedAttachmentItems"
                      :key="item.key"
                      class="flex items-center justify-between rounded border bg-white px-3 py-2 shadow-sm"
                    >
                      <span class="text-sm">{{ item.title }}</span>
                      <Icon
                        icon="lucide:trash-2"
                        class="cursor-pointer text-gray-400 hover:text-red-500"
                        @click="removeItem('ATTACH', item.key)"
                      />
                    </div>
                  </div>
                </Card>

                <!-- Card 2: Policies -->
                <Card size="small">
                  <template #title>
                    <Space>
                      <Icon icon="lucide:book-open" class="size-4" />
                      审核制度
                    </Space>
                  </template>
                  <template #extra>
                    <Button
                      type="link"
                      size="small"
                      @click="openAddModal('POLICY')"
                    >
                      添加
                    </Button>
                  </template>
                  <div class="flex flex-col gap-2 rounded-md bg-gray-50 p-2">
                    <div
                      v-if="selectedPolicyItems.length === 0"
                      class="py-2 text-center text-xs text-gray-400"
                    >
                      暂无制度
                    </div>
                    <div
                      v-for="item in selectedPolicyItems"
                      :key="item.key"
                      class="flex items-center justify-between rounded border bg-white px-3 py-2 shadow-sm"
                    >
                      <div class="flex flex-col overflow-hidden">
                        <span
                          class="truncate text-sm font-medium"
                          :title="item.title"
                        >
                          {{ item.title }}
                        </span>
                        <span
                          class="truncate text-xs text-gray-400"
                          :title="item.subtitle"
                        >
                          {{ item.subtitle }}
                        </span>
                      </div>
                      <div class="flex items-center gap-1">
                        <Tooltip title="查看正文">
                          <Icon
                            icon="lucide:eye"
                            class="cursor-pointer text-gray-400 hover:text-blue-500"
                            @click="showPreview(item)"
                          />
                        </Tooltip>
                        <Icon
                          icon="lucide:trash-2"
                          class="cursor-pointer text-gray-400 hover:text-red-500"
                          @click="removePolicyItem(item)"
                        />
                      </div>
                    </div>
                  </div>
                </Card>

                <!-- Card 3: Plugins -->
                <Card size="small">
                  <template #title>
                    <Space>
                      <Icon icon="lucide:plug" class="size-4" />
                      数据源插件
                    </Space>
                  </template>
                  <template #extra>
                    <Button
                      type="link"
                      size="small"
                      @click="openAddModal('PLUGIN')"
                    >
                      添加
                    </Button>
                  </template>
                  <div class="flex flex-col gap-2 rounded-md bg-gray-50 p-2">
                    <div
                      v-if="selectedPluginItems.length === 0"
                      class="py-2 text-center text-xs text-gray-400"
                    >
                      暂无插件服务
                    </div>
                    <div
                      v-for="item in selectedPluginItems"
                      :key="item.key"
                      class="flex items-center justify-between rounded border bg-white px-3 py-2 shadow-sm"
                    >
                      <div class="flex flex-col">
                        <span class="text-sm font-medium">
                          {{ item.title }}
                        </span>
                        <span class="text-xs text-gray-400">
                          {{ item.subtitle }}
                        </span>
                      </div>
                      <div class="flex items-center gap-2">
                        <Icon
                          v-if="item.hasParams && !item.isConfigured"
                          icon="lucide:alert-triangle"
                          class="text-orange-500"
                          title="需要配置入参"
                        />
                        <Icon
                          v-if="item.hasParams"
                          icon="lucide:settings"
                          class="cursor-pointer text-gray-400 hover:text-blue-500"
                          @click="handleConfigPlugin(item)"
                        />
                        <Icon
                          icon="lucide:trash-2"
                          class="cursor-pointer text-gray-400 hover:text-red-500"
                          @click="removeItem('PLUGIN', item.key)"
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </Tabs.TabPane>

            <Tabs.TabPane key="tools" tab="工具挂载">
              <Alert
                message="勾选工具后审核智能体会按需调用工具"
                type="info"
                show-icon
                class="mb-4"
              />
              <div class="flex flex-col gap-3">
                <div
                  v-for="tool in availableTools"
                  :key="tool.value"
                  class="flex items-center gap-3 rounded-lg border bg-white p-3 transition-colors hover:bg-gray-50"
                >
                  <Checkbox
                    :checked="formState.tools?.includes(tool.value)"
                    @update:checked="(val) => handleToolCheck(tool.value, val)"
                  />
                  <div
                    class="flex size-10 items-center justify-center rounded bg-blue-50 text-blue-500"
                  >
                    <Icon :icon="tool.icon" class="size-6" />
                  </div>
                  <div class="flex flex-col">
                    <span class="font-medium text-gray-800">
                      {{ tool.label }}
                    </span>
                    <span class="text-xs text-gray-500">{{ tool.desc }}</span>
                  </div>
                </div>
              </div>
            </Tabs.TabPane>
          </Tabs>
        </div>

        <!-- Right: Prompt Engineering -->
        <div class="col-span-5 flex flex-col bg-white p-4">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="font-bold text-gray-700">审核规则描述</h3>
            <Space size="small">
              <Button size="small" @click="insertVariable('item')">
                &#123;&#123;item&#125;&#125;
              </Button>
              <Button size="small" @click="insertVariable('proofs')">
                &#123;&#123;proofs&#125;&#125;
              </Button>
              <Button size="small" @click="insertVariable('policy')">
                &#123;&#123;policy&#125;&#125;
              </Button>
            </Space>
          </div>

          <div class="relative flex-1 overflow-hidden rounded-md border">
            <CodeEditor
              v-model:value="formState.prompt"
              mode="text"
              placeholder="在此编写 Prompt..."
              class="h-full"
            />
          </div>
          <div class="mt-2 text-xs text-gray-400">
            支持 Mustache 语法 &#123;&#123;variable&#125;&#125; 引用上下文。
          </div>
        </div>
      </div>
    </div>
    <Modal
      v-model:open="modalVisible"
      :title="modalTitle"
      @ok="handleModalOk"
      width="600px"
    >
      <div class="mb-4 flex gap-2">
        <Select
          v-if="currentModalType === 'ATTACH'"
          v-model:value="filterGroup"
          placeholder="筛选附件组"
          style="width: 150px"
          allow-clear
          :options="attachmentGroups.map((g) => ({ label: g, value: g }))"
        />
        <Select
          v-if="currentModalType === 'POLICY'"
          v-model:value="currentPolicyId"
          placeholder="请选择制度库"
          style="width: 200px"
          show-search
          :options="policies.map((p) => ({ label: p.name, value: p.id }))"
          :loading="loadingPolicies"
        />
        <Input.Search
          v-model:value="searchText"
          placeholder="请输入关键字搜索..."
          enter-button
          @search="() => {}"
        />
      </div>
      <Table
        :columns="modalColumns"
        :data-source="modalDataSource"
        :row-selection="{
          selectedRowKeys,
          onChange: (keys: any[]) => (selectedRowKeys = keys),
        }"
        :row-key="(record) => record.id || record.key"
        size="small"
        :pagination="{ pageSize: 5 }"
        :loading="currentModalType === 'POLICY' ? loadingClauses : false"
      />
    </Modal>
    <Modal v-model:open="previewVisible" :title="previewTitle" footer="">
      <div
        class="max-h-[60vh] overflow-y-auto p-2"
        v-html="previewContent"
      ></div>
    </Modal>
    <Modal
      v-model:open="pluginParamsVisible"
      title="插件入参配置"
      width="800px"
      @ok="handleSaveParams"
    >
      <div class="flex gap-4">
        <div class="flex-1">
          <Form layout="vertical">
            <Form.Item
              v-for="param in parsedParamsList"
              :key="param.name"
              :label="param.description || param.name"
              :required="param.required"
            >
              <Input
                v-model:value="editingParams[param.name]"
                @focus="handleParamFocus(param.name)"
                :placeholder="param.name"
              />
            </Form.Item>
          </Form>
        </div>
        <div class="w-1/3 border-l pl-4">
          <div class="mb-2 font-bold">可用变量</div>
          <div class="flex flex-col gap-2">
            <Tag
              v-for="kw in keywords"
              :key="kw.name"
              color="blue"
              class="cursor-pointer"
              @click="insertKeyword(kw.value)"
            >
              {{ kw.name }}
            </Tag>
          </div>
        </div>
      </div>
    </Modal>
  </Drawer>
</template>
