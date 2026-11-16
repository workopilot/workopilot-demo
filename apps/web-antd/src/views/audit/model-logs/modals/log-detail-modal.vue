<script setup lang="ts">
import type { ModelCallLog } from '#/types/model-logs';

import { computed, ref, watch } from 'vue';

import {
  Button,
  Descriptions,
  message,
  Modal,
  Spin,
  Tag,
} from 'ant-design-vue';

import { getModelLogDetailApi } from '#/api/model-logs';

const props = defineProps<{
  logId: null | string;
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const logDetail = ref<ModelCallLog | null>(null);

// 业务类型映射
const businessTypeMap: Record<string, string> = {
  audit: '智能审核',
  chat: '智能问答',
  classification: '附件分类',
  extraction: '信息提取',
  translation: '文本翻译',
  summary: '内容摘要',
};

// 模型级别映射
const modelLevelMap: Record<string, { color: string; text: string }> = {
  base: { text: '基础版', color: 'default' },
  standard: { text: '标准版', color: 'blue' },
  advanced: { text: '高级版', color: 'cyan' },
  enterprise: { text: '企业版', color: 'purple' },
};

// 状态映射
const statusMap: Record<string, { color: string; text: string }> = {
  success: { text: '成功', color: 'success' },
  failed: { text: '失败', color: 'error' },
  timeout: { text: '超时', color: 'warning' },
};

const title = computed(() => {
  if (!logDetail.value) return '日志详情';
  return `日志详情 - ${logDetail.value.requestId}`;
});

async function fetchLogDetail() {
  if (!props.logId) return;

  loading.value = true;
  try {
    const response = await getModelLogDetailApi(props.logId);
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
  <Modal
    :open="open"
    :title="title"
    :footer="null"
    width="800px"
    @cancel="handleClose"
  >
    <Spin :spinning="loading" tip="加载中...">
      <div v-if="logDetail" class="space-y-6">
        <!-- 基本信息 -->
        <div>
          <h3 class="mb-3 font-semibold text-foreground">基本信息</h3>
          <Descriptions bordered :column="2" size="small">
            <Descriptions.Item label="日志ID">
              <span class="font-mono text-xs">{{ logDetail.id }}</span>
            </Descriptions.Item>
            <Descriptions.Item label="请求ID">
              <span class="font-mono text-xs">{{ logDetail.requestId }}</span>
            </Descriptions.Item>
            <Descriptions.Item label="租户ID">
              <span class="font-mono text-xs">{{ logDetail.tenantId }}</span>
            </Descriptions.Item>
            <Descriptions.Item label="用户ID">
              <span class="font-mono text-xs">{{ logDetail.userId }}</span>
            </Descriptions.Item>
            <Descriptions.Item label="业务类型">
              <Tag>{{ businessTypeMap[logDetail.businessType] }}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="业务ID">
              <span v-if="logDetail.businessId" class="font-mono text-xs">
                {{ logDetail.businessId }}
              </span>
              <span v-else class="text-muted-foreground">-</span>
            </Descriptions.Item>
            <Descriptions.Item label="模型级别">
              <Tag :color="modelLevelMap[logDetail.modelLevel].color">
                {{ modelLevelMap[logDetail.modelLevel].text }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="调用状态">
              <Tag :color="statusMap[logDetail.status].color">
                {{ statusMap[logDetail.status].text }}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="请求IP">
              <span class="font-mono text-xs">{{ logDetail.requestIp }}</span>
            </Descriptions.Item>
            <Descriptions.Item label="调用时间">
              {{ new Date(logDetail.calledAt).toLocaleString('zh-CN') }}
            </Descriptions.Item>
            <Descriptions.Item label="耗时">
              <span>{{ logDetail.duration }} ms</span>
            </Descriptions.Item>
            <Descriptions.Item label="费用">
              <span class="font-semibold text-primary">
                ¥{{ logDetail.cost.toFixed(4) }}
              </span>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <!-- Token统计 -->
        <div>
          <h3 class="mb-3 font-semibold text-foreground">Token 统计</h3>
          <Descriptions bordered :column="2" size="small">
            <Descriptions.Item label="输入Token数">
              <span class="font-mono">{{
                logDetail.inputTokens.toLocaleString()
              }}</span>
            </Descriptions.Item>
            <Descriptions.Item label="输出Token数">
              <span class="font-mono">{{
                logDetail.outputTokens.toLocaleString()
              }}</span>
            </Descriptions.Item>
            <Descriptions.Item label="总Token数">
              <span class="font-mono font-semibold">
                {{ logDetail.totalTokens.toLocaleString() }}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="单价">
              <div class="space-y-1 text-xs">
                <div>
                  输入: ¥{{ logDetail.inputTokenPrice.toFixed(6) }}/token
                </div>
                <div>
                  输出: ¥{{ logDetail.outputTokenPrice.toFixed(6) }}/token
                </div>
              </div>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <!-- 提示词内容 -->
        <div>
          <h3 class="mb-3 font-semibold text-foreground">提示词内容</h3>
          <div
            class="max-h-40 overflow-auto rounded-lg border bg-muted/30 p-3 text-sm"
          >
            <pre class="whitespace-pre-wrap break-all">{{
              logDetail.promptContent
            }}</pre>
          </div>
        </div>

        <!-- 响应内容 -->
        <div>
          <h3 class="mb-3 font-semibold text-foreground">响应内容</h3>
          <div
            v-if="logDetail.responseContent"
            class="max-h-40 overflow-auto rounded-lg border bg-muted/30 p-3 text-sm"
          >
            <pre class="whitespace-pre-wrap break-all">{{
              logDetail.responseContent
            }}</pre>
          </div>
          <div
            v-else
            class="rounded-lg border border-dashed p-4 text-center text-muted-foreground"
          >
            无响应内容
          </div>
        </div>

        <!-- 请求参数 -->
        <div>
          <h3 class="mb-3 font-semibold text-foreground">请求参数</h3>
          <div class="max-h-40 overflow-auto rounded-lg border bg-muted/30 p-3">
            <pre class="whitespace-pre-wrap break-all text-xs">{{
              JSON.stringify(logDetail.requestParams, null, 2)
            }}</pre>
          </div>
        </div>

        <!-- 错误信息 (仅失败时显示) -->
        <div v-if="logDetail.status !== 'success'">
          <h3 class="mb-3 font-semibold text-destructive">错误信息</h3>
          <Descriptions bordered :column="1" size="small">
            <Descriptions.Item v-if="logDetail.errorCode" label="错误码">
              <span class="font-mono text-xs">{{ logDetail.errorCode }}</span>
            </Descriptions.Item>
            <Descriptions.Item label="错误描述">
              <span class="text-destructive">{{
                logDetail.errorMessage || '未知错误'
              }}</span>
            </Descriptions.Item>
          </Descriptions>
        </div>

        <!-- 配置ID -->
        <div>
          <h3 class="mb-3 font-semibold text-foreground">配置信息</h3>
          <Descriptions bordered :column="1" size="small">
            <Descriptions.Item label="租户模型配置ID">
              <span class="font-mono text-xs">{{
                logDetail.tenantModelConfigId
              }}</span>
            </Descriptions.Item>
            <Descriptions.Item label="租户厂商配置ID">
              <span class="font-mono text-xs">{{
                logDetail.tenantVendorConfigId
              }}</span>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </div>

      <div v-else class="py-8 text-center text-muted-foreground">暂无数据</div>
    </Spin>

    <template #footer>
      <div class="flex justify-end">
        <Button @click="handleClose">关闭</Button>
      </div>
    </template>
  </Modal>
</template>
