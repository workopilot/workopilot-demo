<script setup lang="ts">
import type { UsageDetail } from '#/types/billing';

import { ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Descriptions,
  Divider,
  Drawer,
  message,
  Progress,
  Tag,
} from 'ant-design-vue';

import { getUsageDetailApi } from '#/api/billing';
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
const usageDetail = ref<null | UsageDetail>(null);

// 版本颜色映射
const versionColorMap: Record<string, string> = {
  standard: 'blue',
  plus: 'cyan',
  pro: 'purple',
  promax: 'gold',
};

// 状态映射
const statusMap: Record<string, { color: string; text: string }> = {
  normal: { text: '正常', color: 'success' },
  warning: { text: '即将超限', color: 'warning' },
  exceeded: { text: '已超限', color: 'error' },
};

// 获取用量详情
async function fetchUsageDetail() {
  if (!props.subscriptionId) return;

  loading.value = true;
  try {
    const response = await getUsageDetailApi(props.subscriptionId);
    usageDetail.value = response.data;
  } catch (error) {
    message.error('获取用量详情失败');
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
      fetchUsageDetail();
    } else {
      usageDetail.value = null;
    }
  },
);

// 格式化日期
function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('zh-CN');
}

// 获取进度条颜色
function getProgressColor(status: string) {
  if (status === 'exceeded') return '#ff4d4f';
  if (status === 'warning') return '#faad14';
  return '#52c41a';
}

// 计算剩余天数
function getRemainingDays(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// 计算日均使用量
function getDailyUsage(usedAmount: number, subscribeDate: string): number {
  const now = new Date();
  const start = new Date(subscribeDate);
  const diffTime = now.getTime() - start.getTime();
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  return Math.round(usedAmount / diffDays);
}
</script>

<template>
  <Drawer
    :open="open"
    title="用量详情"
    width="600px"
    :loading="loading"
    @close="handleClose"
  >
    <div v-if="usageDetail" class="space-y-6">
      <!-- 预警提示 -->
      <div
        v-if="usageDetail.status !== 'normal'"
        class="flex items-start gap-2 rounded-lg border p-3"
        :class="{
          'border-red-200 bg-red-50 text-red-700':
            usageDetail.status === 'exceeded',
          'border-yellow-200 bg-yellow-50 text-yellow-700':
            usageDetail.status === 'warning',
        }"
      >
        <Icon
          :icon="
            usageDetail.status === 'exceeded'
              ? 'lucide:alert-circle'
              : 'lucide:alert-triangle'
          "
          class="mt-0.5 size-5 flex-shrink-0"
        />
        <div class="text-sm">
          <div class="font-medium">
            {{
              usageDetail.status === 'exceeded'
                ? '已超出用量限制'
                : '用量即将超限'
            }}
          </div>
          <div class="mt-1">
            {{
              usageDetail.status === 'exceeded'
                ? '当前使用量已超出限额，请及时升级套餐或联系客服处理'
                : '当前使用量已接近限额，建议及时升级套餐以免影响使用'
            }}
          </div>
        </div>
      </div>

      <!-- 基本信息 -->
      <div>
        <h4 class="mb-4 text-base font-semibold">基本信息</h4>
        <Descriptions bordered :column="1" size="small">
          <Descriptions.Item label="租户名称">
            {{ usageDetail.tenantName }}
          </Descriptions.Item>
          <Descriptions.Item label="产品名称">
            <div class="flex items-center gap-2">
              <span class="font-medium">{{ usageDetail.productName }}</span>
              <Tag
                :color="
                  versionColorMap[usageDetail.productVersion] || 'default'
                "
                size="small"
              >
                {{
                  ProductVersionMap[usageDetail.productVersion] ||
                  usageDetail.productVersion
                }}
              </Tag>
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="订阅日期">
            {{ formatDate(usageDetail.subscribeDate) }}
          </Descriptions.Item>
          <Descriptions.Item label="到期日期">
            {{ formatDate(usageDetail.expiryDate) }}
          </Descriptions.Item>
        </Descriptions>
      </div>

      <!-- 用量概览 -->
      <div>
        <h4 class="mb-4 text-base font-semibold">用量概览</h4>
        <div class="space-y-4 rounded-lg border p-4">
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">使用率</span>
              <span class="text-2xl font-bold"
                >{{ usageDetail.usagePercentage.toFixed(2) }}%</span
              >
            </div>
            <Progress
              :percent="Number(usageDetail.usagePercentage.toFixed(2))"
              :status="
                usageDetail.status === 'exceeded'
                  ? 'exception'
                  : usageDetail.status === 'warning'
                    ? 'warning'
                    : 'success'
              "
              :stroke-color="getProgressColor(usageDetail.status)"
            />
            <div class="flex items-center justify-between">
              <Tag :color="statusMap[usageDetail.status].color">
                {{ statusMap[usageDetail.status].text }}
              </Tag>
            </div>
          </div>

          <Divider class="my-4" />

          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-blue-600">
                {{ usageDetail.usedAmount.toLocaleString() }}
              </div>
              <div class="text-xs text-muted-foreground">已使用</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-green-600">
                {{ usageDetail.remainingAmount.toLocaleString() }}
              </div>
              <div class="text-xs text-muted-foreground">剩余量</div>
            </div>
            <div>
              <div class="text-muted-600 text-2xl font-bold">
                {{
                  usageDetail.usageLimit >= 1000000
                    ? '不限'
                    : usageDetail.usageLimit.toLocaleString()
                }}
              </div>
              <div class="text-xs text-muted-foreground">总限额</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 统计信息 -->
      <div>
        <h4 class="mb-4 text-base font-semibold">统计信息</h4>
        <Descriptions bordered :column="2" size="small">
          <Descriptions.Item label="剩余天数">
            <span
              class="font-medium"
              :class="{
                'text-red-600': getRemainingDays(usageDetail.expiryDate) <= 7,
              }"
            >
              {{ getRemainingDays(usageDetail.expiryDate) }} 天
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="日均使用量">
            <span class="font-medium">
              {{
                getDailyUsage(
                  usageDetail.usedAmount,
                  usageDetail.subscribeDate,
                ).toLocaleString()
              }}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="最后更新">
            {{ new Date(usageDetail.lastUpdated).toLocaleString('zh-CN') }}
          </Descriptions.Item>
          <Descriptions.Item label="预计可用天数">
            <span
              class="font-medium"
              :class="{
                'text-green-600': usageDetail.remainingAmount > 50000,
                'text-yellow-600':
                  usageDetail.remainingAmount > 0 &&
                  usageDetail.remainingAmount <= 50000,
                'text-red-600': usageDetail.remainingAmount <= 0,
              }"
            >
              {{
                usageDetail.remainingAmount > 0
                  ? Math.max(
                      1,
                      Math.floor(
                        usageDetail.remainingAmount /
                          getDailyUsage(
                            usageDetail.usedAmount,
                            usageDetail.subscribeDate,
                          ),
                      ),
                    )
                  : 0
              }}
              天
            </span>
          </Descriptions.Item>
        </Descriptions>
      </div>

      <!-- 使用历史 -->
      <div>
        <h4 class="mb-4 text-base font-semibold">使用历史</h4>
        <div class="space-y-2">
          <div
            v-for="(item, index) in usageDetail.usageHistory"
            :key="index"
            class="flex items-center justify-between rounded-lg border p-3"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex size-8 items-center justify-center rounded-full bg-primary/10"
              >
                <Icon icon="lucide:calendar" class="size-4 text-primary" />
              </div>
              <div>
                <div class="text-sm font-medium">{{ item.date }}</div>
                <div class="text-xs text-muted-foreground">
                  {{ item.description }}
                </div>
              </div>
            </div>
            <div class="font-mono text-sm font-medium">
              {{ item.amount.toLocaleString() }}
            </div>
          </div>
        </div>
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
