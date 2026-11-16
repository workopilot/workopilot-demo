<script setup lang="ts">
import type { AiServiceDef } from '#/types/aiservice';

import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { useClipboard } from '@vueuse/core';
import { Input, message, Popconfirm, Select, Tooltip } from 'ant-design-vue';

import {
  deleteAiServiceApi,
  getAiServiceListApi,
  getAiTagsApi,
} from '#/api/aiservice';

import ServiceDrawer from './service-drawer.vue';

const drawerOpen = ref(false);
const currentId = ref<string>();

function handleAdd() {
  currentId.value = undefined;
  drawerOpen.value = true;
}

function handleEdit(row: AiServiceDef) {
  currentId.value = row.id;
  drawerOpen.value = true;
}
const serviceList = ref<AiServiceDef[]>([]);
const loadingList = ref(false);
const formParams = ref<any>({});
const tagOptions = ref<{ label: string; value: string }[]>([]);

const { copy } = useClipboard({ legacy: true });

async function loadData() {
  loadingList.value = true;
  try {
    const res = await getAiServiceListApi({
      pageIndex: 1,
      pageSize: 100, // Load all for demo
      ...formParams.value,
    });
    serviceList.value = res.data.rows;
  } finally {
    loadingList.value = false;
  }
}

async function loadTags() {
  const res = await getAiTagsApi();
  tagOptions.value = res.data.map((t) => ({ label: t, value: t }));
}

// Initial load
loadTags();
loadData();

function handleManualSearch(val?: string) {
  if (typeof val === 'string') {
    formParams.value = { ...formParams.value, serviceName: val };
  }
  loadData();
}

function handleCopyCode(code?: string) {
  if (!code) return;
  copy(code);
  message.success('编码已复制');
}

function getRelativeTime(dateStr?: string) {
  if (!dateStr) return '-';
  // Simple formatter, can use dayjs relativeTime plugin if available
  return new Date(dateStr).toLocaleDateString();
}

function handleSuccess() {
  loadData();
}

async function handleDelete(id: string) {
  try {
    await deleteAiServiceApi(id);
    message.success('删除成功');
    loadData();
  } catch (error: any) {
    message.error(error.message);
  }
}
</script>

<template>
  <div
    class="relative flex h-full flex-col gap-6 overflow-hidden bg-slate-50 p-6"
  >
    <!-- Background Decoration -->
    <div
      class="pointer-events-none absolute left-0 top-0 -z-10 h-96 w-full bg-gradient-to-b from-blue-50/50 to-transparent"
    ></div>
    <div
      class="absolute -right-20 -top-20 -z-10 h-96 w-96 rounded-full bg-purple-100/40 blur-3xl"
    ></div>
    <div
      class="absolute -left-20 top-40 -z-10 h-72 w-72 rounded-full bg-blue-100/40 blur-3xl"
    ></div>

    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="rounded-xl border border-gray-100 bg-white p-2.5 text-blue-600 shadow-sm"
        >
          <Icon icon="lucide:bot" class="size-6" />
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-gray-800">
            AI 服务管理
          </h1>
          <p class="text-xs font-medium text-gray-400">
            管理与编排您的 AI 智能体与服务
          </p>
        </div>
      </div>
      <div
        class="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-1 shadow-sm"
      >
        <div class="w-48">
          <Select
            v-model:value="formParams.tags"
            mode="multiple"
            placeholder="标签筛选"
            :options="tagOptions"
            allow-clear
            class="w-full !border-none"
            :bordered="false"
            :max-tag-count="1"
            @change="handleManualSearch"
          />
        </div>
        <div class="h-6 w-px bg-gray-200"></div>
        <Input.Search
          placeholder="搜索服务..."
          class="w-64 !bg-transparent"
          :bordered="false"
          allow-clear
          @search="handleManualSearch"
        />
      </div>
    </div>

    <!-- Card Grid Layout -->
    <div v-if="loadingList" class="flex flex-1 items-center justify-center">
      <div class="flex flex-col items-center gap-4">
        <div class="relative">
          <div class="h-12 w-12 rounded-full border-4 border-blue-100"></div>
          <div
            class="absolute left-0 top-0 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"
          ></div>
        </div>
        <span class="text-sm font-medium text-gray-400">加载服务中...</span>
      </div>
    </div>
    <div
      v-else
      class="grid grid-cols-1 gap-6 pb-6 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
    >
      <!-- Create / Import Card -->
      <div
        class="group flex h-[200px] flex-col overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-white/50 transition-all hover:border-blue-300 hover:bg-white/80 hover:shadow-lg hover:shadow-blue-500/5"
      >
        <!-- Create Zone -->
        <div
          class="group/create flex flex-1 cursor-pointer flex-col items-center justify-center border-b border-gray-100/50 transition-colors hover:bg-blue-50"
          @click="handleAdd"
        >
          <div
            class="mb-2 rounded-full bg-blue-50 p-3 text-blue-500 shadow-sm transition-all group-hover/create:bg-blue-500 group-hover/create:text-white"
          >
            <Icon icon="lucide:plus" class="size-5" />
          </div>
          <span
            class="text-sm font-bold text-gray-600 group-hover/create:text-blue-600"
            >新建服务</span
          >
        </div>

        <!-- Import Zone -->
        <div
          class="group/import flex h-12 cursor-pointer items-center justify-center text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
        >
          <div class="flex items-center gap-2 text-xs font-medium">
            <Icon icon="lucide:upload" class="size-3.5" />
            <span>导入服务</span>
          </div>
        </div>
      </div>

      <!-- Service Cards -->
      <div
        v-for="item in serviceList"
        :key="item.id"
        class="group relative flex h-[200px] flex-col justify-between rounded-2xl border border-white bg-white/60 shadow-sm backdrop-blur-md transition-all hover:-translate-y-1 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/10"
      >
        <!-- Header -->
        <div class="mx-5 mt-5 flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl shadow-inner transition-colors"
              :class="
                item.executionMode === 'AUDIT'
                  ? 'bg-purple-50 text-purple-600'
                  : 'bg-blue-50 text-blue-600'
              "
            >
              <Icon
                :icon="
                  item.executionMode === 'AUDIT'
                    ? 'lucide:brain-circuit'
                    : 'lucide:message-square-text'
                "
                class="size-5"
              />
            </div>
            <div>
              <h3
                class="mb-0.5 line-clamp-1 text-sm font-bold text-gray-800"
                :title="item.serviceName"
              >
                {{ item.serviceName }}
              </h3>
              <div
                class="group/code flex cursor-pointer items-center gap-1.5"
                @click.stop="handleCopyCode(item.serviceCode)"
              >
                <code
                  class="rounded bg-gray-100 px-1 py-0.5 text-[10px] text-gray-400 transition-colors group-hover/code:bg-blue-50 group-hover/code:text-blue-500"
                  >{{ item.serviceCode }}</code
                >
                <Icon
                  icon="lucide:copy"
                  class="size-2.5 text-gray-300 opacity-0 transition-opacity group-hover/code:text-blue-500 group-hover/code:opacity-100"
                />
              </div>
            </div>
          </div>
          <div class="flex flex-col items-end gap-1">
            <span class="relative flex h-2 w-2">
              <span
                v-if="item.isActive"
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex h-2 w-2 rounded-full"
                :class="item.isActive ? 'bg-green-500' : 'bg-gray-300'"
              ></span>
            </span>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-hidden px-5 py-3">
          <!-- Tags -->
          <div
            class="mb-2 flex h-5 flex-wrap gap-1.5 overflow-hidden"
            v-if="item.tags && item.tags.length > 0"
          >
            <span
              v-for="tag in item.tags"
              :key="tag"
              class="rounded-md border border-slate-200/50 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500"
            >
              {{ tag }}
            </span>
          </div>
          <div
            class="line-clamp-2 h-9 text-xs leading-relaxed text-gray-400"
            v-else
          >
            {{ item.description || '暂无描述...' }}
          </div>

          <!-- Footer Info -->
          <div class="mt-auto flex items-center gap-2 pt-2">
            <div
              class="flex items-center gap-1 rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-500"
            >
              <Icon icon="lucide:cpu" class="size-3 text-gray-400" />
              {{ item.modelConfig?.model }}
            </div>
            <div
              class="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium"
              :class="
                item.executionMode === 'AUDIT'
                  ? 'border border-purple-100 bg-purple-50 text-purple-600'
                  : 'border border-blue-100 bg-blue-50 text-blue-600'
              "
            >
              {{ item.executionMode === 'AUDIT' ? '智能审核' : '通用' }}
            </div>
          </div>
        </div>

        <!-- Hover Actions Overlay -->
        <div
          class="absolute bottom-3 right-3 flex translate-y-2 gap-1 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        >
          <Tooltip title="编辑">
            <button
              class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-md transition-all hover:scale-110 hover:text-blue-600"
              @click="handleEdit(item)"
            >
              <Icon icon="lucide:edit-3" class="size-4" />
            </button>
          </Tooltip>
          <Popconfirm
            title="确定要删除此服务吗？"
            @confirm="handleDelete(item.id)"
          >
            <Tooltip title="删除">
              <button
                class="flex h-8 w-8 items-center justify-center rounded-full bg-white text-gray-500 shadow-md transition-all hover:scale-110 hover:text-red-500"
              >
                <Icon icon="lucide:trash-2" class="size-4" />
              </button>
            </Tooltip>
          </Popconfirm>
        </div>

        <!-- Last Updated (Visible when not hovering) -->
        <div
          class="pointer-events-none absolute bottom-4 right-5 text-[10px] text-gray-300 transition-opacity group-hover:opacity-0"
        >
          {{ getRelativeTime(item.updatedAt) }}
        </div>
      </div>
    </div>

    <ServiceDrawer
      v-model:open="drawerOpen"
      :id="currentId"
      @success="handleSuccess"
    />
  </div>
</template>

<style scoped>
:deep(.card-list) {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
</style>
