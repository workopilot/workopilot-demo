<script setup lang="ts">
import type { ServiceCallLog } from '#/types/service-log';

import { computed, ref } from 'vue';

import { Button, Descriptions, Drawer, Spin, Tag } from 'ant-design-vue';

import {
  CallStatusColorMap as callStatusColorMap,
  CallStatusMap as callStatusMap,
} from '#/api/service-log';

defineProps<{
  logId: null | string;
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const logDetail = ref<null | ServiceCallLog>(null);

const title = computed(() => {
  if (!logDetail.value) return '服务调用日志详情';
  return `服务调用日志详情 - ${logDetail.value.requestId}`;
});

function handleClose() {
  emit('update:open', false);
  logDetail.value = null;
}

// 暴露设置详情数据的方法,供父组件调用
function setLogDetail(log: ServiceCallLog) {
  logDetail.value = log;
}

defineExpose({
  setLogDetail,
});
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
            <Descriptions.Item label="日志ID">
              <span class="font-mono text-xs">{{ logDetail.id }}</span>
            </Descriptions.Item>

            <Descriptions.Item label="请求ID" :span="1">
              <span class="font-mono text-xs">{{ logDetail.requestId }}</span>
            </Descriptions.Item>

            <Descriptions.Item label="订阅ID">
              <span v-if="logDetail.subscriptionId" class="font-mono text-xs">
                {{ logDetail.subscriptionId }}
              </span>
              <span v-else class="text-muted-foreground">-</span>
            </Descriptions.Item>

            <Descriptions.Item label="租户ID">
              <span class="font-mono text-xs">{{ logDetail.tenantId }}</span>
            </Descriptions.Item>

            <Descriptions.Item label="租户名称">
              {{ logDetail.tenantName || '-' }}
            </Descriptions.Item>

            <Descriptions.Item label="产品ID">
              <span v-if="logDetail.productId" class="font-mono text-xs">
                {{ logDetail.productId }}
              </span>
              <span v-else class="text-muted-foreground">-</span>
            </Descriptions.Item>

            <Descriptions.Item label="产品规格ID">
              <span v-if="logDetail.productSpecId" class="font-mono text-xs">
                {{ logDetail.productSpecId }}
              </span>
              <span v-else class="text-muted-foreground">-</span>
            </Descriptions.Item>

            <Descriptions.Item label="创建时间" :span="2">
              {{ new Date(logDetail.createdAt).toLocaleString('zh-CN') }}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <!-- 服务信息 -->
        <div>
          <h3 class="mb-3 font-semibold text-foreground">服务信息</h3>
          <Descriptions bordered :column="2" size="small">
            <Descriptions.Item label="服务名称" :span="2">
              <span class="font-medium">{{ logDetail.serviceName }}</span>
            </Descriptions.Item>

            <Descriptions.Item label="版本号">
              {{ logDetail.version || '-' }}
            </Descriptions.Item>

            <Descriptions.Item label="业务单号">
              <span v-if="logDetail.documentNo" class="font-mono text-xs">
                {{ logDetail.documentNo }}
              </span>
              <span v-else class="text-muted-foreground">-</span>
            </Descriptions.Item>

            <Descriptions.Item label="调用状态">
              <Tag :color="callStatusColorMap[logDetail.callStatus]">
                {{ callStatusMap[logDetail.callStatus] }}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="调用时间" :span="1">
              {{ new Date(logDetail.callTime).toLocaleString('zh-CN') }}
            </Descriptions.Item>
          </Descriptions>
        </div>

        <!-- 请求信息 -->
        <div>
          <h3 class="mb-3 font-semibold text-foreground">请求信息</h3>
          <Descriptions bordered :column="2" size="small">
            <Descriptions.Item label="请求IP">
              <span v-if="logDetail.requestIp" class="font-mono text-xs">
                {{ logDetail.requestIp }}
              </span>
              <span v-else class="text-muted-foreground">-</span>
            </Descriptions.Item>

            <Descriptions.Item label="请求用户">
              {{ logDetail.requestUser || '-' }}
            </Descriptions.Item>

            <Descriptions.Item label="请求方法">
              <Tag v-if="logDetail.requestMethod" color="blue">
                {{ logDetail.requestMethod }}
              </Tag>
              <span v-else class="text-muted-foreground">-</span>
            </Descriptions.Item>

            <Descriptions.Item label="请求URL" :span="2">
              <span
                v-if="logDetail.requestUrl"
                class="break-all font-mono text-xs"
              >
                {{ logDetail.requestUrl }}
              </span>
              <span v-else class="text-muted-foreground">-</span>
            </Descriptions.Item>
          </Descriptions>

          <!-- 请求头 -->
          <div v-if="logDetail.requestBody" class="mt-3">
            <h4 class="mb-2 text-sm font-medium text-foreground">请求体</h4>
            <div
              class="max-h-60 overflow-auto rounded-lg border bg-muted/30 p-3"
            >
              <pre class="whitespace-pre-wrap break-all text-xs">{{
                typeof logDetail.requestBody === 'string'
                  ? logDetail.requestBody
                  : JSON.stringify(logDetail.requestBody, null, 2)
              }}</pre>
            </div>
          </div>
        </div>

        <!-- 响应信息 -->
        <div>
          <h3 class="mb-3 font-semibold text-foreground">响应信息</h3>
          <Descriptions bordered :column="2" size="small">
            <Descriptions.Item label="响应状态码">
              <Tag
                v-if="logDetail.responseCode"
                :color="logDetail.responseCode < 400 ? 'success' : 'error'"
              >
                {{ logDetail.responseCode }}
              </Tag>
              <span v-else class="text-muted-foreground">-</span>
            </Descriptions.Item>

            <Descriptions.Item label="响应时间">
              <span v-if="logDetail.responseTime" class="font-mono">
                {{ logDetail.responseTime }} ms
              </span>
              <span v-else class="text-muted-foreground">-</span>
            </Descriptions.Item>
          </Descriptions>

          <!-- 响应数据 -->
          <div v-if="logDetail.responseData" class="mt-3">
            <h4 class="mb-2 text-sm font-medium text-foreground">响应数据</h4>
            <div
              class="max-h-60 overflow-auto rounded-lg border bg-muted/30 p-3"
            >
              <pre class="whitespace-pre-wrap break-all text-xs">{{
                JSON.stringify(logDetail.responseData, null, 2)
              }}</pre>
            </div>
          </div>
        </div>

        <!-- 错误信息 (仅失败时显示) -->
        <div v-if="logDetail.callStatus === 'failed'">
          <h3 class="mb-3 font-semibold text-destructive">错误信息</h3>
          <Descriptions bordered :column="1" size="small">
            <Descriptions.Item v-if="logDetail.errorCode" label="错误代码">
              <Tag color="warning">{{ logDetail.errorCode }}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="错误描述">
              <div
                v-if="logDetail.errorMessage"
                class="max-w-[600px] rounded bg-red-50 p-3 text-sm text-red-600"
              >
                {{ logDetail.errorMessage }}
              </div>
              <span v-else class="text-destructive">未知错误</span>
            </Descriptions.Item>
          </Descriptions>
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
