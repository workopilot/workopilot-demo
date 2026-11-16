<script setup lang="ts">
import type { AttachmentClassification } from '#/types/attachment-classification';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Badge,
  Button,
  Card,
  message,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
} from 'ant-design-vue';

import { getClassificationsApi } from '#/api/attachment-classification';
import CodeEditor from '#/components/CodeEditor/index.vue';

const router = useRouter();

// 状态
const loading = ref(false);
const isRunning = ref(false);
const fileList = ref<any[]>([]);
const classifications = ref<AttachmentClassification[]>([]);
const selectedClassifications = ref<string[]>([]);
const enableExtraction = ref(true);
const results = ref<any[]>([]);
const expandedRowKeys = ref<string[]>([]);

// 获取分类列表
async function fetchClassifications() {
  try {
    const response = await getClassificationsApi();
    classifications.value = response.data || [];
    // 默认全选
    selectedClassifications.value = classifications.value.map((c) => c.code);
  } catch (error) {
    console.error(error);
  }
}

// 返回
function handleBack() {
  router.push('/attachment/config');
}

// 切换全选
const allSelected = computed(() => {
  return (
    classifications.value.length > 0 &&
    selectedClassifications.value.length === classifications.value.length
  );
});

const indeterminate = computed(() => {
  return (
    selectedClassifications.value.length > 0 &&
    selectedClassifications.value.length < classifications.value.length
  );
});

function handleToggleAll() {
  selectedClassifications.value = allSelected.value
    ? []
    : classifications.value.map((c) => c.code);
}

function handleToggleTag(code: string, checked: boolean) {
  if (checked) {
    selectedClassifications.value.push(code);
  } else {
    selectedClassifications.value = selectedClassifications.value.filter(
      (c) => c !== code,
    );
  }
}

// 开始运行
async function handleRun() {
  if (fileList.value.length === 0) {
    message.warning('请先上传文件');
    return;
  }
  if (selectedClassifications.value.length === 0) {
    message.warning('请至少选择一个参测分类');
    return;
  }

  isRunning.value = true;
  results.value = [];

  // 模拟处理过程
  for (const file of fileList.value) {
    // 模拟文件级结果
    const fileResult = {
      id: file.uid,
      fileName: file.name,
      pageCount: Math.floor(Math.random() * 5) + 1, // 1-5页
      duration: '0s',
      status: 'running',
      pages: [],
    };
    results.value.push(fileResult);

    // 模拟延迟
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 生成页级结果
    const pages = [];
    for (let i = 1; i <= fileResult.pageCount; i++) {
      const isCover = i === 1 && fileResult.pageCount > 1;
      const randomClass =
        classifications.value[
          Math.floor(Math.random() * classifications.value.length)
        ];

      pages.push({
        pageNo: i,
        classification: randomClass ? randomClass.name : '未知',
        confidence: (Math.random() * (0.99 - 0.8) + 0.8).toFixed(2), // 0.80 - 0.99
        pageType: isCover ? '封面' : '正文',
        ocrSummary:
          '这是一段模拟的 OCR 识别文本摘要，实际应用中会显示页面前 50 个字符...',
        extractedData: enableExtraction.value
          ? {
              invoice_no: '12345678',
              amount: '1000.00',
              date: '2023-12-01',
            }
          : null,
      });
    }

    // 更新文件结果
    fileResult.pages = pages;
    fileResult.status = 'completed';
    fileResult.duration = `${(Math.random() * 2 + 1).toFixed(1)}s`;

    // 自动展开
    expandedRowKeys.value.push(fileResult.id);
  }

  isRunning.value = false;
  message.success('测试完成');
}

// 表格列定义
const columns = [
  { title: '文件名', dataIndex: 'fileName', key: 'fileName' },
  {
    title: '总页数',
    dataIndex: 'pageCount',
    key: 'pageCount',
    width: 100,
    align: 'center',
  },
  {
    title: '耗时',
    dataIndex: 'duration',
    key: 'duration',
    width: 100,
    align: 'center',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    align: 'center',
  },
];

onMounted(() => {
  fetchClassifications();
});
</script>

<template>
  <div class="flex h-full flex-col bg-background">
    <!-- 顶部导航栏 -->
    <div class="border-b bg-card px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Button type="text" @click="handleBack">
            <Icon icon="lucide:arrow-left" class="size-5" />
          </Button>
          <div>
            <h1 class="text-xl font-semibold">分类测试沙箱</h1>
            <p class="text-xs text-muted-foreground">
              上传样本文件，验证分类规则和字段提取效果
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-1 flex-col gap-6 overflow-hidden p-6">
      <!-- 控制区 -->
      <Card :bordered="false" class="shadow-sm">
        <div class="flex gap-6">
          <!-- 上传区 -->
          <div class="w-1/3">
            <Upload.Dragger
              v-model:file-list="fileList"
              :multiple="true"
              :before-upload="() => false"
              class="h-full"
            >
              <p class="ant-upload-drag-icon">
                <Icon
                  icon="lucide:upload-cloud"
                  class="mx-auto size-10 text-primary"
                />
              </p>
              <p class="ant-upload-text">点击或拖拽上传文件</p>
              <p class="ant-upload-hint">支持 PDF, JPG, PNG 格式</p>
            </Upload.Dragger>
          </div>

          <!-- 配置区 -->
          <div class="flex-1 space-y-4">
            <div>
              <div class="mb-2 font-medium">参测分类</div>
              <div class="flex flex-wrap gap-2">
                <Tag.CheckableTag
                  :checked="allSelected"
                  @change="handleToggleAll"
                >
                  全选
                </Tag.CheckableTag>
                <Tag.CheckableTag
                  v-for="item in classifications"
                  :key="item.code"
                  :checked="selectedClassifications.includes(item.code)"
                  @change="(checked) => handleToggleTag(item.code, checked)"
                >
                  {{ item.name }}
                </Tag.CheckableTag>
              </div>
            </div>

            <div>
              <div class="mb-2 font-medium">测试选项</div>
              <Space>
                <div class="flex items-center gap-2 rounded border px-3 py-2">
                  <Switch v-model:checked="enableExtraction" size="small" />
                  <span class="text-sm">同时执行字段提取</span>
                </div>
              </Space>
            </div>

            <div class="pt-2">
              <Button
                type="primary"
                size="large"
                :loading="isRunning"
                @click="handleRun"
              >
                <Icon icon="lucide:play" class="mr-2 size-5" />
                开始运行测试
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <!-- 结果区 -->
      <Card
        title="测试结果"
        :bordered="false"
        class="flex flex-1 flex-col overflow-hidden shadow-sm"
      >
        <div class="h-full overflow-auto">
          <Table
            :columns="columns"
            :data-source="results"
            :pagination="false"
            row-key="id"
            v-model:expanded-row-keys="expandedRowKeys"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Badge
                  :status="
                    record.status === 'completed' ? 'success' : 'processing'
                  "
                  :text="record.status === 'completed' ? '完成' : '进行中'"
                />
              </template>
            </template>

            <!-- 展开的页级详情 -->
            <template #expandedRowRender="{ record }">
              <div class="rounded-lg bg-muted/30 p-4">
                <div
                  v-for="page in record.pages"
                  :key="page.pageNo"
                  class="mb-4 rounded border bg-background p-3 last:mb-0"
                >
                  <div class="mb-2 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <Badge
                        :count="page.pageNo"
                        :number-style="{ backgroundColor: '#1890ff' }"
                      />
                      <span class="text-lg font-medium">{{
                        page.classification
                      }}</span>
                      <Tag color="green">
                        置信度 {{ (page.confidence * 100).toFixed(0) }}%
                      </Tag>
                      <Tag>{{ page.pageType }}</Tag>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <div class="mb-1 text-xs text-muted-foreground">
                        OCR 摘要
                      </div>
                      <div
                        class="rounded bg-muted/50 p-2 text-sm text-muted-foreground"
                      >
                        {{ page.ocrSummary }}
                      </div>
                    </div>

                    <div v-if="page.extractedData">
                      <div class="mb-1 text-xs text-muted-foreground">
                        提取结果
                      </div>

                      <div
                        v-if="resultViewMode === 'visual'"
                        class="rounded bg-muted/50 p-2 text-sm"
                      >
                        <div
                          v-for="(value, key) in page.extractedData"
                          :key="key"
                          class="flex justify-between border-b border-dashed py-1 last:border-0"
                        >
                          <span class="text-muted-foreground">{{ key }}:</span>
                          <span class="font-medium">{{ value }}</span>
                        </div>
                      </div>

                      <div
                        v-else
                        class="h-[150px] overflow-hidden rounded border"
                      >
                        <CodeEditor
                          :value="JSON.stringify(page.extractedData, null, 2)"
                          mode="json"
                          readonly
                          class="h-full"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </Table>

          <div
            v-if="results.length === 0 && !isRunning"
            class="py-10 text-center text-muted-foreground"
          >
            暂无测试结果，请上传文件并开始运行
          </div>
        </div>
      </Card>
    </div>
  </div>
</template>

<style scoped>
:deep(.ant-upload.ant-upload-drag) {
  height: 100%;
}
</style>
