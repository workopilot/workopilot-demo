<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { Tenant, TenantAdmin } from '#/types/tenant';

import { computed, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import { Drawer, Empty, message, Table, Tag } from 'ant-design-vue';

import { getTenantAdminsApi } from '#/api/tenant';

interface Props {
  open: boolean;
  tenant: null | Tenant;
}

interface Emits {
  (e: 'update:open', value: boolean): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const drawerTitle = computed(() => {
  return props.tenant ? `${props.tenant.name} - 管理员列表` : '管理员列表';
});

// 管理员列表数据
const adminList = ref<TenantAdmin[]>([]);
const loading = ref(false);

// 获取管理员列表
async function fetchAdmins() {
  if (!props.tenant) return;

  loading.value = true;
  try {
    const response = await getTenantAdminsApi(props.tenant.id);
    adminList.value =
      response?.data && Array.isArray(response.data) ? response.data : [];
  } catch (error) {
    message.error('获取管理员列表失败');
    console.error(error);
    adminList.value = [];
  } finally {
    loading.value = false;
  }
}

function handleCancel() {
  emit('update:open', false);
}

// 表格列定义
const columns: TableColumnsType<TenantAdmin> = [
  {
    title: '用户账号',
    dataIndex: 'username',
    key: 'username',
    width: 180,
  },
  {
    title: '用户昵称',
    dataIndex: 'realName',
    key: 'realName',
    width: 120,
  },
  {
    title: '手机号',
    dataIndex: 'phone',
    key: 'phone',
    width: 140,
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    width: 220,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'center',
  },
];

// 当弹窗打开时获取数据
watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      fetchAdmins();
    }
  },
);
</script>

<template>
  <Drawer
    :open="open"
    :title="drawerTitle"
    placement="right"
    :width="750"
    @close="handleCancel"
  >
    <div v-if="tenant" class="space-y-6">
      <!-- 管理员列表 -->
      <div class="rounded-lg border border-border bg-card p-4">
        <div class="mb-3 flex items-center gap-2">
          <Icon icon="lucide:users" class="size-5 text-primary" />
          <span class="font-medium">管理员列表</span>
          <Tag color="blue">{{ adminList.length }} 人</Tag>
        </div>

        <div
          v-if="adminList.length > 0"
          class="overflow-auto rounded-lg border border-border"
        >
          <Table
            :columns="columns"
            :data-source="adminList"
            :pagination="false"
            :loading="loading"
            row-key="id"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Tag
                  :color="record.status === 'active' ? 'success' : 'default'"
                >
                  {{ record.status === 'active' ? '正常' : '停用' }}
                </Tag>
              </template>
            </template>
          </Table>
        </div>
        <div
          v-else-if="!loading"
          class="flex min-h-[200px] items-center justify-center rounded-lg border border-dashed border-border"
        >
          <Empty description="暂无管理员数据" />
        </div>
      </div>
    </div>
  </Drawer>
</template>
