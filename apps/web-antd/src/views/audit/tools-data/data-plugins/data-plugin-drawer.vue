<script setup lang="ts">
import type { DataPlugin, PluginService } from '#/types/tools-data';

import { computed, reactive, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Drawer,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Upload,
} from 'ant-design-vue';

import { createDataPluginApi, updateDataPluginApi } from '#/api/tools-data';
import { deepClone } from '#/utils/deep-clone';

const props = defineProps<{
  open: boolean;
  plugin: DataPlugin | null;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const activeTab = ref('basic');
const saving = ref(false);
const scanning = ref(false);
const formRef = ref();

// Service Modal State
const serviceModalOpen = ref(false);
const currentService = reactive<Partial<PluginService>>({});
const isEditingService = ref(false);
const serviceFormRef = ref();

const formData = reactive<Partial<DataPlugin>>({
  code: '',
  name: '',
  baseUrl: '',
  description: '',
  method: 'GET',
  authType: 'NONE',
  authToken: '',
  status: 'active',
  services: [],
});

const serviceColumns = [
  {
    title: '相对地址',
    dataIndex: 'relativeUrl',
    key: 'relativeUrl',
    width: '25%',
  },
  { title: '请求方式', dataIndex: 'method', key: 'method', width: '15%' },
  {
    title: '入参描述',
    dataIndex: 'description',
    key: 'description',
    width: '25%',
  },
  {
    title: '返回格式',
    dataIndex: 'returnType',
    key: 'returnType',
    width: '25%',
  },
  { title: '操作', key: 'action', width: '10%', align: 'center' },
];

watch(
  () => props.open,
  (val) => {
    if (val) {
      if (props.plugin) {
        Object.assign(formData, deepClone(props.plugin));
      } else {
        Object.assign(formData, {
          code: '',
          name: '',
          baseUrl: '',
          description: '',
          authType: 'NONE',
          authToken: '',
          status: 'active',
          services: [],
        });
      }
      activeTab.value = 'basic';
    }
  },
);

async function handleSave() {
  try {
    await formRef.value?.validate();
    saving.value = true;

    // Validate services
    if (!formData.services || formData.services.length === 0) {
      message.warning('请至少添加一个服务接口');
      activeTab.value = 'services';
      saving.value = false;
      return;
    }

    if (props.plugin) {
      await updateDataPluginApi(props.plugin.id, formData);
      message.success('更新成功');
    } else {
      await createDataPluginApi(formData);
      message.success('创建成功');
    }

    emit('success');
    emit('update:open', false);
  } catch (error) {
    console.error(error);
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
}

// Upload & Scan Simulation
function customRequest({ onSuccess }: any) {
  setTimeout(() => {
    onSuccess('ok');
    simulateScan(true);
  }, 1000);
}

function simulateScan(isFullScan: boolean = false) {
  scanning.value = true;
  message.loading({
    content: isFullScan ? '正在扫描插件包...' : '正在扫描服务接口...',
    key: 'scan',
  });

  setTimeout(() => {
    if (isFullScan) {
      // Full scan from ZIP
      if (!formData.code)
        formData.code = `IMPORTED_PLUGIN_${Math.floor(Math.random() * 1000)}`;
      if (!formData.name) formData.name = '导入的财务插件';
      if (!formData.baseUrl) formData.baseUrl = 'https://api.finance.internal';
      if (!formData.description)
        formData.description = '从 ZIP 包自动导入的财务服务接口';
    }

    // Add scanned services
    const newServices: PluginService[] = [
      {
        id: String(Date.now()),
        relativeUrl: '/api/v1/invoice/validate',
        method: 'POST',
        description: '验证发票真伪. Body: { code: string, number: string }',
        returnType: '{ valid: boolean, amount: number }',
      },
      {
        id: String(Date.now() + 1),
        relativeUrl: '/api/v1/tax/calculate',
        method: 'GET',
        description: '计算税额. Query: amount, type',
        returnType: '{ tax: number, rate: number }',
      },
    ];

    if (!formData.services) formData.services = [];
    formData.services.push(...newServices);

    message.success({ content: '扫描完成，已添加新服务', key: 'scan' });
    scanning.value = false;
    activeTab.value = 'services';
  }, 1500);
}

// Service Management
function handleAddService() {
  isEditingService.value = false;
  Object.assign(currentService, {
    id: '',
    relativeUrl: '',
    method: 'GET',
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
    returnType: `{
  "code": 0,
  "data": {},
  "message": "success"
}`,
  });
  serviceModalOpen.value = true;
}

function handleEditService(record: PluginService) {
  isEditingService.value = true;
  Object.assign(currentService, deepClone(record));
  serviceModalOpen.value = true;
}

async function handleSaveService() {
  try {
    await serviceFormRef.value?.validate();

    if (isEditingService.value) {
      // Update existing
      const index = formData.services?.findIndex(
        (s) => s.id === currentService.id,
      );
      if (index !== undefined && index !== -1 && formData.services) {
        formData.services[index] = { ...currentService } as PluginService;
      }
    } else {
      // Add new
      const newService = {
        ...currentService,
        id: String(Date.now()),
      } as PluginService;
      formData.services?.push(newService);
    }

    serviceModalOpen.value = false;
    message.success(isEditingService.value ? '更新服务成功' : '添加服务成功');
  } catch {
    // Validation failed
  }
}

function handleDeleteService(id: string) {
  const index = formData.services?.findIndex((s) => s.id === id);
  if (index !== undefined && index !== -1) {
    formData.services?.splice(index, 1);
    message.success('删除服务成功');
  }
}

const isEdit = computed(() => !!props.plugin);
const title = computed(() => (isEdit.value ? '编辑插件' : '注册插件'));
</script>

<template>
  <Drawer
    :open="open"
    :title="title"
    width="800px"
    @close="emit('update:open', false)"
  >
    <template #extra>
      <Upload
        name="file"
        :show-upload-list="false"
        :custom-request="customRequest"
        accept=".zip,.rar"
      >
        <Button :loading="scanning">
          <Icon icon="lucide:upload" class="mr-2 size-4" />
          上传插件包(ZIP)
        </Button>
      </Upload>
    </template>

    <Form ref="formRef" :model="formData" layout="vertical">
      <Tabs v-model:active-key="activeTab">
        <!-- Tab 1: Basic Info -->
        <Tabs.TabPane key="basic" tab="基本信息">
          <div class="grid grid-cols-2 gap-4">
            <Form.Item
              label="插件编号"
              name="code"
              :rules="[{ required: true, message: '请输入插件编号' }]"
            >
              <Input
                v-model:value="formData.code"
                placeholder="如: HR_SYSTEM"
              />
            </Form.Item>
            <Form.Item
              label="插件名称"
              name="name"
              :rules="[{ required: true, message: '请输入插件名称' }]"
            >
              <Input
                v-model:value="formData.name"
                placeholder="如: HR人力资源系统"
              />
            </Form.Item>
          </div>

          <Form.Item
            label="基础地址 (Base URL)"
            name="baseUrl"
            :rules="[{ required: true, message: '请输入基础地址' }]"
          >
            <Input
              v-model:value="formData.baseUrl"
              placeholder="如: https://api.example.com"
            />
          </Form.Item>

          <Form.Item label="插件描述" name="description">
            <Input.TextArea
              v-model:value="formData.description"
              :rows="3"
              placeholder="描述插件的功能和用途"
            />
          </Form.Item>

          <div class="grid grid-cols-2 gap-4">
            <Form.Item label="授权模式" name="authType">
              <Select v-model:value="formData.authType">
                <Select.Option value="NONE">无 (None)</Select.Option>
                <Select.Option value="BASIC">Basic Auth</Select.Option>
                <Select.Option value="BEARER">Bearer Token</Select.Option>
                <Select.Option value="API_KEY">API Key</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              v-if="formData.authType !== 'NONE'"
              label="授权凭证"
              name="authToken"
              :rules="[{ required: true, message: '请输入授权凭证' }]"
            >
              <Input.Password
                v-model:value="formData.authToken"
                placeholder="Token / Key / Password"
              />
            </Form.Item>
          </div>

          <Form.Item label="状态" name="status">
            <Radio.Group v-model:value="formData.status">
              <Radio value="active">启用</Radio>
              <Radio value="inactive">停用</Radio>
            </Radio.Group>
          </Form.Item>
        </Tabs.TabPane>

        <!-- Tab 2: Services -->
        <Tabs.TabPane key="services" tab="服务列表">
          <div class="mb-4 flex items-center justify-between">
            <div class="text-sm text-muted-foreground">
              配置插件提供的具体服务接口
            </div>
            <Space>
              <Button @click="simulateScan(false)" :loading="scanning">
                <Icon icon="lucide:scan-search" class="mr-1 size-4" />
                自动扫描服务
              </Button>
              <Button type="dashed" @click="handleAddService">
                <Icon icon="lucide:plus" class="mr-1 size-4" />
                添加服务
              </Button>
            </Space>
          </div>

          <Table
            :data-source="formData.services"
            :columns="serviceColumns"
            size="small"
            :pagination="false"
            row-key="id"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'method'">
                <Tag :color="record.method === 'GET' ? 'blue' : 'green'">
                  {{ record.method }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'action'">
                <Space size="small">
                  <Tooltip title="编辑">
                    <Button
                      type="text"
                      size="small"
                      class="!h-6 !w-6 p-0"
                      @click="handleEditService(record)"
                    >
                      <Icon
                        icon="lucide:edit"
                        class="size-3.5 text-orange-500"
                      />
                    </Button>
                  </Tooltip>
                  <Popconfirm
                    title="确定删除?"
                    @confirm="handleDeleteService(record.id)"
                  >
                    <Tooltip title="删除">
                      <Button
                        type="text"
                        size="small"
                        danger
                        class="!h-6 !w-6 p-0"
                      >
                        <Icon icon="lucide:trash-2" class="size-3.5" />
                      </Button>
                    </Tooltip>
                  </Popconfirm>
                </Space>
              </template>
              <template v-else>
                {{ record[column.dataIndex] }}
              </template>
            </template>
          </Table>

          <div
            v-if="!formData.services?.length"
            class="mt-2 rounded-md border border-dashed bg-gray-50 py-8 text-center text-muted-foreground"
          >
            暂无服务，请点击上方按钮添加或自动扫描
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Form>

    <template #footer>
      <Space class="flex justify-end">
        <Button @click="emit('update:open', false)">取消</Button>
        <Button type="primary" :loading="saving" @click="handleSave">
          保存
        </Button>
      </Space>
    </template>

    <!-- Service Edit Modal -->
    <Modal
      v-model:open="serviceModalOpen"
      :title="isEditingService ? '编辑服务' : '添加服务'"
      width="800px"
      @ok="handleSaveService"
    >
      <Form ref="serviceFormRef" :model="currentService" layout="vertical">
        <Form.Item
          label="相对地址"
          name="relativeUrl"
          :rules="[{ required: true, message: '请输入相对地址' }]"
        >
          <Input
            v-model:value="currentService.relativeUrl"
            placeholder="/api/..."
          />
        </Form.Item>
        <Form.Item
          label="请求方式"
          name="method"
          :rules="[{ required: true, message: '请选择请求方式' }]"
        >
          <Select v-model:value="currentService.method">
            <Select.Option value="GET">GET</Select.Option>
            <Select.Option value="POST">POST</Select.Option>
            <Select.Option value="PUT">PUT</Select.Option>
            <Select.Option value="DELETE">DELETE</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="入参描述" name="description">
          <Input.TextArea
            v-model:value="currentService.description"
            :rows="12"
            placeholder="请输入入参描述 JSON"
          />
        </Form.Item>
        <Form.Item label="返回格式" name="returnType">
          <Input.TextArea
            v-model:value="currentService.returnType"
            :rows="6"
            placeholder="请输入返回格式 JSON"
          />
        </Form.Item>
      </Form>
    </Modal>
  </Drawer>
</template>
