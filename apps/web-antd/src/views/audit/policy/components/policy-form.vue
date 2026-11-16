<script setup lang="ts">
import type { Policy } from '#/types/policy';

import { reactive, ref, watch } from 'vue';

import { Button, Card, Form, Input, message, Switch } from 'ant-design-vue';

import { updatePolicyApi } from '#/api/policy';

const props = defineProps<{
  policy: null | Policy;
}>();

const emit = defineEmits(['update']);

const formRef = ref();
const saving = ref(false);
const formState = reactive<Partial<Policy>>({
  name: '',
  code: '',
  version: '',
  description: '',
  status: 'active',
});

watch(
  () => props.policy,
  (val) => {
    if (val) {
      Object.assign(formState, val);
    }
  },
  { immediate: true },
);

async function handleSave() {
  if (!props.policy) return;
  try {
    await formRef.value?.validate();
    saving.value = true;
    const res = await updatePolicyApi(props.policy.id, formState);
    message.success('保存成功');
    emit('update', res.data);
  } catch (error) {
    console.error(error);
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Card title="基础信息" class="h-full">
    <Form ref="formRef" :model="formState" layout="vertical" class="max-w-2xl">
      <Form.Item
        label="制度名称"
        name="name"
        :rules="[{ required: true, message: '请输入制度名称' }]"
      >
        <Input v-model:value="formState.name" />
      </Form.Item>

      <div class="grid grid-cols-2 gap-4">
        <Form.Item
          label="制度编码"
          name="code"
          :rules="[{ required: true, message: '请输入制度编码' }]"
        >
          <Input v-model:value="formState.code" disabled />
        </Form.Item>
        <Form.Item label="当前版本" name="version">
          <Input v-model:value="formState.version" disabled />
        </Form.Item>
      </div>

      <Form.Item label="状态" name="status">
        <div class="flex items-center gap-2">
          <Switch
            :checked="formState.status === 'active'"
            @update:checked="
              (val) => (formState.status = val ? 'active' : 'inactive')
            "
          />
          <span
            :class="
              formState.status === 'active' ? 'text-green-600' : 'text-gray-500'
            "
          >
            {{ formState.status === 'active' ? '启用中' : '已停用' }}
          </span>
        </div>
      </Form.Item>

      <Form.Item label="备注描述" name="description">
        <Input.TextArea
          v-model:value="formState.description"
          :rows="4"
          show-count
          :maxlength="200"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" :loading="saving" @click="handleSave">
          保存修改
        </Button>
      </Form.Item>
    </Form>
  </Card>
</template>
