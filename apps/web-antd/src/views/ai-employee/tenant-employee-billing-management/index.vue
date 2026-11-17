<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Avatar,
  Button,
  Drawer,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

type BillingMode = 'monthly' | 'per-use';
type InstallStatus = 'installed' | 'uninstalled';
type PackageCode = 'Pro' | 'Std' | 'Ultra';

interface EmployeeRecord {
  avatar: string;
  billingMode: BillingMode;
  desc: string;
  id: string;
  installStatus: InstallStatus;
  monthlyPoints: number;
  name: string;
  price: number;
  type: string;
  unit: string;
}

interface TenantBillingRecord {
  code: string;
  currentPackage: PackageCode;
  employees: EmployeeRecord[];
  id: string;
  name: string;
  openedAt: string;
  owner: string;
}

const tenantList = ref<TenantBillingRecord[]>([
  {
    id: 'tenant_001',
    name: '默认租户',
    code: 'default_tenant',
    currentPackage: 'Pro',
    openedAt: '2026-04-15',
    owner: '周明',
    employees: [
      {
        id: 'EMP-007',
        name: 'ppt专业助理',
        type: '办公生产力',
        avatar: `${import.meta.env.BASE_URL}images/ai-employee/产品经理.jpg`,
        desc: '根据大纲自动生成精美的演示文稿。',
        billingMode: 'per-use',
        price: 5,
        unit: '点/PPT',
        monthlyPoints: 1200,
        installStatus: 'installed',
      },
      {
        id: 'EMP-003',
        name: '财务对账助理',
        type: '财务运营',
        avatar: `${import.meta.env.BASE_URL}images/ai-employee/财务.jpg`,
        desc: '自动化核对流水账单与对账单。',
        billingMode: 'monthly',
        price: 10,
        unit: '点/单',
        monthlyPoints: 3000,
        installStatus: 'uninstalled',
      },
    ],
  },
  {
    id: 'tenant_002',
    name: '企业租户A',
    code: 'enterprise_a',
    currentPackage: 'Ultra',
    openedAt: '2026-03-01',
    owner: '林佳',
    employees: [
      {
        id: 'EMP-001',
        name: '订单专员',
        type: '销售运营',
        avatar: `${import.meta.env.BASE_URL}images/ai-employee/sales.png`,
        desc: '处理海量订单流入与状态追踪。',
        billingMode: 'monthly',
        price: 10,
        unit: '点/订单',
        monthlyPoints: 5000,
        installStatus: 'installed',
      },
      {
        id: 'EMP-004',
        name: 'AI问数助理',
        type: '数据分析',
        avatar: `${import.meta.env.BASE_URL}images/ai-employee/数据分析师.jpg`,
        desc: '通过自然语言查询经营数据并生成分析结论。',
        billingMode: 'per-use',
        price: 15,
        unit: '点/报表',
        monthlyPoints: 4500,
        installStatus: 'uninstalled',
      },
    ],
  },
  {
    id: 'tenant_003',
    name: '小微企业B',
    code: 'small_biz_b',
    currentPackage: 'Std',
    openedAt: '2026-05-08',
    owner: '陈晨',
    employees: [],
  },
]);

const employeePool: EmployeeRecord[] = [
  {
    id: 'EMP-001',
    name: '订单专员',
    type: '销售运营',
    avatar: `${import.meta.env.BASE_URL}images/ai-employee/sales.png`,
    desc: '处理海量订单流入与状态追踪。',
    billingMode: 'monthly',
    price: 10,
    unit: '点/订单',
    monthlyPoints: 5000,
    installStatus: 'uninstalled',
  },
  {
    id: 'EMP-002',
    name: '收单专员',
    type: '财务运营',
    avatar: `${import.meta.env.BASE_URL}images/ai-employee/报价专员.jpg`,
    desc: '自动接收订单、校验单据信息并触发后续流程。',
    billingMode: 'per-use',
    price: 6,
    unit: '点/单',
    monthlyPoints: 1800,
    installStatus: 'uninstalled',
  },
  {
    id: 'EMP-003',
    name: '财务对账助理',
    type: '财务运营',
    avatar: `${import.meta.env.BASE_URL}images/ai-employee/财务.jpg`,
    desc: '自动化核对流水账单与对账单。',
    billingMode: 'monthly',
    price: 10,
    unit: '点/单',
    monthlyPoints: 3000,
    installStatus: 'uninstalled',
  },
  {
    id: 'EMP-004',
    name: 'AI问数助理',
    type: '数据分析',
    avatar: `${import.meta.env.BASE_URL}images/ai-employee/数据分析师.jpg`,
    desc: '通过自然语言查询经营数据并生成分析结论。',
    billingMode: 'per-use',
    price: 15,
    unit: '点/报表',
    monthlyPoints: 4500,
    installStatus: 'uninstalled',
  },
  {
    id: 'EMP-005',
    name: '企业知识助理',
    type: '知识服务',
    avatar: `${import.meta.env.BASE_URL}images/ai-employee/咨询人员.jpg`,
    desc: '基于企业知识库回答制度、流程与业务问题。',
    billingMode: 'per-use',
    price: 3,
    unit: '点/问答',
    monthlyPoints: 1200,
    installStatus: 'uninstalled',
  },
  {
    id: 'EMP-006',
    name: '商务助理',
    type: '商务运营',
    avatar: `${import.meta.env.BASE_URL}images/ai-employee/商务分析助手.jpg`,
    desc: '协助整理商机、报价信息与客户跟进记录。',
    billingMode: 'monthly',
    price: 8,
    unit: '点/任务',
    monthlyPoints: 2600,
    installStatus: 'uninstalled',
  },
  {
    id: 'EMP-007',
    name: 'ppt专业助理',
    type: '办公生产力',
    avatar: `${import.meta.env.BASE_URL}images/ai-employee/产品经理.jpg`,
    desc: '根据大纲自动生成精美的演示文稿。',
    billingMode: 'per-use',
    price: 5,
    unit: '点/PPT',
    monthlyPoints: 1200,
    installStatus: 'uninstalled',
  },
];

const filters = reactive({
  keyword: '',
  packageCode: undefined as PackageCode | undefined,
});

const drawerOpen = ref(false);
const addEmployeeOpen = ref(false);
const selectedTenant = ref<TenantBillingRecord>();
const employeeSearchKey = ref('');
const selectedEmployeeKeys = ref<string[]>([]);

const tenantColumns = [
  { title: '租户名称', key: 'tenant', minWidth: 220 },
  { title: '编码', dataIndex: 'code', key: 'code', width: 180 },
  { title: '当前套餐', key: 'currentPackage', width: 130 },
  { title: '开通日期', dataIndex: 'openedAt', key: 'openedAt', width: 130 },
  { title: '运营负责人', dataIndex: 'owner', key: 'owner', width: 130 },
  { title: '员工开通数量', key: 'employeeCount', width: 140 },
  { title: '操作', key: 'action', fixed: 'right', width: 130 },
];

const employeeColumns = [
  { title: '数字员工', key: 'employee', width: 230 },
  { title: '计费模式', key: 'billingMode', width: 140 },
  { title: '计费配置', key: 'config', width: 320 },
  { title: '安装状态', key: 'installStatus', width: 150 },
  { title: '操作', key: 'action', width: 110 },
];

const employeeSelectionColumns = [
  { title: '数字员工', key: 'employee', width: 230 },
  { title: '功能简介', dataIndex: 'desc', key: 'desc' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
  { title: '默认单价', key: 'price', align: 'center', width: 110 },
  {
    title: '计费单位',
    dataIndex: 'unit',
    key: 'unit',
    align: 'center',
    width: 110,
  },
];

const filteredTenants = computed(() => {
  return tenantList.value.filter((item) => {
    const keyword = filters.keyword.trim().toLowerCase();
    const matchKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.code.toLowerCase().includes(keyword);
    const matchPackage =
      !filters.packageCode || item.currentPackage === filters.packageCode;
    return matchKeyword && matchPackage;
  });
});

const employeeCount = computed(
  () => selectedTenant.value?.employees.length || 0,
);

const uninstalledCount = computed(
  () =>
    selectedTenant.value?.employees.filter(
      (item) => item.installStatus === 'uninstalled',
    ).length || 0,
);

const filteredEmployeePool = computed(() => {
  const keyword = employeeSearchKey.value.trim().toLowerCase();
  if (!keyword) {
    return employeePool;
  }
  return employeePool.filter(
    (item) =>
      item.id.toLowerCase().includes(keyword) ||
      item.name.toLowerCase().includes(keyword) ||
      item.type.toLowerCase().includes(keyword) ||
      item.desc.toLowerCase().includes(keyword),
  );
});

function openConfigDrawer(record: TenantBillingRecord) {
  selectedTenant.value = record;
  drawerOpen.value = true;
}

function installSingle(record: EmployeeRecord) {
  record.installStatus = 'installed';
  message.success(`${record.name} 已触发安装`);
}

function installAll() {
  selectedTenant.value?.employees.forEach((item) => {
    item.installStatus = 'installed';
  });
  message.success('已一键安装所有未安装员工');
}

function openAddEmployee() {
  selectedEmployeeKeys.value = [];
  employeeSearchKey.value = '';
  addEmployeeOpen.value = true;
}

function addEmployee() {
  const tenant = selectedTenant.value;
  const selected = employeePool.filter((item) =>
    selectedEmployeeKeys.value.includes(item.id),
  );

  if (!tenant || selected.length === 0) {
    message.warning('请选择要新增的数字员工');
    return;
  }

  const appended = selected.filter(
    (employee) => !tenant.employees.some((item) => item.id === employee.id),
  );

  tenant.employees.push(...appended.map((employee) => ({ ...employee })));
  addEmployeeOpen.value = false;
  message.success(`已添加 ${appended.length} 个员工到计费配置`);
}
</script>

<template>
  <div class="flex min-h-full flex-col gap-4 bg-slate-50 p-4 md:p-6">
    <div
      class="flex flex-col gap-4 border-b border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <div class="flex items-center gap-2">
          <h1 class="m-0 text-xl font-semibold text-slate-900">租户员工计费</h1>
          <Tag color="blue" class="m-0">New</Tag>
        </div>
        <p class="m-0 mt-1 text-sm text-slate-500">
          按租户维护数字员工计费模式、扣点配置与安装状态。
        </p>
      </div>
      <div class="grid grid-cols-2 gap-6 text-right">
        <div>
          <div class="text-xs text-slate-500">租户数</div>
          <div class="text-xl font-semibold text-slate-900">
            {{ tenantList.length }}
          </div>
        </div>
        <div>
          <div class="text-xs text-slate-500">已开通员工</div>
          <div class="text-xl font-semibold text-emerald-600">
            {{
              tenantList.reduce((sum, item) => sum + item.employees.length, 0)
            }}
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white p-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Input
          v-model:value="filters.keyword"
          allow-clear
          placeholder="租户名称 / 编码"
        />
        <Select
          v-model:value="filters.packageCode"
          allow-clear
          placeholder="当前套餐"
        >
          <Select.Option value="Std">Std</Select.Option>
          <Select.Option value="Pro">Pro</Select.Option>
          <Select.Option value="Ultra">Ultra</Select.Option>
        </Select>
        <div class="flex justify-end">
          <Button>
            <template #icon><Icon icon="lucide:download" /></template>
            导出
          </Button>
        </div>
      </div>
    </div>

    <div class="overflow-hidden bg-white">
      <Table
        :columns="tenantColumns"
        :data-source="filteredTenants"
        :pagination="{ pageSize: 10, showSizeChanger: true }"
        row-key="id"
        size="middle"
        :scroll="{ x: 1160 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'tenant'">
            <div class="flex items-center gap-3">
              <div
                class="flex h-9 w-9 items-center justify-center bg-slate-100 text-slate-500"
              >
                <Icon icon="lucide:building-2" />
              </div>
              <span class="font-medium text-slate-900">{{ record.name }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'currentPackage'">
            <Tag
              :color="
                record.currentPackage === 'Ultra'
                  ? 'purple'
                  : record.currentPackage === 'Pro'
                    ? 'blue'
                    : 'default'
              "
            >
              {{ record.currentPackage }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'employeeCount'">
            <span class="font-semibold">{{ record.employees.length }}</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button type="link" size="small" @click="openConfigDrawer(record)">
              配置员工
            </Button>
          </template>
        </template>
      </Table>
    </div>

    <Drawer
      v-model:open="drawerOpen"
      :title="`配置员工 - ${selectedTenant?.name || ''}`"
      width="1040"
      placement="right"
    >
      <div
        class="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between"
      >
        <div class="grid grid-cols-3 gap-4">
          <div>
            <div class="text-xs text-slate-500">当前套餐</div>
            <div class="font-semibold text-slate-900">
              {{ selectedTenant?.currentPackage }}
            </div>
          </div>
          <div>
            <div class="text-xs text-slate-500">开通员工</div>
            <div class="font-semibold text-slate-900">{{ employeeCount }}</div>
          </div>
          <div>
            <div class="text-xs text-slate-500">待安装</div>
            <div class="font-semibold text-amber-600">
              {{ uninstalledCount }}
            </div>
          </div>
        </div>
        <Space>
          <Button @click="openAddEmployee">
            <template #icon><Icon icon="lucide:plus" /></template>
            新增员工
          </Button>
          <Button
            type="primary"
            :disabled="uninstalledCount === 0"
            @click="installAll"
          >
            一键安装所有
          </Button>
        </Space>
      </div>

      <Table
        :columns="employeeColumns"
        :data-source="selectedTenant?.employees || []"
        :pagination="false"
        row-key="id"
        size="middle"
        :scroll="{ x: 920 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'employee'">
            <div class="flex items-center gap-3">
              <Avatar :src="record.avatar" :size="36" />
              <div class="flex min-w-0 flex-col">
                <span class="truncate font-medium text-slate-900">{{
                  record.name
                }}</span>
                <span class="text-xs text-slate-400">
                  {{ record.id }} · {{ record.type }}
                </span>
              </div>
            </div>
          </template>
          <template v-else-if="column.key === 'billingMode'">
            <div class="inline-flex bg-slate-100 p-1">
              <button
                class="px-3 py-1 text-xs font-medium"
                :class="
                  record.billingMode === 'per-use'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500'
                "
                @click="record.billingMode = 'per-use'"
              >
                计次
              </button>
              <button
                class="px-3 py-1 text-xs font-medium"
                :class="
                  record.billingMode === 'monthly'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500'
                "
                @click="record.billingMode = 'monthly'"
              >
                包月
              </button>
            </div>
          </template>
          <template v-else-if="column.key === 'config'">
            <div
              v-if="record.billingMode === 'per-use'"
              class="flex items-center gap-3"
            >
              <span class="text-xs text-slate-500">默认单价</span>
              <InputNumber
                :value="record.price"
                disabled
                :min="0"
                size="small"
                class="w-20"
              />
              <span class="text-xs text-slate-500">{{ record.unit }}</span>
            </div>
            <div v-else class="flex items-center gap-2 py-1">
              <div
                class="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                <Icon icon="lucide:check-circle-2" class="text-sm" />
              </div>
              <span
                class="text-xs font-bold text-emerald-600 dark:text-emerald-400"
                >包月免除扣点 (免收计费)</span
              >
            </div>
          </template>
          <template v-else-if="column.key === 'installStatus'">
            <Tag
              :color="
                record.installStatus === 'installed' ? 'success' : 'warning'
              "
            >
              {{ record.installStatus === 'installed' ? '已安装' : '未安装' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button
              v-if="record.installStatus === 'uninstalled'"
              type="link"
              size="small"
              @click="installSingle(record)"
            >
              手动安装
            </Button>
            <span v-else class="text-xs text-slate-400">已完成</span>
          </template>
        </template>
      </Table>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button @click="drawerOpen = false">关闭</Button>
          <Button
            type="primary"
            @click="
              drawerOpen = false;
              message.success('员工计费配置已保存');
            "
          >
            保存配置
          </Button>
        </div>
      </template>
    </Drawer>

    <Modal
      v-model:open="addEmployeeOpen"
      title="选择新增员工"
      ok-text="确定添加"
      width="860px"
      @ok="addEmployee"
    >
      <div class="mb-4 mt-4 flex items-center justify-between">
        <Input.Search
          v-model:value="employeeSearchKey"
          placeholder="搜索员工名称、编号或类型"
          class="max-w-[320px]"
        />
        <div class="text-sm text-slate-500">
          已选择
          <span class="font-bold text-indigo-600">{{
            selectedEmployeeKeys.length
          }}</span>
          项
        </div>
      </div>

      <div class="overflow-hidden border border-slate-200 bg-white">
        <Table
          :data-source="filteredEmployeePool"
          :columns="employeeSelectionColumns"
          :pagination="{ pageSize: 8, showSizeChanger: false }"
          :row-selection="{
            selectedRowKeys: selectedEmployeeKeys,
            onChange: (keys) => (selectedEmployeeKeys = keys as string[]),
          }"
          row-key="id"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'employee'">
              <div class="flex items-center gap-3">
                <Avatar :src="record.avatar" :size="36" />
                <div class="flex min-w-0 flex-col">
                  <span class="truncate font-bold leading-tight text-slate-800">
                    {{ record.name }}
                  </span>
                  <span
                    class="mt-0.5 w-fit bg-slate-100 px-1 font-mono text-[10px] text-slate-400"
                  >
                    {{ record.id }}
                  </span>
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'desc'">
              <span class="text-xs text-slate-500">{{ record.desc }}</span>
            </template>
            <template v-else-if="column.key === 'type'">
              <Tag color="default" class="m-0">{{ record.type }}</Tag>
            </template>
            <template v-else-if="column.key === 'price'">
              <span class="font-mono font-semibold text-slate-700">
                {{ record.price }}
              </span>
            </template>
            <template v-else-if="column.key === 'unit'">
              <Tag color="blue" class="m-0 border-0 bg-blue-50 text-blue-600">
                {{ record.unit }}
              </Tag>
            </template>
          </template>
        </Table>
      </div>
    </Modal>
  </div>
</template>
