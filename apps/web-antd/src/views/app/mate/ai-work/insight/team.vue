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
  { label: '团队人数', value: 25, detail: '本周活跃 24 人' },
  { label: '工作记录', value: 186, detail: '较上周 +12%' },
  { label: '本周成果', value: 12, tone: 'success' as const },
  { label: '进行中项目', value: 8 },
  {
    label: '风险事项',
    value: store.state.focusMarked ? 4 : 3,
    tone: 'danger' as const,
  },
  { label: '需协助', value: store.attentionCount, tone: 'warning' as const },
]);
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <AiWorkPage
    eyebrow="TEAM INTELLIGENCE"
    title="团队洞察"
    description="产品研发部 · 2026 年第 32 周"
  >
    <template #actions>
      <Button @click="evidenceOpen = true">
        <Icon icon="lucide:route" />
        查看证据链
      </Button>
      <AskAiButton context="分析本周团队风险与下周优先级" />
    </template>
    <AiKpiGrid :items="kpis" />
    <section class="ai-summary">
      <div class="spark"><Icon icon="lucide:sparkles" /></div>
      <div>
        <span>AI 本周复盘</span>
        <h2>交付节奏稳定，但客户环境与华达现场效果是两个关键变量</h2>
        <p>
          报价平台已进入联调；客户 B
          因测试环境延迟形成未兑现承诺；华达打印问题虽基本解决，仍需跨周观察。建议下周优先锁定外部依赖并形成可验证结果。
        </p>
      </div>
    </section>
    <div class="insight-grid">
      <article class="workload">
        <header>
          <h3>团队投入分布</h3>
          <span>186 条工作记录</span>
        </header>
        <div
          v-for="item in [
            { name: '客户交付', value: 42 },
            { name: '产品研发', value: 31 },
            { name: '技术支持', value: 17 },
            { name: '内部协作', value: 10 },
          ]"
          :key="item.name"
          class="bar-row"
        >
          <span>{{ item.name }}</span>
          <div><i :style="{ width: `${item.value * 2}%` }"></i></div>
          <strong>{{ item.value }}%</strong>
        </div>
      </article>
      <article>
        <header>
          <h3>本周重点信号</h3>
          <Tag color="red">{{ store.attentionCount }} 项关注</Tag>
        </header>
        <button type="button" @click="evidenceOpen = true">
          <Icon icon="lucide:triangle-alert" />
          <span>
            <strong>华达客户效果需跨周观察</strong>
            <small>现场问题基本解决，但尚未形成稳定验证。</small>
          </span>
        </button>
        <button type="button">
          <Icon icon="lucide:clock-3" />
          <span>
            <strong>客户 B 联调延期</strong>
            <small>测试环境未就绪，计划延期至下周三。</small>
          </span>
        </button>
        <button type="button">
          <Icon icon="lucide:circle-check-big" />
          <span>
            <strong>报价平台按计划进入联调</strong>
            <small>关键接口已交付测试环境。</small>
          </span>
        </button>
      </article>
      <article class="wide">
        <header>
          <h3>重点对象</h3>
          <span>项目 · 客户 · 风险</span>
        </header>
        <div class="object-grid">
          <RouterLink to="/app/mate/employee/weekly-analysis/customer/huada">
            <b>客户</b>
            <strong>华达</strong>
            <span>风险趋势上升 · 5 条证据</span>
          </RouterLink>
          <RouterLink to="/app/mate/employee/weekly-analysis/projects">
            <b>项目</b>
            <strong>报价平台 V2</strong>
            <span>进入联调 · 进度正常</span>
          </RouterLink>
          <RouterLink to="/app/mate/employee/weekly-analysis/risks">
            <b>承诺</b>
            <strong>客户 B 接口联调</strong>
            <span>延期至 08/13</span>
          </RouterLink>
        </div>
      </article>
    </div>
    <EvidenceChainDrawer v-model:open="evidenceOpen" />
  </AiWorkPage>
</template>

<style scoped>
.ai-summary {
  display: grid;
  grid-template-columns: 46px 1fr;
  gap: 13px;
  padding: 16px;
  margin: 12px 0;
  background: linear-gradient(110deg, #e8f7f2, #fff);
  border: 1px solid #bfe1d8;
  border-radius: 17px;
}

.spark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  font-size: 21px;
  color: #fff;
  background: #08786a;
  border-radius: 14px;
}

.ai-summary span {
  font-size: 10px;
  font-weight: 800;
  color: #09806f;
  letter-spacing: 0.1em;
}

.ai-summary h2 {
  margin: 3px 0 5px;
  font-size: 16px;
  color: #153c33;
}

.ai-summary p {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: #5a7169;
}

.insight-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.insight-grid > article {
  padding: 15px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

.insight-grid .wide {
  grid-column: 1 / -1;
}

.insight-grid header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 13px;
}

.insight-grid h3 {
  margin: 0;
  font-size: 14px;
  color: #173b33;
}

.insight-grid header > span {
  font-size: 10px;
  color: #778982;
}

.bar-row {
  display: grid;
  grid-template-columns: 72px 1fr 38px;
  gap: 8px;
  align-items: center;
  margin: 10px 0;
  font-size: 11px;
  color: #62766f;
}

.bar-row > div {
  height: 7px;
  overflow: hidden;
  background: #eef3f1;
  border-radius: 10px;
}

.bar-row i {
  display: block;
  height: 100%;
  background: #0d8b77;
  border-radius: inherit;
}

.bar-row strong {
  color: #284b43;
}

.insight-grid button {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 9px;
  width: 100%;
  padding: 10px 0;
  color: #d36b45;
  text-align: left;
  background: transparent;
  border: 0;
  border-top: 1px solid #edf2f0;
}

.insight-grid button span {
  display: grid;
  gap: 2px;
}

.insight-grid button strong {
  font-size: 12px;
  color: #284b43;
}

.insight-grid button small {
  font-size: 10px;
  color: #758781;
}

.object-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.object-grid a {
  display: grid;
  gap: 5px;
  padding: 12px;
  color: inherit;
  border: 1px solid #deebe6;
  border-radius: 13px;
}

.object-grid b {
  font-size: 10px;
  color: #0a806e;
}

.object-grid strong {
  font-size: 13px;
  color: #183c34;
}

.object-grid span {
  font-size: 10px;
  color: #758781;
}
</style>
