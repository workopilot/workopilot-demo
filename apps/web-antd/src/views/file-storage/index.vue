<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { FileStorageConfig } from '#/types/file-storage';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Empty,
  Input,
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
  deleteStorageConfig,
  getStorageConfigs,
  testConnection,
  toggleStorageConfigStatus,
} from '#/api/file-storage';

import FormModal from './modals/form-modal.vue';

// ==================== 常量定义 ====================

const BUCKET_PERMISSION_TYPES = [
  { label: '私有', value: 'private' },
  { label: '公开', value: 'public' },
  { label: '自定义', value: 'custom' },
];

// ==================== 列表数据 ====================

const tableData = ref<FileStorageConfig[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);

// ==================== 筛选条件 ====================

const filterConfigName = ref('');
const filterServiceUrl = ref('');
const filterBucketName = ref('');
const filterBucketPermission = ref<string | undefined>();

// ==================== 弹窗状态 ====================

const formModalOpen = ref(false);
const editingConfig = ref<FileStorageConfig | null>(null);

// ==================== 获取数据 ====================

async function fetchConfigs() {
  loading.value = true;
  try {
    const response = await getStorageConfigs({
      page: currentPage.value,
      pageSize: pageSize.value,
      configName: filterConfigName.value || undefined,
      serviceUrl: filterServiceUrl.value || undefined,
      bucketName: filterBucketName.value || undefined,
      bucketPermission: filterBucketPermission.value as any,
    });
    tableData.value = response.data.items;
    total.value = response.data.total;
  } catch (error) {
    message.error('获取存储配置失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// ==================== 操作处理 ====================

/** 打开新增弹窗 */
function handleAdd() {
  editingConfig.value = null;
  formModalOpen.value = true;
}

/** 打开编辑弹窗 */
function handleEdit(config: FileStorageConfig) {
  editingConfig.value = config;
  formModalOpen.value = true;
}

/** 表单提交成功 */
function handleFormSuccess() {
  formModalOpen.value = false;
  fetchConfigs();
}

/** 测试连接 */
async function handleTestConnection(config: FileStorageConfig) {
  try {
    const response = await testConnection(config.id);
    if (response.data.success) {
      message.success(`连接成功！响应时间：${response.data.responseTime}`);
    } else {
      message.error(`连接失败：${response.data.message}`);
    }
  } catch (error) {
    message.error('测试连接失败');
    console.error(error);
  }
}

/** 切换状态 */
async function handleToggleStatus(config: FileStorageConfig) {
  try {
    // 如果是启用操作，需要先禁用其他已启用的配置
    if (config.status === 'disabled') {
      const enabledConfigs = tableData.value.filter(
        (c) => c.status === 'enabled',
      );
      for (const enabledConfig of enabledConfigs) {
        await toggleStorageConfigStatus(enabledConfig.id);
      }
    }
    await toggleStorageConfigStatus(config.id);
    message.success('状态更新成功');
    fetchConfigs();
  } catch (error) {
    message.error('状态更新失败');
    console.error(error);
  }
}

/** 删除配置 */
async function handleDelete(id: string) {
  try {
    await deleteStorageConfig(id);
    message.success('删除成功');
    fetchConfigs();
  } catch (error) {
    message.error('删除失败');
    console.error(error);
  }
}

/** 重置筛选 */
function handleResetFilters() {
  filterConfigName.value = '';
  filterServiceUrl.value = '';
  filterBucketName.value = '';
  filterBucketPermission.value = undefined;
  currentPage.value = 1;
  fetchConfigs();
}

// ==================== 格式化函数 ====================

function getBucketPermissionColor(type: string): string {
  switch (type) {
    case 'custom': {
      return 'blue';
    }
    case 'private': {
      return 'orange';
    }
    case 'public': {
      return 'green';
    }
    default: {
      return 'default';
    }
  }
}

function getBucketPermissionLabel(type: string): string {
  const found = BUCKET_PERMISSION_TYPES.find((t) => t.value === type);
  return found?.label || type;
}

// ==================== 表格列定义 ====================

const columns: TableColumnsType<FileStorageConfig> = [
  {
    title: '配置名称',
    dataIndex: 'configName',
    key: 'configName',
    width: 140,
  },
  {
    title: '服务地址',
    dataIndex: 'serviceUrl',
    key: 'serviceUrl',
    ellipsis: true,
  },
  {
    title: '桶名称',
    dataIndex: 'bucketName',
    key: 'bucketName',
    width: 140,
  },
  {
    title: '权限桶类型',
    key: 'bucketPermission',
    width: 110,
    align: 'center',
  },
  {
    title: '是否HTTPS',
    key: 'isHttps',
    width: 100,
    align: 'center',
  },
  {
    title: '状态',
    key: 'status',
    width: 80,
    align: 'center',
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    align: 'center',
    fixed: 'right',
  },
];

// ==================== 生命周期 ====================

onMounted(() => {
  fetchConfigs();
});
</script>

<template>
  <Page title="文件存储管理">
    <template #description>
      <span class="text-muted-foreground">
        管理文件存放的服务云服务器配置，支持 MinIO、华为云 OBS、阿里云
        OSS、腾讯云 COS、AWS S3 等主流对象存储服务。
      </span>
    </template>

    <!-- 筛选条件栏 -->
    <Card class="mb-4">
      <div
        class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
      >
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-muted-foreground">配置名称</label>
          <Input
            v-model:value="filterConfigName"
            placeholder="请输入配置名称"
            allow-clear
            @press-enter="fetchConfigs"
          >
            <template #prefix>
              <Icon icon="lucide:search" class="size-4 text-muted-foreground" />
            </template>
          </Input>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-muted-foreground">服务地址</label>
          <Input
            v-model:value="filterServiceUrl"
            placeholder="请输入服务地址"
            allow-clear
            @press-enter="fetchConfigs"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-muted-foreground">桶名称</label>
          <Input
            v-model:value="filterBucketName"
            placeholder="请输入桶名称"
            allow-clear
            @press-enter="fetchConfigs"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-muted-foreground">权限桶类型</label>
          <Select
            v-model:value="filterBucketPermission"
            placeholder="选择权限桶类型"
            allow-clear
            :options="BUCKET_PERMISSION_TYPES"
          />
        </div>

        <div class="flex items-end gap-2">
          <Button type="primary" @click="fetchConfigs">
            <Icon icon="lucide:search" class="mr-1 size-4" />
            查询
          </Button>
          <Button @click="handleResetFilters">
            <Icon icon="lucide:rotate-ccw" class="mr-1 size-4" />
            重置
          </Button>
        </div>
      </div>
    </Card>

    <!-- 操作栏 -->
    <Card class="mb-4">
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground">
          共 {{ total }} 条配置
        </span>
        <Button type="primary" size="small" @click="handleAdd">
          <Icon icon="lucide:plus" class="mr-1 size-4" />
          新增
        </Button>
      </div>
    </Card>

    <!-- 配置列表 -->
    <Card>
      <Table
        :columns="columns"
        :data-source="tableData"
        :row-key="(record: FileStorageConfig) => record.id"
        :pagination="false"
        :loading="loading"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'configName'">
            <div class="flex items-center gap-2">
              <Icon icon="lucide:database" class="size-4 text-primary" />
              <span class="font-medium">{{ record.configName }}</span>
            </div>
          </template>

          <template v-else-if="column.key === 'serviceUrl'">
            <div class="flex items-center gap-1">
              <Icon
                :icon="record.isHttps ? 'lucide:lock' : 'lucide:unlock'"
                class="size-3"
                :class="record.isHttps ? 'text-green-500' : 'text-orange-500'"
              />
              <span class="truncate text-xs">{{ record.serviceUrl }}</span>
            </div>
          </template>

          <template v-else-if="column.key === 'bucketPermission'">
            <Tag :color="getBucketPermissionColor(record.bucketPermission)">
              {{ getBucketPermissionLabel(record.bucketPermission) }}
            </Tag>
          </template>

          <template v-else-if="column.key === 'isHttps'">
            <Tag :color="record.isHttps ? 'success' : 'warning'">
              {{ record.isHttps ? '是' : '否' }}
            </Tag>
          </template>

          <template v-else-if="column.key === 'status'">
            <Tag
              :color="record.status === 'enabled' ? 'success' : 'default'"
              style="cursor: pointer"
              @click="handleToggleStatus(record)"
            >
              {{ record.status === 'enabled' ? '启用' : '禁用' }}
            </Tag>
          </template>

          <template v-else-if="column.key === 'actions'">
            <Space size="small">
              <Tooltip title="测试连接">
                <Button
                  type="text"
                  size="small"
                  @click="handleTestConnection(record)"
                >
                  <Icon icon="lucide:wifi" class="size-4 text-blue-500" />
                </Button>
              </Tooltip>
              <Tooltip title="编辑">
                <Button type="text" size="small" @click="handleEdit(record)">
                  <Icon icon="lucide:edit" class="size-4 text-orange-500" />
                </Button>
              </Tooltip>
              <Popconfirm
                title="确定要删除此配置吗?"
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

      <!-- 空状态 -->
      <div
        v-if="!loading && tableData.length === 0"
        class="flex min-h-[300px] items-center justify-center"
      >
        <Empty description="暂无存储配置" />
      </div>

      <!-- 分页 -->
      <div
        v-if="total > 0"
        class="flex items-center justify-end border-t px-4 py-3"
      >
        <Pagination
          v-model:current="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :show-total="(total: number) => `共 ${total} 条`"
          :page-size-options="['10', '20', '50']"
          size="small"
          @change="fetchConfigs"
        />
      </div>
    </Card>

    <!-- 新增/编辑弹窗 -->
    <FormModal
      v-model:open="formModalOpen"
      :config="editingConfig"
      @success="handleFormSuccess"
    />
  </Page>
</template>
