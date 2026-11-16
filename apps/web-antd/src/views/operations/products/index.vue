<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { Product, ProductVersion, ServiceConfig } from '#/types/billing';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Icon } from '@iconify/vue';
import {
  Button,
  Empty,
  message,
  Pagination,
  Popconfirm,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import {
  batchDeleteProductsApi,
  deleteProductApi,
  getProductsApi,
  getServiceConfigsApi,
} from '#/api/billing';
import { ProductVersionMap } from '#/types/billing';

import ProductFormDrawer from './modals/product-form-drawer.vue';
import ServiceEditModal from './modals/service-edit-modal.vue';

// 左侧服务列表
const serviceList = ref<ServiceConfig[]>([]);
const selectedServiceId = ref<string>('all'); // 默认选中"全部服务"
const selectedService = ref<null | ServiceConfig>(null);

// "全部服务"选项
const allServiceOption: ServiceConfig = {
  id: 'all',
  name: '全部服务',
  description: '查看所有产品规格',
  status: 'enabled',
  createdAt: '',
  updatedAt: '',
};

// 服务编辑弹窗
const serviceModalOpen = ref(false);
const editingService = ref<null | ServiceConfig>(null);

// 右侧产品规格列表
const tableData = ref<Product[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const selectedRowKeys = ref<string[]>([]);

// 产品表单抽屉
const formDrawerOpen = ref(false);
const editingProduct = ref<null | Product>(null);

// 获取服务列表
async function fetchServices() {
  try {
    const response = await getServiceConfigsApi();
    serviceList.value = response.data;
    // 默认选中"全部服务"
    selectedServiceId.value = 'all';
    selectedService.value = allServiceOption;
    // 获取产品列表
    await fetchProducts();
  } catch (error) {
    message.error('获取服务列表失败');
    console.error(error);
  }
}

// 选择服务
function handleSelectService(service: ServiceConfig) {
  selectedServiceId.value = service.id;
  selectedService.value = service;
  // 刷新产品列表
  currentPage.value = 1;
  fetchProducts();
}

// 编辑服务
function handleEditService(service: ServiceConfig) {
  editingService.value = service;
  serviceModalOpen.value = true;
}

// 服务编辑成功
function handleServiceSuccess() {
  serviceModalOpen.value = false;
  fetchServices();
}

// 获取产品列表
async function fetchProducts() {
  if (!selectedService.value) return;

  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    // 只有选中具体服务时才添加 serviceName 过滤
    if (selectedService.value.id !== 'all') {
      params.serviceName = selectedService.value.name;
    }
    const response = await getProductsApi(params);
    tableData.value = response.data.items;
    total.value = response.data.total;
  } catch (error) {
    message.error('获取产品列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// 新增产品
function handleAdd() {
  editingProduct.value = null;
  formDrawerOpen.value = true;
}

// 编辑产品
function handleEdit(product: Product) {
  editingProduct.value = product;
  formDrawerOpen.value = true;
}

// 删除产品
async function handleDelete(id: string) {
  try {
    await deleteProductApi(id);
    message.success('删除成功');
    fetchProducts();
  } catch (error) {
    message.error('删除失败');
    console.error(error);
  }
}

// 行选择变化
function handleRowSelectionChange(keys: string[]) {
  selectedRowKeys.value = keys;
}

// 批量删除
async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的产品');
    return;
  }
  try {
    await batchDeleteProductsApi(selectedRowKeys.value);
    message.success('删除成功');
    selectedRowKeys.value = [];
    fetchProducts();
  } catch (error) {
    message.error('删除失败');
    console.error(error);
  }
}

// 表单提交成功
function handleFormSuccess() {
  formDrawerOpen.value = false;
  fetchProducts();
}

// 刷新
function handleRefresh() {
  fetchProducts();
}

// 分页改变
function handlePageChange(page: number) {
  currentPage.value = page;
  fetchProducts();
}

// 格式化版本显示
function formatVersion(version: ProductVersion): string {
  return ProductVersionMap[version] || version;
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
}

// 获取服务图标
function getServiceIcon(serviceName: string): string {
  const iconMap: Record<string, string> = {
    智能附件分类: 'lucide:file-stack',
    智能附件比对: 'lucide:files',
    智能单据填报: 'lucide:file-edit',
    智能单据审核: 'lucide:file-check',
    智能业务合规: 'lucide:shield-check',
    智能合规审计: 'lucide:clipboard-check',
  };
  return iconMap[serviceName] || 'lucide:box';
}

// 表格列定义
const columns: TableColumnsType<Product> = [
  {
    title: '服务名称',
    dataIndex: 'serviceName',
    key: 'serviceName',
    width: 140,
  },
  {
    title: '产品规格',
    dataIndex: 'version',
    key: 'version',
    width: 120,
  },
  {
    title: '规格描述',
    dataIndex: 'versionDescription',
    key: 'versionDescription',
    ellipsis: true,
  },
  {
    title: '单价（元/月）',
    dataIndex: 'price',
    key: 'price',
    width: 140,
    align: 'right',
  },
  {
    title: '数量限制（次/月）',
    dataIndex: 'usageLimit',
    key: 'usageLimit',
    width: 160,
    align: 'right',
  },
  {
    title: 'Tokens限制（个/月）',
    dataIndex: 'tokensLimit',
    key: 'tokensLimit',
    width: 180,
    align: 'right',
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    align: 'center',
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 120,
    customRender: ({ record }) => formatDate(record.createdAt),
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    align: 'center',
    fixed: 'right',
  },
];

onMounted(() => {
  fetchServices();
});
</script>

<template>
  <Page title="产品服务">
    <template #description>
      <span class="text-muted-foreground">
        配置智能审核系统的产品服务及版本。
        <strong>服务配置</strong> 定义可用的 AI 智能服务类型；
        <strong>产品规格</strong> 定义每个服务的不同规格和价格方案。
      </span>
    </template>

    <div class="flex h-full min-h-[600px] flex-col gap-4 lg:flex-row">
      <!-- Left Sidebar: Service List -->
      <div
        class="h-full w-full flex-shrink-0 rounded-lg border border-border bg-card p-4 lg:w-64"
      >
        <div class="mb-4 flex items-center gap-2 font-medium">
          <Icon icon="lucide:package" class="size-4" />
          <span>服务列表</span>
        </div>

        <div class="space-y-1">
          <!-- 全部服务选项 -->
          <div
            class="group flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5 transition-colors"
            :class="
              selectedServiceId === 'all'
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted'
            "
            @click="handleSelectService(allServiceOption)"
          >
            <div class="flex items-center gap-2">
              <Icon icon="lucide:list" class="size-4 shrink-0" />
              <span class="text-sm font-medium">全部服务</span>
            </div>
          </div>

          <!-- 具体服务列表 -->
          <div
            v-for="service in serviceList"
            :key="service.id"
            class="group flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5 transition-colors"
            :class="
              selectedServiceId === service.id
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted'
            "
            @click="handleSelectService(service)"
          >
            <div class="flex items-center gap-2">
              <Icon
                :icon="getServiceIcon(service.name)"
                class="size-4 shrink-0"
              />
              <span class="truncate text-sm font-medium">{{
                service.name
              }}</span>
            </div>
            <Tooltip title="编辑服务">
              <Button
                type="text"
                size="small"
                class="opacity-0 group-hover:opacity-100"
                @click.stop="handleEditService(service)"
              >
                <Icon icon="lucide:edit-3" class="size-4" />
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>

      <!-- Right Content: Product Spec List -->
      <div class="flex min-w-0 flex-1 flex-col">
        <!-- Product List Container -->
        <div
          class="flex flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm"
        >
          <!-- Header -->
          <div class="border-b px-4 py-3">
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <Icon
                  v-if="selectedService?.id !== 'all' && selectedService"
                  :icon="getServiceIcon(selectedService.name)"
                  class="size-5 text-primary"
                />
                <Icon
                  v-else
                  icon="lucide:package"
                  class="size-5 text-primary"
                />
                <div class="flex items-center gap-2">
                  <span class="text-sm text-muted-foreground">当前服务</span>
                  <span class="font-semibold text-foreground">
                    {{ selectedService?.name || '请选择服务' }}
                  </span>
                  <Tag
                    v-if="selectedService && selectedService.id !== 'all'"
                    :color="
                      selectedService?.status === 'enabled'
                        ? 'success'
                        : 'default'
                    "
                    size="small"
                  >
                    {{
                      selectedService?.status === 'enabled'
                        ? '已启用'
                        : '已禁用'
                    }}
                  </Tag>
                </div>
              </div>
            </div>
            <div class="flex items-center justify-end gap-2">
              <Button
                v-if="selectedRowKeys.length > 0"
                danger
                size="small"
                @click="handleBatchDelete"
              >
                <Icon icon="lucide:trash-2" class="mr-1 size-4" />
                批量删除 ({{ selectedRowKeys.length }})
              </Button>
              <Tooltip title="导出">
                <Button size="small">
                  <Icon icon="lucide:download" class="size-4" />
                </Button>
              </Tooltip>
              <Tooltip title="刷新">
                <Button size="small" @click="handleRefresh">
                  <Icon icon="lucide:refresh-cw" class="size-4" />
                </Button>
              </Tooltip>
              <Button type="primary" size="small" @click="handleAdd">
                <Icon icon="lucide:plus" class="mr-1 size-4" />
                新增规格
              </Button>
            </div>
          </div>

          <!-- Product List (Table) -->
          <div v-if="tableData.length > 0" class="flex-1 overflow-auto">
            <Table
              :columns="columns"
              :data-source="tableData"
              :row-key="(record: Product) => record.id"
              :row-selection="{
                selectedRowKeys,
                onChange: handleRowSelectionChange,
              }"
              :pagination="false"
              :loading="loading"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'version'">
                  <Tag color="blue">{{ formatVersion(record.version) }}</Tag>
                </template>
                <template v-else-if="column.key === 'status'">
                  <Tag
                    :color="record.status === 'enabled' ? 'success' : 'default'"
                  >
                    {{ record.status === 'enabled' ? '启用' : '禁用' }}
                  </Tag>
                </template>
                <template v-else-if="column.key === 'price'">
                  <span class="font-mono"
                    >¥{{ record.price.toLocaleString() }}</span
                  >
                </template>
                <template v-else-if="column.key === 'usageLimit'">
                  <span class="font-mono">{{
                    record.usageLimit === 999999
                      ? '不限'
                      : record.usageLimit.toLocaleString()
                  }}</span>
                </template>
                <template v-else-if="column.key === 'tokensLimit'">
                  <span class="font-mono">{{
                    record.tokensLimit === 999999999
                      ? '不限'
                      : record.tokensLimit.toLocaleString()
                  }}</span>
                </template>
                <template v-else-if="column.key === 'actions'">
                  <Space size="small">
                    <Tooltip title="编辑">
                      <Button
                        type="text"
                        size="small"
                        @click="handleEdit(record)"
                      >
                        <Icon
                          icon="lucide:edit"
                          class="size-4 text-orange-500"
                        />
                      </Button>
                    </Tooltip>
                    <Popconfirm
                      title="确定要删除此产品规格吗?"
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

          <!-- Empty State -->
          <div
            v-else-if="!loading"
            class="flex min-h-[300px] flex-1 items-center justify-center"
          >
            <Empty description="暂无产品规格" />
          </div>

          <!-- Pagination -->
          <div
            v-if="total > 0"
            class="flex items-center justify-end border-t px-4 py-3"
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
        </div>
      </div>
    </div>

    <!-- 服务编辑弹窗 -->
    <ServiceEditModal
      v-model:open="serviceModalOpen"
      :service="editingService"
      @success="handleServiceSuccess"
    />

    <!-- 产品表单抽屉 -->
    <ProductFormDrawer
      v-model:open="formDrawerOpen"
      :product="editingProduct"
      :service-name="selectedService?.name"
      :service-list="serviceList"
      @success="handleFormSuccess"
    />
  </Page>
</template>
