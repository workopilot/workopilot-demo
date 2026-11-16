<script setup lang="ts">
import type { FillingLog } from '#/types/filling';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Descriptions,
  Drawer,
  message,
  Spin,
  Tag,
  Timeline,
} from 'ant-design-vue';

import { getFillingLogDetailApi } from '#/api/filling';

const props = defineProps<{
  logId: null | string;
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const logDetail = ref<FillingLog | null>(null);

// 填报状态映射
const statusMap: Record<string, { color: string; text: string }> = {
  success: { text: '成功', color: 'success' },
  failed: { text: '失败', color: 'error' },
};

// 单据状态映射
const billStatusMap: Record<string, { color: string; text: string }> = {
  draft: { text: '草稿', color: 'default' },
  submitted: { text: '已提交', color: 'blue' },
};

// 步骤类型映射
const stepTypeMap: Record<string, { icon: string; text: string }> = {
  login: { icon: 'lucide:log-in', text: '登录' },
  navigate: { icon: 'lucide:navigation', text: '导航' },
  fill: { icon: 'lucide:edit', text: '填写' },
  submit: { icon: 'lucide:send', text: '提交' },
  verify: { icon: 'lucide:check-circle', text: '验证' },
};

const title = computed(() => {
  if (!logDetail.value) return '填报日志详情';
  return `填报日志详情 - ${logDetail.value.billNo}`;
});

// 格式化时间
function formatTime(time: string) {
  return new Date(time).toLocaleString('zh-CN');
}

// 格式化耗时
function formatDuration(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

// 获取日志详情
async function fetchLogDetail() {
  if (!props.logId) return;

  loading.value = true;
  try {
    const response = await getFillingLogDetailApi(props.logId);
    logDetail.value = response.data || null;
  } catch (error) {
    message.error('获取日志详情失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  emit('update:open', false);
  logDetail.value = null;
}

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      fetchLogDetail();
    }
  },
);
</script>

<template>
  <Drawer
    :open="open"
    :title="title"
    width="700"
    placement="right"
    :closable="true"
    @close="handleClose"
  >
    <Spin :spinning="loading" tip="加载中...">
      <div v-if="logDetail" class="space-y-6">
        <!-- 基本信息 -->
        <div>
          <h3 class="mb-3 font-semibold text-foreground">基本信息</h3>
          <Descriptions bordered :column="2" size="small">
            <Descriptions.Item label="单号">
              <span class="font-mono text-sm">{{ logDetail.billNo }}</span>
            </Descriptions.Item>
            <Descriptions.Item label="单据类型">
              <Tag>{{ logDetail.billType }}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="执行脚本">
              <span>{{ logDetail.scriptName }}</span>
            </Descriptions.Item>
            <Descriptions.Item label="目标系统">
              <Tag color="blue">{{ logDetail.systemName }}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="填报状态">
              <Tag :color="statusMap[logDetail.status].color">
                {{ statusMap[logDetail.status].text }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="单据状态">
              <Tag :color="billStatusMap[logDetail.billStatus].color">
                {{ billStatusMap[logDetail.billStatus].text }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="填报人">
              <span>{{ logDetail.filledBy }}</span>
            </Descriptions.Item>
            <Descriptions.Item label="填报时间">
              <span class="text-xs">{{ formatTime(logDetail.filledAt) }}</span>
            </Descriptions.Item>
            <Descriptions.Item label="耗时" :span="2">
              <span class="font-mono">
                {{ formatDuration(logDetail.duration) }}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <!-- 操作步骤 -->
        <div>
          <h3 class="mb-3 font-semibold text-foreground">操作步骤</h3>
          <Timeline>
            <Timeline.Item
              v-for="step in logDetail.steps"
              :key="step.id"
              :color="step.status === 'success' ? 'green' : 'red'"
            >
              <div class="space-y-1">
                <div class="flex items-center gap-2">
                  <Icon
                    :icon="stepTypeMap[step.stepType].icon"
                    class="size-4"
                  />
                  <span class="font-medium">{{ step.stepName }}</span>
                  <Tag :color="statusMap[step.status].color" size="small">
                    {{ statusMap[step.status].text }}
                  </Tag>
                </div>
                <p class="text-sm text-muted-foreground">
                  {{ step.description }}
                </p>
                <div class="text-xs text-muted-foreground">
                  <span>{{ formatTime(step.startTime) }}</span>
                  <span class="mx-1">→</span>
                  <span>{{ formatTime(step.endTime) }}</span>
                  <span class="ml-2">
                    ({{
                      formatDuration(
                        new Date(step.endTime).getTime() -
                          new Date(step.startTime).getTime(),
                      )
                    }})
                  </span>
                </div>

                <!-- 步骤详细信息 -->
                <div
                  v-if="step.details"
                  class="mt-2 rounded-lg border bg-muted/30 p-3"
                >
                  <div v-if="step.details.fields" class="space-y-1 text-sm">
                    <div
                      v-for="field in step.details.fields"
                      :key="field.name"
                      class="flex"
                    >
                      <span class="w-24 flex-shrink-0 font-medium">
                        {{ field.name }}:
                      </span>
                      <span class="font-mono">{{ field.value }}</span>
                    </div>
                  </div>
                  <div v-else class="text-xs">
                    <pre class="whitespace-pre-wrap break-all">{{
                      JSON.stringify(step.details, null, 2)
                    }}</pre>
                  </div>
                </div>
              </div>
            </Timeline.Item>
          </Timeline>
        </div>

        <!-- 错误信息 (仅失败时显示) -->
        <div v-if="logDetail.status === 'failed'">
          <h3 class="mb-3 font-semibold text-destructive">错误信息</h3>
          <div
            class="rounded-lg border border-destructive/50 bg-destructive/10 p-4"
          >
            <p class="text-sm text-destructive">
              {{ logDetail.errorMessage || '未知错误' }}
            </p>
          </div>
        </div>
      </div>

      <div v-else class="py-8 text-center text-muted-foreground">暂无数据</div>
    </Spin>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button @click="handleClose">关闭</Button>
      </div>
    </template>
  </Drawer>
</template>
