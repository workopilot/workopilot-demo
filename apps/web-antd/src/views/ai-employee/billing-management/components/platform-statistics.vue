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
  Progress,
  Select,
  Spin,
  Tabs,
  Tooltip,
} from 'ant-design-vue';

// 当前激活的Tab
const activeTab = ref('usage');

// 状态管理
const loading = ref(false);
const usageTableData = ref<any[]>([]);
const tokenTableData = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

// 弹窗状态
const helpModalVisible = ref(false);

// 查询条件
const searchForm = reactive({
  timeRange: [],
  tenantId: '',
  tenantName: '',
  employeeId: '',
  employeeName: '',
  employeeType: '',
});

// 员工类型选项
const employeeTypeOptions = [
  { label: 'RPA', value: 'rpa' },
  { label: '对话机器人', value: 'chatbot' },
  { label: '审核机器人', value: 'audit-bot' },
  { label: '财务机器人', value: 'finance-bot' },
];

// 次数统计卡片数据
const usageStats = ref([
  {
    title: '全平台总调用次数',
    value: '125,800',
    sub: '累计全平台服务调用总量',
    icon: 'lucide:globe',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    trend: '+18.5%',
    trendUp: true,
  },
  {
    title: '今日总调用次数',
    value: '1,560',
    sub: '较昨日增长 230 次',
    icon: 'lucide:zap',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    trend: '+17.3%',
    trendUp: true,
  },
  {
    title: '本月总调用次数',
    value: '32,500',
    sub: '本月累计调用总量',
    icon: 'lucide:calendar',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    trend: '+12.2%',
    trendUp: true,
  },
  {
    title: '接入租户总数',
    value: '48',
    sub: '已接入平台的租户数量',
    icon: 'lucide:building',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    trend: '+5',
    trendUp: true,
  },
  {
    title: '活跃数字员工总数',
    value: '256',
    sub: '近30天有调用记录',
    icon: 'lucide:bot',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50',
    trend: '+18',
    trendUp: true,
  },
]);

// Token统计卡片数据
const tokenStats = ref([
  {
    title: '全平台总消耗Token',
    value: '12,500,000',
    sub: '累计全平台Token消耗总量',
    icon: 'lucide:flame',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    trend: '+22.8%',
    trendUp: true,
  },
  {
    title: '今日消耗Token',
    value: '156,000',
    sub: '较昨日增长 21,000',
    icon: 'lucide:sparkles',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50',
    trend: '+15.6%',
    trendUp: true,
  },
  {
    title: '本月消耗Token',
    value: '3,250,000',
    sub: '本月累计消耗总量',
    icon: 'lucide:trending-up',
    color: 'text-pink-500',
    bg: 'bg-pink-50',
    trend: '+14.5%',
    trendUp: true,
  },
]);

// 租户调用排行数据
const tenantUsageRanking = ref([
  { name: '示例企业租户', percent: 28, count: 35_200, color: '#3b82f6' },
  { name: '香港星空长海诊所', percent: 22, count: 27_600, color: '#8b5cf6' },
  { name: '深圳智慧医疗集团', percent: 18, count: 22_600, color: '#10b981' },
  { name: '北京健康科技公司', percent: 15, count: 18_800, color: '#f59e0b' },
  { name: '其他租户', percent: 17, count: 21_300, color: '#6b7280' },
]);

// 租户Token消耗排行数据
const tenantTokenRanking = ref([
  { name: '示例企业租户', percent: 26, tokens: 3_250_000, color: '#3b82f6' },
  {
    name: '香港星空长海诊所',
    percent: 24,
    tokens: 3_000_000,
    color: '#8b5cf6',
  },
  {
    name: '深圳智慧医疗集团',
    percent: 20,
    tokens: 2_500_000,
    color: '#10b981',
  },
  {
    name: '北京健康科技公司',
    percent: 16,
    tokens: 2_000_000,
    color: '#f59e0b',
  },
  { name: '其他租户', percent: 14, tokens: 1_750_000, color: '#6b7280' },
]);

// 次数使用统计示例数据
const usageMockData = [
  {
    id: '1',
    tenantId: 'T-10001',
    tenantName: '示例企业租户',
    employeeId: 'AGENT001',
    employeeName: '智能客服助手',
    employeeType: 'chatbot',
    callCount: 1250,
    trend: '+15%',
  },
  {
    id: '2',
    tenantId: 'T-10001',
    tenantName: '示例企业租户',
    employeeId: 'AGENT002',
    employeeName: '销售助手',
    employeeType: 'chatbot',
    callCount: 980,
    trend: '+12%',
  },
  {
    id: '3',
    tenantId: 'T-50291',
    tenantName: '香港星空长海诊所',
    employeeId: 'RPA001',
    employeeName: '财务RPA',
    employeeType: 'rpa',
    callCount: 850,
    trend: '+8%',
  },
  {
    id: '4',
    tenantId: 'T-50291',
    tenantName: '香港星空长海诊所',
    employeeId: 'AUDIT001',
    employeeName: '审核机器人',
    employeeType: 'audit-bot',
    callCount: 720,
    trend: '+5%',
  },
  {
    id: '5',
    tenantId: 'T-30012',
    tenantName: '深圳智慧医疗集团',
    employeeId: 'FIN001',
    employeeName: '财务机器人',
    employeeType: 'finance-bot',
    callCount: 680,
    trend: '+3%',
  },
  {
    id: '6',
    tenantId: 'T-30012',
    tenantName: '深圳智慧医疗集团',
    employeeId: 'AGENT003',
    employeeName: '智能客服助手',
    employeeType: 'chatbot',
    callCount: 920,
    trend: '+10%',
  },
  {
    id: '7',
    tenantId: 'T-40056',
    tenantName: '北京健康科技公司',
    employeeId: 'AGENT004',
    employeeName: '销售助手',
    employeeType: 'chatbot',
    callCount: 750,
    trend: '+7%',
  },
  {
    id: '8',
    tenantId: 'T-40056',
    tenantName: '北京健康科技公司',
    employeeId: 'RPA002',
    employeeName: '财务RPA',
    employeeType: 'rpa',
    callCount: 620,
    trend: '+4%',
  },
];

// Token使用统计示例数据
const tokenMockData = [
  {
    id: '1',
    tenantId: 'T-10001',
    tenantName: '示例企业租户',
    employeeId: 'AGENT001',
    employeeName: '智能客服助手',
    employeeType: 'chatbot',
    totalTokens: 125_000,
    trend: '+18%',
  },
  {
    id: '2',
    tenantId: 'T-10001',
    tenantName: '示例企业租户',
    employeeId: 'AGENT002',
    employeeName: '销售助手',
    employeeType: 'chatbot',
    totalTokens: 98_000,
    trend: '+14%',
  },
  {
    id: '3',
    tenantId: 'T-50291',
    tenantName: '香港星空长海诊所',
    employeeId: 'RPA001',
    employeeName: '财务RPA',
    employeeType: 'rpa',
    totalTokens: 85_000,
    trend: '+10%',
  },
  {
    id: '4',
    tenantId: 'T-50291',
    tenantName: '香港星空长海诊所',
    employeeId: 'AUDIT001',
    employeeName: '审核机器人',
    employeeType: 'audit-bot',
    totalTokens: 72_000,
    trend: '+6%',
  },
  {
    id: '5',
    tenantId: 'T-30012',
    tenantName: '深圳智慧医疗集团',
    employeeId: 'FIN001',
    employeeName: '财务机器人',
    employeeType: 'finance-bot',
    totalTokens: 68_000,
    trend: '+4%',
  },
  {
    id: '6',
    tenantId: 'T-30012',
    tenantName: '深圳智慧医疗集团',
    employeeId: 'AGENT003',
    employeeName: '智能客服助手',
    employeeType: 'chatbot',
    totalTokens: 92_000,
    trend: '+12%',
  },
  {
    id: '7',
    tenantId: 'T-40056',
    tenantName: '北京健康科技公司',
    employeeId: 'AGENT004',
    employeeName: '销售助手',
    employeeType: 'chatbot',
    totalTokens: 75_000,
    trend: '+8%',
  },
  {
    id: '8',
    tenantId: 'T-40056',
    tenantName: '北京健康科技公司',
    employeeId: 'RPA002',
    employeeName: '财务RPA',
    employeeType: 'rpa',
    totalTokens: 62_000,
    trend: '+5%',
  },
];

// 加载数据
const loadData = () => {
  loading.value = true;
  // 模拟API请求
  setTimeout(() => {
    usageTableData.value = usageMockData;
    tokenTableData.value = tokenMockData;
    total.value = usageMockData.length;
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
    timeRange: [],
    tenantId: '',
    tenantName: '',
    employeeId: '',
    employeeName: '',
    employeeType: '',
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

// 查看租户明细
const handleViewTenantDetail = (item: any) => {
  message.info(`查看租户 ${item.tenantName} 的明细数据`);
};

// 获取员工类型文本
const getEmployeeTypeText = (type: string) => {
  const option = employeeTypeOptions.find((opt) => opt.value === type);
  return option ? option.label : type;
};

// Tab切换
const handleTabChange = (key: string) => {
  activeTab.value = key;
};

// 显示帮助弹窗
const showHelpModal = () => {
  helpModalVisible.value = true;
};

// 初始加载数据
loadData();
</script>

<template>
  <div
    class="relative flex min-h-[calc(100vh-100px)] flex-col gap-6 bg-slate-50/50 p-6"
  >
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
      title="平台数据统计接口文档"
      width="800px"
    >
      <Card class="min-h-[500px]">
        <Spin :spinning="false">
          <div class="min-h-[500px]">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <article class="markdown-body">
              <h1>平台数据统计接口文档</h1>
              <p>
                本文档描述了平台数据统计模块的相关接口，用于展示全平台的租户调用统计和
                Token 消耗情况。
              </p>

              <h2>1. 页面设计逻辑</h2>

              <h3>1.1 页面结构</h3>
              <ul>
                <li><strong>页面头部</strong>: 展示平台管理员信息和页面标题</li>
                <li>
                  <strong>查询条件区</strong>:
                  包含统计时间范围、租户ID、租户名称、员工ID、员工名称、员工类型等筛选条件
                </li>
                <li>
                  <strong>Tab页签</strong>: 分为次数统计和 Token 统计两个 Tab
                </li>
                <li>
                  <strong>统计卡片区</strong>:
                  展示关键统计指标，如全平台总调用次数、今日总调用次数、总消耗
                  Token、接入租户总数、活跃数字员工总数等
                </li>
                <li>
                  <strong>数据表格区</strong>:
                  展示详细的统计数据，包括租户和数字员工的调用次数和 Token
                  消耗情况
                </li>
                <li>
                  <strong>租户排行区</strong>: 展示租户调用排行和 Token 消耗排行
                </li>
                <li><strong>分页区</strong>: 提供分页功能，方便查看大量数据</li>
              </ul>

              <h3>1.2 核心功能</h3>
              <ul>
                <li>
                  <strong>数据筛选</strong>:
                  支持按时间范围、租户信息、员工信息等多个条件进行筛选
                </li>
                <li><strong>数据导出</strong>: 支持导出统计数据</li>
                <li><strong>数据刷新</strong>: 支持手动刷新数据</li>
                <li><strong>分页导航</strong>: 支持上下页导航</li>
                <li>
                  <strong>租户明细查看</strong>: 支持查看租户的详细使用情况
                </li>
              </ul>

              <h3>1.3 技术实现</h3>
              <ul>
                <li>使用 Vue 3 + TypeScript + Ant Design Vue 开发</li>
                <li>采用 Composition API 管理状态和逻辑</li>
                <li>使用 Mock 数据模拟 API 响应</li>
                <li>响应式设计，适配不同屏幕尺寸</li>
                <li>使用 Tailwind CSS 进行样式设计</li>
                <li>使用 Ant Design Vue 的 Tabs 组件实现 Tab 切换</li>
                <li>使用 Ant Design Vue 的 Progress 组件展示占比数据</li>
              </ul>

              <h2>2. 平台数据统计查询</h2>

              <h3>2.1 获取平台调用次数统计</h3>
              <ul>
                <li><strong>接口名称</strong>: 获取平台调用次数统计</li>
                <li>
                  <strong>逻辑描述</strong>:
                  获取全平台的调用次数统计数据，支持按多个条件进行筛选。
                </li>
                <li>
                  <strong>接口相对路径</strong>:
                  <code>/api/platform/usage</code> (GET)
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
                    <td>tenantId</td>
                    <td>string</td>
                    <td>租户ID</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>tenantName</td>
                    <td>string</td>
                    <td>租户名称</td>
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
                    <td>员工名称</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>employeeType</td>
                    <td>string</td>
                    <td>员工类型</td>
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
                    <td>PlatformUsageStat[]</td>
                    <td>平台调用次数统计列表</td>
                  </tr>
                  <tr>
                    <td>data.total</td>
                    <td>number</td>
                    <td>总记录数</td>
                  </tr>
                  <tr>
                    <td>data.stats</td>
                    <td>object</td>
                    <td>统计卡片数据</td>
                  </tr>
                  <tr>
                    <td>data.ranking</td>
                    <td>object[]</td>
                    <td>租户排行数据</td>
                  </tr>
                </tbody>
              </table>

              <h3>2.2 获取平台 Token 消耗统计</h3>
              <ul>
                <li><strong>接口名称</strong>: 获取平台 Token 消耗统计</li>
                <li>
                  <strong>逻辑描述</strong>: 获取全平台的 Token
                  消耗统计数据，支持按多个条件进行筛选。
                </li>
                <li>
                  <strong>接口相对路径</strong>:
                  <code>/api/platform/token</code> (GET)
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
                    <td>tenantId</td>
                    <td>string</td>
                    <td>租户ID</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>tenantName</td>
                    <td>string</td>
                    <td>租户名称</td>
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
                    <td>员工名称</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>employeeType</td>
                    <td>string</td>
                    <td>员工类型</td>
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
                    <td>PlatformTokenStat[]</td>
                    <td>平台 Token 消耗统计列表</td>
                  </tr>
                  <tr>
                    <td>data.total</td>
                    <td>number</td>
                    <td>总记录数</td>
                  </tr>
                  <tr>
                    <td>data.stats</td>
                    <td>object</td>
                    <td>统计卡片数据</td>
                  </tr>
                  <tr>
                    <td>data.ranking</td>
                    <td>object[]</td>
                    <td>租户 Token 消耗排行数据</td>
                  </tr>
                </tbody>
              </table>

              <h2>3. 导出平台统计数据</h2>

              <h3>3.1 导出平台调用次数统计</h3>
              <ul>
                <li><strong>接口名称</strong>: 导出平台调用次数统计</li>
                <li>
                  <strong>逻辑描述</strong>:
                  导出平台调用次数统计数据为Excel文件。
                </li>
                <li>
                  <strong>接口相对路径</strong>:
                  <code>/api/platform/usage/export</code> (GET)
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
                    <td>tenantId</td>
                    <td>string</td>
                    <td>租户ID</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>tenantName</td>
                    <td>string</td>
                    <td>租户名称</td>
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
                    <td>员工名称</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>employeeType</td>
                    <td>string</td>
                    <td>员工类型</td>
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

              <h3>3.2 导出平台 Token 消耗统计</h3>
              <ul>
                <li><strong>接口名称</strong>: 导出平台 Token 消耗统计</li>
                <li>
                  <strong>逻辑描述</strong>: 导出平台 Token
                  消耗统计数据为Excel文件。
                </li>
                <li>
                  <strong>接口相对路径</strong>:
                  <code>/api/platform/token/export</code> (GET)
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
                    <td>tenantId</td>
                    <td>string</td>
                    <td>租户ID</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>tenantName</td>
                    <td>string</td>
                    <td>租户名称</td>
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
                    <td>员工名称</td>
                    <td>否</td>
                  </tr>
                  <tr>
                    <td>employeeType</td>
                    <td>string</td>
                    <td>员工类型</td>
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
    <!-- Header -->
    <div
      class="group relative flex min-h-[120px] w-full flex-col justify-center overflow-hidden rounded-[1.5rem] border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-lg"
    >
      <Icon
        icon="lucide:trending-up"
        class="pointer-events-none absolute -bottom-6 -right-6 size-40 text-white/5 transition-transform duration-700 group-hover:rotate-6"
      />
      <h1
        class="relative z-10 m-0 flex items-center gap-3 text-[1.8rem] font-extrabold tracking-tight text-white"
      >
        <Icon icon="lucide:globe-2" class="size-8" />
        平台数据统计中心
      </h1>
      <p
        class="relative z-10 m-0 mt-3 text-[13px] font-medium leading-relaxed text-slate-400"
      >
        <strong class="text-white">平台管理员专属</strong> ·
        全局掌控所有租户的调用频次与 Token 消耗情况，助力平台运营决策。
      </p>
    </div>

    <!-- 查询表单 -->
    <div
      class="rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm"
    >
      <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- 统计时间范围 -->
        <div class="flex items-center gap-2">
          <label class="w-24 shrink-0 text-sm font-bold text-slate-700"
            >统计时间范围</label
          >
          <DatePicker.RangePicker
            v-model:value="searchForm.timeRange"
            class="flex-1"
          />
        </div>

        <!-- 租户ID -->
        <div class="flex items-center gap-2">
          <label class="w-24 shrink-0 text-sm font-bold text-slate-700"
            >租户ID</label
          >
          <Input
            v-model:value="searchForm.tenantId"
            placeholder="请输入租户ID"
            class="flex-1"
          />
        </div>

        <!-- 租户名称 -->
        <div class="flex items-center gap-2">
          <label class="w-24 shrink-0 text-sm font-bold text-slate-700"
            >租户名称</label
          >
          <Input
            v-model:value="searchForm.tenantName"
            placeholder="请输入租户名称"
            class="flex-1"
          />
        </div>

        <!-- 员工ID -->
        <div class="flex items-center gap-2">
          <label class="w-24 shrink-0 text-sm font-bold text-slate-700"
            >员工ID</label
          >
          <Input
            v-model:value="searchForm.employeeId"
            placeholder="请输入员工ID"
            class="flex-1"
          />
        </div>
      </div>

      <div class="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- 员工名称 -->
        <div class="flex items-center gap-2">
          <label class="w-24 shrink-0 text-sm font-bold text-slate-700"
            >员工名称</label
          >
          <Input
            v-model:value="searchForm.employeeName"
            placeholder="请输入员工名称"
            class="flex-1"
          />
        </div>

        <!-- 员工类型 -->
        <div class="flex items-center gap-2">
          <label class="w-24 shrink-0 text-sm font-bold text-slate-700"
            >员工类型</label
          >
          <Select
            v-model:value="searchForm.employeeType"
            placeholder="请选择员工类型"
            class="flex-1"
            allow-clear
          >
            <Select.Option
              v-for="type in employeeTypeOptions"
              :key="type.value"
              :value="type.value"
            >
              {{ type.label }}
            </Select.Option>
          </Select>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="flex items-center justify-end gap-2">
        <Button
          @click="handleReset"
          class="flex items-center gap-2 !rounded-lg font-semibold"
        >
          <Icon icon="lucide:refresh-ccw" class="size-4" />
          重置
        </Button>
        <Button
          type="primary"
          @click="handleSearch"
          class="flex items-center gap-2 !rounded-lg font-semibold"
        >
          <Icon icon="lucide:search" class="size-4" />
          搜索
        </Button>
      </div>
    </div>

    <!-- Tab页签 -->
    <Tabs
      v-model:active-key="activeTab"
      @change="handleTabChange"
      class="modern-tabs"
    >
      <!-- 次数统计Tab -->
      <Tabs.TabPane key="usage">
        <template #tab>
          <span class="flex items-center gap-2 font-bold">
            <Icon icon="lucide:activity" class="size-4" />
            次数统计
          </span>
        </template>

        <!-- 统计卡片 -->
        <div class="mb-6 grid w-full grid-cols-2 gap-4 lg:grid-cols-5">
          <div
            v-for="(stat, idx) in usageStats"
            :key="idx"
            class="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div class="mb-2 flex items-center justify-between">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl"
                :class="[stat.bg, stat.color]"
              >
                <Icon :icon="stat.icon" class="size-5" />
              </div>
              <span
                class="text-xs font-bold"
                :class="stat.trendUp ? 'text-emerald-500' : 'text-red-500'"
              >
                {{ stat.trend }}
              </span>
            </div>
            <h4
              class="m-0 mt-1 text-3xl font-extrabold tracking-tight text-slate-800"
            >
              {{ stat.value }}
            </h4>
            <span class="mt-2 text-[13px] font-bold text-slate-700">{{
              stat.title
            }}</span>
            <span
              class="mt-0.5 text-[11px] font-medium leading-tight text-slate-400"
              >{{ stat.sub }}</span
            >
          </div>
        </div>

        <!-- 主内容区 -->
        <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <!-- 数据表格 -->
          <div
            class="relative flex flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm"
          >
            <div class="mb-6 flex items-center justify-between">
              <h3
                class="m-0 flex items-center gap-2 text-[16px] font-extrabold text-slate-800"
              >
                <Icon icon="lucide:list-checks" class="size-5 text-blue-500" />
                全平台次数统计明细
              </h3>
              <Button
                @click="handleExport"
                class="flex items-center gap-2 !rounded-lg text-xs font-semibold text-slate-500 hover:text-blue-600"
              >
                <Icon icon="lucide:download-cloud" class="size-4" />
                导出Excel
              </Button>
            </div>

            <table class="w-full">
              <thead class="bg-slate-50">
                <tr>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    租户ID
                  </th>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    租户名称
                  </th>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    员工ID
                  </th>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    员工名称
                  </th>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    员工类型
                  </th>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    调用次数
                  </th>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in usageTableData"
                  :key="item.id"
                  class="border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td class="px-4 py-3 font-mono text-sm text-slate-500">
                    {{ item.tenantId }}
                  </td>
                  <td class="px-4 py-3 text-sm font-bold text-slate-700">
                    {{ item.tenantName }}
                  </td>
                  <td class="px-4 py-3 font-mono text-sm text-slate-500">
                    {{ item.employeeId }}
                  </td>
                  <td class="px-4 py-3 text-sm font-bold text-slate-700">
                    {{ item.employeeName }}
                  </td>
                  <td class="px-4 py-3 text-sm">
                    {{ getEmployeeTypeText(item.employeeType) }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span
                        class="font-mono text-lg font-extrabold text-slate-800"
                        >{{ item.callCount }}</span
                      >
                      <span class="text-xs font-bold text-emerald-500">{{
                        item.trend
                      }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <Button
                      type="link"
                      size="small"
                      @click="handleViewTenantDetail(item)"
                      class="font-bold"
                    >
                      查看明细
                    </Button>
                  </td>
                </tr>
                <tr v-if="usageTableData.length === 0">
                  <td :colspan="7" class="px-4 py-8 text-center text-slate-400">
                    暂无数据
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 分页 -->
            <div
              v-if="total > 0"
              class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"
            >
              <span class="text-sm text-slate-500">
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
                  class="!rounded-lg"
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
                  class="!rounded-lg"
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>

          <!-- 右侧租户排行 -->
          <div
            class="relative flex h-full flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm"
          >
            <h3
              class="m-0 mb-6 flex items-center gap-2 text-[16px] font-extrabold text-slate-800"
            >
              <Icon icon="lucide:trophy" class="size-5 text-amber-500" />
              租户调用排行
            </h3>

            <div class="flex flex-1 flex-col gap-4">
              <div
                v-for="(item, i) in tenantUsageRanking"
                :key="i"
                class="flex flex-col gap-2 rounded-[1rem] border border-slate-200/60 bg-slate-50/70 p-4 shadow-sm transition-colors hover:border-slate-300"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      v-if="i < 3"
                      class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold text-white"
                      :style="{ backgroundColor: item.color }"
                    >
                      {{ i + 1 }}
                    </span>
                    <span
                      v-else
                      class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600"
                    >
                      {{ i + 1 }}
                    </span>
                    <span class="text-[13px] font-extrabold text-slate-700">{{
                      item.name
                    }}</span>
                  </div>
                  <div
                    class="font-mono text-[14px] font-bold"
                    :style="{ color: item.color }"
                  >
                    {{ item.percent }}%
                  </div>
                </div>
                <Progress
                  :percent="item.percent"
                  :show-info="false"
                  size="small"
                  :stroke-color="item.color"
                  trail-color="#e2e8f0"
                  class="!m-0 mt-1"
                />
                <div
                  class="mt-2 flex items-center justify-between border-t border-slate-100 pt-2"
                >
                  <span class="text-[11px] font-medium text-slate-400"
                    >累计调用次数</span
                  >
                  <span
                    class="font-mono text-[13px] font-extrabold text-slate-700"
                    >{{ item.count.toLocaleString() }}</span
                  >
                </div>
              </div>

              <!-- 提示信息 -->
              <div
                class="mt-4 flex gap-3 rounded-[1rem] border border-purple-200 bg-purple-50 p-4 shadow-inner"
              >
                <Icon
                  icon="lucide:lightbulb"
                  class="mt-0.5 size-5 shrink-0 text-purple-500"
                />
                <p
                  class="m-0 text-[12px] font-medium leading-relaxed text-purple-700"
                >
                  <strong class="font-extrabold">运营洞察：</strong>
                  Top 3 租户贡献了全平台 68%
                  的调用量，建议重点关注其服务质量与满意度。
                </p>
              </div>
            </div>
          </div>
        </div>
      </Tabs.TabPane>

      <!-- Token统计Tab -->
      <Tabs.TabPane key="token">
        <template #tab>
          <span class="flex items-center gap-2 font-bold">
            <Icon icon="lucide:key" class="size-4" />
            Token统计
          </span>
        </template>

        <!-- 统计卡片 -->
        <div class="mb-6 grid w-full grid-cols-2 gap-4 lg:grid-cols-3">
          <div
            v-for="(stat, idx) in tokenStats"
            :key="idx"
            class="group relative flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
          >
            <div class="mb-2 flex items-center justify-between">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-xl"
                :class="[stat.bg, stat.color]"
              >
                <Icon :icon="stat.icon" class="size-5" />
              </div>
              <span
                class="text-xs font-bold"
                :class="stat.trendUp ? 'text-emerald-500' : 'text-red-500'"
              >
                {{ stat.trend }}
              </span>
            </div>
            <h4
              class="m-0 mt-1 text-3xl font-extrabold tracking-tight text-slate-800"
            >
              {{ stat.value }}
            </h4>
            <span class="mt-2 text-[13px] font-bold text-slate-700">{{
              stat.title
            }}</span>
            <span
              class="mt-0.5 text-[11px] font-medium leading-tight text-slate-400"
              >{{ stat.sub }}</span
            >
          </div>
        </div>

        <!-- 主内容区 -->
        <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
          <!-- 数据表格 -->
          <div
            class="relative flex flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm"
          >
            <div class="mb-6 flex items-center justify-between">
              <h3
                class="m-0 flex items-center gap-2 text-[16px] font-extrabold text-slate-800"
              >
                <Icon icon="lucide:flame" class="size-5 text-orange-500" />
                全平台Token统计明细
              </h3>
              <Button
                @click="handleExport"
                class="flex items-center gap-2 !rounded-lg text-xs font-semibold text-slate-500 hover:text-blue-600"
              >
                <Icon icon="lucide:download-cloud" class="size-4" />
                导出Excel
              </Button>
            </div>

            <table class="w-full">
              <thead class="bg-slate-50">
                <tr>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    租户ID
                  </th>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    租户名称
                  </th>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    员工ID
                  </th>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    员工名称
                  </th>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    员工类型
                  </th>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    总消耗Token
                  </th>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in tokenTableData"
                  :key="item.id"
                  class="border-b border-slate-100 transition-colors hover:bg-slate-50"
                >
                  <td class="px-4 py-3 font-mono text-sm text-slate-500">
                    {{ item.tenantId }}
                  </td>
                  <td class="px-4 py-3 text-sm font-bold text-slate-700">
                    {{ item.tenantName }}
                  </td>
                  <td class="px-4 py-3 font-mono text-sm text-slate-500">
                    {{ item.employeeId }}
                  </td>
                  <td class="px-4 py-3 text-sm font-bold text-slate-700">
                    {{ item.employeeName }}
                  </td>
                  <td class="px-4 py-3 text-sm">
                    {{ getEmployeeTypeText(item.employeeType) }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span
                        class="font-mono text-lg font-extrabold text-orange-500"
                        >{{ item.totalTokens }}</span
                      >
                      <span class="text-xs font-bold text-emerald-500">{{
                        item.trend
                      }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <Button
                      type="link"
                      size="small"
                      @click="handleViewTenantDetail(item)"
                      class="font-bold"
                    >
                      查看明细
                    </Button>
                  </td>
                </tr>
                <tr v-if="tokenTableData.length === 0">
                  <td :colspan="7" class="px-4 py-8 text-center text-slate-400">
                    暂无数据
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- 分页 -->
            <div
              v-if="total > 0"
              class="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"
            >
              <span class="text-sm text-slate-500">
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
                  class="!rounded-lg"
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
                  class="!rounded-lg"
                >
                  下一页
                </Button>
              </div>
            </div>
          </div>

          <!-- 右侧租户排行 -->
          <div
            class="relative flex h-full flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm"
          >
            <h3
              class="m-0 mb-6 flex items-center gap-2 text-[16px] font-extrabold text-slate-800"
            >
              <Icon icon="lucide:award" class="size-5 text-orange-500" />
              租户Token消耗排行
            </h3>

            <div class="flex flex-1 flex-col gap-4">
              <div
                v-for="(item, i) in tenantTokenRanking"
                :key="i"
                class="flex flex-col gap-2 rounded-[1rem] border border-slate-200/60 bg-slate-50/70 p-4 shadow-sm transition-colors hover:border-slate-300"
              >
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span
                      v-if="i < 3"
                      class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-extrabold text-white"
                      :style="{ backgroundColor: item.color }"
                    >
                      {{ i + 1 }}
                    </span>
                    <span
                      v-else
                      class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600"
                    >
                      {{ i + 1 }}
                    </span>
                    <span class="text-[13px] font-extrabold text-slate-700">{{
                      item.name
                    }}</span>
                  </div>
                  <div
                    class="font-mono text-[14px] font-bold"
                    :style="{ color: item.color }"
                  >
                    {{ item.percent }}%
                  </div>
                </div>
                <Progress
                  :percent="item.percent"
                  :show-info="false"
                  size="small"
                  :stroke-color="item.color"
                  trail-color="#e2e8f0"
                  class="!m-0 mt-1"
                />
                <div
                  class="mt-2 flex items-center justify-between border-t border-slate-100 pt-2"
                >
                  <span class="text-[11px] font-medium text-slate-400"
                    >累计消耗Token</span
                  >
                  <span
                    class="font-mono text-[13px] font-extrabold text-slate-700"
                    >{{ item.tokens.toLocaleString() }}</span
                  >
                </div>
              </div>

              <!-- 提示信息 -->
              <div
                class="mt-4 flex gap-3 rounded-[1rem] border border-orange-200 bg-orange-50 p-4 shadow-inner"
              >
                <Icon
                  icon="lucide:alert-circle"
                  class="mt-0.5 size-5 shrink-0 text-orange-500"
                />
                <p
                  class="m-0 text-[12px] font-medium leading-relaxed text-orange-700"
                >
                  <strong class="font-extrabold">成本预警：</strong>
                  Top 2 租户消耗了全平台 50% 的
                  Token，建议优化模型配置和调用策略以控制成本。
                </p>
              </div>
            </div>
          </div>
        </div>
      </Tabs.TabPane>
    </Tabs>
  </div>
</template>

<style scoped>
@media (max-width: 767px) {
  .markdown-body {
    padding: 15px;
  }
}

.modern-tabs :deep(.ant-tabs-tab) {
  padding: 12px 20px;
  font-size: 14px;
}

.modern-tabs :deep(.ant-tabs-tab-active) {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 12px 12px 0 0;
}

.modern-tabs :deep(.ant-tabs-tab-active .ant-tabs-tab-btn) {
  color: white;
}

.modern-tabs :deep(.ant-tabs-ink-bar) {
  display: none;
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
