<script setup lang="ts">
import type { MenuInfo } from 'ant-design-vue/es/menu/src/interface';

import { computed, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  InputNumber,
  Menu,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

// ==================== 类型定义 ====================

interface ModelProvider {
  id: string;
  name: string;
  code: string;
  logo?: string;
  description: string;
  status: 'disabled' | 'enabled';
  createdAt: string;
}

interface AIModel {
  id: string;
  providerId: string;
  providerName: string;
  name: string;
  code: string;
  type: 'chat' | 'completion' | 'embedding' | 'image';
  status: 'disabled' | 'enabled';
  apiEndpoint: string;
  apiKey: string;
  maxTokens: number;
  description: string;
  createdAt: string;
}

// ==================== Mock 数据 ====================

const mockProviders: ModelProvider[] = [
  {
    id: '1',
    name: 'OpenAI',
    code: 'openai',
    description: 'OpenAI 是美国人工智能研究实验室',
    status: 'enabled',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Anthropic',
    code: 'anthropic',
    description: 'Anthropic 是一家致力于 AI 安全的公司',
    status: 'enabled',
    createdAt: '2024-01-16T10:00:00Z',
  },
  {
    id: '3',
    name: 'Google',
    code: 'google',
    description: 'Google 的 AI 模型服务',
    status: 'enabled',
    createdAt: '2024-01-17T10:00:00Z',
  },
  {
    id: '4',
    name: 'Meta',
    code: 'meta',
    description: 'Meta 的开源 LLM 系列',
    status: 'enabled',
    createdAt: '2024-01-18T10:00:00Z',
  },
  {
    id: '5',
    name: '阿里云',
    code: 'aliyun',
    description: '阿里云通义千问系列模型',
    status: 'enabled',
    createdAt: '2024-01-19T10:00:00Z',
  },
];

const mockModels: AIModel[] = [
  // OpenAI 模型
  {
    id: '1',
    providerId: '1',
    providerName: 'OpenAI',
    name: 'GPT-4',
    code: 'gpt-4',
    type: 'chat',
    status: 'enabled',
    apiEndpoint: 'https://api.openai.com/v1',
    apiKey: 'sk-****',
    maxTokens: 8192,
    description: 'OpenAI 最新旗舰模型',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    providerId: '1',
    providerName: 'OpenAI',
    name: 'GPT-3.5 Turbo',
    code: 'gpt-3.5-turbo',
    type: 'chat',
    status: 'enabled',
    apiEndpoint: 'https://api.openai.com/v1',
    apiKey: 'sk-****',
    maxTokens: 4096,
    description: 'OpenAI 经济实惠的模型',
    createdAt: '2024-01-17T10:00:00Z',
  },
  {
    id: '3',
    providerId: '1',
    providerName: 'OpenAI',
    name: 'Text Embedding Ada',
    code: 'text-embedding-ada-002',
    type: 'embedding',
    status: 'enabled',
    apiEndpoint: 'https://api.openai.com/v1',
    apiKey: 'sk-****',
    maxTokens: 8191,
    description: 'OpenAI 文本嵌入模型',
    createdAt: '2024-01-18T10:00:00Z',
  },
  // Anthropic 模型
  {
    id: '4',
    providerId: '2',
    providerName: 'Anthropic',
    name: 'Claude 3 Opus',
    code: 'claude-3-opus',
    type: 'chat',
    status: 'enabled',
    apiEndpoint: 'https://api.anthropic.com/v1',
    apiKey: 'sk-ant-****',
    maxTokens: 200_000,
    description: 'Anthropic 最强大的模型',
    createdAt: '2024-01-16T10:00:00Z',
  },
  {
    id: '5',
    providerId: '2',
    providerName: 'Anthropic',
    name: 'Claude 3 Sonnet',
    code: 'claude-3-sonnet',
    type: 'chat',
    status: 'enabled',
    apiEndpoint: 'https://api.anthropic.com/v1',
    apiKey: 'sk-ant-****',
    maxTokens: 200_000,
    description: 'Anthropic 平衡性能和成本的模型',
    createdAt: '2024-01-19T10:00:00Z',
  },
  // Google 模型
  {
    id: '6',
    providerId: '3',
    providerName: 'Google',
    name: 'Gemini Pro',
    code: 'gemini-pro',
    type: 'chat',
    status: 'enabled',
    apiEndpoint: 'https://generativelanguage.googleapis.com/v1',
    apiKey: '****',
    maxTokens: 91_728,
    description: 'Google 最新的多模态模型',
    createdAt: '2024-01-20T10:00:00Z',
  },
];

// ==================== 状态管理 ====================

const providers = ref<ModelProvider[]>([]);
const models = ref<AIModel[]>([]);
const selectedProviderId = ref<string>('');
const loading = ref(false);

// 厂商相关弹窗
const providerModalVisible = ref(false);
const editingProvider = ref<ModelProvider | null>(null);
const providerFormRef = ref();
const providerFormState = ref({
  name: '',
  code: '',
  description: '',
  status: 'enabled' as 'disabled' | 'enabled',
});

// 模型相关弹窗
const modelModalVisible = ref(false);
const editingModel = ref<AIModel | null>(null);
const modelFormRef = ref();
const modelFormState = ref({
  name: '',
  code: '',
  type: 'chat' as 'chat' | 'completion' | 'embedding' | 'image',
  status: 'enabled' as 'disabled' | 'enabled',
  apiEndpoint: '',
  apiKey: '',
  maxTokens: 4096,
  description: '',
});

// ==================== 计算属性 ====================

const selectedProvider = computed(() => {
  return providers.value.find((p) => p.id === selectedProviderId.value);
});

const filteredModels = computed(() => {
  if (!selectedProviderId.value) return [];
  return models.value.filter((m) => m.providerId === selectedProviderId.value);
});

const providerMenuItems = computed(() => {
  return providers.value.map((provider) => ({
    key: provider.id,
    label: provider.name,
  }));
});

// ==================== 表格列定义 ====================

const modelColumns = [
  {
    title: '模型名称',
    dataIndex: 'name',
    key: 'name',
    width: 180,
  },
  {
    title: '模型编码',
    dataIndex: 'code',
    key: 'code',
    width: 180,
  },
  {
    title: '类型',
    dataIndex: 'type',
    key: 'type',
    width: 120,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'center' as const,
  },
  {
    title: '最大Token',
    dataIndex: 'maxTokens',
    key: 'maxTokens',
    width: 120,
    align: 'right' as const,
  },
  {
    title: 'API地址',
    dataIndex: 'apiEndpoint',
    key: 'apiEndpoint',
    ellipsis: true,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    align: 'center' as const,
    fixed: 'right' as const,
  },
];

const modelTypeMap: Record<string, string> = {
  chat: '对话模型',
  completion: '补全模型',
  embedding: '嵌入模型',
  image: '图像生成',
};

// ==================== 数据加载 ====================

async function loadData() {
  loading.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 300));
    providers.value = mockProviders;
    models.value = mockModels;

    // 默认选中第一个厂商
    if (providers.value.length > 0 && !selectedProviderId.value) {
      selectedProviderId.value = providers.value[0].id;
    }
  } catch {
    message.error('加载数据失败');
  } finally {
    loading.value = false;
  }
}

// ==================== 厂商操作 ====================

function handleSelectProvider({ key }: MenuInfo) {
  selectedProviderId.value = key;
}

function handleAddProvider() {
  editingProvider.value = null;
  providerFormState.value = {
    name: '',
    code: '',
    description: '',
    status: 'enabled',
  };
  providerModalVisible.value = true;
}

function handleEditProvider() {
  if (!selectedProvider.value) return;
  editingProvider.value = selectedProvider.value;
  providerFormState.value = {
    name: selectedProvider.value.name,
    code: selectedProvider.value.code,
    description: selectedProvider.value.description,
    status: selectedProvider.value.status,
  };
  providerModalVisible.value = true;
}

function handleDeleteProvider() {
  if (!selectedProvider.value) return;

  // 检查是否有模型
  const modelCount = models.value.filter(
    (m) => m.providerId === selectedProvider.value!.id,
  ).length;

  Modal.confirm({
    title: '确认删除厂商',
    content: `确定要删除厂商 "${selectedProvider.value.name}" 吗？该厂商下有 ${modelCount} 个模型，删除后模型也会被删除。`,
    onOk: () => {
      const index = providers.value.findIndex(
        (p) => p.id === selectedProvider.value!.id,
      );
      if (index !== -1) {
        providers.value.splice(index, 1);

        // 删除该厂商下的所有模型
        models.value = models.value.filter(
          (m) => m.providerId !== selectedProvider.value!.id,
        );

        // 选中其他厂商
        selectedProviderId.value =
          providers.value.length > 0 ? providers.value[0].id : '';

        message.success('删除成功');
      }
    },
  });
}

function handleSubmitProvider() {
  providerFormRef.value?.validate().then(() => {
    if (editingProvider.value) {
      // 编辑
      const index = providers.value.findIndex(
        (p) => p.id === editingProvider.value!.id,
      );
      if (index !== -1) {
        providers.value[index] = {
          ...providers.value[index],
          ...providerFormState.value,
        };
      }

      // 更新模型的提供商名称
      models.value.forEach((model) => {
        if (model.providerId === editingProvider.value!.id) {
          model.providerName = providerFormState.value.name;
        }
      });

      message.success('更新成功');
    } else {
      // 新增
      const newProvider: ModelProvider = {
        id: String(Date.now()),
        ...providerFormState.value,
        createdAt: new Date().toISOString(),
      };
      providers.value.push(newProvider);
      selectedProviderId.value = newProvider.id;
      message.success('添加成功');
    }
    providerModalVisible.value = false;
  });
}

// ==================== 模型操作 ====================

function handleAddModel() {
  if (!selectedProviderId.value) {
    message.warning('请先选择厂商');
    return;
  }

  editingModel.value = null;
  modelFormState.value = {
    name: '',
    code: '',
    type: 'chat',
    status: 'enabled',
    apiEndpoint: '',
    apiKey: '',
    maxTokens: 4096,
    description: '',
  };
  modelModalVisible.value = true;
}

function handleEditModel(record: AIModel) {
  editingModel.value = record;
  modelFormState.value = {
    name: record.name,
    code: record.code,
    type: record.type,
    status: record.status,
    apiEndpoint: record.apiEndpoint,
    apiKey: record.apiKey,
    maxTokens: record.maxTokens,
    description: record.description,
  };
  modelModalVisible.value = true;
}

function handleDeleteModel(record: AIModel) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除模型 "${record.name}" 吗？`,
    onOk: () => {
      const index = models.value.findIndex((m) => m.id === record.id);
      if (index !== -1) {
        models.value.splice(index, 1);
        message.success('删除成功');
      }
    },
  });
}

function handleSubmitModel() {
  modelFormRef.value?.validate().then(() => {
    const provider = selectedProvider.value;
    if (!provider) return;

    if (editingModel.value) {
      // 编辑
      const index = models.value.findIndex(
        (m) => m.id === editingModel.value!.id,
      );
      if (index !== -1) {
        models.value[index] = {
          ...models.value[index],
          ...modelFormState.value,
        };
      }
      message.success('更新成功');
    } else {
      // 新增
      const newModel: AIModel = {
        id: String(Date.now()),
        providerId: provider.id,
        providerName: provider.name,
        ...modelFormState.value,
        createdAt: new Date().toISOString(),
      };
      models.value.push(newModel);
      message.success('添加成功');
    }
    modelModalVisible.value = false;
  });
}

function handleCancelProvider() {
  providerModalVisible.value = false;
  providerFormRef.value?.resetFields();
}

function handleCancelModel() {
  modelModalVisible.value = false;
  modelFormRef.value?.resetFields();
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="flex h-full gap-4 p-4">
    <!-- 左侧厂商列表 -->
    <Card class="w-72 flex-shrink-0" :body-style="{ padding: 0 }">
      <template #title>
        <div class="flex items-center justify-between">
          <span>模型厂商</span>
          <Button type="primary" size="small" @click="handleAddProvider">
            <Icon icon="lucide:plus" class="size-4" />
          </Button>
        </div>
      </template>

      <div class="max-h-[calc(100vh-180px)] overflow-y-auto">
        <Menu
          :selected-keys="[selectedProviderId]"
          :items="providerMenuItems"
          mode="inline"
          :selectable="true"
          @select="handleSelectProvider"
        >
          <template #item="{ label, key }">
            <div class="flex items-center justify-between pr-2">
              <span>{{ label }}</span>
              <Space :size="4">
                <Button
                  v-if="key === selectedProviderId"
                  type="text"
                  size="small"
                  class="!text-blue-500"
                  @click.stop="handleEditProvider"
                >
                  <Icon icon="lucide:edit-2" class="size-3" />
                </Button>
                <Popconfirm
                  v-if="key === selectedProviderId"
                  title="确定删除此厂商吗?"
                  @confirm.stop="handleDeleteProvider"
                >
                  <Button type="text" size="small" danger @click.stop>
                    <Icon icon="lucide:trash-2" class="size-3" />
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          </template>
        </Menu>

        <div
          v-if="providers.length === 0"
          class="flex min-h-[200px] items-center justify-center p-4"
        >
          <Empty description="暂无厂商" />
        </div>
      </div>
    </Card>

    <!-- 右侧模型列表 -->
    <Card class="flex-1">
      <template #title>
        <div class="flex items-center justify-between">
          <span>
            {{ selectedProvider?.name || '模型列表' }}
            <span
              v-if="selectedProvider"
              class="ml-2 text-sm font-normal text-gray-500"
            >
              ({{ filteredModels.length }} 个模型)
            </span>
          </span>
          <Button
            v-if="selectedProvider"
            type="primary"
            :disabled="!selectedProviderId"
            @click="handleAddModel"
          >
            <Icon icon="lucide:plus" class="mr-1 size-4" />
            添加模型
          </Button>
        </div>
      </template>

      <div v-if="selectedProvider" class="mb-4 rounded-lg bg-gray-50 p-3">
        <div class="text-sm">
          <div class="mb-1 flex items-center gap-2">
            <span class="font-semibold text-gray-700">厂商编码：</span>
            <Tag>{{ selectedProvider.code }}</Tag>
          </div>
          <div class="mb-1 flex items-center gap-2">
            <span class="font-semibold text-gray-700">状态：</span>
            <Tag
              :color="
                selectedProvider.status === 'enabled' ? 'success' : 'default'
              "
            >
              {{ selectedProvider.status === 'enabled' ? '启用' : '禁用' }}
            </Tag>
          </div>
          <div v-if="selectedProvider.description" class="text-gray-600">
            {{ selectedProvider.description }}
          </div>
        </div>
      </div>

      <div
        v-if="!selectedProviderId"
        class="flex min-h-[400px] items-center justify-center"
      >
        <Empty description="请选择左侧厂商查看模型" />
      </div>

      <Table
        v-else
        :columns="modelColumns"
        :data-source="filteredModels"
        :loading="loading"
        :pagination="{ pageSize: 10 }"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <Tag color="blue">
              {{ modelTypeMap[record.type] || record.type }}
            </Tag>
          </template>

          <template v-if="column.key === 'status'">
            <Tag :color="record.status === 'enabled' ? 'success' : 'default'">
              {{ record.status === 'enabled' ? '启用' : '禁用' }}
            </Tag>
          </template>

          <template v-if="column.key === 'action'">
            <Space size="small">
              <Button type="link" size="small" @click="handleEditModel(record)">
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                danger
                @click="handleDeleteModel(record)"
              >
                删除
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 新增/编辑厂商弹窗 -->
    <Modal
      v-model:open="providerModalVisible"
      :title="editingProvider ? '编辑厂商' : '添加厂商'"
      @ok="handleSubmitProvider"
      @cancel="handleCancelProvider"
    >
      <Form
        ref="providerFormRef"
        :model="providerFormState"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <Form.Item
          label="厂商名称"
          name="name"
          required
          :rules="[{ required: true, message: '请输入厂商名称' }]"
        >
          <Input
            v-model:value="providerFormState.name"
            placeholder="例如：OpenAI"
          />
        </Form.Item>

        <Form.Item
          label="厂商编码"
          name="code"
          required
          :rules="[{ required: true, message: '请输入厂商编码' }]"
        >
          <Input
            v-model:value="providerFormState.code"
            placeholder="例如：openai"
          />
        </Form.Item>

        <Form.Item label="描述" name="description">
          <Input.TextArea
            v-model:value="providerFormState.description"
            :rows="3"
            placeholder="请输入厂商描述"
          />
        </Form.Item>

        <Form.Item label="状态" name="status" required>
          <Select v-model:value="providerFormState.status">
            <Select.Option value="enabled">启用</Select.Option>
            <Select.Option value="disabled">禁用</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>

    <!-- 新增/编辑模型弹窗 -->
    <Modal
      v-model:open="modelModalVisible"
      :title="editingModel ? '编辑模型' : '添加模型'"
      width="600px"
      @ok="handleSubmitModel"
      @cancel="handleCancelModel"
    >
      <Form
        ref="modelFormRef"
        :model="modelFormState"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <Form.Item
          label="模型名称"
          name="name"
          required
          :rules="[{ required: true, message: '请输入模型名称' }]"
        >
          <Input
            v-model:value="modelFormState.name"
            placeholder="例如：GPT-4"
          />
        </Form.Item>

        <Form.Item
          label="模型编码"
          name="code"
          required
          :rules="[{ required: true, message: '请输入模型编码' }]"
        >
          <Input
            v-model:value="modelFormState.code"
            placeholder="例如：gpt-4"
          />
        </Form.Item>

        <Form.Item label="类型" name="type" required>
          <Select v-model:value="modelFormState.type">
            <Select.Option value="chat">对话模型</Select.Option>
            <Select.Option value="completion">补全模型</Select.Option>
            <Select.Option value="embedding">嵌入模型</Select.Option>
            <Select.Option value="image">图像生成</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="API地址"
          name="apiEndpoint"
          required
          :rules="[{ required: true, message: '请输入API地址' }]"
        >
          <Input
            v-model:value="modelFormState.apiEndpoint"
            placeholder="https://api.openai.com/v1"
          />
        </Form.Item>

        <Form.Item
          label="API密钥"
          name="apiKey"
          required
          :rules="[{ required: true, message: '请输入API密钥' }]"
        >
          <Input.Password
            v-model:value="modelFormState.apiKey"
            placeholder="请输入API密钥"
          />
        </Form.Item>

        <Form.Item
          label="最大Token"
          name="maxTokens"
          required
          :rules="[{ required: true, message: '请输入最大Token数' }]"
        >
          <InputNumber
            v-model:value="modelFormState.maxTokens"
            :min="1"
            style="width: 100%"
          />
        </Form.Item>

        <Form.Item label="状态" name="status" required>
          <Select v-model:value="modelFormState.status">
            <Select.Option value="enabled">启用</Select.Option>
            <Select.Option value="disabled">禁用</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="描述" name="description">
          <Input.TextArea
            v-model:value="modelFormState.description"
            :rows="3"
            placeholder="请输入模型描述"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>
