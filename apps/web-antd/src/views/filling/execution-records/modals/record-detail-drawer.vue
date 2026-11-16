<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Descriptions,
  Drawer,
  message,
  Spin,
  Steps,
  Tag,
} from 'ant-design-vue';

// 类型定义
interface ExecutionRecordDetail {
  id: string;
  taskNumber: string;
  executorName: string;
  executorCode: string;
  status: 'cancelled' | 'completed' | 'failed' | 'pending' | 'running';
  submitTime: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  formData: string;
  targetSystem: string;
  errorMessage?: string;
  steps: ExecutionStep[];
}

interface ExecutionStep {
  id: string;
  title: string;
  status: 'error' | 'finish' | 'process' | 'wait';
  description: string;
  timestamp?: string;
  details?: any;
}

const props = defineProps<{
  open: boolean;
  recordId: null | string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const recordDetail = ref<ExecutionRecordDetail | null>(null);

// 状态映射
const statusMap: Record<string, { color: string; text: string }> = {
  pending: { text: '等待中', color: 'default' },
  running: { text: '执行中', color: 'processing' },
  completed: { text: '已完成', color: 'success' },
  failed: { text: '失败', color: 'error' },
  cancelled: { text: '已取消', color: 'warning' },
};

// 步骤类型映射
const stepTypeMap: Record<string, { icon: string }> = {
  queue: { icon: 'lucide:clock' },
  init: { icon: 'lucide:play' },
  login: { icon: 'lucide:log-in' },
  navigate: { icon: 'lucide:navigation' },
  parse: { icon: 'lucide:file-text' },
  fill: { icon: 'lucide:edit-3' },
  submit: { icon: 'lucide:send' },
  complete: { icon: 'lucide:check-circle' },
};

const title = computed(() => {
  if (!recordDetail.value) return '执行记录详情';
  return `${recordDetail.value.taskNumber}`;
});

// 格式化时间
function formatTime(time: string) {
  return new Date(time).toLocaleString('zh-CN');
}

// 格式化耗时
function formatDuration(seconds: number) {
  if (seconds < 60) return `${seconds}秒`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}分${remainingSeconds}秒`;
}

// 获取当前步骤
const currentStep = computed(() => {
  if (!recordDetail.value) return 0;
  const steps = recordDetail.value.steps || [];
  return steps.filter((s) => s.status === 'finish' || s.status === 'error')
    .length;
});

// 获取记录详情
async function fetchRecordDetail() {
  if (!props.recordId) return;

  loading.value = true;
  try {
    // 模拟数据
    await new Promise((resolve) => setTimeout(resolve, 500));

    recordDetail.value = {
      id: props.recordId,
      taskNumber: 'TASK-20250319-001',
      executorName: '生产环境执行器-01',
      executorCode: 'EXEC-PROD-001',
      status: 'completed',
      submitTime: '2025-03-19 10:15:00',
      startTime: '2025-03-19 10:15:05',
      endTime: '2025-03-19 10:17:30',
      duration: 147,
      formData: '差旅报销单-北京出差',
      targetSystem: 'SAP S/4HANA (总部)',
      steps: [
        {
          id: '1',
          title: '任务排队',
          status: 'finish',
          description: '任务已进入执行器队列\n队列位置: 第 1 位\n等待时间: 5秒',
          timestamp: '2025-03-19 10:15:00',
        },
        {
          id: '2',
          title: '初始化执行环境',
          status: 'finish',
          description:
            '✓ 成功启动 Playwright 环境\n✓ 创建浏览器上下文\n✓ 加载执行器配置\n✓ 准备目标系统凭证',
          timestamp: '2025-03-19 10:15:05',
        },
        {
          id: '3',
          title: '解析填报指令',
          status: 'finish',
          description:
            '从自然语言中提取实体：\n- 表单类型: 差旅报销单\n- 出差地点: 北京\n- 费用类型: 交通费\n- 其他信息: 单程往返',
          timestamp: '2025-03-19 10:15:10',
        },
        {
          id: '4',
          title: '登录目标系统',
          status: 'finish',
          description:
            '正在访问 SAP S/4HANA (总部)...\n✓ 页面加载完成 (1.2s)\n✓ 定位登录表单\n✓ 自动填充用户名密码\n✓ 提交登录请求',
          timestamp: '2025-03-19 10:15:20',
        },
        {
          id: '5',
          title: '导航到填报表单',
          status: 'finish',
          description:
            '导航至报销单创建页面\n✓ 定位菜单项: 财务会计 → 费用报销 → 差旅报销\n✓ 点击新建按钮\n✓ 等待表单渲染',
          timestamp: '2025-03-19 10:15:35',
        },
        {
          id: '6',
          title: '智能字段填充',
          status: 'finish',
          description:
            '根据提取的实体自动填充表单字段：\n\n✓ 报销类型: 差旅报销\n✓ 出发地: 上海\n✓ 目的地: 北京\n✓ 出发日期: 2025-03-15\n✓ 交通工具: 飞机\n✓ 票价: 1500.00 元',
          timestamp: '2025-03-19 10:16:10',
        },
        {
          id: '7',
          title: '提交表单',
          status: 'finish',
          description:
            '执行表单提交操作\n✓ 检查必填字段\n✓ 点击提交按钮\n✓ 等待系统响应\n✓ 提交成功\n\n生成单据编号: SAP-20250319-001234',
          timestamp: '2025-03-19 10:17:00',
        },
        {
          id: '8',
          title: '执行完成',
          status: 'finish',
          description:
            '✓ 表单提交成功\n✓ 获取单据编号: SAP-20250319-001234\n✓ 保存执行快照\n✓ 关闭浏览器会话',
          timestamp: '2025-03-19 10:17:30',
        },
      ],
    };
  } catch (error) {
    message.error('获取执行记录详情失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit('update:open', false);
  recordDetail.value = null;
}

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      fetchRecordDetail();
    }
  },
);
</script>

<template>
  <Drawer
    :open="open"
    :title="title"
    width="800"
    placement="right"
    :closable="true"
    @close="handleClose"
  >
    <Spin :spinning="loading" tip="加载中...">
      <div v-if="recordDetail" class="space-y-6">
        <!-- 基本信息 -->
        <div>
          <h3 class="mb-3 font-semibold text-gray-900">基本信息</h3>
          <Descriptions bordered :column="2" size="small">
            <Descriptions.Item label="任务编号">
              <span class="font-mono text-sm">
                {{ recordDetail.taskNumber }}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="执行状态">
              <Tag :color="statusMap[recordDetail.status].color">
                {{ statusMap[recordDetail.status].text }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="执行器">
              {{ recordDetail.executorName }}
            </Descriptions.Item>
            <Descriptions.Item label="执行器编码">
              <Tag color="cyan">{{ recordDetail.executorCode }}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="目标系统">
              <Tag color="blue">{{ recordDetail.targetSystem }}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="表单数据">
              {{ recordDetail.formData }}
            </Descriptions.Item>
            <Descriptions.Item label="提交时间">
              <span class="text-xs">
                {{ formatTime(recordDetail.submitTime) }}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="完成时间" v-if="recordDetail.endTime">
              <span class="text-xs">
                {{ formatTime(recordDetail.endTime) }}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="执行耗时" :span="2">
              <span class="font-mono">
                {{
                  recordDetail.duration
                    ? formatDuration(recordDetail.duration)
                    : '-'
                }}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <!-- 执行步骤 -->
        <div>
          <h3 class="mb-3 font-semibold text-gray-900">执行步骤</h3>
          <Steps
            direction="vertical"
            :current="currentStep"
            size="small"
            class="execution-steps"
          >
            <Steps.Step
              v-for="step in recordDetail.steps"
              :key="step.id"
              :status="step.status as any"
            >
              <template #title>
                <div class="flex items-center gap-2">
                  <Icon
                    v-if="stepTypeMap[step.id]"
                    :icon="stepTypeMap[step.id].icon"
                    class="size-4"
                  />
                  <span class="font-medium">{{ step.title }}</span>
                  <span
                    v-if="step.timestamp"
                    class="ml-2 font-mono text-xs text-gray-400"
                  >
                    {{ step.timestamp }}
                  </span>
                </div>
              </template>
              <template #description>
                <div class="mt-2">
                  <div
                    class="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm leading-relaxed"
                    :class="
                      step.status === 'process'
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : step.status === 'error'
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : ''
                    "
                  >
                    {{ step.description }}
                  </div>
                </div>
              </template>
              <template #icon v-if="step.status === 'process'">
                <Icon icon="lucide:loader-2" class="animate-spin" />
              </template>
              <template #icon v-else-if="step.status === 'error'">
                <Icon icon="lucide:x-circle" />
              </template>
            </Steps.Step>
          </Steps>
        </div>

        <!-- 错误信息 (仅失败时显示) -->
        <div v-if="recordDetail.status === 'failed'">
          <h3 class="mb-3 font-semibold text-red-600">错误信息</h3>
          <div class="rounded-lg border border-red-200 bg-red-50 p-4">
            <p class="text-sm text-red-700">
              {{ recordDetail.errorMessage || '未知错误' }}
            </p>
          </div>
        </div>
      </div>

      <div v-else class="py-8 text-center text-gray-400">暂无数据</div>
    </Spin>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button @click="handleClose">关闭</Button>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
:deep(.execution-steps .ant-steps-item-title) {
  @apply relative -top-1 !font-semibold;
}
</style>
