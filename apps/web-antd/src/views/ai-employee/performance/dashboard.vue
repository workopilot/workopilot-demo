<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Avatar,
  Button,
  Empty,
  RadioButton,
  RadioGroup,
  Select,
  Tag,
} from 'ant-design-vue';

type Health = 'critical' | 'normal' | 'unset' | 'warning';

interface EmployeeMetric {
  actual: number;
  direction?: 'higher' | 'lower';
  name: string;
  target: number;
  type?: 'count' | 'duration' | 'staged';
  unit: string;
}

interface EmployeeCard {
  avatar: string;
  business: string;
  department: string;
  health: Health;
  id: string;
  metrics: EmployeeMetric[];
  name: string;
  score?: number;
  type: 'CHAT' | 'TASK';
}

const router = useRouter();
const periodType = ref('month');
const period = ref('2026-09');
const employee = ref('all');
const business = ref('all');
const employeeType = ref('all');
const health = ref('all');
const dimension = ref('all');
const calendarProgress = 70;

const employees: EmployeeCard[] = [
  { id: 'order', name: '订单录入助理', department: '销售运营部', business: '订单运营', type: 'TASK', avatar: '/auditdemo/images/ai-employee/sales.png', health: 'warning', score: 76, metrics: [{ name: '订单录入量', actual: 326, target: 420, unit: '单', type: 'count' }, { name: '全流程平均耗时', actual: 9.6, target: 8, unit: '分钟', type: 'staged', direction: 'lower' }] },
  { id: 'ppt-a', name: '演示文稿设计师 A', department: '品牌市场部', business: '营销', type: 'TASK', avatar: '/auditdemo/images/ai-employee/设计师.jpg', health: 'normal', score: 104, metrics: [{ name: 'PPT 数', actual: 24, target: 20, unit: '份' }, { name: '使用人数', actual: 38, target: 40, unit: '人' }] },
  { id: 'finance', name: '财务审核助手', department: '财务共享中心', business: '财务', type: 'CHAT', avatar: '/auditdemo/images/ai-employee/财务.jpg', health: 'normal', score: 96, metrics: [{ name: '审核单据数', actual: 527, target: 550, unit: '单' }, { name: '使用人数', actual: 51, target: 50, unit: '人' }] },
  { id: 'ops', name: '运维智能助手', department: '信息技术部', business: '运维', type: 'CHAT', avatar: '/auditdemo/images/ai-employee/技术员.jpg', health: 'warning', score: 68, metrics: [{ name: '已解决工单数', actual: 240, target: 450, unit: '单' }, { name: '使用人数', actual: 42, target: 50, unit: '人' }] },
  { id: 'data', name: '经营数据分析员', department: '数据中心', business: '经营分析', type: 'TASK', avatar: '/auditdemo/images/ai-employee/data.png', health: 'warning', score: 65, metrics: [{ name: '分析报告数', actual: 15, target: 24, unit: '份' }, { name: '有效使用时长', actual: 28, target: 40, unit: '小时' }] },
  { id: 'ppt-b', name: '演示文稿设计师 B', department: '售前支持部', business: '营销', type: 'TASK', avatar: '/auditdemo/images/ai-employee/插画设计师.jpg', health: 'critical', score: 28, metrics: [{ name: 'PPT 数', actual: 6, target: 50, unit: '份' }, { name: '使用人数', actual: 8, target: 35, unit: '人' }] },
  { id: 'warehouse', name: '库存预警员', department: '供应链部', business: '供应链', type: 'TASK', avatar: '/auditdemo/images/ai-employee/warehouse.png', health: 'critical', score: 35, metrics: [{ name: '预警处理数', actual: 73, target: 220, unit: '条' }, { name: '使用人数', actual: 11, target: 30, unit: '人' }] },
  { id: 'office', name: '办公协作助手', department: '总裁办公室', business: '综合办公', type: 'CHAT', avatar: '/auditdemo/images/ai-employee/咨询人员.jpg', health: 'unset', metrics: [{ name: '周报数量', actual: 3, target: 0, unit: '份' }, { name: '有效使用时长', actual: 12, target: 0, unit: '小时' }] },
  { id: 'sales', name: '选品报价员', department: '销售运营部', business: '营销', type: 'CHAT', avatar: '/auditdemo/images/ai-employee/sales.png', health: 'normal', score: 91, metrics: [{ name: '报价单数', actual: 138, target: 150, unit: '份' }, { name: '使用人数', actual: 46, target: 50, unit: '人' }] },
];

const ranking = [
  { name: '演示文稿设计师 A', score: 104 }, { name: '财务审核助手', score: 96 },
  { name: '合规审核专员', score: 93 }, { name: '选品报价员', score: 91 },
  { name: '合同分析助手', score: 88 }, { name: '客服质检员', score: 84 },
  { name: '销售线索助手', score: 81 }, { name: '运维智能助手', score: 68 },
  { name: '经营数据分析员', score: 65 }, { name: '知识库助手', score: 62 },
];

const bottomRanking = [
  { name: '演示文稿设计师 B', score: 28, reason: 'PPT 使用率持续偏低' },
  { name: '库存预警员', score: 35, reason: '预警处理进度滞后' },
  { name: '招聘筛选助手', score: 41, reason: '有效使用人数不足' },
  { name: '会议纪要助手', score: 47, reason: '产出量低于日历进度' },
  { name: '采购询价助手', score: 52, reason: '目标设置高于历史均值' },
];

const filteredEmployees = computed(() => employees.filter((item) =>
  (employee.value === 'all' || item.id === employee.value)
  && (business.value === 'all' || item.business === business.value)
  && (employeeType.value === 'all' || item.type === employeeType.value)
  && (health.value === 'all' || item.health === health.value)
  && (dimension.value === 'all' || item.metrics.some((metric) => metric.name === dimension.value)),
));

const healthMeta: Record<Health, { bar: string; label: string; tag: string }> = {
  normal: { bar: 'bg-emerald-500', label: '正常', tag: 'success' },
  warning: { bar: 'bg-orange-400', label: '预警', tag: 'warning' },
  critical: { bar: 'bg-red-500', label: '严重不达标', tag: 'error' },
  unset: { bar: 'bg-slate-300', label: '未设置绩效', tag: 'default' },
};

function rate(metric: EmployeeMetric) {
  if (!metric.target) return 0;
  if (metric.direction === 'lower') {
    return Math.round((metric.target / Math.max(metric.actual, 0.01)) * 100);
  }
  return Math.round((metric.actual / metric.target) * 100);
}

function metricTypeLabel(metric: EmployeeMetric) {
  return metric.type === 'staged' ? '多阶段耗时' : metric.type === 'duration' ? '单段耗时' : '数量累计';
}

function progressColor(metric: EmployeeMetric) {
  const value = rate(metric);
  if (value >= 90) return '#10b981';
  if (value >= calendarProgress - 15) return '#f59e0b';
  return '#ef4444';
}
</script>

<template>
  <main class="min-h-[calc(100vh-100px)] bg-slate-50/70 p-4 md:p-6 xl:p-8">
    <div class="mx-auto max-w-[1680px]">
      <header class="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div class="mb-2 flex items-center gap-2 text-sm font-medium"><span class="rounded-md bg-blue-50 px-2 py-1 text-blue-600">数字员工中心</span><Icon icon="lucide:chevron-right" class="size-4 text-slate-400" /><span class="text-slate-500">绩效看板</span></div>
          <h1 class="m-0 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">绩效看板</h1>
          <p class="mb-0 mt-2 text-sm text-slate-500">按当前周期进度识别绩效偏差，快速找到需要关注和调整目标的数字员工。</p>
        </div>
        <Button @click="router.push('/digital-employees/performance')"><Icon icon="lucide:settings-2" class="mr-1" />数字绩效设置</Button>
      </header>

      <section class="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <RadioGroup v-model:value="periodType" button-style="solid"><RadioButton value="month">月度</RadioButton><RadioButton value="quarter">季度</RadioButton></RadioGroup>
          <Select v-model:value="period" class="w-36" aria-label="考核周期" :options="periodType === 'month' ? [{value:'2026-09',label:'2026 年 9 月'},{value:'2026-08',label:'2026 年 8 月'}] : [{value:'2026-Q3',label:'2026 年 Q3'},{value:'2026-Q2',label:'2026 年 Q2'}]" />
          <Select v-model:value="employee" class="w-44" aria-label="数字员工" :options="[{value:'all',label:'全部员工'},...employees.map((item) => ({value:item.id,label:item.name}))]" />
          <Select v-model:value="business" class="w-32" aria-label="业务线" :options="[{value:'all',label:'全部业务线'},...Array.from(new Set(employees.map((item) => item.business))).map((value) => ({value,label:value}))]" />
          <Select v-model:value="employeeType" class="w-32" aria-label="员工类型" :options="[{value:'all',label:'全部类型'},{value:'CHAT',label:'CHAT'},{value:'TASK',label:'TASK'}]" />
          <Select v-model:value="dimension" class="w-40" aria-label="绩效维度" :options="[{value:'all',label:'全部指标'},{value:'订单录入量',label:'订单录入量'},{value:'全流程平均耗时',label:'全流程平均耗时'},{value:'PPT 数',label:'PPT 数'},{value:'使用人数',label:'使用人数'},{value:'有效使用时长',label:'有效使用时长'},{value:'已解决工单数',label:'已解决工单数'}]" />
          <Select v-model:value="health" class="w-36" aria-label="绩效状态" :options="[{value:'all',label:'全部状态'},{value:'normal',label:'正常'},{value:'warning',label:'预警'},{value:'critical',label:'严重不达标'},{value:'unset',label:'未设置绩效'}]" />
          <Button type="text" @click="employee='all';business='all';employeeType='all';dimension='all';health='all'">重置</Button>
        </div>
        <div class="mt-4 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-500 md:flex-row md:items-center">
          <div class="flex flex-wrap gap-4"><span class="legend"><i class="bg-emerald-500"></i>正常</span><span class="legend"><i class="bg-orange-400"></i>预警</span><span class="legend"><i class="bg-red-500"></i>严重不达标</span><span class="legend"><i class="bg-slate-300"></i>未设置绩效</span></div>
          <span>本期日历进度 <b class="text-slate-700">{{ calendarProgress }}%</b> · 完成率 ≥ 90% 为绿色，低于 90% 时结合日历进度判断</span>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_310px]">
        <section>
          <div class="mb-3 flex items-center justify-between"><div><h2 class="m-0 text-base font-bold text-slate-900">数字员工表现</h2><p class="mb-0 mt-1 text-xs text-slate-500">共 {{ filteredEmployees.length }} 名员工</p></div><div class="flex items-center gap-2 text-xs text-slate-500"><span class="size-2 rounded-full bg-emerald-500"></span>更新于 5 分钟前</div></div>
          <div v-if="filteredEmployees.length" class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button v-for="item in filteredEmployees" :key="item.id" class="employee-card group text-left" @click="router.push(`/digital-employees/performance/${item.id}`)">
              <div class="h-1 w-full" :class="healthMeta[item.health].bar"></div>
              <div class="p-3.5">
                <div class="mb-3 flex items-start justify-between gap-2"><div class="flex min-w-0 items-center gap-2.5"><Avatar :size="40" :src="item.avatar" class="ring-2 ring-slate-100" /><div class="min-w-0"><h3 class="m-0 truncate text-sm font-bold text-slate-900 group-hover:text-blue-600">{{ item.name }}</h3><p class="mb-0 mt-0.5 truncate text-[11px] text-slate-500">{{ item.department }} · {{ item.type }}</p></div></div><Tag :color="healthMeta[item.health].tag" class="!m-0 shrink-0 !text-[10px]">{{ healthMeta[item.health].label }}</Tag></div>
                <div class="space-y-2">
                  <div v-for="metric in item.metrics" :key="metric.name" class="metric-compact">
                    <div class="mb-1 flex items-center justify-between gap-2"><span class="truncate text-[11px] font-medium text-slate-500">{{ metric.name }}</span><b v-if="metric.target" class="text-xs" :style="{color: progressColor(metric)}">{{ rate(metric) }}%</b><span v-else class="text-[10px] text-slate-400">仅统计</span></div>
                    <div class="mb-1 flex items-baseline justify-between gap-2"><b class="text-[15px] leading-none text-slate-800">{{ metric.actual }}<small class="ml-0.5 text-[10px] font-normal text-slate-400">{{ metric.unit }}</small></b><span class="text-[10px] text-slate-400">目标 {{ metric.direction === 'lower' ? '≤ ' : '' }}{{ metric.target || '—' }}</span></div>
                    <div class="relative h-1.5 overflow-visible rounded-full bg-slate-100"><div class="h-full rounded-full" :style="{width:`${metric.target ? Math.min(rate(metric),100) : 0}%`,backgroundColor:metric.target ? progressColor(metric) : '#cbd5e1'}"></div><span v-if="metric.target" class="absolute -top-0.5 h-2.5 w-px bg-slate-600" :style="{left:`${calendarProgress}%`}" title="当前日历进度"></span></div>
                    <div v-if="metric.type" class="mt-1.5 flex items-center gap-1 text-[9px] text-slate-400"><Icon :icon="metric.type === 'staged' ? 'lucide:workflow' : metric.type === 'duration' ? 'lucide:timer' : 'lucide:hash'" class="size-3" />{{ metricTypeLabel(metric) }}</div>
                  </div>
                </div>
                <div class="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5"><span class="text-[10px] text-slate-400">日历进度 {{ calendarProgress }}%</span><span v-if="item.score" class="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">绩效指数 {{ item.score }}</span><span class="grid size-6 place-items-center rounded-full bg-blue-50 text-blue-600 transition-transform group-hover:translate-x-0.5"><Icon icon="lucide:arrow-right" class="size-3.5" /></span></div>
              </div>
            </button>
          </div>
          <div v-else class="rounded-2xl border border-slate-200 bg-white py-20"><Empty description="没有符合条件的数字员工" /></div>
        </section>

        <aside class="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:block 2xl:space-y-5">
          <section class="ranking-card"><div class="ranking-title"><span class="bg-amber-50 text-amber-600"><Icon icon="lucide:trophy" /></span><div><h2>绩效排名 Top 10</h2><p>同周期目标完成综合指数</p></div></div><ol class="mt-4 space-y-1"><li v-for="(item,index) in ranking" :key="item.name" class="ranking-row"><span class="rank" :class="index < 3 ? 'rank-top' : ''">{{ index + 1 }}</span><span class="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">{{ item.name }}</span><b class="text-sm" :class="item.score >= 90 ? 'text-emerald-600' : 'text-slate-700'">{{ item.score }}</b></li></ol></section>
          <section class="ranking-card"><div class="ranking-title"><span class="bg-red-50 text-red-600"><Icon icon="lucide:triangle-alert" /></span><div><h2>重点关注 5 名</h2><p>绩效指数最低，需要优先分析</p></div></div><div class="mt-4 space-y-2"><button v-for="(item,index) in bottomRanking" :key="item.name" class="flex w-full items-center gap-3 rounded-lg p-2.5 text-left hover:bg-red-50" @click="router.push(`/digital-employees/performance/${index === 0 ? 'ppt-b' : 'ops'}`)"><span class="grid size-7 place-items-center rounded-full bg-red-50 text-xs font-bold text-red-600">{{ index + 1 }}</span><span class="min-w-0 flex-1"><b class="block truncate text-sm text-slate-700">{{ item.name }}</b><small class="block truncate text-slate-400">{{ item.reason }}</small></span><b class="text-sm text-red-600">{{ item.score }}</b></button></div></section>
        </aside>
      </div>
    </div>
  </main>
</template>

<style scoped>
.legend { display: inline-flex; align-items: center; gap: 6px; }
.legend i { width: 18px; height: 4px; border-radius: 999px; }
.employee-card { position: relative; overflow: hidden; width: 100%; min-width: 0; border: 1px solid rgb(226 232 240); border-radius: 12px; background: linear-gradient(155deg, #fff 0%, #fff 72%, #f8fafc 100%); box-shadow: 0 1px 3px rgb(15 23 42 / 5%); transition: border-color .2s, box-shadow .2s, transform .2s; }
.employee-card:hover { border-color: rgb(147 197 253); box-shadow: 0 10px 22px rgb(15 23 42 / 9%); transform: translateY(-2px); }
.employee-card:focus-visible { outline: 2px solid rgb(37 99 235); outline-offset: 2px; }
.metric-compact { border: 1px solid rgb(241 245 249); border-radius: 9px; padding: 9px 10px; background: rgb(248 250 252 / 72%); }
.ranking-card { border: 1px solid rgb(226 232 240); border-radius: 14px; padding: 18px; background: white; box-shadow: 0 1px 2px rgb(15 23 42 / 4%); }
.ranking-title { display: flex; align-items: center; gap: 11px; }
.ranking-title > span { display: grid; width: 38px; height: 38px; place-items: center; border-radius: 10px; font-size: 18px; }
.ranking-title h2 { margin: 0; color: rgb(15 23 42); font-size: 15px; font-weight: 700; }
.ranking-title p { margin: 3px 0 0; color: rgb(148 163 184); font-size: 11px; }
.ranking-row { display: flex; align-items: center; gap: 10px; min-height: 37px; padding: 4px 6px; border-radius: 8px; }
.ranking-row:hover { background: rgb(248 250 252); }
.rank { display: grid; width: 24px; height: 24px; place-items: center; border-radius: 7px; background: rgb(241 245 249); color: rgb(100 116 139); font-size: 11px; font-weight: 700; }
.rank-top { background: rgb(255 247 237); color: rgb(234 88 12); }
@media (prefers-reduced-motion: reduce) { .employee-card { transition: none; } }
</style>
