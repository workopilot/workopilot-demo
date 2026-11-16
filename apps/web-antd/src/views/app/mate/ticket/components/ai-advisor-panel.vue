<!-- 工单详情右栏 · AI 处理建议面板（按工单状态只展示当前操作范围） -->
<script setup lang="ts">
import type {
  GuideReasonType,
  RecommendedPlan,
  TicketAiAdvisor,
  WorkOrder,
} from '#/types/ticket';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { message, Tag } from 'ant-design-vue';

import { getTicketAiAdvisor } from '#/api/mock-data-ticket';

const props = defineProps<{
  /** 当前详情工单 */
  order: WorkOrder;
}>();

// ---------- AI 建议数据（按工单生成） ----------
const advisor = computed<TicketAiAdvisor>(() =>
  getTicketAiAdvisor(props.order),
);

// ---------- 重新生成（模拟） ----------
const regenerating = ref(false);
async function regenerate() {
  regenerating.value = true;
  setTimeout(() => {
    regenerating.value = false;
    message.success('已基于最新工单信息重新生成 AI 建议');
  }, 900);
}

// ---------- AI 首选方案（处理中 / 终态回看） ----------
const mainPlan = computed<RecommendedPlan | undefined>(
  () =>
    advisor.value.plans.plans.find((p) => p.recommended) ??
    advisor.value.plans.plans[0],
);

/** 方案参考依据（统一标注：制度条款 + 标准流程 + 相似案例） */
const planBasisText = computed(() => {
  const clauseCount = advisor.value.compliance.reduce(
    (n, c) => n + c.clauses.length,
    0,
  );
  const caseCount = advisor.value.similarCases.cases.length;
  return `综合 ${clauseCount} 项制度条款 · 标准流程「${advisor.value.standardProcess.name}」 · ${caseCount} 例相似案例`;
});

/** 处理中 / 终态回看时展示方案精简卡（待接单看引导，待派单看派单提示） */
const showPlan = computed(
  () => props.order.status !== 'dispatched' && props.order.status !== 'pending',
);

// ---------- 待接单 AI 引导（确认接单 vs 转派） ----------
/** 引导依据类型 → 标签文案 */
const guideReasonMeta: Record<GuideReasonType, { label: string }> = {
  case: { label: '历史案例' },
  match: { label: '当前问题' },
  policy: { label: '制度要求' },
};
</script>

<template>
  <section class="ai-advisor">
    <!-- ============ 紧凑头部：徽章 + 置信度 + 重新生成（单行浅色条） ============ -->
    <header class="adv-head">
      <span class="adv-head__badge">
        <Icon icon="lucide:sparkles" />
        AI 处理建议
      </span>
      <span class="adv-head__conf">
        <Icon icon="lucide:gauge" />
        {{ advisor.overallConfidence }}% 置信度
      </span>
      <span class="adv-head__spacer"></span>
      <button
        type="button"
        class="adv-head__refresh"
        :disabled="regenerating"
        @click="regenerate"
      >
        <Icon icon="lucide:refresh-cw" :class="{ 'is-spin': regenerating }" />
        {{ regenerating ? '分析中…' : '重新生成' }}
      </button>
    </header>

    <!-- ============ 待接单：AI 引导（确认接单 vs 转派） ============ -->
    <article
      v-if="order.status === 'dispatched' && advisor.acceptGuide"
      class="adv-card is-guide"
    >
      <header class="adv-card__head">
        <span class="adv-card__icon is-gold">
          <Icon icon="lucide:compass" />
        </span>
        <div class="adv-card__title">
          <strong>
            接单决策引导
            <Tag color="orange" class="adv-tag">待你处理</Tag>
          </strong>
          <small>综合当前问题 · 历史案例 · 制度要求</small>
        </div>
      </header>
      <div class="guide-body">
        <div
          class="guide-verdict"
          :class="`is-${advisor.acceptGuide.suggestion}`"
        >
          <Icon
            :icon="
              advisor.acceptGuide.suggestion === 'confirm'
                ? 'lucide:check-check'
                : 'lucide:repeat'
            "
          />
          <div class="guide-verdict__main">
            <strong>
              {{
                advisor.acceptGuide.suggestion === 'confirm'
                  ? '建议确认接单'
                  : '建议转派处理'
              }}
            </strong>
            <small>{{ advisor.acceptGuide.conclusion }}</small>
          </div>
          <span class="guide-verdict__conf">
            {{ advisor.acceptGuide.confidence }}%
          </span>
        </div>

        <ul class="guide-reasons">
          <li
            v-for="r in advisor.acceptGuide.reasons"
            :key="r.title"
            class="guide-reason"
          >
            <span class="guide-reason__tag" :class="`is-${r.type}`">
              {{ guideReasonMeta[r.type].label }}
            </span>
            <div class="guide-reason__main">
              <strong>{{ r.title }}</strong>
              <p>{{ r.detail }}</p>
            </div>
          </li>
        </ul>

        <p v-if="advisor.acceptGuide.transferHint" class="guide-hint">
          <Icon icon="lucide:info" />
          {{ advisor.acceptGuide.transferHint }}
        </p>
        <p v-else class="guide-hint">
          <Icon icon="lucide:info" />
          确认接单后将记录接单时间并启动 SLA
          响应计时；如情况不匹配，可点击下方「转派」由调度重新派单。
        </p>
      </div>
    </article>

    <!-- ============ 待派单：一行 AI 派单提示 ============ -->
    <div v-else-if="order.status === 'pending'" class="adv-card is-hintline">
      <p class="adv-hint-line">
        <Icon icon="lucide:sparkles" />
        AI 派单提示：{{ advisor.standardProcess.matchReason }}
      </p>
    </div>

    <!-- ============ 处理中 / 终态回看：AI 首选方案精简卡 ============ -->
    <article v-else-if="showPlan && mainPlan" class="adv-card is-plans">
      <header class="adv-card__head">
        <span class="adv-card__icon is-gold">
          <Icon icon="lucide:lightbulb" />
        </span>
        <div class="adv-card__title">
          <strong>AI 推荐方案</strong>
          <small>仅展示 AI 首选方案 · 完整分析可在报告中查看</small>
        </div>
      </header>
      <div class="plan-body">
        <div class="pl-main">
          <div class="pl-main__head">
            <span class="pl-main__badge">
              <Icon icon="lucide:sparkles" />
              AI 首选
            </span>
            <strong>{{ mainPlan.name }}</strong>
            <span class="pl-main__conf">{{ mainPlan.confidence }}%</span>
          </div>
          <div class="pl-main__steps">
            <span class="pl-main__steps-label">
              <Icon icon="lucide:list-checks" />
              操作步骤 · 预计 {{ mainPlan.estimatedHours }}h
            </span>
            <ol>
              <li v-for="(s, i) in mainPlan.steps" :key="i">
                <i>{{ i + 1 }}</i>
                <span>{{ s }}</span>
              </li>
            </ol>
          </div>
          <p class="adv-basis">
            <Icon icon="lucide:landmark" />
            参考依据：{{ planBasisText }}
          </p>
        </div>
      </div>
    </article>
  </section>
</template>

<style scoped>
@keyframes adv-spin {
  to {
    transform: rotate(360deg);
  }
}

.ai-advisor {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.adv-tag {
  padding: 0 6px;
  margin: 0;
  font-size: 10px;
  line-height: 16px;
  vertical-align: 2px;
}

/* ============ 头部：紧凑单行浅色条 ============ */
.adv-head {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 9px 12px;
  background: linear-gradient(120deg, #f2faf6, #eaf5f0);
  border: 1px solid #c3e0d5;
  border-radius: 10px;
}

.adv-head__badge {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 800;
  color: #083b33;
  background: linear-gradient(120deg, #f6d88b, #fbeec2);
  border-radius: 999px;
}

.adv-head__badge svg {
  width: 13px;
  height: 13px;
}

.adv-head__conf {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  font-size: 11.5px;
  font-weight: 700;
  color: #0b6e65;
}

.adv-head__conf svg {
  width: 13px;
  height: 13px;
}

.adv-head__spacer {
  flex: 1;
}

.adv-head__refresh {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #35625a;
  cursor: pointer;
  background: #fff;
  border: 1px solid #c8ddd5;
  border-radius: 999px;
  transition: all 0.15s;
}

.adv-head__refresh:hover {
  color: #0b6e65;
  border-color: #9dc6b9;
}

.adv-head__refresh:disabled {
  cursor: wait;
  opacity: 0.7;
}

.adv-head__refresh svg {
  width: 12px;
  height: 12px;
}

.adv-head__refresh svg.is-spin {
  animation: adv-spin 1s linear infinite;
}

/* ============ 建议卡片 ============ */
.adv-card {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e1ece7;
  border-radius: 10px;
}

.adv-card.is-guide {
  border-top: 3px solid #0b6e65;
}

.adv-card.is-plans {
  border-top: 3px solid #c98b2c;
}

.adv-card__head {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 10px 12px;
}

.adv-card__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  color: #0b6e65;
  background: #eef6f2;
  border-radius: 8px;
}

.adv-card__icon svg {
  width: 15px;
  height: 15px;
}

.adv-card__icon.is-gold {
  color: #96660f;
  background: #faf3e0;
}

.adv-card__title {
  flex: 1;
  min-width: 0;
}

.adv-card__title strong {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 13px;
  color: #0c2f28;
}

.adv-card__title small {
  display: block;
  margin-top: 1px;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 10.5px;
  color: #8ba09a;
  white-space: nowrap;
}

/* 统一参考依据标注 */
.adv-basis {
  display: flex;
  gap: 5px;
  align-items: flex-start;
  padding: 6px 9px;
  margin: 8px 0 0;
  font-size: 10.5px;
  line-height: 1.55;
  color: #7a5c22;
  background: #fdf8ec;
  border: 1px dashed #e5cf9a;
  border-radius: 7px;
}

.adv-basis svg {
  flex: none;
  width: 12px;
  height: 12px;
  margin-top: 1.5px;
  color: #b08a35;
}

/* 方案精简卡：AI 首选 */
.plan-body {
  padding: 0 12px 12px;
}

.pl-main {
  padding: 11px;
  background: linear-gradient(to bottom, #fdfaf0, #fcfefd);
  border: 1.5px solid #e8c98a;
  border-radius: 10px;
  box-shadow: 0 3px 10px rgb(201 139 44 / 10%);
}

.pl-main__head {
  display: flex;
  gap: 7px;
  align-items: center;
}

.pl-main__badge {
  display: inline-flex;
  flex: none;
  gap: 4px;
  align-items: center;
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 800;
  color: #7a5418;
  background: linear-gradient(120deg, #f6d88b, #fbeec2);
  border-radius: 999px;
}

.pl-main__badge svg {
  width: 10px;
  height: 10px;
}

.pl-main__head strong {
  flex: 1;
  font-size: 12.5px;
  line-height: 1.4;
  color: #0c2f28;
}

.pl-main__conf {
  flex: none;
  font-size: 12px;
  font-weight: 800;
  color: #c98b2c;
}

.pl-main__steps {
  margin-top: 9px;
}

.pl-main__steps-label {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 800;
  color: #0c4a3f;
}

.pl-main__steps-label svg {
  width: 12px;
  height: 12px;
  color: #c98b2c;
}

.pl-main__steps ol {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.pl-main__steps li {
  display: flex;
  gap: 7px;
  align-items: flex-start;
  font-size: 11.5px;
  line-height: 1.55;
  color: #2c4a42;
}

.pl-main__steps li i {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-top: 1px;
  font-size: 9.5px;
  font-style: normal;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #0b6e65, #178f7b);
  border-radius: 50%;
}

/* 待接单 AI 引导卡 */
.guide-body {
  padding: 0 12px 12px;
}

.guide-verdict {
  display: flex;
  gap: 9px;
  align-items: center;
  padding: 10px 11px;
  border-radius: 9px;
}

.guide-verdict.is-confirm {
  color: #0c3a30;
  background: linear-gradient(120deg, #e6f4ee, #f2faf6);
  border: 1px solid #9dc6b9;
}

.guide-verdict.is-transfer {
  color: #5c3d05;
  background: linear-gradient(120deg, #fdf3e0, #fdfaf0);
  border: 1px solid #e5cf9a;
}

.guide-verdict > svg {
  flex: none;
  width: 20px;
  height: 20px;
}

.guide-verdict.is-confirm > svg {
  color: #0b6e65;
}

.guide-verdict.is-transfer > svg {
  color: #c98b2c;
}

.guide-verdict__main {
  flex: 1;
  min-width: 0;
}

.guide-verdict__main strong {
  display: block;
  font-size: 13px;
  font-weight: 800;
}

.guide-verdict__main small {
  display: block;
  margin-top: 2px;
  font-size: 10.5px;
  line-height: 1.5;
  opacity: 0.75;
}

.guide-verdict__conf {
  flex: none;
  font-size: 14px;
  font-weight: 800;
}

.guide-reasons {
  display: flex;
  flex-direction: column;
  gap: 7px;
  padding: 0;
  margin: 9px 0 0;
  list-style: none;
}

.guide-reason {
  display: flex;
  gap: 7px;
  align-items: flex-start;
  padding: 8px 9px;
  background: #fcfefd;
  border: 1px solid #eef4f1;
  border-radius: 8px;
}

.guide-reason__tag {
  flex: none;
  padding: 1px 7px;
  margin-top: 1px;
  font-size: 9.5px;
  font-weight: 800;
  border-radius: 999px;
}

.guide-reason__tag.is-match {
  color: #0b5480;
  background: #e3f1fb;
}

.guide-reason__tag.is-case {
  color: #1f6a34;
  background: #e5f5e9;
}

.guide-reason__tag.is-policy {
  color: #7a5418;
  background: #f8ecd0;
}

.guide-reason__main {
  flex: 1;
  min-width: 0;
}

.guide-reason__main strong {
  display: block;
  font-size: 11.5px;
  color: #0c2f28;
}

.guide-reason__main p {
  margin: 3px 0 0;
  font-size: 10.5px;
  line-height: 1.6;
  color: #5a756d;
}

.guide-hint {
  display: flex;
  gap: 5px;
  align-items: flex-start;
  padding: 7px 9px;
  margin: 9px 0 0;
  font-size: 10.5px;
  line-height: 1.6;
  color: #35625a;
  background: #f0f7f4;
  border-radius: 7px;
}

.guide-hint svg {
  flex: none;
  width: 12px;
  height: 12px;
  margin-top: 2px;
  color: #0b6e65;
}

/* 待派单：一行 AI 派单提示 */
.is-hintline {
  border-top: 3px solid #9dc6b9;
}

.adv-hint-line {
  display: flex;
  gap: 6px;
  align-items: flex-start;
  padding: 10px 12px;
  margin: 0;
  font-size: 11.5px;
  line-height: 1.6;
  color: #35625a;
}

.adv-hint-line svg {
  flex: none;
  width: 13px;
  height: 13px;
  margin-top: 2px;
  color: #0b6e65;
}

/* ============ 基础 ============ */

/* 底部操作栏已移至详情抽屉 footer（my-tickets.vue） */
</style>
