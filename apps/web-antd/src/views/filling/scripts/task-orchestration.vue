<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Divider, Select, Tooltip } from 'ant-design-vue';

const router = useRouter();

// 任务编排基础数据
const docInfo = ref({
  id: 'd_1',
  code: 'DOC_EXP_001',
  name: '研发中心差旅报销单',
  system: 'SAP S/4HANA (总部)',
  requiredFields: ['报销总额', '发票明细', '成本中心', '出差事由'],
});

const recordStatus = ref<'idle' | 'paused' | 'recording'>('idle');

const commonScriptSelected = ref('cs_1');

function goBack() {
  router.back();
}
function handleStopRecording() {
  recordStatus.value = 'idle';
}
</script>

<template>
  <!-- Full page, no outer scroll -->
  <div class="flex h-full flex-col bg-slate-100">
    <!-- Top Header -->
    <header class="z-10 shrink-0 border-b border-slate-200 bg-white shadow-sm">
      <!-- AppBar -->
      <div class="flex h-14 items-center justify-between px-6">
        <div class="flex items-center gap-3">
          <Button
            type="text"
            shape="circle"
            class="!flex !items-center !justify-center bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            @click="goBack"
          >
            <Icon icon="lucide:arrow-left" class="size-5" />
          </Button>
          <Divider type="vertical" class="h-5" />
          <div>
            <h2 class="m-0 text-base font-bold leading-tight text-slate-900">
              任务编排
            </h2>
            <span
              class="font-mono text-[10px] font-semibold tracking-wider text-slate-400"
            >
              {{ docInfo.code }} · {{ docInfo.name }}
            </span>
          </div>
        </div>

        <!-- Recording status -->
        <div class="flex items-center gap-3">
          <div
            class="flex items-center gap-3 rounded-full border border-red-100 bg-red-50 px-4 py-1.5 text-sm font-semibold text-red-600"
            v-if="recordStatus === 'recording'"
          >
            <span class="relative flex h-2.5 w-2.5">
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500"
              ></span>
            </span>
            AI 协同录制中...
            <Button
              type="link"
              class="ml-1 !h-auto !p-0 font-bold !text-red-700"
              @click="handleStopRecording"
            >
              停止
            </Button>
          </div>
        </div>
      </div>

      <!-- Doc Info Banner -->
      <div
        class="flex items-center gap-5 border-t border-indigo-100/60 bg-indigo-50/60 px-6 py-2"
      >
        <div class="flex flex-col gap-0.5">
          <span
            class="text-[9px] font-bold uppercase tracking-widest text-indigo-400"
          >
            单据配置目标
          </span>
          <span class="text-xs font-bold text-indigo-900">
            {{ docInfo.name }}
          </span>
        </div>
        <Divider type="vertical" class="h-7 !border-indigo-100" />
        <div class="flex flex-col gap-0.5">
          <span
            class="text-[9px] font-bold uppercase tracking-widest text-slate-400"
          >
            集成系统
          </span>
          <span
            class="flex items-center gap-1.5 text-xs font-bold text-slate-700"
          >
            <Icon icon="lucide:database" class="size-3 text-indigo-500" />
            {{ docInfo.system }}
          </span>
        </div>
      </div>
    </header>

    <!-- Main Workspace: right steps card (full width) -->
    <div class="flex min-h-0 flex-1 justify-center overflow-hidden p-4">
      <!-- ===== RIGHT: Big Steps Card (Full Width) ===== -->
      <div
        class="flex min-h-0 min-w-0 max-w-6xl flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <!-- Card Header -->
        <div
          class="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-4"
        >
          <div class="flex items-center gap-2">
            <Icon
              icon="lucide:kanban-square-dashed"
              class="size-5 text-slate-400"
            />
            <h3 class="m-0 text-sm font-bold text-slate-800">任务流程</h3>
          </div>
        </div>

        <!-- Card body: scrollable -->
        <div class="min-h-0 flex-1 space-y-4 p-5">
          <!-- Common Script Import Block -->
          <div
            class="relative overflow-hidden rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4"
          >
            <div
              class="absolute bottom-0 left-0 top-0 w-1 rounded-l-2xl bg-indigo-500"
            ></div>
            <h3
              class="m-0 mb-2 flex items-center gap-2 pl-2 text-xs font-bold text-indigo-900"
            >
              <Icon icon="lucide:blocks" class="text-indigo-500" />
              选择脚本
            </h3>
            <p class="mb-3 pl-2 text-[11px] leading-relaxed text-indigo-700/70">
              每个单据类型的填报任务支持执行多个脚本，请按执行的顺序排列脚本
            </p>
            <div class="flex items-center gap-2 pl-2">
              <Select
                v-model:value="commonScriptSelected"
                class="custom-select max-w-sm flex-1"
                size="small"
              >
                <Select.Option value="cs_1">
                  <div class="flex flex-col py-0.5 leading-tight">
                    <span class="text-xs font-bold text-slate-700">
                      SAP_前端节点通行登录策略
                    </span>
                    <span class="font-mono text-[10px] text-slate-400">
                      cs_10x0a
                    </span>
                  </div>
                </Select.Option>
              </Select>
              <Button
                size="small"
                class="!rounded-lg !border-indigo-200 !bg-indigo-50 !font-semibold !text-indigo-700 hover:!bg-indigo-100"
              >
                <Icon icon="lucide:plus" class="mr-1 size-3.5" />
                添加
              </Button>
            </div>
            <div class="mt-4 pl-2">
              <div
                class="mb-2 text-xs font-semibold uppercase tracking-wider text-indigo-400"
              >
                已添加脚本
              </div>
              <div
                class="mb-2 flex items-center gap-2 rounded-lg border border-indigo-200 bg-white px-3 py-2 shadow-sm"
              >
                <Icon
                  icon="lucide:check-circle-2"
                  class="size-4 text-emerald-500"
                />
                <span class="flex-1 text-xs font-bold text-indigo-900">
                  SAP_前端节点通行登录策略
                </span>
                <Tooltip title="上移">
                  <Button
                    type="text"
                    size="small"
                    disabled
                    class="!h-auto !p-0 !text-xs !text-slate-300"
                  >
                    <Icon icon="lucide:arrow-up" class="size-3.5" />
                  </Button>
                </Tooltip>
                <Tooltip title="下移">
                  <Button
                    type="text"
                    size="small"
                    disabled
                    class="!h-auto !p-0 !text-xs !text-slate-300"
                  >
                    <Icon icon="lucide:arrow-down" class="size-3.5" />
                  </Button>
                </Tooltip>
                <Tooltip title="删除">
                  <Button
                    type="text"
                    size="small"
                    danger
                    class="!h-auto !p-0 !text-xs"
                  >
                    <Icon icon="lucide:x" class="size-3.5" />
                  </Button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.ant-input:focus) {
  box-shadow: none !important;
}

:deep(.custom-select .ant-select-selector) {
  @apply !rounded-lg !border-indigo-200 !text-xs !shadow-sm focus-within:!border-indigo-400;
}
</style>
