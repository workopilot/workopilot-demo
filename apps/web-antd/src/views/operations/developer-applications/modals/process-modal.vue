<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import type { ProcessResult } from '#/types/developer-application';

import { reactive, ref, watch } from 'vue';

import {
  Form,
  FormItem,
  message,
  Modal,
  Radio,
  RadioGroup,
} from 'ant-design-vue';

import { processDeveloperApplicationApi } from '#/api/developer-application';

import RichTextEditor from '../components/RichTextEditor.vue';

const props = defineProps<{
  applicationId: null | string;
  open: boolean;
}>();

const emit = defineEmits<{
  success: [];
  'update:open': [value: boolean];
}>();

interface ProcessForm {
  processResult: ProcessResult;
  processDetail: string;
}

const formRef = ref();
const submitting = ref(false);

const formData = reactive<ProcessForm>({
  processResult: 'approved',
  processDetail: '',
});

// 富文本必填校验:去除 HTML 标签后判断是否为空
const validateDetail = async (_rule: Rule, value: string) => {
  const text = (value || '')
    .replaceAll(/<[^>]+>/g, '')
    .replaceAll('&nbsp;', '')
    .trim();
  if (!text) {
    throw new Error('请输入处理结果');
  }
};

const rules: Record<string, Rule[]> = {
  processResult: [
    { required: true, message: '请选择处理结果', trigger: 'change' },
  ],
  processDetail: [
    { required: true, validator: validateDetail, trigger: 'change' },
  ],
};

// 打开时重置表单
watch(
  () => props.open,
  (val) => {
    if (val) {
      formData.processResult = 'approved';
      formData.processDetail = '';
    }
  },
);

async function handleOk() {
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }
  if (!props.applicationId) return;

  submitting.value = true;
  try {
    await processDeveloperApplicationApi(props.applicationId, {
      processResult: formData.processResult,
      processDetail: formData.processDetail,
    });
    message.success('处理成功');
    emit('success');
    emit('update:open', false);
  } catch (error) {
    console.error(error);
    message.error('处理失败,请重试');
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
    title="申请处理"
    :width="720"
    ok-text="提交处理"
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
      <FormItem label="处理结果状态" name="processResult">
        <RadioGroup v-model:value="formData.processResult">
          <Radio value="approved">通过</Radio>
          <Radio value="rejected">不通过</Radio>
        </RadioGroup>
      </FormItem>

      <FormItem label="处理结果" name="processDetail" required>
        <RichTextEditor v-model="formData.processDetail" />
      </FormItem>
    </Form>
  </Modal>
</template>
