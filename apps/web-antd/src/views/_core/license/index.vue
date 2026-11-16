<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Card, Input, message, Result, Upload } from 'ant-design-vue';

const router = useRouter();

const serialNumber = 'SN-1234-5678-90AB-CDEF'; // Mock serial number
const licenseKey = ref('');
const isActivated = ref(false);
const loading = ref(false);

function handleCopy() {
  navigator.clipboard.writeText(serialNumber);
  message.success('序列号已复制');
}

function handleBeforeUpload(file: File) {
  file.text().then((text) => {
    licenseKey.value = text;
  });
  // Prevent upload
  return false;
}

async function handleActivate() {
  if (!licenseKey.value) {
    message.warning('请输入或上传 License 文件');
    return;
  }

  loading.value = true;
  try {
    // Mock activation delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Mock validation logic
    if (licenseKey.value.length > 10) {
      isActivated.value = true;
      message.success('激活成功');
    } else {
      message.error('无效的 License');
    }
  } finally {
    loading.value = false;
  }
}

function goToLogin() {
  router.push('/auth/login');
}
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800"
  >
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <h2
          class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white"
        >
          产品授权激活
        </h2>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          请输入您的许可证密钥以激活产品
        </p>
      </div>

      <Card
        :bordered="false"
        class="overflow-hidden rounded-2xl border-t border-white/50 shadow-xl backdrop-blur-sm dark:border-gray-700 dark:bg-gray-800/80"
      >
        <div v-if="!isActivated" class="space-y-6">
          <!-- 序列号区域 -->
          <div>
            <label
              class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              设备序列号
            </label>
            <div
              class="group relative flex items-center justify-between rounded-lg border border-gray-200 bg-gray-100 p-3 transition-colors hover:bg-gray-100/80 dark:border-gray-700 dark:bg-gray-900/50"
            >
              <code
                class="select-all font-mono text-base text-gray-800 dark:text-gray-200"
              >
                {{ serialNumber }}
              </code>
              <div
                class="flex cursor-pointer items-center justify-center rounded p-1.5 text-gray-500 transition-all hover:bg-white hover:text-primary hover:shadow-sm dark:hover:bg-gray-700"
                @click="handleCopy"
                title="复制序列号"
              >
                <Icon icon="lucide:copy" class="size-4" />
              </div>
            </div>
            <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              请复制上方序列号发送给管理员以获取 License 文件
            </p>
          </div>

          <!-- 激活码输入区域 -->
          <div>
            <label
              class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              License 激活码
            </label>
            <div class="relative">
              <Input.TextArea
                v-model:value="licenseKey"
                :rows="5"
                class="!resize-none !rounded-lg !bg-white dark:!bg-gray-900"
                placeholder="在此粘贴 License 内容..."
              />
              <div class="absolute bottom-2 right-2">
                <Upload
                  :before-upload="handleBeforeUpload"
                  :show-upload-list="false"
                  accept=".txt,.lic,.key"
                >
                  <Button
                    type="dashed"
                    size="small"
                    class="flex items-center gap-1 !text-xs"
                  >
                    <template #icon>
                      <Icon icon="lucide:upload" class="size-3" />
                    </template>
                    上传文件
                  </Button>
                </Upload>
              </div>
            </div>
          </div>

          <!-- 激活按钮 -->
          <div>
            <Button
              type="primary"
              block
              size="large"
              :loading="loading"
              class="!h-11 !rounded-lg !text-base !font-medium shadow-lg shadow-primary/30 transition-all hover:!shadow-primary/50"
              @click="handleActivate"
            >
              立即激活
            </Button>
          </div>

          <div class="text-center">
            <a
              class="inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-primary"
              @click="goToLogin"
            >
              <Icon icon="lucide:arrow-left" class="size-4" />
              返回登录
            </a>
          </div>
        </div>

        <Result
          v-else
          status="success"
          title="激活成功"
          sub-title="您的产品已成功获得授权，现在可以正常使用了。"
          class="!p-0"
        >
          <template #extra>
            <Button
              type="primary"
              class="!h-10 !rounded-lg !px-8"
              key="console"
              @click="goToLogin"
            >
              前往登录
            </Button>
          </template>
        </Result>
      </Card>

      <!-- 底部版权信息 (可选) -->
      <div class="mt-8 text-center text-xs text-gray-400 dark:text-gray-600">
        &copy; {{ new Date().getFullYear() }} Vben Admin. All rights reserved.
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.ant-card-body) {
  padding: 2rem !important;
}
</style>
