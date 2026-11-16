<script setup lang="ts">
import type { AgentTool } from '#/types/tools-data';

import { computed, reactive, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Form,
  Input,
  message,
  Radio,
  Select,
  Space,
  Steps,
} from 'ant-design-vue';

import { createAgentToolApi, updateAgentToolApi } from '#/api/tools-data';
import CodeEditor from '#/components/CodeEditor/index.vue';

const props = defineProps<{
  open: boolean;
  tool: AgentTool | null;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const currentStep = ref(0);
const saving = ref(false);
const formRef = ref();

const formData = reactive<Partial<AgentTool>>({
  type: 'MCP_HTTP',
  name: '',
  key: '',
  description: '',
  endpoint: '',
  schema: '{}',
  nativeMethod: '',
  status: 'active',
});

// Native Methods Mock
const nativeMethods = [
  {
    label: 'TimePlugin',
    options: [
      {
        label: 'GetCurrentTime',
        value: 'TimePlugin.GetCurrentTime',
        desc: '获取系统当前时间',
      },
      {
        label: 'GetDateDiff',
        value: 'TimePlugin.GetDateDiff',
        desc: '计算日期差',
      },
    ],
  },
  {
    label: 'MathPlugin',
    options: [
      {
        label: 'CalculateTax',
        value: 'MathPlugin.CalculateTax',
        desc: '计算税额',
      },
      { label: 'Sum', value: 'MathPlugin.Sum', desc: '求和' },
    ],
  },
];

const mcpJson = ref('');

// MCP JSON Example
const mcpJsonExample = {
  name: 'get_weather',
  description: 'Get current weather for a location',
  inputSchema: {
    type: 'object',
    properties: {
      location: {
        type: 'string',
        description: 'City name',
      },
      unit: {
        type: 'string',
        enum: ['celsius', 'fahrenheit'],
      },
    },
    required: ['location'],
  },
};

watch(
  () => props.open,
  (val) => {
    if (val) {
      if (props.tool) {
        // Editing
        Object.assign(formData, props.tool);
        currentStep.value = 1; // Skip type selection if editing (simplified)
        if (formData.type?.startsWith('MCP')) {
          // Construct JSON from existing data for editing
          mcpJson.value = JSON.stringify(
            {
              name: formData.name,
              description: formData.description,
              inputSchema: JSON.parse(formData.schema || '{}'),
            },
            null,
            2,
          );
        }
      } else {
        // Creating
        resetForm();
        currentStep.value = 0;
        mcpJson.value = JSON.stringify(mcpJsonExample, null, 2);
      }
    }
  },
);

function resetForm() {
  currentStep.value = 0;
  discoveredTools.value = [];
  Object.assign(formData, {
    type: 'MCP_HTTP',
    name: '',
    key: '',
    description: '',
    endpoint: '',
    schema: '{}',
    nativeMethod: '',
    status: 'active',
  });
  mcpJson.value = JSON.stringify(mcpJsonExample, null, 2);
}

async function handleNext() {
  if (currentStep.value === 0) {
    // Type selected, go to config
    currentStep.value = 1;
  } else if (currentStep.value === 1) {
    // Validation before going to refinement
    try {
      if (formData.type?.startsWith('MCP')) {
        // For MCP, validate JSON and Save directly (Step 2 is skipped)
        await formRef.value?.validate(); // Validate Endpoint
        if (!mcpJson.value) {
          message.error('请输入 MCP JSON 定义');
          return;
        }
        try {
          const parsed = JSON.parse(mcpJson.value);
          formData.name = parsed.name;
          formData.description = parsed.description;
          formData.schema = JSON.stringify(parsed.inputSchema || {}, null, 2);
          formData.key = parsed.name; // Use name as key
        } catch {
          message.error('MCP JSON 格式错误');
          return;
        }
        await handleSave();
        return;
      }

      // For Native, proceed to Step 2
      await formRef.value?.validate();
      currentStep.value = 2;
    } catch {
      // Validation failed
    }
  }
}

function handlePrev() {
  currentStep.value--;
}

function handleSelectNativeMethod(value: string, _option: any) {
  // option is not directly available in simple Select change event if using groups,
  // but we can find it.
  let desc = '';
  for (const g of nativeMethods) {
    const found = g.options.find((o) => o.value === value);
    if (found) {
      desc = found.desc;
      formData.name = found.label; // Default name
      break;
    }
  }

  formData.key =
    value
      .split('.')
      .pop()
      ?.replaceAll(/([A-Z])/g, '_$1')
      .toLowerCase()
      .slice(1) || '';
  formData.description = desc;
}

async function handleSave() {
  try {
    // If not MCP (Native), validate step 2 fields
    if (!formData.type?.startsWith('MCP')) {
      await formRef.value?.validate();
    }
    saving.value = true;

    if (props.tool) {
      await updateAgentToolApi(props.tool.id, formData);
      message.success('更新成功');
    } else {
      await createAgentToolApi(formData);
      message.success('创建成功');
    }

    emit('success');
    emit('update:open', false);
  } catch {
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
}

const isEdit = computed(() => !!props.tool);
const title = computed(() => (isEdit.value ? '编辑工具' : '注册工具'));

const steps = computed(() => {
  const baseSteps = [{ title: '类型选择', description: '选择工具来源' }];
  if (formData.type?.startsWith('MCP')) {
    baseSteps.push({ title: '工具定义', description: '配置 Endpoint 与 JSON' });
  } else {
    baseSteps.push(
      { title: '选择方法', description: '选择系统原生方法' },
      { title: '定义调优', description: '确认工具定义' },
    );
  }
  return baseSteps;
});
</script>

<template>
  <Drawer
    :open="open"
    :title="title"
    width="800px"
    @close="emit('update:open', false)"
  >
    <div class="mb-8">
      <Steps :current="currentStep" :items="steps" size="small" />
    </div>

    <Form ref="formRef" :model="formData" layout="vertical">
      <!-- Step 0: Type Selection -->
      <div v-show="currentStep === 0">
        <div class="grid grid-cols-2 gap-4">
          <Card
            hoverable
            :class="{ 'border-primary': formData.type?.startsWith('MCP') }"
            @click="formData.type = 'MCP_HTTP'"
          >
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-purple-100 p-2 text-purple-600">
                <Icon icon="lucide:globe" class="size-6" />
              </div>
              <div>
                <h3 class="text-base font-medium">MCP 服务</h3>
                <p class="mt-1 text-xs text-muted-foreground">
                  通过 Model Context Protocol 连接外部 HTTP/SSE 服务
                </p>
              </div>
            </div>
            <div class="mt-4">
              <Radio.Group v-model:value="formData.type">
                <Radio value="MCP_HTTP">HTTP</Radio>
                <Radio value="MCP_SSE">SSE</Radio>
              </Radio.Group>
            </div>
          </Card>

          <Card
            hoverable
            :class="{ 'border-primary': formData.type === 'NATIVE' }"
            @click="formData.type = 'NATIVE'"
          >
            <div class="flex items-center gap-3">
              <div class="rounded-lg bg-green-100 p-2 text-green-600">
                <Icon icon="lucide:box" class="size-6" />
              </div>
              <div>
                <h3 class="text-base font-medium">内置原生 (Native)</h3>
                <p class="mt-1 text-xs text-muted-foreground">
                  引用系统预置的 C# 方法 (KernelFunction)
                </p>
              </div>
            </div>
            <div class="mt-4">
              <Radio.Group v-model:value="formData.type">
                <Radio value="NATIVE">Native Method</Radio>
              </Radio.Group>
            </div>
          </Card>
        </div>
      </div>

      <!-- Step 1: Configuration -->
      <div v-show="currentStep === 1">
        <!-- MCP Config -->
        <template v-if="formData.type?.startsWith('MCP')">
          <Alert
            message="请直接粘贴 MCP Tool JSON 定义，系统将自动解析"
            type="info"
            show-icon
            class="mb-4"
          />

          <Form.Item
            label="Endpoint URL"
            name="endpoint"
            :rules="[{ required: true, message: '请输入 Endpoint' }]"
          >
            <Input
              v-model:value="formData.endpoint"
              placeholder="https://api.example.com/mcp"
            />
          </Form.Item>

          <Form.Item
            label="MCP Tool JSON"
            required
            help="包含 name, description, inputSchema 的完整 JSON 对象"
          >
            <CodeEditor v-model:value="mcpJson" mode="json" class="h-[400px]" />
          </Form.Item>
        </template>

        <!-- Native Config -->
        <template v-else>
          <Form.Item label="工具源" required>
            <Select value="builtin" disabled>
              <Select.Option value="builtin">
                Built-in System Tools
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="选择方法"
            name="nativeMethod"
            :rules="[{ required: true, message: '请选择方法' }]"
          >
            <Select
              v-model:value="formData.nativeMethod"
              placeholder="选择系统方法"
              @change="handleSelectNativeMethod"
            >
              <Select.OptGroup
                v-for="group in nativeMethods"
                :key="group.label"
                :label="group.label"
              >
                <Select.Option
                  v-for="opt in group.options"
                  :key="opt.value"
                  :value="opt.value"
                >
                  {{ opt.label }}
                </Select.Option>
              </Select.OptGroup>
            </Select>
          </Form.Item>
        </template>
      </div>

      <!-- Step 2: Refinement -->
      <div v-show="currentStep === 2">
        <Alert
          message="请确认并微调工具定义，这将直接影响 AI 的调用效果"
          type="info"
          show-icon
          class="mb-4"
        />

        <div class="grid grid-cols-2 gap-4">
          <Form.Item label="Tool Key" name="key">
            <Input v-model:value="formData.key" disabled />
          </Form.Item>
          <Form.Item label="工具名称" name="name">
            <Input v-model:value="formData.name" />
          </Form.Item>
        </div>

        <Form.Item
          label="AI 描述 (Prompt)"
          name="description"
          :rules="[{ required: true, message: '请输入工具描述' }]"
          help="描述该工具的功能、适用场景及输入要求，AI 将根据此描述决定是否调用"
        >
          <Input.TextArea
            v-model:value="formData.description"
            :rows="3"
            placeholder="例如: 获取系统当前时间，用于计算日期差..."
          />
        </Form.Item>

        <Form.Item label="Schema (Input Definition)" name="schema">
          <CodeEditor
            v-model:value="formData.schema"
            mode="json"
            class="h-[200px]"
            :disabled="formData.type === 'NATIVE'"
          />
        </Form.Item>
      </div>
    </Form>

    <template #footer>
      <div class="flex justify-between">
        <Button v-if="currentStep > 0" @click="handlePrev">上一步</Button>
        <div v-else></div>

        <Space>
          <Button @click="emit('update:open', false)">取消</Button>
          <Button
            v-if="
              currentStep === 0 ||
              (currentStep === 1 && !formData.type?.startsWith('MCP'))
            "
            type="primary"
            @click="handleNext"
          >
            下一步
          </Button>
          <Button
            v-else
            type="primary"
            :loading="saving"
            @click="
              currentStep === 1 && formData.type?.startsWith('MCP')
                ? handleNext()
                : handleSave()
            "
          >
            确认注册
          </Button>
        </Space>
      </div>
    </template>
  </Drawer>
</template>
