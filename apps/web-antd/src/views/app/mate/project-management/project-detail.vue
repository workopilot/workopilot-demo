<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  Collapse,
  CollapsePanel,
  Input,
  message,
  Progress,
  Tabs,
  TabPane,
  Tag,
} from 'ant-design-vue';

import { managedProjects } from '#/api/mock-project-management';
import { useProjectManagementDemoStore } from '#/store/project-management-demo';

import ProjectAiReasoning from './components/project-ai-reasoning.vue';
import ProjectDemoStepper from './components/project-demo-stepper.vue';

const route = useRoute();
const router = useRouter();
const store = useProjectManagementDemoStore();
const isManager = computed(() => route.params.employeeId === 'pmo-assistant');
const project = computed(
  () =>
    managedProjects.find((item) => item.id === route.params.projectId) ||
    managedProjects[0]!,
);
const activeTab = ref(String(route.query.tab || 'overview'));
const newDiscussion = ref('');

watch(
  () => route.query.tab,
  (value) => {
    if (value) activeTab.value = String(value);
  },
);

function setTab(tab: string | number) {
  const tabKey = String(tab);
  activeTab.value = tabKey;
  void router.replace({ query: { ...route.query, tab: tabKey } });
}

function generateArtifact(name: string) {
  store.generateArtifact(name);
  message.success(`${name}草稿已生成，等待人工确认`);
}

function handleAiAction(action: string) {
  if (action.includes('会议')) {
    store.confirmEscalation();
    setTab('risk');
    message.success('升级会议议程已生成');
  } else if (action.includes('补救')) {
    generateArtifact('补救计划');
  } else {
    setTab('okr');
  }
}

function addDiscussion() {
  const content = newDiscussion.value.trim();
  if (!content) {
    message.warning('请输入讨论内容');
    return;
  }
  store.addDiscussion(content);
  newDiscussion.value = '';
  message.success('讨论已加入项目 Context');
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    accepted: '已验收',
    'at-risk': '临期',
    'in-progress': '进行中',
    missing: '缺失',
    pending: '待开始',
  };
  return labels[status] || status;
}

function statusColor(status: string) {
  if (status === 'accepted') return 'green';
  if (status === 'at-risk' || status === 'missing') return 'orange';
  return undefined;
}
</script>

<template>
  <section class="project-detail-page">
    <header class="project-detail-header">
      <Button type="text" aria-label="返回" @click="router.back()"><Icon icon="lucide:arrow-left" /></Button>
      <div class="project-detail-title">
        <div><Tag>{{ project.typeLabel }}</Tag><Tag :color="store.activeStage.health === 'healthy' ? 'green' : store.activeStage.health === 'watch' ? 'orange' : 'red'">{{ store.activeStage.healthLabel }}</Tag></div>
        <h1>{{ project.name }}</h1>
        <p>{{ project.customer }} · {{ project.stage }} · 项目经理 {{ project.manager }} · 计划验收 {{ project.dueDate }}</p>
      </div>
      <div class="project-detail-actions">
        <Button @click="router.push(`/app/mate/employee/${route.params.employeeId}/project-chat`)"><Icon icon="lucide:message-circle" /> 问 AI</Button>
        <Button v-if="isManager" type="primary" @click="setTab('risk')"><Icon icon="lucide:shield-alert" /> 管理介入</Button>
        <Button v-else type="primary" @click="setTab('evidence')"><Icon icon="lucide:file-up" /> 补充成果物</Button>
      </div>
    </header>

    <ProjectDemoStepper />

    <div class="project-detail-summary">
      <article><span>阶段进度</span><strong>{{ store.activeStage.progress }}%</strong><Progress :percent="store.activeStage.progress" :show-info="false" stroke-color="#0b806f" /></article>
      <article><span>按期概率</span><strong :class="{ 'is-risk': store.activeStage.probability < 60 }">{{ store.activeStage.probability }}%</strong><small>证据驱动预测</small></article>
      <article><span>目标结构</span><strong>3 O / 6 KR</strong><small>3 成果型 · 3 指标型</small></article>
      <article><span>关键依赖</span><strong>1 项</strong><small>客户测试环境未就绪</small></article>
    </div>

    <div class="project-detail-tabs">
      <Tabs :active-key="activeTab" @change="setTab">
        <TabPane key="overview" tab="概览">
          <div class="tab-layout">
            <main>
              <ProjectAiReasoning :role="isManager ? 'manager' : 'executor'" @action="handleAiAction" />
              <section class="objective-snapshot">
                <header><h2>目标推进概览</h2><Button type="link" @click="setTab('okr')">查看全部 O/KR</Button></header>
                <article v-for="objective in project.objectives" :key="objective.id">
                  <div class="objective-code">{{ objective.code }}</div>
                  <div><strong>{{ objective.title }}</strong><span>{{ objective.krs.length }} 个 KR · {{ objective.owner }}</span></div>
                  <Progress :percent="objective.id === 'o2' ? store.activeStage.progress : objective.progress" :show-info="false" stroke-color="#0b806f" />
                  <Tag :color="objective.health === 'healthy' ? 'green' : 'orange'">{{ objective.health === 'healthy' ? '正常' : '关注' }}</Tag>
                </article>
              </section>
            </main>
            <aside>
              <section class="timeline-card"><span>RECENT SIGNALS</span><h2>最近项目信号</h2><div><b>今天 09:26</b><p>研发负责人确认客户白名单尚未开通。</p></div><div><b>昨天 17:40</b><p>项目经理要求补充延期原因与新计划。</p></div><div><b>W32 周报</b><p>“客户 B 接口联调延期”已识别为 KR2.1 候选证据。</p></div></section>
              <section class="generated-card"><span>AI 已生成</span><div v-if="store.state.generatedArtifacts.length"><Tag v-for="item in store.state.generatedArtifacts" :key="item" color="green">{{ item }}</Tag></div><p v-else>尚未生成材料。可从 AI 建议中生成补救计划、验收清单、周报草稿或会议议程。</p></section>
            </aside>
          </div>
        </TabPane>

        <TabPane key="okr" tab="O / KR">
          <section class="okr-tab">
            <header><div><span>PROJECT OBJECTIVES</span><h2>项目目标与关键结果</h2><p>KR 分成果型和指标型，任务只是实现结果的可选步骤。</p></div><Button v-if="isManager"><Icon icon="lucide:sliders-horizontal" /> 调整 O/KR</Button></header>
            <Collapse :default-active-key="['o2']" expand-icon-position="end">
              <CollapsePanel v-for="objective in project.objectives" :key="objective.id">
                <template #header>
                  <div class="objective-collapse-head"><b>{{ objective.code }}</b><div><strong>{{ objective.title }}</strong><span>{{ objective.description }}</span></div><Progress type="circle" :percent="objective.id === 'o2' ? store.activeStage.progress : objective.progress" :size="50" stroke-color="#0b806f" /></div>
                </template>
                <div class="kr-list">
                  <article v-for="kr in objective.krs" :key="kr.id">
                    <div class="kr-kind" :class="`is-${kr.kind}`"><Icon :icon="kr.kind === 'deliverable' ? 'lucide:file-check-2' : 'lucide:gauge'" /></div>
                    <div class="kr-copy"><div><Tag>{{ kr.kind === 'deliverable' ? '成果型 KR' : '指标型 KR' }}</Tag><Tag :color="statusColor(kr.status)">{{ statusLabel(kr.status) }}</Tag></div><h3>{{ kr.title }}</h3><p v-if="kr.kind === 'deliverable'">验收标准：{{ kr.acceptance }}</p><p v-else>当前 {{ kr.actual }}{{ kr.unit }} / 目标 {{ kr.target }}{{ kr.unit }}</p><footer><span>{{ kr.owner }}</span><span>截止 {{ kr.dueDate }}</span><span>权重 {{ kr.weight }}%</span></footer></div>
                    <div class="kr-result"><strong v-if="kr.kind === 'deliverable'">{{ kr.artifact }}</strong><Progress v-else :percent="Math.min(100, Math.round(((kr.actual || 0) / Math.max(kr.target || 1, 1)) * 100))" stroke-color="#0b806f" /><small v-if="kr.weeklyEvidence"><Icon icon="lucide:notebook-tabs" /> {{ kr.weeklyEvidence }}</small><Button v-if="kr.id === 'kr-2-1'" size="small" @click="setTab('evidence')">查看成果与证据</Button></div>
                  </article>
                </div>
              </CollapsePanel>
            </Collapse>
          </section>
        </TabPane>

        <TabPane key="evidence" tab="成果与证据">
          <section class="evidence-tab">
            <div class="evidence-main">
              <header><div><Tag color="orange">KR2.1 · 临期</Tag><h2>接口联调测试报告</h2><p>成果物必须覆盖 12 个核心接口、遗留问题分级和双方负责人确认。</p></div><Button type="primary" @click="generateArtifact('成果物验收清单')">生成验收清单</Button></header>
              <div class="artifact-box"><span><Icon icon="lucide:file-clock" /></span><div><strong>当前成果物尚未形成可验收版本</strong><p>已发现“接口联调说明书 V1.0.pdf”，但它不包含实际测试结果。</p></div><Button>上传新版本</Button></div>
              <h3>AI 推荐的证据关联</h3>
              <article class="evidence-item"><Icon icon="lucide:notebook-tabs" /><div><strong>2026-W32 周报 · 客户 B 接口联调延期</strong><p>命中项目、接口联调、客户环境与新承诺日期。</p></div><Tag color="green">置信度 92%</Tag><Button v-if="!store.state.weeklyLinkConfirmed" type="primary" size="small" @click="store.confirmWeeklyLink()">确认关联</Button><Tag v-else color="green">已确认</Tag></article>
              <article class="evidence-item"><Icon icon="lucide:audio-lines" /><div><strong>客户环境沟通录音.m4a</strong><p>客户 IT 负责人说明白名单预计周三开通。</p></div><Tag>置信度 86%</Tag><Button size="small">查看摘要</Button></article>
              <article class="evidence-item"><Icon icon="lucide:list-checks" /><div><strong>接口联调记录 · 8 月 10 日</strong><p>当前 12 个接口已通过 8 个，通过率 68%。</p></div><Tag color="green">已关联 KR2.2</Tag><Button size="small">查看原文</Button></article>
            </div>
            <aside class="acceptance-checklist"><span>ACCEPTANCE CHECK</span><h2>成果物验收清单</h2><div class="check is-done"><Icon icon="lucide:check" /><span>覆盖 12 个核心接口</span></div><div class="check"><Icon icon="lucide:minus" /><span>补充失败用例与原因</span></div><div class="check"><Icon icon="lucide:minus" /><span>补充遗留问题分级</span></div><div class="check"><Icon icon="lucide:minus" /><span>补充双方负责人确认</span></div><Button block type="primary" @click="generateArtifact('成果物验收清单')">生成可编辑清单</Button></aside>
          </section>
        </TabPane>

        <TabPane key="discussion" tab="讨论">
          <section class="discussion-tab">
            <header><div><span>CONTEXTUAL DISCUSSIONS</span><h2>项目 / O / KR 上下文讨论</h2><p>讨论必须绑定管理对象，可引用证据，并由 AI 提炼决定与待办。</p></div></header>
            <div class="discussion-composer"><Input v-model:value="newDiscussion" placeholder="围绕 KR2.1 补充讨论，支持 @负责人" @press-enter="addDiscussion" /><Button type="primary" @click="addDiscussion">发布讨论</Button></div>
            <article v-for="item in store.state.discussions" :key="item.id"><div class="discussion-avatar">{{ item.author.slice(0,1) }}</div><div class="discussion-copy"><header><strong>{{ item.author }}</strong><Tag>{{ item.role }}</Tag><span>{{ item.objectLabel }}</span><small>{{ item.time }}</small></header><p>{{ item.content }}</p><div v-if="item.aiSummary" class="discussion-ai"><Icon icon="lucide:sparkles" /><span><b>AI 提炼</b> {{ item.aiSummary }}</span><Button type="link" size="small">转为风险/行动</Button></div></div></article>
          </section>
        </TabPane>

        <TabPane key="risk" tab="风险 / 干预">
          <section class="risk-tab"><ProjectAiReasoning role="manager" @action="handleAiAction" /><div class="risk-columns"><section><span>风险时间线</span><article><b>08/09</b><div><strong>临期提醒</strong><p>系统提醒张三提交联调测试报告草稿。</p></div><Tag color="green">已触达</Tag></article><article><b>08/12</b><div><strong>逾期未解释</strong><p>AI 要求补充原因、影响和补救计划，并同步李四。</p></div><Tag color="orange">已触发</Tag></article><article><b>08/14</b><div><strong>建议管理升级</strong><p>客户环境仍未就绪，建议召开联合升级会议。</p></div><Tag :color="store.state.escalationConfirmed ? 'green' : 'red'">{{ store.state.escalationConfirmed ? '已确认' : '等待确认' }}</Tag></article></section><aside><span>建议管理动作</span><h3>召开客户 B 联调升级会</h3><p>明确客户环境责任人、重新排期、UAT 影响和新的书面承诺。</p><Button block type="primary" @click="store.confirmEscalation()">生成会议议程</Button><Button block>生成风险沟通稿</Button></aside></div></section>
        </TabPane>

        <TabPane key="activity" tab="动态">
          <section class="activity-tab"><header><span>PROJECT ACTIVITY LOG</span><h2>项目动态与 AI 判断变化</h2></header><article><div class="activity-dot is-ai"><Icon icon="lucide:sparkles" /></div><div><strong>AI 更新项目按期概率为 {{ store.activeStage.probability }}%</strong><p>{{ store.activeStage.explanation }}</p><small>刚刚 · 来源：项目状态切换</small></div></article><article><div class="activity-dot"><Icon icon="lucide:notebook-tabs" /></div><div><strong>发现新的周报证据关联</strong><p>W32 周报“客户 B 接口联调延期”建议关联 KR2.1。</p><small>今天 09:18 · 来源：汇报助理</small></div></article><article><div class="activity-dot"><Icon icon="lucide:message-square-text" /></div><div><strong>李四在 KR2.1 讨论中 @张三</strong><p>要求补充延期影响和新计划，以便客户沟通。</p><small>昨天 17:40 · 来源：项目讨论</small></div></article><article><div class="activity-dot"><Icon icon="lucide:file-check-2" /></div><div><strong>需求规格说明书通过客户确认</strong><p>KR1.1 已完成验收，O1 进度更新为 100%。</p><small>07/28 · 来源：客户确认邮件</small></div></article></section>
        </TabPane>
      </Tabs>
    </div>
  </section>
</template>

<style scoped>
.project-detail-page { display: grid; grid-template-rows: auto auto auto minmax(0,1fr); gap: 10px; width: 100%; height: 100%; min-height: 0; }
.project-detail-header { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; padding: 13px 16px; background: #fff; border: 1px solid #d5e4df; border-radius: 16px; }
.project-detail-title > div,.project-detail-actions { display: flex; flex-wrap: wrap; gap: 7px; }.project-detail-title h1 { margin: 5px 0 3px; font-size: 19px; color: #15372f; }.project-detail-title p { margin: 0; font-size: 10px; color: #6b8179; }
.project-detail-summary { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 8px; }.project-detail-summary article { display: grid; gap: 4px; padding: 12px 14px; background: #fff; border: 1px solid #dce8e4; border-radius: 12px; }.project-detail-summary span,.project-detail-summary small { font-size: 9px; color: #758881; }.project-detail-summary strong { font-size: 16px; color: #1d4239; }.project-detail-summary strong.is-risk { color: #c65347; }
.project-detail-tabs { min-height: 0; overflow: hidden; background: #f8fbfa; border: 1px solid #d5e4df; border-radius: 16px; }.project-detail-tabs :deep(.ant-tabs) { height: 100%; }.project-detail-tabs :deep(.ant-tabs-nav) { padding: 0 18px; margin: 0; background: #fff; }.project-detail-tabs :deep(.ant-tabs-content-holder) { min-height: 0; padding: 14px; overflow: auto; }.project-detail-tabs :deep(.ant-tabs-content),.project-detail-tabs :deep(.ant-tabs-tabpane) { height: 100%; }
.tab-layout { display: grid; grid-template-columns: minmax(0,1.5fr) minmax(260px,.62fr); gap: 12px; }.tab-layout > main,.tab-layout > aside { display: grid; align-content: start; gap: 12px; }
.objective-snapshot,.timeline-card,.generated-card,.okr-tab,.evidence-main,.acceptance-checklist,.discussion-tab,.risk-tab,.activity-tab { padding: 17px; background: #fff; border: 1px solid #dce8e4; border-radius: 14px; }.objective-snapshot > header { display: flex; align-items: center; justify-content: space-between; }.objective-snapshot h2,.timeline-card h2,.acceptance-checklist h2,.discussion-tab h2,.okr-tab h2,.activity-tab h2 { margin: 0; font-size: 14px; color: #193d35; }.objective-snapshot > article { display: grid; grid-template-columns: 38px minmax(0,1fr) minmax(110px,.5fr) 64px; gap: 12px; align-items: center; min-height: 60px; border-top: 1px solid #e9f0ed; }.objective-code { display: grid; place-items: center; width: 32px; height: 32px; font-size: 10px; font-weight: 800; color: #0b806f; background: #e8f4f0; border-radius: 9px; }.objective-snapshot article > div:nth-child(2) { display: grid; gap: 3px; }.objective-snapshot article strong { font-size: 11px; color: #284a42; }.objective-snapshot article span { font-size: 9px; color: #758881; }
.timeline-card > span,.okr-tab header span,.acceptance-checklist > span,.discussion-tab header span,.activity-tab header span,.risk-tab section > span,.risk-tab aside > span { font-size: 9px; font-weight: 800; color: #0b806f; letter-spacing: .09em; }.timeline-card > div { padding: 11px 0; border-top: 1px solid #e9f0ed; }.timeline-card b { font-size: 9px; color: #0b806f; }.timeline-card p,.generated-card p,.okr-tab header p { margin: 3px 0 0; font-size: 10px; line-height: 1.55; color: #667c74; }.generated-card > span { font-size: 9px; font-weight: 700; color: #6b8179; }.generated-card > div { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; }
.okr-tab > header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }.objective-collapse-head { display: grid; grid-template-columns: auto minmax(0,1fr) auto; gap: 12px; align-items: center; width: 100%; padding-right: 12px; }.objective-collapse-head > b { display: grid; place-items: center; width: 36px; height: 36px; color: #fff; background: #0b6e65; border-radius: 10px; }.objective-collapse-head > div { display: grid; gap: 3px; }.objective-collapse-head strong { font-size: 12px; color: #21463d; }.objective-collapse-head span { font-size: 9px; color: #72867f; }
.kr-list { display: grid; gap: 8px; }.kr-list article { display: grid; grid-template-columns: auto minmax(0,1fr) minmax(150px,.36fr); gap: 12px; align-items: center; padding: 13px; background: #f8fbfa; border: 1px solid #e1ebe7; border-radius: 11px; }.kr-kind { display: grid; place-items: center; width: 40px; height: 40px; color: #0b806f; background: #e7f3ef; border-radius: 11px; }.kr-kind.is-metric { color: #7962b7; background: #f0ecfa; }.kr-copy > div { display: flex; flex-wrap: wrap; gap: 5px; }.kr-copy h3 { margin: 7px 0 4px; font-size: 12px; color: #264940; }.kr-copy p { margin: 0; font-size: 10px; color: #647a72; }.kr-copy footer { display: flex; gap: 12px; margin-top: 8px; font-size: 9px; color: #778a83; }.kr-result { display: grid; gap: 7px; padding-left: 12px; border-left: 1px solid #dfe9e5; }.kr-result strong { overflow: hidden; font-size: 10px; color: #3a5a52; text-overflow: ellipsis; white-space: nowrap; }.kr-result small { font-size: 8px; color: #74877f; }
.evidence-tab { display: grid; grid-template-columns: minmax(0,1.4fr) minmax(250px,.55fr); gap: 12px; }.evidence-main > header { display: flex; align-items: flex-start; justify-content: space-between; }.evidence-main h2 { margin: 6px 0 3px; font-size: 15px; color: #1b4037; }.evidence-main header p { margin: 0; font-size: 10px; color: #6e827b; }.artifact-box,.evidence-item { display: grid; gap: 11px; align-items: center; margin-top: 12px; padding: 12px; border: 1px solid #e1ebe7; border-radius: 11px; }.artifact-box { grid-template-columns: auto 1fr auto; background: #fff8ef; border-color: #ecd6b6; }.artifact-box > span { display: grid; place-items: center; width: 38px; height: 38px; color: #c4742c; background: #fff; border-radius: 10px; }.artifact-box strong,.evidence-item strong { font-size: 10px; color: #294b43; }.artifact-box p,.evidence-item p { margin: 3px 0 0; font-size: 9px; color: #758780; }.evidence-main > h3 { margin: 17px 0 0; font-size: 12px; color: #294b43; }.evidence-item { grid-template-columns: auto minmax(0,1fr) auto auto; }.evidence-item > svg { font-size: 18px; color: #0b806f; }.acceptance-checklist > h2 { margin: 5px 0 12px; }.check { display: flex; gap: 8px; align-items: center; min-height: 38px; padding: 6px 0; font-size: 10px; color: #657b73; border-top: 1px solid #e9f0ed; }.check svg { color: #9cacA6; }.check.is-done svg { color: #0b806f; }.acceptance-checklist > .ant-btn { margin-top: 14px; }
.discussion-tab > header { margin-bottom: 12px; }.discussion-tab header p { margin: 4px 0 0; font-size: 10px; color: #70837c; }.discussion-composer { display: grid; grid-template-columns: 1fr auto; gap: 8px; padding: 12px; background: #f4f8f6; border-radius: 10px; }.discussion-tab > article { display: flex; gap: 11px; padding: 14px 0; border-top: 1px solid #e8efec; }.discussion-avatar { display: grid; flex: none; place-items: center; width: 36px; height: 36px; font-size: 11px; font-weight: 700; color: #fff; background: #0b806f; border-radius: 10px; }.discussion-copy { flex: 1; min-width: 0; }.discussion-copy header { display: flex; flex-wrap: wrap; gap: 7px; align-items: center; }.discussion-copy header strong { font-size: 11px; color: #24473f; }.discussion-copy header span,.discussion-copy header small { font-size: 9px; color: #7a8c85; }.discussion-copy header small { margin-left: auto; }.discussion-copy > p { margin: 8px 0; font-size: 11px; line-height: 1.65; color: #526b62; }.discussion-ai { display: flex; gap: 8px; align-items: center; padding: 9px 10px; font-size: 9px; color: #597168; background: #eef6f3; border-radius: 8px; }.discussion-ai > span { flex: 1; }.discussion-ai svg,.discussion-ai b { color: #0b806f; }
.risk-tab { display: grid; gap: 12px; }.risk-columns { display: grid; grid-template-columns: minmax(0,1.35fr) minmax(250px,.55fr); gap: 12px; }.risk-columns > section,.risk-columns > aside { padding: 16px; background: #fff; border: 1px solid #dce8e4; border-radius: 13px; }.risk-columns section article { display: grid; grid-template-columns: 48px minmax(0,1fr) auto; gap: 10px; align-items: center; min-height: 64px; border-top: 1px solid #e9f0ed; }.risk-columns section article > b { font-size: 9px; color: #0b806f; }.risk-columns h3 { margin: 6px 0; font-size: 13px; color: #24483f; }.risk-columns p { margin: 0; font-size: 10px; line-height: 1.55; color: #667c74; }.risk-columns aside .ant-btn { margin-top: 8px; }
.activity-tab > article { display: grid; grid-template-columns: auto 1fr; gap: 12px; padding: 14px 0; border-top: 1px solid #e8efec; }.activity-tab > header { margin-bottom: 10px; }.activity-dot { display: grid; place-items: center; width: 36px; height: 36px; color: #647b72; background: #eef4f1; border-radius: 10px; }.activity-dot.is-ai { color: #0b806f; background: #e5f3ee; }.activity-tab article strong { font-size: 11px; color: #284a42; }.activity-tab article p { margin: 4px 0; font-size: 10px; color: #637970; }.activity-tab article small { font-size: 9px; color: #81918c; }
.project-detail-page :deep(.ant-btn-primary) { background: #0b6e65; border-color: #0b6e65; }
@media (max-width: 980px) { .project-detail-summary { grid-template-columns: repeat(2,1fr); }.tab-layout,.evidence-tab,.risk-columns { grid-template-columns: 1fr; }.project-detail-actions { display: none; } }
@media (max-width: 700px) { .project-detail-header { grid-template-columns: auto 1fr; }.project-detail-summary { grid-template-columns: 1fr 1fr; }.objective-snapshot > article { grid-template-columns: 34px 1fr auto; }.objective-snapshot :deep(.ant-progress) { display: none; }.kr-list article,.artifact-box,.evidence-item { grid-template-columns: 1fr; }.kr-kind { display: none; }.kr-result { padding: 10px 0 0; border-top: 1px solid #dfe9e5; border-left: 0; }.discussion-composer { grid-template-columns: 1fr; } }
</style>
