<script setup lang="ts">
import type {
  Tenant,
  TenantIndustry,
  TenantSize,
  TenantStatus,
} from '#/types/tenant';

import { computed, reactive, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Drawer, Form, Input, message, Select } from 'ant-design-vue';

import { createTenantApi, updateTenantApi } from '#/api/tenant';
import {
  TenantIndustryMap,
  TenantSizeMap,
  TenantStatusMap,
} from '#/types/tenant';

interface Props {
  open: boolean;
  tenant: null | Tenant;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const isEdit = computed(() => props.tenant !== null);
const drawerTitle = computed(() => (isEdit.value ? '编辑租户' : '新增租户'));

// 表单数据
const formData = reactive({
  name: '',
  code: '',
  industry: 'technology' as TenantIndustry,
  size: 'medium' as TenantSize,
  contact: '',
  phone: '',
  email: '',
  address: '',
  status: 'active' as TenantStatus,
  subscriptionCount: 0,
  expiryDate: '',
});

// 表单引用
const formRef = ref();
const loading = ref(false);

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入租户名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入租户编码', trigger: 'blur' }],
  industry: [{ required: true, message: '请选择所属行业', trigger: 'change' }],
  size: [{ required: true, message: '请选择企业规模', trigger: 'change' }],
  contact: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    {
      pattern: /^[\d-]+$/,
      message: '请输入有效的电话号码',
      trigger: 'blur',
    },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    {
      type: 'email',
      message: '请输入有效的邮箱地址',
      trigger: 'blur',
    },
  ],
  address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }],
  expiryDate: [
    { required: true, message: '请选择到期时间', trigger: 'change' },
  ],
};

// 监听弹窗打开状态，重置表单或填充数据
watch(
  () => props.open,
  (val) => {
    if (val) {
      if (props.tenant) {
        // 编辑模式：填充数据
        Object.assign(formData, {
          name: props.tenant.name,
          code: props.tenant.code,
          industry: props.tenant.industry,
          size: props.tenant.size,
          contact: props.tenant.contact,
          phone: props.tenant.phone,
          email: props.tenant.email,
          address: props.tenant.address,
          status: props.tenant.status,
          subscriptionCount: props.tenant.subscriptionCount,
          expiryDate: props.tenant.expiryDate,
        });
      } else {
        // 新增模式：重置表单
        resetForm();
      }
    }
  },
);

// 重置表单
function resetForm() {
  Object.assign(formData, {
    name: '',
    code: '',
    industry: 'technology',
    size: 'medium',
    contact: '',
    phone: '',
    email: '',
    address: '',
    status: 'active',
    subscriptionCount: 0,
    expiryDate: '',
  });
  formRef.value?.clearValidate();
}

// 关闭抽屉
function handleCancel() {
  emit('update:open', false);
  resetForm();
}

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value?.validate();
    loading.value = true;

    if (isEdit.value && props.tenant) {
      // 编辑租户
      await updateTenantApi(props.tenant.id, formData);
      message.success('更新成功');
    } else {
      // 新增租户
      await createTenantApi(formData);
      message.success('创建成功');
    }

    emit('success');
  } catch (error: any) {
    if (error.errorFields) {
      // 表单验证错误
      return;
    }
    message.error(isEdit.value ? '更新失败' : '创建失败');
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
    placement="right"
    :width="600"
    @close="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
      class="mt-4"
    >
      <div class="grid grid-cols-2 gap-4">
        <!-- 租户名称 -->
        <Form.Item label="租户名称" name="name">
          <Input v-model:value="formData.name" placeholder="请输入租户名称" />
        </Form.Item>

        <!-- 租户编码 -->
        <Form.Item label="租户编码" name="code">
          <Input
            v-model:value="formData.code"
            placeholder="请输入租户编码（如：SZKC001）"
            :disabled="isEdit"
          />
        </Form.Item>

        <!-- 所属行业 -->
        <Form.Item label="所属行业" name="industry">
          <Select v-model:value="formData.industry" placeholder="请选择行业">
            <Select.Option
              v-for="(label, value) in TenantIndustryMap"
              :key="value"
              :value="value"
            >
              {{ label }}
            </Select.Option>
          </Select>
        </Form.Item>

        <!-- 企业规模 -->
        <Form.Item label="企业规模" name="size">
          <Select v-model:value="formData.size" placeholder="请选择规模">
            <Select.Option
              v-for="(label, value) in TenantSizeMap"
              :key="value"
              :value="value"
            >
              {{ label }}
            </Select.Option>
          </Select>
        </Form.Item>

        <!-- 联系人 -->
        <Form.Item label="联系人" name="contact">
          <Input v-model:value="formData.contact" placeholder="请输入联系人" />
        </Form.Item>

        <!-- 联系电话 -->
        <Form.Item label="联系电话" name="phone">
          <Input v-model:value="formData.phone" placeholder="请输入联系电话" />
        </Form.Item>

        <!-- 邮箱 -->
        <Form.Item label="邮箱" name="email" class="col-span-2">
          <Input v-model:value="formData.email" placeholder="请输入邮箱" />
        </Form.Item>

        <!-- 地址 -->
        <Form.Item label="地址" name="address" class="col-span-2">
          <Input v-model:value="formData.address" placeholder="请输入地址" />
        </Form.Item>

        <!-- 状态 -->
        <Form.Item label="状态" name="status">
          <Select v-model:value="formData.status" placeholder="请选择状态">
            <Select.Option
              v-for="(label, value) in TenantStatusMap"
              :key="value"
              :value="value"
            >
              {{ label }}
            </Select.Option>
          </Select>
        </Form.Item>

        <!-- 到期时间 -->
        <Form.Item label="到期时间" name="expiryDate">
          <Input
            v-model:value="formData.expiryDate"
            type="date"
            placeholder="请选择到期时间"
          />
        </Form.Item>
      </div>
    </Form>

    <div class="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
      <div class="flex justify-end gap-2">
        <Button @click="handleCancel">取消</Button>
        <Button type="primary" :loading="loading" @click="handleSubmit">
          <Icon icon="lucide:check" class="mr-1 size-4" />
          确定
        </Button>
      </div>
    </div>
  </Drawer>
</template>
