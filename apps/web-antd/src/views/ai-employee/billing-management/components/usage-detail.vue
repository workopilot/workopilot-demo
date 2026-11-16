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
  Tooltip,
} from 'ant-design-vue';

// 状态管理
const loading = ref(false);
const tableData = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 弹窗状态
const helpModalVisible = ref(false);

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
  { label: '管理岗', value: 'management' },
  { label: '营销岗', value: 'marketing' },
  { label: '产品岗', value: 'product' },
  { label: '研发岗', value: 'rd' },
  { label: '数据岗', value: 'data' },
  { label: '客服岗', value: 'customer' },
];

// 示例数据
const mockData = [
  {
    id: '1',
    tenant: '租户A',
    employeeId: 'AGENT001',
    employeeName: '商务分析助手',
    employeeType: 'data',
    callTime: '2026-04-14 10:00:00',
    callerAccount: 'zhangsan',
    callerName: '张三',
    result: '财务报表.xlsx',
    specification: '一份',
  },
  {
    id: '2',
    tenant: '租户B',
    employeeId: 'AGENT002',
    employeeName: '业务咨询',
    employeeType: 'customer',
    callTime: '2026-04-14 10:30:00',
    callerAccount: 'lisi',
    callerName: '李四',
    result: '销售分析报告.pdf',
    specification: '一份',
  },
  {
    id: '3',
    tenant: '租户A',
    employeeId: 'AGENT003',
    employeeName: '财务专员',
    employeeType: 'management',
    callTime: '2026-04-14 11:00:00',
    callerAccount: 'wangwu',
    callerName: '王五',
    result: '客户咨询记录.docx',
    specification: '一个',
  },
  {
    id: '4',
    tenant: '租户C',
    employeeId: 'AGENT004',
    employeeName: '数据分析师',
    employeeType: 'data',
    callTime: '2026-04-14 11:30:00',
    callerAccount: 'zhaoliu',
    callerName: '赵六',
    result: '技术问题方案.pptx',
    specification: '一份',
  },
  {
    id: '5',
    tenant: '租户B',
    employeeId: 'AGENT005',
    employeeName: '报价专员',
    employeeType: 'marketing',
    callTime: '2026-04-14 12:00:00',
    callerAccount: 'sunqi',
    callerName: '孙七',
    result: '投诉记录.xlsx',
    specification: '一个',
  },
  {
    id: '6',
    tenant: '租户C',
    employeeId: 'AGENT006',
    employeeName: '填报助理',
    employeeType: 'product',
    callTime: '2026-04-14 12:30:00',
    callerAccount: 'zhouba',
    callerName: '周八',
    result: '项目计划.docx',
    specification: '一份',
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

// 显示帮助弹窗
const showHelpModal = () => {
  helpModalVisible.value = true;
};

// 初始加载数据
loadData();
</script>

<template>
  <div class="relative min-h-[600px] space-y-4">
    <!-- 帮助提示球 -->
    <div class="absolute bottom-4 right-4 z-10">
      <Tooltip title="查看设计逻辑" placement="top">
        <Button
          type="primary"
          class="flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:shadow-xl"
          @click="showHelpModal"
        >
          <Icon icon="lucide:help-circle" class="size-6" />
        </Button>
      </Tooltip>
    </div>

    <!-- 帮助弹窗 -->
    <Modal
      v-model:open="helpModalVisible"
      title="次数使用明细接口文档"
      width="800px"
    >
      <Card class="min-h-[500px]">
        <Spin :spinning="false">
          <div class="min-h-[500px]">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <article class="markdown-body">
              <h1>次数使用明细接口文档</h1>
              <p>
                本文档描述了次数使用明细模块的相关接口，用于展示数字员工的调用记录。
              </p>

              <h2>1. 页面设计逻辑</h2>

              <h3>1.1 页面结构</h3>
              <ul>
                <li>
                  <strong>查询条件区</strong>:
                  包含租户、员工ID、员工名称、时间范围等筛选条件
                </li>
                <li>
                  <strong>数据表格区</strong>:
                  展示详细的调用记录，包含租户、数字员工信息、调用时间、调用人信息、成果物和规格等字段
                </li>
                <li><strong>分页区</strong>: 提供分页功能，方便查看大量数据</li>
              </ul>

              <h3>1.2 核心功能</h3>
              <ul>
                <li>
                  <strong>数据筛选</strong>:
                  支持按租户、员工ID、员工名称和时间范围进行筛选
                </li>
                <li><strong>数据导出</strong>: 支持导出调用记录</li>
                <li><strong>数据刷新</strong>: 支持手动刷新数据</li>
                <li><strong>分页导航</strong>: 支持上下页导航</li>
              </ul>

              <h3>1.3 技术实现</h3>
              <ul>
                <li>使用 Vue 3 + TypeScript + Ant Design Vue 开发</li>
                <li>采用 Composition API 管理状态和逻辑</li>
                <li>使用 Mock 数据模拟 API 响应</li>
                <li>响应式设计，适配不同屏幕尺寸</li>
                <li>使用 Tailwind CSS 进行样式设计</li>
              </ul>

              <h2>2. 次数使用明细查询</h2>

              <h3>2.1 获取次数使用明细列表</h3>
              <ul>
                <li><strong>接口名称</strong>: 获取次数使用明细列表</li>
                <li>
                  <strong>逻辑描述</strong>:
                  获取数字员工的调用记录，支持按租户、员工ID、员工名称和时间范围进行筛选。
                </li>
                <li>
                  <strong>接口相对路径</strong>:
                  <code>/api/usage/detail</code> (GET)
                </li>
                <li><strong>请求方式</strong>: GET</li>
              </ul>

              <h4>入参</h4>
              <table>
                <thead>
                  <tr>
                    <th>字段名</th>
                    <th>类型</th>
                    <th>描述</th>
                    <th>必选</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>tenant</td>
                    <td>string</td>
                    <td>租户ID</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>employeeId</td>
                    <td>string</td>
                    <td>数字员工ID</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>employeeName</td>
                    <td>string</td>
                    <td>数字员工名称</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>startTime</td>
                    <td>string</td>
                    <td>开始时间 (ISO格式)</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>endTime</td>
                    <td>string</td>
                    <td>结束时间 (ISO格式)</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>page</td>
                    <td>number</td>
                    <td>页码</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>pageSize</td>
                    <td>number</td>
                    <td>每页条数</td>
                    <td>否</td>
                  </tr>
                </tbody>
              </table>

              <h4>返回值</h4>
              <table>
                <thead>
                  <tr>
                    <th>字段名</th>
                    <th>类型</th>
                    <th>描述</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>code</td>
                    <td>number</td>
                    <td>响应状态码 (0表示成功)</td>
                  </tr>
                  <tr>
                    <td>message</td>
                    <td>string</td>
                    <td>响应消息</td>
                  </tr>
                  <tr>
                    <td>data</td>
                    <td>object</td>
                    <td>响应数据</td>
                  </tr>
                  <tr>
                    <td>data.list</td>
                    <td>UsageDetail[]</td>
                    <td>次数使用明细列表</td>
                  </tr>
                  <tr>
                    <td>data.total</td>
                    <td>number</td>
                    <td>总记录数</td>
                  </tr>
                </tbody>
              </table>

              <p><strong>UsageDetail 结构</strong>:</p>
              <table>
                <thead>
                  <tr>
                    <th>字段名</th>
                    <th>类型</th>
                    <th>描述</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>id</td>
                    <td>string</td>
                    <td>记录ID</td>
                  </tr>
                  <tr>
                    <td>tenant</td>
                    <td>string</td>
                    <td>租户名称</td>
                  </tr>
                  <tr>
                    <td>employeeId</td>
                    <td>string</td>
                    <td>数字员工ID</td>
                  </tr>
                  <tr>
                    <td>employeeName</td>
                    <td>string</td>
                    <td>数字员工名称</td>
                  </tr>
                  <tr>
                    <td>employeeType</td>
                    <td>string</td>
                    <td>数字员工类型</td>
                  </tr>
                  <tr>
                    <td>callTime</td>
                    <td>string</td>
                    <td>调用时间</td>
                  </tr>
                  <tr>
                    <td>callerAccount</td>
                    <td>string</td>
                    <td>调用人账号</td>
                  </tr>
                  <tr>
                    <td>callerName</td>
                    <td>string</td>
                    <td>调用人姓名</td>
                  </tr>
                  <tr>
                    <td>result</td>
                    <td>string</td>
                    <td>成果物</td>
                  </tr>
                  <tr>
                    <td>specification</td>
                    <td>string</td>
                    <td>规格</td>
                  </tr>
                </tbody>
              </table>

              <h2>3. 导出次数使用明细</h2>

              <h3>3.1 导出次数使用明细</h3>
              <ul>
                <li><strong>接口名称</strong>: 导出次数使用明细</li>
                <li>
                  <strong>逻辑描述</strong>: 导出数字员工的调用记录为Excel文件。
                </li>
                <li>
                  <strong>接口相对路径</strong>:
                  <code>/api/usage/export</code> (GET)
                </li>
                <li><strong>请求方式</strong>: GET</li>
              </ul>

              <h4>入参</h4>
              <table>
                <thead>
                  <tr>
                    <th>字段名</th>
                    <th>类型</th>
                    <th>描述</th>
                    <th>必选</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>tenant</td>
                    <td>string</td>
                    <td>租户ID</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>employeeId</td>
                    <td>string</td>
                    <td>数字员工ID</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>employeeName</td>
                    <td>string</td>
                    <td>数字员工名称</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>startTime</td>
                    <td>string</td>
                    <td>开始时间 (ISO格式)</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>endTime</td>
                    <td>string</td>
                    <td>结束时间 (ISO格式)</td>
                    <td>否</td>
                  </tr>
                </tbody>
              </table>

              <h4>返回值</h4>
              <table>
                <thead>
                  <tr>
                    <th>字段名</th>
                    <th>类型</th>
                    <th>描述</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>code</td>
                    <td>number</td>
                    <td>响应状态码 (0表示成功)</td>
                  </tr>
                  <tr>
                    <td>message</td>
                    <td>string</td>
                    <td>响应消息</td>
                  </tr>
                  <tr>
                    <td>data</td>
                    <td>string</td>
                    <td>导出文件URL</td>
                  </tr>
                </tbody>
              </table>
            </article>
          </div>
        </Spin>
      </Card>
    </Modal>

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
              数字员工ID
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              数字员工名称
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              数字员工类型
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              调用时间
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              调用人账号
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              调用人姓名
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              成果物
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              规格
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
            <td class="px-4 py-3 text-sm">{{ item.callerAccount }}</td>
            <td class="px-4 py-3 text-sm">{{ item.callerName }}</td>
            <td class="px-4 py-3 text-sm">{{ item.result }}</td>
            <td class="px-4 py-3 text-sm">{{ item.specification }}</td>
          </tr>
          <tr v-if="tableData.length === 0">
            <td
              :colspan="9"
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

<style scoped>
@media (max-width: 767px) {
  .markdown-body {
    padding: 15px;
  }
}

.markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 980px;
  padding: 15px;
  margin: 0 auto;
}

/* Hide TOC inside the content area */
:deep(.markdown-body .table-of-contents) {
  display: none;
}

/* Style the TOC in the sidebar */
.toc-container {
  padding: 0 16px;
}

:deep(.toc-container .table-of-contents) {
  display: block;
}

:deep(.toc-container ul) {
  padding: 0;
  margin: 0;
  list-style: none;
}

:deep(.toc-container li) {
  padding: 4px 0;
  margin: 0;
  line-height: 1.4;
}

:deep(.toc-container ul ul) {
  padding-left: 16px;
}

:deep(.toc-container a) {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  color: inherit;
  white-space: nowrap;
  text-decoration: none;
  transition: color 0.2s;
}

:deep(.toc-container a:hover) {
  color: #1677ff; /* Ant Design Primary Color */
}
</style>

<style>
/* Import GitHub Markdown CSS */
@import url('https://cdn.jsdelivr.net/npm/github-markdown-css@5.2.0/github-markdown.min.css');
</style>
