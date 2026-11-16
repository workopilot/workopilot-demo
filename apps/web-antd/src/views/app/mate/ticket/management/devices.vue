<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import type { TableColumnType } from 'ant-design-vue';

import type {
  DeviceStatus,
  TicketDevice,
  WarrantyStatus,
} from '#/types/ticket';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Descriptions,
  DescriptionsItem,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from 'ant-design-vue';

import { mockDevices } from '#/api/mock-data-ticket';

// 使用响应式数据维护本地状态，避免直接修改导入的 mock 数组污染全局状态
const devices = ref<TicketDevice[]>([...mockDevices]);
const keyword = ref('');

const filtered = computed(() => {
  if (!keyword.value) return devices.value;
  const kw = keyword.value.toLowerCase();
  return devices.value.filter(
    (item) =>
      item.name.toLowerCase().includes(kw) ||
      item.code.toLowerCase().includes(kw) ||
      item.customer.toLowerCase().includes(kw),
  );
});

const stats = computed(() => ({
  total: devices.value.length,
  normal: devices.value.filter((item) => item.status === 'normal').length,
  fault: devices.value.filter((item) => item.status === 'fault').length,
  maintenance: devices.value.filter((item) => item.status === 'maintenance')
    .length,
  offline: devices.value.filter((item) => item.status === 'offline').length,
}));

const statusLabel: Record<DeviceStatus, string> = {
  normal: '正常',
  fault: '故障',
  maintenance: '保养中',
  offline: '离线',
};

function statusColor(status: DeviceStatus) {
  switch (status) {
    case 'fault': {
      return 'red';
    }
    case 'maintenance': {
      return 'orange';
    }
    case 'normal': {
      return 'green';
    }
    default: {
      return 'default';
    }
  }
}

const warrantyLabel: Record<WarrantyStatus, string> = {
  'in-warranty': '在保',
  expiring: '即将到期',
  expired: '已过保',
};

function warrantyColor(status: WarrantyStatus) {
  switch (status) {
    case 'expiring': {
      return 'orange';
    }
    case 'in-warranty': {
      return 'green';
    }
    default: {
      return 'red';
    }
  }
}

// 表格列定义
interface TableRow {
  [key: string]: unknown;
}

const columns: TableColumnType<TableRow>[] = [
  { title: '产品', dataIndex: 'code', key: 'code', width: 180 },
  { title: '型号 / 类别', key: 'model', width: 160 },
  { title: '客户', dataIndex: 'customer', key: 'customer', width: 140 },
  { title: '位置', dataIndex: 'location', key: 'location', width: 180 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 90 },
  {
    title: '质保状态',
    dataIndex: 'warrantyStatus',
    key: 'warrantyStatus',
    width: 100,
  },
  {
    title: '安装日期',
    dataIndex: 'installDate',
    key: 'installDate',
    width: 110,
  },
  {
    title: '上次保养',
    dataIndex: 'lastMaintenance',
    key: 'lastMaintenance',
    width: 110,
  },
  { title: '操作', key: 'action', width: 140, fixed: 'right' },
];

// 勾选列
const selectedRowKeys = ref<string[]>([]);
const rowSelection = {
  onChange: (keys: string[]) => {
    selectedRowKeys.value = keys;
  },
  selections: true,
};

const hasSelected = computed(() => selectedRowKeys.value.length > 0);

// 批量删除
function batchDelete() {
  if (!hasSelected.value) return;
  devices.value = devices.value.filter(
    (d) => !selectedRowKeys.value.includes(d.id),
  );
  message.success(`已删除 ${selectedRowKeys.value.length} 台产品`);
  selectedRowKeys.value = [];
}

// 导入 / 导出（Demo 提示）
function handleImport() {
  message.info('导入功能：请选择 Excel 文件批量导入产品（Demo）');
}

function handleExport() {
  const count = hasSelected.value
    ? selectedRowKeys.value.length
    : devices.value.length;
  message.success(`已导出 ${count} 台产品数据（Demo）`);
}

// 新增产品弹窗
const modalOpen = ref(false);
const form = ref<Partial<TicketDevice>>({
  code: '',
  name: '',
  model: '',
  category: '打印产品',
  customer: '',
  location: '',
  status: 'normal',
  warrantyStatus: 'in-warranty',
  warrantyStartDate: '',
  warrantyEndDate: '',
  warrantyDescription: '',
  installDate: '',
  lastMaintenance: '',
});

function openAdd() {
  form.value = {
    code: `EQ-${1000 + devices.value.length + 1}`,
    name: '',
    model: '',
    category: '打印产品',
    customer: '',
    location: '',
    status: 'normal',
    warrantyStatus: 'in-warranty',
    warrantyStartDate: '',
    warrantyEndDate: '',
    warrantyDescription: '',
    installDate: new Date().toISOString().slice(0, 10),
    lastMaintenance: new Date().toISOString().slice(0, 10),
  };
  modalOpen.value = true;
}

function save() {
  if (!form.value.name || !form.value.customer) {
    message.warning('请填写产品名称和所属客户');
    return;
  }
  const created: TicketDevice = {
    id: `d-${Date.now()}`,
    code: form.value.code || `EQ-${Date.now()}`,
    name: form.value.name!,
    model: form.value.model || '-',
    category: form.value.category || '打印产品',
    customer: form.value.customer!,
    location: form.value.location || '-',
    status: (form.value.status as DeviceStatus) || 'normal',
    warrantyStatus:
      (form.value.warrantyStatus as WarrantyStatus) || 'in-warranty',
    warrantyStartDate: form.value.warrantyStartDate || '-',
    warrantyEndDate: form.value.warrantyEndDate || '-',
    warrantyDescription: form.value.warrantyDescription || '',
    installDate: form.value.installDate || '-',
    lastMaintenance: form.value.lastMaintenance || '-',
  };
  devices.value.unshift(created);
  message.success('产品已添加');
  modalOpen.value = false;
}

// 产品详情弹窗
const detailOpen = ref(false);
const detailDevice = ref<null | TicketDevice>(null);

function openDetail(record: TicketDevice) {
  detailDevice.value = record;
  detailOpen.value = true;
}

const pagination = { pageSize: 8, showSizeChanger: false };
</script>

<template>
  <section class="ticket-page">
    <header class="ticket-page__header">
      <div class="ticket-page__heading">
        <span class="ticket-page__icon"><Icon icon="lucide:server" /></span>
        <div>
          <span class="ticket-page__eyebrow">DEVICE MANAGEMENT</span>
          <h1>资产管理</h1>
          <p>维护资产台账、状态与所属客户，作为工单与派单的基础数据。</p>
        </div>
      </div>
    </header>

    <section class="ticket-stats">
      <div class="ticket-stat">
        <span class="ticket-stat__num">{{ stats.total }}</span>
        <span class="ticket-stat__label">产品总数</span>
      </div>
      <div class="ticket-stat">
        <span class="ticket-stat__num">{{ stats.normal }}</span>
        <span class="ticket-stat__label">正常</span>
      </div>
      <div class="ticket-stat">
        <span class="ticket-stat__num is-warn">{{ stats.fault }}</span>
        <span class="ticket-stat__label">故障</span>
      </div>
      <div class="ticket-stat">
        <span class="ticket-stat__num">{{ stats.maintenance }}</span>
        <span class="ticket-stat__label">保养中</span>
      </div>
      <div class="ticket-stat">
        <span class="ticket-stat__num">{{ stats.offline }}</span>
        <span class="ticket-stat__label">离线</span>
      </div>
    </section>

    <div class="ticket-toolbar">
      <Input
        v-model:value="keyword"
        allow-clear
        placeholder="搜索编号 / 名称 / 客户"
        class="ticket-toolbar__search"
      >
        <template #prefix><Icon icon="lucide:search" /></template>
      </Input>
      <Space class="ticket-toolbar__actions">
        <Button type="primary" @click="openAdd">
          <Icon icon="lucide:plus" />
          新增产品
        </Button>
        <Popconfirm
          v-if="hasSelected"
          title="确定批量删除选中的产品吗？"
          ok-text="确定"
          cancel-text="取消"
          @confirm="batchDelete"
        >
          <Button danger>
            <Icon icon="lucide:trash-2" />
            批量删除
          </Button>
        </Popconfirm>
        <Button v-else disabled>
          <Icon icon="lucide:trash-2" />
          批量删除
        </Button>
        <Button @click="handleImport">
          <Icon icon="lucide:upload" />
          导入
        </Button>
        <Button @click="handleExport">
          <Icon icon="lucide:download" />
          导出
        </Button>
      </Space>
    </div>

    <div class="ticket-table-card">
      <Table
        :columns="columns"
        :data-source="filtered"
        :row-selection="rowSelection"
        :pagination="pagination"
        row-key="id"
        size="middle"
        :scroll="{ x: 1200 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'code'">
            <div class="cell-device">
              <strong>{{ record.code }}</strong>
              <small>{{ record.name }}</small>
            </div>
          </template>
          <template v-else-if="column.key === 'model'">
            <div class="cell-model">
              <b>{{ record.model }}</b>
              <small>{{ record.category }}</small>
            </div>
          </template>
          <template v-else-if="column.key === 'status'">
            <Tag :color="statusColor(record.status as DeviceStatus)">
              {{ statusLabel[record.status as DeviceStatus] }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'warrantyStatus'">
            <Tag
              :color="warrantyColor(record.warrantyStatus as WarrantyStatus)"
            >
              {{ warrantyLabel[record.warrantyStatus as WarrantyStatus] }}
            </Tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <Button
              type="link"
              size="small"
              @click="openDetail(record as TicketDevice)"
            >
              <Icon icon="lucide:eye" class="mr-0.5 size-3" />
              详情
            </Button>
          </template>
        </template>
      </Table>
    </div>

    <!-- 新增产品弹窗 -->
    <Modal
      v-model:open="modalOpen"
      title="新增产品"
      :width="720"
      ok-text="保存"
      cancel-text="取消"
      @ok="save"
    >
      <Form layout="vertical" class="device-form">
        <div class="device-form__row">
          <Form.Item label="产品编号">
            <Input v-model:value="form.code" />
          </Form.Item>
          <Form.Item label="产品名称 *">
            <Input v-model:value="form.name" />
          </Form.Item>
        </div>
        <div class="device-form__row">
          <Form.Item label="型号">
            <Input v-model:value="form.model" />
          </Form.Item>
          <Form.Item label="类别">
            <Select v-model:value="form.category">
              <Select.Option value="打印产品">打印产品</Select.Option>
              <Select.Option value="包装产品">包装产品</Select.Option>
              <Select.Option value="标识产品">标识产品</Select.Option>
              <Select.Option value="检测产品">检测产品</Select.Option>
            </Select>
          </Form.Item>
        </div>
        <div class="device-form__row">
          <Form.Item label="所属客户 *">
            <Input v-model:value="form.customer" />
          </Form.Item>
          <Form.Item label="安装位置">
            <Input v-model:value="form.location" />
          </Form.Item>
        </div>
        <div class="device-form__row">
          <Form.Item label="状态">
            <Select v-model:value="form.status">
              <Select.Option value="normal">正常</Select.Option>
              <Select.Option value="fault">故障</Select.Option>
              <Select.Option value="maintenance">保养中</Select.Option>
              <Select.Option value="offline">离线</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="安装日期">
            <Input v-model:value="form.installDate" placeholder="YYYY-MM-DD" />
          </Form.Item>
        </div>
        <div class="device-form__row">
          <Form.Item label="质保状态">
            <Select v-model:value="form.warrantyStatus">
              <Select.Option value="in-warranty">在保</Select.Option>
              <Select.Option value="expiring">即将到期</Select.Option>
              <Select.Option value="expired">已过保</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="上次保养">
            <Input
              v-model:value="form.lastMaintenance"
              placeholder="YYYY-MM-DD"
            />
          </Form.Item>
        </div>
        <div class="device-form__row">
          <Form.Item label="质保起始日期">
            <Input
              v-model:value="form.warrantyStartDate"
              placeholder="YYYY-MM-DD"
            />
          </Form.Item>
          <Form.Item label="质保结束日期">
            <Input
              v-model:value="form.warrantyEndDate"
              placeholder="YYYY-MM-DD"
            />
          </Form.Item>
        </div>
        <Form.Item label="质保说明">
          <Input.TextArea
            v-model:value="form.warrantyDescription"
            :rows="2"
            placeholder="如：原厂一年质保，含上门维修与备件更换"
          />
        </Form.Item>
      </Form>
    </Modal>

    <!-- 产品详情弹窗 -->
    <Modal
      v-model:open="detailOpen"
      :footer="null"
      :width="720"
      title="产品详情"
    >
      <template v-if="detailDevice">
        <div class="detail-header">
          <Tag :color="statusColor(detailDevice.status)">
            {{ statusLabel[detailDevice.status] }}
          </Tag>
          <Tag :color="warrantyColor(detailDevice.warrantyStatus)">
            {{ warrantyLabel[detailDevice.warrantyStatus] }}
          </Tag>
          <span class="detail-code">{{ detailDevice.code }}</span>
        </div>

        <Descriptions :column="2" bordered size="small" class="detail-desc">
          <DescriptionsItem label="产品名称">
            {{ detailDevice.name }}
          </DescriptionsItem>
          <DescriptionsItem label="型号">
            {{ detailDevice.model }}
          </DescriptionsItem>
          <DescriptionsItem label="类别">
            {{ detailDevice.category }}
          </DescriptionsItem>
          <DescriptionsItem label="所属客户">
            {{ detailDevice.customer }}
          </DescriptionsItem>
          <DescriptionsItem label="客户等级">
            {{ detailDevice.customerLevel }}
          </DescriptionsItem>
          <DescriptionsItem label="安装位置">
            {{ detailDevice.location }}
          </DescriptionsItem>
          <DescriptionsItem label="安装日期">
            {{ detailDevice.installDate }}
          </DescriptionsItem>
          <DescriptionsItem label="上次保养">
            {{ detailDevice.lastMaintenance }}
          </DescriptionsItem>
          <DescriptionsItem label="质保起始日期">
            {{ detailDevice.warrantyStartDate || '—' }}
          </DescriptionsItem>
          <DescriptionsItem label="质保结束日期">
            {{
              detailDevice.warrantyEndDate || detailDevice.warrantyExpiry || '—'
            }}
          </DescriptionsItem>
          <DescriptionsItem label="质保说明" :span="2">
            {{ detailDevice.warrantyDescription || '—' }}
          </DescriptionsItem>
        </Descriptions>
      </template>
    </Modal>
  </section>
</template>

<style scoped>
.ticket-page {
  height: 100%;
  min-height: 0;
  padding: 24px;
  overflow: auto;
}

.ticket-page__header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 26px;
  margin-bottom: 18px;
  color: #fff;
  background: linear-gradient(125deg, #073a33 0%, #0b6e65 66%, #178f7b 100%);
  border-radius: 18px;
  box-shadow: 0 15px 36px rgb(7 71 60 / 18%);
}

.ticket-page__heading {
  display: flex;
  gap: 14px;
  align-items: center;
}

.ticket-page__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  font-size: 24px;
  color: #c9fff2;
  background: rgb(124 238 208 / 18%);
  border-radius: 14px;
}

.ticket-page__eyebrow {
  font-size: 10px;
  font-weight: 800;
  color: #74c8b5;
  letter-spacing: 0.14em;
}

.ticket-page__header h1 {
  margin: 6px 0 4px;
  font-size: 22px;
  font-weight: 800;
}

.ticket-page__header p {
  margin: 0;
  font-size: 12px;
  color: rgb(255 255 255 / 72%);
}

.ticket-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.ticket-stat {
  display: grid;
  gap: 4px;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #dce9e4;
  border-radius: 14px;
}

.ticket-stat__num {
  font-size: 26px;
  font-weight: 800;
  color: #0c4a3f;
}

.ticket-stat__num.is-warn {
  color: #d4541f;
}

.ticket-stat__label {
  font-size: 11px;
  color: #729088;
}

.ticket-toolbar {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.ticket-toolbar__search {
  width: 280px;
}

.ticket-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ticket-table-card {
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 16px;
}

.cell-device strong {
  display: block;
  font-size: 12px;
  color: #0c4a3f;
}

.cell-device small {
  display: block;
  margin-top: 3px;
  font-size: 11px;
  color: #6c8780;
}

.cell-model b {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #24483e;
}

.cell-model small {
  display: block;
  margin-top: 3px;
  font-size: 10px;
  color: #81958e;
}

:deep(.device-form__row) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}

:deep(.detail-header) {
  display: flex;
  gap: 8px;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 16px;
  border-bottom: 1px solid #eef5f2;
}

:deep(.detail-code) {
  margin-left: auto;
  font-family: SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 14px;
  font-weight: 700;
  color: #0b6e65;
}

:deep(.ant-table-thead > tr > th) {
  font-size: 12px;
  font-weight: 600;
  color: #315e55;
  background: #f6fbf9;
  border-bottom: 1px solid #e4edea;
}

:deep(.ant-table-tbody > tr > td) {
  font-size: 12px;
  color: #536b65;
  border-bottom: 1px solid #eef5f2;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fdfa;
}

:deep(.ant-tag) {
  margin: 0;
}

@media (max-width: 1100px) {
  .ticket-stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .ticket-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .ticket-toolbar__search {
    width: 100%;
  }

  :deep(.device-form__row) {
    grid-template-columns: 1fr;
  }
}
</style>
