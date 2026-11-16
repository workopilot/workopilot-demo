<script setup lang="ts">
import type { PolicyClause } from '#/types/policy';

import { reactive, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Empty,
  Form,
  Input,
  message,
  Radio,
  Result,
  Steps,
  Upload,
} from 'ant-design-vue';

import { mockDelay } from '#/api/mock-data';
import { createPolicyClauseApi } from '#/api/policy';

const props = defineProps<{
  policyId: string;
}>();

const emit = defineEmits(['finish']);

const currentStep = ref(0);
const loading = ref(false);
const parsing = ref(false);

// Step 1 Data
const uploadState = reactive({
  mode: 'incremental' as 'full' | 'incremental',
  fileList: [] as any[],
});

// Step 2 Data
const parsedClauses = ref<Partial<PolicyClause>[]>([]);
const activeClauseIndex = ref<number>(-1);
const editState = reactive({
  clauseCode: '',
  title: '',
  content: '',
  originalText: '',
});

// Mock Parse Function
async function parseFile() {
  parsing.value = true;
  try {
    await mockDelay(2000);
    // Mock Result
    parsedClauses.value = [
      {
        clauseCode: '4.1',
        title: '第四章 差旅标准',
        content: '<p>员工出差期间，住宿费标准如下...</p>',
        originalText:
          '第四章 差旅标准\n员工出差期间，住宿费标准如下：\n一线城市：800元/天\n二线城市：500元/天',
        source: 'ai',
      },
      {
        clauseCode: '5.1',
        title: '第五章 交通工具',
        content: '<p>原则上应乘坐经济舱...</p>',
        originalText: '第五章 交通工具\n原则上应乘坐经济舱，高铁二等座。',
        source: 'ai',
      },
      {
        clauseCode: '6.1',
        title: '第六章 餐饮补助',
        content: '<p>每日餐饮补助标准为100元。</p>',
        originalText: '第六章 餐饮补助\n每日餐饮补助标准为100元，包干使用。',
        source: 'ai',
      },
    ];
    if (parsedClauses.value.length > 0) {
      handleSelectClause(0);
    }
    currentStep.value = 1;
  } catch {
    message.error('解析失败');
  } finally {
    parsing.value = false;
  }
}

function handleBeforeUpload(file: File) {
  uploadState.fileList = [file];
  return false;
}

function handleNextStep1() {
  if (uploadState.fileList.length === 0) {
    message.warning('请先选择文件');
    return;
  }
  parseFile();
}

function handleSelectClause(index: number) {
  activeClauseIndex.value = index;
  const clause = parsedClauses.value[index];
  if (clause) {
    editState.clauseCode = clause.clauseCode || '';
    editState.title = clause.title || '';
    editState.content = clause.content || '';
    editState.originalText = clause.originalText || '';
  }
}

function handleUpdateClause() {
  if (activeClauseIndex.value === -1) return;
  parsedClauses.value[activeClauseIndex.value] = {
    ...parsedClauses.value[activeClauseIndex.value],
    clauseCode: editState.clauseCode,
    title: editState.title,
    content: editState.content,
    originalText: editState.originalText,
  };
  message.success('更新暂存');
}

function handleDeleteClause(index: number) {
  parsedClauses.value.splice(index, 1);
  if (parsedClauses.value.length > 0) {
    handleSelectClause(0);
  } else {
    activeClauseIndex.value = -1;
  }
}

async function handleImport() {
  if (parsedClauses.value.length === 0) {
    message.warning('没有可导入的条款');
    return;
  }
  loading.value = true;
  try {
    // If full coverage, we might need a delete API, but here we just mock add
    for (const clause of parsedClauses.value) {
      await createPolicyClauseApi({
        policyId: props.policyId,
        clauseCode: clause.clauseCode,
        title: clause.title,
        content: clause.content,
        originalText: clause.originalText,
        source: 'ai',
      });
    }
    currentStep.value = 2;
  } catch {
    message.error('导入失败');
  } finally {
    loading.value = false;
  }
}

function handleFinish() {
  emit('finish');
}
</script>

<template>
  <div class="flex h-full flex-col bg-white p-6">
    <div class="mb-8 px-12">
      <Steps :current="currentStep">
        <Steps.Step title="上传文件" description="选择文件与导入方式" />
        <Steps.Step title="解析预览" description="确认AI解析结果" />
        <Steps.Step title="完成导入" description="导入条款库" />
      </Steps>
    </div>

    <!-- Step 1: Upload -->
    <div
      v-if="currentStep === 0"
      class="flex flex-1 flex-col items-center justify-center gap-8"
    >
      <div class="w-[600px] rounded-lg border p-8 shadow-sm">
        <Form layout="vertical">
          <Form.Item label="导入方式" required>
            <Radio.Group v-model:value="uploadState.mode">
              <Radio value="incremental">
                <div class="inline-flex flex-col align-top">
                  <span class="font-bold">增量导入</span>
                  <span class="text-xs text-gray-500">
                    保留现有条款，追加新内容
                  </span>
                </div>
              </Radio>
              <Radio value="full" class="ml-8">
                <div class="inline-flex flex-col align-top">
                  <span class="font-bold">全量覆盖</span>
                  <span class="text-xs text-gray-500">
                    清空现有条款，完全重写
                  </span>
                </div>
              </Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item label="上传文件" required>
            <Upload.Dragger
              name="file"
              :file-list="uploadState.fileList"
              :before-upload="handleBeforeUpload"
              :max-count="1"
              accept=".pdf,.doc,.docx"
              @remove="() => (uploadState.fileList = [])"
            >
              <p class="ant-upload-drag-icon">
                <Icon icon="lucide:upload-cloud" class="inline-block size-10" />
              </p>
              <p class="ant-upload-text">点击或拖拽文件到此处上传</p>
              <p class="ant-upload-hint">支持 PDF, Word 格式文件</p>
            </Upload.Dragger>
          </Form.Item>
        </Form>

        <div class="mt-8 flex justify-end">
          <Button
            type="primary"
            size="large"
            :loading="parsing"
            @click="handleNextStep1"
          >
            开始解析
          </Button>
        </div>
      </div>
    </div>

    <!-- Step 2: Preview & Edit -->
    <div v-if="currentStep === 1" class="flex flex-1 overflow-hidden border">
      <!-- Left: List -->
      <div class="flex w-[300px] flex-col border-r bg-gray-50">
        <div class="border-b p-3 font-bold text-gray-700">
          解析结果 ({{ parsedClauses.length }})
        </div>
        <div class="flex-1 overflow-y-auto p-2">
          <div
            v-for="(clause, index) in parsedClauses"
            :key="index"
            class="mb-3 cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md"
            :class="{
              'border-blue-500 ring-1 ring-blue-500':
                activeClauseIndex === index,
              'border-gray-200': activeClauseIndex !== index,
            }"
            @click="handleSelectClause(index)"
          >
            <div class="mb-1 flex items-center justify-between">
              <span class="font-bold text-gray-800">
                <span v-if="clause.clauseCode" class="mr-1 text-blue-600">
                  {{ clause.clauseCode }}
                </span>
                {{ clause.title }}
              </span>
              <Icon icon="lucide:bot" class="size-4 text-blue-500" />
            </div>
            <div class="line-clamp-2 text-xs text-gray-500">
              {{ clause.content.replace(/<[^>]+>/g, '') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Right: Editor -->
      <div class="flex flex-1 flex-col overflow-hidden">
        <div
          v-if="activeClauseIndex !== -1"
          class="flex flex-1 flex-col overflow-hidden"
        >
          <div class="flex-1 overflow-y-auto p-6">
            <div class="mx-auto max-w-4xl rounded-lg bg-white p-8 shadow-sm">
              <div class="mb-4 flex items-center justify-between border-b pb-4">
                <div class="flex flex-1 items-center gap-2">
                  <span class="font-bold">No.</span>
                  <Input
                    v-model:value="editState.clauseCode"
                    class="w-20 font-bold"
                    placeholder="编号"
                    @change="handleUpdateClause"
                  />
                  <Input
                    v-model:value="editState.title"
                    class="flex-1 text-lg font-bold"
                    placeholder="请输入标题"
                    @change="handleUpdateClause"
                  />
                </div>
                <Icon
                  icon="lucide:trash-2"
                  class="cursor-pointer text-gray-400 hover:text-red-500"
                  @click="handleDeleteClause(activeClauseIndex)"
                />
              </div>

              <div class="mb-2 text-sm text-gray-400">条款正文</div>
              <textarea
                v-model="editState.content"
                class="h-[300px] w-full resize-none rounded border border-gray-200 p-4 focus:border-blue-500 focus:outline-none"
                placeholder="请输入条款内容..."
                @change="handleUpdateClause"
              ></textarea>

              <div class="mb-2 mt-4 text-sm text-gray-400">引用原文</div>
              <textarea
                v-model="editState.originalText"
                class="h-[150px] w-full resize-none rounded border border-gray-200 bg-gray-50 p-4 font-mono text-sm focus:border-blue-500 focus:outline-none"
                placeholder="AI识别的原文片段..."
                @change="handleUpdateClause"
              ></textarea>
            </div>
          </div>
        </div>
        <div
          v-else
          class="flex flex-1 items-center justify-center text-gray-400"
        >
          <Empty description="请选择左侧条款进行校对" />
        </div>

        <!-- Footer Actions -->
        <div class="border-t bg-gray-50 p-4 text-right">
          <Button class="mr-3" @click="currentStep = 0">上一步</Button>
          <Button type="primary" :loading="loading" @click="handleImport">
            确认导入 ({{ parsedClauses.length }}条)
          </Button>
        </div>
      </div>
    </div>

    <!-- Step 3: Result -->
    <div
      v-if="currentStep === 2"
      class="flex flex-1 flex-col items-center justify-center"
    >
      <Result
        status="success"
        title="制度初始化/更新完成"
        sub-title="所有条款已成功导入到条款库中，您可以前往查看和进一步编辑。"
      >
        <template #extra>
          <Button type="primary" @click="handleFinish">前往条款库</Button>
          <Button @click="currentStep = 0">继续上传</Button>
        </template>
      </Result>
    </div>
  </div>
</template>
