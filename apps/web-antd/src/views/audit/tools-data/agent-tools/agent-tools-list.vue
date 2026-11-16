<script setup lang="ts">
import type { AgentTool } from '#/types/tools-data';

import { computed, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Checkbox,
  Empty,
  Input,
  message,
  Pagination,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { deleteAgentToolApi, getAgentToolsApi } from '#/api/tools-data';

import AgentToolDrawer from './agent-tool-drawer.vue';

const loading = ref(false);
const tools = ref<AgentTool[]>([]);
const drawerOpen = ref(false);
const editingTool = ref<AgentTool | null>(null);

// Filter & Pagination State
const searchText = ref('');
const selectedTypes = ref<string[]>([]);
const currentPage = ref(1);
const pageSize = ref(12);

async function fetchTools() {
  loading.value = true;
  try {
    const res = await getAgentToolsApi();
    tools.value = res.data;
  } catch {
    message.error('获取工具列表失败');
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  editingTool.value = null;
  drawerOpen.value = true;
}

function handleEdit(tool: AgentTool) {
  editingTool.value = tool;
  drawerOpen.value = true;
}

async function handleDelete(id: string) {
  try {
    await deleteAgentToolApi(id);
    message.success('删除成功');
    fetchTools();
  } catch {
    message.error('删除失败');
  }
}

function handleDebug(tool: AgentTool) {
  message.info(`调试工具: ${tool.name} (功能开发中)`);
}

const toolTypeMap: Record<
  string,
  { color: string; icon: string; label: string }
> = {
  MCP_HTTP: { color: 'purple', label: 'MCP (HTTP)', icon: 'lucide:globe' },
  MCP_SSE: { color: 'blue', label: 'MCP (SSE)', icon: 'lucide:zap' },
  NATIVE: { color: 'green', label: 'NATIVE (内置)', icon: 'lucide:box' },
};

// Computed Properties
const filteredTools = computed(() => {
  let result = tools.value;

  // Search Text
  if (searchText.value) {
    const lower = searchText.value.toLowerCase();
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(lower) ||
        t.key.toLowerCase().includes(lower) ||
        t.description.toLowerCase().includes(lower),
    );
  }

  // Type Filter
  if (selectedTypes.value.length > 0) {
    result = result.filter((t) => selectedTypes.value.includes(t.type));
  }

  return result;
});

const paginatedTools = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return filteredTools.value.slice(start, end);
});

const total = computed(() => filteredTools.value.length);

onMounted(() => {
  fetchTools();
});
</script>

<template>
  <div class="flex h-full min-h-[500px] flex-col gap-4 lg:flex-row">
    <!-- Left Sidebar: Filters -->
    <div
      class="h-full w-full flex-shrink-0 rounded-lg border border-border bg-card p-4 lg:w-64"
    >
      <div class="mb-4 flex items-center gap-2 font-medium">
        <Icon icon="lucide:search" class="size-4" />
        <span>查询筛选</span>
      </div>

      <div class="space-y-4">
        <div>
          <div class="mb-2 text-xs text-muted-foreground">关键词搜索</div>
          <Input.Search
            v-model:value="searchText"
            placeholder="工具名称 / Key"
            allow-clear
          />
        </div>

        <div>
          <div class="mb-2 text-xs text-muted-foreground">工具类型</div>
          <div class="flex flex-col gap-2">
            <Checkbox.Group
              v-model:value="selectedTypes"
              class="flex flex-col gap-2"
            >
              <Checkbox value="MCP_HTTP">MCP (HTTP)</Checkbox>
              <Checkbox value="MCP_SSE">MCP (SSE)</Checkbox>
              <Checkbox value="NATIVE">NATIVE (内置)</Checkbox>
            </Checkbox.Group>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Content: Tool List -->
    <div class="flex min-w-0 flex-1 flex-col">
      <div class="mb-4 flex items-center justify-between">
        <div class="text-sm text-muted-foreground">
          共找到
          <span class="font-medium text-foreground">{{ total }}</span> 个工具
        </div>
        <Button type="primary" @click="handleAdd">
          <Icon icon="lucide:plus" class="mr-1 size-4" />
          注册工具
        </Button>
      </div>

      <div
        v-if="paginatedTools.length > 0"
        class="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <Card
          v-for="tool in paginatedTools"
          :key="tool.id"
          class="group transition-shadow hover:shadow-md"
          :body-style="{ padding: '12px' }"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-2">
              <Tag
                :color="toolTypeMap[tool.type]?.color || 'default'"
                class="m-0 flex items-center gap-1 px-1 py-0 text-[10px]"
              >
                <Icon
                  :icon="toolTypeMap[tool.type]?.icon || 'lucide:help-circle'"
                  class="size-3"
                />
                {{ toolTypeMap[tool.type]?.label || tool.type }}
              </Tag>
            </div>
            <Space
              size="small"
              class="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Tooltip title="调试">
                <Button
                  type="text"
                  size="small"
                  class="!h-6 !w-6 p-0"
                  @click="handleDebug(tool)"
                >
                  <Icon
                    icon="lucide:play-circle"
                    class="size-3.5 text-blue-500"
                  />
                </Button>
              </Tooltip>
              <Tooltip title="编辑">
                <Button
                  type="text"
                  size="small"
                  class="!h-6 !w-6 p-0"
                  @click="handleEdit(tool)"
                >
                  <Icon icon="lucide:edit" class="size-3.5 text-orange-500" />
                </Button>
              </Tooltip>
              <Popconfirm
                title="确定要删除此工具吗?"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(tool.id)"
              >
                <Tooltip title="删除">
                  <Button type="text" size="small" danger class="!h-6 !w-6 p-0">
                    <Icon icon="lucide:trash-2" class="size-3.5" />
                  </Button>
                </Tooltip>
              </Popconfirm>
            </Space>
          </div>

          <div class="mt-2">
            <div class="flex items-center gap-2">
              <h3
                class="flex-1 truncate text-sm font-medium"
                :title="tool.name"
              >
                {{ tool.name }}
              </h3>
              <div
                class="size-2 rounded-full"
                :class="
                  tool.status === 'active' ? 'bg-green-500' : 'bg-gray-300'
                "
                :title="tool.status === 'active' ? '已启用' : '已停用'"
              ></div>
            </div>
            <div
              class="mt-0.5 inline-block max-w-full truncate rounded bg-muted/50 px-1 py-0.5 font-mono text-[10px] text-muted-foreground"
              :title="tool.key"
            >
              {{ tool.key }}
            </div>
          </div>

          <div
            class="mt-2 line-clamp-2 h-8 text-xs leading-4 text-muted-foreground"
          >
            {{ tool.description }}
          </div>
        </Card>
      </div>
      <div
        v-else
        class="flex min-h-[200px] flex-1 items-center justify-center rounded-lg border border-dashed border-border bg-card"
      >
        <Empty description="未找到匹配的工具" />
      </div>

      <!-- Pagination -->
      <div class="mt-4 flex justify-end">
        <Pagination
          v-model:current="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :show-total="(total: number) => `共 ${total} 条`"
          show-size-changer
          show-quick-jumper
          size="small"
        />
      </div>
    </div>

    <AgentToolDrawer
      v-model:open="drawerOpen"
      :tool="editingTool"
      @success="fetchTools"
    />
  </div>
</template>
