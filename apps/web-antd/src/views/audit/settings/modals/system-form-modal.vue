<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import type {
  AuthConfig,
  AuthType,
  SourceSystem,
  SystemVendor,
} from '#/types/settings';

import { computed, reactive, ref, watch } from 'vue';

import { Form, Input, message, Modal, Radio, Select } from 'ant-design-vue';

import { createSourceSystemApi, updateSourceSystemApi } from '#/api/settings';

const props = defineProps<{
  open: boolean;
  system: null | SourceSystem;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const loading = ref(false);

// 表单数据
interface FormData {
  name: string;
  code: string;
  vendor: SystemVendor;
  baseUrl: string;
  authType: AuthType;
  username?: string;
  password?: string;
  clientId?: string;
  clientSecret?: string;
  tokenUrl?: string;
}

const formData = reactive<FormData>({
  name: '',
  code: '',
  vendor: 'SAP',
  baseUrl: '',
  authType: 'Basic',
  username: '',
  password: '',
});

// 表单引用
const formRef = ref();

// 表单验证规则
const rules: Record<string, Rule[]> = {
  name: [{ required: true, message: '请输入系统名称' }],
  code: [{ required: true, message: '请输入系统编码' }],
  vendor: [{ required: true, message: '请选择厂商类型' }],
  baseUrl: [
    { required: true, message: '请输入Base URL' },
    { type: 'url', message: '请输入有效的URL' },
  ],
  authType: [{ required: true, message: '请选择鉴权方式' }],
  username: [
    {
      validator: (_rule: any, value: string) => {
        if (formData.authType === 'Basic' && !value) {
          return Promise.reject(new Error('请输入用户名'));
        }
        return Promise.resolve();
      },
    },
  ],
  password: [
    {
      validator: (_rule: any, value: string) => {
        if (formData.authType === 'Basic' && !value) {
          return Promise.reject(new Error('请输入密码'));
        }
        return Promise.resolve();
      },
    },
  ],
  clientId: [
    {
      validator: (_rule: any, value: string) => {
        if (formData.authType === 'OAuth' && !value) {
          return Promise.reject(new Error('请输入Client ID'));
        }
        return Promise.resolve();
      },
    },
  ],
  clientSecret: [
    {
      validator: (_rule: any, value: string) => {
        if (formData.authType === 'OAuth' && !value) {
          return Promise.reject(new Error('请输入Client Secret'));
        }
        return Promise.resolve();
      },
    },
  ],
  tokenUrl: [
    {
      validator: (_rule: any, value: string) => {
        if (formData.authType === 'OAuth' && !value) {
          return Promise.reject(new Error('请输入Token URL'));
        }
        return Promise.resolve();
      },
    },
  ],
};

// 厂商选项
const vendorOptions = [
  { label: 'SAP', value: 'SAP' },
  { label: '用友', value: 'Yonyou' },
  { label: '金蝶', value: 'Kingdee' },
  { label: '自研', value: 'Custom' },
];

// 是否为编辑模式
const isEdit = computed(() => !!props.system);

// 弹窗标题
const title = computed(() => (isEdit.value ? '编辑系统' : '新增系统'));

// 监听弹窗打开,初始化表单数据
watch(
  () => props.open,
  (open) => {
    if (open) {
      if (props.system) {
        // 编辑模式:填充现有数据
        formData.name = props.system.name;
        formData.code = props.system.code;
        formData.vendor = props.system.vendor;
        formData.baseUrl = props.system.baseUrl;
        formData.authType = props.system.authConfig.type;

        if (props.system.authConfig.type === 'Basic') {
          formData.username = props.system.authConfig.username;
          formData.password = props.system.authConfig.password;
        } else {
          formData.clientId = props.system.authConfig.clientId;
          formData.clientSecret = props.system.authConfig.clientSecret;
          formData.tokenUrl = props.system.authConfig.tokenUrl;
        }
      } else {
        // 新增模式:重置表单
        formRef.value?.resetFields();
        formData.name = '';
        formData.code = '';
        formData.vendor = 'SAP';
        formData.baseUrl = '';
        formData.authType = 'Basic';
        formData.username = '';
        formData.password = '';
        formData.clientId = '';
        formData.clientSecret = '';
        formData.tokenUrl = '';
      }
    }
  },
);

// 处理鉴权类型切换
function handleAuthTypeChange(type: AuthType) {
  formData.authType = type;
  // 清空另一种鉴权方式的字段
  if (type === 'Basic') {
    formData.clientId = '';
    formData.clientSecret = '';
    formData.tokenUrl = '';
  } else {
    formData.username = '';
    formData.password = '';
  }
}

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value?.validate();

    loading.value = true;

    // 构建鉴权配置
    const authConfig: AuthConfig =
      formData.authType === 'Basic'
        ? {
            type: 'Basic',
            username: formData.username!,
            password: formData.password!,
          }
        : {
            type: 'OAuth',
            clientId: formData.clientId!,
            clientSecret: formData.clientSecret!,
            tokenUrl: formData.tokenUrl!,
          };

    const data = {
      name: formData.name,
      code: formData.code,
      vendor: formData.vendor,
      baseUrl: formData.baseUrl,
      authConfig,
      status: 'enabled' as const,
    };

    if (isEdit.value && props.system) {
      await updateSourceSystemApi(props.system.id, data);
      message.success('更新成功');
    } else {
      await createSourceSystemApi(data);
      message.success('新增成功');
    }

    emit('success');
  } catch (error: any) {
    if (error.errorFields) {
      // 表单验证失败
      return;
    }
    message.error(isEdit.value ? '更新失败' : '新增失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 关闭弹窗
function handleCancel() {
  emit('update:open', false);
}
</script>

<template>
  <Modal
    :open="open"
    :title="title"
    :confirm-loading="loading"
    ok-text="保存"
    cancel-text="取消"
    width="600px"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      layout="vertical"
      class="mt-4"
    >
      <Form.Item label="系统名称" name="name">
        <Input v-model:value="formData.name" placeholder="如: SAP Fiori" />
      </Form.Item>

      <Form.Item label="系统编码" name="code">
        <Input
          v-model:value="formData.code"
          placeholder="如: sap_fiori_hq"
          :disabled="isEdit"
        />
      </Form.Item>

      <Form.Item label="厂商类型" name="vendor">
        <Select v-model:value="formData.vendor" :options="vendorOptions" />
      </Form.Item>

      <Form.Item label="Base URL" name="baseUrl">
        <Input
          v-model:value="formData.baseUrl"
          placeholder="https://api.example.com"
        />
      </Form.Item>

      <Form.Item label="鉴权方式" name="authType">
        <Radio.Group
          v-model:value="formData.authType"
          @change="handleAuthTypeChange"
        >
          <Radio value="Basic">Basic Auth</Radio>
          <Radio value="OAuth">OAuth 2.0</Radio>
        </Radio.Group>
      </Form.Item>

      <!-- Basic Auth 字段 -->
      <template v-if="formData.authType === 'Basic'">
        <Form.Item label="用户名" name="username">
          <Input v-model:value="formData.username" placeholder="请输入用户名" />
        </Form.Item>

        <Form.Item label="密码" name="password">
          <Input.Password
            v-model:value="formData.password"
            placeholder="请输入密码"
          />
        </Form.Item>
      </template>

      <!-- OAuth 字段 -->
      <template v-else-if="formData.authType === 'OAuth'">
        <Form.Item label="Client ID" name="clientId">
          <Input
            v-model:value="formData.clientId"
            placeholder="请输入Client ID"
          />
        </Form.Item>

        <Form.Item label="Client Secret" name="clientSecret">
          <Input.Password
            v-model:value="formData.clientSecret"
            placeholder="请输入Client Secret"
          />
        </Form.Item>

        <Form.Item label="Token URL" name="tokenUrl">
          <Input
            v-model:value="formData.tokenUrl"
            placeholder="https://auth.example.com/oauth/token"
          />
        </Form.Item>
      </template>
    </Form>
  </Modal>
</template>
