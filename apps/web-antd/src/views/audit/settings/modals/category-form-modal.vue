<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import type { ExpenseCategory } from '#/types/settings';

import { computed, reactive, ref, watch } from 'vue';

import { Form, Input, message, Modal, Select } from 'ant-design-vue';

import {
  createExpenseCategoryApi,
  updateExpenseCategoryApi,
} from '#/api/settings';

const props = defineProps<{
  category: ExpenseCategory | null;
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

const loading = ref(false);

// 表单数据
interface FormData {
  code: string;
  name: string;
  system: string;
  parentId?: string;
}

const formData = reactive<FormData>({
  code: '',
  name: '',
  system: '通用',
  parentId: undefined,
});

const formRef = ref();

// 表单验证规则
const rules: Record<string, Rule[]> = {
  code: [{ required: true, message: '请输入科目编码' }],
  name: [{ required: true, message: '请输入科目名称' }],
  system: [{ required: true, message: '请选择所属系统' }],
};

// 系统选项
const systemOptions = [
  { label: '通用', value: '通用' },
  { label: 'SAP', value: 'SAP' },
  { label: '用友', value: '用友' },
  { label: '金蝶', value: '金蝶' },
];

// 是否为编辑模式
const isEdit = computed(() => !!props.category?.id);

// 是否为添加子科目
const isAddChild = computed(() => !!props.category?.parentId);

// 弹窗标题
const title = computed(() => {
  if (isEdit.value) return '编辑费用科目';
  if (isAddChild.value) return '添加子科目';
  return '新增费用科目';
});

// 监听弹窗打开
watch(
  () => props.open,
  (open) => {
    if (open) {
      if (props.category?.id) {
        // 编辑模式
        formData.code = props.category.code;
        formData.name = props.category.name;
        formData.system = props.category.system;
        formData.parentId = props.category.parentId;
      } else if (props.category?.parentId) {
        // 添加子科目
        formRef.value?.resetFields();
        formData.code = '';
        formData.name = '';
        formData.system = '通用';
        formData.parentId = props.category.parentId;
      } else {
        // 新增模式
        formRef.value?.resetFields();
        formData.code = '';
        formData.name = '';
        formData.system = '通用';
        formData.parentId = undefined;
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
      system: formData.system,
      parentId: formData.parentId,
      aliases: [],
    };

    if (isEdit.value && props.category?.id) {
      await updateExpenseCategoryApi(props.category.id, data);
      message.success('更新成功');
    } else {
      await createExpenseCategoryApi(data);
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
    width="500px"
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
      <Form.Item label="科目编码" name="code">
        <Input
          v-model:value="formData.code"
          placeholder="如: 6601"
          :disabled="isEdit"
        />
      </Form.Item>

      <Form.Item label="科目名称" name="name">
        <Input v-model:value="formData.name" placeholder="如: 交通费" />
      </Form.Item>

      <Form.Item label="所属系统" name="system">
        <Select v-model:value="formData.system" :options="systemOptions" />
      </Form.Item>
    </Form>
  </Modal>
</template>
