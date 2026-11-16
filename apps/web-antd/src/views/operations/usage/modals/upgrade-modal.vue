<script setup lang="ts">
import type { Product, ProductVersion, UsageMonitor } from '#/types/billing';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { message, Modal, Radio, RadioGroup } from 'ant-design-vue';

import { upgradePackageApi } from '#/api/billing';
import { ProductVersionMap } from '#/types/billing';

const props = withDefaults(defineProps<Props>(), {
  open: false,
  usage: null,
  products: () => [],
});

const emit = defineEmits<Emits>();

// 版本级别（用于比较大小）
const versionLevel: Record<ProductVersion, number> = {
  standard: 1,
  plus: 2,
  pro: 3,
  promax: 4,
};

interface Props {
  open?: boolean;
  usage?: null | UsageMonitor;
  products?: Product[];
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}

const loading = ref(false);
const selectedProductId = ref('');

// 当前产品信息
const currentProduct = computed(() => {
  if (!props.usage) return null;
  return props.products.find((p) => p.id === props.usage?.productId);
});

// 当前版本
const _currentVersion = computed(() => {
  return props.usage?.productVersion || 'standard';
});

// 可升级的产品列表（仅显示同服务名称的高版本）
const upgradeOptions = computed(() => {
  if (!props.usage || props.products.length === 0) return [];

  const currentServiceName = props.usage?.productName || '';

  // 获取同服务名称的产品，只显示比当前版本高的
  const currentLevel =
    versionLevel[props.usage?.productVersion as ProductVersion] || 0;

  return props.products
    .filter((p) => p.serviceName === currentServiceName)
    .filter((p) => (versionLevel[p.version] || 0) > currentLevel)
    .toSorted(
      (a, b) => (versionLevel[a.version] || 0) - (versionLevel[b.version] || 0),
    )
    .map((p) => ({
      ...p,
      isCurrent: p.id === props.usage?.productId,
    }));
});

// 选中的目标产品
const selectedTargetProduct = computed(() => {
  return props.products.find((p) => p.id === selectedProductId.value);
});

// 价格差异
const priceDiff = computed(() => {
  if (!selectedTargetProduct.value || !currentProduct.value) return 0;
  return selectedTargetProduct.value.price - currentProduct.value.price;
});

// 升级后的用量限制
const newUsageLimit = computed(() => {
  return selectedTargetProduct.value?.usageLimit || 0;
});

// 关闭弹窗
function handleCancel() {
  emit('update:open', false);
  selectedProductId.value = '';
}

// 确认升级
async function handleOk() {
  if (!props.usage || !selectedProductId.value) {
    message.error('请选择要升级的套餐');
    return;
  }

  loading.value = true;
  try {
    await upgradePackageApi({
      subscriptionId: props.usage.subscriptionId,
      targetProductId: selectedProductId.value,
    });
    message.success('升级成功');
    emit('success');
  } catch (error) {
    message.error('升级失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 监听打开状态，自动选中第一个可升级选项
watch(
  () => props.open,
  (open) => {
    if (open && upgradeOptions.value.length > 0) {
      // 自动选中第一个可升级选项
      selectedProductId.value = upgradeOptions.value[0].id;
    } else if (!open) {
      selectedProductId.value = '';
    }
  },
);
</script>

<template>
  <Modal
    :open="open"
    title="升级套餐"
    :confirm-loading="loading"
    width="600px"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <div v-if="usage" class="space-y-6 py-4">
      <!-- 当前套餐信息 -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-muted-foreground">当前套餐</h4>
        <div class="rounded-lg border p-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-base font-medium">{{ usage.productName }}</div>
              <div class="mt-1 text-sm text-muted-foreground">
                {{
                  ProductVersionMap[usage.productVersion as ProductVersion] ||
                  usage.productVersion
                }}
              </div>
            </div>
            <div class="text-right">
              <div class="text-xl font-bold text-blue-600">
                ¥{{ currentProduct?.price.toLocaleString() }}
              </div>
              <div class="mt-1 text-xs text-muted-foreground">
                限额: {{ usage.usageLimit.toLocaleString() }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 升级选项 -->
      <div v-if="upgradeOptions.length > 0" class="space-y-2">
        <h4 class="text-sm font-medium text-muted-foreground">选择升级套餐</h4>
        <RadioGroup v-model:value="selectedProductId" class="w-full">
          <div class="space-y-2">
            <div
              v-for="option in upgradeOptions"
              :key="option.id"
              class="rounded-lg border-2 p-4 transition-colors"
              :class="[
                selectedProductId === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-border hover:border-blue-300',
              ]"
            >
              <Radio :value="option.id" class="w-full">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">
                      {{ option.serviceName }} -
                      {{ ProductVersionMap[option.version] || option.version }}
                    </div>
                    <div class="mt-1 text-xs text-muted-foreground">
                      {{ option.versionDescription }}
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold text-green-600">
                      ¥{{ option.price.toLocaleString() }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      限额: {{ option.usageLimit.toLocaleString() }}
                    </div>
                  </div>
                </div>
              </Radio>
            </div>
          </div>
        </RadioGroup>
      </div>

      <!-- 升级后信息 -->
      <div v-if="selectedTargetProduct" class="space-y-2">
        <h4 class="text-sm font-medium text-muted-foreground">升级后信息</h4>
        <div class="rounded-lg border border-green-200 bg-green-50 p-4">
          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">新套餐价格:</span>
              <span class="font-medium text-green-600">
                ¥{{ selectedTargetProduct.price.toLocaleString() }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">补差价:</span>
              <span
                class="font-medium"
                :class="[priceDiff > 0 ? 'text-red-600' : 'text-green-600']"
              >
                {{ priceDiff > 0 ? '+' : '' }}¥{{ priceDiff.toLocaleString() }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">新用量限额:</span>
              <span class="font-medium">
                {{ newUsageLimit.toLocaleString() }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 提示 -->
      <div
        class="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700"
      >
        <Icon icon="lucide:info" class="mt-0.5 size-4 flex-shrink-0" />
        <span>升级后，您的用量限制将立即更新，价格差将在下次续费时结算</span>
      </div>
    </div>

    <div v-else class="py-8 text-center text-muted-foreground">
      <Icon icon="lucide:info" class="mx-auto mb-2 size-8" />
      <p>暂无可升级的套餐</p>
    </div>
  </Modal>
</template>
