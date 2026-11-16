<script setup lang="ts">
import { computed, provide, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, message, Tag } from 'ant-design-vue';

const route = useRoute();
const router = useRouter();

// ================================================================
// 子组件暴露给 wizard footer 的接口
// 子页面 inject('wizardFooterApi') 后填充自己的方法
// ================================================================

interface WizardFooterApi {
  canParse?: boolean;
  parseStatus?: string;
  startParse?: () => void;
  saveDraft?: () => void;
  goNextFromParse?: () => void;
}

const footerApi = ref<WizardFooterApi>({});
provide('wizardFooterApi', footerApi);

// 切换步骤时重置
watch(
  () => route.path,
  () => {
    footerApi.value = {};
  },
);

/** 6 步配置 */
const steps = [
  {
    key: 'scenario-description',
    title: '业务要求',
    icon: 'lucide:sparkles',
    routeName: 'SmartTicketWizardDescription',
    routePath: '/app/mate/apps/smart-ticket/wizard/scenario-description',
  },
  {
    key: 'field-review',
    title: '工单信息',
    icon: 'lucide:list-checks',
    routeName: 'SmartTicketWizardFieldReview',
    routePath: '/app/mate/apps/smart-ticket/wizard/field-review',
  },
  {
    key: 'custom-status',
    title: '状态流转',
    icon: 'lucide:flag',
    routeName: 'SmartTicketWizardCustomStatus',
    routePath: '/app/mate/apps/smart-ticket/wizard/custom-status',
  },
  {
    key: 'dispatch-rules',
    title: '派单规则',
    icon: 'lucide:git-branch',
    routeName: 'SmartTicketWizardDispatchRules',
    routePath: '/app/mate/apps/smart-ticket/wizard/dispatch-rules',
  },
  {
    key: 'sla-config',
    title: '时限提醒',
    icon: 'lucide:timer',
    routeName: 'SmartTicketWizardSlaConfig',
    routePath: '/app/mate/apps/smart-ticket/wizard/sla-config',
  },
  {
    key: 'test-publish',
    title: '发布',
    icon: 'lucide:rocket',
    routeName: 'SmartTicketWizardTestPublish',
    routePath: '/app/mate/apps/smart-ticket/wizard/test-publish',
  },
];

/** 路由 name → step index（0 起） */
const nameToIdx: Record<string, number> = Object.fromEntries(
  steps.map((s, i) => [s.routeName, i] as const),
);

const stepIndex = ref(0);

watch(
  () => route.name,
  () => {
    const idx = nameToIdx[String(route.name || '')];
    if (typeof idx === 'number') stepIndex.value = idx;
  },
  { immediate: true, flush: 'post' },
);

/** 当前场景信息 */
const scenarioInfo = computed(() => ({
  name: '故障报修',
  code: 'fault-report',
  status: '配置中',
}));

/** 是否显示通用底部操作栏（test-publish 步骤自定义按钮，不显示通用 footer） */
const showFooter = computed(
  () => route.name !== 'SmartTicketWizardTestPublish',
);

function goTo(i: number) {
  const target = steps[i];
  if (!target) return;
  router.replace({
    path: target.routePath,
    query: { ...route.query, step: String(i + 1) },
  });
}

function goPrev() {
  if (stepIndex.value === 0) {
    router.push('/app/mate/apps/smart-ticket/scenario');
    return;
  }
  goTo(stepIndex.value - 1);
}

function goNext() {
  message.success(`「${steps[stepIndex.value].title}」已保存`);
  if (stepIndex.value === steps.length - 1) {
    router.push('/app/mate/apps/smart-ticket/scenario');
    return;
  }
  goTo(stepIndex.value + 1);
}
</script>

<template>
  <section class="wizard-page">
    <!-- 顶部：场景标识 + 状态 + 自动保存 -->
    <header class="wizard-page__header">
      <div class="wizard-page__scenario">
        <div class="wizard-page__scenario-icon">
          <Icon icon="lucide:sparkles" />
        </div>
        <div class="wizard-page__scenario-meta">
          <div class="wizard-page__title-row">
            <h1>{{ scenarioInfo.name }} · 场景配置</h1>
            <Tag color="blue">{{ scenarioInfo.status }}</Tag>
          </div>
          <div class="wizard-page__code-row">
            <span class="wizard-page__code-label">场景编码</span>
            <span class="wizard-page__code-value">{{ scenarioInfo.code }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 步骤条：紧凑单行 -->
    <div class="wizard-page__steps">
      <div
        v-for="(s, idx) in steps"
        :key="s.key"
        class="wizard-step"
        :class="{
          'wizard-step--done': idx < stepIndex,
          'wizard-step--current': idx === stepIndex,
          'wizard-step--pending': idx > stepIndex,
        }"
      >
        <button type="button" class="wizard-step__btn" @click="goTo(idx)">
          <span
            class="wizard-step__dot"
            :class="{
              'wizard-step__dot--done': idx < stepIndex,
              'wizard-step__dot--current': idx === stepIndex,
              'wizard-step__dot--pending': idx > stepIndex,
            }"
          >
            <Icon v-if="idx < stepIndex" icon="lucide:check" class="size-3" />
            <Icon
              v-else-if="idx === stepIndex"
              icon="lucide:loader-2"
              class="size-3 animate-spin"
            />
            <span v-else class="wizard-step__num">{{ idx + 1 }}</span>
          </span>
          <span
            class="wizard-step__title"
            :class="{
              'wizard-step__title--active': idx === stepIndex,
              'wizard-step__title--done': idx < stepIndex,
              'wizard-step__title--pending': idx > stepIndex,
            }"
          >
            {{ s.title }}
          </span>
        </button>
        <div
          v-if="idx < steps.length - 1"
          class="wizard-step__line"
          :class="{ 'wizard-step__line--done': idx < stepIndex }"
        ></div>
      </div>
    </div>

    <!-- 步骤内容区域（滚动） + 固定底部操作栏 -->
    <div class="wizard-page__main">
      <div
        class="wizard-page__content"
        :class="{ 'wizard-page__content--flush': !showFooter }"
      >
        <RouterView />
      </div>

      <!-- 固定底部操作栏：根据当前步骤动态渲染按钮组 -->
      <div v-if="showFooter" class="wizard-page__footer">
        <div class="wizard-page__footer-inner">
          <div class="wizard-page__footer-left">
            <Button @click="goPrev">
              <Icon icon="lucide:chevron-left" />
              {{ stepIndex === 0 ? '返回列表' : '上一步' }}
            </Button>
          </div>
          <div class="wizard-page__footer-right">
            <!-- 第 1 步：上传制度 -->
            <template v-if="route.name === 'SmartTicketWizardDescription'">
              <!-- 解析前：开始解析 -->
              <Button
                v-if="
                  footerApi.parseStatus === 'idle' ||
                  footerApi.parseStatus === 'uploaded'
                "
                type="primary"
                :disabled="!footerApi.canParse"
                @click="footerApi.startParse?.()"
              >
                <Icon icon="lucide:sparkles" class="size-3.5" />
                开始解析
              </Button>

              <!-- 解析中 -->
              <Button
                v-else-if="footerApi.parseStatus === 'parsing'"
                type="primary"
                disabled
              >
                <Icon icon="lucide:loader-2" class="size-3.5 animate-spin" />
                解析中...
              </Button>

              <!-- 解析完成/部分完成：进入下一步 -->
              <Button
                v-else-if="
                  footerApi.parseStatus === 'done' ||
                  footerApi.parseStatus === 'partial'
                "
                type="primary"
                @click="goNext"
              >
                进入工单信息
                <Icon icon="lucide:chevron-right" class="size-3.5" />
              </Button>

              <!-- 解析失败：重试 -->
              <Button
                v-else-if="footerApi.parseStatus === 'error'"
                type="primary"
                @click="footerApi.startParse?.()"
              >
                <Icon icon="lucide:rotate-cw" class="size-3.5" />
                重试解析
              </Button>
            </template>

            <!-- 其他步骤：统一的"保存并下一步" -->
            <template v-else>
              <Button type="primary" @click="goNext">
                保存并下一步
                <Icon icon="lucide:chevron-right" />
              </Button>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
@keyframes step-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 4px rgb(11 110 101 / 12%);
  }

  50% {
    box-shadow: 0 0 0 7px rgb(11 110 101 / 6%);
  }
}

@media (max-width: 1280px) {
  .wizard-page__header {
    padding-right: 16px;
    padding-left: 16px;
  }

  .wizard-page__progress-bar {
    width: 180px;
  }

  .wizard-page__content {
    padding-right: 14px;
    padding-left: 14px;
  }
}

.wizard-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #f8fbfa;
  border: 1px solid #d5e4df;
  border-radius: 24px;
  box-shadow: 0 18px 44px rgb(18 57 45 / 6%);
}

.wizard-page__header {
  display: flex;
  flex: none;
  gap: 16px;
  align-items: center;
  padding: 10px 22px;
  background: rgb(255 255 255 / 88%);
  border-bottom: 1px solid #e0ebe7;
}

.wizard-page__scenario {
  display: flex;
  gap: 12px;
  align-items: center;
}

.wizard-page__scenario-icon {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #fff;
  background: linear-gradient(135deg, #0b6e65, #32c8a5);
  border-radius: 12px;
}

.wizard-page__scenario-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.wizard-page__title-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.wizard-page__title-row h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  color: #102e29;
  letter-spacing: -0.01em;
}

.wizard-page__code-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.wizard-page__code-label {
  font-size: 11px;
  color: #8ba8a1;
}

.wizard-page__code-value {
  padding: 1px 6px;
  font-family: 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
  font-weight: 600;
  color: #3d5a53;
  background: #eef4f1;
  border-radius: 4px;
}

.wizard-page__actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.wizard-page__steps {
  display: flex;
  flex: none;
  gap: 0;
  align-items: center;
  padding: 10px 22px;
  background: #fff;
  border-bottom: 1px solid #e4edea;
}

/* 步骤项：圆点 + 标题 + 右侧连线 */
.wizard-step {
  display: flex;
  flex: 1;
  gap: 0;
  align-items: center;
  min-width: 0;
}

.wizard-step:last-child {
  flex: none;
}

.wizard-step__btn {
  display: flex;
  gap: 8px;
  align-items: center;
  min-width: 0;
  padding: 0;
  cursor: pointer;
  background: transparent;
  border: 0;
}

/* 紧凑圆点：26px */
.wizard-step__dot {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  border-radius: 50%;
  transition: all 0.25s ease;
}

.wizard-step__num {
  font-size: 12px;
  font-weight: 700;
}

.wizard-step__dot--done {
  background: #32c8a5;
}

.wizard-step__dot--current {
  position: relative;
  background: #0b6e65;
  box-shadow: 0 0 0 3px rgb(11 110 101 / 14%);
  animation: step-pulse 2s infinite;
}

.wizard-step__dot--pending {
  color: #8ba8a1;
  background: #d8e7e1;
}

/* 步骤标题 */
.wizard-step__title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  transition: color 0.2s;
}

.wizard-step__title--active {
  color: #0c4a3f;
}

.wizard-step__title--done {
  color: #0b6e65;
}

.wizard-step__title--pending {
  color: #94a8a1;
}

/* 步骤间连线 */
.wizard-step__line {
  flex: 1;
  height: 2px;
  margin: 0 10px;
  background: #d8e7e1;
  border-radius: 999px;
  transition: background 0.25s;
}

.wizard-step__line--done {
  background: #32c8a5;
}

/* 悬停态 */
.wizard-step__btn:hover .wizard-step__title--pending {
  color: #5a756d;
}

.wizard-step__btn:hover .wizard-step__dot--pending {
  background: #cfe1db;
}

.wizard-page__main {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.wizard-page__content {
  flex: 1;
  min-height: 0;
  padding: 16px 18px 84px;
  overflow: auto;
}

/* 第 6 步无通用 footer，压缩底部留白供页面内固定操作条贴底 */
.wizard-page__content--flush {
  padding-bottom: 12px;
}

.wizard-page__footer {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  flex: none;
  padding: 10px 18px;
  background: linear-gradient(
    180deg,
    rgb(248 251 250 / 0%) 0%,
    rgb(248 251 250 / 96%) 40%,
    #f8fbfa 100%
  );
  border-top: 1px solid #e4edea;
  backdrop-filter: blur(6px);
}

.wizard-page__footer-inner {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 16px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 14px;
  box-shadow: 0 6px 16px rgb(18 57 45 / 6%);
}

.wizard-page__footer-right {
  display: inline-flex;
  gap: 8px;
}

:deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}
</style>
