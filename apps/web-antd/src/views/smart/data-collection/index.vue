<script setup lang="ts">
import type {
  CollectionTask,
  DataPoolRecord,
} from '#/api/mock-data-data-collection';

import { computed, onMounted, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Input,
  Row,
  Select,
  Statistic,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  getCollectionTasksApi,
  getDataPoolRecordsApi,
} from '#/api/data-collection';

const activeTab = ref('pool');
const loading = ref(false);

const tasks = ref<CollectionTask[]>([]);
const records = ref<DataPoolRecord[]>([]);

// Data Pool State
const poolSearchText = ref('');
const poolSourceFilter = ref<string | undefined>(undefined);
const detailDrawerVisible = ref(false);
const selectedRecord = ref<DataPoolRecord | null>(null);

// Tasks State
const taskSearchText = ref('');

onMounted(async () => {
  loading.value = true;
  try {
    const [tasksRes, recordsRes] = await Promise.all([
      getCollectionTasksApi(),
      getDataPoolRecordsApi(),
    ]);
    tasks.value = tasksRes.data;
    records.value = recordsRes.data;
  } finally {
    loading.value = false;
  }
});

const filteredRecords = computed(() => {
  return records.value.filter((r) => {
    const matchText =
      !poolSearchText.value ||
      r.taskName.includes(poolSearchText.value) ||
      r.basicInfo.billNo?.includes(poolSearchText.value) ||
      r.basicInfo.name?.includes(poolSearchText.value);
    const matchSource =
      !poolSourceFilter.value || r.sourceType === poolSourceFilter.value;
    return matchText && matchSource;
  });
});

const poolColumns = [
  { title: '数据来源', dataIndex: 'taskName', key: 'taskName', width: 200 },
  { title: '采集方式', dataIndex: 'sourceType', key: 'sourceType', width: 150 },
  { title: '数据类型', dataIndex: 'dataType', key: 'dataType', width: 120 },
  { title: '基础信息', key: 'basicInfo', width: 250 },
  { title: '扩展数据 (JSON)', key: 'extendedData', ellipsis: true },
  {
    title: '采集时间',
    dataIndex: 'collectedAt',
    key: 'collectedAt',
    width: 180,
  },
  { title: '操作', key: 'action', width: 100, align: 'center' },
];

const taskColumns = [
  { title: '任务名称', dataIndex: 'name', key: 'name' },
  { title: '采集方式', dataIndex: 'sourceType', key: 'sourceType' },
  { title: '数据类型', dataIndex: 'dataType', key: 'dataType' },
  { title: '状态', dataIndex: 'status', key: 'status' },
  { title: '采集数量', dataIndex: 'recordCount', key: 'recordCount' },
  { title: '最后运行', dataIndex: 'lastRunTime', key: 'lastRunTime' },
  { title: '操作', key: 'action', width: 150, align: 'center' },
];

function getSourceTypeTag(type: string) {
  const map: Record<string, { color: string; text: string }> = {
    API: { color: 'blue', text: 'API接口' },
    PUBLIC_RPA: { color: 'cyan', text: '公网RPA' },
    THIRD_PARTY_RPA: { color: 'purple', text: '第三方RPA' },
  };
  return map[type] || { color: 'default', text: type };
}

function getDataTypeTag(type: string) {
  const map: Record<string, { color: string; text: string }> = {
    DOCUMENT: { color: 'orange', text: '业务单据' },
    MASTER_DATA: { color: 'green', text: '主数据' },
  };
  return map[type] || { color: 'default', text: type };
}

function viewRecordDetail(record: DataPoolRecord) {
  selectedRecord.value = record;
  detailDrawerVisible.value = true;
}

// 格式化JSON代码
function formatJson(data: any) {
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}
</script>

<template>
  <div class="flex h-full min-h-screen flex-col bg-slate-50 p-6">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-900">智能采集与数据池</h1>
      <p class="mt-1 text-sm text-slate-500">
        通过接口、公网RPA及第三方系统RPA等方式自动化采集异构数据，并统一归集为标准JSON结构，为AI处理提供统一数据源。
      </p>
    </div>

    <!-- Statistics -->
    <Row :gutter="16" class="mb-6">
      <Col :span="6">
        <Card
          :bordered="false"
          class="rounded-xl shadow-sm transition-shadow hover:shadow-md"
        >
          <Statistic
            title="数据池总量"
            :value="10230"
            class="[&_.ant-statistic-content]:font-bold [&_.ant-statistic-content]:text-blue-600 [&_.ant-statistic-title]:text-slate-500"
          >
            <template #prefix>
              <Icon icon="lucide:database" class="mr-2 opacity-80" />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card
          :bordered="false"
          class="rounded-xl shadow-sm transition-shadow hover:shadow-md"
        >
          <Statistic
            title="运行中任务"
            :value="tasks.filter((t) => t.status === 'running').length"
            class="[&_.ant-statistic-content]:font-bold [&_.ant-statistic-content]:text-emerald-600 [&_.ant-statistic-title]:text-slate-500"
          >
            <template #prefix>
              <Icon icon="lucide:activity" class="mr-2 opacity-80" />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card
          :bordered="false"
          class="rounded-xl shadow-sm transition-shadow hover:shadow-md"
        >
          <Statistic
            title="RPA节点在线"
            :value="5"
            class="[&_.ant-statistic-content]:font-bold [&_.ant-statistic-content]:text-purple-600 [&_.ant-statistic-title]:text-slate-500"
          >
            <template #prefix>
              <Icon icon="lucide:bot" class="mr-2 opacity-80" />
            </template>
          </Statistic>
        </Card>
      </Col>
      <Col :span="6">
        <Card
          :bordered="false"
          class="rounded-xl shadow-sm transition-shadow hover:shadow-md"
        >
          <Statistic
            title="今日新增"
            :value="342"
            class="[&_.ant-statistic-content]:font-bold [&_.ant-statistic-content]:text-orange-600 [&_.ant-statistic-title]:text-slate-500"
          >
            <template #prefix>
              <Icon icon="lucide:trending-up" class="mr-2 opacity-80" />
            </template>
          </Statistic>
        </Card>
      </Col>
    </Row>

    <!-- Main Content -->
    <Card
      :bordered="false"
      class="flex-1 rounded-xl shadow-sm [&_.ant-card-body]:p-0"
    >
      <Tabs
        v-model:active-key="activeTab"
        class="px-6 pt-4 [&_.ant-tabs-nav]:mb-0"
      >
        <!-- Tab 1: Data Pool -->
        <Tabs.TabPane key="pool" tab="万能数据池">
          <div class="p-6">
            <!-- Toolbar -->
            <div class="mb-4 flex items-center justify-between">
              <div class="flex gap-4">
                <Input.Search
                  v-model:value="poolSearchText"
                  placeholder="搜索单号/名称/来源"
                  class="w-64"
                  allow-clear
                />
                <Select
                  v-model:value="poolSourceFilter"
                  placeholder="采集方式"
                  class="w-40"
                  allow-clear
                >
                  <Select.Option value="API">API接口</Select.Option>
                  <Select.Option value="PUBLIC_RPA">公网RPA</Select.Option>
                  <Select.Option value="THIRD_PARTY_RPA">
                    第三方RPA
                  </Select.Option>
                </Select>
              </div>
              <Button type="primary" class="flex items-center gap-2">
                <Icon icon="lucide:download" /> 导出数据
              </Button>
            </div>

            <!-- Table -->
            <Table
              :columns="poolColumns"
              :data-source="filteredRecords"
              :loading="loading"
              :pagination="{ pageSize: 10 }"
              size="middle"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'taskName'">
                  <div class="font-medium text-slate-800">
                    {{ record.taskName }}
                  </div>
                  <div class="mt-0.5 font-mono text-xs text-slate-400">
                    {{ record.id }}
                  </div>
                </template>

                <template v-else-if="column.key === 'sourceType'">
                  <Tag :color="getSourceTypeTag(record.sourceType).color">
                    {{ getSourceTypeTag(record.sourceType).text }}
                  </Tag>
                </template>

                <template v-else-if="column.key === 'dataType'">
                  <Tag
                    :color="getDataTypeTag(record.dataType).color"
                    variant="borderless"
                  >
                    {{ getDataTypeTag(record.dataType).text }}
                  </Tag>
                </template>

                <template v-else-if="column.key === 'basicInfo'">
                  <div class="text-sm">
                    <template v-if="record.dataType === 'DOCUMENT'">
                      <div class="text-slate-700">
                        <span class="text-slate-400">单号:</span>
                        {{ record.basicInfo.billNo }}
                      </div>
                      <div class="mt-1 text-slate-700">
                        <span class="text-slate-400">日期:</span>
                        {{ record.basicInfo.billDate }}
                      </div>
                    </template>
                    <template v-else>
                      <div class="font-medium text-slate-700">
                        {{ record.basicInfo.name }}
                      </div>
                      <div class="mt-1 text-xs text-slate-500">
                        {{ record.basicInfo.code }}
                      </div>
                    </template>
                  </div>
                </template>

                <template v-else-if="column.key === 'extendedData'">
                  <div
                    class="cursor-pointer truncate rounded border border-slate-100 bg-slate-50 p-2 font-mono text-xs text-slate-500 hover:bg-slate-100"
                    @click="viewRecordDetail(record)"
                  >
                    {{ JSON.stringify(record.extendedData) }}
                  </div>
                </template>

                <template v-else-if="column.key === 'action'">
                  <Button
                    type="link"
                    size="small"
                    @click="viewRecordDetail(record)"
                  >
                    查看详情
                  </Button>
                </template>
              </template>
            </Table>
          </div>
        </Tabs.TabPane>

        <!-- Tab 2: Collection Tasks -->
        <Tabs.TabPane key="tasks" tab="采集任务">
          <div class="p-6">
            <!-- Toolbar -->
            <div class="mb-4 flex items-center justify-between">
              <Input.Search
                v-model:value="taskSearchText"
                placeholder="搜索任务"
                class="w-64"
                allow-clear
              />
              <Button type="primary" class="flex items-center gap-2">
                <Icon icon="lucide:plus" /> 新建任务
              </Button>
            </div>

            <!-- Table -->
            <Table
              :columns="taskColumns"
              :data-source="tasks"
              :loading="loading"
              :pagination="false"
              size="middle"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'sourceType'">
                  <Tag :color="getSourceTypeTag(record.sourceType).color">
                    {{ getSourceTypeTag(record.sourceType).text }}
                  </Tag>
                </template>
                <template v-else-if="column.key === 'dataType'">
                  <Tag
                    :color="getDataTypeTag(record.dataType).color"
                    variant="borderless"
                  >
                    {{ getDataTypeTag(record.dataType).text }}
                  </Tag>
                </template>
                <template v-else-if="column.key === 'status'">
                  <Badge
                    :status="
                      record.status === 'running'
                        ? 'processing'
                        : record.status === 'stopped'
                          ? 'default'
                          : 'error'
                    "
                    :text="
                      record.status === 'running'
                        ? '运行中'
                        : record.status === 'stopped'
                          ? '已停止'
                          : '异常'
                    "
                  />
                </template>
                <template v-else-if="column.key === 'action'">
                  <div class="flex justify-center gap-2">
                    <Button type="link" size="small">编辑</Button>
                    <Button type="link" size="small" danger>删除</Button>
                  </div>
                </template>
              </template>
            </Table>
          </div>
        </Tabs.TabPane>

        <!-- Tab 3: Open API -->
        <Tabs.TabPane key="api" tab="开放接口">
          <div class="p-6">
            <div class="rounded-xl border border-slate-200 bg-white">
              <div class="border-b border-slate-100 p-6">
                <h2 class="text-xl font-bold text-slate-800">
                  数据池开放接口 (Open API)
                </h2>
                <p class="mt-2 text-slate-500">
                  允许外部系统以统一格式将数据推送至万能数据池，或者查询池中数据。
                </p>
              </div>

              <div class="p-6">
                <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
                  <!-- prettier-ignore -->
                  <span class="rounded bg-blue-100 px-2 py-1 text-xs font-bold text-blue-700">POST</span>
                  /api/v1/data-pool/push
                </h3>
                <p class="mb-4 text-slate-600">
                  推送异构数据到数据池中，支持自动解析和动态扩展字段。
                </p>

                <h4 class="mb-2 mt-6 font-medium text-slate-800">
                  请求体参数 (JSON)
                </h4>
                <div
                  class="overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-sm text-green-400"
                >
                  <pre>{
  "sourceType": "API",            <span class="text-slate-500">// 来源类型 (API | PUBLIC_RPA | THIRD_PARTY_RPA)</span>
  "dataType": "DOCUMENT",         <span class="text-slate-500">// 数据类型 (DOCUMENT | MASTER_DATA)</span>
  "taskId": "T003",               <span class="text-slate-500">// 关联的任务ID (选填)</span>
  "basicInfo": {                  <span class="text-slate-500">// 基础统一字段</span>
    "billNo": "SYS-2023001",      <span class="text-slate-500">// 单据号 (当dataType为DOCUMENT时必填)</span>
    "billDate": "2026-07-07",
    "name": "",                   <span class="text-slate-500">// 名称 (当dataType为MASTER_DATA时必填)</span>
    "code": ""
  },
  "extendedData": {               <span class="text-slate-500">// 扩展字段 (任意复杂的JSON结构)</span>
    "amount": 1000,
    "details": [...]
  }
}</pre>
                </div>

                <h4 class="mb-2 mt-6 font-medium text-slate-800">响应示例</h4>
                <div
                  class="rounded-lg bg-slate-900 p-4 font-mono text-sm text-blue-300"
                >
                  <!-- prettier-ignore -->
                  <pre>
{
  "code": 0,
  "message": "success",
  "data": {
    "recordId": "D004",
    "status": "stored"
  }
}</pre>
                </div>
              </div>
            </div>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Card>

    <!-- Detail Drawer -->
    <Drawer
      v-model:open="detailDrawerVisible"
      title="数据详情"
      placement="right"
      width="600"
    >
      <div v-if="selectedRecord" class="flex flex-col gap-6">
        <Descriptions title="基础信息" bordered :column="1" size="small">
          <Descriptions.Item label="数据来源">
            {{ selectedRecord.taskName }}
          </Descriptions.Item>
          <Descriptions.Item label="采集方式">
            <Tag :color="getSourceTypeTag(selectedRecord.sourceType).color">
              {{ getSourceTypeTag(selectedRecord.sourceType).text }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="数据类型">
            <Tag
              :color="getDataTypeTag(selectedRecord.dataType).color"
              variant="borderless"
            >
              {{ getDataTypeTag(selectedRecord.dataType).text }}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="采集时间">
            {{ selectedRecord.collectedAt }}
          </Descriptions.Item>

          <template v-if="selectedRecord.dataType === 'DOCUMENT'">
            <Descriptions.Item label="单据号">
              {{ selectedRecord.basicInfo.billNo }}
            </Descriptions.Item>
            <Descriptions.Item label="单据日期">
              {{ selectedRecord.basicInfo.billDate }}
            </Descriptions.Item>
          </template>
          <template v-else>
            <Descriptions.Item label="名称">
              {{ selectedRecord.basicInfo.name }}
            </Descriptions.Item>
            <Descriptions.Item label="编码">
              {{ selectedRecord.basicInfo.code }}
            </Descriptions.Item>
            <Descriptions.Item label="备注">
              {{ selectedRecord.basicInfo.remark || '-' }}
            </Descriptions.Item>
          </template>
        </Descriptions>

        <div>
          <h3 class="mb-3 flex items-center gap-2 font-semibold text-slate-800">
            <Icon icon="lucide:code" class="text-blue-500" />
            扩展数据 (JSON)
          </h3>
          <div class="overflow-x-auto rounded-lg bg-slate-900 p-4 shadow-inner">
            <pre class="m-0 font-mono text-sm text-emerald-400">{{
              formatJson(selectedRecord.extendedData)
            }}</pre>
          </div>
        </div>
      </div>
    </Drawer>
  </div>
</template>

<style scoped>
:deep(.ant-tabs-nav::before) {
  border-bottom-color: #f1f5f9;
}

:deep(.ant-tabs-tab) {
  padding: 12px 24px;
  font-size: 15px;
}

:deep(.ant-tabs-tab-active) {
  font-weight: 600;
}
</style>
