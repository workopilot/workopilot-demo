<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Alert,
  Avatar,
  Button,
  Drawer,
  Empty,
  Form,
  FormItem,
  Input,
  InputNumber,
  Modal,
  Progress,
  RadioButton,
  RadioGroup,
  Select,
  Space,
  Switch,
  TabPane,
  Table,
  Tabs,
  Tag,
  message,
} from 'ant-design-vue';

interface PerformanceRow {
  actual?: number;
  avatar: string;
  code: string;
  coverage: '部分覆盖' | '未采集' | '正常';
  department: string;
  employee: string;
  employeeId: string;
  key: string;
  metric: string;
  metricType?: 'count' | 'duration' | 'staged';
  direction?: 'higher' | 'lower';
  status: '进行中' | '数据不足' | '未设目标' | '已达标';
  target?: number;
  unit: string;
  updated: string;
}

const router = useRouter();
const activeTab = ref('targets');
const periodType = ref('month');
const period = ref('2026-09');
const employeeFilter = ref('all');
const statusFilter = ref('all');
const targetModalOpen = ref(false);
const metricModalOpen = ref(false);
const metricDrawerOpen = ref(false);
const metricEditingKey = ref<string>();
const reportModalOpen = ref(false);
const guideOpen = ref(false);
const targetValue = ref(300);
const targetNote = ref('');
const metricForm = ref({ code: '', direction: 'higher', name: '', rule: '', save: true, type: 'count', unit: '次' });
const reportValue = ref(1);

const rows = ref<PerformanceRow[]>([
  { key: 'order-1', employeeId: 'order', employee: '订单录入助理', avatar: '/auditdemo/images/ai-employee/sales.png', department: '销售运营部', metric: '订单录入量', code: 'order_entry_count', metricType: 'count', unit: '单', target: 420, actual: 326, status: '进行中', coverage: '正常', updated: '2 分钟前' },
  { key: 'order-2', employeeId: 'order', employee: '订单录入助理', avatar: '/auditdemo/images/ai-employee/sales.png', department: '销售运营部', metric: '订单录入平均耗时', code: 'order_entry_duration', metricType: 'duration', direction: 'lower', unit: '分钟', target: 3, actual: 3.8, status: '进行中', coverage: '正常', updated: '2 分钟前' },
  { key: 'order-3', employeeId: 'order', employee: '订单录入助理', avatar: '/auditdemo/images/ai-employee/sales.png', department: '销售运营部', metric: '订单全流程平均耗时', code: 'order_full_process_duration', metricType: 'staged', direction: 'lower', unit: '分钟', target: 8, actual: 9.6, status: '进行中', coverage: '正常', updated: '2 分钟前' },
  { key: '1', employeeId: 'ops', employee: '运维智能助手', avatar: '/auditdemo/images/ai-employee/技术员.jpg', department: '信息技术部', metric: '已解决工单数', code: 'ticket_resolved_count', unit: '单', target: 300, actual: 240, status: '进行中', coverage: '正常', updated: '5 分钟前' },
  { key: '2', employeeId: 'ops', employee: '运维智能助手', avatar: '/auditdemo/images/ai-employee/技术员.jpg', department: '信息技术部', metric: '使用人数', code: 'sys_active_user_count', unit: '人', target: 50, actual: 42, status: '进行中', coverage: '正常', updated: '5 分钟前' },
  { key: '3', employeeId: 'ops', employee: '运维智能助手', avatar: '/auditdemo/images/ai-employee/技术员.jpg', department: '信息技术部', metric: '有效使用时长', code: 'sys_active_usage_seconds', unit: '小时', actual: 62.5, status: '未设目标', coverage: '部分覆盖', updated: '5 分钟前' },
  { key: '4', employeeId: 'ppt-a', employee: '演示文稿设计师 A', avatar: '/auditdemo/images/ai-employee/设计师.jpg', department: '品牌市场部', metric: 'PPT 数', code: 'ppt_completed_count', unit: '份', target: 20, actual: 24, status: '已达标', coverage: '正常', updated: '12 分钟前' },
  { key: '5', employeeId: 'ppt-b', employee: '演示文稿设计师 B', avatar: '/auditdemo/images/ai-employee/插画设计师.jpg', department: '售前支持部', metric: 'PPT 数', code: 'ppt_completed_count', unit: '份', target: 50, actual: 31, status: '进行中', coverage: '正常', updated: '18 分钟前' },
  { key: '6', employeeId: 'office', employee: '办公协作助手', avatar: '/auditdemo/images/ai-employee/咨询人员.jpg', department: '总裁办公室', metric: '周报数量', code: 'weekly_report_count', unit: '份', target: 4, actual: 1, status: '进行中', coverage: '正常', updated: '26 分钟前' },
  { key: '7', employeeId: 'office', employee: '办公协作助手', avatar: '/auditdemo/images/ai-employee/咨询人员.jpg', department: '总裁办公室', metric: '有效使用时长', code: 'sys_active_usage_seconds', unit: '小时', target: 30, status: '数据不足', coverage: '未采集', updated: '尚未更新' },
]);

const dimensions = ref([
  { key: 'order-1', name: '订单录入量', code: 'order_entry_count', type: '数量累计', unit: '单', method: '按量累计', direction: '越高越好', source: '员工专用', robots: 1, enabled: true, rule: '订单完成录入且通过格式校验后计入，重复订单按业务单号去重。' },
  { key: 'order-2', name: '订单录入平均耗时', code: 'order_entry_duration', type: '单段耗时', unit: '分钟', method: '平均值', direction: '越低越好', source: '员工专用', robots: 1, enabled: true, rule: '从收到有效订单到完成结构化录入，剔除人工等待与异常暂停时间。' },
  { key: 'order-3', name: '订单全流程平均耗时', code: 'order_full_process_duration', type: '多阶段耗时', unit: '秒', method: '接口上报', direction: '越低越好', source: '员工专用', robots: 1, enabled: true, rule: '业务接口按阶段编码上报每段实际耗时，平台汇总订单录入、转换单据和写入业务系统三个阶段。' },
  { key: '1', name: '已解决工单数', code: 'ticket_resolved_count', unit: '单', method: '按量累计', source: '租户维度库', robots: 2, enabled: true, rule: '工单解决且通过确认后计入；重开时冲正。' },
  { key: '2', name: 'PPT 数', code: 'ppt_completed_count', unit: '份', method: '按量累计', source: '租户维度库', robots: 3, enabled: true, rule: 'PPT 文件完成交付并通过业务确认后计入。' },
  { key: '3', name: '周报数量', code: 'weekly_report_count', unit: '份', method: '按量累计', source: '员工专用', robots: 1, enabled: true, rule: '周报生成并由提交人确认后计入。' },
  { key: '4', name: '使用人数', code: 'sys_active_user_count', unit: '人', method: '周期去重', source: '平台内置', robots: 12, enabled: true, rule: '周期内至少发生一次有效使用行为的去重用户。' },
  { key: '5', name: '有效使用时长', code: 'sys_active_usage_seconds', unit: '秒', method: '区间并集', source: '平台内置', robots: 12, enabled: true, rule: '页面前台可见且用户近 120 秒有主动操作时计时。' },
]);

const sources = ref([
  { key: 'order', name: '订单业务系统', code: 'order-erp-prod', scope: '订单录入助理 / 数量与三阶段耗时', last: '2026-09-21 14:29', success: '99.6%', enabled: true },
  { key: '1', name: '运维工单系统', code: 'itsm-prod', scope: '运维智能助手 / 已解决工单数', last: '2026-09-21 14:26', success: '99.8%', enabled: true },
  { key: '2', name: '文档生成中心', code: 'doc-center', scope: '3 名员工 / PPT 数、周报数量', last: '2026-09-21 14:19', success: '98.6%', enabled: true },
  { key: '3', name: '历史数据补录', code: 'manual-import', scope: '全部员工 / 已授权维度', last: '2026-09-18 09:42', success: '100%', enabled: false },
]);

const filteredRows = computed(() => rows.value.filter((row) =>
  (employeeFilter.value === 'all' || row.employeeId === employeeFilter.value)
  && (statusFilter.value === 'all' || row.status === statusFilter.value),
));
const targetRows = computed(() => rows.value.filter((row) => row.target !== undefined));

function completion(row: PerformanceRow) {
  if (!row.target || row.actual === undefined) return null;
  if (row.direction === 'lower') return Math.round((row.target / Math.max(row.actual, 0.01)) * 100);
  return Math.round((row.actual / row.target) * 100);
}

const metricTypeMeta = {
  count: { label: '数量累计', icon: 'lucide:hash', description: '统计订单、工单、文档等产出数量', color: 'blue' },
  duration: { label: '单段耗时', icon: 'lucide:timer', description: '记录一段业务动作的开始、结束与净耗时', color: 'orange' },
  staged: { label: '多阶段耗时', icon: 'lucide:workflow', description: '定义多个阶段编号，实际耗时由业务接口逐段上报', color: 'purple' },
} as const;
const selectedMetricTypeMeta = computed(() => metricTypeMeta[metricForm.value.type as keyof typeof metricTypeMeta]);

const orderStages = ref([
  { key: '1', order: 1, name: '订单录入', code: 'order_entry', unit: '秒', description: '从接收订单到完成结构化信息录入的处理耗时。' },
  { key: '2', order: 2, name: '转换业务单据', code: 'document_convert', unit: '秒', description: '将结构化订单转换为标准业务单据的处理耗时。' },
  { key: '3', order: 3, name: '写入业务系统', code: 'erp_writeback', unit: '秒', description: '从提交写入请求到业务系统返回成功回执的耗时。' },
]);
const selectedStageKey = ref('1');
const selectedStage = computed(() => orderStages.value.find((item) => item.key === selectedStageKey.value));

function saveTarget() {
  targetModalOpen.value = false;
  message.success(`已保存 2026 年 9 月目标：${targetValue.value} 单`);
}

function saveMetric() {
  if (!metricForm.value.name || !metricForm.value.code || !metricForm.value.rule) {
    message.warning('请填写维度名称、编码和统计口径');
    return;
  }
  const payload = {
    key: metricEditingKey.value ?? String(Date.now()), name: metricForm.value.name, code: metricForm.value.code,
    unit: metricForm.value.unit,
    type: metricTypeMeta[metricForm.value.type as keyof typeof metricTypeMeta].label,
    method: metricForm.value.type === 'count' ? '按量累计' : metricForm.value.type === 'duration' ? '平均值' : '接口上报',
    direction: metricForm.value.type === 'count' ? '越高越好' : '越低越好',
    source: metricForm.value.save ? '租户维度库' : '员工专用',
    robots: 0, enabled: true, rule: metricForm.value.rule,
  };
  if (metricEditingKey.value) {
    const index = dimensions.value.findIndex((item) => item.key === metricEditingKey.value);
    if (index >= 0) dimensions.value.splice(index, 1, payload);
  } else {
    dimensions.value.unshift(payload);
  }
  metricDrawerOpen.value = false;
  message.success(metricEditingKey.value ? '考核维度已更新' : '考核维度已创建');
}

function openMetricTypePicker() {
  metricEditingKey.value = undefined;
  metricForm.value = { code: '', direction: 'higher', name: '', rule: '', save: true, type: 'count', unit: '次' };
  metricModalOpen.value = true;
}

function continueMetricSetup() {
  metricForm.value.unit = metricForm.value.type === 'count' ? '单' : '分钟';
  metricForm.value.direction = metricForm.value.type === 'count' ? 'higher' : 'lower';
  metricModalOpen.value = false;
  metricDrawerOpen.value = true;
}

function editMetric(record: (typeof dimensions.value)[number]) {
  const type = record.type === '多阶段耗时' ? 'staged' : record.type === '单段耗时' ? 'duration' : 'count';
  metricEditingKey.value = record.key;
  metricForm.value = {
    code: record.code,
    direction: type === 'count' ? 'higher' : 'lower',
    name: record.name,
    rule: record.rule,
    save: record.source !== '员工专用',
    type,
    unit: record.unit,
  };
  selectedStageKey.value = orderStages.value[0]?.key ?? '';
  metricDrawerOpen.value = true;
}

function addStage() {
  const key = String(Date.now());
  orderStages.value.push({ key, order: orderStages.value.length + 1, name: `新阶段 ${orderStages.value.length + 1}`, code: '', unit: '秒', description: '' });
  selectedStageKey.value = key;
}

function removeStage(key: string) {
  if (orderStages.value.length <= 1) {
    message.warning('多时段指标至少需要保留一个阶段');
    return;
  }
  orderStages.value = orderStages.value.filter((item) => item.key !== key).map((item, index) => ({ ...item, order: index + 1 }));
  selectedStageKey.value = orderStages.value[0]?.key ?? '';
}

function submitReport() {
  const ticket = rows.value.find((row) => row.code === 'ticket_resolved_count');
  if (ticket) ticket.actual = (ticket.actual ?? 0) + Number(reportValue.value || 0);
  reportModalOpen.value = false;
  message.success('业绩事件提交成功，汇总结果已更新');
}

const statusColor: Record<string, string> = { 已达标: 'success', 进行中: 'processing', 数据不足: 'warning', 未设目标: 'default' };
const coverageColor: Record<string, string> = { 正常: 'green', 部分覆盖: 'orange', 未采集: 'red' };
</script>

<template>
  <main class="min-h-[calc(100vh-100px)] bg-slate-50/70 p-4 md:p-6 xl:p-8">
    <div class="mx-auto max-w-[1600px]">
      <header class="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div class="mb-2 flex items-center gap-2 text-sm font-medium"><span class="rounded-md bg-blue-50 px-2 py-1 text-blue-600">数字员工中心</span><Icon icon="lucide:chevron-right" class="size-4 text-slate-400" /><span class="text-slate-500">绩效管理</span></div>
          <h1 class="m-0 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">数字绩效设置</h1>
          <p class="mb-0 mt-2 text-sm text-slate-500">配置员工考核目标、维度定义和业绩数据来源。</p>
        </div>
        <Space wrap>
          <Button @click="guideOpen = true"><Icon icon="lucide:circle-help" class="mr-1" />口径说明</Button>
          <Button @click="reportModalOpen = true"><Icon icon="lucide:flask-conical" class="mr-1" />模拟上报</Button>
          <Button type="primary" @click="targetModalOpen = true"><Icon icon="lucide:plus" class="mr-1" />新建目标</Button>
        </Space>
      </header>

      <section class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Tabs v-model:active-key="activeTab" class="performance-tabs px-4 md:px-6">
          <TabPane v-if="false" key="overview">
            <template #tab><span class="flex items-center gap-2"><Icon icon="lucide:layout-dashboard" />绩效总览</span></template>
            <div class="pb-6 pt-2">
              <div class="mb-5 flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 xl:flex-row xl:items-center">
                <div class="flex flex-wrap items-center gap-3">
                  <RadioGroup v-model:value="periodType" button-style="solid"><RadioButton value="month">月度</RadioButton><RadioButton value="quarter">季度</RadioButton></RadioGroup>
                  <Select v-model:value="period" class="w-36" :options="periodType === 'month' ? [{value:'2026-09',label:'2026 年 9 月'},{value:'2026-08',label:'2026 年 8 月'}] : [{value:'2026-Q3',label:'2026 年 Q3'},{value:'2026-Q2',label:'2026 年 Q2'}]" />
                  <Select v-model:value="employeeFilter" class="w-44" :options="[{value:'all',label:'全部员工'},{value:'ops',label:'运维智能助手'},{value:'ppt-a',label:'演示文稿设计师 A'},{value:'ppt-b',label:'演示文稿设计师 B'},{value:'office',label:'办公协作助手'}]" />
                  <Select v-model:value="statusFilter" class="w-32" :options="[{value:'all',label:'全部状态'},{value:'已达标',label:'已达标'},{value:'进行中',label:'进行中'},{value:'数据不足',label:'数据不足'}]" />
                </div>
                <div class="flex items-center gap-2 text-xs text-slate-500"><span class="size-2 rounded-full bg-emerald-500"></span>数据更新至 2026-09-21 14:30</div>
              </div>

              <div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <article class="stat-card"><span class="stat-icon bg-blue-50 text-blue-600"><Icon icon="lucide:users" /></span><p>参与考核员工</p><b>12 <small>名</small></b><em class="text-blue-600">覆盖 4 条业务线</em></article>
                <article class="stat-card"><span class="stat-icon bg-emerald-50 text-emerald-600"><Icon icon="lucide:badge-check" /></span><p>已达标目标</p><b>18 / 30 <small>项</small></b><em class="text-emerald-600">达标率 60%</em></article>
                <article class="stat-card"><span class="stat-icon bg-violet-50 text-violet-600"><Icon icon="lucide:user-check" /></span><p>全租户去重使用人数</p><b>168 <small>人</small></b><em class="text-violet-600">较上月 +12.8%</em></article>
                <article class="stat-card"><span class="stat-icon bg-amber-50 text-amber-600"><Icon icon="lucide:clock-3" /></span><p>员工有效使用人时合计</p><b>326.5 <small>h</small></b><em class="text-amber-600">3 个入口已覆盖</em></article>
              </div>

              <Alert class="mb-5" type="warning" show-icon message="当前有 2 项数据不足、1 个入口未接入时长采集" description="数据不足项不计入达标率分母。办公协作助手的嵌入业务页尚未接入活动采集。" />
              <div class="mb-3 flex items-center justify-between"><div><h2 class="m-0 text-base font-bold text-slate-800">员工绩效明细</h2><p class="mb-0 mt-1 text-xs text-slate-500">每行对应一个员工考核维度，目标与实际分别计算。</p></div><Button size="small"><Icon icon="lucide:download" class="mr-1" />导出</Button></div>
              <Table :data-source="filteredRows" :pagination="false" row-key="key" :scroll="{ x: 1120 }">
                <Table.Column title="数字员工" key="employee" :width="235" fixed="left"><template #default="{ record }"><button class="flex items-center gap-3 text-left" @click="router.push(`/digital-employees/performance/${record.employeeId}`)"><Avatar :size="40" :src="record.avatar" /><span><b class="block text-sm text-slate-800 hover:text-blue-600">{{ record.employee }}</b><small class="text-slate-400">{{ record.department }}</small></span></button></template></Table.Column>
                <Table.Column title="绩效维度" key="metric" :width="190"><template #default="{ record }"><div class="font-medium text-slate-800">{{ record.metric }}</div><code class="text-[11px] text-slate-400">{{ record.code }}</code></template></Table.Column>
                <Table.Column title="目标" key="target" :width="110"><template #default="{ record }"><button v-if="record.target !== undefined" class="font-semibold text-slate-700 hover:text-blue-600" @click="targetModalOpen = true">{{ record.target }} {{ record.unit }}</button><span v-else class="text-slate-400">未设目标</span></template></Table.Column>
                <Table.Column title="实际" key="actual" :width="110"><template #default="{ record }"><button v-if="record.actual !== undefined" class="font-bold text-slate-900 hover:text-blue-600" @click="router.push(`/digital-employees/performance/${record.employeeId}`)">{{ record.actual }} {{ record.unit }}</button><span v-else class="text-slate-400">—</span></template></Table.Column>
                <Table.Column title="完成率" key="rate" :width="205"><template #default="{ record }"><div v-if="completion(record) !== null" class="flex items-center gap-3"><Progress :percent="Math.min(completion(record)!, 100)" :show-info="false" :stroke-color="completion(record)! >= 100 ? '#10b981' : '#2563eb'" class="!m-0 w-28" /><span class="w-12 font-semibold" :class="completion(record)! >= 100 ? 'text-emerald-600' : 'text-slate-700'">{{ completion(record) }}%</span></div><span v-else class="text-slate-400">—</span></template></Table.Column>
                <Table.Column title="状态" key="status" :width="105"><template #default="{ record }"><Tag :color="statusColor[record.status]">{{ record.status }}</Tag></template></Table.Column>
                <Table.Column title="采集覆盖" key="coverage" :width="110"><template #default="{ record }"><Tag :color="coverageColor[record.coverage]">{{ record.coverage }}</Tag></template></Table.Column>
                <Table.Column title="更新时间" data-index="updated" :width="110" />
                <Table.Column title="操作" key="action" :width="90" fixed="right"><template #default="{ record }"><Button type="link" size="small" @click="router.push(`/digital-employees/performance/${record.employeeId}`)">查看详情</Button></template></Table.Column>
                <template #emptyText><Empty description="当前筛选条件下没有绩效数据" /></template>
              </Table>
            </div>
          </TabPane>

          <TabPane key="targets">
            <template #tab><span class="flex items-center gap-2"><Icon icon="lucide:target" />目标管理</span></template>
            <div class="pb-6 pt-2"><div class="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 class="m-0 text-base font-bold text-slate-800">2026 年 9 月目标</h2><p class="mb-0 mt-1 text-xs text-slate-500">集中维护每名员工、每个维度的独立周期目标。</p></div><Space><Button>复制上一周期</Button><Button type="primary" @click="targetModalOpen = true">新建目标</Button></Space></div>
              <Table :data-source="targetRows" row-key="key" :pagination="{ pageSize: 6 }" :scroll="{ x: 900 }"><Table.Column title="员工" data-index="employee" :width="180" /><Table.Column title="考核维度" data-index="metric" :width="170" /><Table.Column title="目标值" key="target" :width="110"><template #default="{record}"><b>{{ record.target }} {{ record.unit }}</b></template></Table.Column><Table.Column title="实际值" key="actual" :width="110"><template #default="{record}">{{ record.actual ?? '—' }} {{ record.actual === undefined ? '' : record.unit }}</template></Table.Column><Table.Column title="完成率" key="rate" :width="100"><template #default="{record}">{{ completion(record) === null ? '—' : `${completion(record)}%` }}</template></Table.Column><Table.Column title="版本" :width="70"><template #default>V2</template></Table.Column><Table.Column title="结算状态" :width="100"><template #default><Tag color="processing">考核中</Tag></template></Table.Column><Table.Column title="操作" :width="135" fixed="right"><template #default><Button type="link" size="small" @click="targetModalOpen = true">修订</Button><Button type="link" size="small">记录</Button></template></Table.Column></Table>
            </div>
          </TabPane>

          <TabPane key="dimensions">
            <template #tab><span class="flex items-center gap-2"><Icon icon="lucide:ruler" />考核维度库</span></template>
            <div class="pb-6 pt-2">
              <div class="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                <article v-for="(meta,key) in metricTypeMeta" :key="key" class="metric-type-card"><span :class="`metric-type-${key}`"><Icon :icon="meta.icon" /></span><div><div class="flex items-center gap-2"><b>{{ meta.label }}</b><Tag :color="meta.color">{{ dimensions.filter((item) => item.type === meta.label || (!item.type && key === 'count')).length }} 项</Tag></div><p>{{ meta.description }}</p></div></article>
              </div>
              <div class="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 class="m-0 text-base font-bold text-slate-800">维度定义</h2><p class="mb-0 mt-1 text-xs text-slate-500">定义统计对象、聚合方式与达标方向；多时段指标的阶段也在同一编辑抽屉中管理。</p></div><Button type="primary" @click="openMetricTypePicker"><Icon icon="lucide:plus" class="mr-1" />新建绩效指标</Button></div>
              <Table :data-source="dimensions" row-key="key" :pagination="false" :scroll="{ x: 1180 }"><Table.Column title="维度" key="name" :width="220"><template #default="{record}"><b class="block text-slate-800">{{ record.name }}</b><code class="text-[11px] text-slate-400">{{ record.code }}</code></template></Table.Column><Table.Column title="指标类型" key="type" :width="110"><template #default="{record}"><Tag :color="record.type === '多阶段耗时' ? 'purple' : record.type === '单段耗时' ? 'orange' : 'blue'">{{ record.type || '数量累计' }}</Tag></template></Table.Column><Table.Column title="统计方式" data-index="method" :width="100" /><Table.Column title="达标方向" key="direction" :width="95"><template #default="{record}"><span :class="record.direction === '越低越好' ? 'text-orange-600' : 'text-emerald-600'">{{ record.direction || '越高越好' }}</span></template></Table.Column><Table.Column title="单位" data-index="unit" :width="70" /><Table.Column title="来源" key="source" :width="115"><template #default="{record}"><Tag :color="record.source === '平台内置' ? 'purple' : record.source === '员工专用' ? 'orange' : 'blue'">{{ record.source }}</Tag></template></Table.Column><Table.Column title="统计口径" data-index="rule" :width="330" /><Table.Column title="关联员工" key="robots" :width="90"><template #default="{record}">{{ record.robots }} 名</template></Table.Column><Table.Column title="状态" :width="75"><template #default="{record}"><Switch v-model:checked="record.enabled" size="small" :disabled="record.source === '平台内置'" /></template></Table.Column><Table.Column title="操作" :width="100" fixed="right"><template #default="{record}"><Button type="link" size="small" @click="editMetric(record)">{{ record.source === '平台内置' ? '查看口径' : '编辑' }}</Button></template></Table.Column></Table>
            </div>
          </TabPane>

          <TabPane key="sources">
            <template #tab><span class="flex items-center gap-2"><Icon icon="lucide:plug-zap" />数据接入</span></template>
            <div class="pb-6 pt-2"><div class="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3"><article class="coverage-card"><span class="bg-emerald-50 text-emerald-600"><Icon icon="lucide:message-square" /></span><Tag color="success">已覆盖</Tag><b>标准聊天页</b><p>人数与有效时长正常采集</p></article><article class="coverage-card"><span class="bg-emerald-50 text-emerald-600"><Icon icon="lucide:monitor" /></span><Tag color="success">已覆盖</Tag><b>数字员工工作台</b><p>人数与有效时长正常采集</p></article><article class="coverage-card"><span class="bg-amber-50 text-amber-600"><Icon icon="lucide:panel-top" /></span><Tag color="warning">部分覆盖</Tag><b>嵌入业务页</b><p>1 个入口尚未接入活动 SDK</p></article></div>
              <div class="mb-4 flex items-center justify-between"><div><h2 class="m-0 text-base font-bold text-slate-800">业务业绩来源</h2><p class="mb-0 mt-1 text-xs text-slate-500">每个来源只可向已授权的员工和维度提交业绩。</p></div><Button><Icon icon="lucide:plus" class="mr-1" />新增来源</Button></div>
              <Table :data-source="sources" row-key="key" :pagination="false" :scroll="{ x: 760 }"><Table.Column title="来源名称" key="name" :width="180"><template #default="{record}"><b class="block">{{ record.name }}</b><code class="text-xs text-slate-400">{{ record.code }}</code></template></Table.Column><Table.Column title="授权范围" data-index="scope" :width="240" /><Table.Column title="最近上报" data-index="last" :width="160" /><Table.Column title="成功率" key="success" :width="90"><template #default="{record}"><span class="font-medium text-emerald-600">{{ record.success }}</span></template></Table.Column><Table.Column title="状态" key="enabled" :width="90"><template #default="{record}"><Tag :color="record.enabled ? 'success' : 'default'">{{ record.enabled ? '已启用' : '已停用' }}</Tag></template></Table.Column><Table.Column title="操作" :width="105"><template #default><Button type="link" size="small" @click="guideOpen = true">查看接入</Button></template></Table.Column></Table>
            </div>
          </TabPane>
        </Tabs>
      </section>
    </div>

    <Modal v-model:open="targetModalOpen" title="设置周期目标" ok-text="保存目标" width="600px" @ok="saveTarget"><Alert class="mb-5" type="info" show-icon message="目标属于当前员工，数量类按越高越好计算，耗时类按越低越好计算。" /><Form layout="vertical"><div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2"><FormItem label="数字员工" required><Select value="订单录入助理" :options="[{value:'订单录入助理',label:'订单录入助理'},{value:'运维智能助手',label:'运维智能助手'},{value:'办公协作助手',label:'办公协作助手'}]" /></FormItem><FormItem label="考核周期" required><Input value="2026 年 9 月" disabled /></FormItem><FormItem label="考核维度" required><Select value="订单录入量" :options="[{value:'订单录入量',label:'订单录入量 · 数量累计'},{value:'订单录入平均耗时',label:'订单录入平均耗时 · 单段耗时'},{value:'订单全流程平均耗时',label:'订单全流程平均耗时 · 多阶段耗时'},{value:'已解决工单数',label:'已解决工单数 · 数量累计'},{value:'使用人数',label:'使用人数 · 数量累计'}]" /></FormItem><FormItem label="目标值" required><InputNumber v-model:value="targetValue" :min="1" class="!w-full" addon-after="单" /></FormItem></div><FormItem label="目标依据或修改原因"><Input.TextArea v-model:value="targetNote" :rows="3" placeholder="说明目标依据；周期开始后修订目标时必填" /></FormItem></Form></Modal>
    <Modal v-model:open="metricModalOpen" title="选择绩效指标类型" ok-text="下一步" width="680px" @ok="continueMetricSetup">
      <p class="mb-4 mt-0 text-sm text-slate-500">指标类型创建后不可修改，请根据原始数据的记录方式选择。</p>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button v-for="(meta,key) in metricTypeMeta" :key="key" type="button" class="metric-type-option" :class="{selected:metricForm.type === key}" @click="metricForm.type = key"><span :class="`metric-type-${key}`"><Icon :icon="meta.icon" /></span><b>{{ key === 'count' ? '计量指标' : key === 'duration' ? '时效指标' : '多时段指标' }}</b><p>{{ meta.description }}</p><i><Icon icon="lucide:check" /></i></button>
      </div>
    </Modal>

    <Drawer v-model:open="metricDrawerOpen" :title="metricEditingKey ? '编辑绩效指标' : `新建${metricForm.type === 'count' ? '计量指标' : metricForm.type === 'duration' ? '时效指标' : '多时段指标'}`" width="860">
      <template #extra><Space><Button @click="metricDrawerOpen = false">取消</Button><Button type="primary" @click="saveMetric">保存指标</Button></Space></template>
      <div class="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4"><span class="grid size-10 place-items-center rounded-xl" :class="`metric-type-${metricForm.type}`"><Icon :icon="selectedMetricTypeMeta.icon" class="size-5" /></span><div><div class="flex items-center gap-2"><b class="text-slate-800">{{ metricForm.type === 'count' ? '计量指标' : metricForm.type === 'duration' ? '时效指标' : '多时段指标' }}</b><Tag :color="selectedMetricTypeMeta.color">{{ selectedMetricTypeMeta.label }}</Tag></div><p class="mb-0 mt-1 text-xs text-slate-500">{{ selectedMetricTypeMeta.description }}</p></div></div>

      <Form layout="vertical">
        <section class="drawer-section"><div class="section-title"><span>1</span><div><h3>基本信息</h3><p>设置指标名称、唯一编码和计算单位。</p></div></div><div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2"><FormItem label="指标名称" required><Input v-model:value="metricForm.name" :placeholder="metricForm.type === 'count' ? '例如：订单录入量' : metricForm.type === 'duration' ? '例如：订单录入时效' : '例如：订单全流程耗时'" /></FormItem><FormItem label="指标编码" required><Input v-model:value="metricForm.code" placeholder="order_full_process_duration" /><div class="mt-1 text-xs text-slate-400">用于接口上报和数据汇总，保存后不建议修改。</div></FormItem><FormItem label="计量单位" required><Select v-model:value="metricForm.unit" :options="(metricForm.type === 'count' ? ['单','份','笔','次','条'] : ['秒','分钟','小时']).map((value) => ({value,label:value}))" /></FormItem><FormItem label="达标方向"><Input :value="metricForm.type === 'count' ? '越高越好' : '越低越好'" disabled /></FormItem></div></section>

        <section v-if="metricForm.type === 'count'" class="drawer-section"><div class="section-title"><span>2</span><div><h3>计量规则</h3><p>确定事件如何累计、去重和冲正。</p></div></div><div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2"><FormItem label="聚合方式"><Select value="sum" :options="[{value:'sum',label:'按事件值累计（SUM）'},{value:'distinct',label:'按业务唯一键去重计数'}]" /></FormItem><FormItem label="业务唯一键"><Input placeholder="例如：orderNo" /></FormItem><FormItem label="重复事件处理"><Select value="ignore" :options="[{value:'ignore',label:'忽略重复事件'},{value:'latest',label:'以最后一次上报为准'}]" /></FormItem><FormItem label="允许冲正"><Switch checked /><span class="ml-2 text-xs text-slate-500">支持负值事件回退已计数量</span></FormItem></div></section>

        <section v-if="metricForm.type === 'duration'" class="drawer-section"><div class="section-title"><span>2</span><div><h3>时效计算</h3><p>通过开始和结束事件计算单段有效处理时长。</p></div></div><div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2"><FormItem label="开始事件编码" required><Input placeholder="order_received" /></FormItem><FormItem label="结束事件编码" required><Input placeholder="order_entry_completed" /></FormItem><FormItem label="聚合方式"><Select value="avg" :options="[{value:'avg',label:'平均耗时（AVG）'},{value:'p90',label:'P90 耗时'},{value:'max',label:'最大耗时'}]" /></FormItem><FormItem label="超时阈值"><InputNumber :value="3" :min="0" class="!w-full" addon-after="分钟" /></FormItem></div><FormItem label="暂停计时条件"><Input placeholder="例如：等待附件、人工确认；多个条件用逗号分隔" /></FormItem></section>

        <section v-if="metricForm.type === 'staged'" class="drawer-section"><div class="section-title"><span>2</span><div><h3>阶段定义</h3><p>左侧选择阶段，右侧只维护编号、名称、单位和描述；实际耗时由使用方接口上报。</p></div></div><div class="stage-editor"><aside><div class="mb-2 flex items-center justify-between px-1"><b class="text-xs text-slate-500">处理阶段（{{ orderStages.length }}）</b><Button type="text" size="small" @click="addStage"><Icon icon="lucide:plus" />新增</Button></div><button v-for="stage in orderStages" :key="stage.key" type="button" class="stage-nav-item" :class="{active:selectedStageKey === stage.key}" @click="selectedStageKey = stage.key"><span>{{ stage.order }}</span><span class="min-w-0 flex-1"><b>{{ stage.name }}</b><code>{{ stage.code || '待设置编号' }}</code></span><Icon icon="lucide:chevron-right" /></button></aside><div v-if="selectedStage" class="stage-form"><div class="mb-4 flex items-center justify-between"><div><b class="text-slate-800">阶段 {{ selectedStage.order }} 定义</b><p class="mb-0 mt-1 text-xs text-slate-400">阶段编号用于接口上报，在当前指标内必须唯一。</p></div><Button danger type="text" size="small" @click="removeStage(selectedStage.key)"><Icon icon="lucide:trash-2" class="mr-1" />删除阶段</Button></div><div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2"><FormItem label="阶段编号" required><Input v-model:value="selectedStage.code" placeholder="order_entry" /></FormItem><FormItem label="阶段名称" required><Input v-model:value="selectedStage.name" placeholder="订单录入" /></FormItem><FormItem label="耗时单位" required><Select v-model:value="selectedStage.unit" :options="['毫秒','秒','分钟','小时'].map((value) => ({value,label:value}))" /></FormItem></div><FormItem label="阶段描述" required><Input.TextArea v-model:value="selectedStage.description" :rows="4" placeholder="描述该阶段对应的业务处理动作，便于接口接入方理解上报口径" /></FormItem></div></div><Alert class="mt-3" type="info" show-icon message="耗时由接口上报" description="使用方上报业务单号、指标编码、阶段编号、耗时值和单位；平台按阶段编号保存明细并汇总展示，不在这里设置固定目标分钟数。" /></section>

        <section class="drawer-section"><div class="section-title"><span>{{ metricForm.type === 'count' ? 3 : 3 }}</span><div><h3>统计口径</h3><p>说明计入条件、排除范围和异常数据处理方式。</p></div></div><FormItem label="统计口径" required><Input.TextArea v-model:value="metricForm.rule" :rows="4" placeholder="请说明指标的统计范围、有效条件、排除条件及异常处理规则" /></FormItem><div class="flex items-center justify-between rounded-lg bg-slate-50 p-4"><div><b class="text-sm text-slate-700">保存到租户维度库</b><p class="mb-0 mt-1 text-xs text-slate-500">保存后可供其他数字员工复用定义。</p></div><Switch v-model:checked="metricForm.save" /></div></section>
      </Form>
    </Drawer>
    <Modal v-model:open="reportModalOpen" title="模拟提交一笔业绩" ok-text="提交事件" width="560px" @ok="submitReport"><Alert class="mb-5" type="warning" show-icon message="此操作用于 Demo 演示，刷新页面后数据将重置。" /><Form layout="vertical"><FormItem label="数字员工"><Input value="运维智能助手" disabled /></FormItem><FormItem label="绩效维度"><Input value="已解决工单数" disabled /></FormItem><div class="grid grid-cols-1 gap-x-4 sm:grid-cols-2"><FormItem label="数量"><InputNumber v-model:value="reportValue" :min="1" class="!w-full" /></FormItem><FormItem label="业务唯一键"><Input value="WO-20260921-0088" /></FormItem></div></Form></Modal>
    <Drawer v-model:open="guideOpen" title="绩效口径与数据接入" width="520"><div class="space-y-6"><section><Tag color="blue">active_usage_v1</Tag><h3 class="mt-3 text-base font-bold">有效使用时长</h3><p class="text-sm leading-6 text-slate-600">页面可见且用户最近 120 秒有键盘、点击、触摸或主动滚动时才具备计时条件。相邻有效心跳间隔不超过 30 秒时计入区间，同一用户的重叠区间取并集。</p></section><section class="rounded-xl border border-slate-200 p-4"><h3 class="mt-0 text-base font-bold">通用事件接口</h3><div class="overflow-auto whitespace-pre rounded-lg bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-200">POST /open/performance/events<br />API-KEY: ••••••••<br /><br />{<br />&nbsp;&nbsp;"robotId": "ops",<br />&nbsp;&nbsp;"metricCode": "ticket_resolved_count",<br />&nbsp;&nbsp;"eventId": "evt-20260921-0088",<br />&nbsp;&nbsp;"value": 1<br />}</div></section><Alert type="info" show-icon message="密钥只在“密钥鉴权”页面管理" description="这里只展示来源授权、接入示例和最近调用结果。" /></div></Drawer>
  </main>
</template>

<style scoped>
.stat-card { position: relative; min-height: 148px; overflow: hidden; border: 1px solid rgb(226 232 240); border-radius: 14px; padding: 20px; background: white; }
.stat-card .stat-icon { position: absolute; right: 18px; top: 18px; display: grid; width: 38px; height: 38px; place-items: center; border-radius: 10px; font-size: 19px; }
.stat-card p { margin: 0; color: rgb(100 116 139); font-size: 13px; font-weight: 500; }
.stat-card b { display: block; margin-top: 14px; color: rgb(15 23 42); font-size: 28px; line-height: 1; }
.stat-card small { color: rgb(148 163 184); font-size: 13px; font-weight: 500; }
.stat-card em { display: block; margin-top: 13px; font-size: 12px; font-style: normal; font-weight: 500; }
.coverage-card { display: grid; grid-template-columns: 1fr auto; gap: 12px; border: 1px solid rgb(226 232 240); border-radius: 12px; padding: 18px; }
.coverage-card > span:first-child { display: grid; width: 36px; height: 36px; place-items: center; border-radius: 9px; font-size: 18px; }
.coverage-card b, .coverage-card p { grid-column: 1 / -1; }
.coverage-card p { margin: -8px 0 0; color: rgb(100 116 139); font-size: 12px; }
.metric-type-card { display: flex; align-items: flex-start; gap: 12px; border: 1px solid rgb(226 232 240); border-radius: 12px; padding: 15px; background: linear-gradient(145deg, white, rgb(248 250 252)); }
.metric-type-card > span { display: grid; width: 38px; height: 38px; flex: none; place-items: center; border-radius: 10px; font-size: 18px; }
.metric-type-card b { color: rgb(30 41 59); font-size: 14px; }
.metric-type-card p { margin: 6px 0 0; color: rgb(100 116 139); font-size: 11px; line-height: 1.6; }
.metric-type-count { background: rgb(239 246 255); color: rgb(37 99 235); }
.metric-type-duration { background: rgb(255 247 237); color: rgb(234 88 12); }
.metric-type-staged { background: rgb(245 243 255); color: rgb(124 58 237); }
.metric-type-option { position: relative; display: flex; min-height: 170px; flex-direction: column; align-items: flex-start; border: 1px solid rgb(226 232 240); border-radius: 13px; padding: 16px; background: white; text-align: left; transition: border-color .2s, box-shadow .2s, transform .2s; }
.metric-type-option:hover { border-color: rgb(147 197 253); transform: translateY(-1px); }
.metric-type-option.selected { border-color: rgb(37 99 235); box-shadow: 0 0 0 3px rgb(37 99 235 / 10%); }
.metric-type-option > span { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 11px; font-size: 20px; }
.metric-type-option > b { margin-top: 14px; color: rgb(30 41 59); font-size: 15px; }
.metric-type-option > p { margin: 7px 0 0; color: rgb(100 116 139); font-size: 11px; line-height: 1.65; }
.metric-type-option > i { position: absolute; right: 12px; top: 12px; display: none; width: 22px; height: 22px; place-items: center; border-radius: 50%; background: rgb(37 99 235); color: white; font-style: normal; }
.metric-type-option.selected > i { display: grid; }
.drawer-section { margin-bottom: 18px; border: 1px solid rgb(226 232 240); border-radius: 13px; padding: 18px; background: white; }
.section-title { display: flex; align-items: flex-start; gap: 11px; margin-bottom: 18px; }
.section-title > span { display: grid; width: 26px; height: 26px; flex: none; place-items: center; border-radius: 8px; background: rgb(239 246 255); color: rgb(37 99 235); font-size: 12px; font-weight: 700; }
.section-title h3 { margin: 1px 0 0; color: rgb(30 41 59); font-size: 15px; font-weight: 700; }
.section-title p { margin: 4px 0 0; color: rgb(100 116 139); font-size: 11px; }
.stage-editor { display: grid; min-height: 360px; grid-template-columns: 230px minmax(0, 1fr); overflow: hidden; border: 1px solid rgb(226 232 240); border-radius: 11px; }
.stage-editor > aside { border-right: 1px solid rgb(226 232 240); padding: 12px; background: rgb(248 250 252); }
.stage-nav-item { display: flex; width: 100%; align-items: center; gap: 9px; margin-top: 7px; border: 1px solid transparent; border-radius: 9px; padding: 10px; color: rgb(100 116 139); text-align: left; }
.stage-nav-item:hover { background: white; }
.stage-nav-item.active { border-color: rgb(196 181 253); background: white; color: rgb(109 40 217); box-shadow: 0 2px 8px rgb(76 29 149 / 7%); }
.stage-nav-item > span:first-child { display: grid; width: 25px; height: 25px; flex: none; place-items: center; border-radius: 7px; background: rgb(237 233 254); color: rgb(109 40 217); font-size: 11px; font-weight: 700; }
.stage-nav-item b, .stage-nav-item code { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.stage-nav-item b { color: rgb(51 65 85); font-size: 12px; }
.stage-nav-item code { margin-top: 2px; color: rgb(148 163 184); font-size: 10px; }
.stage-form { padding: 18px; }
@media (max-width: 720px) { .stage-editor { grid-template-columns: 1fr; } .stage-editor > aside { border-right: 0; border-bottom: 1px solid rgb(226 232 240); } }
:deep(.performance-tabs > .ant-tabs-nav) { margin-bottom: 18px; }
:deep(.performance-tabs > .ant-tabs-nav .ant-tabs-tab) { padding: 17px 4px; font-weight: 600; }
</style>
