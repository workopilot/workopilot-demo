<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Breadcrumb,
  Button,
  Card,
  Form,
  Input,
  message,
  Modal,
  RangePicker,
  Select,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'ant-design-vue';
import dayjs from 'dayjs';

const TabPane = Tabs.TabPane;

const router = useRouter();

// Mock Tenant Data
const tenantName = ref('A公司 (科技电商)');
const filterDateRange = ref<[any, any]>([dayjs().subtract(7, 'day'), dayjs()]);
const activeTab = ref('subscription');

// ==========================
// Tab 1: Subscriptions
// ==========================
const subColumns = [
  { title: '订阅单号', dataIndex: 'id', key: 'id', width: 120 },
  { title: '套餐名称', dataIndex: 'packageName', key: 'packageName' },
  { title: '类型', key: 'type', width: 100 },
  { title: '订单日期', dataIndex: 'orderDate', key: 'orderDate', width: 120 },
  {
    title: '生效日期',
    dataIndex: 'effectiveDate',
    key: 'effectiveDate',
    width: 120,
  },
  { title: '状态', key: 'status', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '员工配额', dataIndex: 'quota', key: 'quota' },
  { title: '操作', key: 'action', fixed: 'right', width: 120 },
];

const subscriptions = ref([
  {
    key: 'sub-1',
    id: 'SUB00123',
    packageName: 'Pro 1.0',
    type: 'subscribe',
    orderDate: '2026-05-01',
    effectiveDate: '2026-05-01',
    status: 'paid',
    remark: '年度合约客户',
    quota: '订单专员, 财务对账专员',
  },
  {
    key: 'sub-2',
    id: 'SUB00155',
    packageName: 'Ultra 1.0',
    type: 'upgrade',
    orderDate: '2026-05-10',
    effectiveDate: '2026-05-10',
    status: 'unpaid',
    remark: '扩充业务线',
    quota: '所有高级数字员工',
  },
]);

const editSubVisible = ref(false);
const editingSub = ref<any>(null);
const editForm = ref({
  status: '',
  remark: '',
});

const openEditSub = (record: any) => {
  editingSub.value = record;
  editForm.value = {
    status: record.status,
    remark: record.remark,
  };
  editSubVisible.value = true;
};

const handleSaveSub = () => {
  if (editingSub.value) {
    editingSub.value.status = editForm.value.status;
    editingSub.value.remark = editForm.value.remark;
    message.success('更新成功');
    editSubVisible.value = false;
  }
};

// ==========================
// Tab 2: Orders
// ==========================
const orderColumns = [
  { title: '订单号', dataIndex: 'id', key: 'id', width: 150 },
  { title: '订单日期', dataIndex: 'date', key: 'date', width: 120 },
  { title: '说明', dataIndex: 'desc', key: 'desc' },
  { title: '点数', dataIndex: 'points', key: 'points', align: 'right' },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '状态', key: 'status', width: 100 },
];

const orders = ref([
  {
    key: 'ord-1',
    id: 'ORD2026051201',
    date: '2026-05-12',
    desc: 'Pro 1.0 套餐月度自动生成订单',
    points: 8000,
    remark: '-',
    status: 'paid',
  },
  {
    key: 'ord-2',
    id: 'ORD2026041201',
    date: '2026-04-12',
    desc: 'Std 2.0 套餐月度自动生成订单',
    points: 5000,
    remark: '自动扣费成功',
    status: 'paid',
  },
]);

// ==========================
// Tab 3: Consumption Details
// ==========================
const consColumns = [
  { title: '日期', dataIndex: 'date', key: 'date', width: 180 },
  { title: '数字员工', dataIndex: 'employeeName', key: 'employeeName' },
  {
    title: '变动 (点数)',
    dataIndex: 'amount',
    key: 'amount',
    align: 'right',
    width: 150,
  },
  { title: '计费说明', dataIndex: 'mode', key: 'mode', width: 200 },
];

const consumptions = ref([
  {
    key: 'c-1',
    date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    employeeName: '订单专员',
    amount: -10,
    mode: '计次扣费 (10/订单)',
  },
  {
    key: 'c-2',
    date: dayjs().subtract(1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
    employeeName: '财务对账专员',
    amount: -10,
    mode: '计次扣费 (10/单)',
  },
  {
    key: 'c-3',
    date: dayjs().subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    employeeName: 'AI问数',
    amount: -3.3,
    mode: '包月均摊 (99/月)',
  },
  {
    key: 'c-4',
    date: dayjs()
      .subtract(1, 'day')
      .subtract(2, 'hour')
      .format('YYYY-MM-DD HH:mm:ss'),
    employeeName: 'PPT专员',
    amount: -10,
    mode: '计次扣费 (10/PPT)',
  },
]);

const goBack = () => {
  router.back();
};
</script>

<template>
  <div class="min-h-full bg-slate-50/50 p-4 md:p-6 dark:bg-slate-900/50">
    <div class="mb-6">
      <Breadcrumb class="mb-4">
        <Breadcrumb.Item>运营大盘</Breadcrumb.Item>
        <Breadcrumb.Item
          @click="goBack"
          class="cursor-pointer hover:text-indigo-600"
        >
          租户套餐管理
        </Breadcrumb.Item>
        <Breadcrumb.Item>账单与明细</Breadcrumb.Item>
      </Breadcrumb>

      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button shape="circle" @click="goBack">
            <template #icon><Icon icon="lucide:arrow-left" /></template>
          </Button>
          <div>
            <Typography.Title :level="4" class="!m-0 text-slate-800">
              账单与明细: <span class="text-indigo-600">{{ tenantName }}</span>
            </Typography.Title>
            <p class="m-0 mt-1 text-sm font-medium text-slate-500">
              集中管理租户的套餐订阅、月度订单及资源消耗流水
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <RangePicker v-model:value="filterDateRange" class="w-64 shadow-sm" />
          <div class="mx-1 h-6 w-px bg-slate-200"></div>
          <Button type="primary" class="flex items-center gap-2 bg-indigo-600">
            <Icon icon="lucide:download" /> 导出报表
          </Button>
        </div>
      </div>
    </div>

    <Card
      :bordered="false"
      class="overflow-hidden rounded-3xl bg-white/80 shadow-xl backdrop-blur-md"
    >
      <Tabs v-model:active-key="activeTab" class="custom-tabs">
        <!-- Tab 1: Subscriptions -->
        <TabPane key="subscription" tab="套餐订阅">
          <Table
            :columns="subColumns"
            :data-source="subscriptions"
            :pagination="false"
            class="modern-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'type'">
                <Tag
                  v-if="record.type === 'subscribe'"
                  color="blue"
                  class="m-0 border-0 bg-blue-50 px-3 font-black text-blue-600"
                >
                  首次订阅
                </Tag>
                <Tag
                  v-else-if="record.type === 'upgrade'"
                  color="success"
                  class="m-0 border-0 bg-emerald-50 px-3 font-black text-emerald-600"
                >
                  升级套餐
                </Tag>
                <Tag
                  v-else
                  color="error"
                  class="m-0 border-0 bg-rose-50 px-3 font-black text-rose-600"
                >
                  降级套餐
                </Tag>
              </template>

              <template v-if="column.key === 'status'">
                <Tag
                  v-if="record.status === 'paid'"
                  color="success"
                  class="m-0 rounded-full border-0 bg-emerald-500 px-3 font-bold text-white"
                >
                  已付款
                </Tag>
                <Tag
                  v-else-if="record.status === 'unpaid'"
                  color="warning"
                  class="m-0 rounded-full border-0 bg-amber-500 px-3 font-bold text-white"
                >
                  未付款
                </Tag>
                <Tag
                  v-else
                  color="default"
                  class="m-0 rounded-full border-0 bg-slate-300 px-3 font-bold text-white"
                >
                  已取消
                </Tag>
              </template>

              <template v-if="column.key === 'action'">
                <Button
                  type="link"
                  class="flex items-center gap-1 p-0 font-bold"
                  @click="openEditSub(record)"
                >
                  <Icon icon="lucide:edit-3" /> 编辑
                </Button>
              </template>
            </template>
          </Table>
        </TabPane>

        <!-- Tab 2: Orders -->
        <TabPane key="order" tab="月度订单">
          <Table
            :columns="orderColumns"
            :data-source="orders"
            :pagination="false"
            class="modern-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'points'">
                <span class="font-mono font-black text-indigo-600">
                  +{{ record.points.toLocaleString() }}
                </span>
              </template>
              <template v-if="column.key === 'status'">
                <Tag
                  v-if="record.status === 'paid'"
                  color="success"
                  class="m-0 border-0 bg-emerald-100 font-bold text-emerald-700"
                >
                  支付成功
                </Tag>
                <Tag
                  v-else
                  color="warning"
                  class="m-0 border-0 bg-amber-100 font-bold text-amber-700"
                >
                  待支付
                </Tag>
              </template>
            </template>
          </Table>
        </TabPane>

        <!-- Tab 3: Consumption Details -->
        <TabPane key="consumption" tab="消耗明细">
          <Table
            :columns="consColumns"
            :data-source="consumptions"
            :pagination="{ pageSize: 15 }"
            class="modern-table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'employeeName'">
                <span class="font-bold text-slate-800">{{
                  record.employeeName
                }}</span>
              </template>
              <template v-if="column.key === 'amount'">
                <span class="font-mono font-black text-rose-500">{{
                  record.amount.toLocaleString()
                }}</span>
              </template>
              <template v-if="column.key === 'mode'">
                <span class="text-xs font-semibold text-slate-500">{{
                  record.mode
                }}</span>
              </template>
            </template>
          </Table>
        </TabPane>
      </Tabs>
    </Card>

    <!-- Modal: Edit Subscription -->
    <Modal
      v-model:open="editSubVisible"
      title="修改订阅信息"
      @ok="handleSaveSub"
      centered
      :body-style="{ padding: '24px' }"
      class="rounded-modal"
    >
      <Form layout="vertical">
        <Form.Item label="付款状态">
          <Select v-model:value="editForm.status">
            <Select.Option value="unpaid">未付款</Select.Option>
            <Select.Option value="paid">已付款</Select.Option>
            <Select.Option value="cancelled">已取消</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item label="备注信息">
          <Input.TextArea
            v-model:value="editForm.remark"
            placeholder="请输入备注内容..."
            :rows="4"
          />
        </Form.Item>
      </Form>
    </Modal>
  </div>
</template>

<style scoped>
.custom-tabs :deep(.ant-tabs-nav) {
  padding: 0 24px;
  margin-bottom: 0;
  border-bottom: 1px solid #f1f5f9;
}

.custom-tabs :deep(.ant-tabs-tab) {
  padding: 16px 0;
  font-weight: 800;
  color: #94a3b8;
}

.custom-tabs :deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: #4f46e5;
}

.custom-tabs :deep(.ant-tabs-ink-bar) {
  height: 3px;
  background: #4f46e5;
  border-radius: 3px 3px 0 0;
}

/* Modern Table Styling */
.modern-table :deep(.ant-table-thead > tr > th) {
  font-size: 11px;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
}

.modern-table :deep(.ant-table-tbody > tr > td) {
  padding: 16px 12px;
  border-bottom: 1px solid #f8fafc;
}

.modern-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #f1f5f9 !important;
}

.rounded-modal :deep(.ant-modal-content) {
  overflow: hidden;
  border-radius: 1.5rem;
}
</style>
