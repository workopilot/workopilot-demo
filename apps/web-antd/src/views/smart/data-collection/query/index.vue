<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Input,
  Menu,
  Table,
  Tag,
} from 'ant-design-vue';

type CategoryKey = 'customers' | 'documents' | 'products';

const activeCategory = ref<CategoryKey>('documents');
const searchText = ref('');
const loading = ref(false);

const drawerVisible = ref(false);
const selectedRecord = ref<any>(null);

const menuItems = [
  { key: 'documents', label: '单据', icon: 'lucide:file-text' },
  { key: 'customers', label: '客户', icon: 'lucide:users' },
  { key: 'products', label: '产品', icon: 'lucide:package' },
];

const handleMenuClick = ({ key }: { key: any }) => {
  activeCategory.value = key;
  searchText.value = '';
};

function handleViewDetails(record: any) {
  selectedRecord.value = record;
  drawerVisible.value = true;
}

function formatJson(data: any) {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

// --- Mock Data ---
const mockDocuments = [
  {
    id: '1',
    billNo: 'BX202607001',
    billDate: '2026-07-01',
    amount: 1250,
    remark: '差旅报销',
    applicant: '张三',
    collectedAt: '2026-07-02 10:00',
    status: '已处理',
    extendedData: {
      department: '研发部',
      project: 'AI中台建设',
      expenseItems: [
        { type: '机票', fee: 1000 },
        { type: '打车', fee: 250 },
      ],
    },
  },
  {
    id: '2',
    billNo: 'BX202607002',
    billDate: '2026-07-02',
    amount: 840.5,
    remark: '办公用品',
    applicant: '李四',
    collectedAt: '2026-07-03 11:30',
    status: '待处理',
    extendedData: { department: '行政部', items: ['A4纸', '墨盒'] },
  },
  {
    id: '3',
    billNo: 'CG202607001',
    billDate: '2026-07-05',
    amount: 45_000,
    remark: '服务器采购',
    applicant: '王五',
    collectedAt: '2026-07-06 14:20',
    status: '异常',
    extendedData: {
      vendor: '阿里云',
      spec: '8C32G',
      quantity: 5,
      errorReason: '预算超支需特批',
    },
  },
];

const mockCustomers = [
  {
    id: '1',
    code: 'CUST-001',
    name: '北京科技集团有限公司',
    remark: '大客户，已认证',
    collectedAt: '2026-07-01 09:00',
    status: '正常',
    extendedData: {
      legalPerson: '赵六',
      registeredCapital: '5000万',
      establishDate: '2010-05-12',
      taxId: '91110000XXXXXXX',
    },
  },
  {
    id: '2',
    code: 'CUST-002',
    name: '上海贸易发展公司',
    remark: '待补充工商信息',
    collectedAt: '2026-07-04 15:15',
    status: '待清洗',
    extendedData: {
      contactPerson: '李经理',
      phone: '13800138000',
      source: '企查查自动抓取',
    },
  },
  {
    id: '3',
    code: 'CUST-003',
    name: '深圳云端服务商',
    remark: '-',
    collectedAt: '2026-07-07 10:30',
    status: '正常',
    extendedData: {
      region: '华南区',
      industry: '互联网/SaaS',
      employeeCount: '100-499人',
    },
  },
];

const mockProducts = [
  {
    id: '1',
    code: 'PROD-A01',
    name: '企业级SSD 2TB',
    remark: '库存预警',
    collectedAt: '2026-07-06 08:00',
    status: '正常',
    extendedData: {
      brand: 'Samsung',
      interface: 'PCIe 4.0',
      readSpeed: '7000MB/s',
      writeSpeed: '5100MB/s',
    },
  },
  {
    id: '2',
    code: 'PROD-B02',
    name: '高性能计算服务器',
    remark: '缺货',
    collectedAt: '2026-07-06 08:05',
    status: '正常',
    extendedData: {
      cpu: 'Dual Intel Xeon Platinum',
      ram: '256GB DDR4',
      storage: '4TB NVMe SSD',
    },
  },
  {
    id: '3',
    code: 'PROD-S01',
    name: 'SAAS年费订阅',
    remark: '虚拟产品',
    collectedAt: '2026-07-06 08:10',
    status: '异常',
    extendedData: {
      duration: '12个月',
      features: ['AI大模型调用', '无限制RPA', 'API开放'],
      errorReason: '抓取价格字段为空',
    },
  },
];

// --- Computed Properties ---
const columns = computed(() => {
  const baseAction = {
    title: '操作',
    key: 'action',
    width: 100,
    align: 'center',
  };

  if (activeCategory.value === 'documents') {
    return [
      { title: '单号', dataIndex: 'billNo', key: 'billNo' },
      { title: '单据日期', dataIndex: 'billDate', key: 'billDate' },
      { title: '金额 (¥)', dataIndex: 'amount', key: 'amount' },
      { title: '申请人', dataIndex: 'applicant', key: 'applicant' },
      { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
      { title: '采集日期', dataIndex: 'collectedAt', key: 'collectedAt' },
      { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
      baseAction,
    ];
  } else if (activeCategory.value === 'customers') {
    return [
      { title: '客户编号', dataIndex: 'code', key: 'code' },
      { title: '客户名称', dataIndex: 'name', key: 'name' },
      { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
      { title: '采集日期', dataIndex: 'collectedAt', key: 'collectedAt' },
      { title: '数据状态', dataIndex: 'status', key: 'status', width: 100 },
      baseAction,
    ];
  } else {
    return [
      { title: '产品编号', dataIndex: 'code', key: 'code' },
      { title: '产品名称', dataIndex: 'name', key: 'name' },
      { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
      { title: '采集日期', dataIndex: 'collectedAt', key: 'collectedAt' },
      { title: '数据状态', dataIndex: 'status', key: 'status', width: 100 },
      baseAction,
    ];
  }
});

const dataSource = computed(() => {
  let data: any[] = [];
  if (activeCategory.value === 'documents') data = mockDocuments;
  if (activeCategory.value === 'customers') data = mockCustomers;
  if (activeCategory.value === 'products') data = mockProducts;

  if (searchText.value) {
    data = data.filter((item) =>
      Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchText.value.toLowerCase()),
      ),
    );
  }
  return data;
});

const getCategoryTitle = computed(() => {
  return menuItems.find((m) => m.key === activeCategory.value)?.label || '数据';
});

function getStatusColor(status: string) {
  if (status.includes('正常') || status.includes('已处理')) return 'success';
  if (status.includes('异常')) return 'error';
  if (status.includes('待清洗')) return 'warning';
  return 'processing';
}
</script>

<template>
  <div class="flex h-[calc(100vh-100px)] gap-6 bg-slate-50 p-6">
    <!-- Left Sidebar -->
    <Card
      :bordered="false"
      class="w-64 shrink-0 rounded-xl shadow-sm [&_.ant-card-body]:p-0"
    >
      <div class="border-b border-slate-100 p-4">
        <h2 class="m-0 text-lg font-bold text-slate-800">数据分类</h2>
      </div>
      <Menu
        :selected-keys="[activeCategory]"
        mode="inline"
        class="border-none py-2"
        @click="handleMenuClick"
      >
        <Menu.Item v-for="item in menuItems" :key="item.key" class="!my-1">
          <div class="flex items-center gap-3">
            <Icon :icon="item.icon" class="size-4" />
            <span>{{ item.label }}</span>
          </div>
        </Menu.Item>
      </Menu>
    </Card>

    <!-- Main Content -->
    <Card
      :bordered="false"
      class="flex flex-1 flex-col overflow-hidden rounded-xl shadow-sm"
    >
      <!-- Toolbar -->
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="mb-1 text-xl font-bold text-slate-800">
            {{ getCategoryTitle }}查询
          </h2>
          <p class="m-0 text-sm text-slate-500">
            从统一数据池中提取的结构化{{ getCategoryTitle }}数据。
          </p>
        </div>
        <div class="flex items-center gap-3">
          <Input.Search
            v-model:value="searchText"
            placeholder="全文搜索..."
            class="w-64"
            allow-clear
          />
          <Button type="primary" class="flex items-center gap-2">
            <Icon icon="lucide:download" /> 导出
          </Button>
        </div>
      </div>

      <!-- Table -->
      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        :pagination="{ pageSize: 15 }"
        size="middle"
        class="flex-1"
        :scroll="{ y: 'calc(100vh - 280px)' }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <Tag :color="getStatusColor(record.status)">
              {{ record.status }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="handleViewDetails(record)">
              详情
            </Button>
          </template>
        </template>
      </Table>
    </Card>

    <!-- Detail Drawer -->
    <Drawer
      v-model:open="drawerVisible"
      :title="`${getCategoryTitle}详情`"
      placement="right"
      width="600"
    >
      <div v-if="selectedRecord" class="flex flex-col gap-6">
        <!-- Basic Info -->
        <Descriptions title="基础信息" bordered :column="1" size="small">
          <template v-if="activeCategory === 'documents'">
            <Descriptions.Item label="单据单号">
              {{ selectedRecord.billNo }}
            </Descriptions.Item>
            <Descriptions.Item label="单据日期">
              {{ selectedRecord.billDate }}
            </Descriptions.Item>
            <Descriptions.Item label="金额">
              ¥ {{ selectedRecord.amount }}
            </Descriptions.Item>
            <Descriptions.Item label="申请人">
              {{ selectedRecord.applicant }}
            </Descriptions.Item>
          </template>

          <template
            v-if="
              activeCategory === 'customers' || activeCategory === 'products'
            "
          >
            <Descriptions.Item label="编号">
              {{ selectedRecord.code }}
            </Descriptions.Item>
            <Descriptions.Item label="名称">
              {{ selectedRecord.name }}
            </Descriptions.Item>
          </template>

          <Descriptions.Item label="采集时间">
            {{ selectedRecord.collectedAt }}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag :color="getStatusColor(selectedRecord.status)">
              {{ selectedRecord.status }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="备注">
            {{ selectedRecord.remark || '-' }}
          </Descriptions.Item>
        </Descriptions>

        <!-- Extended JSON Data -->
        <div v-if="selectedRecord.extendedData">
          <h3 class="mb-3 flex items-center gap-2 font-semibold text-slate-800">
            <Icon icon="lucide:code" class="text-blue-500" />
            扩展数据 (JSON)
          </h3>
          <div class="overflow-x-auto rounded-lg bg-slate-900 p-4 shadow-inner">
            <!-- prettier-ignore -->
            <pre class="m-0 whitespace-pre-wrap break-all font-mono text-sm text-emerald-400">{{ formatJson(selectedRecord.extendedData) }}</pre>
          </div>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
:deep(.ant-menu-item-selected) {
  font-weight: 600;
  color: #2563eb !important;
  background-color: #eff6ff !important;
}
</style>
