<script setup lang="ts">
import type { StorageConfigForm } from '#/types/file-storage';

import { computed, reactive, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
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

import { createStorageConfig, updateStorageConfig } from '#/api/file-storage';

interface Props {
  open: boolean;
  config?: any;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const internalOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
});

const isEdit = computed(() => !!props.config);

// ==================== 表单数据 ====================

const formRef = ref();
const loading = ref(false);

const formData = reactive<StorageConfigForm>({
  configName: '',
  serviceUrl: '',
  customDomain: '',
  accessKey: '',
  secretKey: '',
  bucketName: '',
  prefix: '',
  bucketPermission: 'private',
  isHttps: true,
  region: '',
  remark: '',
});

// ==================== 表单验证规则 ====================

const rules = {
  configName: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  serviceUrl: [{ required: true, message: '请输入服务地址', trigger: 'blur' }],
  accessKey: [{ required: true, message: '请输入Access Key', trigger: 'blur' }],
  secretKey: [{ required: true, message: '请输入Secret Key', trigger: 'blur' }],
  bucketName: [{ required: true, message: '请输入桶名称', trigger: 'blur' }],
};

// ==================== 提交表单 ====================

async function handleSubmit() {
  try {
    await formRef.value.validate();
    loading.value = true;

    if (isEdit.value) {
      await updateStorageConfig(props.config.id, formData);
      message.success('更新成功');
    } else {
      await createStorageConfig(formData);
      message.success('创建成功');
    }

    handleReset();
    emit('success');
  } catch (error: any) {
    if (error.errorFields) {
      message.warning('请检查表单填写是否完整');
    } else {
      message.error(isEdit.value ? '更新失败' : '创建失败');
      console.error(error);
    }
  } finally {
    loading.value = false;
  }
}

// ==================== 重置表单 ====================

function handleReset() {
  formRef.value?.resetFields();
  Object.assign(formData, {
    configName: '',
    serviceUrl: '',
    customDomain: '',
    accessKey: '',
    secretKey: '',
    bucketName: '',
    prefix: '',
    bucketPermission: 'private',
    isHttps: true,
    region: '',
    remark: '',
  });
}

function handleCancel() {
  if (loading.value) return;
  handleReset();
  internalOpen.value = false;
}

// ==================== 监听弹窗打开 ====================

watch(
  () => props.open,
  (newVal) => {
    if (newVal && props.config) {
      // 编辑模式：填充表单数据
      Object.assign(formData, {
        id: props.config.id,
        configName: props.config.configName,
        serviceUrl: props.config.serviceUrl,
        customDomain: props.config.customDomain || '',
        accessKey: props.config.accessKey,
        secretKey: props.config.secretKey,
        bucketName: props.config.bucketName,
        prefix: props.config.prefix || '',
        bucketPermission: props.config.bucketPermission,
        isHttps: props.config.isHttps,
        region: props.config.region || '',
        remark: props.config.remark || '',
      });
    } else if (newVal) {
      // 新增模式：重置表单
      handleReset();
    }
  },
);
</script>

<template>
  <Drawer
    v-model:open="internalOpen"
    :title="isEdit ? '编辑存储配置' : '新增存储配置'"
    :width="520"
    placement="right"
    :mask-closable="!loading"
  >
    <Form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-col="{ span: 6 }"
      :wrapper-col="{ span: 18 }"
    >
      <!-- 基本信息 -->
      <div class="mb-5 rounded-lg bg-muted/30 p-4">
        <div class="mb-3 flex items-center gap-2 text-sm font-medium">
          <Icon icon="lucide:info" class="size-4 text-primary" />
          <span>基本信息</span>
        </div>

        <FormItem label="配置名称" name="configName">
          <Input
            v-model:value="formData.configName"
            placeholder="请输入配置名称"
            :disabled="loading"
          />
        </FormItem>

        <FormItem label="服务地址" name="serviceUrl">
          <Input
            v-model:value="formData.serviceUrl"
            placeholder="请输入服务地址，如：https://obs.cn-north-1.myhuaweicloud.com"
            :disabled="loading"
          />
        </FormItem>

        <FormItem label="自定义域名">
          <Input
            v-model:value="formData.customDomain"
            placeholder="请输入自定义域名"
            :disabled="loading"
          />
          <div class="mt-1 text-xs text-orange-500">
            私有桶使用自定义域名需要参考相关文档配置，否则无法预览
          </div>
        </FormItem>
      </div>

      <!-- 认证信息 -->
      <div class="mb-5 rounded-lg bg-muted/30 p-4">
        <div class="mb-3 flex items-center gap-2 text-sm font-medium">
          <Icon icon="lucide:key" class="size-4 text-primary" />
          <span>认证信息</span>
        </div>

        <FormItem label="accessKey" name="accessKey">
          <Input
            v-model:value="formData.accessKey"
            placeholder="请输入Access Key"
            :disabled="loading"
          />
        </FormItem>

        <FormItem label="secretKey" name="secretKey">
          <InputPassword
            v-model:value="formData.secretKey"
            placeholder="请输入Secret Key"
            :disabled="loading"
          />
        </FormItem>
      </div>

      <!-- 其他信息 -->
      <div class="mb-5 rounded-lg bg-muted/30 p-4">
        <div class="mb-3 flex items-center gap-2 text-sm font-medium">
          <Icon icon="lucide:settings" class="size-4 text-primary" />
          <span>其他信息</span>
        </div>

        <FormItem label="桶名称" name="bucketName">
          <Input
            v-model:value="formData.bucketName"
            placeholder="请输入桶名称"
            :disabled="loading"
          />
        </FormItem>

        <FormItem label="前缀">
          <Input
            v-model:value="formData.prefix"
            placeholder="请输入前缀，如：files/"
            :disabled="loading"
          />
        </FormItem>

        <FormItem label="权限桶类型">
          <RadioGroup
            v-model:value="formData.bucketPermission"
            :disabled="loading"
          >
            <Radio value="private">私有</Radio>
            <Radio value="public">公开</Radio>
            <Radio value="custom">自定义</Radio>
          </RadioGroup>
        </FormItem>

        <FormItem label="是否HTTPS">
          <RadioGroup v-model:value="formData.isHttps" :disabled="loading">
            <Radio :value="true">是</Radio>
            <Radio :value="false">否</Radio>
          </RadioGroup>
        </FormItem>

        <FormItem label="区域">
          <Input
            v-model:value="formData.region"
            placeholder="请输入区域，如：cn-north-1"
            :disabled="loading"
          />
        </FormItem>

        <FormItem label="备注">
          <Input.TextArea
            v-model:value="formData.remark"
            placeholder="请输入备注"
            :rows="2"
            :disabled="loading"
          />
        </FormItem>
      </div>
    </Form>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <Button :disabled="loading" @click="handleCancel"> 取消 </Button>
        <Button type="primary" :loading="loading" @click="handleSubmit">
          确认
        </Button>
      </div>
    </template>
  </Drawer>
</template>
