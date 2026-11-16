<script setup lang="ts">
import type { Product, ProductVersion, ServiceConfig } from '#/types/billing';

import { computed, reactive, ref, watch } from 'vue';

import {
  Button,
  Divider,
  Drawer,
  Input,
  InputNumber,
  message,
  Radio,
  Select,
} from 'ant-design-vue';

import { createProductApi, updateProductApi } from '#/api/billing';

interface Props {
  open?: boolean;
  product?: null | Product;
  serviceName?: string; // 从左侧选中的服务名称
  serviceList?: ServiceConfig[]; // 服务列表
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  product: null,
  serviceName: '',
  serviceList: () => [],
});

const emit = defineEmits<Emits>();

const isEdit = computed(() => !!props.product);
const drawerTitle = computed(() =>
  isEdit.value ? '编辑产品规格' : '新增产品规格',
);

const loading = ref(false);

// 表单数据
const formData = reactive({
  serviceName: '',
  version: 'standard' as ProductVersion,
  versionDescription: '',
  price: 0,
  usageLimit: 0,
  tokensLimit: 0,
  status: 'enabled' as 'disabled' | 'enabled',
});

// 版本选项
const versionOptions = [
  { label: '标准', value: 'standard' },
  { label: 'Plus', value: 'plus' },
  { label: 'Pro', value: 'pro' },
  { label: 'ProMax', value: 'promax' },
];

// 监听产品和服务名称变化，初始化表单
watch(
  () => [props.product, props.serviceName],
  ([product, serviceName]) => {
    if (product) {
      Object.assign(formData, {
        serviceName: product.serviceName,
        version: product.version,
        versionDescription: product.versionDescription,
        price: product.price,
        usageLimit: product.usageLimit,
        tokensLimit: product.tokensLimit,
        status: product.status,
      });
    } else if (serviceName && serviceName !== '全部服务') {
      // 新增时，使用服务名称（但排除"全部服务"）
      resetForm();
      formData.serviceName = serviceName;
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

// 重置表单
function resetForm() {
  Object.assign(formData, {
    serviceName: '',
    version: 'standard',
    versionDescription: '',
    price: 0,
    usageLimit: 0,
    tokensLimit: 0,
    status: 'enabled',
  });
}

// 关闭抽屉
function handleCancel() {
  emit('update:open', false);
}

// 提交表单
async function handleSubmit() {
  // 验证必填字段
  if (!formData.serviceName?.trim()) {
    message.error('服务名称不能为空');
    return;
  }
  if (!formData.version) {
    message.error('请选择产品规格');
    return;
  }
  if (!formData.price || formData.price <= 0) {
    message.error('请输入有效的单价');
    return;
  }
  if (!formData.usageLimit || formData.usageLimit <= 0) {
    message.error('请输入有效的数量限制');
    return;
  }
  if (!formData.tokensLimit || formData.tokensLimit <= 0) {
    message.error('请输入有效的Tokens限制');
    return;
  }

  loading.value = true;
  try {
    if (isEdit.value && props.product) {
      await updateProductApi(props.product.id, formData);
      message.success('更新成功');
    } else {
      await createProductApi(formData);
      message.success('创建成功');
    }
    emit('success');
  } catch (error: any) {
    message.error(error?.message || (isEdit.value ? '更新失败' : '创建失败'));
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    :title="drawerTitle"
    :width="600"
    :footer="null"
    :styles="{ body: { paddingBottom: '80px' } }"
    @close="handleCancel"
  >
    <div class="space-y-5 py-4">
      <!-- 服务名称 -->
      <div class="flex items-center gap-4">
        <label class="w-32 shrink-0 text-right text-sm font-medium">
          <span class="text-red-500">*</span>服务名称
        </label>
        <Select
          v-model:value="formData.serviceName"
          placeholder="请选择服务名称"
          :disabled="isEdit"
          class="flex-1"
        >
          <Select.Option
            v-for="service in serviceList"
            :key="service.name"
            :value="service.name"
          >
            {{ service.name }}
          </Select.Option>
        </Select>
      </div>

      <!-- 产品规格 -->
      <div class="flex items-center gap-4">
        <label class="w-32 shrink-0 text-right text-sm font-medium">
          <span class="text-red-500">*</span>产品规格
        </label>
        <Select
          v-model:value="formData.version"
          placeholder="请选择规格"
          class="flex-1"
        >
          <Select.Option
            v-for="item in versionOptions"
            :key="item.value"
            :value="item.value"
          >
            {{ item.label }}
          </Select.Option>
        </Select>
      </div>

      <!-- 单价 -->
      <div class="flex items-center gap-4">
        <label class="w-32 shrink-0 text-right text-sm font-medium">
          <span class="text-red-500">*</span>单价（元/月）
        </label>
        <InputNumber
          v-model:value="formData.price"
          :min="0"
          :precision="2"
          placeholder="请输入单价"
          class="flex-1"
        />
      </div>

      <!-- 数量限制 -->
      <div class="flex items-center gap-4">
        <label class="w-32 shrink-0 text-right text-sm font-medium">
          <span class="text-red-500">*</span>数量限制（次/月）
        </label>
        <InputNumber
          v-model:value="formData.usageLimit"
          :min="0"
          :precision="0"
          placeholder="请输入数量限制"
          class="flex-1"
        />
      </div>

      <!-- Tokens限制 -->
      <div class="flex items-center gap-4">
        <label class="w-32 shrink-0 text-right text-sm font-medium">
          <span class="text-red-500">*</span>Tokens限制（个/月）
        </label>
        <InputNumber
          v-model:value="formData.tokensLimit"
          :min="0"
          :precision="0"
          placeholder="请输入Tokens限制"
          class="flex-1"
        />
      </div>

      <!-- 产品描述 -->
      <div class="flex items-start gap-4">
        <label class="w-32 shrink-0 pt-1 text-right text-sm font-medium"
          >产品描述</label
        ><Input.TextArea
          v-model:value="formData.versionDescription"
          placeholder="请输入产品描述"
          :rows="3"
          class="flex-1"
        />
      </div>

      <Divider class="my-4" />

      <!-- 状态：页签类型选项卡样式 -->
      <div class="flex items-center gap-4">
        <label class="w-32 shrink-0 text-right text-sm font-medium">状态</label>
        <Radio.Group
          v-model:value="formData.status"
          button-style="solid"
          class="flex-1"
        >
          <Radio.Button value="enabled" class="w-32">启用</Radio.Button>
          <Radio.Button value="disabled" class="w-32">禁用</Radio.Button>
        </Radio.Group>
      </div>
    </div>

    <!-- 底部固定按钮 -->
    <div
      class="absolute bottom-0 left-0 right-0 flex justify-end gap-2 border-t bg-white p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
    >
      <Button @click="handleCancel">取消</Button>
      <Button type="primary" :loading="loading" @click="handleSubmit">
        保存
      </Button>
    </div>
  </Drawer>
</template>
