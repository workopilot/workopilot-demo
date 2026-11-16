<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  message,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';
import dayjs, { Dayjs } from 'dayjs';

type PackageCode = 'pro' | 'std' | 'ultra';
type SubscriptionStatus = 'invalid' | 'valid';

interface TenantOption {
  code: string;
  id: string;
  name: string;
}

interface SubscriptionRecord {
  description: string;
  endDate: string;
  id: string;
  packageCode: PackageCode;
  packageName: string;
  points: number;
  status: SubscriptionStatus;
  subscribedAt: string;
  tenantCode: string;
  tenantId: string;
  tenantName: string;
}

const tenants: TenantOption[] = [
  { id: 'tenant_001', name: '默认租户', code: 'default_tenant' },
  { id: 'tenant_002', name: '企业租户A', code: 'enterprise_a' },
  { id: 'tenant_003', name: '小微企业B', code: 'small_biz_b' },
  { id: 'tenant_004', name: '制造企业C', code: 'manufacture_c' },
  { id: 'tenant_005', name: '医疗机构D', code: 'medical_d' },
];

const packageOptions: Array<{
  code: PackageCode;
  description: string;
  name: string;
  points: number;
  tone: string;
}> = [
  {
    code: 'std',
    name: 'Std',
    points: 50_000,
    description: '适合小规模试运行与基础员工调用',
    tone: 'slate',
  },
  {
    code: 'pro',
    name: 'Pro',
    points: 100_000,
    description: '适合常规业务团队的稳定订阅',
    tone: 'blue',
  },
  {
    code: 'ultra',
    name: 'Ultra',
    points: 500_000,
    description: '适合高频调用与多员工并行场景',
    tone: 'purple',
  },
];

const subscriptions = ref<SubscriptionRecord[]>([
  {
    id: 'SUB20260512001',
    tenantId: 'tenant_001',
    tenantName: '默认租户',
    tenantCode: 'default_tenant',
    packageCode: 'pro',
    packageName: 'Pro',
    points: 100_000,
    subscribedAt: '2026-04-15',
    status: 'valid',
    endDate: '2027-04-14',
    description: '年度订阅，包含常用数字员工计费额度。',
  },
  {
    id: 'SUB20260512002',
    tenantId: 'tenant_002',
    tenantName: '企业租户A',
    tenantCode: 'enterprise_a',
    packageCode: 'ultra',
    packageName: 'Ultra',
    points: 500_000,
    subscribedAt: '2026-03-01',
    status: 'valid',
    endDate: '2027-02-28',
    description: '集团运营套餐，开放高频员工调用。',
  },
  {
    id: 'SUB20260512003',
    tenantId: 'tenant_003',
    tenantName: '小微企业B',
    tenantCode: 'small_biz_b',
    packageCode: 'std',
    packageName: 'Std',
    points: 50_000,
    subscribedAt: '2025-05-01',
    status: 'invalid',
    endDate: '2026-04-30',
    description: '试运行订阅，已到期。',
  },
]);

const filters = reactive({
  keyword: '',
  packageCode: undefined as PackageCode | undefined,
  status: undefined as SubscriptionStatus | undefined,
  tenantId: undefined as string | undefined,
});

const drawerOpen = ref(false);
const drawerMode = ref<'create' | 'edit' | 'view'>('create');
const currentRecord = ref<SubscriptionRecord>();
const subscriptionForm = reactive({
  description: '',
  endDate: dayjs().add(1, 'year') as Dayjs,
  packageCode: 'std' as PackageCode,
  points: 50_000,
  subscribedAt: dayjs() as Dayjs,
  tenantId: undefined as string | undefined,
});

const columns = [
  { title: '租户', key: 'tenant', width: 220 },
  { title: '订阅单号', dataIndex: 'id', key: 'id', width: 170 },
  { title: '套餐', key: 'package', width: 120 },
  { title: '点数', key: 'points', align: 'right', width: 130 },
  {
    title: '订阅日期',
    dataIndex: 'subscribedAt',
    key: 'subscribedAt',
    width: 130,
  },
  { title: '状态', key: 'status', width: 100 },
  { title: '到期日期', dataIndex: 'endDate', key: 'endDate', width: 130 },
  { title: '操作', key: 'action', fixed: 'right', width: 170 },
];

const filteredSubscriptions = computed(() => {
  return subscriptions.value.filter((item) => {
    const keyword = filters.keyword.trim().toLowerCase();
    const matchKeyword =
      !keyword ||
      item.tenantName.toLowerCase().includes(keyword) ||
      item.tenantCode.toLowerCase().includes(keyword) ||
      item.id.toLowerCase().includes(keyword);
    const matchTenant = !filters.tenantId || item.tenantId === filters.tenantId;
    const matchPackage =
      !filters.packageCode || item.packageCode === filters.packageCode;
    const matchStatus = !filters.status || item.status === filters.status;
    return matchKeyword && matchTenant && matchPackage && matchStatus;
  });
});

const activeCount = computed(
  () => subscriptions.value.filter((item) => item.status === 'valid').length,
);

const totalPoints = computed(() =>
  subscriptions.value.reduce((sum, item) => sum + item.points, 0),
);

const packageLevelMap: Record<PackageCode, number> = {
  std: 1,
  pro: 2,
  ultra: 3,
};

const selectedPackage = computed(() =>
  getPackageMeta(subscriptionForm.packageCode),
);

const selectedTenant = computed(() =>
  tenants.find((item) => item.id === subscriptionForm.tenantId),
);

const subscriptionChangeType = computed(() => {
  if (drawerMode.value !== 'edit' || !currentRecord.value) {
    return 'create';
  }

  const currentLevel = packageLevelMap[currentRecord.value.packageCode];
  const nextLevel = packageLevelMap[subscriptionForm.packageCode];

  if (nextLevel > currentLevel) {
    return 'upgrade';
  }
  if (nextLevel < currentLevel) {
    return 'downgrade';
  }
  return 'same';
});

const effectiveDate = computed(() => {
  if (subscriptionChangeType.value === 'upgrade') {
    return dayjs();
  }
  if (subscriptionChangeType.value === 'downgrade') {
    return dayjs().add(1, 'month').startOf('month');
  }
  return subscriptionForm.subscribedAt;
});

const effectTag = computed(() => {
  if (subscriptionChangeType.value === 'upgrade') {
    return {
      color: 'success',
      icon: 'lucide:zap',
      text: '升级套餐，即刻生效',
    };
  }
  if (subscriptionChangeType.value === 'downgrade') {
    return {
      color: 'error',
      icon: 'lucide:calendar-clock',
      text: `降级套餐，${effectiveDate.value.format('YYYY-MM-DD')} 生效`,
    };
  }
  return {
    color: 'default',
    icon: 'lucide:calendar-check',
    text: drawerMode.value === 'edit' ? '套餐未变化' : '新增订阅按订阅日期生效',
  };
});

function getPackageMeta(code: PackageCode) {
  return packageOptions.find((item) => item.code === code) || packageOptions[0];
}

function resetForm() {
  subscriptionForm.tenantId = undefined;
  subscriptionForm.packageCode = 'std';
  subscriptionForm.points = getPackageMeta('std').points;
  subscriptionForm.subscribedAt = dayjs();
  subscriptionForm.endDate = dayjs().add(1, 'year');
  subscriptionForm.description = '';
}

function openCreateDrawer() {
  drawerMode.value = 'create';
  currentRecord.value = undefined;
  resetForm();
  drawerOpen.value = true;
}

function openViewDrawer(record: SubscriptionRecord) {
  drawerMode.value = 'view';
  currentRecord.value = record;
  drawerOpen.value = true;
}

function openEditDrawer(record: SubscriptionRecord) {
  drawerMode.value = 'edit';
  currentRecord.value = record;
  subscriptionForm.tenantId = record.tenantId;
  subscriptionForm.packageCode = record.packageCode;
  subscriptionForm.points = record.points;
  subscriptionForm.subscribedAt = dayjs(record.subscribedAt);
  subscriptionForm.endDate = dayjs(record.endDate);
  subscriptionForm.description = record.description;
  drawerOpen.value = true;
}

function saveSubscription() {
  const tenant = tenants.find((item) => item.id === subscriptionForm.tenantId);
  if (!tenant) {
    message.warning('请选择租户');
    return;
  }

  const packageMeta = getPackageMeta(subscriptionForm.packageCode);
  const subscribedAt =
    drawerMode.value === 'edit'
      ? effectiveDate.value.format('YYYY-MM-DD')
      : subscriptionForm.subscribedAt.format('YYYY-MM-DD');
  const payload = {
    tenantId: tenant.id,
    tenantName: tenant.name,
    tenantCode: tenant.code,
    packageCode: packageMeta.code,
    packageName: packageMeta.name,
    points: packageMeta.points,
    subscribedAt,
    endDate: subscriptionForm.endDate.format('YYYY-MM-DD'),
    description: subscriptionForm.description,
  };

  if (drawerMode.value === 'edit' && currentRecord.value) {
    Object.assign(currentRecord.value, payload, {
      status: dayjs(payload.endDate).isBefore(dayjs(), 'day')
        ? 'invalid'
        : 'valid',
    });
    message.success('订阅变更已保存');
  } else {
    subscriptions.value.unshift({
      id: `SUB${dayjs().format('YYYYMMDD')}${String(Date.now()).slice(-4)}`,
      status: 'valid',
      ...payload,
    });
    message.success('新增订阅已保存');
  }

  drawerOpen.value = false;
}

watch(
  () => subscriptionForm.packageCode,
  (code) => {
    subscriptionForm.points = getPackageMeta(code).points;
  },
);
</script>

<template>
  <div class="flex min-h-full flex-col gap-4 bg-slate-50 p-4 md:p-6">
    <div
      class="flex flex-col gap-4 border-b border-slate-200 bg-white p-5 md:flex-row md:items-center md:justify-between"
    >
      <div>
        <div class="flex items-center gap-2">
          <h1 class="m-0 text-xl font-semibold text-slate-900">租户订阅管理</h1>
          <Tag color="blue" class="m-0">New</Tag>
        </div>
        <p class="m-0 mt-1 text-sm text-slate-500">
          维护租户订阅单、套餐点数与有效期，支持新增和订阅变更。
        </p>
      </div>
      <div class="flex items-center gap-6">
        <div class="text-right">
          <div class="text-xs text-slate-500">有效订阅</div>
          <div class="text-xl font-semibold text-emerald-600">
            {{ activeCount }}
          </div>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-500">总订阅点数</div>
          <div class="text-xl font-semibold text-slate-900">
            {{ totalPoints.toLocaleString() }}
          </div>
        </div>
        <Button type="primary" @click="openCreateDrawer">
          <template #icon><Icon icon="lucide:plus" /></template>
          新增订阅
        </Button>
      </div>
    </div>

    <div class="bg-white p-4">
      <div class="grid grid-cols-1 gap-3 md:grid-cols-4">
        <Input
          v-model:value="filters.keyword"
          allow-clear
          placeholder="租户 / 编码 / 订阅单号"
        />
        <Select
          v-model:value="filters.tenantId"
          allow-clear
          placeholder="选择租户"
        >
          <Select.Option
            v-for="tenant in tenants"
            :key="tenant.id"
            :value="tenant.id"
          >
            {{ tenant.name }}
          </Select.Option>
        </Select>
        <Select
          v-model:value="filters.packageCode"
          allow-clear
          placeholder="选择套餐"
        >
          <Select.Option
            v-for="item in packageOptions"
            :key="item.code"
            :value="item.code"
          >
            {{ item.name }}
          </Select.Option>
        </Select>
        <Select
          v-model:value="filters.status"
          allow-clear
          placeholder="订阅状态"
        >
          <Select.Option value="valid">有效</Select.Option>
          <Select.Option value="invalid">无效</Select.Option>
        </Select>
      </div>
    </div>

    <div class="overflow-hidden bg-white">
      <Table
        :columns="columns"
        :data-source="filteredSubscriptions"
        :pagination="{ pageSize: 10, showSizeChanger: true }"
        row-key="id"
        size="middle"
        :scroll="{ x: 1180 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'tenant'">
            <div class="flex flex-col">
              <span class="font-medium text-slate-900">{{
                record.tenantName
              }}</span>
              <span class="font-mono text-xs text-slate-400">{{
                record.tenantCode
              }}</span>
            </div>
          </template>
          <template v-else-if="column.key === 'package'">
            <Tag
              :color="
                record.packageCode === 'ultra'
                  ? 'purple'
                  : record.packageCode === 'pro'
                    ? 'blue'
                    : 'default'
              "
            >
              {{ record.packageName }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'points'">
            <span class="font-mono font-semibold">{{
              record.points.toLocaleString()
            }}</span>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="record.status === 'valid' ? 'success' : 'default'">
              {{ record.status === 'valid' ? '有效' : '无效' }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Space>
              <Button type="link" size="small" @click="openViewDrawer(record)">
                查看
              </Button>
              <Button type="link" size="small" @click="openEditDrawer(record)">
                变更订阅
              </Button>
            </Space>
          </template>
        </template>
      </Table>
    </div>

    <Drawer
      v-model:open="drawerOpen"
      :title="
        drawerMode === 'view'
          ? '订阅详情'
          : drawerMode === 'edit'
            ? '变更订阅'
            : '新增订阅'
      "
      width="720"
      placement="right"
    >
      <Descriptions
        v-if="drawerMode === 'view' && currentRecord"
        bordered
        :column="1"
        size="small"
      >
        <Descriptions.Item label="租户">
          {{ currentRecord.tenantName }}
        </Descriptions.Item>
        <Descriptions.Item label="订阅单号">
          {{ currentRecord.id }}
        </Descriptions.Item>
        <Descriptions.Item label="套餐">
          {{ currentRecord.packageName }}
        </Descriptions.Item>
        <Descriptions.Item label="点数">
          {{ currentRecord.points.toLocaleString() }}
        </Descriptions.Item>
        <Descriptions.Item label="订阅日期">
          {{ currentRecord.subscribedAt }}
        </Descriptions.Item>
        <Descriptions.Item label="到期日期">
          {{ currentRecord.endDate }}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          {{ currentRecord.status === 'valid' ? '有效' : '无效' }}
        </Descriptions.Item>
        <Descriptions.Item label="订阅说明">
          {{ currentRecord.description }}
        </Descriptions.Item>
      </Descriptions>

      <div v-else class="-m-6 flex min-h-full flex-col bg-slate-50">
        <div class="border-b border-slate-200 bg-white px-6 py-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <div
                class="flex items-center gap-2 text-xs font-medium text-slate-500"
              >
                <Icon icon="lucide:receipt-text" class="size-4" />
                订阅配置
              </div>
              <h3 class="m-0 mt-2 text-xl font-semibold text-slate-950">
                {{
                  drawerMode === 'edit' ? '调整租户订阅权益' : '为租户开通订阅'
                }}
              </h3>
              <p class="m-0 mt-1 text-sm text-slate-500">
                选择租户与套餐后保存，系统会同步生成订阅记录。
              </p>
            </div>
            <div class="min-w-[160px] text-right">
              <div class="text-xs text-slate-500">本次点数</div>
              <div class="font-mono text-2xl font-semibold text-blue-600">
                {{ subscriptionForm.points.toLocaleString() }}
              </div>
            </div>
          </div>

          <div class="mt-5 grid grid-cols-3 gap-3">
            <div class="border border-slate-200 bg-slate-50 px-4 py-3">
              <div class="text-xs text-slate-500">租户</div>
              <div class="mt-1 truncate font-medium text-slate-900">
                {{ selectedTenant?.name || '未选择' }}
              </div>
            </div>
            <div class="border border-slate-200 bg-slate-50 px-4 py-3">
              <div class="text-xs text-slate-500">套餐</div>
              <div class="mt-1 font-medium text-slate-900">
                {{ selectedPackage.name }}
              </div>
            </div>
            <div class="border border-slate-200 bg-slate-50 px-4 py-3">
              <div class="text-xs text-slate-500">生效日期</div>
              <div class="mt-1 font-medium text-slate-900">
                {{ effectiveDate.format('YYYY-MM-DD') }}
              </div>
            </div>
          </div>
        </div>

        <Form layout="vertical" class="flex flex-col gap-5 p-6">
          <section class="bg-white p-5">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h4 class="m-0 text-base font-semibold text-slate-900">
                  选择租户
                </h4>
                <p class="m-0 mt-1 text-xs text-slate-500">
                  {{
                    drawerMode === 'edit'
                      ? '变更订阅时租户不可修改。'
                      : '订阅记录会归属到所选租户。'
                  }}
                </p>
              </div>
              <Tag v-if="selectedTenant" color="blue" class="m-0">
                {{ selectedTenant.code }}
              </Tag>
            </div>

            <Form.Item class="m-0" required>
              <Select
                v-model:value="subscriptionForm.tenantId"
                placeholder="选择租户"
                show-search
                size="large"
                :disabled="drawerMode === 'edit'"
                :filter-option="
                  (input, option) =>
                    String(option?.label || '')
                      .toLowerCase()
                      .includes(input.toLowerCase())
                "
              >
                <Select.Option
                  v-for="tenant in tenants"
                  :key="tenant.id"
                  :label="`${tenant.name} ${tenant.code}`"
                  :value="tenant.id"
                >
                  <div class="flex flex-col">
                    <span>{{ tenant.name }}</span>
                    <span class="font-mono text-xs text-slate-400">
                      {{ tenant.code }}
                    </span>
                  </div>
                </Select.Option>
              </Select>
            </Form.Item>
          </section>

          <section class="bg-white p-5">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <h4 class="m-0 text-base font-semibold text-slate-900">
                  选择套餐
                </h4>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <button
                v-for="item in packageOptions"
                :key="item.code"
                type="button"
                class="group border p-4 text-left transition-all hover:border-blue-300 hover:bg-blue-50/40"
                :class="
                  subscriptionForm.packageCode === item.code
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-slate-200 bg-white'
                "
                @click="subscriptionForm.packageCode = item.code"
              >
                <div class="flex items-center justify-between">
                  <span class="text-base font-semibold text-slate-950">
                    {{ item.name }}
                  </span>
                  <Icon
                    :icon="
                      subscriptionForm.packageCode === item.code
                        ? 'lucide:check-circle-2'
                        : 'lucide:circle'
                    "
                    class="size-4"
                    :class="
                      subscriptionForm.packageCode === item.code
                        ? 'text-blue-600'
                        : 'text-slate-300 group-hover:text-blue-400'
                    "
                  />
                </div>
                <div
                  class="mt-3 font-mono text-xl font-semibold text-slate-900"
                >
                  {{ item.points.toLocaleString() }}
                  <span class="text-xs font-normal text-slate-500">点</span>
                </div>
                <p class="m-0 mt-2 min-h-8 text-xs leading-4 text-slate-500">
                  {{ item.description }}
                </p>
              </button>
            </div>

            <div
              v-if="drawerMode === 'edit'"
              class="mt-4 flex items-start gap-2 border px-3 py-2 text-sm"
              :class="
                subscriptionChangeType === 'downgrade'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              "
            >
              <Icon :icon="effectTag.icon" class="mt-0.5 size-4" />
              <span>{{ effectTag.text }}</span>
            </div>
          </section>

          <section class="bg-white p-5">
            <div class="mb-4">
              <h4 class="m-0 text-base font-semibold text-slate-900">有效期</h4>
              <p class="m-0 mt-1 text-xs text-slate-500">
                {{
                  drawerMode === 'edit'
                    ? '变更订阅的生效日期由套餐升降级规则自动判断。'
                    : '订阅状态会根据到期日期自动判断有效或无效。'
                }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <Form.Item label="订阅日期" required>
                <DatePicker
                  v-model:value="subscriptionForm.subscribedAt"
                  class="w-full"
                  size="large"
                  :disabled="drawerMode === 'edit'"
                />
              </Form.Item>
              <Form.Item label="到期日期" required>
                <DatePicker
                  v-model:value="subscriptionForm.endDate"
                  class="w-full"
                  size="large"
                />
              </Form.Item>
            </div>
          </section>

          <section class="bg-white p-5">
            <div class="mb-4">
              <h4 class="m-0 text-base font-semibold text-slate-900">
                订阅说明
              </h4>
              <p class="m-0 mt-1 text-xs text-slate-500">
                用于记录商务来源、审批备注或变更原因。
              </p>
            </div>
            <Form.Item class="m-0">
              <Input.TextArea
                v-model:value="subscriptionForm.description"
                :rows="4"
                placeholder="填写订阅来源、商务备注或本次变更原因"
              />
            </Form.Item>
          </section>
        </Form>
      </div>

      <template #footer>
        <div class="flex justify-end gap-2">
          <Button @click="drawerOpen = false">
            {{ drawerMode === 'view' ? '关闭' : '取消' }}
          </Button>
          <Button
            v-if="drawerMode !== 'view'"
            type="primary"
            @click="saveSubscription"
          >
            保存
          </Button>
        </div>
      </template>
    </Drawer>
  </div>
</template>
