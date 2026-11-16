<script setup lang="ts">
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Badge, Button, Card, Divider } from 'ant-design-vue';

const router = useRouter();

// Step1: 基础设置项
const basicSettings = [
  {
    id: 'company-info',
    title: '企业信息',
    description: '完善企业名称、统一社会信用代码等基本信息',
    icon: 'lucide:building-2',
    status: 'completed', // completed, pending, optional
    route: '/settings/company',
  },
  {
    id: 'org-structure',
    title: '组织架构',
    description: '设置部门结构、岗位信息',
    icon: 'lucide:sitemap',
    status: 'completed',
    route: '/settings/organization',
  },
  {
    id: 'user-management',
    title: '用户管理',
    description: '添加用户并分配角色权限',
    icon: 'lucide:users',
    status: 'pending',
    route: '/settings/users',
  },
  {
    id: 'source-system',
    title: '源系统配置',
    description: '配置业务系统连接（SAP、用友、金蝶等）',
    icon: 'lucide:database',
    status: 'pending',
    route: '/audit/settings/source-systems',
  },
];

// Step2: 智能服务配置项
const smartServices = [
  {
    id: 'smart-classification',
    title: '智能附件分类',
    description: '自动识别和分类会计凭证附件',
    icon: 'lucide:folder-closed',
    status: 'pending',
    badge: '推荐',
    route: '/smart/attachment-classification',
  },
  {
    id: 'smart-comparison',
    title: '智能附件对比',
    description: '智能对比附件与单据数据差异',
    icon: 'lucide:git-compare',
    status: 'pending',
    badge: '推荐',
    route: '/smart/attachment-comparison',
  },
  {
    id: 'smart-audit',
    title: '智能审核',
    description: 'AI驱动的单据智能审核',
    icon: 'lucide:shield-check',
    status: 'pending',
    badge: '推荐',
    route: '/audit/settings/audit-rules',
  },
  {
    id: 'smart-filling',
    title: '智能填报',
    description: '智能识别票据并自动填报单据',
    icon: 'lucide:clipboard-typing',
    status: 'pending',
    route: '/smart/smart-filling',
  },
  {
    id: 'smart-compliance',
    title: '智能合规',
    description: '财务合规性智能检查',
    icon: 'lucide:scale',
    status: 'optional',
    badge: '可选',
    route: '/smart/compliance',
  },
  {
    id: 'smart-audit-agent',
    title: '智能审计',
    description: 'AI审计助手，智能分析审计疑点',
    icon: 'lucide:search',
    status: 'optional',
    badge: '可选',
    route: '/smart/audit-agent',
  },
];

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    completed: 'success',
    pending: 'processing',
    optional: 'default',
  };
  return colorMap[status] || 'default';
};

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    completed: '已完成',
    pending: '待配置',
    optional: '可选',
  };
  return textMap[status] || status;
};

// 获取徽章颜色
const getBadgeColor = (badge: string) => {
  const colorMap: Record<string, string> = {
    推荐: 'blue',
    可选: 'default',
  };
  return colorMap[badge] || 'default';
};

// 处理配置项点击
const handleConfigClick = (item: any) => {
  if (item.route) {
    router.push(item.route);
  }
};
</script>

<template>
  <div class="tenant-guide-container p-6">
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-2xl font-semibold">租户实施指引</h1>
      <p class="mt-2 text-sm text-gray-600">
        完成以下系统配置，快速启用智能服务
      </p>
    </div>

    <!-- Step1: 基础设置 -->
    <Card class="mb-6">
      <template #title>
        <div class="flex items-center gap-2">
          <Icon icon="lucide:settings" class="size-5 text-blue-600" />
          <span class="text-lg font-semibold">Step1：基础设置</span>
        </div>
      </template>
      <template #extra>
        <span class="text-sm text-gray-500">
          完成
          {{ basicSettings.filter((s) => s.status === 'completed').length }}/{{
            basicSettings.length
          }}
          项配置
        </span>
      </template>

      <div class="space-y-3">
        <div
          v-for="item in basicSettings"
          :key="item.id"
          class="config-item group flex items-start justify-between rounded-lg border bg-gray-50 p-4 transition-all hover:border-blue-400 hover:shadow-sm"
        >
          <div class="flex items-start gap-3">
            <div
              :class="`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                item.status === 'completed' ? 'bg-green-100' : 'bg-blue-50'
              }`"
            >
              <Icon
                :icon="item.icon"
                :class="`size-5 ${
                  item.status === 'completed'
                    ? 'text-green-600'
                    : 'text-blue-600'
                }`"
              />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900">{{ item.title }}</span>
                <Badge
                  v-if="item.status === 'completed'"
                  status="success"
                  :text="getStatusText(item.status)"
                />
                <Badge
                  v-else
                  :status="getStatusColor(item.status)"
                  :text="getStatusText(item.status)"
                />
              </div>
              <div class="mt-1 text-sm text-gray-600">
                {{ item.description }}
              </div>
            </div>
          </div>
          <Button
            type="primary"
            :ghost="item.status !== 'pending'"
            size="small"
            @click="handleConfigClick(item)"
          >
            {{ item.status === 'completed' ? '重新配置' : '立即配置' }}
          </Button>
        </div>
      </div>
    </Card>

    <!-- Step2: 配置智能服务 -->
    <Card>
      <template #title>
        <div class="flex items-center gap-2">
          <Icon icon="lucide:sparkles" class="size-5 text-purple-600" />
          <span class="text-lg font-semibold">Step2：配置智能服务</span>
        </div>
      </template>
      <template #extra>
        <div class="flex items-center gap-4">
          <Badge count="推荐" color="blue" :number-style="{ fontSize: '12px' }">
            <span class="text-sm text-gray-500">推荐开通智能审核服务</span>
          </Badge>
        </div>
      </template>

      <div class="mb-4">
        <div
          class="flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-sm text-blue-700"
        >
          <Icon icon="lucide:info" class="size-4" />
          <span>建议优先开通标有"推荐"的服务，这些是核心智能功能</span>
        </div>
      </div>

      <div class="space-y-3">
        <div
          v-for="item in smartServices"
          :key="item.id"
          class="config-item group flex items-start justify-between rounded-lg border bg-gray-50 p-4 transition-all hover:border-purple-400 hover:shadow-sm"
        >
          <div class="flex items-start gap-3">
            <div
              :class="`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                item.status === 'completed'
                  ? 'bg-green-100'
                  : item.badge === '推荐'
                    ? 'bg-purple-50'
                    : 'bg-gray-100'
              }`"
            >
              <Icon
                :icon="item.icon"
                :class="`size-5 ${
                  item.status === 'completed'
                    ? 'text-green-600'
                    : item.badge === '推荐'
                      ? 'text-purple-600'
                      : 'text-gray-600'
                }`"
              />
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-900">{{ item.title }}</span>
                <Badge
                  v-if="item.badge"
                  :color="getBadgeColor(item.badge)"
                  :text="item.badge"
                />
                <Badge
                  v-if="item.status === 'completed'"
                  status="success"
                  :text="getStatusText(item.status)"
                />
                <Badge
                  v-else-if="item.status === 'pending'"
                  status="processing"
                  :text="getStatusText(item.status)"
                />
              </div>
              <div class="mt-1 text-sm text-gray-600">
                {{ item.description }}
              </div>
            </div>
          </div>
          <Button
            :type="item.badge === '推荐' ? 'primary' : 'default'"
            :ghost="item.status !== 'pending'"
            size="small"
            @click="handleConfigClick(item)"
          >
            {{ item.status === 'completed' ? '重新配置' : '立即开通' }}
          </Button>
        </div>
      </div>
    </Card>

    <!-- 底部提示 -->
    <Divider />
    <div class="flex items-center justify-between text-sm text-gray-500">
      <div class="flex items-center gap-2">
        <Icon icon="lucide:lightbulb" class="size-4 text-yellow-500" />
        <span>提示：您可以随时在【概览】中返回此页面继续配置</span>
      </div>
      <Button type="link" size="small">
        <template #icon>
          <Icon icon="lucide:help-circle" class="size-4" />
        </template>
        需要帮助？
      </Button>
    </div>
  </div>
</template>

<style scoped>
.tenant-guide-container {
  min-height: calc(100vh - 120px);
  background-color: #f5f5f5;
}

.config-item {
  position: relative;
}

.config-item:hover {
  transform: translateY(-1px);
}

:deep(.ant-steps-item-title) {
  font-weight: 500;
}

:deep(.ant-steps-item-description) {
  font-size: 12px;
}
</style>
