<script setup lang="ts">
import type { Rule } from 'ant-design-vue/es/form';

import type { FloatPosition, PluginGlobalConfig } from '#/types/settings';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Form, Input, message, Radio, Switch } from 'ant-design-vue';

import { getPluginConfigApi, updatePluginConfigApi } from '#/api/settings';
import { deepClone } from '#/utils/deep-clone';

const loading = ref(false);
const saving = ref(false);

// 表单数据
const formData = reactive<PluginGlobalConfig>({
  privateDeployment: false,
  apiUrl: '',
  debugMode: false,
  floatPosition: 'bottom-right',
});

const formRef = ref();

// 表单验证规则
const rules: Record<string, Rule[]> = {
  apiUrl: [
    {
      validator: (rule: any, value: string) => {
        if (formData.privateDeployment && !value) {
          return Promise.reject(new Error('请输入私有化API地址'));
        }
        if (value && !/^https?:\/\/.+/.test(value)) {
          return Promise.reject(new Error('请输入有效的URL地址'));
        }
        return Promise.resolve();
      },
    },
  ],
};

// 悬浮球位置选项
const floatPositionOptions = [
  {
    label: '左下角',
    value: 'bottom-left' as FloatPosition,
    icon: 'lucide:corner-left-down',
  },
  {
    label: '右下角',
    value: 'bottom-right' as FloatPosition,
    icon: 'lucide:corner-right-down',
  },
];

// 是否有未保存的更改
const hasUnsavedChanges = ref(false);

// 初始配置的副本,用于检测变化
const initialConfig = ref<null | PluginGlobalConfig>(null);

// 监听表单变化
watch(
  formData,
  () => {
    if (initialConfig.value) {
      hasUnsavedChanges.value =
        JSON.stringify(formData) !== JSON.stringify(initialConfig.value);
    }
  },
  { deep: true },
);

// 获取配置
async function fetchConfig() {
  loading.value = true;
  try {
    const response = await getPluginConfigApi();
    const config = response.data;

    Object.assign(formData, config);
    initialConfig.value = deepClone(config);
    hasUnsavedChanges.value = false;
  } catch (error) {
    message.error('获取配置失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 保存配置
async function handleSave() {
  try {
    await formRef.value?.validate();

    saving.value = true;

    await updatePluginConfigApi(formData);
    message.success('配置已保存');

    initialConfig.value = deepClone(formData);
    hasUnsavedChanges.value = false;
  } catch (error: any) {
    if (error.errorFields) {
      return;
    }
    message.error('保存失败');
    console.error(error);
  } finally {
    saving.value = false;
  }
}

// 重置配置
function handleReset() {
  if (initialConfig.value) {
    Object.assign(formData, initialConfig.value);
    hasUnsavedChanges.value = false;
    message.info('已恢复到上次保存的配置');
  }
}

// 悬浮球预览样式
const floatPreviewStyle = computed(() => {
  const baseStyle = {
    position: 'absolute',
    bottom: '20px',
    width: '48px',
    height: '48px',
    backgroundColor: '#1890ff',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.4)',
    transition: 'all 0.3s',
  } as const;

  if (formData.floatPosition === 'bottom-left') {
    return { ...baseStyle, left: '20px' };
  }
  return { ...baseStyle, right: '20px' };
});

onMounted(() => {
  fetchConfig();
});
</script>

<template>
  <div>
    <!-- 头部 -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-semibold">插件设置</h2>
        <p class="mt-1 text-sm text-muted-foreground">
          配置浏览器插件的通用行为和外观
        </p>
      </div>
      <div class="flex gap-2">
        <Button :disabled="!hasUnsavedChanges" @click="handleReset">
          重置
        </Button>
        <Button
          type="primary"
          :loading="saving"
          :disabled="!hasUnsavedChanges"
          @click="handleSave"
        >
          <Icon icon="lucide:save" class="mr-1 size-4" />
          保存配置
        </Button>
      </div>
    </div>

    <!-- 配置表单 -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- 左侧表单 -->
      <div>
        <Form
          ref="formRef"
          :model="formData"
          :rules="rules"
          layout="vertical"
          class="rounded-lg border bg-card p-6"
        >
          <!-- 私有化部署 -->
          <div class="mb-6">
            <h3 class="mb-4 text-base font-semibold">私有化部署</h3>

            <Form.Item label="启用私有化部署">
              <Switch v-model:checked="formData.privateDeployment" />
              <p class="mt-2 text-xs text-muted-foreground">
                启用后将使用自定义的AI API服务
              </p>
            </Form.Item>

            <Form.Item
              v-if="formData.privateDeployment"
              label="API地址"
              name="apiUrl"
            >
              <Input
                v-model:value="formData.apiUrl"
                placeholder="https://api.example.com"
              />
            </Form.Item>
          </div>

          <!-- 调试模式 -->
          <div class="mb-6">
            <h3 class="mb-4 text-base font-semibold">调试模式</h3>

            <Form.Item label="启用调试模式">
              <Switch v-model:checked="formData.debugMode" />
              <p class="mt-2 text-xs text-muted-foreground">
                启用后将在浏览器控制台输出详细的调试信息
              </p>
            </Form.Item>
          </div>

          <!-- 悬浮球位置 -->
          <div>
            <h3 class="mb-4 text-base font-semibold">悬浮球位置</h3>

            <Form.Item label="选择悬浮球显示位置">
              <Radio.Group
                v-model:value="formData.floatPosition"
                class="grid grid-cols-2 gap-3"
              >
                <Radio
                  v-for="option in floatPositionOptions"
                  :key="option.value"
                  :value="option.value"
                  class="rounded-lg border p-3 transition-all hover:border-primary hover:bg-primary/5"
                >
                  <div class="flex items-center gap-2">
                    <Icon :icon="option.icon" class="size-4" />
                    <span>{{ option.label }}</span>
                  </div>
                </Radio>
              </Radio.Group>
            </Form.Item>
          </div>
        </Form>
      </div>

      <!-- 右侧实时预览 -->
      <div>
        <div class="sticky top-6 rounded-lg border bg-card p-6">
          <h3 class="mb-4 text-base font-semibold">实时预览</h3>

          <!-- 浏览器窗口预览 -->
          <div
            class="relative aspect-video overflow-hidden rounded-lg border-2 bg-muted/30"
          >
            <!-- 浏览器顶部栏 -->
            <div class="flex h-8 items-center gap-2 border-b bg-muted/50 px-3">
              <div class="size-2.5 rounded-full bg-red-500"></div>
              <div class="size-2.5 rounded-full bg-yellow-500"></div>
              <div class="size-2.5 rounded-full bg-green-500"></div>
            </div>

            <!-- 浏览器内容区 -->
            <div class="relative h-[calc(100%-2rem)] bg-background">
              <!-- 悬浮球 -->
              <div :style="floatPreviewStyle" class="cursor-pointer">
                <Icon icon="lucide:bot" class="size-6 text-white" />
              </div>

              <!-- 居中提示 -->
              <div class="flex h-full items-center justify-center">
                <div class="text-center">
                  <Icon
                    icon="lucide:mouse-pointer-click"
                    class="mx-auto mb-2 size-12 text-muted-foreground opacity-50"
                  />
                  <p class="text-sm text-muted-foreground">
                    悬浮球显示位置预览
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 配置摘要 -->
          <div class="mt-4 space-y-2 rounded-lg bg-muted/30 p-4 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">私有化部署</span>
              <span class="font-medium">
                {{ formData.privateDeployment ? '已启用' : '未启用' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">调试模式</span>
              <span class="font-medium">
                {{ formData.debugMode ? '已启用' : '未启用' }}
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">悬浮球位置</span>
              <span class="font-medium">
                {{
                  floatPositionOptions.find(
                    (o) => o.value === formData.floatPosition,
                  )?.label
                }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.ant-radio-wrapper) {
  width: 100%;
  margin: 0;
}

:deep(.ant-radio-wrapper.ant-radio-wrapper-checked) {
  @apply border-primary bg-primary/5;
}
</style>
