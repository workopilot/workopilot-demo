<script setup lang="ts">
import type { EntityDraft } from '#/types/enterprise-entity';

import { computed, onActivated, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Input,
  message,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';

import {
  createEntityDraft,
  getEnterpriseEntitiesApi,
  saveEnterpriseEntityApi,
} from '#/api/enterprise-entity';

import CreateEntityModal from './modals/create-entity-modal.vue';

const router = useRouter();
const rows = ref<EntityDraft[]>([]);
const search = ref('');
const state = ref('全部');
const service = ref('全部');
const open = ref(false);
const loading = ref(false);
function status(item: EntityDraft) {
  if (item.activeVersion && item.releases.at(-1)?.revision === item.revision) {
    return '已完成';
  }
  if (item.identityVerified && item.modelConfirmed) {
    return item.attributes.every((a) => a.verified) ? '待验证' : '配置中';
  }
  return '配置中';
}
function serviceStatus(item: EntityDraft) {
  if (!item.activeVersion) return '未发布';
  return item.serviceEnabled ? '已启用' : '已停用';
}
const filtered = computed(() =>
  rows.value.filter(
    (item) =>
      `${item.name}${item.code}`
        .toLowerCase()
        .includes(search.value.toLowerCase()) &&
      (state.value === '全部' || status(item) === state.value) &&
      (service.value === '全部' || serviceStatus(item) === service.value),
  ),
);
const columns = [
  { title: '实体名称', key: 'name' },
  { title: '已接入来源', dataIndex: 'sources', key: 'sources' },
  { title: '实体数量', key: 'count' },
  { title: '实施状态', key: 'status' },
  { title: '生效版本', key: 'version' },
  { title: '服务状态', key: 'service' },
  { title: '待处理事项', key: 'pending' },
  { title: '最近更新', dataIndex: 'updatedAt', key: 'updatedAt' },
  { title: '操作', key: 'action', width: 250 },
];
async function load() {
  loading.value = true;
  try {
    const res = await getEnterpriseEntitiesApi();
    rows.value = res.data;
  } finally {
    loading.value = false;
  }
}
async function create(value: {
  code: string;
  description: string;
  name: string;
  uniqueKey: string;
}) {
  if (
    rows.value.some(
      (item) => item.code.toLowerCase() === value.code.toLowerCase(),
    )
  ) {
    message.warning('实体标识已存在');
    return;
  }
  const entity = createEntityDraft(
    value.name,
    value.code,
    value.uniqueKey,
    value.description,
  );
  await saveEnterpriseEntityApi(entity);
  open.value = false;
  router.push(`/knowledge-archives/entities/${entity.id}`);
}
function enter(item: EntityDraft, tab = 'sources') {
  router.push({
    path: `/knowledge-archives/entities/${item.id}`,
    query: { tab },
  });
}
onMounted(load);
onActivated(load);
</script>
<template>
  <div class="p-5">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">企业实体</h1>
        <p class="mt-2 text-gray-500">
          统一业务对象的身份、属性、关系及数据访问能力
        </p>
      </div>
      <Button type="primary" size="large" @click="open = true">
        <template #icon><Icon icon="lucide:plus" /></template>
        新建实体类型
      </Button>
    </div>
    <div class="mb-6 grid grid-cols-3 gap-4">
      <Card>
        <div class="text-gray-500">实体类型</div>
        <div class="mt-2 text-3xl font-semibold">{{ rows.length }}</div>
      </Card>
      <Card>
        <div class="text-gray-500">已注册实体</div>
        <div class="mt-2 text-3xl font-semibold">
          {{ rows.reduce((n, e) => n + e.records.length, 0) }}
        </div>
      </Card>
      <Card>
        <div class="text-gray-500">正式服务已启用</div>
        <div class="mt-2 text-3xl font-semibold text-blue-600">
          {{ rows.filter((e) => e.activeVersion && e.serviceEnabled).length }}
        </div>
      </Card>
    </div>
    <Card>
      <div class="mb-5 flex gap-3">
        <Input
          v-model:value="search"
          placeholder="搜索实体名称或标识"
          class="!w-72"
          allow-clear
        />
        <Select
          v-model:value="state"
          class="w-40"
          :options="
            ['全部', '配置中', '待验证', '已完成'].map((value) => ({
              value,
              label: value === '全部' ? '全部实施状态' : value,
            }))
          "
        />
        <Select
          v-model:value="service"
          class="w-40"
          :options="
            ['全部', '已启用', '已停用', '未发布'].map((value) => ({
              value,
              label: value === '全部' ? '全部服务状态' : value,
            }))
          "
        />
      </div>
      <Table
        :columns="columns"
        :data-source="filtered"
        row-key="id"
        :loading="loading"
        :scroll="{ x: 1400 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'name'">
            <Button
              type="link"
              class="!p-0"
              @click="enter(record as EntityDraft)"
            >
              {{ record.name }}
            </Button>
            <div class="text-xs text-gray-400">{{ record.code }}</div>
          </template>
          <template v-else-if="column.key === 'sources'">
            <Tag v-for="source in record.sources" :key="source">
              {{ source }}
            </Tag>
            <span v-if="record.sources.length === 0">未接入</span>
          </template>
          <template v-else-if="column.key === 'count'">
            {{ record.records.length }}
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag
              :color="
                status(record as EntityDraft) === '已完成' ? 'green' : 'blue'
              "
            >
              {{ status(record as EntityDraft) }}
            </Tag>
            <div class="mt-1 text-xs text-gray-400">
              草稿 {{ record.version }}
            </div>
          </template>
          <template v-else-if="column.key === 'version'">
            {{ record.activeVersion || '未发布' }}
          </template>
          <template v-else-if="column.key === 'service'">
            <Tag :color="record.serviceEnabled ? 'green' : 'default'">
              {{
                record.activeVersion
                  ? record.serviceEnabled
                    ? '已启用'
                    : '已停用'
                  : '未发布'
              }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'pending'">
            {{
              record.attributes.filter(
                (a: { verified: boolean }) => !a.verified,
              ).length
            }}
            个映射待确认
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" @click="enter(record as EntityDraft)">
              继续配置
            </Button>
            <Button type="link" @click="enter(record as EntityDraft, 'data')">
              实体数据
            </Button>
            <Button
              type="link"
              @click="enter(record as EntityDraft, 'services')"
            >
              服务
            </Button>
          </template>
        </template>
      </Table>
    </Card>
    <CreateEntityModal v-model:open="open" @create="create" />
  </div>
</template>
