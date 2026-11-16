<!-- 协助我写周报向导卡片 (分步引导：上周承诺 -> 本周成果/华达打印与功能开发 -> 资料确认 -> 下周计划 -> 完整度评价与提交) -->
<script setup lang="ts">
import { ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Checkbox, Input, message, Tag } from 'ant-design-vue';

import { useAiWorkDemoStore } from '#/store/ai-work-demo';

const emit = defineEmits<{
  (e: 'stepChange', stepName: string): void;
  (e: 'complete', summary: string): void;
}>();

const store = useAiWorkDemoStore();

// 当前向导步骤： 1 | 2 | 3 | 4 | 5 (5为完成提交)
const step = ref(1);

// Step 1: 上周承诺勾选状态
const commitment1Checked = ref(true);
const commitment2Checked = ref(true);
const commitment2Note = ref('已标注延期至下周三环境就绪');

// Step 2: 事项 1 确认
const item1Title = ref('华达打印机现场问题排查与修复');
const item1Status = ref('已完成');

// Step 3: 事项 2 确认与资料
const item2Title = ref('报价平台 V2 核心接口开发与全链路单元测试');
const item2Project = ref('报价平台 V2');
const item2Customer = ref('长鑫存储');
const filesUploaded = ref(true);

// Step 4: 下周计划
const nextPlanText = ref(
  '1. 推进报价平台 V2 联调与测试 (8月19日)\n2. 长鑫5期打印文档交付 (8月21日)',
);

function goToNextStep(next: number) {
  step.value = next;
  emit('stepChange', `Step ${next}`);
  switch (next) {
    case 2: {
      message.info('已记录上周承诺状态，进入本周成果录入');

      break;
    }
    case 3: {
      message.info('已纳入华达打印机处理成果');

      break;
    }
    case 4: {
      message.info('已完成资料与客户项目确认');

      break;
    }
    // No default
  }
}

function handleFinalSubmit() {
  step.value = 5;
  store.submitReport();
  store.state.completeness = 98;
  store.state.missingWorkAdded = true;
  store.state.delayExplained = true;
  message.success('周报已成功提交至主管！完整度 98%');
  emit('complete', '本周高效完成 2 项核心成果，周报已提交主管！');
}
</script>

<template>
  <article
    class="assist-write-card my-2.5 max-w-[620px] space-y-4 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
  >
    <!-- Header -->
    <header
      class="flex items-center justify-between border-b border-[#F1F5F9] pb-3"
    >
      <div class="flex items-center gap-2.5">
        <div
          class="flex size-8 flex-none items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]"
        >
          <Icon icon="lucide:wand2" class="size-4" />
        </div>
        <div>
          <h3 class="margin-none text-sm font-bold text-[#0F172A]">
            周报智能撰写向导
          </h3>
          <p class="margin-none text-[11px] text-[#64748B]">
            分步引导：承诺打勾 ➔ 成果挂载 ➔ 下周计划 ➔ 提交
          </p>
        </div>
      </div>

      <div class="flex items-center gap-1 font-mono text-xs text-[#059669]">
        <span class="font-bold">步骤 {{ step }}/4</span>
      </div>
    </header>

    <!-- 步骤 1：上周任务追溯与勾选 -->
    <section v-if="step === 1" class="space-y-3 text-xs">
      <div class="rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-3">
        <span class="mb-2 block font-bold text-[#0F172A]">
          第一步：请勾选确认上周承诺任务完成情况
        </span>

        <div class="space-y-2">
          <label
            class="flex cursor-pointer items-start gap-2 rounded p-2 transition-colors hover:bg-white"
          >
            <Checkbox v-model:checked="commitment1Checked" class="mt-0.5" />
            <div>
              <span class="font-semibold text-[#0F172A]">
                报价模块接口开发与单元测试
              </span>
              <Tag color="green" class="ml-2 scale-90">已完成</Tag>
            </div>
          </label>

          <label
            class="flex cursor-pointer items-start gap-2 rounded p-2 transition-colors hover:bg-white"
          >
            <Checkbox v-model:checked="commitment2Checked" class="mt-0.5" />
            <div>
              <span class="font-semibold text-[#0F172A]">
                客户 B 接口联调及环境部署
              </span>
              <Tag color="orange" class="ml-2 scale-90">延期 (待补充说明)</Tag>
              <Input
                v-model:value="commitment2Note"
                size="small"
                class="mt-1 rounded-lg border-[#E2E8F0] text-xs"
              />
            </div>
          </label>
        </div>
      </div>

      <div class="flex justify-end">
        <Button
          type="primary"
          size="small"
          class="rounded-xl border-none bg-[#059669] px-4 font-bold hover:bg-[#047857]"
          @click="goToNextStep(2)"
        >
          确认承诺状态，下一步 ➔
        </Button>
      </div>
    </section>

    <!-- 步骤 2：本周成果 1 (华达打印机处理) -->
    <section v-else-if="step === 2" class="space-y-3 text-xs">
      <div
        class="space-y-2 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-3"
      >
        <span class="block font-bold text-[#0F172A]">
          第二步：本周成果录入 (事项 1/2)
        </span>
        <div
          class="space-y-1.5 rounded-lg border border-[#E2E8F0] bg-white p-2.5"
        >
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-[#0F172A]">
              {{ item1Title }}
            </span>
            <Tag color="green">{{ item1Status }}</Tag>
          </div>
          <p class="margin-none text-[11px] text-[#64748B]">
            系统已自动匹配关联实体：客户 [华达] | 项目 [华达智能打印]
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <Button size="small" class="rounded-xl text-xs" @click="step = 1">
          ← 上一步
        </Button>
        <Button
          type="primary"
          size="small"
          class="rounded-xl border-none bg-[#059669] px-4 font-bold hover:bg-[#047857]"
          @click="goToNextStep(3)"
        >
          确认纳入本周成果，下一项 ➔
        </Button>
      </div>
    </section>

    <!-- 步骤 3：本周成果 2 (功能开发完成 + 资料挂载确认) -->
    <section v-else-if="step === 3" class="space-y-3 text-xs">
      <div
        class="space-y-2.5 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-3"
      >
        <span class="block font-bold text-[#0F172A]">
          第三步：本周成果录入 (事项 2/2) & 资料挂载
        </span>

        <div class="space-y-2">
          <div>
            <label class="mb-1 block text-[11px] text-[#64748B]">
              成果描述文本:
            </label>
            <Input.TextArea
              v-model:value="item2Title"
              :rows="2"
              class="rounded-xl border-[#E2E8F0] text-xs"
            />
          </div>

          <div class="flex items-center gap-3">
            <span class="text-[11px] text-[#64748B]">关联项目:</span>
            <Input
              v-model:value="item2Project"
              size="small"
              class="w-36 rounded-lg text-xs"
            />
            <span class="text-[11px] text-[#64748B]">关联客户:</span>
            <Input
              v-model:value="item2Customer"
              size="small"
              class="w-36 rounded-lg text-xs"
            />
          </div>

          <!-- 挂载的佐证资料 -->
          <div class="pt-1">
            <span class="mb-1 block text-[11px] text-[#64748B]">
              已挂载佐证资料:
            </span>
            <div v-if="filesUploaded" class="flex flex-wrap gap-2">
              <span
                class="inline-flex items-center gap-1 rounded bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-medium text-[#1D4ED8]"
              >
                <Icon icon="lucide:file-text" class="size-3" />
                验收报告.pdf (2.4 MB)
              </span>
              <span
                class="inline-flex items-center gap-1 rounded bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-medium text-[#1D4ED8]"
              >
                <Icon icon="lucide:image" class="size-3" />
                系统架构截图.png (850 KB)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <Button size="small" class="rounded-xl text-xs" @click="step = 2">
          ← 上一步
        </Button>
        <Button
          type="primary"
          size="small"
          class="rounded-xl border-none bg-[#059669] px-4 font-bold hover:bg-[#047857]"
          @click="goToNextStep(4)"
        >
          信息无误，生成下周计划 ➔
        </Button>
      </div>
    </section>

    <!-- 步骤 4：下周计划与完整度评分 -->
    <section v-else-if="step === 4" class="space-y-3 text-xs">
      <div
        class="space-y-3 rounded-xl border border-[#F1F5F9] bg-[#F8FAFC] p-3.5"
      >
        <div class="flex items-center justify-between">
          <span class="font-bold text-[#0F172A]">
            第四步：确认下周计划与周报总结
          </span>
          <Tag color="green" class="font-bold">周报完整度：98%</Tag>
        </div>

        <div>
          <label class="mb-1 block text-[11px] text-[#64748B]">
            下周计划交付节点:
          </label>
          <Input.TextArea
            v-model:value="nextPlanText"
            :rows="3"
            class="rounded-xl border-[#E2E8F0] text-xs"
          />
        </div>

        <div
          class="space-y-1 rounded-lg border border-[#DCFCE7] bg-[#F0FDF4] p-2.5 text-[#064E3B]"
        >
          <span class="block font-bold">💡 AI 评价总结：</span>
          <p class="m-0 text-[11px] leading-relaxed">
            本周交付华达打印与报价平台 V2
            两项成果，资料全备，跨周承诺均已清晰说明。符合高品质周报标准。
          </p>
        </div>
      </div>

      <div class="flex items-center justify-between">
        <Button size="small" class="rounded-xl text-xs" @click="step = 3">
          ← 上一步
        </Button>
        <Button
          type="primary"
          size="small"
          class="flex items-center gap-1 rounded-xl border-none bg-[#064E3B] px-5 text-xs font-bold hover:bg-[#047857]"
          @click="handleFinalSubmit"
        >
          <Icon icon="lucide:send" class="size-3.5" />
          <span>确认并一键提交周报</span>
        </Button>
      </div>
    </section>

    <!-- 步骤 5：完成提交状态 -->
    <section
      v-else-if="step === 5"
      class="space-y-1 rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-3 text-center"
    >
      <div
        class="inline-flex items-center gap-1.5 text-sm font-bold text-[#059669]"
      >
        <Icon icon="lucide:check-circle-2" class="size-5" />
        <span>周报已成功提交至主管审阅！</span>
      </div>
      <p class="m-0 text-xs text-[#047857]">
        完整度评分 98%，已同步至团队管理看板。
      </p>
    </section>
  </article>
</template>
