<script setup lang="ts">
import { reactive, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Card,
  DatePicker,
  Input,
  message,
  Modal,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
} from 'ant-design-vue';

const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const helpModalVisible = ref(false);

const searchForm = reactive({
  timeRange: [],
  employeeId: '',
  employeeName: '',
  taskType: '',
  status: '',
});

const taskTypeOptions = [
  { label: 'PPT制作', value: 'ppt' },
  { label: '报价分析', value: 'quote' },
  { label: '销售跟进', value: 'sales' },
];

const statusOptions = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
];

const mockData = [
  {
    id: '1',
    callTime: '2026-04-20 14:32:18',
    taskType: 'ppt',
    taskTypeText: 'PPT制作',
    deliverable: '2026数字化转型方案调研.pptx',
    employeeName: 'PPT助理',
    tokenConsume: '2,450',
    status: 'success',
    operator: '张明',
  },
  {
    id: '2',
    callTime: '2026-04-20 13:18:05',
    taskType: 'ppt',
    taskTypeText: 'PPT制作',
    deliverable: 'Q2季度业务汇报.pptx',
    employeeName: 'PPT助理',
    tokenConsume: '5,120',
    status: 'success',
    operator: '张明',
  },
  {
    id: '3',
    callTime: '2026-04-20 11:45:33',
    taskType: 'quote',
    taskTypeText: '报价分析',
    deliverable: '华东区域智慧城市项目报价单.xlsx',
    employeeName: '报价助理',
    tokenConsume: '8,200',
    status: 'success',
    operator: '张明',
  },
  {
    id: '4',
    callTime: '2026-04-20 10:22:41',
    taskType: 'sales',
    taskTypeText: '销售跟进',
    deliverable: '客户跟进记录_深圳科技.docx',
    employeeName: '销售助理',
    tokenConsume: '1,800',
    status: 'success',
    operator: '张明',
  },
  {
    id: '5',
    callTime: '2026-04-20 09:15:12',
    taskType: 'ppt',
    taskTypeText: 'PPT制作',
    deliverable: '生成失败，无成果物',
    employeeName: 'PPT助理',
    tokenConsume: '3,680',
    status: 'failed',
    operator: '张明',
  },
  {
    id: '6',
    callTime: '2026-04-19 17:48:29',
    taskType: 'ppt',
    taskTypeText: 'PPT制作',
    deliverable: '新产品发布会策划方案.pptx',
    employeeName: 'PPT助理',
    tokenConsume: '4,320',
    status: 'success',
    operator: '张明',
  },
  {
    id: '7',
    callTime: '2026-04-19 15:30:55',
    taskType: 'quote',
    taskTypeText: '报价分析',
    deliverable: '数据中台建设服务报价单.xlsx',
    employeeName: '报价助理',
    tokenConsume: '7,600',
    status: 'success',
    operator: '张明',
  },
  {
    id: '8',
    callTime: '2026-04-19 14:12:08',
    taskType: 'ppt',
    taskTypeText: 'PPT制作',
    deliverable: '年度市场竞品分析报告.pptx',
    employeeName: 'PPT助理',
    tokenConsume: '1,920',
    status: 'success',
    operator: '张明',
  },
];

const loadData = () => {
  loading.value = true;
  setTimeout(() => {
    tableData.value = mockData;
    total.value = mockData.length;
    loading.value = false;
  }, 500);
};

const handleSearch = () => {
  currentPage.value = 1;
  loadData();
};

const handleReset = () => {
  Object.assign(searchForm, {
    timeRange: [],
    employeeId: '',
    employeeName: '',
    taskType: '',
    status: '',
  });
  currentPage.value = 1;
  loadData();
};

const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadData();
};

const handleExport = () => {
  message.success('导出功能开发中');
};

const showHelpModal = () => {
  helpModalVisible.value = true;
};

loadData();
</script>

<template>
  <div
    class="relative flex min-h-[calc(100vh-100px)] flex-col gap-6 bg-slate-50/50 p-6"
  >
    <div class="fixed right-8 top-24 z-50">
      <Tooltip title="查看设计逻辑" placement="bottom">
        <Button
          type="primary"
          style="background-color: #f59e0b; border-color: #f59e0b"
          class="flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:shadow-xl"
          @click="showHelpModal"
        >
          <Icon icon="lucide:help-circle" class="size-7" />
        </Button>
      </Tooltip>
    </div>

    <Modal
      v-model:open="helpModalVisible"
      title="使用明细接口文档"
      width="800px"
    >
      <Card class="min-h-[500px]">
        <Spin :spinning="false">
          <div class="min-h-[500px]">
            <h1 class="mb-4 text-2xl font-bold">使用明细页面</h1>
            <p class="mb-4 text-muted-foreground">
              本页面展示数字员工的使用明细记录。
            </p>
            <h2 class="mb-3 mt-6 text-xl font-semibold">页面结构</h2>
            <ul class="list-disc space-y-2 pl-5 text-muted-foreground">
              <li>
                <strong>查询条件区</strong>: 支持按时间、任务类型、状态等筛选
              </li>
              <li><strong>数据表格区</strong>: 展示详细的使用记录</li>
              <li><strong>分页区</strong>: 提供分页功能</li>
            </ul>
          </div>
        </Spin>
      </Card>
    </Modal>

    <Card title="查询条件" class="shadow-sm">
      <div class="flex flex-wrap gap-4">
        <DatePicker.RangePicker
          v-model:value="searchForm.timeRange"
          class="w-72"
        />
        <Input
          v-model:value="searchForm.employeeId"
          placeholder="数字员工ID"
          class="w-40"
        />
        <Input
          v-model:value="searchForm.employeeName"
          placeholder="数字员工名称"
          class="w-40"
        />
        <Select
          v-model:value="searchForm.taskType"
          placeholder="任务类型"
          class="w-36"
          allow-clear
        >
          <Select.Option
            v-for="opt in taskTypeOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </Select.Option>
        </Select>
        <Select
          v-model:value="searchForm.status"
          placeholder="状态"
          class="w-28"
          allow-clear
        >
          <Select.Option
            v-for="opt in statusOptions"
            :key="opt.value"
            :value="opt.value"
          >
            {{ opt.label }}
          </Select.Option>
        </Select>
        <Space>
          <Button type="primary" @click="handleSearch">查询</Button>
          <Button @click="handleReset">重置</Button>
          <Button @click="handleExport">导出</Button>
        </Space>
      </div>
    </Card>

    <Card title="使用明细列表" class="shadow-sm">
      <Table
        :loading="loading"
        :data-source="tableData"
        :pagination="{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (t: number) => `共 ${t} 条`,
        }"
        @change="
          (pag: any) => {
            currentPage = pag.current;
            loadData();
          }
        "
      >
        <Table.Column title="时间" data-index="callTime" width="180" />
        <Table.Column title="任务类型" data-index="taskTypeText">
          <template #default="{ record }">
            <Tag
              :color="
                record.taskType === 'ppt'
                  ? 'blue'
                  : record.taskType === 'quote'
                    ? 'purple'
                    : 'cyan'
              "
            >
              {{ record.taskTypeText }}
            </Tag>
          </template>
        </Table.Column>
        <Table.Column title="成果物" data-index="deliverable">
          <template #default="{ record }">
            <span
              :class="
                record.status === 'failed'
                  ? 'text-muted-foreground'
                  : 'text-blue-500'
              "
            >
              {{ record.deliverable }}
            </span>
          </template>
        </Table.Column>
        <Table.Column title="数字员工" data-index="employeeName" />
        <Table.Column title="Token消耗" data-index="tokenConsume" />
        <Table.Column title="状态" data-index="status">
          <template #default="{ record }">
            <Tag :color="record.status === 'success' ? 'success' : 'error'">
              {{ record.status === 'success' ? '成功' : '失败' }}
            </Tag>
          </template>
        </Table.Column>
        <Table.Column title="操作人" data-index="operator" />
      </Table>
    </Card>
  </div>
</template>
