<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Progress, Table, Tag } from 'ant-design-vue';

// Mock Data
const stats = ref([
  {
    title: '当前系统可用额度',
    value: '￥428.50',
    sub: '足够支付约 428 次企业级增值调用',
    icon: 'lucide:coins',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    title: '本月报价单与宣传册生成',
    value: '1,245',
    sub: '单次高价值图文打包调用 ￥1.50',
    icon: 'lucide:file-spreadsheet',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    title: '本月报表分析调用',
    value: '312',
    sub: '单次业务深度图表分析调用 ￥2.00',
    icon: 'lucide:bar-chart-3',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    title: '基础对话交互调用',
    value: '85,420',
    sub: '全网普通文本检索与闲聊免费提供',
    icon: 'lucide:message-square',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
]);

const services = ref([
  {
    name: '选品报价员 (生成打包图文单据)',
    percent: 65,
    cost: '￥185.00',
    color: '#3b82f6',
  },
  {
    name: '数据分析员 (多维报表与驾驶舱)',
    percent: 25,
    cost: '￥75.50',
    color: '#8b5cf6',
  },
  {
    name: '库管预警员 (库存分析与自动邮件)',
    percent: 10,
    cost: '￥35.00',
    color: '#10b981',
  },
]);

const columns = [
  { title: '账单流水号', dataIndex: 'id', key: 'id', width: 170 },
  { title: '金额变动', dataIndex: 'amount', key: 'amount', width: 90 },
  { title: '触发的业务事件', dataIndex: 'type', key: 'type', width: 280 },
  { title: '代理智能体', dataIndex: 'agent', key: 'agent', width: 120 },
  { title: '交易结算时间', dataIndex: 'time', key: 'time' },
];

const mockData = ref([
  {
    key: '1',
    id: 'TX-20260318-0901',
    type: '一键生成「牙科消炎药」报价单与高清宣传册',
    agent: '选品报价员',
    amount: '-￥1.50',
    time: '2026-03-18 10:04:12',
  },
  {
    key: '2',
    id: 'TX-20260318-0895',
    type: '执行本周近效期盘点与邮件自动触达',
    agent: '库管预警员',
    amount: '-￥0.50',
    time: '2026-03-18 09:00:00',
  },
  {
    key: '3',
    id: 'TX-20260317-1044',
    type: '月度经营分析驾驶舱报告绘制 (图表插件)',
    agent: '数据分析员',
    amount: '-￥2.00',
    time: '2026-03-17 18:30:15',
  },
  {
    key: '4',
    id: 'TX-20260317-0091',
    type: '企业高速通道高价值算力包套餐',
    agent: '系统总线',
    amount: '+￥500.00',
    time: '2026-03-17 10:00:00',
  },
  {
    key: '5',
    id: 'TX-20260316-0888',
    type: '提取「百善堂儿科感冒药」选品打包资料',
    agent: '选品报价员',
    amount: '-￥1.50',
    time: '2026-03-16 14:20:00',
  },
]);
</script>
<template>
  <div
    class="flex min-h-[calc(100vh-100px)] flex-col gap-6 bg-slate-50/50 p-6 md:p-8"
  >
    <!-- Header part -->
    <div class="flex flex-col items-start gap-6 xl:flex-row">
      <div
        class="group relative flex min-h-[160px] w-full flex-1 flex-col justify-center overflow-hidden rounded-[1.5rem] border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-8 shadow-lg xl:max-w-md"
      >
        <Icon
          icon="lucide:chart-line"
          class="pointer-events-none absolute -bottom-6 -right-6 size-40 text-white/5 transition-transform duration-700 group-hover:rotate-6"
        />
        <h1
          class="relative z-10 m-0 flex items-center gap-3 text-[1.8rem] font-extrabold tracking-tight text-white"
        >
          企业运营与计费中心
        </h1>
        <p
          class="relative z-10 m-0 mt-3 text-[13px] font-medium leading-relaxed text-slate-400"
        >
          当前企业接入方：<strong class="text-white"
            >香港星空长海诊所有限公司 (T-50291)</strong
          >
          <br />全局追踪大模型额度消耗情况、记录各数字代理人的服务产出频次与拦截的高价值动作计费。
        </p>
        <div class="relative z-10 mt-5">
          <Button
            type="primary"
            class="flex items-center gap-2 !rounded-xl border-none bg-blue-600 font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-500"
          >
            <Icon icon="lucide:credit-card" class="size-4" /> 采购高阶增值算力包
          </Button>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid w-full flex-1 grid-cols-2 gap-4 lg:grid-cols-4">
        <div
          v-for="(stat, idx) in stats"
          :key="idx"
          class="relative flex flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
        >
          <div class="mb-2 flex items-center justify-between">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-xl"
              :class="[stat.bg, stat.color]"
            >
              <Icon :icon="stat.icon" class="size-5" />
            </div>
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
    </div>

    <!-- Main Content -->
    <div class="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_390px]">
      <!-- Table (Recent consumption) -->
      <div
        class="relative flex flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm"
      >
        <div class="mb-6 flex items-center justify-between">
          <h3
            class="m-0 flex items-center gap-2 text-[16px] font-extrabold text-slate-800"
          >
            <Icon icon="lucide:receipt" class="size-5 text-blue-500" />
            最近的单次消费流水明细
          </h3>
          <Button
            class="flex items-center gap-2 !rounded-lg text-xs font-semibold text-slate-500 hover:text-blue-600"
          >
            <Icon icon="lucide:download-cloud" class="size-4" />
            导出本月对账凭证
          </Button>
        </div>

        <Table
          :columns="columns"
          :data-source="mockData"
          :pagination="false"
          class="modern-table text-[13px]"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'id'">
              <span class="font-mono text-xs tracking-wider text-slate-400">{{
                record.id
              }}</span>
            </template>
            <template v-if="column.key === 'amount'">
              <span
                class="font-mono text-[15px] font-extrabold"
                :class="
                  record.amount.startsWith('-')
                    ? 'text-slate-800'
                    : 'text-emerald-500'
                "
              >
                {{ record.amount }}
              </span>
            </template>
            <template v-if="column.key === 'type'">
              <div class="flex flex-col gap-1.5 py-1">
                <div class="flex items-center gap-2">
                  <Tag
                    v-if="record.amount.startsWith('-')"
                    color="blue"
                    class="!m-0 !rounded text-[10px] font-bold tracking-wide"
                  >
                    高级截断
                  </Tag>
                  <Tag
                    v-if="record.amount.startsWith('+')"
                    color="amber"
                    class="!m-0 !rounded text-[10px] font-bold tracking-wide"
                  >
                    高速网关接入
                  </Tag>
                  <span class="text-[13px] font-extrabold text-slate-700">{{
                    record.type
                  }}</span>
                </div>
              </div>
            </template>
            <template v-if="column.key === 'agent'">
              <span class="flex items-center gap-1.5 font-bold text-slate-600">
                <Icon
                  icon="lucide:bot"
                  class="size-4 text-slate-400"
                  v-if="record.agent !== '系统总线'"
                />
                <Icon
                  icon="lucide:server"
                  class="size-4 text-emerald-400"
                  v-else
                />
                {{ record.agent }}
              </span>
            </template>
            <template v-if="column.key === 'time'">
              <span class="text-[11px] font-medium text-slate-400">{{
                record.time
              }}</span>
            </template>
          </template>
        </Table>
      </div>

      <!-- Right Col (Service Invocation Breakdown) -->
      <div
        class="relative flex h-full flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm"
      >
        <h3
          class="m-0 mb-6 flex items-center gap-2 text-[16px] font-extrabold text-slate-800"
        >
          <Icon icon="lucide:pie-chart" class="size-5 text-purple-500" />
          AI 服务增值项损耗占比
        </h3>

        <div class="flex flex-1 flex-col gap-4">
          <div
            v-for="(srv, i) in services"
            :key="i"
            class="flex flex-col gap-2 rounded-[1rem] border border-slate-200/60 bg-slate-50/70 p-4 shadow-sm transition-colors hover:border-slate-300"
          >
            <div class="flex items-center justify-between">
              <div class="text-[13px] font-extrabold text-slate-700">
                {{ srv.name }}
              </div>
              <div
                class="font-mono text-[14px] font-bold"
                :style="{ color: srv.color }"
              >
                {{ srv.percent }}%
              </div>
            </div>
            <!-- Mini Progress component styled beautifully -->
            <Progress
              :percent="srv.percent"
              :show-info="false"
              size="small"
              :stroke-color="srv.color"
              trail-color="#e2e8f0"
              class="!m-0 mt-1"
            />
            <div
              class="mt-2 flex items-center justify-between border-t border-slate-100 pt-2"
            >
              <span class="text-[11px] font-medium text-slate-400"
                >包含基础/附加调用计费</span
              >
              <span
                class="font-mono text-[13px] font-extrabold text-slate-700"
                >{{ srv.cost }}</span
              >
            </div>
          </div>

          <!-- Warning / Hint box -->
          <div
            class="mt-4 flex gap-3 rounded-[1rem] border border-amber-200 bg-amber-50 p-4 shadow-inner"
          >
            <Icon
              icon="lucide:info"
              class="mt-0.5 size-5 shrink-0 text-amber-500"
            />
            <p
              class="m-0 text-[12px] font-medium leading-relaxed text-amber-700"
            >
              <strong class="font-extrabold">计费机制保障：</strong
              >常规对话文字沟通
              <span class="underline underline-offset-2">无限且完全免费</span
              >。仅在数字员工调取诸如生成报表、文件、触达外部邮件等消耗第三方节点算力的高昂工作流时才会产生上述扣费流水。
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.modern-table :deep(.ant-table-wrapper) {
  overflow: hidden;
  border-radius: 1rem;
}

.modern-table :deep(.ant-table-thead > tr > th) {
  padding: 14px 16px;
  font-weight: 700;
  color: #64748b;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.modern-table :deep(.ant-table-tbody > tr > td) {
  padding: 14px 16px;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.2s;
}

.modern-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fafc;
}
</style>
