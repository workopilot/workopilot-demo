<script setup lang="ts">
import type { AttachmentClassification } from '#/types/attachment-classification';

import { ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, message, Modal, Spin, Table, Upload } from 'ant-design-vue';

const props = defineProps<{
  classification: AttachmentClassification | null;
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const fileList = ref<any[]>([]);
const extractionResults = ref<any[]>([]);

const columns = [
  { title: '字段编码', dataIndex: 'code', key: 'code' },
  { title: '字段名称', dataIndex: 'name', key: 'name' },
  { title: '提取值', dataIndex: 'value', key: 'value' },
];

watch(
  () => props.open,
  (val) => {
    if (!val) {
      fileList.value = [];
      extractionResults.value = [];
      loading.value = false;
    }
  },
);

async function customRequest({ file, onSuccess }: any) {
  loading.value = true;
  extractionResults.value = [];

  try {
    // 模拟上传和分析过程
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 生成模拟数据
    if (props.classification?.fieldRules) {
      extractionResults.value = props.classification.fieldRules.map((rule) => {
        let mockValue = '';
        const type = rule.type?.toLowerCase() || 'string';

        switch (type) {
          case 'date': {
            mockValue = '2025-01-20';
            break;
          }
          case 'json': {
            mockValue = '{"name": "test"}';
            break;
          }
          case 'money':
          case 'number': {
            mockValue = (Math.random() * 10_000).toFixed(2);
            break;
          }
          default: {
            mockValue = `Mock ${rule.name}`;
          }
        }

        return {
          code: rule.code,
          name: rule.name,
          value: mockValue,
        };
      });
    }

    fileList.value = [file];
    onSuccess();
    message.success('识别完成');
  } catch {
    message.error('识别失败');
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit('update:open', false);
}
</script>

<template>
  <Modal
    :open="open"
    title="快速测试"
    width="600px"
    @cancel="handleClose"
    :footer="null"
  >
    <div class="flex flex-col gap-4">
      <div class="rounded bg-muted/30 p-3 text-sm text-muted-foreground">
        当前测试分类：<span class="font-medium text-primary">{{
          classification?.name
        }}</span>
      </div>

      <Upload.Dragger
        v-if="fileList.length === 0"
        name="file"
        :multiple="false"
        :custom-request="customRequest"
        :show-upload-list="false"
        accept=".pdf,.jpg,.jpeg,.png"
      >
        <p class="ant-upload-drag-icon">
          <Icon
            icon="lucide:upload-cloud"
            class="mx-auto size-10 text-primary"
          />
        </p>
        <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
        <p class="ant-upload-hint">支持 PDF, JPG, PNG 格式</p>
      </Upload.Dragger>

      <div v-else class="relative rounded border p-4">
        <Button
          type="text"
          class="absolute right-2 top-2 text-muted-foreground hover:text-red-500"
          @click="fileList = []"
        >
          <Icon icon="lucide:x" />
        </Button>
        <div class="mb-4 flex items-center gap-3">
          <div
            class="flex size-10 items-center justify-center rounded bg-primary/10 text-primary"
          >
            <Icon icon="lucide:file-text" class="size-6" />
          </div>
          <div>
            <div class="font-medium">测试文件已上传</div>
            <div
              class="flex items-center gap-1 text-xs text-muted-foreground text-success"
            >
              <Icon icon="lucide:check-circle" class="size-3" />
              识别成功
            </div>
          </div>
        </div>

        <Table
          :columns="columns"
          :data-source="extractionResults"
          :pagination="false"
          size="small"
          bordered
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'value'">
              <span class="font-mono text-primary">{{ record.value }}</span>
            </template>
          </template>
        </Table>
      </div>

      <div v-if="loading" class="py-8 text-center">
        <Spin tip="正在分析文件..." />
      </div>
    </div>
  </Modal>
</template>
