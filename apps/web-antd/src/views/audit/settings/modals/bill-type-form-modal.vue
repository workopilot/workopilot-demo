<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import type { BillType, SourceSystem } from '#/types/settings';

import { computed, reactive, ref, watch } from 'vue';

import { Form, Input, message, Modal, Select, Switch } from 'ant-design-vue';

import {
  createBillTypeApi,
  getSourceSystemsApi,
  updateBillTypeApi,
} from '#/api/settings';

const props = defineProps<{
  billType: BillType | null;
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const loading = ref(false);
const systems = ref<SourceSystem[]>([]);

// 表单数据
interface FormData {
  code: string;
  name: string;
  systemId: string;
  description?: string;
  enabled: boolean;
  urlRegex: string;
}

const formData = reactive<FormData>({
  code: '',
  name: '',
  systemId: '',
  description: '',
  enabled: true,
  urlRegex: '',
});

const formRef = ref();

// 表单验证规则
const rules: Record<string, Rule[]> = {
  code: [{ required: true, message: '请输入单据编码' }],
  name: [{ required: true, message: '请输入单据名称' }],
  systemId: [{ required: true, message: '请选择所属系统' }],
  urlRegex: [
    { required: true, message: '请输入URL匹配正则表达式' },
    {
      validator: (_rule: any, value: string) => {
        try {
          // eslint-disable-next-line no-new
          new RegExp(value);
          return Promise.resolve();
        } catch {
          return Promise.reject(new Error('请输入有效的正则表达式'));
        }
      },
    },
  ],
};

// 是否为编辑模式
const isEdit = computed(() => !!props.billType);

// 弹窗标题
const title = computed(() => (isEdit.value ? '编辑单据类型' : '新增单据类型'));

// 系统选项
const systemOptions = computed(() =>
  systems.value
    .filter((s) => s.status === 'enabled')
    .map((s) => ({
      label: s.name,
      value: s.id,
    })),
);

// 获取系统列表
async function fetchSystems() {
  try {
    const response = await getSourceSystemsApi();
    systems.value = response.data || [];
  } catch (error) {
    console.error(error);
  }
}

// 监听弹窗打开
watch(
  () => props.open,
  (open) => {
    if (open) {
      fetchSystems();

      if (props.billType) {
        // 编辑模式:填充现有数据
        formData.code = props.billType.code;
        formData.name = props.billType.name;
        formData.systemId = props.billType.systemId;
        formData.description = props.billType.description;
        formData.enabled = props.billType.enabled;
        formData.urlRegex = props.billType.urlRegex;
      } else {
        // 新增模式:重置表单
        formRef.value?.resetFields();
        formData.code = '';
        formData.name = '';
        formData.systemId = '';
        formData.description = '';
        formData.enabled = true;
        formData.urlRegex = '';
      }
    }
  },
);

// 提交表单
async function handleSubmit() {
  try {
    await formRef.value?.validate();

    loading.value = true;

    const data = {
      code: formData.code,
      name: formData.name,
      systemId: formData.systemId,
      description: formData.description,
      enabled: formData.enabled,
      urlRegex: formData.urlRegex,
    };

    if (isEdit.value && props.billType) {
      await updateBillTypeApi(props.billType.id, data);
      message.success('更新成功');
    } else {
      await createBillTypeApi(data);
      message.success('新增成功');
    }

    emit('success');
  } catch (error: any) {
    if (error.errorFields) {
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
      <Form.Item label="单据编码" name="code">
        <Input
          v-model:value="formData.code"
          placeholder="如: travel_expense"
          :disabled="isEdit"
        />
      </Form.Item>

      <Form.Item label="单据名称" name="name">
        <Input v-model:value="formData.name" placeholder="如: 差旅费用单" />
      </Form.Item>

      <Form.Item label="所属系统" name="systemId">
        <Select
          v-model:value="formData.systemId"
          placeholder="请选择业务系统"
          :options="systemOptions"
        />
      </Form.Item>

      <Form.Item label="URL 匹配正则" name="urlRegex">
        <Input.TextArea
          v-model:value="formData.urlRegex"
          placeholder="^https://erp\\.example\\.com/bills/travel/.*"
          :rows="3"
        />
        <p class="mt-1 text-xs text-muted-foreground">
          插件会根据此正则表达式自动识别单据类型
        </p>
      </Form.Item>

      <Form.Item label="描述" name="description">
        <Input.TextArea
          v-model:value="formData.description"
          placeholder="请输入单据类型描述(可选)"
          :rows="2"
        />
      </Form.Item>

      <Form.Item label="启用状态" name="enabled">
        <Switch v-model:checked="formData.enabled" />
        <span class="ml-2 text-sm text-muted-foreground">
          {{ formData.enabled ? '已启用' : '已禁用' }}
        </span>
      </Form.Item>
    </Form>
  </Modal>
</template>
