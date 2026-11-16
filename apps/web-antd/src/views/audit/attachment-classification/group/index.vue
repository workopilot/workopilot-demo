<script setup lang="ts">
import type { AttachmentGroup } from '#/types/attachment-classification';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Input,
  message,
  Popconfirm,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  deleteAttachmentGroupApi,
  getAttachmentGroupsApi,
} from '#/api/attachment-classification';

import GroupDrawer from './group-drawer.vue';

const loading = ref(false);
const dataSource = ref<AttachmentGroup[]>([]);
const drawerVisible = ref(false);
const currentGroup = ref<AttachmentGroup | null>(null);
const searchKeyword = ref('');

const columns = [
  {
    title: '序号',
    key: 'index',
    width: 80,
    align: 'center',
  },
  {
    title: '组编码',
    dataIndex: 'code',
    key: 'code',
    width: 150,
  },
  {
    title: '组名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
  },
  {
    title: '状态',
    dataIndex: 'enabled',
    key: 'enabled',
    width: 100,
  },
  {
    title: '更新时间',
    dataIndex: 'updatedAt',
    key: 'updatedAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right',
  },
];

async function fetchGroups() {
  loading.value = true;
  try {
    const res = await getAttachmentGroupsApi();
    dataSource.value = res.data;
  } catch {
    message.error('加载附件组失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  // Mock search logic
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
    message.success('查询成功');
  }, 500);
}

function handleAdd() {
  currentGroup.value = null;
  drawerVisible.value = true;
}

function handleEdit(record: AttachmentGroup) {
  currentGroup.value = record;
  drawerVisible.value = true;
}

async function handleDelete(id: string) {
  try {
    await deleteAttachmentGroupApi(id);
    message.success('删除成功');
    fetchGroups();
  } catch {
    message.error('删除失败');
  }
}

function handleSuccess() {
  fetchGroups();
}

onMounted(() => {
  fetchGroups();
});
</script>

<template>
  <Page title="附件组管理">
    <div class="flex flex-col gap-4 p-4">
      <!-- 查询卡片 -->
      <Card :bordered="false" class="shadow-sm">
        <div class="flex items-center">
          <Input.Search
            v-model:value="searchKeyword"
            placeholder="请输入关键字搜索"
            enter-button="搜索"
            class="w-96"
            @search="handleSearch"
          />
        </div>
      </Card>

      <!-- 数据卡片 -->
      <Card :bordered="false" class="shadow-sm">
        <template #title>
          <div class="flex items-center gap-2">
            <Icon icon="lucide:layers" class="size-5" />
            <span>附件组列表</span>
          </div>
        </template>
        <template #extra>
          <Button type="primary" @click="handleAdd">
            <template #icon>
              <Icon icon="lucide:plus" />
            </template>
            新增分组
          </Button>
        </template>

        <Table
          :columns="columns"
          :data-source="dataSource"
          :loading="loading"
          :pagination="false"
          row-key="id"
        >
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">
              {{ index + 1 }}
            </template>

            <template v-if="column.key === 'enabled'">
              <Tag :color="record.enabled ? 'success' : 'error'">
                {{ record.enabled ? '启用' : '禁用' }}
              </Tag>
            </template>

            <template v-if="column.key === 'updatedAt'">
              {{ new Date(record.updatedAt).toLocaleString() }}
            </template>

            <template v-if="column.key === 'action'">
              <Space>
                <Button size="small" type="link" @click="handleEdit(record)">
                  编辑
                </Button>
                <Popconfirm
                  title="确定要删除该附件组吗？"
                  @confirm="handleDelete(record.id)"
                >
                  <Button danger size="small" type="link">删除</Button>
                </Popconfirm>
              </Space>
            </template>
          </template>
        </Table>
      </Card>

      <GroupDrawer
        v-model:open="drawerVisible"
        :group="currentGroup"
        @success="handleSuccess"
      />
    </div>
  </Page>
</template>
