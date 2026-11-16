<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Select, Steps, Textarea, Tooltip } from 'ant-design-vue';

// Mock Data
const targetDoc = ref('d_1');
const targetAuth = ref('a_1');

const chatMessages = ref([
  {
    role: 'ai',
    text: '填报测试沙箱已就绪。请以终端用户的身份与我对话，或者上传需要填报的票据文件。',
  },
  {
    role: 'user',
    text: '帮我报销这两张发票，一张是去北京出差的机票，另一张是回来打车的票。',
    attachments: ['机票_PEK.pdf', '滴滴行程单.png'],
  },
]);

const executionLogs = ref([
  {
    status: 'finish',
    title: '分析原始输入',
    description:
      '从自然语言与附件中提取实体：\n- 机票: 1500元 (往返: 否, 目的地: 北京)\n- 打车: 85元',
  },
  {
    status: 'finish',
    title: '应用全局业务约束',
    description:
      '匹配命中规则：\n✅ 出差配套的同城打车算入差旅交通费。\n将所有费用归口为【差旅报销】',
  },
  {
    status: 'process',
    title: '自动化填报执行',
    description: '正在唤起 SAP S/4HANA (总部) 无头浏览器...',
  },
]);

const promptInput = ref('');

function sendMsg() {
  if (!promptInput.value) return;
  chatMessages.value.push({
    role: 'user',
    text: promptInput.value,
    attachments: [],
  });
  promptInput.value = '';
}
</script>

<template>
  <div class="flex min-h-screen flex-col gap-6 bg-slate-50/50 p-6 md:p-8">
    <!-- Header Console -->
    <div
      class="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-6 shadow-sm lg:flex-nowrap"
    >
      <!-- Decor -->
      <div
        class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/5 blur-3xl"
      ></div>
      <div
        class="absolute -bottom-10 right-20 h-32 w-32 rounded-full bg-purple-500/5 blur-3xl"
      ></div>

      <div class="z-10 flex flex-col gap-1">
        <h1
          class="m-0 flex items-center gap-2 text-2xl font-bold tracking-tight text-slate-900"
        >
          <Icon icon="lucide:flask-conical" class="text-indigo-500" />
          填报测试沙箱
        </h1>
        <p class="flex items-center gap-1 text-sm font-medium text-slate-500">
          端到端模拟测试终端用户体验
          <Tooltip
            title="配置的全局约束和交互式录制脚本将在这里统一被大模型调用并验证"
          >
            <Icon
              icon="lucide:info"
              class="size-3 transition-colors hover:text-indigo-500"
            />
          </Tooltip>
        </p>
      </div>

      <div
        class="z-10 flex shrink-0 items-center gap-4 border-l border-slate-100 pl-6"
      >
        <div class="flex flex-col gap-1.5">
          <span
            class="text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            选择业务单据
          </span>
          <Select v-model:value="targetDoc" class="w-[200px]" size="large">
            <Select.Option value="d_1">研发中心差旅报销单</Select.Option>
            <Select.Option value="d_2">对公付款申请-耗材</Select.Option>
          </Select>
        </div>
        <div class="flex flex-col gap-1.5">
          <span
            class="text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            下发测试系统凭证
          </span>
          <Select v-model:value="targetAuth" class="w-[180px]" size="large">
            <Select.Option value="a_1">管理员全局代理账号</Select.Option>
            <Select.Option value="a_2">模拟普通用户 (无Token)</Select.Option>
          </Select>
        </div>
        <div class="flex h-full flex-col justify-end gap-1.5 pt-5">
          <Button
            type="primary"
            size="large"
            class="whitespace-nowrap !rounded-xl !bg-slate-900 !px-6 !font-semibold shadow-md"
            @click="() => {}"
          >
            <Icon icon="lucide:rotate-ccw" class="mr-2" />
            重置沙箱
          </Button>
        </div>
      </div>
    </div>

    <!-- Main Workspace -->
    <div class="flex h-full max-h-[700px] flex-1 gap-6 overflow-hidden">
      <!-- Left Panel: Chat Interface -->
      <div
        class="flex w-1/2 flex-col overflow-hidden rounded-3xl border border-slate-200/60 bg-white shadow-sm"
      >
        <div
          class="z-10 flex items-center border-b border-slate-200/60 bg-slate-50/80 p-4 font-semibold text-slate-700 shadow-sm"
        >
          <Icon
            icon="lucide:message-square-dashed"
            class="mr-2 text-slate-400"
          />
          拟真终端对话终端 (Simulated Chat)
        </div>

        <div class="flex-1 space-y-6 overflow-y-auto p-6">
          <div
            v-for="(msg, idx) in chatMessages"
            :key="idx"
            class="flex gap-4"
            :class="msg.role === 'user' ? 'flex-row-reverse' : ''"
          >
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-slate-100/50 shadow-sm"
              :class="
                msg.role === 'ai'
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'bg-slate-900 text-white'
              "
            >
              <Icon
                :icon="msg.role === 'ai' ? 'lucide:bot' : 'lucide:user'"
                class="size-5"
              />
            </div>

            <div
              class="flex max-w-[80%] flex-col gap-2"
              :class="msg.role === 'user' ? 'items-end' : ''"
            >
              <!-- Text Bubble -->
              <div
                class="whitespace-pre-wrap border px-4 py-3 text-sm leading-relaxed shadow-sm"
                :class="
                  msg.role === 'ai'
                    ? 'rounded-2xl rounded-tl-sm border-slate-100 bg-white text-slate-700'
                    : 'rounded-2xl rounded-tr-sm border-slate-900 bg-slate-900 text-white'
                "
              >
                {{ msg.text }}
              </div>

              <!-- Attachments -->
              <div
                v-if="msg.attachments && msg.attachments.length > 0"
                class="mt-1 flex flex-wrap gap-2"
              >
                <div
                  v-for="att in msg.attachments"
                  :key="att"
                  class="group flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 shadow-sm transition-colors hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <Icon
                    icon="lucide:file-text"
                    class="size-4 text-slate-400 transition-colors group-hover:text-indigo-500"
                  />
                  <span
                    class="text-xs font-medium text-slate-600 group-hover:text-indigo-700"
                  >
                    {{ att }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="shrink-0 border-t border-slate-200/60 bg-slate-50 p-4">
          <div
            class="relative flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-sm transition-all focus-within:border-indigo-400 focus-within:shadow-md"
          >
            <Textarea
              v-model:value="promptInput"
              :auto-size="{ minRows: 1, maxRows: 3 }"
              placeholder="模拟终端用户提问，支持拖拽文件..."
              class="flex-1 !resize-none !border-none !bg-transparent px-3 py-3 !text-sm font-medium !shadow-none focus:!ring-0"
              @press-enter.prevent="sendMsg"
            />
            <div class="flex h-full shrink-0 items-center gap-2 py-2 pr-2">
              <Button
                type="default"
                shape="circle"
                class="!flex !items-center !justify-center !border-slate-200 bg-slate-50 text-slate-500 shadow-sm hover:bg-slate-100 hover:text-slate-800"
              >
                <Icon icon="lucide:paperclip" class="size-[18px]" />
              </Button>
              <Button
                type="primary"
                shape="circle"
                class="!flex !items-center !justify-center !border-none !bg-indigo-600 !text-white shadow-md transition-transform hover:scale-105 hover:!bg-indigo-700"
                @click="sendMsg"
              >
                <Icon icon="lucide:arrow-up" class="size-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Panel: Execution Live Feedback -->
      <div
        class="relative flex w-1/2 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-xl"
      >
        <div
          class="pointer-events-none absolute inset-0 z-0 opacity-10"
          style="
            background-image:
              linear-gradient(#334155 1px, transparent 1px),
              linear-gradient(90deg, #334155 1px, transparent 1px);
            background-size: 20px 20px;
          "
        ></div>

        <div
          class="z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/80 p-4 font-semibold text-slate-300 backdrop-blur-sm"
        >
          <div class="flex items-center">
            <Icon icon="lucide:terminal-square" class="mr-2 text-emerald-400" />
            实时推理与执行回显 (Live Sandbox Engine)
          </div>
          <div class="flex items-center gap-2">
            <span class="relative flex h-2 w-2">
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"
              ></span>
            </span>
            <span
              class="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-500"
            >
              Running
            </span>
          </div>
        </div>

        <div class="custom-scroll z-10 flex-1 overflow-y-auto p-6 lg:p-8">
          <Steps
            direction="vertical"
            :current="2"
            size="small"
            class="sandbox-steps"
          >
            <template v-for="(log, idx) in executionLogs" :key="idx">
              <Steps.Step :status="log.status as any">
                <template #title>
                  <span
                    class="font-bold tracking-wide"
                    :class="
                      log.status === 'process' ? 'text-white' : 'text-slate-300'
                    "
                  >
                    {{ log.title }}
                  </span>
                </template>
                <template #description>
                  <div class="mb-6 mt-2">
                    <!-- Text Block -->
                    <div
                      class="whitespace-pre-wrap rounded-xl border border-slate-700/50 bg-slate-800/80 p-4 font-mono text-sm leading-relaxed opacity-90 shadow-sm transition-opacity hover:opacity-100"
                      :class="
                        log.status === 'process'
                          ? 'text-indigo-200'
                          : 'text-slate-400'
                      "
                    >
                      {{ log.description }}
                    </div>

                    <!-- Live Screenshot Mock for Active Step -->
                    <div
                      v-if="log.status === 'process'"
                      class="relative mt-4 overflow-hidden rounded-xl border-2 border-slate-800 bg-[#f0f2f5] shadow-2xl"
                    >
                      <!-- Mac window header mock -->
                      <div
                        class="flex h-6 items-center gap-1.5 border-b border-slate-300/50 bg-slate-200 px-3"
                      >
                        <div class="h-2.5 w-2.5 rounded-full bg-red-400"></div>
                        <div
                          class="h-2.5 w-2.5 rounded-full bg-amber-400"
                        ></div>
                        <div
                          class="h-2.5 w-2.5 rounded-full bg-emerald-400"
                        ></div>
                      </div>
                      <!-- Mock Browser content -->
                      <div class="relative flex h-32 flex-col gap-3 p-4">
                        <div class="h-4 w-1/3 rounded-full bg-slate-300"></div>
                        <div
                          class="h-8 w-full rounded-lg border border-slate-300 bg-white shadow-sm"
                        ></div>
                        <div
                          class="h-8 w-2/3 rounded-lg border border-slate-300 bg-white shadow-sm"
                        ></div>

                        <!-- Red Box Highlight Mock (Targeted element) -->
                        <div
                          class="absolute left-3 top-[34px] z-10 h-10 w-[calc(100%-24px)] animate-pulse rounded-lg border-2 border-rose-500 bg-rose-500/10"
                        ></div>
                      </div>

                      <div
                        class="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-2 py-1 backdrop-blur-md"
                      >
                        <Icon
                          icon="lucide:scan-eye"
                          class="size-3 text-rose-400"
                        />
                        <span
                          class="font-mono text-[10px] font-medium text-white"
                        >
                          DOM Targeting...
                        </span>
                      </div>
                    </div>
                  </div>
                </template>
                <template #icon v-if="log.status === 'process'">
                  <Icon
                    icon="lucide:loader-2"
                    class="animate-spin text-emerald-400"
                  />
                </template>
              </Steps.Step>
            </template>
          </Steps>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom styled steps for dark background */
:deep(.sandbox-steps .ant-steps-item-title) {
  @apply relative -top-1 !font-bold !text-white;
}

:deep(.sandbox-steps .ant-steps-item-tail::after) {
  @apply !bg-slate-700;
}

:deep(.sandbox-steps .ant-steps-item-finish .ant-steps-item-icon) {
  @apply !border-emerald-500/30 !bg-emerald-500/10;
}

:deep(
  .sandbox-steps .ant-steps-item-finish .ant-steps-item-icon > .ant-steps-icon
) {
  @apply !text-emerald-400;
}

:deep(.sandbox-steps .ant-steps-item-process .ant-steps-item-icon) {
  @apply !border-transparent !bg-transparent;
}

/* Custom Webkit Scrollbar for dark theme */
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}

.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scroll::-webkit-scrollbar-thumb {
  @apply rounded-full bg-slate-700/50;
}

.custom-scroll::-webkit-scrollbar-thumb:hover {
  @apply bg-slate-600;
}
</style>
