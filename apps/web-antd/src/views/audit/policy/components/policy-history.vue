<script setup lang="ts">
import type { PolicyVersion } from '#/types/policy';

import { ref, watch } from 'vue';

import { Button, Table, Tag } from 'ant-design-vue';

import { getPolicyVersionsApi } from '#/api/policy';

const props = defineProps<{
  policyId: string;
}>();

const versions = ref<PolicyVersion[]>([]);
const loading = ref(false);

const columns = [
  {
    title: '版本号',
    dataIndex: 'version',
    key: 'version',
    width: 100,
  },
  {
    title: '文件名',
    dataIndex: 'fileName',
    key: 'fileName',
  },
  {
    title: '上传人',
    dataIndex: 'uploader',
    key: 'uploader',
    width: 120,
  },
  {
    title: '上传时间',
    dataIndex: 'uploadedAt',
    key: 'uploadedAt',
    width: 180,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
  },
];

async function fetchVersions() {
  if (!props.policyId) return;
  loading.value = true;
  try {
    const res = await getPolicyVersionsApi(props.policyId);
    versions.value = res.data;
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.policyId,
  (val) => {
    if (val) fetchVersions();
  },
  { immediate: true },
);
</script>

<template>
  <div class="flex h-full flex-col p-4">
    <div class="mb-4 flex items-center justify-between">
      <h3 class="text-lg font-bold">文件历史记录</h3>
    </div>

    <Table
      :columns="columns"
      :data-source="versions"
      :loading="loading"
      row-key="id"
      :pagination="false"
      class="flex-1 overflow-auto bg-white"
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'version'">
          <Tag color="blue">{{ record.version }}</Tag>
        </template>
        <template v-if="column.key === 'status'">
          <Tag v-if="record.status === 'parsed'" color="green">已解析</Tag>
          <Tag v-else-if="record.status === 'parsing'" color="orange">
            解析中
          </Tag>
          <Tag v-else color="red">失败</Tag>
        </template>
        <template v-if="column.key === 'action'">
          <Button type="link" size="small">下载</Button>
        </template>
      </template>
    </Table>
  </div>
</template>
