<script setup lang="ts">
import type { AiInputConfig, AiServiceDef, ApiKeyDef } from '#/types/aiservice';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { useClipboard } from '@vueuse/core';
import {
  Button,
  Collapse,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import {
  getAiModelsApi,
  getAiServiceApi,
  getAiTagsApi,
  getApiKeysApi,
  saveAiServiceApi,
} from '#/api/aiservice';

const props = defineProps<{
  id?: string;
  open: boolean;
}>();

const emit = defineEmits(['update:open', 'success']);

const loading = ref(false);
const isUpdate = computed(() => !!props.id);
const title = computed(() =>
  isUpdate.value ? '编辑 AI 服务' : '新建 AI 服务',
);

// Data Models
const formState = ref<Partial<AiServiceDef>>({
  executionMode: 'CHAT',
  outputType: 'JSON',
  isActive: true,
  isRouteEnabled: false,
  routeMode: 'CODE',
  intentPrompt: '',
  routes: [],
  modelConfig: {
    provider: 'OpenAI',
    model: 'gpt-3.5-turbo',
    temperature: 0.7,
    topP: 1,
  },
  inputSchema: [],
  systemPrompt: '',
});

// UI State for routing
const activeRouteIndex = ref(-1); // -1 means main service prompt, >=0 means specific route
const currentSystemPrompt = computed({
  get: () => {
    if (
      formState.value.isRouteEnabled &&
      activeRouteIndex.value >= 0 &&
      formState.value.routes
    ) {
      return formState.value.routes[activeRouteIndex.value].systemPrompt || '';
    }
    return formState.value.systemPrompt || '';
  },
  set: (val: string) => {
    if (
      formState.value.isRouteEnabled &&
      activeRouteIndex.value >= 0 &&
      formState.value.routes
    ) {
      formState.value.routes[activeRouteIndex.value].systemPrompt = val;
    } else {
      formState.value.systemPrompt = val;
    }
  },
});

const models = ref<any[]>([]); // Grouped options
const apiKeys = ref<ApiKeyDef[]>([]);
const tagOptions = ref<{ label: string; value: string }[]>([]);
const activeTab = ref('config'); // config | test

const { copy } = useClipboard({ legacy: true });

function handleCopy(text?: string) {
  if (!text) return;
  copy(text);
  message.success('已复制到剪贴板');
}

// Fetch Models
const initModels = async () => {
  const res = await getAiModelsApi();
  const rawModels = res.data;

  // Group by provider
  const groups: Record<string, any[]> = {};
  rawModels.forEach((m) => {
    if (!groups[m.provider]) {
      groups[m.provider] = [];
    }
    groups[m.provider].push({ label: m.name, value: m.code });
  });

  models.value = Object.keys(groups).map((provider) => ({
    label: provider,
    options: groups[provider],
  }));
};

const initKeys = async () => {
  const res = await getApiKeysApi();
  apiKeys.value = res.data;
};

const initTags = async () => {
  const res = await getAiTagsApi();
  tagOptions.value = res.data.map((t) => ({ label: t, value: t }));
};

// Watch ID to load data
watch(
  () => props.open,
  async (val) => {
    if (val) {
      initModels();
      initKeys();
      initTags();
      if (props.id) {
        loading.value = true;
        try {
          const res = await getAiServiceApi(props.id);
          formState.value = res.data;
        } finally {
          loading.value = false;
        }
      } else {
        formState.value = {
          serviceName: '',
          serviceCode: `SVC_${Date.now()}`,
          executionMode: 'CHAT',
          outputType: 'JSON',
          isActive: true,
          isRouteEnabled: false,
          routeMode: 'CODE',
          intentPrompt: '',
          routes: [],
          modelConfig: {
            provider: 'OpenAI',
            model: 'gpt-3.5-turbo',
            temperature: 0.7,
            topP: 1,
          },
          inputSchema: [],
          systemPrompt: '',
        };
      }

      // Reset active route
      activeRouteIndex.value =
        formState.value.isRouteEnabled &&
        formState.value.routes &&
        formState.value.routes.length > 0
          ? 0
          : -1;
    }
  },
);

// --- Input Schema Builder ---
const inputTypes = [
  { label: '文本 (String)', value: 'string' },
  { label: '数字 (Number)', value: 'number' },
  { label: '布尔 (Boolean)', value: 'boolean' },
];

const uiTypes = [
  { label: '单行输入 (Input)', value: 'input' },
  { label: '多行文本 (Textarea)', value: 'textarea' },
  { label: '选择器 (Select)', value: 'select' },
  { label: '开关 (Switch)', value: 'switch' },
];

const newInput = ref<Partial<AiInputConfig>>({
  name: '',
  type: 'string',
  desc: '',
  ui: 'input',
});

function addInput() {
  if (!newInput.value.name) return message.warning('请输入参数名');
  if (!formState.value.inputSchema) formState.value.inputSchema = [];

  // Check duplicate
  if (formState.value.inputSchema.some((i) => i.name === newInput.value.name)) {
    return message.warning('参数名已存在');
  }

  formState.value.inputSchema.push({ ...newInput.value } as AiInputConfig);
  newInput.value = { name: '', type: 'string', desc: '', ui: 'input' }; // Reset
}

function removeInput(index: number) {
  formState.value.inputSchema?.splice(index, 1);
}

// --- Prompt Engineering ---
function insertVariable(name: string) {
  formState.value.systemPrompt += `{{${name}}}`;
}

// --- Test Area ---
const testApiKey = ref('');
const testInputs = ref<Record<string, any>>({});
const testResult = ref<string>('');
const testLoading = ref(false);
const testMetrics = ref({ tokens: 0, time: 0 });

// --- Route Management ---
const newRoute = ref({ code: '', name: '' });

function addRoute() {
  if (!newRoute.value.code || !newRoute.value.name) {
    return message.warning('请填写完整的路由编码和名称');
  }
  if (!formState.value.routes) formState.value.routes = [];
  if (formState.value.routes.some((r) => r.routeCode === newRoute.value.code)) {
    return message.warning('路由编码已存在');
  }
  formState.value.routes.push({
    routeCode: newRoute.value.code,
    routeName: newRoute.value.name,
    systemPrompt: '',
    isActive: true,
  });
  newRoute.value = { code: '', name: '' };
  activeRouteIndex.value = formState.value.routes.length - 1;
  message.success('已添加新路由');
}

function removeRoute(index: number) {
  if (!formState.value.routes) return;
  formState.value.routes.splice(index, 1);
  if (activeRouteIndex.value >= formState.value.routes.length) {
    activeRouteIndex.value = formState.value.routes.length - 1;
  }
}

// Watch changes to trigger auto-save simulation
watch(activeRouteIndex, (newVal, oldVal) => {
  // In a real app we might debounce an API save here,
  // but since it's local reactive state we just give visual feedback.
  if (oldVal !== newVal && newVal >= -1) {
    message.success('已切换提示词上下文');
  }
});

watch(
  () => formState.value.isRouteEnabled,
  (val) => {
    activeRouteIndex.value =
      val && formState.value.routes && formState.value.routes.length > 0
        ? 0
        : -1;
  },
);

const renderedPrompt = computed(() => {
  let prompt = currentSystemPrompt.value || '';
  if (formState.value.inputSchema) {
    for (const input of formState.value.inputSchema) {
      const val = testInputs.value[input.name];
      prompt = prompt.replaceAll(
        new RegExp(`{{${input.name}}}`, 'g'),
        val || `[${input.name}]`,
      );
    }
  }
  return prompt;
});

const showRenderedPrompt = ref(false);

async function runTest() {
  if (!testApiKey.value) return message.error('请配置 API Key');
  testLoading.value = true;
  testResult.value = '';

  // Mock Execution
  setTimeout(() => {
    testLoading.value = false;
    testMetrics.value = {
      tokens: Math.floor(Math.random() * 500) + 50,
      time: Math.floor(Math.random() * 2000) + 500,
    };

    testResult.value =
      formState.value.outputType === 'JSON'
        ? JSON.stringify(
            {
              result: 'Success',
              data: {
                summary: 'This is a mock JSON response.',
                inputs: testInputs.value,
              },
            },
            null,
            2,
          )
        : `# Mock Result\n\nBased on your input:\n> ${JSON.stringify(testInputs.value)}\n\nHere is the generated content mock.`;
  }, 1500);
}

// --- Actions ---
async function handleSave() {
  if (!formState.value.serviceName) return message.warning('请输入服务名称');
  try {
    loading.value = true;
    await saveAiServiceApi(formState.value as AiServiceDef);
    message.success('保存成功');
    emit('success');
    handleClose();
  } catch (error: any) {
    message.error(error.message);
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit('update:open', false);
}

// Helper
const getInputLabel = () => {
  return formState.value.inputSchema?.map((i) => i.name) || [];
};
</script>

<template>
  <Drawer
    :open="open"
    :title="title"
    width="90%"
    @close="handleClose"
    :mask-closable="false"
    placement="right"
    :body-style="{ padding: 0, height: '100%', overflow: 'hidden' }"
    :header-style="{ display: 'none' }"
  >
    <div class="relative flex h-full flex-col bg-slate-50">
      <!-- Header (Custom Sticky Glass) -->
      <div
        class="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-gray-100 bg-white/80 px-6 backdrop-blur-md"
      >
        <div class="flex items-center gap-4">
          <div class="rounded-lg bg-blue-50 p-2 text-blue-600">
            <Icon
              :icon="isUpdate ? 'lucide:edit-3' : 'lucide:plus'"
              class="size-5"
            />
          </div>
          <div class="flex flex-col">
            <h2 class="text-base font-bold leading-tight text-gray-800">
              {{ title }}
            </h2>
            <span class="text-xs text-gray-400">配置并测试您的 AI 服务</span>
          </div>
          <div class="mx-2 h-6 w-px bg-gray-200"></div>
          <div class="flex items-center gap-2">
            <span
              class="flex h-2 w-2 rounded-full"
              :class="formState.isActive ? 'bg-green-500' : 'bg-gray-300'"
            ></span>
            <span
              class="text-xs font-medium"
              :class="formState.isActive ? 'text-green-600' : 'text-gray-400'"
              >{{ formState.isActive ? '已启用' : '已禁用' }}</span
            >
          </div>
        </div>
        <Space>
          <Button
            @click="handleClose"
            class="!border-gray-200 !text-gray-500 hover:!border-gray-300"
          >
            取消
          </Button>
          <Button
            type="primary"
            :loading="loading"
            @click="handleSave"
            class="border-none bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            <Icon icon="lucide:save" class="mr-1 size-4" /> 保存配置
          </Button>
        </Space>
      </div>

      <!-- Main 3-Column Layout -->
      <div class="grid flex-1 grid-cols-12 gap-0 overflow-hidden">
        <!-- COLUMN 1: Basic Config (Left) -->
        <div
          class="col-span-3 flex flex-col overflow-y-auto border-r border-gray-100 bg-white"
        >
          <div class="p-5">
            <h3
              class="mb-6 flex items-center text-sm font-bold uppercase tracking-wider text-gray-800"
            >
              <Icon
                icon="lucide:settings-2"
                class="mr-2 size-4 text-gray-400"
              />
              基础配置
            </h3>
            <Form layout="vertical" :model="formState" class="space-y-4">
              <Form.Item label="服务名称" required class="!mb-2">
                <Input
                  v-model:value="formState.serviceName"
                  placeholder="给服务起个好名字"
                  class="rounded-lg !border-transparent !bg-gray-50 transition-all hover:!border-blue-200 hover:!bg-white focus:!border-blue-500 focus:!bg-white"
                />
              </Form.Item>
              <Form.Item label="服务编码" class="!mb-2">
                <Space.Compact style="width: 100%">
                  <Input
                    v-model:value="formState.serviceCode"
                    :disabled="!!props.id"
                    class="rounded-l-lg !border-transparent !bg-gray-50 !text-gray-500"
                    style="width: calc(100% - 36px)"
                  />
                  <Tooltip title="复制">
                    <Button
                      @click="handleCopy(formState.serviceCode)"
                      class="rounded-r-lg !border-transparent !bg-gray-100 !text-gray-500 hover:!bg-gray-200"
                      style="width: 36px"
                    >
                      <template #icon>
                        <Icon icon="lucide:copy" class="size-4" />
                      </template>
                    </Button>
                  </Tooltip>
                </Space.Compact>
              </Form.Item>

              <div class="grid grid-cols-2 gap-4">
                <Form.Item label="服务类型" class="!mb-2">
                  <Select
                    v-model:value="formState.executionMode"
                    class="!bg-transparent"
                    :bordered="false"
                    :options="[
                      { label: '通用服务', value: 'CHAT' },
                      { label: '智能审核', value: 'AUDIT' },
                    ]"
                  >
                    <template #suffixIcon>
                      <Icon
                        icon="lucide:chevron-down"
                        class="size-4 text-gray-400"
                      />
                    </template>
                  </Select>
                </Form.Item>
                <Form.Item label="返回值" class="!mb-2">
                  <Select
                    v-model:value="formState.outputType"
                    :bordered="false"
                    :options="[
                      { label: 'JSON', value: 'JSON' },
                      { label: 'Markdown', value: 'MARKDOWN' },
                      { label: '纯文本', value: 'TEXT' },
                    ]"
                  >
                    <template #suffixIcon>
                      <Icon
                        icon="lucide:chevron-down"
                        class="size-4 text-gray-400"
                      />
                    </template>
                  </Select>
                </Form.Item>
              </div>

              <Form.Item label="服务标签" class="!mb-4">
                <Select
                  v-model:value="formState.tags"
                  mode="tags"
                  placeholder="+ 添加标签"
                  :options="tagOptions"
                  :bordered="false"
                  class="rounded-lg border border-transparent bg-gray-50 transition-all hover:border-blue-200 hover:bg-white"
                />
              </Form.Item>

              <div
                class="rounded-xl border border-blue-100/50 bg-blue-50/50 p-4"
              >
                <Form.Item label="选择模型" class="!mb-3 font-semibold">
                  <Select
                    v-model:value="formState.modelConfig!.model"
                    :options="models"
                    placeholder="选择 AI 模型"
                    :bordered="false"
                    class="rounded-lg !bg-white shadow-sm"
                  />
                </Form.Item>
                <Collapse ghost size="small">
                  <Collapse.Panel key="1" header="高级参数">
                    <Form.Item label="随机性 (Temp)" class="!mb-2">
                      <div class="flex items-center gap-2">
                        <InputNumber
                          v-model:value="formState.modelConfig!.temperature"
                          :min="0"
                          :max="2"
                          :step="0.1"
                          class="!w-16 rounded-md !border-transparent !bg-white shadow-sm"
                          :bordered="false"
                        />
                      </div>
                    </Form.Item>
                    <Form.Item label="核采样 (Top P)" class="!mb-0">
                      <InputNumber
                        v-model:value="formState.modelConfig!.topP"
                        :min="0"
                        :max="1"
                        :step="0.1"
                        class="!w-16 rounded-md !border-transparent !bg-white shadow-sm"
                        :bordered="false"
                      />
                    </Form.Item>
                  </Collapse.Panel>
                </Collapse>
              </div>

              <div
                class="mt-4 rounded-xl border border-indigo-100/50 bg-indigo-50/50 p-4"
              >
                <Form.Item label="多意图(路由)" class="!mb-0 font-semibold">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-normal text-indigo-500"
                      >支持根据路由返回不同提示词</span
                    >
                    <Switch v-model:checked="formState.isRouteEnabled" />
                  </div>
                </Form.Item>
                <div
                  v-if="formState.isRouteEnabled"
                  class="mt-4 space-y-3 border-t border-indigo-100/50 pt-4"
                >
                  <Form.Item label="意图方式" class="!mb-2">
                    <Radio.Group
                      v-model:value="formState.routeMode"
                      option-type="button"
                      button-style="solid"
                      class="flex w-full"
                    >
                      <Radio.Button value="CODE" class="flex-1 text-center">
                        编码路由
                      </Radio.Button>
                      <Radio.Button value="INTENT" class="flex-1 text-center">
                        AI 意图
                      </Radio.Button>
                    </Radio.Group>
                  </Form.Item>
                  <Form.Item
                    v-if="formState.routeMode === 'INTENT'"
                    label="意图识别提示词"
                    class="!mb-0"
                  >
                    <Input.TextArea
                      v-model:value="formState.intentPrompt"
                      :rows="3"
                      placeholder="用于让模型区分出路由编码的基础提示词..."
                      class="!bg-white !text-sm"
                    />
                    <div class="mt-1 text-[10px] leading-tight text-gray-400">
                      系统将在末尾自动拼接路由配置描述
                    </div>
                  </Form.Item>
                </div>
              </div>

              <Form.Item label="状态" class="!mt-4">
                <div
                  class="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
                >
                  <span class="text-sm text-gray-500">启用服务</span>
                  <Switch v-model:checked="formState.isActive" />
                </div>
              </Form.Item>
            </Form>

            <div class="mt-8">
              <div class="mb-4 flex items-center justify-between">
                <h3
                  class="flex items-center text-sm font-bold uppercase tracking-wider text-gray-800"
                >
                  <Icon
                    icon="lucide:list-tree"
                    class="mr-2 size-4 text-gray-400"
                  />
                  入参定义
                </h3>
              </div>

              <div class="space-y-3">
                <div
                  v-for="(item, idx) in formState.inputSchema"
                  :key="idx"
                  class="group relative rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
                >
                  <div class="flex items-start justify-between">
                    <div class="flex flex-col">
                      <span class="font-mono text-sm font-bold text-gray-700">{{
                        item.name
                      }}</span>
                      <span class="text-xs text-gray-400">{{
                        item.desc || 'No description'
                      }}</span>
                    </div>
                    <button
                      class="p-1 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                      @click="removeInput(idx)"
                    >
                      <Icon icon="lucide:x" class="size-3.5" />
                    </button>
                  </div>
                  <div class="mt-2 flex gap-2">
                    <span
                      class="rounded border border-gray-200 bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500"
                      >{{ item.type }}</span
                    >
                    <span
                      class="rounded border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-600"
                      >{{ item.ui }}</span
                    >
                  </div>
                </div>

                <!-- Add New Input -->
                <div
                  class="rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/80 p-3 transition-all hover:border-blue-300 hover:bg-blue-50/30"
                >
                  <div class="space-y-2">
                    <Input
                      v-model:value="newInput.name"
                      placeholder="参数名 (key)"
                      size="small"
                      class="!bg-white"
                    />
                    <Input
                      v-model:value="newInput.desc"
                      placeholder="描述"
                      size="small"
                      class="!bg-white"
                    />
                    <div class="flex gap-2">
                      <Select
                        v-model:value="newInput.type"
                        size="small"
                        class="flex-1"
                        :options="inputTypes"
                      />
                      <Select
                        v-model:value="newInput.ui"
                        size="small"
                        class="flex-1"
                        :options="uiTypes"
                      />
                    </div>
                    <Button
                      type="dashed"
                      block
                      size="small"
                      @click="addInput"
                      class="!border-blue-200 !bg-white !text-blue-500 hover:!border-blue-400"
                    >
                      <Icon icon="lucide:plus" class="mr-1 size-3" /> 添加参数
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMN 2: Prompt Engineering (Middle) -->
        <div
          class="col-span-5 flex flex-col border-r border-gray-100 bg-slate-50/50"
        >
          <!-- Toolbar -->
          <div
            class="flex h-12 items-center justify-between border-b border-gray-100 bg-white/50 px-4"
          >
            <div class="flex items-center gap-2">
              <Icon icon="lucide:sparkles" class="size-4 text-amber-500" />
              <span class="text-sm font-bold text-gray-700">提示词编排</span>
            </div>
            <div class="flex items-center gap-2">
              <Tooltip title="AI 自动优化提示词">
                <button
                  class="rounded-md p-1.5 text-amber-500 transition-colors hover:bg-amber-50"
                >
                  <Icon icon="lucide:wand-2" class="size-4" />
                </button>
              </Tooltip>
              <div class="h-4 w-px bg-gray-200"></div>
              <div class="flex items-center gap-1.5">
                <span
                  class="text-xs text-gray-400"
                  :class="{ 'font-medium text-blue-600': !showRenderedPrompt }"
                  >Code</span
                >
                <Switch v-model:checked="showRenderedPrompt" size="small" />
                <span
                  class="text-xs text-gray-400"
                  :class="{ 'font-medium text-blue-600': showRenderedPrompt }"
                  >Preview</span
                >
              </div>
            </div>
          </div>

          <div class="flex flex-1 flex-col gap-3 overflow-hidden p-4">
            <!-- Route Selection Header (When Enabled) -->
            <div
              v-if="formState.isRouteEnabled"
              class="rounded-lg border border-indigo-100 bg-indigo-50 p-3"
            >
              <div class="mb-2 flex items-center justify-between">
                <span class="text-xs font-bold text-indigo-700"
                  >路由提示词管理</span
                >
                <div class="flex items-center gap-2">
                  <Input
                    size="small"
                    v-model:value="newRoute.code"
                    placeholder="路由编码 (e.g. PRODUCT)"
                    class="!w-36"
                  />
                  <Input
                    size="small"
                    v-model:value="newRoute.name"
                    placeholder="名称描述"
                    class="!w-32"
                  />
                  <Button
                    size="small"
                    type="primary"
                    class="border-none bg-indigo-500 hover:bg-indigo-400"
                    @click="addRoute"
                  >
                    添加
                  </Button>
                </div>
              </div>

              <div
                class="mt-3 flex max-h-32 flex-col gap-2 overflow-y-auto pr-1"
              >
                <div
                  v-if="!formState.routes || formState.routes.length === 0"
                  class="py-2 text-center text-xs text-indigo-300"
                >
                  暂无路由，请先添加
                </div>
                <div
                  v-for="(r, idx) in formState.routes"
                  :key="idx"
                  class="group flex cursor-pointer items-center justify-between rounded-md border p-2 transition-all"
                  :class="
                    activeRouteIndex === idx
                      ? 'border-indigo-300 bg-white shadow-sm ring-1 ring-indigo-200'
                      : 'border-transparent bg-transparent hover:bg-indigo-100'
                  "
                  @click="activeRouteIndex = idx"
                >
                  <div class="flex items-center gap-2">
                    <div
                      class="h-2 w-2 rounded-full"
                      :class="
                        activeRouteIndex === idx
                          ? 'bg-indigo-500'
                          : 'bg-transparent'
                      "
                    ></div>
                    <span
                      class="font-mono text-xs font-bold"
                      :class="
                        activeRouteIndex === idx
                          ? 'text-indigo-700'
                          : 'text-slate-600'
                      "
                      >{{ r.routeCode }}</span
                    >
                    <span class="text-xs text-slate-400"
                      >- {{ r.routeName }}</span
                    >
                  </div>
                  <Icon
                    icon="lucide:trash-2"
                    class="size-3.5 text-red-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                    @click.stop="removeRoute(idx)"
                  />
                </div>
              </div>
            </div>

            <!-- Variables Bar -->
            <div
              class="flex shrink-0 flex-wrap gap-2 rounded-lg border border-gray-100 bg-white p-2 shadow-sm"
            >
              <span class="mr-1 self-center text-xs text-gray-400"
                >插入变量:</span
              >
              <span
                v-for="key in getInputLabel()"
                :key="key"
                @click="insertVariable(key)"
                class="cursor-pointer select-none rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-600 transition-all hover:scale-105 hover:bg-blue-100"
              >
                {{ key }}
              </span>
              <span
                @click="insertVariable('current_time')"
                class="cursor-pointer rounded-full border border-purple-100 bg-purple-50 px-2 py-0.5 font-mono text-xs text-purple-600 transition-all hover:bg-purple-100"
                >current_time</span
              >
            </div>

            <!-- Editor Area -->
            <div
              class="group relative flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-inner transition-all focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20"
            >
              <div
                v-if="formState.isRouteEnabled && activeRouteIndex < 0"
                class="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-100/80 text-slate-500 backdrop-blur-sm"
              >
                <Icon icon="lucide:route" class="mb-2 size-8 opacity-50" />
                <span class="text-sm font-medium"
                  >请选择上方的一个路由以编辑其专属提示词</span
                >
              </div>

              <textarea
                v-if="!showRenderedPrompt"
                v-model="currentSystemPrompt"
                class="h-full w-full resize-none bg-slate-900 p-4 font-mono text-sm leading-relaxed text-blue-100 placeholder-slate-600 focus:outline-none"
                placeholder="// 在此编写您的 System Prompt..."
                spellcheck="false"
              ></textarea>

              <div
                v-else
                class="h-full w-full overflow-auto whitespace-pre-wrap bg-gray-50 p-4 font-mono text-sm leading-relaxed text-gray-800"
              >
                {{ renderedPrompt }}
              </div>

              <div
                class="flex h-6 shrink-0 select-none items-center justify-end gap-3 border-t border-slate-700 bg-slate-800 px-2 text-[10px] text-slate-400"
              >
                <span
                  v-if="
                    formState.isRouteEnabled &&
                    activeRouteIndex >= 0 &&
                    formState.routes
                  "
                  class="mr-auto flex items-center gap-1 text-indigo-300"
                  ><Icon icon="lucide:route" class="size-3" /> 编辑路由:
                  {{ formState.routes[activeRouteIndex]?.routeCode }}</span
                >
                <span>Space: 2</span>
                <span>UTF-8</span>
                <span>Markdown</span>
              </div>
            </div>
          </div>
        </div>

        <!-- COLUMN 3: Test Playground (Right) -->
        <div class="col-span-4 flex flex-col bg-white">
          <div
            class="flex h-12 items-center justify-between border-b border-gray-100 bg-gray-50/30 px-4"
          >
            <div class="flex items-center gap-2">
              <Icon icon="lucide:flask-conical" class="size-4 text-green-600" />
              <span class="text-sm font-bold text-gray-700">测试运行</span>
            </div>
            <Tag
              v-if="testApiKey"
              color="success"
              class="mr-0 border-0 bg-green-100/50 text-green-700"
            >
              Key 已配置
            </Tag>
            <Tag
              v-else
              color="warning"
              class="mr-0 border-0 bg-orange-100/50 text-orange-700"
            >
              未配置 Key
            </Tag>
          </div>

          <div class="flex flex-1 flex-col gap-4 overflow-hidden p-4">
            <!-- API Key Config Selection -->
            <Select
              v-model:value="testApiKey"
              placeholder="选择 API Key"
              :options="apiKeys"
              :bordered="false"
              class="w-full rounded-lg border border-gray-100 bg-gray-50"
            >
              <template #option="{ label, value }">
                <div class="flex items-center justify-between text-xs">
                  <span class="font-medium">{{ label }}</span>
                  <span class="font-mono text-gray-400"
                    >{{ value.substring(0, 8) }}...</span
                  >
                </div>
              </template>
            </Select>

            <!-- Dynamic Input Form -->
            <div
              class="flex-1 overflow-y-auto rounded-xl border border-gray-100 bg-slate-50 p-4 shadow-inner"
            >
              <div
                v-if="!formState.inputSchema?.length"
                class="flex h-full flex-col items-center justify-center gap-2 text-gray-300"
              >
                <Icon icon="lucide:layout-template" class="size-8" />
                <span class="text-xs">请先在左侧配置入参</span>
              </div>
              <Form layout="vertical" v-else class="space-y-3">
                <Form.Item
                  v-for="input in formState.inputSchema"
                  :key="input.name"
                  :label="input.name"
                  class="!mb-0"
                >
                  <Input
                    v-if="input.ui === 'input'"
                    v-model:value="testInputs[input.name]"
                    class="!bg-white"
                    :placeholder="input.desc"
                  />
                  <Input.TextArea
                    v-else-if="input.ui === 'textarea'"
                    v-model:value="testInputs[input.name]"
                    :rows="3"
                    class="!bg-white"
                    :placeholder="input.desc"
                  />
                  <Switch
                    v-else-if="input.ui === 'switch'"
                    v-model:checked="testInputs[input.name]"
                  />
                  <Select
                    v-else-if="input.ui === 'select'"
                    v-model:value="testInputs[input.name]"
                    class="!bg-white"
                    :options="
                      (input.options || []).map((o) => ({ label: o, value: o }))
                    "
                  />
                </Form.Item>
              </Form>
            </div>

            <!-- Action Bar -->
            <div class="flex items-center justify-between bg-white p-1">
              <div class="flex flex-col text-[10px] text-gray-400">
                <span>Tokens: ~{{ testResult ? testMetrics.tokens : 0 }}</span>
                <span
                  >Time: {{ testResult ? `${testMetrics.time}ms` : '-' }}</span
                >
              </div>
              <Button
                type="primary"
                :loading="testLoading"
                @click="runTest"
                :disabled="!testApiKey || !formState.inputSchema?.length"
                class="border-none bg-green-600 shadow-md shadow-green-500/20 hover:bg-green-500"
              >
                <Icon icon="lucide:play" class="mr-1 size-4" /> 运行测试
              </Button>
            </div>

            <!-- Result Area -->
            <div class="flex h-1/3 flex-col border-t border-gray-100 pt-3">
              <div class="mb-2 flex items-center justify-between px-1">
                <span
                  class="text-xs font-bold uppercase tracking-wider text-gray-600"
                  >Output</span
                >
                <Tooltip title="复制结果" v-if="testResult">
                  <button
                    class="text-gray-400 transition-colors hover:text-blue-500"
                    @click="handleCopy(testResult)"
                  >
                    <Icon icon="lucide:copy" class="size-3.5" />
                  </button>
                </Tooltip>
              </div>
              <!-- Chat Bubble Style Result -->
              <div
                class="relative flex-1 overflow-auto rounded-xl border border-gray-200 bg-gradient-to-br from-slate-50 to-white p-3 shadow-sm"
              >
                <div
                  v-if="testResult"
                  class="whitespace-pre-wrap font-mono text-xs leading-relaxed text-gray-700"
                >
                  {{ testResult }}
                </div>
                <div
                  v-else
                  class="flex h-full flex-col items-center justify-center gap-2 text-gray-300"
                >
                  <Icon icon="lucide:terminal" class="size-6 opacity-50" />
                  <span class="text-xs">等待执行...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<style scoped>
/* Custom Scrollbar for better UX in columns */
::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

::-webkit-scrollbar-track {
  background: transparent;
}
</style>
