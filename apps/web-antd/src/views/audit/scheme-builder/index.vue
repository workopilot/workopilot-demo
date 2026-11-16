<script setup lang="ts">
import type { AuditScheme } from '#/types/audit';

import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  message,
  Popconfirm,
  Space,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteAuditSchemeApi, getAuditSchemesApi } from '#/api/audit';

import SchemeDrawer from './scheme-drawer.vue';

// --- Form ---
const [FormAdapter, formApi] = useVbenForm({
  showCollapseButton: false,
  layout: 'inline',
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  wrapperClass: 'grid grid-cols-1 md:grid-cols-3 gap-4',
  actionWrapperClass: 'col-span-1 md:col-span-1 justify-start',
  submitButtonOptions: {
    content: '查询',
  },
  showResetButton: false,
  schema: [
    {
      fieldName: 'keyword',
      label: '关键字',
      component: 'Input',
      componentProps: {
        placeholder: '方案名称',
      },
    },
  ],
});

// --- Table ---
const [TableAdapter, tableApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        title: '方案编码',
        field: 'code',
        align: 'left',
        width: 150,
      },
      {
        title: '方案名称',
        field: 'name',
        align: 'left',
      },
      {
        title: '适用单据',
        field: 'billType',
        slots: { default: 'billType' },
        align: 'left',
      },
      {
        title: '全局置信度',
        field: 'globalConfidenceThreshold',
        slots: { default: 'confidence' },
        align: 'right',
      },
      {
        title: '包含规则数',
        field: 'rules',
        slots: { default: 'rules' },
        align: 'right',
      },
      {
        title: '更新时间',
        field: 'updatedAt',
        align: 'right',
      },
      {
        title: '操作',
        field: 'action',
        fixed: 'right',
        width: 100,
        slots: { default: 'action' },
        align: 'center',
      },
    ],
    pagerConfig: {
      enabled: true,
    },
    proxyConfig: {
      autoLoad: true,
      ajax: {
        query: async () => {
          const res = await getAuditSchemesApi();
          // Filter locally since mock api doesn't support search yet
          const { keyword } = await formApi.getValues();
          let items = res.data;
          if (keyword) {
            items = items.filter((item) => item.name.includes(keyword));
          }
          return {
            items,
            total: items.length,
          };
        },
      },
    },
  },
});

// --- Drawer State ---
const drawerOpen = ref(false);
const currentRecord = ref<AuditScheme>();

function handleAdd() {
  currentRecord.value = undefined;
  drawerOpen.value = true;
}

function handleEdit(record: AuditScheme) {
  currentRecord.value = record;
  drawerOpen.value = true;
}

async function handleDelete(id: string) {
  try {
    await deleteAuditSchemeApi(id);
    message.success('删除成功');
    tableApi.reload();
  } catch (error: any) {
    message.error(error.message);
  }
}

function handleQuery() {
  tableApi.query();
}

function handleSuccess() {
  tableApi.reload();
}

// Bind form submit
formApi.setState({
  handleSubmit: handleQuery,
});
</script>

<template>
  <div class="flex h-full flex-col gap-4 p-4">
    <!-- Top Query Card -->
    <Card :bordered="false" class="shadow-sm">
      <FormAdapter />
    </Card>

    <!-- Bottom Table Card -->
    <Card
      :bordered="false"
      class="flex min-h-0 flex-1 flex-col shadow-sm"
      :body-style="{
        flex: 1,
        overflow: 'hidden',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
      }"
    >
      <div class="flex items-center justify-between border-b p-4">
        <div class="flex items-center text-lg font-bold">
          <Icon icon="lucide:layers" class="mr-2" />
          方案列表
        </div>
        <Button type="primary" @click="handleAdd">
          <Icon icon="lucide:plus" class="mr-1" />
          新建方案
        </Button>
      </div>

      <div class="flex-1 overflow-hidden p-2">
        <TableAdapter>
          <template #billType="{ row }">
            <Tag color="blue">{{ row.billType }}</Tag>
          </template>

          <template #confidence="{ row }">
            {{ row.globalConfidenceThreshold }}%
          </template>

          <template #rules="{ row }">
            {{ row.rules?.length || 0 }}
          </template>

          <template #action="{ row }">
            <Space>
              <Tooltip title="编辑">
                <Button type="text" size="small" @click="handleEdit(row)">
                  <Icon icon="lucide:edit" class="text-lg text-blue-500" />
                </Button>
              </Tooltip>
              <Popconfirm title="确定删除?" @confirm="handleDelete(row.id)">
                <Tooltip title="删除">
                  <Button type="text" danger size="small">
                    <Icon icon="lucide:trash-2" class="text-lg" />
                  </Button>
                </Tooltip>
              </Popconfirm>
            </Space>
          </template>
        </TableAdapter>
      </div>
    </Card>

    <SchemeDrawer
      v-model:open="drawerOpen"
      :record="currentRecord"
      @success="handleSuccess"
    />
  </div>
</template>
