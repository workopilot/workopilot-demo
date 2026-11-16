<script setup lang="ts">
import type { Policy } from '#/types/policy';

import { computed, h, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Icon } from '@iconify/vue';
import { Menu, Spin } from 'ant-design-vue';

import { getPolicyApi } from '#/api/policy';

import PolicyClauses from './components/policy-clauses.vue';
import PolicyForm from './components/policy-form.vue';
import PolicyHistory from './components/policy-history.vue';
import PolicyInit from './components/policy-init.vue';
import PolicyVersions from './components/policy-versions.vue';

const route = useRoute();
const router = useRouter();
const policyId = computed(() => route.params.id as string);

const loading = ref(false);
const policy = ref<null | Policy>(null);
const activeKeys = ref(['clauses']);

const menuItems = [
  { key: 'basic', label: '基础信息', icon: 'lucide:info' },
  { key: 'clauses', label: '条款库', icon: 'lucide:book' },
  { key: 'versions', label: '版本管理', icon: 'lucide:git-branch' },
  { key: 'init', label: '上传制度', icon: 'lucide:upload' },
  { key: 'history', label: '文件历史', icon: 'lucide:history' },
];

async function fetchPolicy() {
  if (!policyId.value) return;

  // Handle query param for initial tab
  const tab = route.query.tab as string;
  if (tab && menuItems.some((item) => item.key === tab)) {
    activeKeys.value = [tab];
  }

  loading.value = true;
  try {
    const res = await getPolicyApi(policyId.value);
    policy.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function handleMenuSelect({ key }: { key: string }) {
  activeKeys.value = [key];
}

function handleBack() {
  router.push({ name: 'PolicyList' });
}

onMounted(() => {
  fetchPolicy();
});
</script>

<template>
  <Page :title="policy?.name || '加载中...'" @back="handleBack">
    <template #description>
      <div v-if="policy" class="flex items-center gap-4 text-xs text-gray-500">
        <span>编码: {{ policy.code }}</span>
        <span>版本: {{ policy.version }}</span>
        <span>最后更新: {{ policy.updatedAt }}</span>
      </div>
    </template>

    <div
      class="flex h-[calc(100vh-180px)] overflow-hidden rounded-lg border bg-white shadow-sm"
    >
      <!-- Sider -->
      <div class="w-[200px] border-r bg-gray-50">
        <Menu
          v-model:selected-keys="activeKeys"
          mode="inline"
          class="h-full border-r-0 bg-transparent"
          :items="
            menuItems.map((item) => ({
              key: item.key,
              label: item.label,
              icon: () => h(Icon, { icon: item.icon }),
            }))
          "
          @select="handleMenuSelect"
        />
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden bg-gray-50 p-4">
        <div class="relative h-full overflow-hidden rounded bg-white shadow-sm">
          <div
            v-if="loading"
            class="absolute inset-0 z-50 flex items-center justify-center bg-white/50"
          >
            <Spin />
          </div>
          <PolicyForm
            v-if="activeKeys[0] === 'basic'"
            :policy="policy"
            @update="(p) => (policy = p)"
          />
          <PolicyClauses
            v-else-if="activeKeys[0] === 'clauses'"
            :policy-id="policyId"
          />
          <PolicyVersions
            v-else-if="activeKeys[0] === 'versions'"
            :policy-id="policyId"
          />
          <PolicyInit
            v-else-if="activeKeys[0] === 'init'"
            :policy-id="policyId"
            @finish="() => (activeKeys = ['clauses'])"
          />
          <PolicyHistory
            v-else-if="activeKeys[0] === 'history'"
            :policy-id="policyId"
          />
        </div>
      </div>
    </div>
  </Page>
</template>
