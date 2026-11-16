<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type {
  Developer,
  DeveloperQueryParams,
} from '#/types/developer-management';

import { onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Input,
  message,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { getDevelopersApi } from '#/api/developer-management';

import RechargeModal from './modals/recharge-modal.vue';

// 表格数据
const tableData = ref<Developer[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);

// 查询参数
const queryParams = ref<DeveloperQueryParams>({
  page: 1,
  pageSize: 20,
  keyword: '',
});

// 充值弹窗状态
const rechargeOpen = ref(false);
const selectedDeveloper = ref<Developer | null>(null);

// 获取列表
async function fetchList() {
  loading.value = true;
  try {
    const params = {
      ...queryParams.value,
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    const response = await getDevelopersApi(params);
    tableData.value = response.data.items;
    total.value = response.data.total;
  } catch (error) {
    console.error(error);
    message.error('获取开发者列表失败');
  } finally {
    loading.value = false;
  }
}

// 查询
function handleSearch() {
  currentPage.value = 1;
  fetchList();
}

// 重置
function handleReset() {
  queryParams.value = { page: 1, pageSize: pageSize.value, keyword: '' };
  currentPage.value = 1;
  fetchList();
}

// 刷新
function handleRefresh() {
  fetchList();
}

// 充值
function handleRecharge(record: Developer) {
  selectedDeveloper.value = record;
  rechargeOpen.value = true;
}

// 充值成功后刷新
function handleRechargeSuccess() {
  fetchList();
}

// 数字千分位格式化
function formatNumber(value: number): string {
  return value.toLocaleString('en-US');
}

// 开通时间本地化
function formatTime(value: string): string {
  return new Date(value).toLocaleDateString('zh-CN');
}

// 可用 Token 预警(低于 5 万标红)
function isLowBalance(value: number): boolean {
  return value < 50_000;
}

// 表格列定义
const columns: TableColumnsType<Developer> = [
  {
    title: '开发者租户名称',
    dataIndex: 'tenantName',
    key: 'tenantName',
    width: 220,
    fixed: 'left',
  },
  {
    title: '负责人',
    dataIndex: 'ownerName',
    key: 'ownerName',
    width: 100,
  },
  {
    title: '开通时间',
    dataIndex: 'activatedAt',
    key: 'activatedAt',
    width: 130,
  },
  {
    title: '已消耗 Token',
    dataIndex: 'consumedTokens',
    key: 'consumedTokens',
    width: 150,
    align: 'right',
  },
  {
    title: '可用 Token',
    dataIndex: 'availableTokens',
    key: 'availableTokens',
    width: 170,
    align: 'right',
  },
  {
    title: '操作',
    key: 'action',
    width: 100,
    fixed: 'right',
    align: 'center',
  },
];

onMounted(() => {
  fetchList();
});
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex flex-1 flex-col space-y-4 overflow-y-auto p-6 pt-4">
      <!-- 筛选条件 -->
      <div class="rounded-lg border bg-card p-4 shadow-sm">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <!-- 关键词 -->
          <div class="space-y-1">
            <label class="text-sm font-medium">关键词</label>
            <Input
              v-model:value="queryParams.keyword"
              allow-clear
              placeholder="请输入开发者租户名称"
              @press-enter="handleSearch"
            />
          </div>
        </div>

        <div class="mt-4 flex items-center justify-end gap-2 border-t pt-3">
          <Button size="small" @click="handleReset">
            <Icon icon="lucide:rotate-ccw" class="mr-1 size-4" />
            重置
          </Button>
          <Button type="primary" size="small" @click="handleSearch">
            <Icon icon="lucide:search" class="mr-1 size-4" />
            搜索
          </Button>
        </div>
      </div>

      <!-- 查询结果 -->
      <div class="rounded-lg border bg-card shadow-sm">
        <!-- 表格标题和操作栏 -->
        <div class="flex items-center justify-between border-b px-4 py-3">
          <h3 class="text-lg font-semibold">开发者列表</h3>
          <Space>
            <Tooltip title="刷新">
              <Button @click="handleRefresh">
                <Icon icon="lucide:refresh-cw" class="size-4" />
              </Button>
            </Tooltip>
          </Space>
        </div>

        <Table
          :columns="columns"
          :data-source="tableData"
          :loading="loading"
          :pagination="{
            current: currentPage,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }"
          :scroll="{ x: 970 }"
          row-key="id"
          bordered
          @change="
            (pagination: any) => {
              currentPage = pagination.current;
              pageSize = pagination.pageSize;
              fetchList();
            }
          "
        >
          <template #bodyCell="{ column, record }">
            <!-- 开通时间 -->
            <template v-if="column.key === 'activatedAt'">
              <span class="text-xs">{{ formatTime(record.activatedAt) }}</span>
            </template>

            <!-- 已消耗 Token -->
            <template v-else-if="column.key === 'consumedTokens'">
              <span class="font-mono">{{
                formatNumber(record.consumedTokens)
              }}</span>
            </template>

            <!-- 可用 Token -->
            <template v-else-if="column.key === 'availableTokens'">
              <div class="flex items-center justify-end gap-2">
                <span
                  class="font-mono"
                  :class="
                    isLowBalance(record.availableTokens)
                      ? 'font-semibold text-red-500'
                      : ''
                  "
                >
                  {{ formatNumber(record.availableTokens) }}
                </span>
                <Tag
                  v-if="isLowBalance(record.availableTokens)"
                  color="error"
                  class="m-0"
                >
                  余额不足
                </Tag>
              </div>
            </template>

            <!-- 操作 -->
            <template v-else-if="column.key === 'action'">
              <Button type="link" size="small" @click="handleRecharge(record)">
                <Icon icon="lucide:wallet" class="mr-1 size-4" />
                充值
              </Button>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <!-- 充值弹窗 -->
    <RechargeModal
      v-model:open="rechargeOpen"
      :developer="selectedDeveloper"
      @success="handleRechargeSuccess"
    />
  </div>
</template>
