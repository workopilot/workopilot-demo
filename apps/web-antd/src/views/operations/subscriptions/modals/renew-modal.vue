<script setup lang="ts">
import type { TenantSubscription } from '#/types/billing';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { message, Modal, Radio, RadioGroup } from 'ant-design-vue';

import { renewSubscriptionApi } from '#/api/billing';

interface Props {
  open?: boolean;
  subscription?: null | TenantSubscription;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  subscription: null,
});

const emit = defineEmits<Emits>();

const loading = ref(false);
const selectedDuration = ref(12); // 默认续订12个月

// 订阅标题
const subscriptionTitle = computed(() => {
  if (!props.subscription) return '';
  return `${props.subscription.tenantName} - ${props.subscription.productName}`;
});

// 当前到期日期
const currentExpiryDate = computed(() => {
  if (!props.subscription) return '';
  return new Date(props.subscription.expiryDate).toLocaleDateString('zh-CN');
});

// 预计新到期日期
const newExpiryDate = computed(() => {
  if (!props.subscription) return '';
  const currentDate = new Date(props.subscription.expiryDate);
  currentDate.setMonth(currentDate.getMonth() + selectedDuration.value);
  return currentDate.toLocaleDateString('zh-CN');
});

// 续订选项
const durationOptions = [
  { label: '3个月', value: 3 },
  { label: '6个月', value: 6 },
  { label: '12个月', value: 12 },
  { label: '24个月', value: 24 },
];

// 关闭弹窗
function handleCancel() {
  emit('update:open', false);
  selectedDuration.value = 12;
}

// 确认续订
async function handleOk() {
  if (!props.subscription) return;

  loading.value = true;
  try {
    await renewSubscriptionApi({
      subscriptionId: props.subscription.id,
      duration: selectedDuration.value,
    });
    message.success('续订成功');
    emit('success');
  } catch (error) {
    message.error('续订失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 监听打开状态，重置选择
watch(
  () => props.open,
  (open) => {
    if (open) {
      selectedDuration.value = 12;
    }
  },
);
</script>

<template>
  <Modal
    :open="open"
    title="续订订阅"
    :confirm-loading="loading"
    width="500px"
    @cancel="handleCancel"
    @ok="handleOk"
  >
    <div v-if="subscription" class="space-y-6 py-4">
      <!-- 订阅信息 -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-muted-foreground">订阅信息</h4>
        <div class="rounded-lg border p-4">
          <div class="text-base font-medium">{{ subscriptionTitle }}</div>
          <div class="mt-2 text-sm text-muted-foreground">
            当前到期日期: {{ currentExpiryDate }}
          </div>
        </div>
      </div>

      <!-- 续订时长 -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-muted-foreground">选择续订时长</h4>
        <RadioGroup
          v-model:value="selectedDuration"
          button-style="solid"
          class="w-full"
        >
          <div class="grid grid-cols-2 gap-2">
            <Radio.Button
              v-for="option in durationOptions"
              :key="option.value"
              :value="option.value"
              class="text-center"
            >
              {{ option.label }}
            </Radio.Button>
          </div>
        </RadioGroup>
      </div>

      <!-- 预计信息 -->
      <div class="space-y-2">
        <h4 class="text-sm font-medium text-muted-foreground">续订后信息</h4>
        <div class="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">续订时长:</span>
            <span class="font-medium">{{ selectedDuration }} 个月</span>
          </div>
          <div class="mt-2 flex items-center justify-between text-sm">
            <span class="text-muted-foreground">新到期日期:</span>
            <span class="font-medium text-blue-600">{{ newExpiryDate }}</span>
          </div>
        </div>
      </div>

      <!-- 提示 -->
      <div
        class="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700"
      >
        <Icon icon="lucide:alert-circle" class="mt-0.5 size-4 flex-shrink-0" />
        <span>续订后，订阅的有效期将从当前到期日期开始延长</span>
      </div>
    </div>
  </Modal>
</template>
