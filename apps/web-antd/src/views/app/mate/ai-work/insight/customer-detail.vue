<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import { Button, Tag } from 'ant-design-vue';

import { useAiWorkDemoStore } from '#/store/ai-work-demo';

import AiKpiGrid from '../components/ai-kpi-grid.vue';
import AiWorkPage from '../components/ai-work-page.vue';
import AskAiButton from '../components/ask-ai-button.vue';
import EvidenceChainDrawer from '../components/evidence-chain-drawer.vue';

const store = useAiWorkDemoStore();
const evidenceOpen = ref(false);
const kpis = computed(() => [
  { label: '关联项目', value: 2 },
  { label: '本周记录', value: 8 },
  { label: '进行中事项', value: 4 },
  { label: '已完成事项', value: 11, tone: 'success' as const },
  {
    label: '风险信号',
    value: store.state.focusMarked ? 2 : 1,
    tone: 'danger' as const,
  },
  { label: '开放承诺', value: 1, tone: 'warning' as const },
]);
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <AiWorkPage
    eyebrow="CUSTOMER CONTEXT"
    title="华达 · 客户 Context"
    description="自动串联项目、承诺、风险和事实证据"
  >
    <template #actions>
      <Tag color="red">
        {{ store.state.focusMarked ? '重点关注' : '持续观察' }}
      </Tag>
      <Button @click="evidenceOpen = true">
        <Icon icon="lucide:route" />
        证据链
      </Button>
      <AskAiButton context="总结华达客户当前状态与建议动作" />
    </template>
    <AiKpiGrid :items="kpis" />
    <section class="context-summary">
      <div><Icon icon="lucide:brain-circuit" /></div>
      <article>
        <span>AI 客户总结</span>
        <h2>问题已缓解，但稳定性尚未被时间验证</h2>
        <p>
          本周完成打印参数调整和耗材更换，卷曲问题基本解决。客户明确要求继续观察一周，主管已将其标记为重点关注。建议建立每日效果记录，并于下周三形成阶段结论。
        </p>
        <footer>
          <Tag color="orange">趋势：上升</Tag>
          <Tag color="blue">建议：主动跟进</Tag>
        </footer>
      </article>
    </section>
    <div class="context-grid">
      <article>
        <header>
          <h3>关键时间线</h3>
          <span>最近 7 天</span>
        </header>
        <div class="timeline">
          <p>
            <b>08/03</b>
            <span>
              <strong>需求范围确认</strong>
              <small>确认接口、验收口径与现场计划</small>
            </span>
          </p>
          <p>
            <b>08/05</b>
            <span>
              <strong>现场问题处理</strong>
              <small>参数调整后卷曲问题基本解决</small>
            </span>
          </p>
          <p>
            <b>08/07</b>
            <span>
              <strong>周报形成风险条目</strong>
              <small>进入一周观察期，待形成稳定验证</small>
            </span>
          </p>
          <p>
            <b>08/10</b>
            <span>
              <strong>主管标记重点关注</strong>
              <small>要求下周三同步现场结论</small>
            </span>
          </p>
        </div>
      </article>
      <article>
        <header>
          <h3>关联项目</h3>
          <Button size="small">查看全部</Button>
        </header>
        <div class="project">
          <Icon icon="lucide:printer" />
          <span>
            <strong>华达智能打印</strong>
            <small>现场观察 · 进度 78%</small>
          </span>
          <Tag color="orange">风险</Tag>
        </div>
        <div class="project">
          <Icon icon="lucide:network" />
          <span>
            <strong>华达接口集成</strong>
            <small>需求确认 · 进度 35%</small>
          </span>
          <Tag color="green">正常</Tag>
        </div>
        <header class="issue-title">
          <h3>开放事项</h3>
          <span>2 项</span>
        </header>
        <div class="issue">
          <span></span>
          <p>
            <strong>连续记录一周打印效果</strong>
            <small>负责人 张三 · 08/12</small>
          </p>
        </div>
        <div class="issue">
          <span></span>
          <p>
            <strong>形成现场阶段结论</strong>
            <small>负责人 张三 · 08/13</small>
          </p>
        </div>
      </article>
    </div>
    <EvidenceChainDrawer v-model:open="evidenceOpen" />
  </AiWorkPage>
</template>

<style scoped>
.context-summary {
  display: grid;
  grid-template-columns: 46px 1fr;
  gap: 13px;
  padding: 16px;
  margin: 12px 0;
  background: linear-gradient(120deg, #e9f7f3, #fff);
  border: 1px solid #c2e2d9;
  border-radius: 17px;
}

.context-summary > div {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 20px;
  color: #fff;
  background: #0a7c6d;
  border-radius: 14px;
}

.context-summary span {
  font-size: 10px;
  font-weight: 800;
  color: #0b806f;
}

.context-summary h2 {
  margin: 3px 0 5px;
  font-size: 17px;
  color: #173c34;
}

.context-summary p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #5b7169;
}

.context-summary footer {
  margin-top: 8px;
}

.context-grid {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 12px;
}

.context-grid > article {
  padding: 15px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

.context-grid header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.context-grid h3 {
  margin: 0;
  font-size: 14px;
  color: #173c34;
}

.context-grid header > span {
  font-size: 10px;
  color: #7b8c86;
}

.timeline {
  margin-left: 28px;
  border-left: 1px solid #cfe1db;
}

.timeline p {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 14px;
  margin: 0 0 16px -25px;
}

.timeline b {
  display: grid;
  place-items: center;
  height: 28px;
  font-size: 10px;
  color: #0c786b;
  background: #f4faf8;
  border: 1px solid #bcd9d0;
  border-radius: 9px;
}

.timeline p > span,
.project > span {
  display: grid;
  gap: 3px;
}

.timeline strong,
.project strong,
.issue strong {
  font-size: 12px;
  color: #284b43;
}

.timeline small,
.project small,
.issue small {
  font-size: 10px;
  color: #788a84;
}

.project {
  display: grid;
  grid-template-columns: 34px 1fr auto;
  gap: 9px;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid #edf2f0;
}

.project > svg {
  font-size: 19px;
  color: #0c806e;
}

.issue-title {
  padding-top: 14px;
  margin-top: 10px;
  border-top: 1px solid #e8efed;
}

.issue {
  display: grid;
  grid-template-columns: 8px 1fr;
  gap: 8px;
  margin: 9px 0;
}

.issue > span {
  width: 7px;
  height: 7px;
  margin-top: 5px;
  background: #e59c32;
  border-radius: 50%;
}

.issue p {
  display: grid;
  gap: 3px;
  margin: 0;
}
</style>
