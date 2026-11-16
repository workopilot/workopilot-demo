<script setup lang="ts">
import type { TenantSubscription } from '#/types/billing';

import { ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { Descriptions, Drawer, message, Progress, Tag } from 'ant-design-vue';

import { getSubscriptionApi } from '#/api/billing';
import { ProductVersionMap } from '#/types/billing';

interface Props {
  open?: boolean;
  subscriptionId?: null | string;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  subscriptionId: null,
});

const emit = defineEmits<Emits>();

const loading = ref(false);
const subscription = ref<null | TenantSubscription>(null);

// 版本颜色映射
const versionColorMap: Record<string, string> = {
  standard: 'blue',
  plus: 'cyan',
  pro: 'purple',
  promax: 'gold',
};

// 状态映射
const statusMap: Record<string, { color: string; text: string }> = {
  active: { text: '有效', color: 'success' },
  expired: { text: '已过期', color: 'default' },
};

// 获取订阅详情
async function fetchSubscriptionDetail() {
  if (!props.subscriptionId) return;

  loading.value = true;
  try {
    const response = await getSubscriptionApi(props.subscriptionId);
    subscription.value = response.data;
  } catch (error) {
    message.error('获取订阅详情失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 关闭抽屉
function handleClose() {
  emit('update:open', false);
}

// 监听打开状态
watch(
  () => props.open,
  (open) => {
    if (open) {
      fetchSubscriptionDetail();
    } else {
      subscription.value = null;
    }
  },
);

// 格式化日期
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString('zh-CN');
}

// 计算使用率
function getUsagePercentage(item: TenantSubscription) {
  return ((item.usedAmount / item.usageLimit) * 100).toFixed(2);
}

// 计算剩余量
function getRemainingAmount(item: TenantSubscription) {
  return item.usageLimit - item.usedAmount;
}

// 获取用量状态
function getUsageStatus(item: TenantSubscription) {
  const percentage = Number(getUsagePercentage(item));
  if (percentage >= 100) return 'exceeded';
  if (percentage >= 90) return 'warning';
  return 'normal';
}

// 获取进度条颜色
function getProgressColor(status: string) {
  if (status === 'exceeded') return '#ff4d4f';
  if (status === 'warning') return '#faad14';
  return '#52c41a';
}
</script>

<template>
  <Drawer
    :open="open"
    title="订阅详情"
    width="600px"
    :loading="loading"
    @close="handleClose"
  >
    <div v-if="subscription" class="space-y-6">
      <!-- 基本信息 -->
      <div>
        <h4 class="mb-4 text-base font-semibold">基本信息</h4>
        <Descriptions bordered :column="1" size="small">
          <Descriptions.Item label="订阅ID">
            <span class="font-mono">{{ subscription.id }}</span>
          </Descriptions.Item>
          <Descriptions.Item label="租户名称">
            {{ subscription.tenantName }}
          </Descriptions.Item>
          <Descriptions.Item label="产品名称">
            {{ subscription.productName }}
            <Tag
              :color="versionColorMap[subscription.productVersion] || 'default'"
              class="ml-2"
            >
              {{
                ProductVersionMap[subscription.productVersion] ||
                subscription.productVersion
              }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="订阅价格">
            <span class="font-mono"
              >¥{{ subscription.price.toLocaleString() }}</span
            >
          </Descriptions.Item>
        </Descriptions>
      </div>

      <!-- 订阅时间 -->
      <div>
        <h4 class="mb-4 text-base font-semibold">订阅时间</h4>
        <Descriptions bordered :column="1" size="small">
          <Descriptions.Item label="订阅日期">
            {{ formatDate(subscription.subscribeDate) }}
          </Descriptions.Item>
          <Descriptions.Item label="到期日期">
            {{ formatDate(subscription.expiryDate) }}
          </Descriptions.Item>
          <Descriptions.Item label="订阅状态">
            <Tag :color="statusMap[subscription.status].color">
              {{ statusMap[subscription.status].text }}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </div>

      <!-- 使用情况 -->
      <div>
        <h4 class="mb-4 text-base font-semibold">使用情况</h4>
        <div class="space-y-4">
          <!-- 用量概况 - 三个卡片 -->
          <div class="flex items-center gap-4">
            <div
              class="flex-1 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4"
            >
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm text-muted-foreground">已使用量</span>
                <Icon icon="lucide:bar-chart-2" class="size-5 text-blue-600" />
              </div>
              <div class="text-2xl font-bold text-blue-700">
                {{ subscription.usedAmount.toLocaleString() }}
              </div>
              <div class="text-xs text-muted-foreground">次</div>
            </div>

            <div
              class="flex-1 rounded-lg border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4"
            >
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm text-muted-foreground">剩余量</span>
                <Icon icon="lucide:database" class="size-5 text-green-600" />
              </div>
              <div class="text-2xl font-bold text-green-700">
                {{ getRemainingAmount(subscription).toLocaleString() }}
              </div>
              <div class="text-xs text-muted-foreground">次</div>
            </div>

            <div
              class="flex-1 rounded-lg border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4"
            >
              <div class="mb-2 flex items-center justify-between">
                <span class="text-sm text-muted-foreground">总限额</span>
                <Icon icon="lucide:target" class="size-5 text-purple-600" />
              </div>
              <div class="text-2xl font-bold text-purple-700">
                {{ subscription.usageLimit.toLocaleString() }}
              </div>
              <div class="text-xs text-muted-foreground">次</div>
            </div>
          </div>

          <!-- 使用率进度条 -->
          <div class="rounded-lg border bg-card p-4">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm font-medium">使用率</span>
              <span
                class="text-2xl font-bold"
                :style="{
                  color: getProgressColor(getUsageStatus(subscription)),
                }"
              >
                {{ getUsagePercentage(subscription) }}%
              </span>
            </div>
            <Progress
              :percent="Number(getUsagePercentage(subscription))"
              :status="
                getUsageStatus(subscription) === 'exceeded'
                  ? 'exception'
                  : getUsageStatus(subscription) === 'warning'
                    ? 'warning'
                    : 'success'
              "
              :stroke-color="getProgressColor(getUsageStatus(subscription))"
              size="small"
            />
          </div>
        </div>
      </div>

      <!-- 元数据 -->
      <div>
        <h4 class="mb-4 text-base font-semibold">元数据</h4>
        <Descriptions bordered :column="1" size="small">
          <Descriptions.Item label="创建时间">
            {{ formatDate(subscription.createdAt) }}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {{ formatDate(subscription.updatedAt) }}
          </Descriptions.Item>
        </Descriptions>
      </div>
    </div>

    <div v-else class="flex h-full items-center justify-center">
      <div class="text-center text-muted-foreground">
        <Icon icon="lucide:inbox" class="mx-auto mb-2 size-12" />
        <p>暂无数据</p>
      </div>
    </div>
  </Drawer>
</template>
