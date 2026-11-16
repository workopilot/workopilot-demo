<script setup lang="ts">
import { reactive, ref } from 'vue';

import {
  Alert,
  Button,
  DatePicker,
  Drawer,
  Form,
  Input,
  message,
  Space,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { createApiKeyApi } from '#/api/aiservice';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits(['update:open', 'success']);

const loading = ref(false);
const formState = reactive({
  remark: '',
  expirationTime: undefined as dayjs.Dayjs | undefined,
});

function handleClose() {
  emit('update:open', false);
  formState.remark = '';
  formState.expirationTime = undefined;
}

async function handleSave() {
  if (!formState.remark) {
    message.warning('请输入备注');
    return;
  }

  loading.value = true;
  try {
    await createApiKeyApi({
      remark: formState.remark,
      expirationTime: formState.expirationTime
        ? formState.expirationTime.toISOString()
        : undefined,
    });
    message.success('创建成功');
    emit('success');
    handleClose();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <Drawer
    :open="open"
    title="新建 API Key"
    width="500px"
    @close="handleClose"
    :body-style="{ paddingBottom: '80px' }"
  >
    <div class="flex flex-col gap-6">
      <Alert
        message="安全提示"
        description="API Key 拥有与您账号相同的权限，请妥善保管。建议为不同的用途创建不同的 Key，并设置过期时间。"
        type="info"
        show-icon
      />

      <Form layout="vertical" :model="formState">
        <Form.Item label="备注名称" required tooltip="用于区分不同的应用或用途">
          <Input
            v-model:value="formState.remark"
            placeholder="e.g. 开发环境测试, 生产服务调用"
          />
        </Form.Item>

        <Form.Item label="过期时间" tooltip="不填则永久有效">
          <DatePicker
            v-model:value="formState.expirationTime"
            class="w-full"
            show-time
            placeholder="选择过期时间"
            :disabled-date="
              (current) => current && current < dayjs().endOf('day')
            "
          />
        </Form.Item>
      </Form>
    </div>

    <template #footer>
      <Space class="float-right">
        <Button @click="handleClose">取消</Button>
        <Button type="primary" :loading="loading" @click="handleSave">
          创建
        </Button>
      </Space>
    </template>
  </Drawer>
</template>
