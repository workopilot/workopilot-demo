<script setup lang="ts">
import { ref, watch } from 'vue';

import {
  Button,
  Drawer,
  Form,
  FormItem,
  Input,
  InputPassword,
  message,
  Radio,
  RadioGroup,
} from 'ant-design-vue';

const props = defineProps({
  open: Boolean,
  system: {
    type: Object as () => null | Record<string, any>,
    default: null,
  },
});

const emits = defineEmits(['update:open', 'saved']);

const formRef = ref();
const formState = ref({
  id: '',
  name: '',
  authPolicy: 'global', // 'global' or 'user'
  agentUsername: '',
  agentPassword: '',
});

const rules = {
  name: [{ required: true, message: '请输入系统名称' }],
};

watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      formState.value = props.system
        ? { ...formState.value, ...props.system }
        : {
            id: '',
            name: '',
            authPolicy: 'global',
            agentUsername: '',
            agentPassword: '',
          };
    }
  },
);

function onClose() {
  emits('update:open', false);
  formRef.value?.resetFields();
}

async function handleSave() {
  try {
    await formRef.value?.validate();

    // Simulate save
    message.success('保存成功');
    emits('saved', {
      ...formState.value,
      id: formState.value.id || String(Date.now()),
      status: 'success',
      createdAt: new Date().toISOString(),
    });
    onClose();
  } catch (error) {
    console.error('Validate Failed:', error);
  }
}
</script>

<template>
  <Drawer
    :title="formState.id ? '编辑系统配置' : '添加系统配置'"
    width="480"
    :open="open"
    @close="onClose"
  >
    <Form
      ref="formRef"
      :model="formState"
      :rules="rules"
      layout="vertical"
      class="pb-16"
    >
      <div class="mb-6">
        <h3 class="mb-4 border-b pb-2 text-sm font-semibold text-slate-900">
          基础信息
        </h3>
        <FormItem
          label="目标系统名称"
          name="name"
          help="例如：集团总部 SAP、用友财务平台"
        >
          <Input
            v-model:value="formState.name"
            placeholder="请输入系统名称"
            size="large"
          />
        </FormItem>
      </div>

      <div>
        <h3 class="mb-4 border-b pb-2 text-sm font-semibold text-slate-900">
          账户授权策略 (Account Policy)
        </h3>

        <FormItem name="authPolicy" class="!mb-6">
          <RadioGroup
            v-model:value="formState.authPolicy"
            class="flex w-full flex-col gap-3"
          >
            <Radio
              value="global"
              class="!flex !items-start rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all"
              :class="{
                '!border-blue-500 !bg-blue-50/50 shadow-sm':
                  formState.authPolicy === 'global',
              }"
            >
              <div class="ml-2 flex flex-col">
                <span class="text-sm font-semibold text-slate-900">
                  全局代理账号 (Global Agent)
                </span>
                <span class="mt-1 text-xs leading-relaxed text-slate-500">
                  管理员统一配置账号密码，所有通过本平台发起的填报任务均使用此「机器人代理账号」操作后台系统。
                </span>
              </div>
            </Radio>
            <Radio
              value="user"
              class="!flex !items-start rounded-xl border border-slate-200 bg-slate-50 p-4 transition-all"
              :class="{
                '!border-blue-500 !bg-blue-50/50 shadow-sm':
                  formState.authPolicy === 'user',
              }"
            >
              <div class="ml-2 flex flex-col">
                <span class="text-sm font-semibold text-slate-900">
                  终端用户授权 (User Auth)
                </span>
                <span class="mt-1 text-xs leading-relaxed text-slate-500">
                  无需配置统一密码。填报时需终端用户登录系统，可直接拉起 SSO
                  或索要其专属的 Token，保障操作人可溯源。
                </span>
              </div>
            </Radio>
          </RadioGroup>
        </FormItem>

        <!-- Global Agent Credentials -->
        <div
          v-if="formState.authPolicy === 'global'"
          class="space-y-4 rounded-xl border border-gray-100 bg-gray-50 p-4"
        >
          <FormItem label="代理账号" name="agentUsername" class="!mb-0">
            <Input
              v-model:value="formState.agentUsername"
              placeholder="请输入代理机器人账户"
            />
          </FormItem>
          <FormItem label="代理密码/Token" name="agentPassword" class="!mb-0">
            <InputPassword
              v-model:value="formState.agentPassword"
              placeholder="请输入密码 (将被加密存储)"
            />
          </FormItem>
        </div>
      </div>
    </Form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <Button size="large" class="!rounded-lg" @click="onClose">取消</Button>
        <Button
          size="large"
          type="primary"
          class="!rounded-lg bg-slate-900"
          @click="handleSave"
        >
          保存配置
        </Button>
      </div>
    </template>
  </Drawer>
</template>

<style scoped>
/* Scoped Tailwind fixes if needed */
</style>
