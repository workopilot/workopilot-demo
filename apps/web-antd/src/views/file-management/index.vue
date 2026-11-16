<!-- eslint-disable vue/html-closing-bracket-newline -->
<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue';

import type { FileInfo } from '#/types/file-management';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  DatePicker,
  Empty,
  Input,
  message,
  Pagination,
  Popconfirm,
  Select,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

import {
  batchDeleteFiles,
  deleteFile,
  getFileList,
} from '#/api/file-management';

import FileDetailModal from './modals/file-detail-modal.vue';
import FileLogModal from './modals/file-log-modal.vue';
import FileUploadModal from './modals/file-upload-modal.vue';
import GrantModal from './modals/grant-modal.vue';

// ==================== 常量定义 ====================

const FILE_CATEGORIES = [
  { label: '会议纪要', value: 'MEETING_MINUTES' },
  { label: '审批单据', value: 'APPROVAL_DOC' },
  { label: '公告通知', value: 'ANNOUNCEMENT' },
  { label: '配置类', value: 'AI_CONFIGURATION' },
  { label: '凭证类', value: 'AI_VOUCHER' },
  { label: '合同类', value: 'AI_CONTRACT' },
  { label: '财务报表', value: 'AI_FINANCIAL_REPORT' },
  { label: '统计报表', value: 'REPORT' },
  { label: '合同文件', value: 'CONTRACT' },
  { label: '发票单据', value: 'INVOICE' },
];

// ==================== 列表数据 ====================

const tableData = ref<FileInfo[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = ref([10, 20, 30, 40, 50]);
const loading = ref(false);
const selectedRowKeys = ref<string[]>([]);

// ==================== 筛选条件 ====================

const keyword = ref('');
const categoryCode = ref<string | undefined>();
const dateRange = ref<[any, any] | undefined>();

// ==================== 弹窗状态 ====================

const uploadModalOpen = ref(false);
const detailModalOpen = ref(false);
const logModalOpen = ref(false);
const grantModalOpen = ref(false);
const currentFile = ref<FileInfo | null>(null);

// ==================== 获取数据 ====================

async function fetchFileList() {
  loading.value = true;
  try {
    const params: any = {
      page: currentPage.value,
      pageSize: pageSize.value,
      keyword: keyword.value || undefined,
      categoryCode: categoryCode.value,
      uploadedAfter: dateRange?.value?.[0]
        ? dateRange.value[0].format('YYYY-MM-DD')
        : undefined,
      uploadedBefore: dateRange?.value?.[1]
        ? dateRange.value[1].format('YYYY-MM-DD')
        : undefined,
    };

    const response = await getFileList(params);
    tableData.value = response.data.items;
    total.value = response.data.total;
  } catch (error) {
    message.error('获取文件列表失败');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

// ==================== 操作处理 ====================

/** 打开上传弹窗 */
function handleUpload() {
  uploadModalOpen.value = true;
}

/** 上传成功 */
function handleUploadSuccess() {
  uploadModalOpen.value = false;
  message.success('文件上传成功');
  fetchFileList();
}

/** 查看详情 */
function handleViewDetail(file: FileInfo) {
  currentFile.value = file;
  detailModalOpen.value = true;
}

/** 查看日志 */
function handleViewLogs(file: FileInfo) {
  currentFile.value = file;
  logModalOpen.value = true;
}

/** 授权档案 */
function handleGrant(file: FileInfo) {
  currentFile.value = file;
  // 单个授权时设置 fileIds 为包含单个档案的数组
  selectedRowKeys.value = [file.id];
  grantModalOpen.value = true;
}

/** 批量授权 */
function handleBatchGrant() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要授权的档案');
    return;
  }
  grantModalOpen.value = true;
}

/** 授权成功 */
function handleGrantSuccess() {
  message.success('授权成功');
  selectedRowKeys.value = [];
  fetchFileList();
}

/** 删除文件 */
async function handleDelete(id: string) {
  try {
    await deleteFile(id);
    message.success('删除成功');
    fetchFileList();
  } catch (error) {
    message.error('删除失败');
    console.error(error);
  }
}

/** 行选择变化 */
function handleRowSelectionChange(keys: string[]) {
  selectedRowKeys.value = keys;
}

/** 批量删除 */
async function handleBatchDelete() {
  if (selectedRowKeys.value.length === 0) {
    message.warning('请选择要删除的文件');
    return;
  }
  try {
    await batchDeleteFiles(selectedRowKeys.value);
    message.success(`成功删除 ${selectedRowKeys.value.length} 个文件`);
    selectedRowKeys.value = [];
    fetchFileList();
  } catch (error) {
    message.error('批量删除失败');
    console.error(error);
  }
}

/** 重置筛选 */
function handleResetFilters() {
  keyword.value = '';
  categoryCode.value = undefined;
  dateRange.value = undefined;
  currentPage.value = 1;
  fetchFileList();
}

/** 导出 */
function handleExport() {
  message.info('导出功能开发中...');
}

// ==================== 格式化函数 ====================

/** 格式化日期 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN');
}

/** 获取来源图标 */
function getSourceIcon(source: any): string {
  if (source.dimension === 'system') {
    return 'lucide:server';
  }
  switch (source.applicationType) {
    case 'business_app': {
      return 'lucide:briefcase';
    }
    case 'digital_employee': {
      return 'lucide:bot';
    }
    case 'user_upload': {
      return 'lucide:upload';
    }
    default: {
      return 'lucide:file';
    }
  }
}

/** 获取来源名称 */
function getSourceName(source: any): string {
  return source.name || '未知来源';
}

/** 获取分类标签颜色 */
function getCategoryColor(category: any): string {
  switch (category.code) {
    case 'AI_CONTRACT':
    case 'CONTRACT': {
      return 'red';
    }
    case 'AI_VOUCHER':
    case 'INVOICE': {
      return 'gold';
    }
    case 'ANNOUNCEMENT': {
      return 'green';
    }
    case 'APPROVAL_DOC': {
      return 'orange';
    }
    case 'MEETING_MINUTES': {
      return 'blue';
    }
    case 'REPORT': {
      return 'purple';
    }
    default: {
      return 'default';
    }
  }
}

// ==================== 表格列定义 ====================

const columns: TableColumnsType<FileInfo> = [
  {
    title: '档案号',
    dataIndex: 'archiveNo',
    key: 'archiveNo',
    width: 150,
  },
  {
    title: '文件摘要',
    key: 'fileSummary',
    width: 250,
    ellipsis: true,
  },
  {
    title: '文件标签',
    key: 'fileTags',
    width: 180,
  },
  {
    title: '文件来源',
    key: 'source',
    width: 120,
  },
  {
    title: '文件分类',
    key: 'category',
    width: 110,
  },
  {
    title: '上传人',
    dataIndex: 'uploaderName',
    key: 'uploaderName',
    width: 90,
  },
  {
    title: '上传时间',
    dataIndex: 'uploadedAt',
    key: 'uploadedAt',
    width: 150,
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
  fetchFileList();
});
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline -->
  <Page title="档案管理">
    <!-- 大幅精简顶部区块，将原本冗长的 description 转为工具栏或静默状态以节省空间 -->

    <!-- 统一智能中枢控制栏：整合筛选、操作及批量任务 -->
    <div
      class="relative mb-4 w-full overflow-hidden rounded-2xl border border-slate-200/60 bg-white/80 p-3 shadow-sm backdrop-blur-md transition-all dark:border-slate-800/50 dark:bg-slate-900/80"
    >
      <!-- 默认模式：条件检索组与主动作区 -->
      <div
        v-if="selectedRowKeys.length === 0"
        class="flex flex-wrap items-center justify-between gap-3 transition-all duration-300"
      >
        <!-- 左侧：紧凑型极简筛选链 -->
        <div class="flex flex-wrap items-center gap-2.5">
          <Input
            v-model:value="keyword"
            placeholder="搜索文件名 / 上传人"
            allow-clear
            class="!w-[190px] rounded-lg transition-shadow hover:shadow-sm focus:shadow-sm"
            @press-enter="fetchFileList"
          >
            <template #prefix>
              <Icon icon="lucide:search" class="text-slate-400" />
            </template>
          </Input>

          <Select
            v-model:value="categoryCode"
            placeholder="选择文件分类"
            allow-clear
            class="!w-[140px]"
            popup-class-name="rounded-xl"
            :options="FILE_CATEGORIES"
          />

          <DatePicker.RangePicker
            v-model:value="dateRange"
            class="!w-[240px] rounded-lg"
            :placeholder="['开始日期', '结束日期']"
          />

          <div class="flex items-center gap-1.5 pl-1">
            <Button
              type="primary"
              class="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 font-semibold shadow-sm hover:bg-blue-700"
              @click="fetchFileList"
            >
              <template #icon>
                <Icon icon="lucide:search" class="text-[13px]" />
              </template>
              查询
            </Button>
            <Button
              class="rounded-lg border-slate-200 text-slate-500 hover:border-blue-500 hover:text-blue-600"
              @click="handleResetFilters"
            >
              重置
            </Button>
          </div>
        </div>

        <!-- 右侧：系统及业务操作群 -->
        <div class="flex items-center gap-2">
          <div
            class="flex items-center rounded-lg border border-slate-100 bg-slate-50/50 p-0.5 dark:border-slate-800 dark:bg-slate-800/40"
          >
            <Tooltip title="导出数据列表">
              <Button
                type="text"
                class="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-blue-600 dark:hover:bg-slate-700"
                @click="handleExport"
              >
                <Icon icon="lucide:download" class="text-base" />
              </Button>
            </Tooltip>
            <Tooltip title="刷新当前列表">
              <Button
                type="text"
                class="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-white hover:text-blue-600 dark:hover:bg-slate-700"
                @click="fetchFileList"
              >
                <Icon icon="lucide:refresh-cw" class="text-base" />
              </Button>
            </Tooltip>
          </div>

          <div class="mx-1 h-5 w-px bg-slate-200 dark:bg-slate-800"></div>

          <Button
            type="primary"
            class="flex items-center gap-1.5 rounded-lg border-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-4 font-bold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
            @click="handleUpload"
          >
            <Icon icon="lucide:upload-cloud" class="text-[17px]" />
            上传文件
          </Button>
        </div>
      </div>

      <!-- 批量模式：触发式悬浮功能条 -->
      <div
        v-else
        class="flex items-center justify-between rounded-xl bg-blue-50/80 px-4 py-1.5 text-blue-950 transition-all duration-300 dark:bg-blue-950/30 dark:text-blue-200"
      >
        <div class="flex items-center gap-2.5">
          <div
            class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm dark:bg-blue-500"
          >
            <Icon icon="lucide:layers" class="text-xs" />
          </div>
          <div class="text-[13px] font-bold">
            已选中
            <span
              class="mx-1 font-mono text-base font-black text-blue-700 dark:text-blue-400"
            >
              {{ selectedRowKeys.length }}
            </span>
            项档案资源
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button
            class="flex items-center gap-1.5 rounded-lg border-blue-200 bg-white font-bold text-blue-600 hover:bg-blue-50 hover:text-blue-700"
            size="small"
            @click="handleBatchGrant"
          >
            <Icon icon="lucide:shield-check" class="text-xs" /> 批量授权
          </Button>
          <Popconfirm
            title="确定要批量删除选中的档案吗?"
            ok-text="狠心删除"
            cancel-text="取消"
            @confirm="handleBatchDelete"
          >
            <Button
              type="primary"
              danger
              class="flex items-center gap-1.5 rounded-lg font-bold shadow-sm"
              size="small"
            >
              <Icon icon="lucide:trash-2" class="text-xs" /> 批量删除
            </Button>
          </Popconfirm>
          <div class="mx-2 h-4 w-px bg-blue-200 dark:bg-blue-800"></div>
          <Button
            type="text"
            class="font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            size="small"
            @click="selectedRowKeys = []"
          >
            取消选择
          </Button>
        </div>
      </div>
    </div>

    <!-- 档案数据列表 -->
    <Card
      class="overflow-hidden rounded-2xl border border-slate-200/60 shadow-sm dark:border-slate-800/50"
    >
      <template #title>
        <div class="flex items-center gap-2.5">
          <div
            class="h-4 w-1.5 rounded bg-gradient-to-b from-cyan-500 to-blue-600"
          ></div>
          <span
            class="text-sm font-black tracking-wider text-slate-800 dark:text-slate-200"
          >
            档案目录列表
          </span>
          <Tag
            class="ml-2 rounded-md border-0 bg-slate-100 font-mono text-[10px] font-extrabold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          >
            MATCHED: {{ total }}
          </Tag>
        </div>
      </template>

      <div class="overflow-hidden">
        <Table
          :columns="columns"
          :data-source="tableData"
          :row-key="(record: FileInfo) => record.id"
          :row-selection="{
            selectedRowKeys,
            onChange: handleRowSelectionChange,
          }"
          :pagination="false"
          :loading="loading"
          size="middle"
          class="custom-hover-table"
        >
          <template #bodyCell="{ column, record }">
            <!-- 档案号 -->
            <template v-if="column.key === 'archiveNo'">
              <code
                class="rounded border border-slate-100 bg-slate-50 px-2 py-1 font-mono text-xs font-bold text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300"
              >
                {{ record.archiveNo }}
              </code>
            </template>

            <!-- 文件摘要 -->
            <template v-else-if="column.key === 'fileSummary'">
              <div class="max-w-[250px]">
                <Tooltip v-if="record.fileSummary" :title="record.fileSummary">
                  <div class="flex items-center gap-1.5">
                    <Icon
                      icon="lucide:sparkles"
                      class="shrink-0 text-purple-500"
                      style="font-size: 12px"
                    />
                    <span
                      class="truncate text-xs text-slate-600 dark:text-slate-300"
                    >
                      {{ record.fileSummary }}
                    </span>
                  </div>
                </Tooltip>
                <span v-else class="text-xs text-slate-400">-</span>
              </div>
            </template>

            <!-- 文件标签 -->
            <template v-else-if="column.key === 'fileTags'">
              <div
                v-if="record.fileTags && record.fileTags.length > 0"
                class="flex flex-wrap gap-1"
              >
                <Tag
                  v-for="tag in record.fileTags.slice(0, 3)"
                  :key="tag.id"
                  :color="tag.color || 'blue'"
                  class="m-0 rounded border-0 px-1.5 py-0 text-[10px] font-bold"
                >
                  {{ tag.name }}
                </Tag>
                <Tooltip
                  v-if="record.fileTags.length > 3"
                  :title="
                    record.fileTags
                      .slice(3)
                      .map((t) => t.name)
                      .join(', ')
                  "
                >
                  <Tag
                    class="m-0 rounded border-0 bg-slate-100 px-1.5 py-0 text-[10px] font-bold text-slate-500 dark:bg-slate-800"
                  >
                    +{{ record.fileTags.length - 3 }}
                  </Tag>
                </Tooltip>
              </div>
              <span v-else class="text-xs text-slate-400">-</span>
            </template>

            <!-- 文件来源 -->
            <template v-else-if="column.key === 'source'">
              <div class="flex items-center gap-2">
                <div
                  class="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800"
                >
                  <Icon :icon="getSourceIcon(record.source)" class="size-3.5" />
                </div>
                <span
                  class="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  {{ getSourceName(record.source) }}
                </span>
              </div>
            </template>

            <!-- 文件分类 -->
            <template v-else-if="column.key === 'category'">
              <Tag
                :color="getCategoryColor(record.category)"
                class="m-0 rounded-md border-0 px-2 py-0 text-[10px] font-bold"
              >
                {{ record.category.name }}
              </Tag>
            </template>

            <!-- 上传时间 -->
            <template v-else-if="column.key === 'uploadedAt'">
              <span
                class="font-mono text-xs text-slate-400 dark:text-slate-500"
              >
                {{ formatDate(record.uploadedAt) }}
              </span>
            </template>

            <!-- 操作 -->
            <template v-else-if="column.key === 'actions'">
              <div class="flex items-center justify-center gap-1">
                <Button
                  type="text"
                  size="small"
                  class="font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                  @click="handleViewDetail(record)"
                >
                  详情
                </Button>
                <Button
                  type="text"
                  size="small"
                  class="font-bold text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950"
                  @click="handleGrant(record)"
                >
                  授权
                </Button>
                <Button
                  type="text"
                  size="small"
                  class="font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  @click="handleViewLogs(record)"
                >
                  日志
                </Button>
                <Popconfirm
                  title="确定要删除此档案吗?"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDelete(record.id)"
                >
                  <Button type="text" size="small" danger class="font-bold">
                    删除
                  </Button>
                </Popconfirm>
              </div>
            </template>
          </template>
        </Table>
      </div>

      <!-- 空数据状态 -->
      <div
        v-if="!loading && tableData.length === 0"
        class="flex min-h-[260px] flex-col items-center justify-center"
      >
        <Empty description="暂未搜索到匹配的档案记录" />
      </div>

      <!-- 紧凑化分页栏 -->
      <div
        v-if="total > 0"
        class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800"
      >
        <div
          class="flex items-center gap-3 text-[13px] font-medium text-slate-400"
        >
          <span
            >共检索出
            <strong class="text-slate-700 dark:text-slate-300">{{
              total
            }}</strong>
            条记录</span
          >
          <div class="h-3.5 w-px bg-slate-200 dark:bg-slate-800"></div>
          <Select
            v-model:value="pageSize"
            size="small"
            class="!w-[100px]"
            :bordered="false"
            @change="
              () => {
                currentPage = 1;
                fetchFileList();
              }
            "
          >
            <Select.Option
              v-for="size in pageSizeOptions"
              :key="size"
              :value="size"
            >
              {{ size }} 条 / 页
            </Select.Option>
          </Select>
        </div>

        <Pagination
          v-model:current="currentPage"
          :total="total"
          :page-size="pageSize"
          size="small"
          :show-size-changer="false"
          :show-total="false"
          class="modern-pagination"
          @change="fetchFileList"
        />
      </div>
    </Card>

    <!-- 浮动模态弹窗配置组 -->
    <FileUploadModal
      v-model:open="uploadModalOpen"
      @success="handleUploadSuccess"
    />
    <FileDetailModal v-model:open="detailModalOpen" :file="currentFile" />
    <FileLogModal v-model:open="logModalOpen" :file="currentFile" />
    <GrantModal
      v-model:open="grantModalOpen"
      :file-ids="selectedRowKeys"
      @success="handleGrantSuccess"
    />
  </Page>
</template>
