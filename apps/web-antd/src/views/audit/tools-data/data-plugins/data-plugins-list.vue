<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { DataPlugin } from '#/types/tools-data';

import { h, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { deleteDataPluginApi, getDataPluginsApi } from '#/api/tools-data';

import DataPluginDrawer from './data-plugin-drawer.vue';

const loading = ref(false);
const plugins = ref<DataPlugin[]>([]);
const drawerOpen = ref(false);
const editingPlugin = ref<DataPlugin | null>(null);

async function fetchPlugins() {
  loading.value = true;
  try {
    const res = await getDataPluginsApi();
    plugins.value = res.data;
  } catch {
    message.error('获取数据插件列表失败');
  } finally {
    loading.value = false;
  }
}

function handleAdd() {
  editingPlugin.value = null;
  drawerOpen.value = true;
}

function handleEdit(record: DataPlugin) {
  editingPlugin.value = record;
  drawerOpen.value = true;
}

async function handleDelete(id: string) {
  try {
    await deleteDataPluginApi(id);
    message.success('删除成功');
    fetchPlugins();
  } catch {
    message.error('删除失败');
  }
}

function handleDebug(record: DataPlugin) {
  message.info(`调试插件: ${record.name} (功能开发中)`);
}

const columns: TableColumnsType<DataPlugin> = [
  {
    title: '插件编码',
    dataIndex: 'code',
    key: 'code',
    width: 150,
  },
  {
    title: '插件名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '基础地址',
    dataIndex: 'baseUrl',
    key: 'baseUrl',
    ellipsis: true,
  },
  {
    title: '服务数量',
    key: 'serviceCount',
    width: 100,
    align: 'center',
    customRender: ({ record }) =>
      h(Tag, { color: 'blue' }, () => record.services?.length || 0),
  },
  {
    title: '鉴权方式',
    dataIndex: 'authType',
    key: 'authType',
    width: 120,
    align: 'center',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'center',
    customRender: ({ text }) =>
      text === 'active'
        ? h(Tag, { color: 'success' }, () => '启用')
        : h(Tag, { color: 'default' }, () => '停用'),
  },
  {
    title: '操作',
    key: 'action',
    width: 180,
    align: 'center',
    customRender: ({ record }) =>
      h(Space, { size: 'small' }, () => [
        h(Tooltip, { title: '调试' }, () =>
          h(
            Button,
            {
              type: 'text',
              size: 'small',
              onClick: () => handleDebug(record),
            },
            () =>
              h(Icon, {
                icon: 'lucide:play-circle',
                class: 'size-4 text-blue-500',
              }),
          ),
        ),
        h(Tooltip, { title: '编辑' }, () =>
          h(
            Button,
            {
              type: 'text',
              size: 'small',
              onClick: () => handleEdit(record),
            },
            () =>
              h(Icon, { icon: 'lucide:edit', class: 'size-4 text-orange-500' }),
          ),
        ),
        h(
          Popconfirm,
          {
            title: '确定要删除此插件吗?',
            onConfirm: () => handleDelete(record.id),
          },
          () =>
            h(Tooltip, { title: '删除' }, () =>
              h(
                Button,
                {
                  type: 'text',
                  size: 'small',
                  danger: true,
                },
                () => h(Icon, { icon: 'lucide:trash-2', class: 'size-4' }),
              ),
            ),
        ),
      ]),
  },
];

onMounted(() => {
  fetchPlugins();
});
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="mb-4 flex items-center justify-between">
      <div class="text-sm text-muted-foreground">
        已接入
        <span class="font-medium text-foreground">{{ plugins.length }}</span>
        个数据源插件
      </div>
      <Button type="primary" @click="handleAdd">
        <Icon icon="lucide:plus" class="mr-1 size-4" />
        注册插件
      </Button>
    </div>

    <Table
      :columns="columns"
      :data-source="plugins"
      :loading="loading"
      :pagination="false"
      row-key="id"
      size="middle"
      class="flex-1 overflow-hidden"
      :scroll="{ y: 'calc(100vh - 300px)' }"
    />

    <DataPluginDrawer
      v-model:open="drawerOpen"
      :plugin="editingPlugin"
      @success="fetchPlugins"
    />
  </div>
</template>
