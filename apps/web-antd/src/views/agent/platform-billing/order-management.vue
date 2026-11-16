<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  DatePicker,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Select,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

// ==========================
// Mock Data: 租户订单列表
// ==========================
const mockOrders = ref([
  {
    key: '1',
    id: 'ORD-20260501-001',
    tenantName: 'A公司 (科技电商)',
    orderDate: '2026-05-01',
    validityPeriod: '2026-05-01 至 2027-04-30',
    subscriptionNo: 'SUB-A-00123',
    remarks: '开通 Pro 版年度套餐',
    status: 'paid', // 'unpaid' | 'paid' | 'cancelled'
    updatedBy: '系统管理员',
    updatedDate: '2026-05-01 10:30:00',
  },
  {
    key: '2',
    id: 'ORD-20260510-002',
    tenantName: 'B公司 (出海营销)',
    orderDate: '2026-05-10',
    validityPeriod: '2026-05-10 至 2026-11-09',
    subscriptionNo: 'SUB-B-00456',
    remarks: '扩容临时点数包',
    status: 'unpaid',
    updatedBy: '运营专员-王明',
    updatedDate: '2026-05-10 14:20:00',
  },
  {
    key: '3',
    id: 'ORD-20260512-003',
    tenantName: 'C公司 (在线教育)',
    orderDate: '2026-05-12',
    validityPeriod: '2026-05-12 至 2027-05-11',
    subscriptionNo: 'SUB-C-00789',
    remarks: '标准版年度订阅升级',
    status: 'cancelled',
    updatedBy: '系统管理员',
    updatedDate: '2026-05-12 16:00:00',
  },
  {
    key: '4',
    id: 'ORD-20260513-004',
    tenantName: 'D公司 (跨境电商)',
    orderDate: '2026-05-13',
    validityPeriod: '2026-05-13 至 2026-08-12',
    subscriptionNo: 'SUB-D-00999',
    remarks: '新租户试用开通',
    status: 'paid',
    updatedBy: '销售顾问-张丽',
    updatedDate: '2026-05-13 09:15:00',
  },
  {
    key: '5',
    id: 'ORD-20260514-005',
    tenantName: 'E公司 (本地生活)',
    orderDate: '2026-05-14',
    validityPeriod: '2026-05-14 至 2026-06-13',
    subscriptionNo: 'SUB-E-01024',
    remarks: '包月员工计费叠加包',
    status: 'unpaid',
    updatedBy: '财务复核-李清',
    updatedDate: '2026-05-14 08:30:00',
  },
]);

// ==========================
// Search state
// ==========================
const searchForm = ref({
  tenant: '',
  status: undefined as string | undefined,
  dateRange: [] as any[],
});

const handleReset = () => {
  searchForm.value = {
    tenant: '',
    status: undefined,
    dateRange: [],
  };
};

// Computed: Filtered list
const filteredOrders = computed(() => {
  return mockOrders.value.filter((order) => {
    // Tenant filter
    if (
      searchForm.value.tenant &&
      !order.tenantName
        .toLowerCase()
        .includes(searchForm.value.tenant.toLowerCase()) &&
      !order.id.toLowerCase().includes(searchForm.value.tenant.toLowerCase())
    ) {
      return false;
    }
    // Status filter
    if (searchForm.value.status && order.status !== searchForm.value.status) {
      return false;
    }
    // Date range filter
    if (searchForm.value.dateRange && searchForm.value.dateRange.length === 2) {
      const start = searchForm.value.dateRange[0].startOf('day');
      const end = searchForm.value.dateRange[1].endOf('day');
      const orderDate = dayjs(order.orderDate);
      if (orderDate.isBefore(start) || orderDate.isAfter(end)) {
        return false;
      }
    }
    return true;
  });
});

// ==========================
// Table configuration
// ==========================
const columns = [
  { title: '订单编号', dataIndex: 'id', key: 'id', width: 170 },
  {
    title: '租户名称',
    dataIndex: 'tenantName',
    key: 'tenantName',
    minWidth: 160,
  },
  {
    title: '订单日期',
    dataIndex: 'orderDate',
    key: 'orderDate',
    align: 'center',
    width: 110,
  },
  {
    title: '订单有效期',
    dataIndex: 'validityPeriod',
    key: 'validityPeriod',
    width: 200,
    align: 'center',
  },
  {
    title: '关联订阅 (订阅号)',
    dataIndex: 'subscriptionNo',
    key: 'subscriptionNo',
    width: 160,
  },
  { title: '备注', dataIndex: 'remarks', key: 'remarks', ellipsis: true },
  {
    title: '付款状态',
    dataIndex: 'status',
    key: 'status',
    align: 'center',
    width: 100,
  },
  {
    title: '更新人',
    dataIndex: 'updatedBy',
    key: 'updatedBy',
    width: 110,
    align: 'center',
  },
  {
    title: '更新日期',
    dataIndex: 'updatedDate',
    key: 'updatedDate',
    width: 160,
    align: 'center',
  },
  { title: '操作', key: 'action', align: 'center', width: 100, fixed: 'right' },
];

// Status utilities
const getStatusLabel = (status: string) => {
  switch (status) {
    case 'cancelled': {
      return '已取消';
    }
    case 'paid': {
      return '已付款';
    }
    case 'unpaid': {
      return '未付款';
    }
    default: {
      return status;
    }
  }
};

const getStatusTagColor = (status: string) => {
  switch (status) {
    case 'cancelled': {
      return 'error';
    }
    case 'paid': {
      return 'success';
    }
    case 'unpaid': {
      return 'warning';
    }
    default: {
      return 'default';
    }
  }
};

// ==========================
// Modal Edit State
// ==========================
const isEditModalVisible = ref(false);
const editForm = ref({
  key: '',
  id: '',
  tenantName: '',
  status: 'unpaid',
  remarks: '',
});

const openEditModal = (record: any) => {
  editForm.value = {
    key: record.key,
    id: record.id,
    tenantName: record.tenantName,
    status: record.status,
    remarks: record.remarks,
  };
  isEditModalVisible.value = true;
};

const handleSaveEdit = () => {
  const index = mockOrders.value.findIndex(
    (item) => item.key === editForm.value.key,
  );
  if (index === -1) {
    message.error('订单不存在！');
  } else {
    mockOrders.value[index] = {
      ...mockOrders.value[index],
      status: editForm.value.status,
      remarks: editForm.value.remarks,
      updatedBy: '当前用户',
      updatedDate: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    };
    message.success('订单修改成功！');
    isEditModalVisible.value = false;
  }
};
</script>

<template>
  <div
    class="relative flex min-h-full w-full flex-col gap-6 bg-slate-50/50 p-4 md:p-6 dark:bg-slate-900/50"
  >
    <!-- Hero Header -->
    <div
      class="relative flex flex-col gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 via-blue-600 to-indigo-700 p-8 text-white shadow-lg"
    >
      <!-- Decorative Background Glows -->
      <div
        class="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10 blur-3xl"
      ></div>
      <div
        class="absolute -bottom-12 right-16 h-36 w-36 rounded-full bg-black/10 blur-2xl"
      ></div>

      <div class="relative z-10 flex items-center gap-5">
        <div
          class="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/20 bg-white/20 shadow-sm backdrop-blur-md"
        >
          <Icon icon="lucide:shopping-bag" class="text-3xl text-white" />
        </div>
        <div>
          <h1
            class="m-0 text-3xl font-extrabold tracking-tight text-white drop-shadow-sm"
          >
            租户订单管理
          </h1>
          <p
            class="m-0 mt-2 max-w-2xl text-sm font-medium tracking-wide text-blue-50 opacity-90"
          >
            对所有租户在系统中提交的套餐购买与扩容订单进行集中管理，支持付款状态变更及财务备注核对。
          </p>
        </div>
      </div>
    </div>

    <!-- Search Section -->
    <div
      class="w-full rounded-3xl border border-slate-200/60 bg-white/70 p-5 shadow-xl backdrop-blur-xl transition-all dark:border-slate-700/50 dark:bg-slate-900/60"
    >
      <Form layout="inline" class="flex flex-wrap gap-y-4">
        <FormItem label="租户 / 订单号" class="mb-0 min-w-[240px]">
          <Input
            v-model:value="searchForm.tenant"
            placeholder="输入租户名称或订单号"
            allow-clear
            class="!w-full rounded-lg"
          />
        </FormItem>

        <FormItem label="付款状态" class="mb-0 min-w-[180px]">
          <Select
            v-model:value="searchForm.status"
            placeholder="选择状态"
            allow-clear
            class="!w-full"
            popup-class-name="rounded-xl"
          >
            <Select.Option value="unpaid">未付款</Select.Option>
            <Select.Option value="paid">已付款</Select.Option>
            <Select.Option value="cancelled">已取消</Select.Option>
          </Select>
        </FormItem>

        <FormItem label="订单日期" class="mb-0">
          <RangePicker
            v-model:value="searchForm.dateRange"
            format="YYYY-MM-DD"
            class="rounded-lg"
          />
        </FormItem>

        <div class="ml-auto flex items-center gap-3">
          <Button
            class="rounded-lg hover:border-blue-500 hover:text-blue-600"
            @click="handleReset"
          >
            重置
          </Button>
          <Button
            type="primary"
            class="flex items-center gap-2 rounded-lg border-0 bg-blue-600 shadow-md hover:bg-blue-700"
          >
            <template #icon>
              <Icon icon="lucide:search" class="text-sm" />
            </template>
            查询
          </Button>
        </div>
      </Form>
    </div>

    <!-- Table Section -->
    <div
      class="w-full rounded-3xl border border-slate-200/60 bg-white/70 p-3 shadow-xl backdrop-blur-xl transition-all dark:border-slate-700/50 dark:bg-slate-900/60"
    >
      <div
        class="mb-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-white/60 p-4 dark:border-slate-700 dark:bg-slate-800/40"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400"
          >
            <Icon icon="lucide:list" class="text-lg" />
          </div>
          <div>
            <h3
              class="m-0 text-sm font-bold text-slate-800 dark:text-slate-100"
            >
              订单列表
            </h3>
            <p class="m-0 text-[11px] font-medium text-slate-400">
              共匹配到 {{ filteredOrders.length }} 条数据
            </p>
          </div>
        </div>
        <Button class="flex items-center gap-1.5 rounded-lg">
          <template #icon><Icon icon="lucide:download" /></template>
          导出订单
        </Button>
      </div>

      <div
        class="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800"
      >
        <Table
          :columns="columns"
          :data-source="filteredOrders"
          :pagination="{ pageSize: 10, showSizeChanger: true }"
          class="custom-table"
          :row-class-name="
            () =>
              'hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors'
          "
        >
          <template #bodyCell="{ column, record }">
            <!-- Order ID -->
            <template v-if="column.key === 'id'">
              <span
                class="font-mono font-bold text-slate-600 dark:text-slate-300"
              >
                {{ record.id }}
              </span>
            </template>

            <!-- Tenant Name -->
            <template v-if="column.key === 'tenantName'">
              <span class="font-extrabold text-slate-800 dark:text-slate-100">
                {{ record.tenantName }}
              </span>
            </template>

            <!-- Status -->
            <template v-if="column.key === 'status'">
              <Tag
                :color="getStatusTagColor(record.status)"
                class="m-0 rounded-md border-0 px-2.5 py-0.5 text-[11px] font-bold"
              >
                {{ getStatusLabel(record.status) }}
              </Tag>
            </template>

            <!-- Action -->
            <template v-if="column.key === 'action'">
              <Button
                type="text"
                class="flex items-center justify-center gap-1 rounded-md px-2.5 font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                size="small"
                @click="openEditModal(record)"
              >
                <Icon icon="lucide:edit-3" class="text-xs" /> 编辑
              </Button>
            </template>
          </template>
        </Table>
      </div>
    </div>

    <!-- Edit Order Modal -->
    <Modal
      v-model:open="isEditModalVisible"
      title="编辑订单信息"
      ok-text="保存"
      cancel-text="取消"
      centered
      width="520px"
      class="modern-modal"
      @ok="handleSaveEdit"
    >
      <div class="mt-4">
        <div class="mb-6 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="text-slate-400">订单编号:</span>
              <span
                class="ml-2 font-mono font-bold text-slate-700 dark:text-slate-200"
              >{{ editForm.id }}</span>
            </div>
            <div>
              <span class="text-slate-400">对应租户:</span>
              <span class="ml-2 font-bold text-slate-700 dark:text-slate-200">{{
                editForm.tenantName
              }}</span>
            </div>
          </div>
        </div>

        <Form layout="vertical">
          <FormItem label="付款状态" required>
            <Select
              v-model:value="editForm.status"
              class="w-full"
              placeholder="请选择当前订单付款状态"
            >
              <Select.Option value="unpaid">
                <Tag
                  color="warning"
                  class="mr-1 rounded-sm border-0 text-[10px]"
                >
                  未付款
                </Tag>
                未付款
              </Select.Option>
              <Select.Option value="paid">
                <Tag
                  color="success"
                  class="mr-1 rounded-sm border-0 text-[10px]"
                >
                  已付款
                </Tag>
                已付款
              </Select.Option>
              <Select.Option value="cancelled">
                <Tag color="error" class="mr-1 rounded-sm border-0 text-[10px]">
                  已取消
                </Tag>
                已取消
              </Select.Option>
            </Select>
          </FormItem>

          <FormItem label="备注信息">
            <Input.TextArea
              v-model:value="editForm.remarks"
              :rows="4"
              placeholder="输入关于该订单的重要备注或财务核对记录..."
              class="rounded-lg"
            />
          </FormItem>
        </Form>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.custom-table :deep(.ant-table) {
  background: transparent;
}

.custom-table :deep(.ant-table-thead > tr > th) {
  font-size: 11px;
  font-weight: 800;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.dark .custom-table :deep(.ant-table-thead > tr > th) {
  background: #1e293b;
  border-bottom-color: #334155;
}

.custom-table :deep(.ant-table-tbody > tr > td) {
  border-bottom: 1px solid #f1f5f9;
}

.dark .custom-table :deep(.ant-table-tbody > tr > td) {
  border-bottom-color: #1e293b;
}

:deep(.modern-modal .ant-modal-content) {
  overflow: hidden;
  border-radius: 1.25rem;
}
</style>
