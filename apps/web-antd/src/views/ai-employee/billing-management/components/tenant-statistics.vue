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
    title: '本租户总调用次数',
    value: '12,580',
    sub: '累计服务调用总量',
    icon: 'lucide:activity',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    trend: '+12.5%',
    trendUp: true,
  },
  {
    title: '今日调用次数',
    value: '156',
    sub: '较昨日增长 23 次',
    icon: 'lucide:zap',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    trend: '+17.3%',
    trendUp: true,
  },
  {
    title: '本月调用次数',
    value: '3,250',
    sub: '本月累计调用总量',
    icon: 'lucide:calendar',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    trend: '+8.2%',
    trendUp: true,
  },
  {
    title: '活跃数字员工',
    value: '12',
    sub: '近30天有调用记录',
    icon: 'lucide:users',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    trend: '+2',
    trendUp: true,
  },
]);

// Token统计卡片数据
const tokenStats = ref([
  {
    title: '本租户总消耗Token',
    value: '1,250,000',
    sub: '累计Token消耗总量',
    icon: 'lucide:flame',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    trend: '+15.8%',
    trendUp: true,
  },
  {
    title: '今日消耗Token',
    value: '15,600',
    sub: '较昨日增长 2,100',
    icon: 'lucide:sparkles',
    color: 'text-cyan-500',
    bg: 'bg-cyan-50',
    trend: '+15.6%',
    trendUp: true,
  },
  {
    title: '本月消耗Token',
    value: '325,000',
    sub: '本月累计消耗总量',
    icon: 'lucide:trending-up',
    color: 'text-pink-500',
    bg: 'bg-pink-50',
    trend: '+9.5%',
    trendUp: true,
  },
]);

// 员工调用占比数据
const employeeUsageBreakdown = ref([
  { name: '智能客服助手', percent: 42, count: 1250, color: '#3b82f6' },
  { name: '销售助手', percent: 28, count: 980, color: '#8b5cf6' },
  { name: '财务RPA', percent: 18, count: 850, color: '#10b981' },
  { name: '审核机器人', percent: 12, count: 720, color: '#f59e0b' },
]);

// Token消耗占比数据
const tokenUsageBreakdown = ref([
  { name: '智能客服助手', percent: 38, tokens: 125_000, color: '#3b82f6' },
  { name: '销售助手', percent: 25, tokens: 98_000, color: '#8b5cf6' },
  { name: '财务RPA', percent: 20, tokens: 85_000, color: '#10b981' },
  { name: '审核机器人', percent: 17, tokens: 72_000, color: '#f59e0b' },
]);

// 次数使用统计示例数据
const usageMockData = [
  {
    id: '1',
    employeeId: 'AGENT001',
    employeeName: '智能客服助手',
    employeeType: 'chatbot',
    callCount: 1250,
    firstCallTime: '2026-03-15 09:00:00',
    lastCallTime: '2026-04-14 16:30:00',
    trend: '+15%',
  },
  {
    id: '2',
    employeeId: 'AGENT002',
    employeeName: '销售助手',
    employeeType: 'chatbot',
    callCount: 980,
    firstCallTime: '2026-03-16 10:00:00',
    lastCallTime: '2026-04-14 15:45:00',
    trend: '+12%',
  },
  {
    id: '3',
    employeeId: 'RPA001',
    employeeName: '财务RPA',
    employeeType: 'rpa',
    callCount: 850,
    firstCallTime: '2026-03-17 08:30:00',
    lastCallTime: '2026-04-14 14:20:00',
    trend: '+8%',
  },
  {
    id: '4',
    employeeId: 'AUDIT001',
    employeeName: '审核机器人',
    employeeType: 'audit-bot',
    callCount: 720,
    firstCallTime: '2026-03-18 11:00:00',
    lastCallTime: '2026-04-14 13:15:00',
    trend: '+5%',
  },
  {
    id: '5',
    employeeId: 'FIN001',
    employeeName: '财务机器人',
    employeeType: 'finance-bot',
    callCount: 680,
    firstCallTime: '2026-03-19 09:30:00',
    lastCallTime: '2026-04-14 12:00:00',
    trend: '+3%',
  },
];

// Token使用统计示例数据
const tokenMockData = [
  {
    id: '1',
    employeeId: 'AGENT001',
    employeeName: '智能客服助手',
    employeeType: 'chatbot',
    totalTokens: 125_000,
    firstUseTime: '2026-03-15 09:00:00',
    lastUseTime: '2026-04-14 16:30:00',
    trend: '+18%',
  },
  {
    id: '2',
    employeeId: 'AGENT002',
    employeeName: '销售助手',
    employeeType: 'chatbot',
    totalTokens: 98_000,
    firstUseTime: '2026-03-16 10:00:00',
    lastUseTime: '2026-04-14 15:45:00',
    trend: '+14%',
  },
  {
    id: '3',
    employeeId: 'RPA001',
    employeeName: '财务RPA',
    employeeType: 'rpa',
    totalTokens: 85_000,
    firstUseTime: '2026-03-17 08:30:00',
    lastUseTime: '2026-04-14 14:20:00',
    trend: '+10%',
  },
  {
    id: '4',
    employeeId: 'AUDIT001',
    employeeName: '审核机器人',
    employeeType: 'audit-bot',
    totalTokens: 72_000,
    firstUseTime: '2026-03-18 11:00:00',
    lastUseTime: '2026-04-14 13:15:00',
    trend: '+6%',
  },
  {
    id: '5',
    employeeId: 'FIN001',
    employeeName: '财务机器人',
    employeeType: 'finance-bot',
    totalTokens: 68_000,
    firstUseTime: '2026-03-19 09:30:00',
    lastUseTime: '2026-04-14 12:00:00',
    trend: '+4%',
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

// 查看明细
const handleViewDetail = (item: any) => {
  message.info(`查看 ${item.employeeName} 的使用明细`);
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
      title="租户数据统计接口文档"
      width="800px"
    >
      <Card class="min-h-[500px]">
        <Spin :spinning="false">
          <div class="min-h-[500px]">
            <!-- eslint-disable-next-line vue/no-v-html -->
            <article class="markdown-body">
              <h1>租户数据统计接口文档</h1>
              <p>
                本文档描述了租户数据统计模块的相关接口，用于展示租户的数字员工调用统计和
                Token 消耗情况。
              </p>

              <h2>1. 页面设计逻辑</h2>

              <h3>1.1 页面结构</h3>
              <ul>
                <li><strong>页面头部</strong>: 展示租户信息和页面标题</li>
                <li>
                  <strong>查询条件区</strong>:
                  包含统计时间范围、数字员工ID、员工名称、员工类型等筛选条件
                </li>
                <li>
                  <strong>Tab页签</strong>: 分为次数统计和 Token 统计两个 Tab
                </li>
                <li>
                  <strong>统计卡片区</strong>:
                  展示关键统计指标，如总调用次数、今日调用次数、总消耗 Token 等
                </li>
                <li>
                  <strong>数据表格区</strong>:
                  展示详细的统计数据，包括数字员工的调用次数和 Token 消耗情况
                </li>
                <li>
                  <strong>占比分析区</strong>: 展示各数字员工的调用占比和 Token
                  消耗占比
                </li>
                <li><strong>分页区</strong>: 提供分页功能，方便查看大量数据</li>
              </ul>

              <h3>1.2 核心功能</h3>
              <ul>
                <li>
                  <strong>数据筛选</strong>:
                  支持按时间范围、员工ID、员工名称和员工类型进行筛选
                </li>
                <li><strong>数据导出</strong>: 支持导出统计数据</li>
                <li><strong>数据刷新</strong>: 支持手动刷新数据</li>
                <li><strong>分页导航</strong>: 支持上下页导航</li>
                <li>
                  <strong>明细查看</strong>: 支持查看数字员工的详细使用情况
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

              <h2>2. 租户数据统计查询</h2>

              <h3>2.1 获取租户调用次数统计</h3>
              <ul>
                <li><strong>接口名称</strong>: 获取租户调用次数统计</li>
                <li>
                  <strong>逻辑描述</strong>:
                  获取租户数字员工的调用次数统计数据，支持按多个条件进行筛选。
                </li>
                <li>
                  <strong>接口相对路径</strong>:
                  <code>/api/tenant/usage</code> (GET)
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
                    <td>UsageStat[]</td>
                    <td>调用次数统计列表</td>
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
                    <td>data.breakdown</td>
                    <td>object[]</td>
                    <td>占比分析数据</td>
                  </tr>
                </tbody>
              </table>

              <h3>2.2 获取租户 Token 消耗统计</h3>
              <ul>
                <li><strong>接口名称</strong>: 获取租户 Token 消耗统计</li>
                <li>
                  <strong>逻辑描述</strong>: 获取租户数字员工的 Token
                  消耗统计数据，支持按多个条件进行筛选。
                </li>
                <li>
                  <strong>接口相对路径</strong>:
                  <code>/api/tenant/token</code> (GET)
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
                    <td>TokenStat[]</td>
                    <td>Token 消耗统计列表</td>
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
                    <td>data.breakdown</td>
                    <td>object[]</td>
                    <td>占比分析数据</td>
                  </tr>
                </tbody>
              </table>

              <h2>3. 导出租户统计数据</h2>

              <h3>3.1 导出租户调用次数统计</h3>
              <ul>
                <li><strong>接口名称</strong>: 导出租户调用次数统计</li>
                <li>
                  <strong>逻辑描述</strong>:
                  导出租户调用次数统计数据为Excel文件。
                </li>
                <li>
                  <strong>接口相对路径</strong>:
                  <code>/api/tenant/usage/export</code> (GET)
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

              <h3>3.2 导出租户 Token 消耗统计</h3>
              <ul>
                <li><strong>接口名称</strong>: 导出租户 Token 消耗统计</li>
                <li>
                  <strong>逻辑描述</strong>: 导出租户 Token
                  消耗统计数据为Excel文件。
                </li>
                <li>
                  <strong>接口相对路径</strong>:
                  <code>/api/tenant/token/export</code> (GET)
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
        icon="lucide:bar-chart-3"
        class="pointer-events-none absolute -bottom-6 -right-6 size-40 text-white/5 transition-transform duration-700 group-hover:rotate-6"
      />
      <h1
        class="relative z-10 m-0 flex items-center gap-3 text-[1.8rem] font-extrabold tracking-tight text-white"
      >
        <Icon icon="lucide:building-2" class="size-8" />
        租户数据统计中心
      </h1>
      <p
        class="relative z-10 m-0 mt-3 text-[13px] font-medium leading-relaxed text-slate-400"
      >
        当前租户：<strong class="text-white">示例企业租户 (T-10001)</strong>
        <br />全面追踪数字员工调用频次与 Token 消耗情况，助力精细化运营管理。
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

        <!-- 数字员工ID -->
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
        <div class="mb-6 grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
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
                次数使用统计明细
              </h3>
              <Button
                @click="handleExport"
                class="flex items-center gap-2 !rounded-lg text-xs font-semibold text-slate-500 hover:text-blue-600"
              >
                <Icon icon="lucide:download-cloud" class="size-4" />
                导出
              </Button>
            </div>

            <table class="w-full">
              <thead class="bg-slate-50">
                <tr>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    数字员工ID
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
                    首次调用
                  </th>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    最后调用
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
                  <td class="px-4 py-3 text-xs text-slate-500">
                    {{ item.firstCallTime }}
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-500">
                    {{ item.lastCallTime }}
                  </td>
                  <td class="px-4 py-3">
                    <Button
                      type="link"
                      size="small"
                      @click="handleViewDetail(item)"
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

          <!-- 右侧占比分析 -->
          <div
            class="relative flex h-full flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm"
          >
            <h3
              class="m-0 mb-6 flex items-center gap-2 text-[16px] font-extrabold text-slate-800"
            >
              <Icon icon="lucide:pie-chart" class="size-5 text-purple-500" />
              员工调用占比分析
            </h3>

            <div class="flex flex-1 flex-col gap-4">
              <div
                v-for="(item, i) in employeeUsageBreakdown"
                :key="i"
                class="flex flex-col gap-2 rounded-[1rem] border border-slate-200/60 bg-slate-50/70 p-4 shadow-sm transition-colors hover:border-slate-300"
              >
                <div class="flex items-center justify-between">
                  <div class="text-[13px] font-extrabold text-slate-700">
                    {{ item.name }}
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
                    >{{ item.count }}</span
                  >
                </div>
              </div>

              <!-- 提示信息 -->
              <div
                class="mt-4 flex gap-3 rounded-[1rem] border border-blue-200 bg-blue-50 p-4 shadow-inner"
              >
                <Icon
                  icon="lucide:info"
                  class="mt-0.5 size-5 shrink-0 text-blue-500"
                />
                <p
                  class="m-0 text-[12px] font-medium leading-relaxed text-blue-700"
                >
                  <strong class="font-extrabold">数据洞察：</strong>
                  智能客服助手调用频次最高，建议关注其服务质量和响应效率，持续优化用户体验。
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
                Token使用统计明细
              </h3>
              <Button
                @click="handleExport"
                class="flex items-center gap-2 !rounded-lg text-xs font-semibold text-slate-500 hover:text-blue-600"
              >
                <Icon icon="lucide:download-cloud" class="size-4" />
                导出
              </Button>
            </div>

            <table class="w-full">
              <thead class="bg-slate-50">
                <tr>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    数字员工ID
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
                    首次使用
                  </th>
                  <th
                    class="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-bold text-slate-600"
                  >
                    最后使用
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
                  <td class="px-4 py-3 text-xs text-slate-500">
                    {{ item.firstUseTime }}
                  </td>
                  <td class="px-4 py-3 text-xs text-slate-500">
                    {{ item.lastUseTime }}
                  </td>
                  <td class="px-4 py-3">
                    <Button
                      type="link"
                      size="small"
                      @click="handleViewDetail(item)"
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

          <!-- 右侧占比分析 -->
          <div
            class="relative flex h-full flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm"
          >
            <h3
              class="m-0 mb-6 flex items-center gap-2 text-[16px] font-extrabold text-slate-800"
            >
              <Icon icon="lucide:pie-chart" class="size-5 text-orange-500" />
              Token消耗占比分析
            </h3>

            <div class="flex flex-1 flex-col gap-4">
              <div
                v-for="(item, i) in tokenUsageBreakdown"
                :key="i"
                class="flex flex-col gap-2 rounded-[1rem] border border-slate-200/60 bg-slate-50/70 p-4 shadow-sm transition-colors hover:border-slate-300"
              >
                <div class="flex items-center justify-between">
                  <div class="text-[13px] font-extrabold text-slate-700">
                    {{ item.name }}
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
                    >{{ item.tokens }}</span
                  >
                </div>
              </div>

              <!-- 提示信息 -->
              <div
                class="mt-4 flex gap-3 rounded-[1rem] border border-orange-200 bg-orange-50 p-4 shadow-inner"
              >
                <Icon
                  icon="lucide:alert-triangle"
                  class="mt-0.5 size-5 shrink-0 text-orange-500"
                />
                <p
                  class="m-0 text-[12px] font-medium leading-relaxed text-orange-700"
                >
                  <strong class="font-extrabold">成本优化建议：</strong>
                  智能客服助手 Token
                  消耗最高，建议优化提示词长度和响应策略，降低运营成本。
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
