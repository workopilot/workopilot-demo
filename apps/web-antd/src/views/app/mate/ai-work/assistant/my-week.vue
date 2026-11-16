<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, message, Progress, Tag } from 'ant-design-vue';

import { aiWorkRecords } from '#/api/mock-data-ai-work';
import { useAiWorkDemoStore } from '#/store/ai-work-demo';

import AiKpiGrid from '../components/ai-kpi-grid.vue';
import AiWorkPage from '../components/ai-work-page.vue';
import EvidenceChainDrawer from '../components/evidence-chain-drawer.vue';

const store = useAiWorkDemoStore();
const router = useRouter();
const evidenceOpen = ref(false);

const kpis = computed(() => [
  {
    label: '工作完整度',
    value: `${store.state.completeness}%`,
    detail: store.state.delayExplained ? '信息已基本完整' : '仍有 4 项待补充',
    tone:
      store.state.completeness >= 90
        ? ('success' as const)
        : ('warning' as const),
  },
  { label: '工作记录', value: 18, detail: '来自 5 类工作来源' },
  { label: '关联项目', value: 3, detail: '1 个项目风险上升' },
  { label: '关联客户', value: 4, detail: '华达需要持续观察' },
]);

function generate() {
  store.generateDraft();
  message.success('本周周报 Draft 已生成');
  void router.push('/app/mate/employee/weekly-assistant/my-report');
}
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <AiWorkPage
    eyebrow="WEEK 32 · MY WORK"
    title="我的本周"
    description="2026 年第 32 周 · 8 月 3 日—8 月 9 日"
  >
    <template #actions>
      <Button type="primary" @click="generate">
        <Icon icon="lucide:sparkles" />
        生成/继续完善周报
      </Button>
    </template>

    <div class="my-week">
      <AiKpiGrid :items="kpis" />

      <div class="my-week__grid">
        <div class="my-week__main">
          <article class="week-summary">
            <header>
              <Icon icon="lucide:wand-sparkles" />
              <strong>AI 本周摘要</strong>
            </header>
            <p>
              本周主要推进报价平台 V2
              与华达智能打印项目。报价接口已进入联调阶段；华达打印卷曲问题已基本解决，仍需观察；客户
              B 接口联调因测试环境未准备完成发生延期。
            </p>
            <Button size="small">
              <Icon icon="lucide:refresh-cw" />
              让 AI 重新总结
            </Button>
          </article>

          <section class="work-timeline">
            <header>
              <h2>本周工作时间线</h2>
              <Tag>18 条记录</Tag>
            </header>
            <ol>
              <li v-for="record in aiWorkRecords" :key="record.id">
                <time>
                  <strong>{{ record.date }}</strong>
                  <small>{{ record.weekday }}</small>
                </time>
                <span></span>
                <article>
                  <div>
                    <h3>{{ record.title }}</h3>
                    <Tag :color="record.status === '延期' ? 'orange' : 'green'">
                      {{ record.status }}
                    </Tag>
                  </div>
                  <p>{{ record.summary }}</p>
                  <footer>
                    <span>{{ record.type }}</span>
                    <span v-if="record.project">{{ record.project }}</span>
                    <span v-if="record.customer">{{ record.customer }}</span>
                  </footer>
                </article>
              </li>
            </ol>
          </section>
        </div>

        <aside class="my-week__side">
          <article class="ai-findings">
            <header>
              <Icon icon="lucide:scan-search" />
              <strong>本周 AI 发现</strong>
            </header>
            <button type="button" @click="store.addMissingWork()">
              <span class="is-warning">
                {{ store.state.missingWorkAdded ? 0 : 3 }}
              </span>
              <div>
                <strong>可能遗漏</strong>
                <small>工作记录尚未进入周报</small>
              </div>
              <Icon icon="lucide:chevron-right" />
            </button>
            <button type="button" @click="evidenceOpen = true">
              <span class="is-danger">
                {{ store.state.delayExplained ? 0 : 1 }}
              </span>
              <div>
                <strong>上周承诺未确认</strong>
                <small>客户 B 接口联调</small>
              </div>
              <Icon icon="lucide:chevron-right" />
            </button>
            <button type="button">
              <span>2</span>
              <div>
                <strong>信息不完整</strong>
                <small>缺少结果或明确时间</small>
              </div>
              <Icon icon="lucide:chevron-right" />
            </button>
          </article>

          <article class="report-status">
            <header>
              <Icon icon="lucide:file-check-2" />
              <strong>本周周报</strong>
            </header>
            <div>
              <span>状态</span>
              <Tag color="blue">{{ store.reportStatusLabel }}</Tag>
            </div>
            <div>
              <span>工作完整度</span>
              <strong>{{ store.state.completeness }}%</strong>
            </div>
            <Progress
              :percent="store.state.completeness"
              :show-info="false"
              stroke-color="#0b806f"
            />
            <small>最后更新：08-07 15:32</small>
            <Button
              block
              type="primary"
              @click="
                router.push('/app/mate/employee/weekly-assistant/my-report')
              "
            >
              继续完善
            </Button>
          </article>
        </aside>
      </div>
    </div>
    <EvidenceChainDrawer v-model:open="evidenceOpen" />
  </AiWorkPage>
</template>

<style scoped>
.my-week {
  display: grid;
  gap: 14px;
}

.my-week__grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(290px, 1fr);
  gap: 14px;
}

.my-week__main,
.my-week__side {
  display: grid;
  gap: 14px;
  align-content: start;
}

.week-summary,
.work-timeline,
.ai-findings,
.report-status {
  padding: 16px;
  background: #fff;
  border: 1px solid #dce8e4;
  border-radius: 17px;
}

.week-summary header,
.ai-findings header,
.report-status header,
.work-timeline > header {
  display: flex;
  gap: 8px;
  align-items: center;
  color: #124339;
}

.week-summary p {
  margin: 12px 0;
  font-size: 13px;
  line-height: 1.85;
  color: #516b63;
}

.work-timeline > header {
  justify-content: space-between;
}

.work-timeline h2 {
  margin: 0;
  font-size: 16px;
}

.work-timeline ol {
  display: grid;
  padding: 0;
  margin: 14px 0 0;
  list-style: none;
}

.work-timeline li {
  display: grid;
  grid-template-columns: 48px 12px 1fr;
  gap: 9px;
  padding-bottom: 12px;
}

.work-timeline time {
  display: grid;
  align-content: start;
}

.work-timeline time strong {
  font-size: 12px;
  color: #183e35;
}

.work-timeline time small {
  font-size: 10px;
  color: #83968f;
}

.work-timeline li > span {
  position: relative;
  width: 9px;
  height: 9px;
  margin-top: 3px;
  background: #18a688;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #bce3d8;
}

.work-timeline li:not(:last-child) > span::after {
  position: absolute;
  top: 10px;
  left: 2px;
  width: 1px;
  height: calc(100% + 62px);
  content: '';
  background: #d8e7e2;
}

.work-timeline article {
  padding: 11px 12px;
  border: 1px solid #e4ece9;
  border-radius: 12px;
}

.work-timeline article > div {
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.work-timeline h3 {
  margin: 0;
  font-size: 13px;
  color: #20483e;
}

.work-timeline article p {
  margin: 6px 0;
  font-size: 11px;
  color: #6b7f78;
}

.work-timeline footer {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.work-timeline footer span {
  padding: 2px 6px;
  font-size: 10px;
  color: #527068;
  background: #eff5f3;
  border-radius: 5px;
}

.ai-findings > button {
  display: grid;
  grid-template-columns: 34px 1fr 18px;
  gap: 9px;
  align-items: center;
  width: 100%;
  padding: 12px 0;
  color: #36544c;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-top: 1px solid #edf2f0;
}

.ai-findings > button > span {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-weight: 800;
  color: #0b806f;
  background: #e9f3f0;
  border-radius: 9px;
}

.ai-findings > button > span.is-warning {
  color: #c47a0a;
  background: #fff3d7;
}

.ai-findings > button > span.is-danger {
  color: #d44a4a;
  background: #ffe8e8;
}

.ai-findings button div {
  display: grid;
}

.ai-findings small,
.report-status small {
  font-size: 10px;
  color: #83958f;
}

.report-status {
  display: grid;
  gap: 11px;
}

.report-status > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #60756e;
}

@media (max-width: 1280px) {
  .my-week__grid {
    grid-template-columns: 1fr;
  }
}
</style>
