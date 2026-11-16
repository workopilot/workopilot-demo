<script setup lang="ts">
import type { UploadFile } from 'ant-design-vue';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Progress,
  Select,
  SelectOption,
  Tag,
  Upload,
} from 'ant-design-vue';

import { uploadFile } from '#/api/file-management';
import { mockFileCategories } from '#/api/mock-data-file-management';

interface FileTag {
  id: string;
  name: string;
  color: string;
}

interface Props {
  open: boolean;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const internalOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

// ==================== 表单数据 ====================

const fileList = ref<UploadFile[]>([]);
const selectedCategory = ref<string | undefined>();
const userDescription = ref<string>('');
const uploading = ref(false);
const uploadProgress = ref(0);
const aiClassificationResult = ref<FileCategory | null>(null);

// ==================== 标签数据 ====================

const fileTags = ref<FileTag[]>([]);
const newTagName = ref<string>('');
const selectedColorIndex = ref<number>(0);

// 预设标签颜色
const PRESET_COLORS = [
  { value: '#1890ff', label: '蓝' },
  { value: '#52c41a', label: '绿' },
  { value: '#faad14', label: '橙' },
  { value: '#f5222d', label: '红' },
  { value: '#722ed1', label: '紫' },
  { value: '#13c2c2', label: '青' },
  { value: '#eb2f96', label: '粉' },
  { value: '#fa8c16', label: '金' },
];

// 快捷标签
const QUICK_TAGS = [
  { name: '重要', color: '#f5222d' },
  { name: '加急', color: '#faad14' },
  { name: '待审核', color: '#1890ff' },
  { name: '已通过', color: '#52c41a' },
  { name: '合同', color: '#722ed1' },
  { name: '财务', color: '#13c2c2' },
];

// ==================== 标签操作 ====================

/** 添加标签 */
function handleAddTag() {
  const name = newTagName.value.trim();
  if (!name) {
    message.warning('请输入标签名称');
    return;
  }
  if (fileTags.value.some((t) => t.name === name)) {
    message.warning('标签已存在');
    return;
  }
  if (fileTags.value.length >= 10) {
    message.warning('最多添加10个标签');
    return;
  }

  fileTags.value.push({
    id: `tag_${Date.now()}`,
    name,
    color: PRESET_COLORS[selectedColorIndex.value].value,
  });
  newTagName.value = '';
}

/** 删除标签 */
function handleRemoveTag(tagId: string) {
  const index = fileTags.value.findIndex((t) => t.id === tagId);
  if (index !== -1) {
    fileTags.value.splice(index, 1);
  }
}

/** 添加快捷标签 */
function handleQuickAddTag(tagName: string, color: string) {
  if (fileTags.value.some((t) => t.name === tagName)) {
    message.warning('标签已存在');
    return;
  }
  if (fileTags.value.length >= 10) {
    message.warning('最多添加10个标签');
    return;
  }

  fileTags.value.push({
    id: `tag_${Date.now()}`,
    name: tagName,
    color,
  });
}

// ==================== 常量定义 ====================

const CATEGORY_OPTIONS = mockFileCategories.filter((c) => c.type !== 'other');

// ==================== 文件选择处理 ====================

function handleFileChange({
  fileList: newFileList,
}: {
  fileList: UploadFile[];
}) {
  fileList.value = newFileList;
  // 模拟 AI 分类结果
  if (newFileList.length > 0) {
    simulateAiClassification(newFileList[0]);
  }
}

function handleRemove(file: UploadFile) {
  const index = fileList.value.indexOf(file);
  if (index !== -1) {
    fileList.value.splice(index, 1);
  }
  if (fileList.value.length === 0) {
    aiClassificationResult.value = null;
  }
}

// ==================== 模拟 AI 分类 ====================

function simulateAiClassification(file: UploadFile) {
  const fileName = file.name?.toLowerCase() || '';

  // 根据文件名简单模拟 AI 分类
  if (
    fileName.includes('合同') ||
    fileName.includes('协议') ||
    fileName.includes('contract')
  ) {
    aiClassificationResult.value =
      mockFileCategories.find((c) => c.code === 'AI_CONTRACT') || null;
  } else if (
    fileName.includes('发票') ||
    fileName.includes('凭证') ||
    fileName.includes('invoice')
  ) {
    aiClassificationResult.value =
      mockFileCategories.find((c) => c.code === 'AI_VOUCHER') || null;
  } else if (fileName.includes('报表') || fileName.includes('财报')) {
    aiClassificationResult.value =
      mockFileCategories.find((c) => c.code === 'AI_FINANCIAL_REPORT') || null;
  } else if (fileName.includes('配置') || fileName.includes('config')) {
    aiClassificationResult.value =
      mockFileCategories.find((c) => c.code === 'AI_CONFIGURATION') || null;
  } else {
    aiClassificationResult.value = null;
  }

  // 如果有 AI 分类结果，自动选中
  if (aiClassificationResult.value) {
    selectedCategory.value = aiClassificationResult.value.code;
  }
}

// ==================== 上传处理 ====================

async function handleUpload() {
  if (fileList.value.length === 0) {
    message.warning('请选择要上传的文件');
    return;
  }

  uploading.value = true;
  uploadProgress.value = 0;

  // 模拟上传进度
  const progressInterval = setInterval(() => {
    if (uploadProgress.value < 90) {
      uploadProgress.value += 10;
    }
  }, 200);

  try {
    const file = fileList.value[0].originFileObj as File;
    await uploadFile({
      file,
      source: null,
      categoryId: selectedCategory.value,
      sensitivityLevel: 'internal',
      userDescription: userDescription.value,
      fileTags: fileTags.value,
    });

    clearInterval(progressInterval);
    uploadProgress.value = 100;

    message.success('文件上传成功');

    // 延迟关闭弹窗
    setTimeout(() => {
      handleReset();
      emit('success');
    }, 500);
  } catch (error) {
    clearInterval(progressInterval);
    message.error('文件上传失败');
    console.error(error);
  } finally {
    uploading.value = false;
  }
}

// ==================== 重置表单 ====================

function handleReset() {
  fileList.value = [];
  selectedCategory.value = undefined;
  userDescription.value = '';
  fileTags.value = [];
  newTagName.value = '';
  selectedColorIndex.value = 0;
  uploadProgress.value = 0;
  aiClassificationResult.value = null;
}

function handleClose() {
  if (uploading.value) {
    message.warning('文件上传中，请稍候...');
    return;
  }
  handleReset();
  internalOpen.value = false;
}

// ==================== 监听弹窗打开 ====================

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      handleReset();
    }
  },
);
</script>

<template>
  <Modal
    v-model:open="internalOpen"
    title="上传文件"
    :width="650"
    :closable="!uploading"
    :mask-closable="!uploading"
    @cancel="handleClose"
  >
    <div class="space-y-4">
      <!-- 文件选择 -->
      <Card size="small">
        <template #title>
          <div class="flex items-center gap-2">
            <Icon icon="lucide:file" class="size-4" />
            <span>选择文件</span>
          </div>
        </template>

        <Upload.Dragger
          :file-list="fileList"
          :disabled="uploading"
          :multiple="false"
          @change="handleFileChange"
          @remove="handleRemove"
        >
          <div class="p-6 text-center">
            <Icon
              icon="lucide:upload-cloud"
              class="mx-auto size-12 text-primary"
            />
            <div class="mt-3 text-sm">
              <span class="font-medium text-foreground">点击上传</span>
              <span class="text-muted-foreground">或拖拽文件到此处</span>
            </div>
            <div class="mt-2 text-xs text-muted-foreground">
              支持 PDF、Word、Excel、图片等常用格式
            </div>
          </div>
        </Upload.Dragger>
      </Card>

      <!-- AI 分类结果 -->
      <Card
        v-if="aiClassificationResult"
        size="small"
        class="border-purple-200 bg-purple-50"
      >
        <template #title>
          <div class="flex items-center gap-2">
            <Icon icon="lucide:sparkles" class="size-4 text-purple-500" />
            <span class="text-purple-700">AI 智能分类</span>
          </div>
        </template>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Tag color="purple">{{ aiClassificationResult.name }}</Tag>
            <span class="text-xs text-purple-600">
              置信度:
              {{ ((aiClassificationResult.confidence || 0) * 100).toFixed(0) }}%
            </span>
          </div>
          <button
            class="text-xs text-purple-600 underline hover:text-purple-700"
            @click="selectedCategory = undefined"
          >
            取消
          </button>
        </div>
      </Card>

      <!-- 上传配置 -->
      <Form :label-col="{ span: 5 }" :wrapper-col="{ span: 18 }">
        <!-- 文件分类 -->
        <FormItem label="文件分类">
          <Select
            v-model:value="selectedCategory"
            placeholder="选择分类（不选则自动分类）"
            :disabled="uploading"
          >
            <SelectOption value="">自动分类（AI 智能匹配）</SelectOption>
            <Select.OptGroup label="系统预置分类">
              <SelectOption
                v-for="cat in CATEGORY_OPTIONS.filter(
                  (c) => c.type === 'preset',
                )"
                :key="cat.code"
                :value="cat.code"
              >
                {{ cat.name }}
              </SelectOption>
            </Select.OptGroup>
            <Select.OptGroup label="AI 匹配分类">
              <SelectOption
                v-for="cat in CATEGORY_OPTIONS.filter(
                  (c) => c.type === 'ai_match',
                )"
                :key="cat.code"
                :value="cat.code"
              >
                {{ cat.name }}
              </SelectOption>
            </Select.OptGroup>
          </Select>
        </FormItem>

        <!-- 文件标签 -->
        <FormItem label="文件标签">
          <div class="space-y-2">
            <!-- 快捷标签 -->
            <div class="flex flex-wrap gap-1.5">
              <Tag
                v-for="tag in QUICK_TAGS"
                :key="tag.name"
                :color="tag.color"
                class="cursor-pointer hover:opacity-80"
                @click="handleQuickAddTag(tag.name, tag.color)"
              >
                + {{ tag.name }}
              </Tag>
            </div>
            <!-- 自定义标签输入 -->
            <div class="flex items-center gap-2">
              <Input
                v-model:value="newTagName"
                placeholder="输入标签名称"
                :disabled="uploading || fileTags.length >= 10"
                :maxlength="10"
                class="flex-1"
                @press-enter="handleAddTag"
              />
              <!-- 颜色选择器 -->
              <div class="flex items-center gap-1">
                <div
                  v-for="(color, index) in PRESET_COLORS"
                  :key="color.value"
                  class="h-6 w-6 cursor-pointer rounded border-2 transition-all"
                  :class="[
                    selectedColorIndex === index
                      ? 'scale-110 border-slate-400'
                      : 'border-transparent hover:scale-105',
                  ]"
                  :style="{ backgroundColor: color.value }"
                  :title="color.label"
                  @click="selectedColorIndex = index"
                ></div>
              </div>
              <Button
                type="primary"
                size="small"
                :disabled="
                  uploading || !newTagName.trim() || fileTags.length >= 10
                "
                @click="handleAddTag"
              >
                添加
              </Button>
            </div>
            <!-- 已选标签 -->
            <div v-if="fileTags.length > 0" class="flex flex-wrap gap-1.5">
              <Tag
                v-for="tag in fileTags"
                :key="tag.id"
                :color="tag.color"
                closable
                @close="handleRemoveTag(tag.id)"
                class="mb-0"
              >
                {{ tag.name }}
              </Tag>
            </div>
            <div v-else class="text-xs text-muted-foreground">
              暂无标签，点击快捷标签或自定义添加
            </div>
          </div>
        </FormItem>

        <!-- 用户描述 -->
        <FormItem label="用户备注">
          <Input
            v-model:value="userDescription"
            type="textarea"
            placeholder="请输入文件备注信息（可选）"
            :disabled="uploading"
            :rows="3"
            :maxlength="200"
            show-count
          />
        </FormItem>
      </Form>

      <!-- 上传进度 -->
      <div v-if="uploading" class="rounded-lg border border-border p-4">
        <div class="mb-2 flex items-center justify-between text-sm">
          <span>上传中...</span>
          <span>{{ uploadProgress }}%</span>
        </div>
        <Progress :percent="uploadProgress" :show-info="false" />
      </div>
    </div>

    <!-- 底部按钮 -->
    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button :disabled="uploading" @click="handleClose"> 取消 </Button>
        <Button
          type="primary"
          :loading="uploading"
          :disabled="fileList.length === 0"
          @click="handleUpload"
        >
          <Icon v-if="!uploading" icon="lucide:upload" class="mr-1 size-4" />
          {{ uploading ? '上传中...' : '开始上传' }}
        </Button>
      </div>
    </template>
  </Modal>
</template>
