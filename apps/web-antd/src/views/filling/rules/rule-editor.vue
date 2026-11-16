<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Alert,
  Button,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

const props = defineProps<{
  open: boolean;
  record?: any;
}>();

const emit = defineEmits(['update:open', 'success']);

const loading = ref(false);
const isUpdate = computed(() => !!props.record?.id);
const title = computed(() => (isUpdate.value ? '编辑规则' : '新建规则'));

interface SubField {
  label: string;
  fieldName: string;
  dataSource: string;
  dataSourceValue?: string;
  mcpTool?: string;
  mcpMethodName: string;
  pluginName?: string;
  pluginInterface?: string;
}

const dataSourceOptions = [
  { label: '字段元数据', value: 'field_metadata' },
  { label: '主数据', value: 'master_data' },
  { label: '字典', value: 'dictionary' },
  { label: '数据源工具', value: 'tool' },
];

const masterDataItems = [
  { label: '员工主数据', value: 'md_employee' },
  { label: '部门主数据', value: 'md_dept' },
  { label: '客户主数据', value: 'md_customer' },
  { label: '供应商主数据', value: 'md_supplier' },
  { label: '项目主数据', value: 'md_project' },
  { label: '科目主数据', value: 'md_account' },
];

const dictionaryItems = [
  { label: '费用类型字典', value: 'dict_cost_type' },
  { label: '币种字典', value: 'dict_currency' },
  { label: '国家地区字典', value: 'dict_country' },
  { label: '结算方式字典', value: 'dict_settlement' },
  { label: '税率字典', value: 'dict_tax_rate' },
  { label: '审批状态字典', value: 'dict_approval_status' },
];

function getDataSourceValueOptions(dataSource: string) {
  if (dataSource === 'master_data') return masterDataItems;
  if (dataSource === 'dictionary') return dictionaryItems;
  return [];
}

const mcpToolOptions = [
  { label: 'SAP MCP Server', value: 'mcp_sap' },
  { label: '用友 MCP Server', value: 'mcp_yonyou' },
  { label: '金蝶 MCP Server', value: 'mcp_kingdee' },
  { label: '企业微信 MCP Server', value: 'mcp_wecom' },
  { label: '钉钉 MCP Server', value: 'mcp_dingtalk' },
  { label: '自定义 MCP Server', value: 'mcp_custom' },
];

const pluginOptions = [
  { label: '费用计算插件', value: 'plugin_cost_calc' },
  { label: '汇率转换插件', value: 'plugin_exchange_rate' },
  { label: '预算检查插件', value: 'plugin_budget_check' },
  { label: '审批流插件', value: 'plugin_approval_flow' },
  { label: '数据校验插件', value: 'plugin_data_validate' },
  { label: '附件解析插件', value: 'plugin_attachment_parse' },
];

const pluginInterfaceOptions: Record<
  string,
  { label: string; value: string }[]
> = {
  plugin_cost_calc: [
    { label: '住宿费计算接口', value: 'api_hotel_calc' },
    { label: '交通费计算接口', value: 'api_transport_calc' },
  ],
  plugin_exchange_rate: [
    { label: '实时汇率查询接口', value: 'api_rate_live' },
    { label: '历史汇率查询接口', value: 'api_rate_history' },
  ],
  plugin_budget_check: [
    { label: '部门预算检查接口', value: 'api_dept_budget' },
    { label: '项目预算检查接口', value: 'api_project_budget' },
  ],
  plugin_approval_flow: [
    { label: '审批流查询接口', value: 'api_approval_query' },
    { label: '审批人计算接口', value: 'api_approver_calc' },
  ],
  plugin_data_validate: [
    { label: '费用合规校验接口', value: 'api_compliance' },
    { label: '发票真伪校验接口', value: 'api_invoice_verify' },
  ],
  plugin_attachment_parse: [
    { label: '发票OCR识别接口', value: 'api_ocr_invoice' },
    { label: '水单信息提取接口', value: 'api_receipt_extract' },
  ],
};

const auditTypeOptions = [
  { label: '住宿费', value: '住宿费' },
  { label: '火车票', value: '火车票' },
  { label: '市内交通费', value: '市内交通费' },
  { label: '业务招待费', value: '业务招待费' },
  { label: '办公用品费', value: '办公用品费' },
  { label: '通讯费', value: '通讯费' },
  { label: '其他费用', value: '其他费用' },
];

// Attachment types for classification check
const allAttachments = [
  { key: '增值税发票', title: '增值税发票', code: 'ATT_001', group: '发票类' },
  { key: '酒店水单', title: '酒店水单', code: 'ATT_002', group: '单据类' },
  { key: '行程单', title: '行程单', code: 'ATT_003', group: '单据类' },
  { key: '支付凭证', title: '支付凭证', code: 'ATT_004', group: '凭证类' },
  { key: '合同文件', title: '合同文件', code: 'ATT_005', group: '合同类' },
  { key: '打车票', title: '打车票', code: 'ATT_006', group: '票据类' },
  { key: '火车票', title: '火车票', code: 'ATT_007', group: '票据类' },
  { key: '住宿水单', title: '住宿水单', code: 'ATT_008', group: '单据类' },
];

const attachmentGroups = [...new Set(allAttachments.map((a) => a.group))];

const formState = ref<{
  auditContent: string;
  auditTypes: string[];
  code: string;
  description: string;
  id: string;
  linkAuditType: boolean;
  name: string;
  needAttachmentCheck: boolean;
  needClassifyCheck: boolean;
  requiredAttachments: string[];
  status: string;
  subFields: SubField[];
}>({
  id: '',
  code: '',
  name: '',
  linkAuditType: false,
  auditTypes: [],
  description: '',
  auditContent: '',
  needAttachmentCheck: false,
  needClassifyCheck: false,
  requiredAttachments: [],
  subFields: [],
  status: 'active',
});

watch(
  () => props.open,
  (val) => {
    if (val) {
      formState.value = props.record
        ? {
            ...props.record,
            code: props.record.code || '',
            linkAuditType:
              props.record.linkAuditType ?? !!props.record.auditTypes?.length,
            auditTypes: props.record.auditTypes || [],
            description: props.record.description || '',
            auditContent: props.record.auditContent || '',
            needAttachmentCheck: props.record.needAttachmentCheck ?? false,
            needClassifyCheck: props.record.needClassifyCheck ?? false,
            requiredAttachments: props.record.requiredAttachments || [],
            subFields:
              props.record.subFields?.map((sf: any) =>
                typeof sf === 'string'
                  ? {
                      label: sf,
                      fieldName: '',
                      dataSource: 'field_metadata',
                      dataSourceValue: undefined,
                      mcpTool: undefined,
                      mcpMethodName: '',
                      pluginName: undefined,
                      pluginInterface: undefined,
                    }
                  : {
                      label: sf.label || '',
                      fieldName: sf.fieldName || '',
                      dataSource: sf.dataSource || 'field_metadata',
                      dataSourceValue: sf.dataSourceValue || undefined,
                      mcpTool: sf.mcpTool || undefined,
                      mcpMethodName: sf.mcpMethodName || '',
                      pluginName: sf.pluginName || undefined,
                      pluginInterface: sf.pluginInterface || undefined,
                    },
              ) || [],
          }
        : {
            id: `fr_${Date.now()}`,
            code: `FR_${Date.now()}`,
            name: '',
            linkAuditType: false,
            auditTypes: [],
            description: '',
            auditContent: '',
            needAttachmentCheck: false,
            needClassifyCheck: false,
            requiredAttachments: [],
            subFields: [],
            status: 'active',
          };
    }
  },
);

// ── Attachment Modal ──
const attachModalVisible = ref(false);
const attachSearchText = ref('');
const filterGroup = ref<string | undefined>(undefined);
const selectedRowKeys = ref<string[]>([]);

const attachModalDataSource = computed(() => {
  const text = attachSearchText.value.toLowerCase();
  return allAttachments.filter((item) => {
    const matchText =
      !text ||
      item.title.includes(text) ||
      item.code.toLowerCase().includes(text);
    const matchGroup = !filterGroup.value || item.group === filterGroup.value;
    return matchText && matchGroup;
  });
});

const attachModalColumns = [
  { title: '编号', dataIndex: 'code', width: 100 },
  { title: '分类名称', dataIndex: 'title' },
  { title: '附件组', dataIndex: 'group' },
];

function openAttachModal() {
  attachSearchText.value = '';
  filterGroup.value = undefined;
  selectedRowKeys.value = [...formState.value.requiredAttachments];
  attachModalVisible.value = true;
}

function handleAttachModalOk() {
  formState.value.requiredAttachments = [...selectedRowKeys.value];
  attachModalVisible.value = false;
}

function removeAttachment(att: string) {
  formState.value.requiredAttachments =
    formState.value.requiredAttachments.filter((a) => a !== att);
}

// ── Sub-fields ──
function addSubField() {
  formState.value.subFields.push({
    label: '',
    fieldName: '',
    dataSource: 'field_metadata',
    dataSourceValue: undefined,
    mcpTool: undefined,
    mcpMethodName: '',
    pluginName: undefined,
    pluginInterface: undefined,
  });
}

function removeSubField(index: number) {
  formState.value.subFields.splice(index, 1);
}

function handleDataSourceChange(sf: SubField) {
  sf.dataSourceValue = undefined;
}

function getDataSourceValuePlaceholder(dataSource: string) {
  if (dataSource === 'master_data') return '请选择主数据';
  if (dataSource === 'dictionary') return '请选择字典';
  return '请选择';
}

function handlePluginNameChange(sf: SubField) {
  sf.pluginInterface = undefined;
}

// ── Submit ──
async function handleSubmit() {
  if (!formState.value.name) {
    message.warning('请输入规则名称');
    return;
  }
  if (
    formState.value.linkAuditType &&
    formState.value.auditTypes.length === 0
  ) {
    message.warning('请选择审核类型');
    return;
  }
  loading.value = true;
  try {
    await new Promise((r) => setTimeout(r, 300));
    message.success(isUpdate.value ? '更新成功' : '创建成功');
    emit('success');
    handleClose();
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit('update:open', false);
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
          <Tag color="green" v-if="formState.status === 'active'">启用</Tag>
          <Tag color="red" v-else>禁用</Tag>
        </Space>
        <Space>
          <Button @click="handleClose">取消</Button>
          <Button
            type="primary"
            :loading="loading"
            class="!bg-slate-900"
            @click="handleSubmit"
          >
            <template #icon><Icon icon="lucide:save" /></template>
            保存配置
          </Button>
        </Space>
      </div>

      <!-- Main Layout: 3 Columns -->
      <div class="grid flex-1 grid-cols-12 gap-0 overflow-hidden">
        <!-- Left: Basic Info -->
        <div class="col-span-2 overflow-y-auto border-r bg-white p-4">
          <h3 class="mb-4 font-bold text-gray-700">基础信息</h3>
          <Form layout="vertical">
            <Form.Item label="规则名称" required>
              <Input
                v-model:value="formState.name"
                placeholder="如：住宿费规则"
              />
            </Form.Item>

            <Form.Item label="规则编码">
              <Input
                v-model:value="formState.code"
                :disabled="isUpdate"
                placeholder="新建时自动生成"
              />
            </Form.Item>

            <Form.Item label="关联审核类型">
              <Radio.Group v-model:value="formState.linkAuditType">
                <Radio :value="true">是</Radio>
                <Radio :value="false">否</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item v-if="formState.linkAuditType" label="审核类型" required>
              <Select
                v-model:value="formState.auditTypes"
                mode="multiple"
                placeholder="请选择审核类型（可多选）"
                :options="auditTypeOptions"
              />
            </Form.Item>

            <Form.Item label="规则描述">
              <Input.TextArea
                v-model:value="formState.description"
                :rows="3"
                placeholder="请输入规则描述"
              />
            </Form.Item>

            <Form.Item label="状态">
              <Radio.Group v-model:value="formState.status">
                <Radio value="active">启用</Radio>
                <Radio value="disabled">禁用</Radio>
              </Radio.Group>
            </Form.Item>
          </Form>
        </div>

        <!-- Middle: Attachments & Sub-fields -->
        <div class="col-span-7 overflow-y-auto border-r bg-gray-50 p-4">
          <h3 class="mb-4 font-bold text-gray-700">附件与字段</h3>

          <!-- Attachment Check -->
          <div class="mb-4 rounded-lg border border-slate-200 bg-white p-3">
            <div class="mb-2 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Icon icon="lucide:paperclip" class="size-4 text-blue-500" />
                <span class="text-sm font-medium text-slate-700">附件检查</span>
              </div>
              <Radio.Group
                v-model:value="formState.needAttachmentCheck"
                size="small"
              >
                <Radio :value="false">不检查</Radio>
                <Radio :value="true">检查</Radio>
              </Radio.Group>
            </div>

            <template v-if="formState.needAttachmentCheck">
              <Alert
                message="开启后，系统将校验填报单据是否包含必要的附件。"
                type="info"
                show-icon
                class="mb-3"
              />
              <div class="mb-2 flex items-center gap-2">
                <span class="text-xs font-medium text-slate-600">分类检查</span>
                <Radio.Group
                  v-model:value="formState.needClassifyCheck"
                  size="small"
                >
                  <Radio :value="false">不分类</Radio>
                  <Radio :value="true">分类</Radio>
                </Radio.Group>
              </div>
              <div class="mb-3 text-xs text-slate-400">
                {{
                  formState.needClassifyCheck
                    ? '需指定附件类型，系统将按分类校验'
                    : '仅校验是否存在附件，不区分类型'
                }}
              </div>

              <!-- Attachment type selector (only when classify check is on) -->
              <div v-if="formState.needClassifyCheck">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-xs font-bold text-slate-600">附件类型</span>
                  <Button type="link" size="small" @click="openAttachModal">
                    添加
                  </Button>
                </div>
                <div class="flex flex-col gap-1.5 rounded-md bg-gray-50 p-2">
                  <div
                    v-if="formState.requiredAttachments.length === 0"
                    class="py-2 text-center text-xs text-gray-400"
                  >
                    暂无附件类型
                  </div>
                  <div
                    v-for="att in formState.requiredAttachments"
                    :key="att"
                    class="flex items-center justify-between rounded border bg-white px-3 py-1.5 shadow-sm"
                  >
                    <span class="text-xs text-slate-700">{{ att }}</span>
                    <Icon
                      icon="lucide:trash-2"
                      class="size-3.5 cursor-pointer text-gray-400 hover:text-red-500"
                      @click="removeAttachment(att)"
                    />
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Sub-fields -->
          <div class="rounded-lg border border-slate-200 bg-white p-3">
            <div class="mb-2 flex items-center gap-2">
              <Icon icon="lucide:list" class="size-4 text-emerald-500" />
              <span class="text-sm font-medium text-slate-700">必填子字段</span>
            </div>
            <div class="flex flex-col gap-2">
              <div
                class="mb-1 grid grid-cols-[128px_144px_112px_1fr_auto] items-center gap-2 text-xs font-medium text-slate-500"
              >
                <div>字段</div>
                <div>元数据字段名</div>
                <div>数据源</div>
                <div>扩展值</div>
                <div class="w-8"></div>
              </div>
              <div
                v-for="(sf, index) in formState.subFields"
                :key="index"
                class="grid grid-cols-[128px_144px_112px_1fr_auto] items-center gap-2"
              >
                <Input
                  v-model:value="sf.label"
                  placeholder="字段"
                  size="small"
                  class="!text-xs"
                />
                <Input
                  v-model:value="sf.fieldName"
                  placeholder="元数据字段名"
                  size="small"
                  class="!text-xs"
                />
                <Select
                  v-model:value="sf.dataSource"
                  :options="dataSourceOptions"
                  size="small"
                  @change="handleDataSourceChange(sf)"
                />
                <div class="flex min-w-0 items-center gap-2">
                  <Select
                    v-if="
                      sf.dataSource === 'master_data' ||
                      sf.dataSource === 'dictionary'
                    "
                    v-model:value="sf.dataSourceValue"
                    :options="getDataSourceValueOptions(sf.dataSource)"
                    :placeholder="getDataSourceValuePlaceholder(sf.dataSource)"
                    size="small"
                    allow-clear
                    class="!w-32"
                  />
                  <div
                    v-if="sf.dataSource === 'tool'"
                    class="grid w-full grid-cols-2 gap-2"
                  >
                    <Select
                      v-model:value="sf.mcpTool"
                      :options="mcpToolOptions"
                      placeholder="MCP工具"
                      size="small"
                      allow-clear
                    />
                    <Input
                      v-model:value="sf.mcpMethodName"
                      placeholder="MCP方法名称"
                      size="small"
                      class="!text-xs"
                    />
                    <Select
                      v-model:value="sf.pluginName"
                      :options="pluginOptions"
                      placeholder="数据源插件"
                      size="small"
                      allow-clear
                      @change="handlePluginNameChange(sf)"
                    />
                    <Select
                      v-model:value="sf.pluginInterface"
                      :options="pluginInterfaceOptions[sf.pluginName] || []"
                      placeholder="数据源插件接口"
                      size="small"
                      allow-clear
                    />
                  </div>
                </div>
                <Button
                  type="text"
                  danger
                  size="small"
                  class="!h-auto justify-self-start !p-1"
                  @click="removeSubField(index)"
                >
                  <Icon icon="lucide:x" class="size-3.5" />
                </Button>
              </div>
              <Button type="dashed" size="small" @click="addSubField">
                <Icon icon="lucide:plus" class="mr-1 size-3" />
                添加子字段
              </Button>
            </div>
          </div>
        </div>

        <!-- Right: 规则提示词 -->
        <div class="col-span-3 flex flex-col bg-white p-4">
          <h3 class="mb-4 font-bold text-gray-700">规则提示词</h3>
          <div class="relative flex-1 overflow-hidden rounded-md border">
            <Input.TextArea
              v-model:value="formState.auditContent"
              :rows="1"
              placeholder="请编写规则提示词..."
              class="!h-full !resize-none !border-none !shadow-none"
              :style="{ height: '100%', minHeight: '300px' }"
            />
          </div>
          <div class="mt-2 text-xs text-gray-400">
            编写该规则的提示词，描述处理逻辑和判断依据。
          </div>
        </div>
      </div>
    </div>

    <!-- Attachment Type Selection Modal -->
    <Modal
      v-model:open="attachModalVisible"
      title="选择附件类型"
      @ok="handleAttachModalOk"
      width="600px"
    >
      <div class="mb-4 flex gap-2">
        <Select
          v-model:value="filterGroup"
          placeholder="筛选附件组"
          style="width: 150px"
          allow-clear
          :options="attachmentGroups.map((g) => ({ label: g, value: g }))"
        />
        <Input.Search
          v-model:value="attachSearchText"
          placeholder="请输入关键字搜索..."
          enter-button
          @search="() => {}"
        />
      </div>
      <Table
        :columns="attachModalColumns"
        :data-source="attachModalDataSource"
        :row-selection="{
          selectedRowKeys,
          onChange: (keys: any[]) => (selectedRowKeys = keys),
        }"
        :row-key="(record) => record.key"
        size="small"
        :pagination="{ pageSize: 5 }"
      />
    </Modal>
  </Drawer>
</template>
