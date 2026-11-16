<!-- 周报信息采集卡片 (设计高度匹配高保真图：AWAITING_INPUT 状态 + 简单单选与备注输入) -->
<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Input, message } from 'ant-design-vue';

const emit = defineEmits<{
  (
    e: 'submit',
    payload: {
      q1Note: string;
      q1Status: string;
      q2Note: string;
      q2Status: string;
      q3Note: string;
    },
  ): void;
}>();

const submitted = ref(false);

// 问题 1：上周计划华达打印流程对接是否完成
const q1Options = ['已完成', '进行中', '延期', '未开始'];
const q1Status = ref('已完成');
const q1Note = ref('已与客户完成验收口径确认，现场打印排查完毕');

// 问题 2：对接开发华达的接口 API 当前完成状态
const q2Options = ['已完成', '进行中', '待测试'];
const q2Status = ref('进行中');
const q2Note = ref('核心 API 已开发完成，测试联调环境正在准备');

// 问题 3：下周的计划与核心交付节点
const q3Note = ref('预计 8月19日 完成报价平台 V2 联调与全链路集成测试');

function handleSubmit() {
  if (submitted.value) return;
  submitted.value = true;
  message.success('信息采集卡已成功提交！');
  emit('submit', {
    q1Status: q1Status.value,
    q1Note: q1Note.value,
    q2Status: q2Status.value,
    q2Note: q2Note.value,
    q3Note: q3Note.value,
  });
}
</script>

<template>
  <article
    class="weekly-collect-card my-2.5 max-w-[620px] space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
  >
    <!-- 卡片 Header -->
    <header
      class="flex items-start justify-between border-b border-[#F1F5F9] pb-3.5"
    >
      <div class="flex items-center gap-3">
        <!-- 左侧图标容器 -->
        <div
          class="flex size-10 flex-none items-center justify-center rounded-full bg-[#E0F2FE] text-[#0284C7]"
        >
          <Icon icon="lucide:clipboard-edit" class="size-5" />
        </div>

        <div class="space-y-0.5">
          <div class="flex items-center gap-2">
            <span
              class="rounded-full px-2 py-0.5 font-mono text-[10px] font-extrabold tracking-wider"
              :class="
                submitted
                  ? 'bg-[#DCFCE7] text-[#15803D]'
                  : 'bg-[#E0F2FE] text-[#0284C7]'
              "
            >
              ● {{ submitted ? 'COMPLETED' : 'AWAITING_INPUT' }}
            </span>
            <h3 class="margin-none text-base font-bold text-[#0F172A]">
              周报信息采集卡
            </h3>
          </div>
          <p class="margin-none text-xs text-[#64748B]">
            请填写以下补充信息，提交后我将为您登记并更新周报。
          </p>
        </div>
      </div>

      <!-- 进度指示器 -->
      <div class="flex items-center gap-1 font-mono text-xs text-[#94A3B8]">
        <span class="font-bold text-[#059669]">■■■</span>
        <span>□□</span>
        <span class="ml-1">3/5</span>
      </div>
    </header>

    <!-- 卡片表单主体 -->
    <div class="space-y-4 text-xs">
      <!-- 问题 1 -->
      <div class="space-y-2">
        <label class="block font-bold text-[#1E293B]">
          1. 上周计划华达打印流程对接是否完成？
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in q1Options"
            :key="opt"
            type="button"
            :disabled="submitted"
            class="cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all"
            :class="
              q1Status === opt
                ? 'shadow-2xs border-[#0284C7] bg-[#E0F2FE] font-bold text-[#0369A1]'
                : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9]'
            "
            @click="q1Status = opt"
          >
            {{ opt }}
          </button>
        </div>
        <Input.TextArea
          v-model:value="q1Note"
          :disabled="submitted"
          :rows="2"
          placeholder="备注说明（例如：已与客户完成验收口径确认...）"
          class="rounded-xl border-[#E2E8F0] bg-[#F8FAFC] text-xs focus:bg-white"
        />
      </div>

      <!-- 问题 2 -->
      <div class="space-y-2">
        <label class="block font-bold text-[#1E293B]">
          2. 对接开发华达的接口 API 当前完成状态？
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opt in q2Options"
            :key="opt"
            type="button"
            :disabled="submitted"
            class="cursor-pointer rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all"
            :class="
              q2Status === opt
                ? 'shadow-2xs border-[#0284C7] bg-[#E0F2FE] font-bold text-[#0369A1]'
                : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] hover:bg-[#F1F5F9]'
            "
            @click="q2Status = opt"
          >
            {{ opt }}
          </button>
        </div>
        <Input.TextArea
          v-model:value="q2Note"
          :disabled="submitted"
          :rows="2"
          placeholder="备注说明"
          class="rounded-xl border-[#E2E8F0] bg-[#F8FAFC] text-xs focus:bg-white"
        />
      </div>

      <!-- 问题 3 -->
      <div class="space-y-2">
        <label class="block font-bold text-[#1E293B]">
          3. 下周计划与核心交付节点
        </label>
        <Input.TextArea
          v-model:value="q3Note"
          :disabled="submitted"
          :rows="2"
          placeholder="请填写下周计划与备注（例如：8月19日完成报价平台V2联调...）"
          class="rounded-xl border-[#E2E8F0] bg-[#F8FAFC] text-xs focus:bg-white"
        />
      </div>
    </div>

    <!-- 卡片 Footer -->
    <footer
      class="flex items-center justify-between border-t border-[#F1F5F9] pt-3"
    >
      <div class="flex items-center gap-1.5 text-xs text-[#94A3B8]">
        <Icon icon="lucide:shield-check" class="size-4 text-[#059669]" />
        <span>确认后发送给当前数字员工</span>
      </div>

      <Button
        v-if="!submitted"
        type="primary"
        size="middle"
        class="flex items-center gap-1.5 rounded-xl border-none bg-[#064E3B] px-5 text-xs font-bold text-white hover:bg-[#047857]"
        @click="handleSubmit"
      >
        <Icon icon="lucide:send" class="size-3.5" />
        <span>提交</span>
      </Button>

      <span
        v-else
        class="flex items-center gap-1 text-xs font-bold text-[#059669]"
      >
        <Icon icon="lucide:check-circle" />
        已提交同步至周报
      </span>
    </footer>
  </article>
</template>
