<script setup lang="ts">
import type { ClassificationStrategy } from '#/types/attachment-classification';

import { onMounted, reactive, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Card, Form, message, Select } from 'ant-design-vue';

import {
  getClassificationStrategyApi,
  updateClassificationStrategyApi,
} from '#/api/attachment-classification';

const loading = ref(false);
const saving = ref(false);

// 表单数据
const formData = reactive<ClassificationStrategy>({
  strategyMode: 'OCR',
  defaultOCR: 'Deepseek-OCR',
  defaultTextLLM: 'GPT-4o-mini',
  defaultVisionModel: 'Qwen-VL-Max',
  updatedAt: '',
});

// OCR 引擎选项
const ocrVendorOptions = [
  { label: 'PaddleOCR', value: 'PaddleOCR' },
  { label: 'Deepseek-OCR v2', value: 'Deepseek-OCR' },
  { label: 'Azure-Form-Recognizer', value: 'Azure-Form-Recognizer' },
  { label: 'Tesseract', value: 'Tesseract' },
];

// LLM 模型选项
const llmModelOptions = [
  {
    label: 'OpenAI',
    options: [
      { label: 'GPT-4o-mini', value: 'GPT-4o-mini' },
      { label: 'GPT-4o', value: 'GPT-4o' },
    ],
  },
  {
    label: 'DeepSeek',
    options: [{ label: 'Deepseek-Chat', value: 'Deepseek-Chat' }],
  },
  {
    label: '阿里百炼',
    options: [
      { label: 'Qwen-Turbo', value: 'Qwen-Turbo' },
      { label: 'Qwen3', value: 'qwen3' },
    ],
  },
];

// Vision 模型选项
const visionModelOptions = [
  {
    label: '阿里百炼',
    options: [{ label: 'Qwen-VL-Max', value: 'Qwen-VL-Max' }],
  },
  {
    label: 'OpenAI',
    options: [{ label: 'GPT-4o-Vision', value: 'GPT-4o-Vision' }],
  },
  {
    label: 'Google',
    options: [{ label: 'Gemini-Vision-Pro', value: 'Gemini-Vision-Pro' }],
  },
];

// 获取策略配置
async function fetchStrategy() {
  loading.value = true;
  try {
    const response = await getClassificationStrategyApi();
    Object.assign(formData, response.data);
  } catch (error) {
    message.error('获取配置失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 保存配置
async function handleSave() {
  saving.value = true;
  try {
    await updateClassificationStrategyApi(formData);
    message.success('保存成功');
    await fetchStrategy();
  } catch (error) {
    message.error('保存失败');
    console.error(error);
  } finally {
    saving.value = false;
  }
}

// 重置为默认值
function handleReset() {
  Object.assign(formData, {
    strategyMode: 'OCR',
    defaultOCR: 'Deepseek-OCR',
    defaultTextLLM: 'GPT-4o-mini',
    defaultVisionModel: 'Qwen-VL-Max',
  });
  message.info('已重置为默认配置');
}

onMounted(() => {
  fetchStrategy();
});
</script>

<template>
  <div class="max-w-4xl space-y-6">
    <!-- 说明卡片 -->
    <Card>
      <div class="flex items-start gap-3">
        <div class="mt-1 text-primary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        </div>
        <div>
          <div class="font-medium">全局策略配置说明</div>
          <div class="mt-1 text-sm text-muted-foreground">
            设置附件上传后，系统用于自动分类的默认技术策略。此设置将作为新建分类时的默认选项，不影响已存在的分类配置。
          </div>
        </div>
      </div>
    </Card>

    <!-- 分类策略 -->
    <Card title="分类策略" :loading="loading">
      <div class="grid grid-cols-2 gap-4">
        <!-- OCR + LLM Card -->
        <div
          class="cursor-pointer rounded-lg border p-4 transition-all hover:border-primary"
          :class="
            formData.strategyMode === 'OCR'
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border'
          "
          @click="formData.strategyMode = 'OCR'"
        >
          <div class="mb-2 flex items-center gap-2">
            <Icon icon="lucide:file-text" class="size-5 text-primary" />
            <span class="text-lg font-medium">OCR + LLM</span>
          </div>
          <div class="text-sm text-muted-foreground">
            推荐: 速度快,适合结构化文档(发票、行程单等)
          </div>
        </div>

        <!-- Vision Card -->
        <div
          class="cursor-pointer rounded-lg border p-4 transition-all hover:border-primary"
          :class="
            formData.strategyMode === 'VISION'
              ? 'border-primary bg-primary/5 ring-1 ring-primary'
              : 'border-border'
          "
          @click="formData.strategyMode = 'VISION'"
        >
          <div class="mb-2 flex items-center gap-2">
            <Icon icon="lucide:eye" class="size-5 text-primary" />
            <span class="text-lg font-medium">Vision</span>
          </div>
          <div class="text-sm text-muted-foreground">
            推荐: 复杂版式,图文混排(合同、报告等)
          </div>
        </div>
      </div>
    </Card>

    <!-- 模型参数 -->
    <Card title="模型参数" :loading="loading">
      <Form :model="formData" layout="vertical">
        <Form.Item label="默认 OCR 引擎">
          <Select
            v-model:value="formData.defaultOCR"
            :options="ocrVendorOptions"
          />
          <div class="mt-1 text-xs text-muted-foreground">
            用于文本识别和结构化提取
          </div>
        </Form.Item>

        <Form.Item label="默认推理模型 (LLM)">
          <Select
            v-model:value="formData.defaultTextLLM"
            :options="llmModelOptions"
          />
          <div class="mt-1 text-xs text-muted-foreground">
            用于语义理解和字段提取(OCR 模式)
          </div>
        </Form.Item>

        <Form.Item label="默认视觉模型 (VLM)">
          <Select
            v-model:value="formData.defaultVisionModel"
            :options="visionModelOptions"
            :disabled="formData.strategyMode === 'OCR'"
          />
          <div class="mt-1 text-xs text-muted-foreground">
            用于直接从图像理解和提取(Vision 模式)
          </div>
        </Form.Item>
      </Form>
    </Card>

    <!-- 操作按钮 -->
    <div class="flex justify-end gap-3">
      <Button @click="handleReset">重置默认</Button>
      <Button type="primary" :loading="saving" @click="handleSave">
        保存设置
      </Button>
    </div>

    <!-- 最后更新时间 -->
    <div
      v-if="formData.updatedAt"
      class="text-right text-sm text-muted-foreground"
    >
      最后更新: {{ formData.updatedAt }}
    </div>
  </div>
</template>
