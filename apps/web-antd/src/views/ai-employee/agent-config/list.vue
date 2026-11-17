<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button } from 'ant-design-vue';

const router = useRouter();

// Mock agents data with image links
const agents = ref([
  {
    id: 'agt_1',
    name: '选品报价员',
    role: '销售部',
    intro: '熟悉市场的选品与报价专家，快速根据需求筛选高利润药品并生成报价。',
    image: `${import.meta.env.BASE_URL}images/ai-employee/sales.png`,
    status: 'online',
  },
  {
    id: 'agt_2',
    name: '数据分析员',
    role: '数据中心',
    intro: '实时抓取前中台系统的各业务线数据并生成多维可视化分析报表。',
    image: `${import.meta.env.BASE_URL}images/ai-employee/data.png`,
    status: 'online',
  },
  {
    id: 'agt_3',
    name: '库管预警员',
    role: '供应链部',
    intro: '24小时无休的仓库看守，每日巡检库存并拦截即效期或濒临缺货产品。',
    image: `${import.meta.env.BASE_URL}images/ai-employee/warehouse.png`,
    status: 'offline',
  },
  {
    id: 'agt_4',
    name: '合规审核专员',
    role: '风控合规部',
    intro: '进行合同条款与药监局规定的自动比对，发现潜在合规风险。',
    image: `${import.meta.env.BASE_URL}images/ai-employee/finance.png`,
    status: 'busy',
  },
]);

function handleEdit(agent: any) {
  router.push(`/ai-employee/agent-config/edit/${agent.id}`);
}

function handleCreate() {
  router.push(`/ai-employee/agent-config/edit/new`);
}
</script>

<template>
  <div
    class="flex min-h-[calc(100vh-100px)] flex-col gap-6 bg-slate-50/50 p-6 md:p-8"
  >
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h1 class="text-3xl font-bold tracking-tight text-slate-900">
          智能体配置中心
        </h1>
        <Button
          type="primary"
          size="large"
          class="flex items-center gap-2 shadow-sm"
          @click="handleCreate"
        >
          <Icon icon="lucide:plus" class="size-5" />
          新增数字员工
        </Button>
      </div>
      <p class="font-medium text-slate-500">
        管理并配置企业内的智能体应用，分配权限并绑定工作流。点击卡片或编辑按钮以修改配置。
      </p>
    </div>

    <!-- Masonry-like Flex Wrap Grid -->
    <div class="mt-4 flex flex-wrap gap-6">
      <div
        v-for="agent in agents"
        :key="agent.id"
        class="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-[0_12px_24px_-8px_rgba(0,0,0,0.15)]"
        style="width: 240px; height: 360px"
        @click="handleEdit(agent)"
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
          <!-- Gradient overlay for text readability -->
          <div
            class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent"
          ></div>

          <!-- Edit Overlay Icon on hover -->
          <div
            class="absolute inset-0 z-10 hidden items-center justify-center bg-black/20 backdrop-blur-[1px] group-hover:flex"
          >
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg"
            >
              <Icon icon="lucide:pencil" class="size-5" />
            </div>
          </div>

          <!-- Status Badge -->
          <div
            class="absolute right-3 top-3 z-20 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm"
            :class="{
              'text-green-600': agent.status === 'online',
              'text-amber-500': agent.status === 'busy',
              'text-slate-400': agent.status === 'offline',
            }"
          >
            {{
              agent.status === 'online'
                ? '使用中'
                : agent.status === 'busy'
                  ? '调试中'
                  : '已停用'
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
                class="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"
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

          <!-- Optional inline edit label -->
          <div
            class="mt-auto flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 opacity-0 transition-opacity group-hover:text-blue-500 group-hover:opacity-100"
          >
            点击进入编辑配置
            <Icon icon="lucide:arrow-right" class="size-3" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
