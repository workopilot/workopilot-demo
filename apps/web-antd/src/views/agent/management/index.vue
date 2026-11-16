<script setup lang="ts">
import type { AgentItem } from '#/types/agent';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { useClipboard } from '@vueuse/core';
import { Button, Input, message } from 'ant-design-vue';

import { getAgentsApi } from '#/api/agent';

import AgentDrawer from './agent-drawer.vue';

const router = useRouter();
const agentList = ref<AgentItem[]>([]);
const loading = ref(false);
const searchText = ref('');
const drawerOpen = ref(false);
const editingAgent = ref<AgentItem | null>(null);

const { copy } = useClipboard({ legacy: true });

async function loadData() {
  loading.value = true;
  try {
    // Simulate API call
    const res = await getAgentsApi();
    agentList.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

function handleCopyCode(code: string) {
  if (!code) return;
  copy(code);
  message.success('编码已复制');
}

function handleEditAgent(agent: AgentItem) {
  editingAgent.value = agent;
  drawerOpen.value = true;
}

function handleEnterAgent(agent: AgentItem) {
  if (agent.status === 'active' || agent.status === 'development') {
    router.push(`/agent/${agent.code}`);
  } else {
    message.warn('该智能体暂不可用');
  }
}

function handleAddAgent() {
  editingAgent.value = null;
  drawerOpen.value = true;
}

function handleAgentSaved(agent: AgentItem) {
  // Update or add agent to list
  const index = agentList.value.findIndex((a) => a.id === agent.id);
  if (index === -1) {
    agentList.value.unshift(agent);
  } else {
    agentList.value[index] = agent;
  }
}

function handleAgentClick(agent: AgentItem) {
  if (agent.status === 'active' || agent.status === 'development') {
    router.push(`/agent/${agent.code}`);
  } else {
    message.warn('该智能体暂不可用');
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="flex h-full min-h-screen flex-col bg-gray-50/50 p-8">
    <!-- Header -->
    <div class="mb-8 flex items-end justify-between">
      <div>
        <h1 class="mb-2 text-3xl font-bold tracking-tight text-slate-900">
          智能体能力中心
        </h1>
        <p class="font-medium text-slate-500">
          集中管理与编排您的 AI 智能业务助手
        </p>
      </div>
      <div class="flex items-center gap-4">
        <div class="group relative">
          <Input.Search
            v-model:value="searchText"
            placeholder="搜索..."
            class="!w-64 !rounded-xl !border-gray-200 !bg-white !shadow-sm transition-all focus:!border-blue-500"
            allow-clear
          />
        </div>
        <Button
          type="primary"
          class="flex !h-10 items-center gap-2 !rounded-xl !bg-slate-900 !px-6 !font-semibold !shadow-lg shadow-slate-900/10 hover:!bg-slate-800"
          @click="handleAddAgent"
        >
          <Icon icon="lucide:plus" class="size-4" />
          新增能力
        </Button>
      </div>
    </div>

    <!-- Content -->
    <div
      v-if="loading"
      class="flex min-h-[400px] flex-1 items-center justify-center"
    >
      <div class="flex flex-col items-center gap-4">
        <div class="animate-spin text-slate-400">
          <Icon icon="lucide:loader-2" class="size-8" />
        </div>
        <span class="font-medium text-slate-400">加载中...</span>
      </div>
    </div>

    <!-- Bento Grid -->
    <div
      v-else
      class="grid grid-cols-1 gap-6 pb-12 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <!-- Agent Card -->
      <div
        v-for="agent in agentList"
        :key="agent.id"
        class="group relative flex h-[230px] cursor-pointer flex-col justify-between overflow-hidden rounded-3xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)]"
        @click="handleAgentClick(agent)"
      >
        <div>
          <!-- Top Row: Logo, Name, ID & Status -->
          <div class="mb-4 flex items-start justify-between">
            <div class="flex gap-4">
              <!-- Logo -->
              <div
                class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl transition-transform duration-500 group-hover:scale-110"
                :style="{
                  backgroundColor: agent.logoBgColor || '#f8fafc',
                  color: agent.logoColor || '#475569',
                }"
              >
                <img
                  v-if="
                    agent.logo &&
                    (agent.logo.startsWith('data:') ||
                      agent.logo.startsWith('http') ||
                      agent.logo.startsWith('/'))
                  "
                  :src="agent.logo"
                  class="h-full w-full object-cover"
                  alt="Logo"
                />
                <Icon
                  v-else
                  :icon="agent.logo || 'lucide:bot'"
                  class="size-6"
                />
              </div>

              <!-- Name & ID -->
              <div class="flex flex-col pt-0.5">
                <h3
                  class="mb-0.5 max-w-[140px] truncate text-base font-bold leading-tight text-slate-900"
                  :title="agent.name"
                >
                  {{ agent.name }}
                </h3>
                <div
                  class="group/code flex cursor-pointer items-center gap-1.5"
                  @click.stop="handleCopyCode(agent.code)"
                >
                  <!-- prettier-ignore -->
                  <code class="font-mono text-[11px] font-bold text-slate-400 transition-colors group-hover/code:text-slate-600">{{ agent.code }}</code>
                  <Icon
                    icon="lucide:copy"
                    class="size-2.5 text-slate-300 opacity-0 transition-opacity group-hover/code:opacity-100"
                  />
                </div>
              </div>
            </div>

            <!-- Status Tag -->
            <div
              v-if="agent.status === 'active'"
              class="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600"
            >
              <span class="relative flex h-1.5 w-1.5">
                <span
                  class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
                ></span>
                <span
                  class="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"
                ></span>
              </span>
              运行中
            </div>
            <div
              v-else
              class="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
            >
              {{ agent.status === 'development' ? '开发中' : '已暂停' }}
            </div>
          </div>

          <!-- Description -->
          <p
            class="line-clamp-2 h-[40px] text-xs leading-relaxed text-slate-500"
          >
            {{ agent.description }}
          </p>
        </div>

        <!-- Footer Action -->
        <div
          class="mt-auto flex items-center justify-between border-t border-gray-50 pt-4"
        >
          <!-- prettier-ignore -->
          <span class="font-mono text-xs font-medium tracking-tight text-slate-400">{{ agent.version }}</span>

          <div
            class="flex translate-y-2 items-center gap-2 opacity-0 duration-300 group-hover:translate-y-0 group-hover:opacity-100"
          >
            <!-- Edit Button -->
            <button
              class="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all hover:scale-105 hover:bg-slate-200 hover:text-slate-800 active:scale-95"
              @click.stop="handleEditAgent(agent)"
              title="编辑智能体"
            >
              <Icon icon="lucide:settings" class="size-4" />
            </button>
            <!-- Enter Button -->
            <button
              class="flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-semibold text-white shadow-md shadow-slate-900/10 transition-all hover:scale-105 hover:bg-slate-800 active:scale-95"
              @click.stop="handleEnterAgent(agent)"
            >
              进入
              <Icon icon="lucide:arrow-right" class="size-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Agent Drawer -->
  <AgentDrawer
    v-model:open="drawerOpen"
    :agent="editingAgent"
    @saved="handleAgentSaved"
  />
</template>
