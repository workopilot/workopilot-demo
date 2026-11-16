<script setup lang="ts">
import { computed } from 'vue';

import { Button, Input, Tag } from 'ant-design-vue';

interface PptSlide {
  bullets: string[];
  cases: string[];
  copy: string;
  id: string;
  knowledge: string[];
  subtitle: string;
  title: string;
}

const props = defineProps<{
  selectedPptScheme: string;
  selectedPptSlideId: string;
  selectedPptStyle: string;
  slides: PptSlide[];
}>();

const emit = defineEmits<{
  'export-pdf': [];
  'export-ppt': [];
  'regenerate-current-slide': [];
  'update-copy': [slideId: string, value: string];
  'update:selectedPptSlideId': [value: string];
}>();

const activePptSlide = computed(
  () =>
    props.slides.find((item) => item.id === props.selectedPptSlideId) ||
    props.slides[0],
);
const activeSlideIndex = computed(() => {
  const index = props.slides.findIndex(
    (item) => item.id === props.selectedPptSlideId,
  );
  return Math.max(index, 0);
});

const slideTypes = ['封面', '背景', '痛点', '方案', '路径'];
const metricCards = [
  { label: '适配周期', value: '30%', unit: '缩短' },
  { label: '稳定运行', value: '7×24', unit: '保障' },
  { label: '交付响应', value: '48h', unit: '闭环' },
];
const solutionModules = ['参数配置', '产线适配', '交付协同', '售后保障'];
const timelineSteps = [
  '需求确认',
  '现场评估',
  '部署适配',
  '上线验收',
  '持续服务',
];
</script>

<template>
  <div
    class="grid min-w-0 flex-1 grid-cols-[160px_minmax(0,1fr)_360px] bg-slate-50"
  >
    <aside class="border-r border-slate-100 bg-white p-4">
      <div class="mb-3 text-sm font-black text-slate-900">PPT 页缩略图</div>
      <div class="space-y-3 overflow-y-auto">
        <button
          v-for="(slide, index) in slides"
          :key="slide.id"
          class="w-full rounded-2xl border p-2 text-left transition-all hover:-translate-y-0.5"
          :class="[
            selectedPptSlideId === slide.id
              ? 'border-emerald-300 bg-emerald-50 shadow-md shadow-emerald-900/10'
              : 'border-slate-100 bg-slate-50 hover:bg-white hover:shadow-sm',
          ]"
          @click="emit('update:selectedPptSlideId', slide.id)"
        >
          <div
            class="relative mb-2 aspect-video overflow-hidden rounded-xl p-2 text-[10px] font-black text-white"
            :class="[
              [
                'bg-gradient-to-br from-slate-950 via-blue-950 to-cyan-600',
                'bg-gradient-to-br from-white via-sky-100 to-emerald-100 !text-slate-900',
                'bg-gradient-to-br from-zinc-950 via-slate-900 to-orange-500',
                'bg-gradient-to-br from-blue-950 via-indigo-800 to-emerald-500',
                'bg-gradient-to-br from-emerald-950 via-teal-800 to-lime-500',
              ][index % 5],
            ]"
          >
            <div
              class="absolute -right-4 -top-4 size-12 rounded-full bg-white/15"
            ></div>
            <div
              class="absolute bottom-2 right-2 h-1 w-8 rounded-full bg-white/40"
            ></div>
            <div class="relative z-10 flex h-full flex-col justify-between">
              <span>0{{ index + 1 }} · {{ slideTypes[index] || '页面' }}</span>
              <span class="line-clamp-2 text-[9px] leading-3">
                {{ slide.title }}
              </span>
            </div>
          </div>
          <div class="text-xs font-black text-slate-800">
            第 {{ index + 1 }} 页
          </div>
          <div class="mt-0.5 truncate text-[11px] text-slate-400">
            {{ slide.title }}
          </div>
        </button>
      </div>
    </aside>

    <section class="flex min-w-0 flex-col bg-[#eef3f6] p-6">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 class="m-0 text-lg font-black text-slate-900">
            {{ activePptSlide.title }}
          </h2>
          <p class="m-0 mt-1 text-xs font-medium text-slate-500">
            {{ activePptSlide.subtitle }}
          </p>
        </div>
        <div class="flex shrink-0 items-center gap-2">
          <Button size="small" class="!rounded-xl" @click="emit('export-ppt')">
            导出PPT
          </Button>
          <Button size="small" class="!rounded-xl" @click="emit('export-pdf')">
            导出PDF
          </Button>
          <Tag color="green" class="!m-0 !rounded-full">在线预览</Tag>
        </div>
      </div>

      <div
        class="flex flex-1 items-center justify-center overflow-hidden rounded-[28px] bg-slate-200/70 p-8"
      >
        <div
          class="aspect-video w-full max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-2xl shadow-slate-400/30 ring-1 ring-white/80"
        >
          <div
            v-if="activeSlideIndex === 0"
            class="relative flex h-full overflow-hidden bg-slate-950 p-10 text-white"
          >
            <div
              class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.35),transparent_30%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.28),transparent_28%),linear-gradient(135deg,#020617,#0f172a_55%,#064e3b)]"
            ></div>
            <div
              class="absolute -right-24 -top-24 size-72 rounded-full border border-cyan-300/20"
            ></div>
            <div
              class="absolute bottom-10 right-10 grid grid-cols-4 gap-2 opacity-50"
            >
              <span
                v-for="item in 16"
                :key="item"
                class="size-2 rounded-full bg-cyan-200/50"
              ></span>
            </div>
            <div
              class="relative z-10 flex h-full max-w-4xl flex-col justify-between"
            >
              <div
                class="flex items-center justify-between text-xs font-black text-cyan-100"
              >
                <span
                  class="rounded-full border border-white/15 bg-white/10 px-4 py-2"
                >
                  PPT助理 · {{ selectedPptStyle }}
                </span>
                <span>{{ selectedPptScheme }}</span>
              </div>
              <div>
                <div class="mb-5 h-1 w-20 rounded-full bg-cyan-300"></div>
                <h1
                  class="mb-5 max-w-3xl text-5xl font-black leading-tight tracking-tight"
                >
                  {{ activePptSlide.title }}
                </h1>
                <p
                  class="max-w-2xl text-xl font-semibold leading-9 text-cyan-50/80"
                >
                  {{ activePptSlide.subtitle }}
                </p>
              </div>
              <div class="flex gap-3 text-xs font-bold text-cyan-50/80">
                <span
                  v-for="bullet in activePptSlide.bullets"
                  :key="bullet"
                  class="rounded-full bg-white/10 px-4 py-2 backdrop-blur"
                >
                  {{ bullet }}
                </span>
              </div>
            </div>
          </div>

          <div
            v-else-if="activeSlideIndex === 1"
            class="flex h-full bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-10"
          >
            <div
              class="flex w-[42%] flex-col justify-between border-r border-slate-200 pr-8"
            >
              <div>
                <div
                  class="mb-4 text-xs font-black uppercase tracking-[0.3em] text-emerald-700"
                >
                  Customer Context
                </div>
                <h1 class="text-4xl font-black leading-tight text-slate-950">
                  {{ activePptSlide.title }}
                </h1>
                <p
                  class="mt-5 text-base font-semibold leading-8 text-slate-500"
                >
                  {{ activePptSlide.subtitle }}
                </p>
              </div>
              <div class="rounded-3xl bg-slate-950 p-5 text-white">
                <div class="text-xs font-bold text-cyan-200">客户关键诉求</div>
                <div class="mt-2 text-2xl font-black">稳定、适配、交付</div>
              </div>
            </div>
            <div class="flex flex-1 flex-col justify-center gap-5 pl-8">
              <div
                v-for="(bullet, index) in activePptSlide.bullets"
                :key="bullet"
                class="rounded-3xl border border-white bg-white/80 p-5 shadow-sm"
              >
                <div class="mb-2 flex items-center gap-3">
                  <span
                    class="flex size-9 items-center justify-center rounded-2xl bg-emerald-950 text-sm font-black text-white"
                  >
                    0{{ index + 1 }}
                  </span>
                  <span class="text-lg font-black text-slate-900">
                    {{ bullet }}
                  </span>
                </div>
                <p class="m-0 text-sm leading-6 text-slate-500">
                  围绕客户现状、目标和导入诉求进行结构化说明。
                </p>
              </div>
              <div class="grid grid-cols-3 gap-3">
                <div
                  v-for="item in metricCards"
                  :key="item.label"
                  class="rounded-2xl bg-white p-4 text-center shadow-sm"
                >
                  <div class="text-xl font-black text-emerald-700">
                    {{ item.value }}
                  </div>
                  <div class="text-[11px] font-bold text-slate-400">
                    {{ item.label }}{{ item.unit }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="activeSlideIndex === 2"
            class="relative flex h-full flex-col overflow-hidden bg-zinc-950 p-10 text-white"
          >
            <div
              class="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-b from-orange-500/30 to-transparent"
            ></div>
            <div class="relative z-10 mb-8 flex items-end justify-between">
              <div>
                <div
                  class="mb-3 text-xs font-black uppercase tracking-[0.3em] text-orange-300"
                >
                  Pain Points
                </div>
                <h1 class="text-4xl font-black">{{ activePptSlide.title }}</h1>
                <p class="mt-3 text-base font-semibold text-slate-300">
                  {{ activePptSlide.subtitle }}
                </p>
              </div>
              <div class="text-7xl font-black text-white/10">03</div>
            </div>
            <div class="relative z-10 grid flex-1 grid-cols-3 gap-5">
              <div
                v-for="(bullet, index) in activePptSlide.bullets"
                :key="bullet"
                class="flex flex-col justify-between rounded-[28px] border border-white/10 bg-white/10 p-6 backdrop-blur"
              >
                <div class="text-5xl font-black text-orange-300">
                  0{{ index + 1 }}
                </div>
                <div>
                  <h3 class="mb-3 text-xl font-black leading-7">
                    {{ bullet }}
                  </h3>
                  <p class="m-0 text-sm leading-7 text-slate-300">
                    制造场景下需要从风险、周期和响应效率三个维度建立解决方案依据。
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="activeSlideIndex === 3"
            class="relative flex h-full items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-indigo-900 to-emerald-700 p-10 text-white"
          >
            <div
              class="absolute inset-8 rounded-[36px] border border-white/10"
            ></div>
            <div class="relative z-10 grid w-full grid-cols-[1fr_1.2fr] gap-8">
              <div class="flex flex-col justify-center">
                <div
                  class="mb-3 text-xs font-black uppercase tracking-[0.3em] text-cyan-200"
                >
                  Solution Framework
                </div>
                <h1 class="text-4xl font-black leading-tight">
                  {{ activePptSlide.title }}
                </h1>
                <p
                  class="mt-5 text-base font-semibold leading-8 text-cyan-50/80"
                >
                  {{ activePptSlide.subtitle }}
                </p>
              </div>
              <div
                class="relative flex min-h-[360px] items-center justify-center"
              >
                <div
                  class="absolute size-56 rounded-full border border-cyan-200/30"
                ></div>
                <div
                  class="absolute size-80 rounded-full border border-white/10"
                ></div>
                <div
                  class="z-10 rounded-[32px] bg-white p-8 text-center text-slate-950 shadow-2xl"
                >
                  <div class="text-xs font-black text-emerald-700">
                    核心方案
                  </div>
                  <div class="mt-2 text-3xl font-black">D7020</div>
                  <div class="mt-2 text-sm font-bold text-slate-500">
                    标准化部署能力
                  </div>
                </div>
                <div
                  v-for="(module, index) in solutionModules"
                  :key="module"
                  class="absolute rounded-2xl border border-white/15 bg-white/15 px-4 py-3 text-sm font-black backdrop-blur"
                  :class="[
                    [
                      'left-0 top-8',
                      'right-0 top-8',
                      'bottom-8 left-0',
                      'bottom-8 right-0',
                    ][index],
                  ]"
                >
                  {{ module }}
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="flex h-full flex-col bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-10"
          >
            <div class="mb-8 flex items-center justify-between">
              <div>
                <div
                  class="mb-3 text-xs font-black uppercase tracking-[0.3em] text-emerald-700"
                >
                  Delivery Roadmap
                </div>
                <h1 class="text-4xl font-black text-slate-950">
                  {{ activePptSlide.title }}
                </h1>
                <p class="mt-3 text-base font-semibold text-slate-500">
                  {{ activePptSlide.subtitle }}
                </p>
              </div>
              <div
                class="rounded-full bg-emerald-950 px-5 py-2 text-xs font-black text-white"
              >
                闭环交付
              </div>
            </div>
            <div class="relative flex flex-1 items-center">
              <div
                class="absolute left-8 right-8 top-1/2 h-1 -translate-y-1/2 rounded-full bg-emerald-200"
              ></div>
              <div class="relative z-10 grid w-full grid-cols-5 gap-4">
                <div
                  v-for="(step, index) in timelineSteps"
                  :key="step"
                  class="rounded-[28px] bg-white p-5 text-center shadow-lg shadow-emerald-900/10"
                >
                  <div
                    class="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-emerald-950 text-sm font-black text-white"
                  >
                    {{ index + 1 }}
                  </div>
                  <div class="text-base font-black text-slate-900">
                    {{ step }}
                  </div>
                  <div class="mt-2 text-xs font-bold leading-5 text-slate-400">
                    阶段任务清晰，责任节点明确
                  </div>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div
                v-for="bullet in activePptSlide.bullets"
                :key="bullet"
                class="rounded-3xl border border-emerald-100 bg-white/80 p-4 text-sm font-black text-slate-700 shadow-sm"
              >
                {{ bullet }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <aside class="flex min-w-0 flex-col border-l border-slate-100 bg-white">
      <div class="flex-1 border-b border-slate-100 p-5">
        <div class="mb-3 flex items-center justify-between">
          <h3 class="m-0 text-base font-black text-slate-900">
            当前页 AI 文案
          </h3>
          <Button
            size="small"
            class="!rounded-xl"
            @click="emit('regenerate-current-slide')"
          >
            重新生成当前页
          </Button>
        </div>
        <Input.TextArea
          :value="activePptSlide.copy"
          :auto-size="{ minRows: 9, maxRows: 14 }"
          class="!rounded-2xl !border-slate-200 !bg-slate-50/70 !p-4 text-sm leading-7"
          @update:value="emit('update-copy', activePptSlide.id, $event)"
        />
      </div>
      <div class="flex-1 overflow-y-auto p-5">
        <h3 class="mb-3 text-base font-black text-slate-900">当前页引用来源</h3>
        <div class="mb-5">
          <div class="mb-2 text-xs font-black text-slate-500">
            PPT案例库引用
          </div>
          <div class="space-y-2">
            <div
              v-for="item in activePptSlide.cases"
              :key="item"
              class="rounded-2xl bg-amber-50 p-3 text-xs font-bold leading-5 text-slate-700"
            >
              {{ item }}
            </div>
          </div>
        </div>
        <div>
          <div class="mb-2 text-xs font-black text-slate-500">知识库引用</div>
          <div class="space-y-2">
            <div
              v-for="item in activePptSlide.knowledge"
              :key="item"
              class="rounded-2xl bg-cyan-50 p-3 text-xs font-bold leading-5 text-slate-700"
            >
              {{ item }}
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>
