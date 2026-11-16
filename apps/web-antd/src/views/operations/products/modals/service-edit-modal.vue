<script setup lang="ts">
import type { ServiceConfig } from '#/types/billing';

import { computed, reactive, ref, watch } from 'vue';

import { Button, Input, message, Modal, Radio } from 'ant-design-vue';

import { updateServiceConfigApi } from '#/api/billing';

interface Props {
  open?: boolean;
  service?: null | ServiceConfig;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  service: null,
});

const emit = defineEmits<Emits>();

const modalTitle = computed(() => '编辑服务配置');

const loading = ref(false);

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  status: 'enabled' as 'disabled' | 'enabled',
});

// 监听服务变化，初始化表单
watch(
  () => props.service,
  (service) => {
    if (service) {
      Object.assign(formData, {
        name: service.name,
        description: service.description,
        status: service.status,
      });
    } else {
      resetForm();
    }
  },
  { immediate: true },
);

// 重置表单
function resetForm() {
  Object.assign(formData, {
    name: '',
    description: '',
    status: 'enabled',
  });
}

// 关闭弹窗
function handleCancel() {
  emit('update:open', false);
}

// 提交表单
async function handleSubmit() {
  // 验证必填字段
  if (!formData.name?.trim()) {
    message.error('请输入服务名称');
    return;
  }

  if (!props.service) {
    message.error('服务信息不存在');
    return;
  }

  loading.value = true;
  try {
    await updateServiceConfigApi(props.service.id, {
      name: formData.name,
      description: formData.description,
      status: formData.status,
    });
    message.success('更新成功');
    emit('success');
  } catch (error) {
    message.error('更新失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Modal
    :open="open"
    :title="modalTitle"
    :width="600"
    :footer="null"
    @cancel="handleCancel"
  >
    <div class="space-y-4 py-4">
      <!-- 服务名称 -->
      <div class="flex items-center">
        <label class="w-24 shrink-0 text-sm font-medium">
          服务名称
          <span class="text-red-500">*</span>
        </label>
        <Input
          v-model:value="formData.name"
          placeholder="请输入服务名称"
          class="flex-1"
        />
      </div>

      <!-- 服务描述 -->
      <div class="flex items-start">
        <label class="w-24 shrink-0 pt-1 text-sm font-medium">服务描述</label>
        <Input.TextArea
          v-model:value="formData.description"
          placeholder="请输入服务描述"
          :rows="3"
          class="flex-1"
        />
      </div>

      <!-- 状态 -->
      <div class="flex items-center">
        <label class="w-24 shrink-0 text-sm font-medium">状态</label>
        <Radio.Group v-model:value="formData.status" button-style="solid">
          <Radio.Button value="enabled">启用</Radio.Button>
          <Radio.Button value="disabled">禁用</Radio.Button>
        </Radio.Group>
      </div>

      <!-- 底部按钮 -->
      <div class="flex justify-end gap-2 border-t pt-4">
        <Button @click="handleCancel">取消</Button>
        <Button type="primary" :loading="loading" @click="handleSubmit">
          保存
        </Button>
      </div>
    </div>
  </Modal>
</template>
