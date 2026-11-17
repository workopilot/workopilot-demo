<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Alert,
  Avatar,
  Button,
  Input,
  InputNumber,
  Modal,
  Progress,
  Select,
  Space,
  Statistic,
  TabPane,
  Table,
  Tabs,
  Tag,
  Timeline,
  TimelineItem,
  message,
} from 'ant-design-vue';

const router = useRouter();
const route = useRoute();
const activeTab = ref('analysis');
const period = ref('2026-09');
const reverseOpen = ref(false);
const reverseValue = ref(1);

const isPptEmployee = computed(() => route.params.id === 'ppt-b');
const isOrderEmployee = computed(() => route.params.id === 'order');
const employeeProfile = computed(() => isOrderEmployee.value ? {
  name: '订单录入助理', department: '销售运营部', code: 'AGT-ORDER-001', type: 'TASK',
  avatar: `${import.meta.env.BASE_URL}images/ai-employee/sales.png`, metric: '订单录入量', actual: 326, target: 420, unit: '单', rate: 78,
} : isPptEmployee.value ? {
  name: '演示文稿设计师 B', department: '售前支持部', code: 'AGT-PPT-002', type: 'TASK',
  avatar: `${import.meta.env.BASE_URL}images/ai-employee/插画设计师.jpg`, metric: 'PPT 数', actual: 6, target: 50, unit: '份', rate: 12,
} : {
  name: '运维智能助手', department: '信息技术部', code: 'AGT-OPS-001', type: 'CHAT',
  avatar: `${import.meta.env.BASE_URL}images/ai-employee/技术员.jpg`, metric: '已解决工单数', actual: 240, target: 450, unit: '单', rate: 53,
});

const coachAdvice = computed(() => isOrderEmployee.value ? [
  { level: 'warning', title: '写入业务系统是当前主要瓶颈', text: '近 7 天写入业务系统平均耗时 4.1 分钟，占全流程耗时 43%，且 P90 达到 7.8 分钟。慢单主要集中在 ERP 接口排队和字段校验失败，建议优先优化重试策略与字段预校验。', action: '查看慢单明细' },
  { level: 'info', title: '数量进度基本合理，耗时目标仍有差距', text: '订单录入量完成 78%，领先 70% 的日历进度；全流程平均耗时为 9.6 分钟，高于 8 分钟目标。建议保持数量目标，针对转换单据与系统写入阶段设置专项优化任务。', action: '生成阶段优化方案' },
] : isPptEmployee.value ? [
  { level: 'critical', title: '先确认低使用率的真实原因', text: '该员工连续 3 个月 PPT 产出均为个位数，本月仅生成 6 份，明显低于 50 份目标。建议访谈主要使用者，确认是否存在入口难找、生成质量不符合要求或业务场景本身不足。', action: '发起使用原因调研' },
  { level: 'warning', title: '暂停继续上调产出目标', text: '在明确低使用原因并完成质量改进前，继续提高数量目标不会带来有效使用。建议先设置阶段目标 12–15 份，并同步追踪采用率和返工率。', action: '查看目标调整建议' },
] : [
  { level: 'warning', title: '目标与历史能力差异过大', text: '该员工近 3 个月平均每月处理约 300 单，本月目标为 450 单，高出历史均值 50%。即使当前处理节奏保持稳定，预计月底约完成 335 单。建议将目标调整至 330–360 单，或补充自动化能力后再逐步提升。', action: '生成目标修订方案' },
  { level: 'info', title: '使用覆盖正常，优先检查产能约束', text: '当前使用人数完成率为 84%，用户覆盖接近日历进度。绩效差距更可能来自单次处理效率或上游工单供给，建议查看高耗时工单类型和失败重试情况。', action: '分析工单耗时结构' },
]);

const events = ref([
  { key: '1', occurred: '09-21 14:24', received: '09-21 14:24', metric: '已解决工单数', value: '+1', source: '运维工单系统', business: 'WO-20260921-0088', status: '有效' },
  { key: '2', occurred: '09-21 13:12', received: '09-21 13:13', metric: '已解决工单数', value: '+1', source: '运维工单系统', business: 'WO-20260921-0085', status: '有效' },
  { key: '3', occurred: '09-21 10:08', received: '09-21 10:08', metric: '已解决工单数', value: '-1', source: '运维工单系统', business: 'WO-20260919-0061', status: '冲正' },
  { key: '4', occurred: '09-20 17:46', received: '09-20 17:47', metric: '已解决工单数', value: '+2', source: '运维工单系统', business: 'BATCH-0920-14', status: '有效' },
]);

const users = [
  { key: '1', name: '张三', account: 'zhangsan', days: 15, duration: '18 小时 24 分', last: '今天 14:25', source: '标准聊天页' },
  { key: '2', name: '李四', account: 'lisi', days: 11, duration: '12 小时 08 分', last: '今天 13:48', source: '工作台' },
  { key: '3', name: '王敏', account: 'wangmin', days: 9, duration: '8 小时 42 分', last: '昨天 18:02', source: '标准聊天页' },
  { key: '4', name: '陈亮', account: 'chenliang', days: 7, duration: '6 小时 15 分', last: '昨天 16:31', source: '嵌入业务页' },
];

const trend = [
  { day: '09/15', value: 9 }, { day: '09/16', value: 14 }, { day: '09/17', value: 11 },
  { day: '09/18', value: 18 }, { day: '09/19', value: 15 }, { day: '09/20', value: 21 }, { day: '09/21', value: 12 },
];

const stageRecords = ref([
  { key: '1', orderNo: 'SO-20260921-0186', received: '14:20:08', entry: 2.4, convert: 1.6, writeback: 2.8, total: 6.8, status: '达标' },
  { key: '2', orderNo: 'SO-20260921-0185', received: '14:12:36', entry: 3.2, convert: 2.1, writeback: 4.6, total: 9.9, status: '超时' },
  { key: '3', orderNo: 'SO-20260921-0184', received: '13:58:11', entry: 2.8, convert: 1.9, writeback: 3.0, total: 7.7, status: '达标' },
  { key: '4', orderNo: 'SO-20260921-0183', received: '13:46:42', entry: 4.5, convert: 2.7, writeback: 6.2, total: 13.4, status: '严重超时' },
  { key: '5', orderNo: 'SO-20260921-0182', received: '13:31:19', entry: 3.0, convert: 1.8, writeback: 3.5, total: 8.3, status: '超时' },
]);

const stageSummary = [
  { name: '订单录入', average: 3.1, target: 3, p90: 4.8, share: 32, color: '#2563eb' },
  { name: '转换业务单据', average: 2.4, target: 2, p90: 3.6, share: 25, color: '#7c3aed' },
  { name: '写入业务系统', average: 4.1, target: 3, p90: 7.8, share: 43, color: '#f97316' },
];

function reverseEvent() {
  reverseOpen.value = false;
  message.success(`已提交 ${reverseValue.value} 单冲正，当前月度与季度结果将重新汇总`);
}
</script>

<template>
  <main class="min-h-[calc(100vh-100px)] bg-slate-50/70 p-4 md:p-6 xl:p-8">
    <div class="mx-auto max-w-[1500px]">
      <header class="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div class="flex items-center gap-4">
          <Button shape="circle" size="large" aria-label="返回绩效看板" @click="router.push('/digital-employees/performance-dashboard')"><Icon icon="lucide:arrow-left" /></Button>
          <Avatar :size="58" :src="employeeProfile.avatar" />
          <div><div class="flex flex-wrap items-center gap-2"><h1 class="m-0 text-2xl font-bold text-slate-900">{{ employeeProfile.name }}</h1><Tag color="green">在职</Tag><Tag>{{ employeeProfile.type }}</Tag></div><p class="mb-0 mt-1 text-sm text-slate-500">{{ employeeProfile.department }} · {{ employeeProfile.code }}</p></div>
        </div>
        <Space wrap><Select v-model:value="period" class="w-40" :options="[{value:'2026-09',label:'2026 年 9 月'},{value:'2026-08',label:'2026 年 8 月'},{value:'2026-Q3',label:'2026 年 Q3'}]" /><Button @click="router.push('/ai-employee/agent-config/edit/agt_1?tab=performance')"><Icon icon="lucide:settings-2" class="mr-1" />配置绩效</Button></Space>
      </header>

      <Alert v-if="isOrderEmployee" class="mb-5" type="info" show-icon message="订单阶段耗时已完整接入" description="每笔订单保留订单录入、转换业务单据、写入业务系统三个阶段的起止时间；暂停时段会单独记录且不计入有效处理耗时。" />
      <Alert v-else class="mb-5" type="warning" show-icon message="有效使用时长为部分覆盖" description="嵌入工单页面于 9 月 8 日开始采集，当前结果不代表完整月度使用时长。业务产出指标采集完整。" />

      <section class="coach-panel mb-5">
        <div class="coach-head">
          <span><Icon icon="lucide:sparkles" /></span>
          <div><div class="flex items-center gap-2"><h2>AI 绩效教练</h2><Tag color="purple">基于近 3 个月数据</Tag></div><p>结合历史能力、当前目标、日历进度与使用行为，给出可执行的绩效改进建议。</p></div>
          <Button class="ml-auto" size="small"><Icon icon="lucide:refresh-cw" class="mr-1" />重新分析</Button>
        </div>
        <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <article v-for="advice in coachAdvice" :key="advice.title" class="coach-advice" :class="`coach-${advice.level}`">
            <div class="flex items-start gap-3"><span class="mt-0.5"><Icon :icon="advice.level === 'critical' ? 'lucide:circle-alert' : advice.level === 'warning' ? 'lucide:triangle-alert' : 'lucide:lightbulb'" /></span><div><h3>{{ advice.title }}</h3><p>{{ advice.text }}</p><Button type="link" size="small" class="!h-auto !p-0">{{ advice.action }}<Icon icon="lucide:arrow-right" class="ml-1" /></Button></div></div>
          </article>
        </div>
        <div class="mt-3 flex items-center gap-2 text-xs text-slate-400"><Icon icon="lucide:info" />AI 建议仅作为管理参考，调整目标前请结合业务计划与负责人判断。</div>
      </section>

      <section v-if="isOrderEmployee" class="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <article class="metric-card border-l-blue-500"><div class="flex items-center justify-between"><div><p>订单录入量</p><Statistic :value="326" suffix="/ 420 单" :value-style="{ color: '#0f172a', fontWeight: 700 }" /></div><span class="icon-box bg-blue-50 text-blue-600"><Icon icon="lucide:clipboard-list" /></span></div><Progress :percent="78" :show-info="false" stroke-color="#2563eb" /><div class="flex justify-between text-xs text-slate-500"><span>领先日历进度 8%</span><b class="text-blue-600">完成率 78%</b></div></article>
        <article class="metric-card border-l-violet-500"><div class="flex items-center justify-between"><div><p>订单录入平均耗时</p><Statistic :value="3.8" suffix="分钟" :precision="1" :value-style="{ color: '#0f172a', fontWeight: 700 }" /></div><span class="icon-box bg-violet-50 text-violet-600"><Icon icon="lucide:timer" /></span></div><Progress :percent="79" :show-info="false" stroke-color="#7c3aed" /><div class="flex justify-between text-xs text-slate-500"><span>目标 ≤ 3 分钟</span><b class="text-orange-600">超出 0.8 分钟</b></div></article>
        <article class="metric-card border-l-orange-500"><div class="flex items-center justify-between"><div><p>订单全流程平均耗时</p><Statistic :value="9.6" suffix="分钟" :precision="1" :value-style="{ color: '#0f172a', fontWeight: 700 }" /></div><span class="icon-box bg-orange-50 text-orange-600"><Icon icon="lucide:workflow" /></span></div><Progress :percent="83" :show-info="false" stroke-color="#f97316" /><div class="flex justify-between text-xs text-slate-500"><span>目标 ≤ 8 分钟</span><b class="text-orange-600">耗时达成率 83%</b></div></article>
      </section>

      <section v-else class="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <article class="metric-card border-l-orange-400"><div class="flex items-center justify-between"><div><p>{{ employeeProfile.metric }}</p><Statistic :value="employeeProfile.actual" :suffix="`/ ${employeeProfile.target} ${employeeProfile.unit}`" :value-style="{ color: '#0f172a', fontWeight: 700 }" /></div><span class="icon-box bg-orange-50 text-orange-600"><Icon :icon="isPptEmployee ? 'lucide:presentation' : 'lucide:ticket-check'" /></span></div><Progress :percent="employeeProfile.rate" :show-info="false" stroke-color="#f59e0b" /><div class="flex justify-between text-xs text-slate-500"><span>剩余 {{ employeeProfile.target - employeeProfile.actual }} {{ employeeProfile.unit }}</span><b class="text-orange-600">完成率 {{ employeeProfile.rate }}%</b></div></article>
        <article class="metric-card border-l-violet-500"><div class="flex items-center justify-between"><div><p>使用人数</p><Statistic :value="42" suffix="/ 50 人" :value-style="{ color: '#0f172a', fontWeight: 700 }" /></div><span class="icon-box bg-violet-50 text-violet-600"><Icon icon="lucide:users" /></span></div><Progress :percent="84" :show-info="false" stroke-color="#7c3aed" /><div class="flex justify-between text-xs text-slate-500"><span>周期去重</span><b class="text-violet-600">完成率 84%</b></div></article>
        <article class="metric-card border-l-amber-500"><div class="flex items-center justify-between"><div><p>有效使用时长</p><Statistic :value="62.5" suffix="小时" :precision="1" :value-style="{ color: '#0f172a', fontWeight: 700 }" /></div><span class="icon-box bg-amber-50 text-amber-600"><Icon icon="lucide:clock-3" /></span></div><div class="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">未设目标 · 仅统计 · 部分入口覆盖</div></article>
      </section>

      <section class="rounded-2xl border border-slate-200 bg-white px-4 shadow-sm md:px-6">
        <Tabs v-model:active-key="activeTab" class="detail-tabs">
          <TabPane key="analysis" tab="业绩分析">
            <div class="grid grid-cols-1 gap-5 pb-6 pt-2 xl:grid-cols-[1.6fr_1fr]">
              <article class="rounded-xl border border-slate-200 p-5"><div class="mb-6 flex items-center justify-between"><div><h2 class="m-0 text-base font-bold text-slate-800">{{ isOrderEmployee ? '每日录入订单' : '每日完成工单' }}</h2><p class="mb-0 mt-1 text-xs text-slate-500">期间增量 · 09/15—09/21</p></div><Tag color="blue">累计 {{ isOrderEmployee ? '326' : '100' }} 单</Tag></div><div class="flex h-64 items-end justify-between gap-3 border-b border-l border-slate-200 px-4 pt-6"><div v-for="item in trend" :key="item.day" class="group flex h-full flex-1 flex-col items-center justify-end gap-2"><span class="text-xs font-semibold text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">{{ item.value }}</span><div class="w-full max-w-12 rounded-t-md bg-blue-500 transition-colors hover:bg-blue-600" :style="{height: `${item.value * 8}px`}"></div><span class="pb-2 text-[11px] text-slate-400">{{ item.day }}</span></div></div></article>
              <article class="rounded-xl border border-slate-200 p-5"><h2 class="m-0 mb-1 text-base font-bold text-slate-800">本期节奏参考</h2><p class="mb-6 text-xs text-slate-500">仅作进度参考，不作为达标判定。</p><div class="mx-auto mb-6 grid size-40 place-items-center rounded-full" style="background: conic-gradient(#2563eb 0 80%, #e2e8f0 80% 100%)"><div class="grid size-28 place-items-center rounded-full bg-white text-center"><div><b class="block text-3xl text-slate-900">80%</b><span class="text-xs text-slate-400">目标完成</span></div></div></div><div class="space-y-3 text-sm"><div class="flex justify-between rounded-lg bg-slate-50 p-3"><span class="text-slate-500">日历进度</span><b>70%</b></div><div class="flex justify-between rounded-lg bg-emerald-50 p-3"><span class="text-emerald-700">领先参考进度</span><b class="text-emerald-700">+10%</b></div></div></article>
            </div>
          </TabPane>

          <TabPane key="events" tab="业绩流水">
            <div class="pb-6 pt-2"><div class="mb-4 flex items-center justify-between"><div><h2 class="m-0 text-base font-bold">可追溯业绩事件</h2><p class="mb-0 mt-1 text-xs text-slate-500">正向事件与冲正记录均保留，统计采用净值。</p></div><Space><Button>管理员补录</Button><Button type="primary" @click="reverseOpen = true">冲正业绩</Button></Space></div><Table :data-source="events" row-key="key" :pagination="false" :scroll="{x: 920}"><Table.Column title="业务发生时间" data-index="occurred" :width="130" /><Table.Column title="平台接收时间" data-index="received" :width="130" /><Table.Column title="指标" data-index="metric" :width="150" /><Table.Column title="净值" key="value" :width="80"><template #default="{record}"><b :class="record.value.startsWith('-') ? 'text-red-600' : 'text-emerald-600'">{{ record.value }}</b></template></Table.Column><Table.Column title="来源" data-index="source" :width="140" /><Table.Column title="业务单号" data-index="business" :width="190" /><Table.Column title="状态" key="status" :width="90"><template #default="{record}"><Tag :color="record.status === '有效' ? 'success' : 'error'">{{ record.status }}</Tag></template></Table.Column><Table.Column title="操作" :width="80"><template #default><Button type="link" size="small">详情</Button></template></Table.Column></Table></div>
          </TabPane>

          <TabPane v-if="isOrderEmployee" key="stage-records" tab="阶段耗时记录">
            <div class="pb-6 pt-2">
              <div class="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-3"><article v-for="stage in stageSummary" :key="stage.name" class="stage-summary"><div class="mb-3 flex items-center justify-between"><b>{{ stage.name }}</b><Tag :color="stage.average <= stage.target ? 'success' : 'warning'">目标 ≤ {{ stage.target }} 分钟</Tag></div><div class="flex items-end justify-between"><div><span class="text-2xl font-bold text-slate-900">{{ stage.average }}</span><small class="ml-1 text-slate-400">分钟均值</small></div><span class="text-xs text-slate-500">P90 {{ stage.p90 }} 分钟</span></div><div class="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div class="h-full rounded-full" :style="{width:`${stage.share}%`,backgroundColor:stage.color}"></div></div><p class="mb-0 mt-2 text-xs text-slate-400">占全流程 {{ stage.share }}%</p></article></div>
              <div class="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 class="m-0 text-base font-bold text-slate-800">订单处理记录</h2><p class="mb-0 mt-1 text-xs text-slate-500">单位：分钟。点击业务单号可查看完整节点时间、暂停区间与接口回执。</p></div><Space><Select class="w-36" value="all" :options="[{value:'all',label:'全部状态'},{value:'slow',label:'仅看超时'}]" /><Button><Icon icon="lucide:download" class="mr-1" />导出记录</Button></Space></div>
              <Table :data-source="stageRecords" row-key="key" :pagination="{pageSize:5}" :scroll="{x:920}"><Table.Column title="业务单号" key="orderNo" :width="190"><template #default="{record}"><Button type="link" class="!p-0">{{ record.orderNo }}</Button></template></Table.Column><Table.Column title="接收时间" data-index="received" :width="110" /><Table.Column title="订单录入" key="entry" :width="130"><template #default="{record}"><span :class="record.entry > 3 ? 'font-semibold text-orange-600' : ''">{{ record.entry }} 分钟</span></template></Table.Column><Table.Column title="转换业务单据" key="convert" :width="140"><template #default="{record}"><span :class="record.convert > 2 ? 'font-semibold text-orange-600' : ''">{{ record.convert }} 分钟</span></template></Table.Column><Table.Column title="写入业务系统" key="writeback" :width="145"><template #default="{record}"><span :class="record.writeback > 3 ? 'font-semibold text-orange-600' : ''">{{ record.writeback }} 分钟</span></template></Table.Column><Table.Column title="全流程耗时" key="total" :width="130"><template #default="{record}"><b :class="record.total <= 8 ? 'text-emerald-600' : 'text-red-600'">{{ record.total }} 分钟</b></template></Table.Column><Table.Column title="状态" key="status" :width="110"><template #default="{record}"><Tag :color="record.status === '达标' ? 'success' : record.status === '严重超时' ? 'error' : 'warning'">{{ record.status }}</Tag></template></Table.Column></Table>
            </div>
          </TabPane>

          <TabPane key="usage" tab="使用明细">
            <div class="pb-6 pt-2"><div class="mb-4 flex items-center justify-between"><div><h2 class="m-0 text-base font-bold">已识别使用者</h2><p class="mb-0 mt-1 text-xs text-slate-500">42 名已识别用户，另有 3 名匿名访客不计入考核人数。</p></div><Tag color="purple">周期内跨日去重</Tag></div><Table :data-source="users" row-key="key" :pagination="false"><Table.Column title="使用者" key="name"><template #default="{record}"><b>{{ record.name }}</b><span class="ml-2 text-xs text-slate-400">{{ record.account }}</span></template></Table.Column><Table.Column title="活跃天数" key="days"><template #default="{record}">{{ record.days }} 天</template></Table.Column><Table.Column title="有效使用时长" data-index="duration" /><Table.Column title="最近使用" data-index="last" /><Table.Column title="主要入口" key="source"><template #default="{record}"><Tag>{{ record.source }}</Tag></template></Table.Column></Table></div>
          </TabPane>

          <TabPane key="history" tab="目标与结算记录">
            <div class="grid grid-cols-1 gap-6 pb-8 pt-3 xl:grid-cols-[1fr_360px]"><div><h2 class="mb-5 text-base font-bold">目标修订记录</h2><Timeline><TimelineItem color="blue"><b>目标由 280 单调整为 300 单</b><p class="mb-1 mt-1 text-sm text-slate-500">业务系统扩容后提高本月目标；修改人：王主管</p><span class="text-xs text-slate-400">2026-09-05 10:24 · 版本 V2</span></TimelineItem><TimelineItem color="green"><b>创建 9 月目标：280 单</b><p class="mb-1 mt-1 text-sm text-slate-500">依据近三个月平均处理量制定；创建人：王主管</p><span class="text-xs text-slate-400">2026-08-28 16:30 · 版本 V1</span></TimelineItem><TimelineItem color="gray"><b>8 月结果已结算：已达标</b><p class="mb-1 mt-1 text-sm text-slate-500">实际 286 单 / 目标 260 单，完成率 110%</p><span class="text-xs text-slate-400">2026-09-08 00:10 · 结果版本 R1</span></TimelineItem></Timeline></div><aside class="h-fit rounded-xl border border-slate-200 bg-slate-50 p-5"><h3 class="mt-0 text-base font-bold">周期状态</h3><div class="mb-4 flex items-center justify-between"><span class="text-sm text-slate-500">2026 年 9 月</span><Tag color="processing">考核中</Tag></div><div class="space-y-3 border-t border-slate-200 pt-4 text-sm"><div class="flex justify-between"><span class="text-slate-500">补报宽限期</span><b>截至 10 月 7 日</b></div><div class="flex justify-between"><span class="text-slate-500">未处理事件</span><b class="text-emerald-600">0 条</b></div><div class="flex justify-between"><span class="text-slate-500">数据质量</span><b class="text-amber-600">部分覆盖</b></div></div><Button block class="mt-5" disabled>周期结束后可结算</Button></aside></div>
          </TabPane>
        </Tabs>
      </section>
    </div>

    <Modal v-model:open="reverseOpen" title="冲正业绩事件" ok-text="确认冲正" ok-type="danger" width="560px" @ok="reverseEvent"><Alert class="mb-5" type="warning" show-icon message="冲正将按原事件发生时间回写 2026 年 9 月与 2026 年 Q3 的统计结果。" /><div class="mb-4 rounded-lg bg-slate-50 p-4 text-sm"><div class="flex justify-between"><span class="text-slate-500">原业务单号</span><b>WO-20260921-0088</b></div><div class="mt-2 flex justify-between"><span class="text-slate-500">原始值 / 可冲正</span><b>1 单 / 1 单</b></div></div><label class="mb-2 block text-sm font-medium text-slate-700">冲正数量</label><InputNumber v-model:value="reverseValue" :min="1" :max="1" class="mb-4 !w-full" addon-after="单" /><label class="mb-2 block text-sm font-medium text-slate-700">冲正原因</label><Input.TextArea :rows="3" placeholder="例如：工单重新打开，尚未完成处理" /></Modal>
  </main>
</template>

<style scoped>
.coach-panel { overflow: hidden; border: 1px solid rgb(221 214 254); border-radius: 14px; padding: 20px; background: linear-gradient(135deg, rgb(250 245 255), white 52%, rgb(239 246 255)); box-shadow: 0 1px 2px rgb(76 29 149 / 5%); }
.coach-head { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
.coach-head > span { display: grid; width: 40px; height: 40px; flex: none; place-items: center; border-radius: 11px; background: rgb(124 58 237); color: white; font-size: 20px; box-shadow: 0 8px 18px rgb(124 58 237 / 22%); }
.coach-head h2 { margin: 0; color: rgb(30 41 59); font-size: 17px; font-weight: 750; }
.coach-head p { margin: 4px 0 0; color: rgb(100 116 139); font-size: 12px; }
.coach-advice { border: 1px solid rgb(226 232 240); border-radius: 11px; padding: 15px; background: rgb(255 255 255 / 88%); }
.coach-advice > div > span { font-size: 18px; }
.coach-advice h3 { margin: 0; color: rgb(30 41 59); font-size: 14px; font-weight: 700; }
.coach-advice p { margin: 6px 0 10px; color: rgb(71 85 105); font-size: 12px; line-height: 1.7; }
.coach-critical > div > span { color: rgb(220 38 38); }
.coach-warning > div > span { color: rgb(234 88 12); }
.coach-info > div > span { color: rgb(37 99 235); }
.metric-card { min-height: 190px; border-top: 1px solid rgb(226 232 240); border-right: 1px solid rgb(226 232 240); border-bottom: 1px solid rgb(226 232 240); border-left-width: 4px; border-radius: 14px; padding: 20px; background: white; box-shadow: 0 1px 2px rgb(15 23 42 / 4%); }
.metric-card p { margin: 0 0 8px; color: rgb(100 116 139); font-size: 13px; font-weight: 500; }
.icon-box { display: grid; width: 42px; height: 42px; place-items: center; border-radius: 11px; font-size: 20px; }
.stage-summary { border: 1px solid rgb(226 232 240); border-radius: 12px; padding: 16px; background: linear-gradient(145deg, white, rgb(248 250 252)); }
:deep(.metric-card .ant-progress) { margin: 22px 0 7px; }
:deep(.detail-tabs > .ant-tabs-nav .ant-tabs-tab) { padding: 17px 4px; font-weight: 600; }
</style>
