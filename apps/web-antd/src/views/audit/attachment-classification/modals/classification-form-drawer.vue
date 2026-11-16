<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import type {
  AttachmentClassification,
  AttachmentGroup,
  DocumentMode,
} from '#/types/attachment-classification';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  message,
  Radio,
  Row,
  Select,
  Space,
  Switch,
} from 'ant-design-vue';

import {
  createClassificationApi,
  getAttachmentGroupsApi,
  updateClassificationApi,
} from '#/api/attachment-classification';

const props = defineProps<{
  classification: AttachmentClassification | null;
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const formRef = ref();
const saving = ref(false);
const groups = ref<AttachmentGroup[]>([]);

// 表单数据
const formData = reactive({
  groupIds: [] as string[],
  name: '',
  code: '',
  description: '',
  enabled: true,
  documentMode: 'page' as DocumentMode,
  extractionMode: 'OCR' as 'OCR' | 'VISION',
  ocrVendor: 'Deepseek-OCR' as string,
  recognizeCover: false,
  llmModel: 'GPT-4o-mini' as string,
  visionModel: '' as string,
});

// 加载附件组
async function loadGroups() {
  try {
    const res = await getAttachmentGroupsApi();
    groups.value = res.data;
  } catch (error) {
    console.error('Failed to load groups', error);
  }
}

onMounted(() => {
  loadGroups();
});

// 监听分类数据变化
watch(
  () => props.classification,
  (classification) => {
    if (classification) {
      Object.assign(formData, {
        groupIds: classification.groupIds || [],
        name: classification.name,
        code: classification.code,
        description: classification.description || '',
        enabled: classification.enabled,
        documentMode: classification.documentMode || 'page',
        extractionMode: classification.extractionMode,
        ocrVendor: classification.ocrVendor,
        recognizeCover: classification.recognizeCover,
        llmModel: classification.llmModel,
        visionModel: classification.visionModel || '',
      });
    } else {
      // 重置表单
      Object.assign(formData, {
        groupIds: [],
        name: '',
        code: '',
        description: '',
        enabled: true,
        documentMode: 'page',
        extractionMode: 'OCR',
        ocrVendor: 'Deepseek-OCR',
        recognizeCover: false,
        llmModel: 'GPT-4o-mini',
        visionModel: '',
      });
    }
  },
  { immediate: true },
);

// 表单验证规则
const rules: Record<string, Rule[]> = {
  groupIds: [{ required: true, message: '请选择附件组', type: 'array' }],
  name: [{ required: true, message: '请输入分类名称' }],
  code: [
    { required: true, message: '请输入分类编码' },
    { pattern: /^[a-z_]+$/, message: '仅支持小写字母和下划线' },
  ],
  ocrVendor: [{ required: true, message: '请选择OCR引擎' }],
  llmModel: [{ required: true, message: '请选择推理模型' }],
  visionModel: [
    {
      validator: (_rule: any, value: string) => {
        if (formData.extractionMode === 'VISION' && !value) {
          return Promise.reject(new Error('Vision模式下必须选择视觉模型'));
        }
        return Promise.resolve();
      },
    },
  ],
};

// OCR 引擎选项
const ocrVendorOptions = [
  { label: 'PaddleOCR', value: 'PaddleOCR' },
  { label: 'Deepseek-OCR', value: 'Deepseek-OCR' },
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

// 是否为编辑模式
const isEditMode = computed(() => !!props.classification);

// 弹窗标题
const modalTitle = computed(() => (isEditMode.value ? '编辑分类' : '新增分类'));

// 保存
async function handleSave() {
  try {
    await formRef.value?.validate();

    saving.value = true;
    const data = {
      groupIds: formData.groupIds,
      name: formData.name,
      code: formData.code,
      description: formData.description,
      enabled: formData.enabled,
      documentMode: formData.documentMode,
      extractionMode: formData.extractionMode,
      ocrVendor: formData.ocrVendor,
      recognizeCover: formData.recognizeCover,
      llmModel: formData.llmModel,
      visionModel: formData.visionModel || undefined,
      fieldRules: props.classification?.fieldRules || [],
    };

    if (isEditMode.value) {
      await updateClassificationApi(props.classification!.id, data);
      message.success('更新成功');
    } else {
      await createClassificationApi(data);
      message.success('创建成功');
    }

    emit('success');
  } catch (error) {
    if (error instanceof Error && error.message !== 'Validation failed') {
      message.error('保存失败');
      console.error(error);
    }
  } finally {
    saving.value = false;
  }
}

// 取消
function handleCancel() {
  emit('update:open', false);
}
</script>

<template>
  <Drawer :open="open" :title="modalTitle" width="700px" @close="handleCancel">
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
      class="mt-4"
    >
      <!-- 基本信息 -->
      <div class="mb-4 text-base font-semibold">基本信息</div>

      <Row :gutter="16">
        <Col :span="24">
          <Form.Item label="附件组" name="groupIds">
            <Select
              v-model:value="formData.groupIds"
              mode="multiple"
              :options="groups.map((g) => ({ label: g.name, value: g.id }))"
              placeholder="请选择附件组"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="分类名称" name="name">
            <Input
              v-model:value="formData.name"
              placeholder="如: 增值税专用发票"
              :maxlength="50"
            />
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="分类编码" name="code">
            <Input
              v-model:value="formData.code"
              placeholder="如: invoice_vat"
              :maxlength="50"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row>
        <Col :span="24">
          <Form.Item label="分类提示词" name="description">
            <Input.TextArea
              v-model:value="formData.description"
              placeholder="请输入分类提示词"
              :rows="3"
              :maxlength="200"
              show-count
            />
          </Form.Item>
        </Col>
      </Row>

      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="状态" name="enabled">
            <Switch
              v-model:checked="formData.enabled"
              checked-children="启用"
              un-checked-children="禁用"
            />
          </Form.Item>
        </Col>
      </Row>

      <!-- 取数模式 -->
      <div class="mb-4 mt-6 text-base font-semibold">取数模式</div>

      <Row :gutter="16">
        <Col :span="24">
          <Form.Item label="文档处理方式" name="documentMode">
            <Radio.Group v-model:value="formData.documentMode">
              <Radio.Button value="page">单页</Radio.Button>
              <Radio.Button value="document">文档</Radio.Button>
            </Radio.Group>
            <div class="mt-2 text-xs text-muted-foreground">
              <template v-if="formData.documentMode === 'page'">
                单页模式：适用于扫描仪扫描，每页独立分类和提取
              </template>
              <template v-else>
                文档模式：适用于电子文档，整体分类和提取
              </template>
            </div>
          </Form.Item>
        </Col>
      </Row>

      <!-- 取数配置 -->
      <div class="mb-4 mt-6 text-base font-semibold">取数配置</div>

      <Row :gutter="16">
        <Col :span="12">
          <Form.Item label="取数策略" name="extractionMode">
            <Radio.Group v-model:value="formData.extractionMode">
              <Radio.Button value="OCR">OCR + LLM</Radio.Button>
              <Radio.Button value="VISION">Vision</Radio.Button>
            </Radio.Group>
            <div class="mt-2 text-xs text-muted-foreground">
              <template v-if="formData.extractionMode === 'OCR'">
                适合文档类，先进行OCR识别后，将识别文字利用LLM去分类
              </template>
              <template v-else>
                通过视觉模型去提取，更适合复杂签字类，盖章类非文本的场景
              </template>
            </div>
          </Form.Item>
        </Col>
        <Col :span="12">
          <Form.Item label="封面识别" name="recognizeCover">
            <Switch
              v-model:checked="formData.recognizeCover"
              checked-children="开启"
              un-checked-children="关闭"
            />
            <span class="ml-2 text-xs text-muted-foreground">仅识别第一页</span>
          </Form.Item>
        </Col>
      </Row>

      <template v-if="formData.extractionMode === 'OCR'">
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="OCR 引擎" name="ocrVendor">
              <Select
                v-model:value="formData.ocrVendor"
                :options="ocrVendorOptions"
                placeholder="请选择OCR引擎"
              />
            </Form.Item>
          </Col>
          <Col :span="12">
            <Form.Item label="推理模型" name="llmModel">
              <Select
                v-model:value="formData.llmModel"
                :options="llmModelOptions"
                placeholder="请选择LLM模型"
              />
            </Form.Item>
          </Col>
        </Row>
      </template>

      <template v-else>
        <Row :gutter="16">
          <Col :span="12">
            <Form.Item label="视觉模型" name="visionModel">
              <Select
                v-model:value="formData.visionModel"
                :options="visionModelOptions"
                placeholder="请选择视觉大模型"
              />
            </Form.Item>
          </Col>
        </Row>
      </template>
    </Form>

    <template #footer>
      <Space class="flex justify-end">
        <Button @click="handleCancel">取消</Button>
        <Button type="primary" :loading="saving" @click="handleSave">
          保存
        </Button>
      </Space>
    </template>
  </Drawer>
</template>
