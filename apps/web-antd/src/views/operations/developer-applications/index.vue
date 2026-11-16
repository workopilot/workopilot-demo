<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type {
  ApplicationStatus,
  DeveloperApplication,
  DeveloperApplicationQueryParams,
} from '#/types/developer-application';

import { onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  DatePicker,
  message,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import { getDeveloperApplicationsApi } from '#/api/developer-application';

import DetailDrawer from './modals/detail-drawer.vue';
import ProcessModal from './modals/process-modal.vue';
import ResultModal from './modals/result-modal.vue';

// 表格数据
const tableData = ref<DeveloperApplication[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);

// 查询参数(默认未处理)
const queryParams = ref<DeveloperApplicationQueryParams>({
  page: 1,
  pageSize: 20,
  status: 'pending',
});

// 处理状态选项
const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '未处理', value: 'pending' },
  { label: '已处理', value: 'processed' },
];

// 弹窗状态
const detailOpen = ref(false);
const resultOpen = ref(false);
const processOpen = ref(false);
const selectedApplication = ref<DeveloperApplication | null>(null);
const selectedId = ref<null | string>(null);

// 获取列表
async function fetchList() {
  loading.value = true;
  try {
    const params = {
      ...queryParams.value,
      page: currentPage.value,
      pageSize: pageSize.value,
    };
    const response = await getDeveloperApplicationsApi(params);
    tableData.value = response.data.items;
    total.value = response.data.total;
  } catch (error) {
    console.error(error);
    message.error('获取申请列表失败');
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
  queryParams.value = { page: 1, pageSize: pageSize.value, status: 'pending' };
  currentPage.value = 1;
  fetchList();
}

// 刷新
function handleRefresh() {
  fetchList();
}

// 查看详情
function handleViewDetail(record: DeveloperApplication) {
  selectedApplication.value = record;
  detailOpen.value = true;
}

// 处理
function handleProcess(record: DeveloperApplication) {
  selectedId.value = record.id;
  processOpen.value = true;
}

// 查看处理结果
function handleViewResult(record: DeveloperApplication) {
  selectedApplication.value = record;
  resultOpen.value = true;
}

// 处理成功后刷新
function handleProcessSuccess() {
  fetchList();
}

// 表格列定义
const columns: TableColumnsType<DeveloperApplication> = [
  {
    title: '申请人',
    dataIndex: 'applicantName',
    key: 'applicantName',
    width: 100,
    fixed: 'left',
  },
  {
    title: '申请时间',
    dataIndex: 'applyTime',
    key: 'applyTime',
    width: 170,
  },
  {
    title: '手机号',
    dataIndex: 'phone',
    key: 'phone',
    width: 130,
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    width: 190,
  },
  {
    title: '技术方向',
    dataIndex: 'techDirection',
    key: 'techDirection',
    width: 110,
  },
  {
    title: '处理状态',
    dataIndex: 'status',
    key: 'status',
    width: 160,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right',
  },
];

onMounted(() => {
  fetchList();
});
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- 中部和底部:可滚动区域 -->
    <div class="flex flex-1 flex-col space-y-4 overflow-y-auto p-6 pt-4">
      <!-- 筛选条件 -->
      <div class="rounded-lg border bg-card p-4 shadow-sm">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <!-- 处理状态 -->
          <div class="space-y-1">
            <label class="text-sm font-medium">处理状态</label>
            <Select
              v-model:value="queryParams.status"
              placeholder="请选择处理状态"
              class="w-full"
            >
              <Select.Option
                v-for="item in statusOptions"
                :key="item.value"
                :value="item.value"
              >
                {{ item.label }}
              </Select.Option>
            </Select>
          </div>

          <!-- 申请日期 -->
          <div class="space-y-1">
            <label class="text-sm font-medium">申请日期</label>
            <DatePicker.RangePicker
              class="w-full"
              format="YYYY-MM-DD"
              @change="
                (dates: any) => {
                  if (dates && dates[0] && dates[1]) {
                    queryParams.startDate = dates[0].format('YYYY-MM-DD');
                    queryParams.endDate = dates[1].format('YYYY-MM-DD');
                  } else {
                    queryParams.startDate = undefined;
                    queryParams.endDate = undefined;
                  }
                }
              "
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
          <h3 class="text-lg font-semibold">申请列表</h3>
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
          :scroll="{ x: 1100 }"
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
            <!-- 申请时间 -->
            <template v-if="column.key === 'applyTime'">
              <span class="text-xs">
                {{ new Date(record.applyTime).toLocaleString('zh-CN') }}
              </span>
            </template>

            <!-- 处理状态 -->
            <template v-else-if="column.key === 'status'">
              <div class="flex items-center gap-1">
                <template
                  v-if="record.status === ('pending' as ApplicationStatus)"
                >
                  <Tag color="default" class="m-0">未处理</Tag>
                </template>
                <template v-else>
                  <Tag color="blue" class="m-0">已处理</Tag>
                  <Tag
                    :color="
                      record.processResult === 'approved' ? 'success' : 'error'
                    "
                    class="m-0"
                  >
                    {{
                      record.processResult === 'approved' ? '通过' : '不通过'
                    }}
                  </Tag>
                </template>
              </div>
            </template>

            <!-- 操作 -->
            <template v-else-if="column.key === 'action'">
              <Button
                type="link"
                size="small"
                @click="handleViewDetail(record)"
              >
                查看详情
              </Button>
              <Button
                v-if="record.status === 'pending'"
                type="link"
                size="small"
                @click="handleProcess(record)"
              >
                处理
              </Button>
              <Button
                v-else
                type="link"
                size="small"
                @click="handleViewResult(record)"
              >
                查看处理结果
              </Button>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <!-- 详情抽屉 -->
    <DetailDrawer
      v-model:open="detailOpen"
      :application="selectedApplication"
    />

    <!-- 处理弹窗 -->
    <ProcessModal
      v-model:open="processOpen"
      :application-id="selectedId"
      @success="handleProcessSuccess"
    />

    <!-- 查看处理结果弹窗 -->
    <ResultModal v-model:open="resultOpen" :application="selectedApplication" />
  </div>
</template>
