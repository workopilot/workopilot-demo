<script setup lang="ts">
import type { SourceSystem } from '#/types/settings';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Card, message, Spin, Tag } from 'ant-design-vue';

import { getSourceSystemsApi } from '#/api/settings';

const router = useRouter();
const loading = ref(false);
const systems = ref<SourceSystem[]>([]);

// 获取系统列表
async function fetchSystems() {
  loading.value = true;
  try {
    const response = await getSourceSystemsApi();
    systems.value = response.data || [];
  } catch (error) {
    message.error('获取业务系统列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 配置审核策略
function handleConfig(system: SourceSystem) {
  router.push({
    name: 'AuditPolicyConfig',
    params: { id: system.id },
  });
}

// 状态映射
const statusMap = {
  enabled: { text: '已启用', color: 'success' },
  disabled: { text: '已禁用', color: 'default' },
};

// 策略映射
const strategyMap: Record<string, string> = {
  assist: '辅助模式',
  semi_auto: '半自动',
  full_auto: '全自动',
};

onMounted(() => {
  fetchSystems();
});
</script>

<template>
  <div class="flex h-full flex-col gap-4 p-4">
    <!-- 加载状态 -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <Spin size="large" tip="加载中..." />
    </div>

    <!-- 系统卡片Grid -->
    <div
      v-else-if="systems.length > 0"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <Card
        v-for="system in systems"
        :key="system.id"
        class="transition-all hover:shadow-lg"
      >
        <template #title>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <Icon icon="lucide:database" class="size-8 text-primary" />
              <div>
                <div class="font-semibold">{{ system.name }}</div>
                <div class="text-xs font-normal text-muted-foreground">
                  {{ system.code }}
                </div>
              </div>
            </div>
            <Tag :color="statusMap[system.status].color">
              {{ statusMap[system.status].text }}
            </Tag>
          </div>
        </template>

        <div class="space-y-3 text-sm">
          <!-- 审核策略信息 -->
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground">审核策略：</span>
            <Tag v-if="system.auditPolicy" color="blue">
              {{ strategyMap[system.auditPolicy.strategy] }}
            </Tag>
            <Tag v-else color="default">未配置</Tag>
          </div>
          <div
            v-if="system.auditPolicy?.strategy === 'semi_auto'"
            class="flex items-center justify-between"
          >
            <span class="text-muted-foreground">置信度阈值：</span>
            <span class="font-semibold text-primary">
              {{ system.auditPolicy.confidenceThreshold }}%
            </span>
          </div>
        </div>

        <div class="mt-4">
          <Button type="primary" block @click="handleConfig(system)">
            <Icon icon="lucide:settings" class="mr-2 size-4" />
            配置策略
          </Button>
        </div>
      </Card>
    </div>

    <!-- 空状态 -->
    <div
      v-else
      class="flex flex-col items-center justify-center py-20 text-center"
    >
      <Icon
        icon="lucide:inbox"
        class="mb-4 size-16 text-muted-foreground opacity-50"
      />
      <p class="mb-4 text-muted-foreground">暂无业务系统</p>
    </div>
  </div>
</template>
