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
  tenantName: '',
  callTime: [],
  requestId: '',
  modelVendor: '',
  modelLevel: '',
  callStatus: '',
  businessType: '',
  keyword: '',
});

// 租户列表
const tenantList = ref([
  { label: '租户A', value: 'tenant-a' },
  { label: '租户B', value: 'tenant-b' },
  { label: '租户C', value: 'tenant-c' },
]);

// 模型厂商选项
const modelVendorOptions = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'Google', value: 'google' },
  { label: '百度', value: 'baidu' },
  { label: '阿里', value: 'alibaba' },
  { label: '腾讯', value: 'tencent' },
];

// 模型级别选项
const modelLevelOptions = [
  { label: '基础版', value: 'basic' },
  { label: '标准版', value: 'standard' },
  { label: '高级版', value: 'premium' },
  { label: '企业版', value: 'enterprise' },
];

// 调用状态选项
const callStatusOptions = [
  { label: '成功', value: 'success' },
  { label: '失败', value: 'failed' },
  { label: '处理中', value: 'processing' },
];

// 业务类型选项
const businessTypeOptions = [
  { label: '客服', value: 'customer-service' },
  { label: '销售', value: 'sales' },
  { label: '技术支持', value: 'technical-support' },
  { label: '财务', value: 'finance' },
  { label: '人力资源', value: 'hr' },
];

// 示例数据
const mockData = [
  {
    id: '1',
    requestId: 'REQ-20260414-001',
    businessType: 'customer-service',
    modelName: 'GPT-4o',
    modelVendor: 'openai',
    modelLevel: 'premium',
    tenantName: '租户A',
    callStatus: 'success',
    inputTokens: 120,
    outputTokens: 350,
    totalTokens: 470,
    callTime: '2026-04-14 10:00:00',
    duration: 2.5,
  },
  {
    id: '2',
    requestId: 'REQ-20260414-002',
    businessType: 'sales',
    modelName: 'Claude 3 Opus',
    modelVendor: 'anthropic',
    modelLevel: 'enterprise',
    tenantName: '租户B',
    callStatus: 'success',
    inputTokens: 85,
    outputTokens: 280,
    totalTokens: 365,
    callTime: '2026-04-14 10:30:00',
    duration: 1.8,
  },
  {
    id: '3',
    requestId: 'REQ-20260414-003',
    businessType: 'technical-support',
    modelName: 'Gemini Pro',
    modelVendor: 'google',
    modelLevel: 'standard',
    tenantName: '租户A',
    callStatus: 'failed',
    inputTokens: 200,
    outputTokens: 0,
    totalTokens: 200,
    callTime: '2026-04-14 11:00:00',
    duration: 0.5,
  },
  {
    id: '4',
    requestId: 'REQ-20260414-004',
    businessType: 'finance',
    modelName: '文心一言',
    modelVendor: 'baidu',
    modelLevel: 'basic',
    tenantName: '租户C',
    callStatus: 'success',
    inputTokens: 150,
    outputTokens: 420,
    totalTokens: 570,
    callTime: '2026-04-14 11:30:00',
    duration: 3.2,
  },
  {
    id: '5',
    requestId: 'REQ-20260414-005',
    businessType: 'hr',
    modelName: '通义千问',
    modelVendor: 'alibaba',
    modelLevel: 'standard',
    tenantName: '租户B',
    callStatus: 'processing',
    inputTokens: 90,
    outputTokens: 0,
    totalTokens: 90,
    callTime: '2026-04-14 12:00:00',
    duration: 0,
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
    tenantName: '',
    callTime: [],
    requestId: '',
    modelVendor: '',
    modelLevel: '',
    callStatus: '',
    businessType: '',
    keyword: '',
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

// 查看详情
const handleViewDetail = (item: any) => {
  message.info(`查看请求详情: ${item.requestId}`);
};

// 格式化日期
const formatDate = (dateString: string) => {
  return dateString;
};

// 获取选项文本
const getOptionText = (value: string, options: any[]) => {
  const option = options.find((opt) => opt.value === value);
  return option ? option.label : value;
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
    <div class="fixed bottom-4 right-4 z-10">
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
      title="Token 使用明细接口文档"
      width="800px"
    >
      <Card class="min-h-[500px]">
        <Spin :spinning="false">
          <div class="min-h-[500px]">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <article class="markdown-body">
              <h1>Token 使用明细接口文档</h1>
              <p>
                本文档描述了 Token 使用明细模块的相关接口，用于展示模型调用的
                Token 使用情况。
              </p>

              <h2>1. 页面设计逻辑</h2>

              <h3>1.1 页面结构</h3>
              <ul>
                <li>
                  <strong>查询条件区</strong>:
                  包含租户名称、调用时间、请求ID、模型厂商、模型级别、调用状态、业务类型、关键字等筛选条件
                </li>
                <li>
                  <strong>数据表格区</strong>: 展示详细的 Token
                  使用记录，包含请求ID、业务类型、模型信息、租户信息、Token
                  使用情况、调用时间等字段
                </li>
                <li><strong>分页区</strong>: 提供分页功能，方便查看大量数据</li>
              </ul>

              <h3>1.2 核心功能</h3>
              <ul>
                <li><strong>数据筛选</strong>: 支持按多个条件进行组合筛选</li>
                <li><strong>数据导出</strong>: 支持导出 Token 使用记录</li>
                <li><strong>数据刷新</strong>: 支持手动刷新数据</li>
                <li><strong>分页导航</strong>: 支持上下页导航</li>
                <li><strong>详情查看</strong>: 支持查看请求详情</li>
              </ul>

              <h3>1.3 技术实现</h3>
              <ul>
                <li>使用 Vue 3 + TypeScript + Ant Design Vue 开发</li>
                <li>采用 Composition API 管理状态和逻辑</li>
                <li>使用 Mock 数据模拟 API 响应</li>
                <li>响应式设计，适配不同屏幕尺寸</li>
                <li>使用 Tailwind CSS 进行样式设计</li>
              </ul>

              <h2>2. Token 使用明细查询</h2>

              <h3>2.1 获取 Token 使用明细列表</h3>
              <ul>
                <li><strong>接口名称</strong>: 获取 Token 使用明细列表</li>
                <li>
                  <strong>逻辑描述</strong>: 获取模型调用的 Token
                  使用记录，支持按多个条件进行筛选。
                </li>
                <li>
                  <strong>接口相对路径</strong>:
                  <code>/api/token/usage</code> (GET)
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
                    <td>tenantName</td>
                    <td>string</td>
                    <td>租户名称</td>
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
                    <td>requestId</td>
                    <td>string</td>
                    <td>请求ID</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>modelVendor</td>
                    <td>string</td>
                    <td>模型厂商</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>modelLevel</td>
                    <td>string</td>
                    <td>模型级别</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>callStatus</td>
                    <td>string</td>
                    <td>调用状态</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>businessType</td>
                    <td>string</td>
                    <td>业务类型</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>keyword</td>
                    <td>string</td>
                    <td>关键字</td>
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
                    <td>TokenUsage[]</td>
                    <td>Token 使用明细列表</td>
                  </tr>
                  <tr>
                    <td>data.total</td>
                    <td>number</td>
                    <td>总记录数</td>
                  </tr>
                </tbody>
              </table>

              <p><strong>TokenUsage 结构</strong>:</p>
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
                    <td>requestId</td>
                    <td>string</td>
                    <td>请求ID</td>
                  </tr>
                  <tr>
                    <td>businessType</td>
                    <td>string</td>
                    <td>业务类型</td>
                  </tr>
                  <tr>
                    <td>modelName</td>
                    <td>string</td>
                    <td>模型名称</td>
                  </tr>
                  <tr>
                    <td>modelVendor</td>
                    <td>string</td>
                    <td>模型厂商</td>
                  </tr>
                  <tr>
                    <td>modelLevel</td>
                    <td>string</td>
                    <td>模型级别</td>
                  </tr>
                  <tr>
                    <td>tenantName</td>
                    <td>string</td>
                    <td>租户名称</td>
                  </tr>
                  <tr>
                    <td>callStatus</td>
                    <td>string</td>
                    <td>调用状态</td>
                  </tr>
                  <tr>
                    <td>inputTokens</td>
                    <td>number</td>
                    <td>输入Token数</td>
                  </tr>
                  <tr>
                    <td>outputTokens</td>
                    <td>number</td>
                    <td>输出Token数</td>
                  </tr>
                  <tr>
                    <td>totalTokens</td>
                    <td>number</td>
                    <td>总Token数</td>
                  </tr>
                  <tr>
                    <td>callTime</td>
                    <td>string</td>
                    <td>调用时间</td>
                  </tr>
                  <tr>
                    <td>duration</td>
                    <td>number</td>
                    <td>耗时(秒)</td>
                  </tr>
                </tbody>
              </table>

              <h2>3. 导出 Token 使用明细</h2>

              <h3>3.1 导出 Token 使用明细</h3>
              <ul>
                <li><strong>接口名称</strong>: 导出 Token 使用明细</li>
                <li>
                  <strong>逻辑描述</strong>: 导出 Token 使用记录为Excel文件。
                </li>
                <li>
                  <strong>接口相对路径</strong>:
                  <code>/api/token/export</code> (GET)
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
                    <td>tenantName</td>
                    <td>string</td>
                    <td>租户名称</td>
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
                    <td>requestId</td>
                    <td>string</td>
                    <td>请求ID</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>modelVendor</td>
                    <td>string</td>
                    <td>模型厂商</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>modelLevel</td>
                    <td>string</td>
                    <td>模型级别</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>callStatus</td>
                    <td>string</td>
                    <td>调用状态</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>businessType</td>
                    <td>string</td>
                    <td>业务类型</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>keyword</td>
                    <td>string</td>
                    <td>关键字</td>
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
      <!-- 第一行：租户名称、调用时间、请求ID、模型厂商 -->
      <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- 租户名称 -->
        <div class="flex items-center gap-2">
          <label class="w-20 shrink-0 text-sm font-medium">租户名称</label>
          <Select
            v-model:value="searchForm.tenantName"
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

        <!-- 调用时间 -->
        <div class="flex items-center gap-2">
          <label class="w-20 shrink-0 text-sm font-medium">调用时间</label>
          <DatePicker.RangePicker
            v-model:value="searchForm.callTime"
            class="flex-1"
          />
        </div>

        <!-- 请求ID -->
        <div class="flex items-center gap-2">
          <label class="w-20 shrink-0 text-sm font-medium">请求ID</label>
          <Input
            v-model:value="searchForm.requestId"
            placeholder="请输入请求ID"
            class="flex-1"
          />
        </div>

        <!-- 模型厂商 -->
        <div class="flex items-center gap-2">
          <label class="w-20 shrink-0 text-sm font-medium">模型厂商</label>
          <Select
            v-model:value="searchForm.modelVendor"
            placeholder="请选择模型厂商"
            class="flex-1"
          >
            <Select.Option
              v-for="vendor in modelVendorOptions"
              :key="vendor.value"
              :value="vendor.value"
            >
              {{ vendor.label }}
            </Select.Option>
          </Select>
        </div>
      </div>

      <!-- 第二行：模型级别、调用状态、业务类型、关键字 -->
      <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- 模型级别 -->
        <div class="flex items-center gap-2">
          <label class="w-20 shrink-0 text-sm font-medium">模型级别</label>
          <Select
            v-model:value="searchForm.modelLevel"
            placeholder="请选择模型级别"
            class="flex-1"
          >
            <Select.Option
              v-for="level in modelLevelOptions"
              :key="level.value"
              :value="level.value"
            >
              {{ level.label }}
            </Select.Option>
          </Select>
        </div>

        <!-- 调用状态 -->
        <div class="flex items-center gap-2">
          <label class="w-20 shrink-0 text-sm font-medium">调用状态</label>
          <Select
            v-model:value="searchForm.callStatus"
            placeholder="请选择调用状态"
            class="flex-1"
          >
            <Select.Option
              v-for="status in callStatusOptions"
              :key="status.value"
              :value="status.value"
            >
              {{ status.label }}
            </Select.Option>
          </Select>
        </div>

        <!-- 业务类型 -->
        <div class="flex items-center gap-2">
          <label class="w-20 shrink-0 text-sm font-medium">业务类型</label>
          <Select
            v-model:value="searchForm.businessType"
            placeholder="请选择业务类型"
            class="flex-1"
          >
            <Select.Option
              v-for="type in businessTypeOptions"
              :key="type.value"
              :value="type.value"
            >
              {{ type.label }}
            </Select.Option>
          </Select>
        </div>

        <!-- 关键字 -->
        <div class="flex items-center gap-2">
          <label class="w-20 shrink-0 text-sm font-medium">关键字</label>
          <Input
            v-model:value="searchForm.keyword"
            placeholder="请输入关键字"
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
        <h3 class="text-lg font-semibold">Token 使用明细</h3>
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
              请求ID
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              业务类型
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              模型名称
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              模型厂商
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              模型级别
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              租户名称
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              调用状态
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              输入Token
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              输出Token
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              总Token
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              调用时间
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              耗时(秒)
            </th>
            <th class="border-b px-4 py-3 text-left text-sm font-medium">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in tableData"
            :key="item.id"
            class="border-b transition-colors hover:bg-muted/50"
          >
            <td class="px-4 py-3 text-sm">{{ item.requestId }}</td>
            <td class="px-4 py-3 text-sm">
              {{ getOptionText(item.businessType, businessTypeOptions) }}
            </td>
            <td class="px-4 py-3 text-sm">{{ item.modelName }}</td>
            <td class="px-4 py-3 text-sm">
              {{ getOptionText(item.modelVendor, modelVendorOptions) }}
            </td>
            <td class="px-4 py-3 text-sm">
              {{ getOptionText(item.modelLevel, modelLevelOptions) }}
            </td>
            <td class="px-4 py-3 text-sm">{{ item.tenantName }}</td>
            <td class="px-4 py-3 text-sm">
              {{ getOptionText(item.callStatus, callStatusOptions) }}
            </td>
            <td class="px-4 py-3 text-sm">{{ item.inputTokens }}</td>
            <td class="px-4 py-3 text-sm">{{ item.outputTokens }}</td>
            <td class="px-4 py-3 text-sm">{{ item.totalTokens }}</td>
            <td class="px-4 py-3 text-sm">{{ formatDate(item.callTime) }}</td>
            <td class="px-4 py-3 text-sm">{{ item.duration }}</td>
            <td class="px-4 py-3">
              <Button type="link" size="small" @click="handleViewDetail(item)">
                查看
              </Button>
            </td>
          </tr>
          <tr v-if="tableData.length === 0">
            <td
              :colspan="13"
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
