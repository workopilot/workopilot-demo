<script setup lang="ts">
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Steps, Tag } from 'ant-design-vue';

const router = useRouter();

const handleBack = () => {
  router.push({ name: 'TenantBillOverview' });
};
</script>

<template>
  <div
    class="relative flex min-h-full w-full flex-col bg-slate-50/50 dark:bg-slate-900/50"
  >
    <!-- Navigation Bar -->
    <div class="flex items-center gap-4 px-6 pb-4 pt-8 md:px-10">
      <Button
        shape="circle"
        class="border-slate-200 shadow-sm transition-all hover:shadow-md"
        @click="handleBack"
      >
        <template #icon>
          <Icon icon="lucide:arrow-left" class="text-slate-600" />
        </template>
      </Button>
      <div>
        <h1
          class="m-0 text-xl font-black tracking-tight text-slate-800 dark:text-slate-100"
        >
          返回我的账单
        </h1>
      </div>
    </div>

    <div
      class="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 pb-12 md:px-10"
    >
      <!-- Hero Section -->
      <div
        class="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
      >
        <div
          class="absolute inset-0 z-0 bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-indigo-900/20 dark:via-slate-800 dark:to-purple-900/20"
        ></div>
        <div
          class="absolute right-0 top-0 z-0 h-full w-1/2 bg-[url('https://api.dicebear.com/7.x/shapes/svg?seed=bg1&backgroundColor=transparent')] opacity-10 mix-blend-multiply"
        ></div>

        <div
          class="relative z-10 flex flex-col items-center justify-between gap-10 p-10 md:flex-row md:p-14"
        >
          <div class="max-w-xl">
            <Tag
              color="indigo"
              class="mb-4 rounded-lg border-0 bg-indigo-100 px-3 py-1 font-bold text-indigo-700"
            >
              专属管家服务
            </Tag>
            <h1
              class="mb-4 text-4xl font-black leading-tight tracking-tight text-slate-800 md:text-5xl dark:text-white"
            >
              轻松续费升级，<br />保障业务永不掉线。
            </h1>
            <p
              class="mb-8 text-base font-medium leading-relaxed text-slate-600 md:text-lg dark:text-slate-300"
            >
              当您的数字员工额度出现预警，或希望开通更高级别的模型能力时，我们的专属运营团队随时为您提供支持。支持分钟级极速提额。
            </p>
          </div>

          <!-- Contact Card (Glassmorphism) -->
          <div
            class="group relative flex w-full flex-col items-center overflow-hidden rounded-3xl border border-white bg-white/60 p-6 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] backdrop-blur-xl md:w-80 dark:border-slate-700 dark:bg-slate-900/60"
          >
            <div
              class="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
            ></div>

            <div class="relative">
              <div
                class="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur transition duration-500 group-hover:opacity-60"
              ></div>
              <img
                src="https://api.dicebear.com/7.x/notionists/svg?seed=sophia"
                class="relative mb-4 h-20 w-20 rounded-full border-2 border-white bg-indigo-50 shadow-md"
                alt="Account Manager"
              />
            </div>

            <h3
              class="m-0 mb-1 text-xl font-bold text-slate-800 dark:text-slate-100"
            >
              Sophia / 苏菲亚
            </h3>
            <p
              class="mb-5 rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-600"
            >
              大客户专属运营专家
            </p>

            <div
              class="mb-4 flex w-full justify-center rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <!-- Mock QR Code -->
              <div
                class="relative flex h-28 w-28 items-center justify-center rounded-lg border border-slate-200 bg-white p-2 shadow-sm"
              >
                <Icon
                  icon="lucide:qr-code"
                  class="text-6xl text-slate-800 opacity-80"
                />
                <div class="absolute inset-0 flex items-center justify-center">
                  <div
                    class="flex h-6 w-6 items-center justify-center rounded border-2 border-white bg-indigo-600"
                  >
                    <Icon
                      icon="lucide:message-circle"
                      class="text-xs text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            <p
              class="m-0 mb-4 flex items-center justify-center gap-1 text-xs font-medium text-slate-500"
            >
              <Icon icon="lucide:scan-line" /> 微信扫码，极速响应
            </p>

            <div class="flex w-full flex-col gap-2 text-left">
              <div
                class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div
                  class="flex h-8 w-8 items-center justify-center rounded bg-blue-50 text-blue-500 dark:bg-blue-900/30"
                >
                  <Icon icon="lucide:phone-call" />
                </div>
                <div class="flex flex-1 flex-col">
                  <span class="mb-1 text-[10px] leading-none text-slate-400"
                    >专属大客户热线</span
                  >
                  <span
                    class="text-sm font-bold leading-none text-slate-700 dark:text-slate-200"
                    >400-800-8820
                    <span class="text-xs font-normal text-slate-400"
                      >转 1</span
                    ></span
                  >
                </div>
              </div>
              <div
                class="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/50"
              >
                <div
                  class="flex h-8 w-8 items-center justify-center rounded bg-purple-50 text-purple-500 dark:bg-purple-900/30"
                >
                  <Icon icon="lucide:mail" />
                </div>
                <div class="flex flex-1 flex-col">
                  <span class="mb-1 text-[10px] leading-none text-slate-400"
                    >大客户对接邮箱</span
                  >
                  <span
                    class="text-sm font-bold leading-none text-slate-700 dark:text-slate-200"
                    >vip@approve.ai</span
                  >
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Features & Procedures Grid -->
      <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
        <!-- Temporary Quota Intro -->
        <div
          class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <div class="mb-6 flex items-center gap-4">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-100 bg-amber-50 text-amber-500 dark:border-amber-800/50 dark:bg-amber-900/30"
            >
              <Icon icon="lucide:zap" class="text-3xl" />
            </div>
            <div>
              <h2
                class="m-0 text-2xl font-black text-slate-800 dark:text-slate-100"
              >
                应急临时提额
              </h2>
              <p class="m-0 mt-1 text-sm font-medium text-amber-600">
                突发业务激增？先使用后结算！
              </p>
            </div>
          </div>

          <div
            class="prose prose-sm leading-relaxed text-slate-600 dark:prose-invert"
          >
            <p>
              当您的可用额度低于
              <strong>20%</strong>
              或已经耗尽时，为避免核心业务（如客服大模型、短视频生成）中断，平台支持申请临时加包：
            </p>
            <ul class="mt-4 list-disc space-y-2 pl-5 font-medium">
              <li>
                <strong>快速下发</strong>：运营专员可在 1 分钟内为您下发最高
                <strong>100,000点</strong> 的临时额度。
              </li>
              <li>
                <strong>灵活结算</strong>：临时额度默认有效期为 1
                个月，支持在次月合并至正式账单结算。
              </li>
              <li>
                <strong>保障运行</strong
                >：独享数字员工与共享员工均支持独立提额操作。
              </li>
            </ul>
          </div>
        </div>

        <!-- Renewal Steps -->
        <div
          class="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          <div class="mb-8 flex items-center gap-4">
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-500 dark:border-blue-800/50 dark:bg-blue-900/30"
            >
              <Icon icon="lucide:refresh-ccw" class="text-3xl" />
            </div>
            <div>
              <h2
                class="m-0 text-2xl font-black text-slate-800 dark:text-slate-100"
              >
                标准续费与升级流程
              </h2>
              <p class="m-0 mt-1 text-sm font-medium text-blue-600">
                四步轻松完成账单确认
              </p>
            </div>
          </div>

          <Steps direction="vertical" :current="-1" class="custom-steps">
            <Steps.Step>
              <template #title>
                <span class="font-bold text-slate-700 dark:text-slate-200"
                  >联系运营对接</span
                >
              </template>
              <template #description>
                <div class="mb-2 mt-1 text-xs text-slate-500">
                  添加您的专属大客户经理（扫描上方二维码），说明续费时长（支持包月、包季、包年）。
                </div>
              </template>
            </Steps.Step>
            <Steps.Step>
              <template #title>
                <span class="font-bold text-slate-700 dark:text-slate-200"
                  >获取定制对账单</span
                >
              </template>
              <template #description>
                <div class="mb-2 mt-1 text-xs text-slate-500">
                  运营专员将从后台生成包含您独享员工与共享套餐的详细明细对账单供您确认。
                </div>
              </template>
            </Steps.Step>
            <Steps.Step>
              <template #title>
                <span class="font-bold text-slate-700 dark:text-slate-200"
                  >企业公对公打款</span
                >
              </template>
              <template #description>
                <div class="mb-2 mt-1 text-xs text-slate-500">
                  确认无误后，通过企业账户向平台付款。年付客户将自动享受折扣与发票极速开具。
                </div>
              </template>
            </Steps.Step>
            <Steps.Step>
              <template #title>
                <span class="font-bold text-emerald-600">额度自动下发</span>
              </template>
              <template #description>
                <div class="mt-1 text-xs text-slate-500">
                  财务核账后，新额度或延期操作将实时同步至您的控制台，并更新有效日期。
                </div>
              </template>
            </Steps.Step>
          </Steps>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-steps :deep(.ant-steps-item-wait) .ant-steps-item-icon {
  background-color: #f1f5f9;
  border-color: #cbd5e1;
}

.dark .custom-steps :deep(.ant-steps-item-wait) .ant-steps-item-icon {
  background-color: #334155;
  border-color: #475569;
}

.custom-steps :deep(.ant-steps-item-title) {
  line-height: 24px;
}
</style>
