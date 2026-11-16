<script setup lang="ts">
import type { AuditRule } from '#/types/audit';

import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Badge,
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
import { deleteAuditRuleApi, getAuditRulesApi } from '#/api/audit';

import RuleDrawer from './rule-drawer.vue';

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
        placeholder: '规则名称/编码',
      },
    },
    {
      fieldName: 'status',
      label: '状态',
      component: 'Select',
      componentProps: {
        options: [
          { label: '全部', value: '' },
          { label: '启用', value: 'active' },
          { label: '禁用', value: 'disabled' },
        ],
      },
    },
  ],
});

const [TableAdapter, tableApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      {
        title: '编码',
        field: 'code',
        minWidth: 150,
        align: 'left',
      },
      {
        title: '规则名称',
        field: 'name',
        slots: { default: 'name' },
        minWidth: 200,
        align: 'left',
      },
      {
        title: '适用范围',
        field: 'scope',
        slots: { default: 'scope' },
        width: 120,
        align: 'left',
      },
      {
        title: '科目',
        field: 'applicableCategories',
        slots: { default: 'subject' },
        minWidth: 150,
        align: 'left',
      },
      {
        title: '数据来源',
        field: 'dataSources',
        slots: { default: 'dataSources' },
        minWidth: 250,
        align: 'left',
      },
      {
        title: '状态',
        field: 'status',
        slots: { default: 'status' },
        width: 100,
        align: 'left',
      },
      {
        title: '更新时间',
        field: 'updatedAt',
        width: 160,
        align: 'right',
      },
      {
        title: '操作',
        field: 'action',
        slots: { default: 'action' },
        fixed: 'right',
        width: 100,
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
          const params = await formApi.getValues();
          const res = await getAuditRulesApi(params);
          return {
            items: res.data,
            total: res.data.length,
          };
        },
      },
    },
  },
});

const drawerOpen = ref(false);
const currentRecord = ref<AuditRule>();

function handleAdd() {
  currentRecord.value = undefined;
  drawerOpen.value = true;
}

function handleEdit(row: AuditRule) {
  currentRecord.value = row;
  drawerOpen.value = true;
}

async function handleDelete(id: string) {
  try {
    await deleteAuditRuleApi(id);
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
          <Icon icon="lucide:list" class="mr-2" />
          规则列表
        </div>
        <Button type="primary" @click="handleAdd">
          <Icon icon="lucide:plus" class="mr-1" />
          新增规则
        </Button>
      </div>

      <div class="flex-1 overflow-hidden p-2">
        <TableAdapter>
          <template #name="{ row }">
            <div class="text-base">{{ row.name }}</div>
          </template>

          <template #scope="{ row }">
            <Tag v-if="row.scope === 'line'" color="blue">行级</Tag>
            <Tag v-else color="purple">整单级</Tag>
          </template>

          <template #subject="{ row }">
            <div
              v-if="row.applicableCategories?.length"
              class="flex flex-wrap gap-1"
            >
              <Tag v-for="cat in row.applicableCategories" :key="cat">
                {{ cat }}
              </Tag>
            </div>
            <span v-else class="text-gray-400">-</span>
          </template>

          <template #dataSources="{ row }">
            <div class="flex flex-wrap gap-1">
              <template v-for="(ds, index) in row.dataSources" :key="index">
                <Tag v-if="ds.type === 'POLICY'" color="orange">
                  [制度] {{ ds.policyId || '未知' }}
                </Tag>
                <Tag v-if="ds.type === 'PLUGIN'" color="cyan">
                  [插件] {{ ds.pluginId || '未知' }}
                </Tag>
                <Tag v-if="ds.type === 'ATTACH'" color="green">
                  [附件] {{ ds.filterCats?.join(',') || '全部' }}
                </Tag>
              </template>
            </div>
          </template>

          <template #status="{ row }">
            <Badge
              :status="row.status === 'active' ? 'success' : 'error'"
              :text="row.status === 'active' ? '启用' : '禁用'"
            />
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

    <RuleDrawer
      v-model:open="drawerOpen"
      :record="currentRecord"
      @success="handleSuccess"
    />
  </div>
</template>
