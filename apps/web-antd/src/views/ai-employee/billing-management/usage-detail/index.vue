<script setup lang="ts">
import { reactive, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  DatePicker,
  Input,
  message,
  Select,
  Space,
  Tooltip,
} from 'ant-design-vue';

// 状态管理
const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 查询条件
const searchForm = reactive({
  tenant: '',
  employeeId: '',
  employeeName: '',
  timeRange: [],
});

// 租户列表
const tenantList = ref([
  { label: '租户A', value: 'tenant-a' },
  { label: '租户B', value: 'tenant-b' },
  { label: '租户C', value: 'tenant-c' },
]);

// 员工类型选项
const employeeTypeOptions = [
  { label: '智能体', value: 'agent' },
  { label: '人工', value: 'human' },
];

// 示例数据
const mockData = [
  {
    id: '1',
    tenant: '租户A',
    employeeId: 'AGENT001',
    employeeName: '智能客服助手',
    employeeType: 'agent',
    callTime: '2026-04-14 10:00:00',
    result: '生成了一份财务报表',
  },
  {
    id: '2',
    tenant: '租户B',
    employeeId: 'AGENT002',
    employeeName: '销售助手',
    employeeType: 'agent',
    callTime: '2026-04-14 10:30:00',
    result: '生成了销售分析报告',
  },
  {
    id: '3',
    tenant: '租户A',
    employeeId: 'EMP001',
    employeeName: '张三',
    employeeType: 'human',
    callTime: '2026-04-14 11:00:00',
    result: '处理了客户咨询',
  },
  {
    id: '4',
    tenant: '租户C',
    employeeId: 'AGENT003',
    employeeName: '技术支持助手',
    employeeType: 'agent',
    callTime: '2026-04-14 11:30:00',
    result: '解决了技术问题',
  },
  {
    id: '5',
    tenant: '租户B',
    employeeId: 'EMP002',
    employeeName: '李四',
    employeeType: 'human',
    callTime: '2026-04-14 12:00:00',
    result: '处理了投诉',
  },
];

// 加载数据
const loadData = () => {
  loading.value = true;
  // 模拟API请求
  setTimeout(() => {
    tableData.value = mockData;
    total.value = mockData.length;
    loading.value = false;
  }, 500);
};

// 搜索
const handleSearch = () => {
  currentPage.value = 1;
  loadData();
};

// 重置
const handleReset = () => {
  Object.assign(searchForm, {
    tenant: '',
    employeeId: '',
    employeeName: '',
    timeRange: [],
  });
  currentPage.value = 1;
  loadData();
};

// 分页变化
const handlePageChange = (page: number) => {
  currentPage.value = page;
  loadData();
};

// 导出
const handleExport = () => {
  message.success('导出功能开发中');
};

// 格式化日期
const formatDate = (dateString: string) => {
  return dateString;
};

// 获取员工类型文本
const getEmployeeTypeText = (type: string) => {
  const option = employeeTypeOptions.find((opt) => opt.value === type);
  return option ? option.label : type;
};

// 初始加载数据
loadData();
</script>

<template>
  <div class="h-full space-y-4 overflow-y-auto p-6">
    <!-- 查询表单 -->
    <div class="rounded-lg border bg-card p-4 shadow-sm">
      <!-- 第一行：租户、员工ID、员工名称、时间 -->
      <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- 租户 -->
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">租户</label>
          <Select
            v-model:value="searchForm.tenant"
            placeholder="请选择租户"
            class="flex-1"
          >
            <Select.Option
              v-for="tenant in tenantList"
              :key="tenant.value"
              :value="tenant.value"
            >
              {{ tenant.label }}
            </Select.Option>
          </Select>
        </div>

        <!-- 员工ID -->
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">员工ID</label>
          <Input
            v-model:value="searchForm.employeeId"
            placeholder="请输入员工ID"
            class="flex-1"
          />
        </div>

        <!-- 员工名称 -->
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">员工名称</label>
          <Input
            v-model:value="searchForm.employeeName"
            placeholder="请输入员工名称"
            class="flex-1"
          />
        </div>

        <!-- 时间 -->
        <div class="flex items-center gap-2">
          <label class="w-16 shrink-0 text-sm font-medium">时间</label>
          <DatePicker.RangePicker
            v-model:value="searchForm.timeRange"
            class="flex-1"
          />
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center justify-end gap-2">
        <Button @click="handleReset">重置</Button>
        <Button type="primary" @click="handleSearch">搜索</Button>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="rounded-lg border bg-card shadow-sm">
      <!-- 表格标题和操作栏 -->
      <div class="flex items-center justify-between border-b px-4 py-3">
        <h3 class="text-lg font-semibold">次数使用明细</h3>
        <Space>
          <Button @click="handleExport">
            <Icon icon="lucide:download" class="mr-1 size-4" />
            导出
          </Button>
          <Tooltip title="刷新">
            <Button @click="loadData">
              <Icon icon="lucide:refresh-cw" class="size-4" />
            </Button>
          </Tooltip>
        </Space>
      </div>

      <table class="w-full">
        <thead class="bg-muted/50">
          <tr>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              租户
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              员工ID
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              员工名称
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              员工类型
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              调用时间
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              成果物
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in tableData"
            :key="item.id"
            class="border-b transition-colors hover:bg-muted/50"
          >
            <td class="px-4 py-3 text-sm">{{ item.tenant }}</td>
            <td class="px-4 py-3 text-sm">{{ item.employeeId }}</td>
            <td class="px-4 py-3 text-sm">{{ item.employeeName }}</td>
            <td class="px-4 py-3 text-sm">
              {{ getEmployeeTypeText(item.employeeType) }}
            </td>
            <td class="px-4 py-3 text-sm">{{ formatDate(item.callTime) }}</td>
            <td class="px-4 py-3 text-sm">{{ item.result }}</td>
          </tr>
          <tr v-if="tableData.length === 0">
            <td
              :colspan="6"
              class="px-4 py-8 text-center text-muted-foreground"
            >
              暂无数据
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div
        v-if="total > 0"
        class="flex items-center justify-between border-t px-4 py-3"
      >
        <span class="text-sm text-muted-foreground">
          共 {{ total }} 条记录
        </span>
        <div class="flex gap-2">
          <Button
            :disabled="currentPage === 1"
            size="small"
            @click="
              currentPage--;
              handlePageChange(currentPage);
            "
          >
            上一页
          </Button>
          <Button
            :disabled="currentPage * pageSize >= total"
            size="small"
            @click="
              currentPage++;
              handlePageChange(currentPage);
            "
          >
            下一页
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
