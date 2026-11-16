<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Card, Col, Form, message, Row, Select } from 'ant-design-vue';

const useForm = Form.useForm;

// 填报模型配置
const fillingModelConfig = ref({
  provider: 'qianwen',
  model: 'qwen-max',
});

// 模型选项
const modelProviders = [
  { label: '通义千问', value: 'qianwen' },
  { label: '智谱 GLM', value: 'glm' },
];

const qianwenModels = [
  { label: 'qwen-max', value: 'qwen-max' },
  { label: 'qwen-plus', value: 'qwen-plus' },
  { label: 'qwen-turbo', value: 'qwen-turbo' },
];

const glmModels = [
  { label: 'glm-4', value: 'glm-4' },
  { label: 'glm-3-turbo', value: 'glm-3-turbo' },
  { label: 'glm-4v', value: 'glm-4v' },
];

// 表单验证规则
const fillingModelRules = {
  provider: [{ required: true, message: '请选择填报模型提供商' }],
  model: [{ required: true, message: '请选择模型' }],
};

const { validate: validateFillingModel, resetFields: resetFillingModel } =
  useForm(fillingModelConfig, fillingModelRules);

// 保存配置
async function handleSave() {
  try {
    await validateFillingModel();

    // 保存到localStorage
    const configToSave = {
      fillingModel: fillingModelConfig.value,
    };
    localStorage.setItem('filling-settings', JSON.stringify(configToSave));

    message.success('配置保存成功');
  } catch (error: any) {
    console.error('保存配置失败:', error);
    message.error('请检查表单填写是否完整');
  }
}

// 重置配置
function handleReset() {
  resetFillingModel();
  message.info('已重置为默认配置');
}

// 加载配置
function loadConfig() {
  // 从 localStorage 或 API 加载配置
  const savedConfig = localStorage.getItem('filling-settings');
  if (savedConfig) {
    const config = JSON.parse(savedConfig);
    fillingModelConfig.value = config.fillingModel || fillingModelConfig.value;
  }
}

onMounted(() => {
  loadConfig();
});
</script>

<template>
  <div class="space-y-6 rounded-lg bg-white p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="mb-2 text-3xl font-bold text-slate-900">智能填报设置</h1>
      <p class="text-slate-500">配置智能填报所需的 AI 模型参数</p>
    </div>

    <!-- 填报模型设置 -->
    <Card title="填报模型设置" class="bg-white shadow-sm" :bordered="false">
      <template #extra>
        <Icon icon="lucide:brain-circuit" class="size-5 text-slate-400" />
      </template>

      <Form :model="fillingModelConfig" layout="vertical" class="mt-4">
        <Row :gutter="24">
          <Col :span="12">
            <Form.Item label="模型提供商" name="provider">
              <Select
                v-model:value="fillingModelConfig.provider"
                placeholder="请选择模型提供商"
                size="large"
              >
                <Select.Option
                  v-for="provider in modelProviders"
                  :key="provider.value"
                  :value="provider.value"
                >
                  {{ provider.label }}
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>

          <Col :span="12">
            <Form.Item label="模型版本" name="model">
              <Select
                v-model:value="fillingModelConfig.model"
                placeholder="请选择模型版本"
                size="large"
              >
                <Select.Option
                  v-for="model in fillingModelConfig.provider === 'qianwen'
                    ? qianwenModels
                    : glmModels"
                  :key="model.value"
                  :value="model.value"
                >
                  {{ model.label }}
                </Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>

    <!-- 操作按钮 -->
    <div class="flex justify-end gap-3">
      <Button size="large" @click="handleReset">
        <template #icon>
          <Icon icon="lucide:rotate-ccw" class="size-4" />
        </template>
        重置
      </Button>
      <Button type="primary" size="large" @click="handleSave">
        <template #icon>
          <Icon icon="lucide:save" class="size-4" />
        </template>
        保存配置
      </Button>
    </div>
  </div>
</template>

<style scoped>
:deep(.ant-card-head) {
  @apply border-slate-200;
}

:deep(.ant-card-head-title) {
  @apply font-semibold text-slate-900;
}

:deep(.ant-form-item-label > label) {
  @apply font-medium text-slate-700;
}
</style>
