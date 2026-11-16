<script setup lang="ts">
import type { Product, ProductVersion } from '#/types/billing';

import { computed, reactive, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  DatePicker,
  Drawer,
  Input,
  InputNumber,
  message,
  Radio,
  RadioGroup,
  Select,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { createSubscriptionApi } from '#/api/billing';
import { ProductVersionMap } from '#/types/billing';

interface Props {
  open?: boolean;
  products?: Product[];
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  products: () => [],
});

const emit = defineEmits<Emits>();

const loading = ref(false);
const isManualDateEdit = ref(false); // 标记是否为手动编辑日期

// 表单数据
const formData = reactive({
  tenantId: '',
  tenantName: '',
  productName: '',
  productId: '',
  quantity: 1,
  expiryDate: undefined as any,
  description: '',
});

// 租户选项（从订阅数据中提取的主要租户）
const tenantOptions = [
  { label: '华为技术有限公司', value: 't001', name: '华为技术有限公司' },
  { label: '腾讯科技有限公司', value: 't002', name: '腾讯科技有限公司' },
  {
    label: '阿里巴巴网络技术有限公司',
    value: 't003',
    name: '阿里巴巴网络技术有限公司',
  },
  {
    label: '百度在线网络技术公司',
    value: 't004',
    name: '百度在线网络技术公司',
  },
  {
    label: '京东科技控股有限公司',
    value: 't005',
    name: '京东科技控股有限公司',
  },
  { label: '网易公司', value: 't006', name: '网易公司' },
  { label: '字节跳动有限公司', value: 't007', name: '字节跳动有限公司' },
  { label: '美团公司', value: 't008', name: '美团公司' },
  {
    label: '小米科技有限责任公司',
    value: 't009',
    name: '小米科技有限责任公司',
  },
  {
    label: '滴滴出行科技有限公司',
    value: 't010',
    name: '滴滴出行科技有限公司',
  },
  { label: '拼多多公司', value: 't011', name: '拼多多公司' },
  { label: '快手科技有限公司', value: 't012', name: '快手科技有限公司' },
  { label: '360数字安全集团', value: 't013', name: '360数字安全集团' },
  { label: '顺丰控股有限公司', value: 't014', name: '顺丰控股有限公司' },
  {
    label: '中国平安保险（集团）股份有限公司',
    value: 't015',
    name: '中国平安保险（集团）股份有限公司',
  },
  {
    label: '中国移动通信集团有限公司',
    value: 't016',
    name: '中国移动通信集团有限公司',
  },
  {
    label: '中国电信集团有限公司',
    value: 't017',
    name: '中国电信集团有限公司',
  },
  {
    label: '中国联合网络通信集团有限公司',
    value: 't018',
    name: '中国联合网络通信集团有限公司',
  },
  {
    label: '中国人民保险集团股份有限公司',
    value: 't019',
    name: '中国人民保险集团股份有限公司',
  },
  { label: '国家电网有限公司', value: 't020', name: '国家电网有限公司' },
];

// 产品名称选项（去重）
const productNameOptions = computed(() => {
  const uniqueNames = new Set(props.products.map((p) => p.serviceName));
  return [...uniqueNames].toSorted();
});

// 根据选择的产品名称过滤产品规格
const versionOptions = computed(() => {
  if (!formData.productName) return [];
  return props.products
    .filter((p) => p.serviceName === formData.productName)
    .toSorted((a, b) => {
      const versionOrder: Record<ProductVersion, number> = {
        standard: 1,
        plus: 2,
        pro: 3,
        promax: 4,
      };
      return (versionOrder[a.version] || 0) - (versionOrder[b.version] || 0);
    });
});

// 选中的产品
const selectedProduct = computed(() => {
  return props.products.find((p) => p.id === formData.productId);
});

// 监听产品名称变化，清空版本选择
watch(
  () => formData.productName,
  () => {
    formData.productId = '';
  },
);

// 监听数量变化，自动更新到期日期
watch(
  () => formData.quantity,
  (newQuantity) => {
    // 只有在非手动编辑日期时才自动更新
    if (!isManualDateEdit.value && newQuantity && newQuantity >= 1) {
      formData.expiryDate = dayjs().add(newQuantity, 'month');
    }
  },
  { immediate: true },
);

// 监听打开状态
watch(
  () => props.open,
  (open) => {
    if (open) {
      // 打开时重置手动编辑标志并初始化到期日期
      isManualDateEdit.value = false;
      formData.expiryDate = dayjs().add(formData.quantity, 'month');
    } else {
      resetForm();
    }
  },
);

// 重置表单
function resetForm() {
  isManualDateEdit.value = false;
  Object.assign(formData, {
    tenantId: '',
    tenantName: '',
    productName: '',
    productId: '',
    quantity: 1,
    expiryDate: undefined as any,
    description: '',
  });
  // 触发watch自动设置到期日期
  setTimeout(() => {
    formData.expiryDate = dayjs().add(1, 'month');
  }, 0);
}

// 关闭抽屉
function handleCancel() {
  emit('update:open', false);
}

// 提交表单
async function handleSubmit() {
  if (!formData.tenantId) {
    message.error('请选择租户');
    return;
  }
  if (!formData.productName) {
    message.error('请选择产品名称');
    return;
  }
  if (!formData.productId) {
    message.error('请选择产品规格');
    return;
  }
  if (!formData.quantity || formData.quantity < 1) {
    message.error('请输入有效的订阅数量');
    return;
  }
  if (!formData.expiryDate) {
    message.error('请选择到期日期');
    return;
  }

  loading.value = true;
  try {
    await createSubscriptionApi({
      tenantId: formData.tenantId,
      tenantName: formData.tenantName,
      productId: formData.productId,
      quantity: formData.quantity,
      expiryDate: formData.expiryDate.toISOString(),
    });
    message.success('新增订阅成功');
    emit('success');
  } catch (error) {
    message.error('新增订阅失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 租户选择变化
function handleTenantChange(value: string) {
  const tenant = tenantOptions.find((t) => t.value === value);
  if (tenant) {
    formData.tenantName = tenant.name;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    title="新增订阅"
    :width="650"
    :footer="null"
    :styles="{ body: { paddingBottom: '80px' } }"
    @close="handleCancel"
  >
    <div class="space-y-6 py-4">
      <!-- 租户名称 -->
      <div class="space-y-2">
        <label class="text-sm font-medium">
          <span class="text-red-500">*</span>租户名称
        </label>
        <Select
          v-model:value="formData.tenantId"
          placeholder="请选择租户"
          class="w-full"
          show-search
          :filter-option="
            (input: string, option: any) =>
              option.label.toLowerCase().includes(input.toLowerCase())
          "
          @change="handleTenantChange"
        >
          <Select.Option
            v-for="tenant in tenantOptions"
            :key="tenant.value"
            :value="tenant.value"
            :label="tenant.label"
          >
            {{ tenant.label }}
          </Select.Option>
        </Select>
      </div>

      <!-- 产品名称 -->
      <div class="space-y-2">
        <label class="text-sm font-medium">
          <span class="text-red-500">*</span>产品名称
        </label>
        <Select
          v-model:value="formData.productName"
          placeholder="请选择产品名称"
          class="w-full"
        >
          <Select.Option
            v-for="name in productNameOptions"
            :key="name"
            :value="name"
          >
            {{ name }}
          </Select.Option>
        </Select>
      </div>

      <!-- 产品规格选择（卡片样式） -->
      <div v-if="formData.productName" class="space-y-2">
        <label class="text-sm font-medium">
          <span class="text-red-500">*</span>选择规格
        </label>
        <RadioGroup v-model:value="formData.productId" class="w-full">
          <div class="grid grid-cols-2 gap-3">
            <div
              v-for="option in versionOptions"
              :key="option.id"
              class="cursor-pointer rounded-lg border-2 p-4 transition-colors"
              :class="[
                formData.productId === option.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-border hover:border-blue-300',
              ]"
            >
              <Radio :value="option.id" class="w-full">
                <div class="flex flex-col gap-2">
                  <div class="flex items-center justify-between">
                    <div class="font-medium">
                      {{ ProductVersionMap[option.version] || option.version }}
                    </div>
                    <div class="text-lg font-bold text-green-600">
                      ¥{{ option.price.toLocaleString() }}
                    </div>
                  </div>
                  <div class="text-xs text-muted-foreground">
                    {{ option.versionDescription }}
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-muted-foreground">数量限制:</span>
                    <span class="font-medium">
                      {{
                        option.usageLimit === 999999
                          ? '不限'
                          : option.usageLimit.toLocaleString()
                      }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-muted-foreground">Tokens限制:</span>
                    <span class="font-medium">
                      {{
                        option.tokensLimit === 999999999
                          ? '不限'
                          : option.tokensLimit.toLocaleString()
                      }}
                    </span>
                  </div>
                </div>
              </Radio>
            </div>
          </div>
        </RadioGroup>
      </div>

      <!-- 订阅数量 -->
      <div class="space-y-2">
        <label class="text-sm font-medium">
          <span class="text-red-500">*</span>订阅数量（月）
        </label>
        <InputNumber
          v-model:value="formData.quantity"
          :min="1"
          :precision="0"
          placeholder="请输入订阅月数"
          class="w-full"
        />
      </div>

      <!-- 到期日期（可调整） -->
      <div class="space-y-2">
        <label class="text-sm font-medium">
          <span class="text-red-500">*</span>到期日期
        </label>
        <DatePicker
          v-model:value="formData.expiryDate"
          placeholder="请选择到期日期"
          style="width: 100%"
          :disabled-date="(current: Date) => current && current < new Date()"
          @change="isManualDateEdit = true"
        />
      </div>

      <!-- 订阅说明 -->
      <div class="space-y-2">
        <label class="text-sm font-medium">订阅说明</label>
        <Input.TextArea
          v-model:value="formData.description"
          placeholder="请输入订阅说明（选填）"
          :rows="3"
          :maxlength="200"
          show-count
        />
      </div>

      <!-- 选中产品信息汇总 -->
      <div
        v-if="selectedProduct"
        class="rounded-lg border border-blue-200 bg-blue-50 p-4"
      >
        <div class="flex items-start gap-2">
          <Icon
            icon="lucide:info"
            class="mt-0.5 size-4 flex-shrink-0 text-blue-600"
          />
          <div class="flex-1 text-sm">
            <div class="font-medium text-blue-700">订阅信息确认</div>
            <div class="mt-2 space-y-1 text-blue-600">
              <div>租户: {{ formData.tenantName }}</div>
              <div>
                产品: {{ selectedProduct.serviceName }} -
                {{
                  ProductVersionMap[selectedProduct.version] ||
                  selectedProduct.version
                }}
              </div>
              <div>价格: ¥{{ selectedProduct.price.toLocaleString() }}/月</div>
              <div>数量: {{ formData.quantity }} 个月</div>
              <div>
                到期日期:
                {{
                  formData.expiryDate
                    ? formData.expiryDate.format('YYYY-MM-DD')
                    : ''
                }}
              </div>
              <div>
                数量限制:
                {{
                  selectedProduct.usageLimit === 999999
                    ? '不限'
                    : selectedProduct.usageLimit.toLocaleString()
                }}
                次/月
              </div>
              <div>
                Tokens限制:
                {{
                  selectedProduct.tokensLimit === 999999999
                    ? '不限'
                    : selectedProduct.tokensLimit.toLocaleString()
                }}
                个/月
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 提示 -->
      <div
        class="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700"
      >
        <Icon
          icon="lucide:alert-triangle"
          class="mt-0.5 size-4 flex-shrink-0"
        />
        <span>新增订阅后，租户将可以访问对应的产品服务，订阅到期后自动失效</span>
      </div>
    </div>

    <!-- 底部固定按钮 -->
    <div
      class="absolute bottom-0 left-0 right-0 flex justify-end gap-2 border-t bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
    >
      <Button @click="handleCancel">取消</Button>
      <Button type="primary" :loading="loading" @click="handleSubmit">
        确认订阅
      </Button>
    </div>
  </Drawer>
</template>
