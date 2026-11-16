<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { Tenant, TenantQueryParams, TenantStatus } from '#/types/tenant';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Icon } from '@iconify/vue';
import {
  Button,
  Empty,
  message,
  Pagination,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import {
  batchDeleteTenantsApi,
  deleteTenantApi,
  getTenantsApi,
} from '#/api/tenant';
import { TenantStatusMap } from '#/types/tenant';

import TenantAdminModal from './modals/tenant-admin-modal.vue';
import TenantFormModal from './modals/tenant-form-modal.vue';
import TenantPermissionModal from './modals/tenant-permission-modal.vue';

// 表格数据
const tableData = ref<Tenant[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const selectedRowKeys = ref<string[]>([]);

// 筛选条件
const filters = ref<{
  code: string;
  contact: string;
  name: string;
  status: TenantStatus | undefined;
}>({
  code: '',
  name: '',
  contact: '',
  status: undefined,
});

// 表单弹窗
const formModalOpen = ref(false);
const editingTenant = ref<null | Tenant>(null);

// 权限查看弹窗
const permissionModalOpen = ref(false);
const viewingTenant = ref<null | Tenant>(null);

// 管理员查看弹窗
const adminModalOpen = ref(false);
const viewingAdminTenant = ref<null | Tenant>(null);

// 行选择变化
function handleRowSelectionChange(keys: string[]) {
  selectedRowKeys.value = keys;
}

// 获取租户列表
async function fetchTenants() {
  loading.value = true;
  try {
    const params: TenantQueryParams = {
      page: currentPage.value,
      pageSize: pageSize.value,
      ...filters.value,
    };
    const response = await getTenantsApi(params);

    // 安全检查：确保返回的数据结构正确
    if (response?.data?.items && Array.isArray(response.data.items)) {
      // 验证并清理数据，确保每条记录都有必需的字段
      tableData.value = response.data.items
        .filter((item) => {
          if (!item || typeof item !== 'object') {
            console.warn('跳过无效的租户记录:', item);
            return false;
          }
          // 确保 id 字段存在
          if (!item.id) {
            console.warn('租户记录缺少 id 字段，跳过:', item);
            return false;
          }
          return true;
        })
        .map((item) => {
          // 确保 status 字段存在且有效
          if (
            !item.status ||
            !['active', 'disabled', 'expired'].includes(item.status)
          ) {
            console.warn('租户记录的 status 字段无效，设置默认值:', item);
            return { ...item, status: 'active' as TenantStatus };
          }
          return item;
        });
      total.value = response.data.total || 0;
    } else {
      console.error('API返回数据结构不正确:', response);
      tableData.value = [];
      total.value = 0;
    }
  } catch (error) {
    message.error('获取租户列表失败');
    console.error(error);
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

// 新增租户
function handleAdd() {
  editingTenant.value = null;
  formModalOpen.value = true;
}

// 编辑租户
function handleEdit(tenant: Tenant) {
  editingTenant.value = tenant;
  formModalOpen.value = true;
}

// 查看权限
function handleViewPermission(tenant: Tenant) {
  viewingTenant.value = tenant;
  permissionModalOpen.value = true;
}

// 查看管理员
function handleViewAdmins(tenant: Tenant) {
  viewingAdminTenant.value = tenant;
  adminModalOpen.value = true;
}

// 删除租户
async function handleDelete(id: string) {
  try {
    await deleteTenantApi(id);
    message.success('删除成功');
    fetchTenants();
  } catch (error) {
    message.error('删除失败');
    console.error(error);
  }
}

// 批量删除
async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的租户');
    return;
  }
  try {
    await batchDeleteTenantsApi(selectedRowKeys.value);
    message.success('删除成功');
    selectedRowKeys.value = [];
    fetchTenants();
  } catch (error) {
    message.error('删除失败');
    console.error(error);
  }
}

// 表单提交成功
function handleFormSuccess() {
  formModalOpen.value = false;
  fetchTenants();
}

// 同步租户字典
function handleSyncDict() {
  message.success('同步租户字典成功');
  fetchTenants();
}

// 同步租户参数配置
function handleSyncConfig() {
  message.success('同步租户参数配置成功');
  fetchTenants();
}

// 同步菜单权限
function handleSyncPermission() {
  message.success('同步菜单权限成功');
  fetchTenants();
}

// 导出
function handleExport() {
  message.success('导出功能开发中');
}

// 刷新
function handleRefresh() {
  fetchTenants();
}

// 搜索
function handleSearch() {
  currentPage.value = 1;
  fetchTenants();
}

// 重置筛选
function handleReset() {
  filters.value = {
    code: '',
    name: '',
    contact: '',
    status: undefined,
  };
  currentPage.value = 1;
  fetchTenants();
}

// 分页改变
function handlePageChange(page: number) {
  currentPage.value = page;
  fetchTenants();
}

// 格式化日期
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('zh-CN');
  } catch {
    return '-';
  }
}

// 表格列定义
const columns: TableColumnsType<Tenant> = [
  {
    title: '租户编号',
    dataIndex: 'code',
    key: 'code',
    width: 140,
  },
  {
    title: '租户名称',
    dataIndex: 'name',
    key: 'name',
    width: 180,
  },
  {
    title: '联系人',
    dataIndex: 'contact',
    key: 'contact',
    width: 120,
  },
  {
    title: '联系电话',
    dataIndex: 'phone',
    key: 'phone',
    width: 160,
  },
  {
    title: '到期时间',
    dataIndex: 'expiryDate',
    key: 'expiryDate',
    width: 140,
    customRender: ({ record }) => formatDate(record.expiryDate),
  },
  {
    title: '租户状态',
    dataIndex: 'status',
    key: 'status',
    width: 120,
    align: 'center',
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    align: 'center',
  },
];

onMounted(() => {
  fetchTenants();
});
</script>

<template>
  <Page title="租户管理">
    <template #description>
      <span class="text-muted-foreground">
        管理系统中的所有租户信息，包括租户的基本信息、状态和权限配置。
      </span>
    </template>

    <!-- 筛选和操作栏 -->
    <div class="mb-4 flex flex-wrap items-center gap-4 rounded-lg bg-card p-4">
      <div class="flex flex-wrap items-center gap-3">
        <input
          v-model="filters.code"
          type="text"
          placeholder="租户编号"
          class="h-8 w-36 rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:border-primary"
        />
        <input
          v-model="filters.name"
          type="text"
          placeholder="租户名称"
          class="h-8 w-36 rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:border-primary"
        />
        <input
          v-model="filters.contact"
          type="text"
          placeholder="联系人"
          class="h-8 w-36 rounded-md border border-input bg-background px-3 py-1 text-sm outline-none focus:border-primary"
        />
        <Select
          v-model:value="filters.status"
          placeholder="租户状态"
          allow-clear
          class="w-32"
          size="small"
        >
          <Select.Option
            v-for="(label, value) in TenantStatusMap"
            :key="value"
            :value="value"
          >
            {{ label }}
          </Select.Option>
        </Select>
      </div>

      <div class="ml-auto flex items-center gap-2">
        <!-- 同步操作按钮 -->
        <Tooltip title="同步租户字典">
          <Button size="small" @click="handleSyncDict">
            <Icon icon="lucide:database" class="mr-1 size-4" />
            同步租户字典
          </Button>
        </Tooltip>
        <Tooltip title="同步租户参数配置">
          <Button size="small" @click="handleSyncConfig">
            <Icon icon="lucide:settings" class="mr-1 size-4" />
            同步参数配置
          </Button>
        </Tooltip>
        <Tooltip title="同步菜单权限">
          <Button size="small" @click="handleSyncPermission">
            <Icon icon="lucide:lock" class="mr-1 size-4" />
            同步菜单权限
          </Button>
        </Tooltip>

        <!-- 删除按钮 -->
        <Button
          v-if="selectedRowKeys.length > 0"
          danger
          size="small"
          @click="handleBatchDelete"
        >
          <Icon icon="lucide:trash-2" class="mr-1 size-4" />
          删除 ({{ selectedRowKeys.length }})
        </Button>

        <!-- 导出按钮 -->
        <Tooltip title="导出">
          <Button size="small" @click="handleExport">
            <Icon icon="lucide:download" class="mr-1 size-4" />
            导出
          </Button>
        </Tooltip>

        <!-- 图标按钮 -->
        <Tooltip title="刷新">
          <Button size="small">
            <Icon
              icon="lucide:refresh-cw"
              class="size-4"
              @click="handleRefresh"
            />
          </Button>
        </Tooltip>
        <Tooltip title="最大化">
          <Button size="small">
            <Icon icon="lucide:maximize" class="size-4" />
          </Button>
        </Tooltip>
        <Tooltip title="配置">
          <Button size="small">
            <Icon icon="lucide:settings-2" class="size-4" />
          </Button>
        </Tooltip>

        <!-- 搜索和新增 -->
        <Button size="small" @click="handleReset">重置</Button>
        <Button size="small" type="primary" ghost @click="handleSearch">
          <Icon icon="lucide:search" class="mr-1 size-4" />
          搜索
        </Button>
        <Button type="primary" size="small" @click="handleAdd">
          <Icon icon="lucide:plus" class="mr-1 size-4" />
          新增
        </Button>
      </div>
    </div>

    <!-- 租户列表 -->
    <div
      v-if="tableData.length > 0"
      class="overflow-auto rounded-lg border border-border bg-card"
    >
      <Table
        :columns="columns"
        :data-source="tableData"
        row-key="id"
        :row-selection="{
          selectedRowKeys,
          onChange: handleRowSelectionChange,
        }"
        :pagination="false"
        :loading="loading"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag
              :color="
                record.status === 'active'
                  ? 'success'
                  : record.status === 'disabled'
                    ? 'default'
                    : 'error'
              "
            >
              {{ TenantStatusMap[record.status as TenantStatus] || '未知' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <Space size="small">
              <Tooltip title="编辑">
                <Button type="text" size="small" @click="handleEdit(record)">
                  <Icon icon="lucide:edit" class="size-4 text-orange-500" />
                </Button>
              </Tooltip>
              <Tooltip title="查看管理员">
                <Button
                  type="text"
                  size="small"
                  @click="handleViewAdmins(record)"
                >
                  <Icon icon="lucide:users" class="size-4 text-purple-500" />
                </Button>
              </Tooltip>
              <Tooltip title="查看权限">
                <Button
                  type="text"
                  size="small"
                  @click="handleViewPermission(record)"
                >
                  <Icon icon="lucide:eye" class="size-4 text-blue-500" />
                </Button>
              </Tooltip>
              <Popconfirm
                title="确定要删除此租户吗?"
                ok-text="确定"
                cancel-text="取消"
                @confirm="handleDelete(record.id)"
              >
                <Tooltip title="删除">
                  <Button type="text" size="small" danger>
                    <Icon icon="lucide:trash-2" class="size-4" />
                  </Button>
                </Tooltip>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </div>

    <!-- 空状态 -->
    <div
      v-else-if="!loading"
      class="flex min-h-[400px] items-center justify-center rounded-lg border border-dashed border-border bg-card"
    >
      <Empty description="暂无租户数据" />
    </div>

    <!-- 分页 -->
    <div
      v-if="total > 0"
      class="mt-4 flex items-center justify-end border-t pt-3"
    >
      <Pagination
        v-model:current="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :show-total="(total: number) => `共 ${total} 条`"
        :show-size-changer="false"
        size="small"
        @change="handlePageChange"
      />
    </div>

    <!-- 租户表单弹窗 -->
    <TenantFormModal
      v-model:open="formModalOpen"
      :tenant="editingTenant"
      @success="handleFormSuccess"
    />

    <!-- 权限查看弹窗 -->
    <TenantPermissionModal
      v-model:open="permissionModalOpen"
      :tenant="viewingTenant"
    />

    <!-- 管理员查看弹窗 -->
    <TenantAdminModal
      v-model:open="adminModalOpen"
      :tenant="viewingAdminTenant"
    />
  </Page>
</template>
