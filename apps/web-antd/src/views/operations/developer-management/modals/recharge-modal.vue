<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import type { Developer } from '#/types/developer-management';

import { computed, reactive, ref, watch } from 'vue';

import { Form, FormItem, InputNumber, message, Modal } from 'ant-design-vue';

import { rechargeDeveloperApi } from '#/api/developer-management';

const props = defineProps<{
  developer: Developer | null;
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const formRef = ref();
const submitting = ref(false);

const formData = reactive({
  amount: undefined as number | undefined,
});

const rules: Record<string, Rule[]> = {
  amount: [
    {
      required: true,
      type: 'number',
      min: 1,
      message: '请输入大于 0 的整数',
      trigger: 'change',
    },
  ],
};

// ---------- 数字量级 / 中文读数 工具 ----------

const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];

/** 获取整数的最大单位(个十百千万亿) */
function getMaxUnit(num: number): string {
  const len = String(num).length;
  if (len === 1) return '个';
  if (len === 2) return '十';
  if (len === 3) return '百';
  if (len === 4) return '千';
  if (len <= 8) return '万';
  if (len <= 12) return '亿';
  return '万亿';
}

/** 将 0~9999 的整数转为中文(不含万/亿段单位) */
function sectionToChinese(section: number): string {
  const thousand = Math.floor(section / 1000);
  const hundred = Math.floor((section % 1000) / 100);
  const ten = Math.floor((section % 100) / 10);
  const one = section % 10;

  let res = '';
  if (thousand) res += `${CN_DIGITS[thousand]}千`;
  if (hundred) {
    if (!thousand && res) res += '零';
    res += `${CN_DIGITS[hundred]}百`;
  } else if (thousand && (ten || one)) {
    res += '零';
  }
  if (ten) {
    res += `${CN_DIGITS[ten]}十`;
  } else if (hundred && one) {
    res += '零';
  }
  if (one) res += CN_DIGITS[one];
  return res;
}

/** 将正整数转为中文读数(支持到亿级) */
function numberToChinese(num: number): string {
  if (num === 0) return '零';
  const sections: number[] = [];
  let n = num;
  while (n > 0) {
    sections.push(n % 10_000);
    n = Math.floor(n / 10_000);
  }
  const sectionUnits = ['', '万', '亿', '万亿'];
  let result = '';
  for (let i = sections.length - 1; i >= 0; i--) {
    const sec = sections[i];
    if (sec === 0) continue;
    let part = sectionToChinese(sec);
    // 段间补零:非最高段且千位为 0
    if (result && sec < 1000) {
      part = `零${part}`;
    }
    result += part + sectionUnits[i];
  }
  return result;
}

// 充值额度输入框下方的中文防误提示
const amountHint = computed(() => {
  const v = Number(formData.amount);
  if (!formData.amount || Number.isNaN(v) || v <= 0) return '';
  return `最大单位:${getMaxUnit(v)} · ${numberToChinese(v)}`;
});

// 充值后预计可用 Token
const afterRecharge = computed(() => {
  const base = props.developer?.availableTokens ?? 0;
  const add = Number(formData.amount);
  if (!formData.amount || Number.isNaN(add) || add <= 0) return base;
  return base + add;
});

// 打开时重置表单
watch(
  () => props.open,
  (val) => {
    if (val) {
      formData.amount = undefined;
    }
  },
);

// 千分位格式化
function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

async function handleOk() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  if (!props.developer) return;

  submitting.value = true;
  try {
    await rechargeDeveloperApi(props.developer.id, {
      amount: Number(formData.amount),
    });
    message.success('充值成功');
    emit('success');
    emit('update:open', false);
  } catch (error) {
    console.error(error);
    message.error('充值失败,请重试');
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  emit('update:open', false);
}
</script>

<template>
  <Modal
    :open="open"
    title="Token 充值"
    :width="520"
    ok-text="确认充值"
    cancel-text="取消"
    :confirm-loading="submitting"
    destroy-on-close
    @ok="handleOk"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
      class="pt-2"
    >
      <!-- 租户名称(只读) -->
      <FormItem label="开发者租户名称">
        <div class="rounded-md bg-gray-50 px-3 py-2 text-sm font-medium">
          {{ developer?.tenantName || '-' }}
        </div>
      </FormItem>

      <!-- 当前可用 Token(上下文) -->
      <FormItem label="当前可用 Token">
        <div class="text-sm text-gray-600">
          {{ developer ? formatNumber(developer.availableTokens) : '-' }}
        </div>
      </FormItem>

      <!-- 充值额度 -->
      <FormItem label="充值额度(Token)" name="amount" required>
        <InputNumber
          v-model:value="formData.amount"
          :min="1"
          :precision="0"
          :step="1000"
          :formatter="(v: any) => formatNumber(Number(v))"
          :parser="(v: any) => v.replace(/[^0-9]/g, '')"
          placeholder="请输入充值额度"
          class="w-full"
        />
        <!-- 中文防误提示 -->
        <div
          v-if="amountHint"
          class="mt-1.5 flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs text-blue-600"
        >
          <span class="font-medium">{{ amountHint }}</span>
        </div>
        <!-- 充值后预计 -->
        <div v-if="formData.amount" class="mt-1 text-xs text-gray-400">
          充值后可用:{{ formatNumber(afterRecharge) }} Token
        </div>
      </FormItem>
    </Form>
  </Modal>
</template>
