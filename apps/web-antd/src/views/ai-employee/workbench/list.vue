<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// Mock agents data with image links
const agents = ref([
  {
    id: 'agt_1',
    name: '选品报价员',
    role: '销售线',
    colorClass: 'text-blue-600 bg-blue-50 border-blue-200',
    intro: '熟悉市场的选品与报价专家，快速根据需求筛选高利润药品并生成报价。',
    image: `${import.meta.env.BASE_URL}images/ai-employee/sales.png`,
    status: 'online',
  },
  {
    id: 'agt_2',
    name: '数据分析员',
    role: '数据线',
    colorClass: 'text-purple-600 bg-purple-50 border-purple-200',
    intro: '实时抓取前中台系统的各业务线数据并生成多维可视化分析报表。',
    image: `${import.meta.env.BASE_URL}images/ai-employee/data.png`,
    status: 'online',
  },
  {
    id: 'agt_3',
    name: '库管预警员',
    role: '供应链线',
    colorClass: 'text-amber-600 bg-amber-50 border-amber-200',
    intro: '24小时无休的仓库看守，每日巡检库存并拦截即效期或濒临缺货产品。',
    image: `${import.meta.env.BASE_URL}images/ai-employee/warehouse.png`,
    status: 'offline',
  },
  {
    id: 'agt_4',
    name: '合规审核专员',
    role: '财务线',
    colorClass: 'text-red-600 bg-red-50 border-red-200',
    intro: '进行合同条款与药监局规定的自动比对，发现潜在合规风险。',
    image: `${import.meta.env.BASE_URL}images/ai-employee/finance.png`,
    status: 'busy',
  },
  {
    id: 'agt_5',
    name: '智能填报专员',
    role: '财务线',
    colorClass: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    intro: '智能报销单据生成专家，自动筛选发票并创建差旅报销单。',
    image: `${import.meta.env.BASE_URL}images/ai-employee/咨询人员.jpg`,
    status: 'online',
  },
  {
    id: 'agt_6',
    name: 'PPT助理',
    role: '办公效率线',
    colorClass: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    intro:
      '企业专属 PPT 生成专家，基于方案库、模板库、案例库和知识库一键生成专业演示文稿。',
    image: `${import.meta.env.BASE_URL}images/ai-employee/插画设计师.jpg`,
    status: 'online',
  },
  {
    id: 'agt_7',
    name: '费用类智能填报专员',
    role: '财务线',
    colorClass: 'text-cyan-600 bg-cyan-50 border-cyan-200',
    intro: '智能费用报销单据生成专家，自动筛选费用类发票并创建费用报销单。',
    image: `${import.meta.env.BASE_URL}images/ai-employee/咨询人员.jpg`,
    status: 'online',
  },
  {
    id: 'agt_8',
    name: '智能填报专员v2',
    role: '财务线',
    colorClass: 'text-teal-600 bg-teal-50 border-teal-200',
    intro:
      '智能费用报销单据生成专家v2，支持数据收集步骤配置，灵活编排填报流程。',
    image: `${import.meta.env.BASE_URL}images/ai-employee/咨询人员.jpg`,
    status: 'online',
  },
  {
    id: 'agt_9',
    name: '智能填报专员v3',
    role: '财务线',
    colorClass: 'text-sky-600 bg-sky-50 border-sky-200',
    intro: '智能费用报销单据生成专家v3，独立数据驱动的填报流程演示。',
    image: `${import.meta.env.BASE_URL}images/ai-employee/咨询人员.jpg`,
    status: 'online',
  },
  {
    id: 'agt_10',
    name: '填报助理',
    role: '财务线',
    colorClass: 'text-violet-600 bg-violet-50 border-violet-200',
    intro:
      '引导式报销填报助理，自动扫描发票池、智能匹配行程并预校验合规，分步协助完成报销单填报。',
    image: `${import.meta.env.BASE_URL}images/ai-employee/咨询人员.jpg`,
    status: 'online',
  },
]);

function handleChat(agent: any) {
  router.push(`/ai-employee/workbench/chat/${agent.id}`);
}
</script>

<template>
  <div
    class="flex min-h-[calc(100vh-100px)] flex-col gap-6 bg-slate-50/50 p-6 md:p-8"
  >
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <h1 class="text-3xl font-bold tracking-tight text-slate-900">
        智能体员工工作台
      </h1>
      <p class="font-medium text-slate-500">
        点击您需要协同的员工名片，即可进入工作台分配任务。
      </p>
    </div>

    <!-- Masonry-like Flex Wrap Grid -->
    <div class="mt-4 flex flex-wrap gap-6">
      <div
        v-for="agent in agents"
        :key="agent.id"
        class="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)]"
        style="width: 240px; height: 360px"
        @click="handleChat(agent)"
      >
        <!-- Top Image Section (240x240) -->
        <div
          class="relative h-[240px] w-full shrink-0 overflow-hidden bg-slate-100"
        >
          <img
            :src="agent.image"
            alt="agent photo"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <!-- Gradient overlay for text readability if needed -->
          <div
            class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent"
          ></div>

          <!-- Status Badge -->
          <div
            class="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm"
            :class="{
              'text-green-600': agent.status === 'online',
              'text-amber-500': agent.status === 'busy',
              'text-slate-400': agent.status === 'offline',
            }"
          >
            <span class="relative flex h-2 w-2">
              <span
                v-if="agent.status === 'online'"
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex h-2 w-2 rounded-full"
                :class="{
                  'bg-green-500': agent.status === 'online',
                  'bg-amber-500': agent.status === 'busy',
                  'bg-slate-300': agent.status === 'offline',
                }"
              ></span>
            </span>
            {{
              agent.status === 'online'
                ? '在线'
                : agent.status === 'busy'
                  ? '忙碌'
                  : '休息'
            }}
          </div>
        </div>

        <!-- Bottom Info Section (240x120) -->
        <div
          class="flex h-[120px] w-full shrink-0 flex-col justify-between p-4"
        >
          <div>
            <div class="flex items-center justify-between">
              <h3
                class="text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600"
              >
                {{ agent.name }}
              </h3>
              <span
                class="rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                :class="
                  agent.colorClass ||
                  'border-transparent bg-slate-100 text-slate-400'
                "
              >
                {{ agent.role }}
              </span>
            </div>

            <p
              class="mt-2 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500"
              :title="agent.intro"
            >
              {{ agent.intro }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
