<script setup lang="ts">
import type { EmployeeHandoff } from '#/types/employee-recommendation';

import { computed, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import { Icon } from '@iconify/vue';

import { recommendationEmployee } from '#/utils/employee-recommendations';

import EmployeeRecommendations from '../../components/employee-recommendations.vue';

const phase = ref('normal');
const result = ref<EmployeeHandoff>();
const phases = [
  {
    id: 'normal',
    label: '正常推进',
    detail: '项目进入实施阶段，需要对齐本周安排。',
    tone: 'blue',
  },
  {
    id: 'blocked',
    label: '存在阻塞',
    detail: '接口联调任务延期，需要跨团队协调。',
    tone: 'red',
  },
  {
    id: 'done',
    label: '已完成',
    detail: '项目成果已验收，可以组织复盘。',
    tone: 'green',
  },
] as const;
const scenario = computed(
  () => phases.find((item) => item.id === phase.value) ?? phases[0],
);
const context = computed(() => ({
  currentEmployeeId: 'pmo-assistant',
  source: 'guide-demo',
  businessId: 'DEMO-P001',
  title: '项目经理 · 星河交付项目详情',
  summary: `教学数据：星河交付项目；负责人：林晓。\n当前情况：${scenario.value.detail}`,
}));
const employees = computed(() => {
  let meeting = '项目周会';
  if (phase.value === 'blocked') meeting = '风险协调会';
  if (phase.value === 'done') meeting = '项目复盘会';
  return [
    recommendationEmployee('meeting-assistant', scenario.value.detail, [
      {
        id: 'meeting',
        title: `帮星河项目开一次${meeting}`,
        icon: 'lucide:calendar-plus',
        prompt: `请为星河交付项目准备${meeting}，邀请林晓和相关负责人。先根据项目情况整理议题，并询问参会人和时间，由我确认后再预约。`,
      },
    ]),
    recommendationEmployee(
      'project-assistant',
      phase.value === 'done'
        ? '核对任务验收依据，帮助项目归档。'
        : '让项目安排落实到具体负责人和任务。',
      [
        {
          id: 'query',
          title:
            phase.value === 'done'
              ? '查询星河项目的任务验收情况'
              : '查询星河项目的延期任务',
          icon: 'lucide:list-checks',
          prompt: `请查询星河交付项目的${phase.value === 'done' ? '任务验收情况' : '延期任务，按负责人列出阻塞原因和截止时间'}。没有记录时明确说明。`,
        },
        ...(phase.value === 'done'
          ? []
          : [
              {
                id: 'create',
                title: '给林晓创建接口联调跟进任务',
                icon: 'lucide:clipboard-plus',
                prompt:
                  '请先查询星河交付项目是否已有接口联调跟进任务，没有则为林晓准备任务草稿。请补齐截止时间与验收标准，等待确认后创建。',
              },
            ]),
      ],
    ),
  ];
});
watch(phase, () => {
  result.value = undefined;
});
</script>

<template>
  <div class="collaboration-guide">
    <p class="collaboration-intro">
      你正在一位数字员工的业务页面里，下一步需要另一位员工帮忙。推荐区会告诉你
      <strong>找谁、为什么找他、可以让他做什么</strong>
      ，并把当前业务信息一起带过去。
    </p>
    <div class="collaboration-playground">
      <div class="collaboration-story">
        <span class="collaboration-eyebrow">从项目经理的视角试一次</span>
        <h3>
          同一个项目，不同情况，
          <br />
          推荐不同的下一步。
        </h3>
        <div
          class="collaboration-phases"
          role="group"
          aria-label="切换项目示例状态"
        >
          <button
            v-for="item in phases"
            :key="item.id"
            type="button"
            :aria-pressed="phase === item.id"
            :class="{ active: phase === item.id }"
            @click="phase = item.id"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="collaboration-source" :class="scenario.tone">
          <div class="collaboration-rail" aria-hidden="true">
            <Icon icon="lucide:bot" />
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div>
            <small>数字员工 / 项目经理 / 项目详情</small>
            <h4>
              星河交付项目
              <span>教学示例</span>
            </h4>
            <p>负责人：林晓</p>
            <p>{{ scenario.detail }}</p>
            <div class="collaboration-hint">
              <Icon icon="lucide:move-right" aria-hidden="true" />
              右侧：关联数字员工推荐
            </div>
          </div>
        </div>
        <ol class="collaboration-steps">
          <li>
            <b>1</b>
            <div>
              <strong>看当前业务</strong>
              <p>读取项目、阶段、负责人和任务状态。</p>
            </div>
          </li>
          <li>
            <b>2</b>
            <div>
              <strong>找能接手的员工</strong>
              <p>会议助理安排沟通，任务助理推进执行。</p>
            </div>
          </li>
          <li>
            <b>3</b>
            <div>
              <strong>带着上下文继续对话</strong>
              <p>点右侧建议，核对草稿，再进入目标员工。</p>
            </div>
          </li>
        </ol>
        <p class="collaboration-footnote">
          本 Demo
          中，“项目助理”承担任务助理的职责。右侧使用与业务页面相同的推荐组件；这里仅演示草稿交接。
        </p>
      </div>
      <EmployeeRecommendations
        :context="context"
        :employees="employees"
        demo
        @handoff="result = $event"
      />
    </div>
    <div v-if="result" class="collaboration-result" role="status">
      <span>
        <Icon icon="lucide:message-square-text" aria-hidden="true" />
        目标对话示意 · {{ result.employee.name }}
      </span>
      <p>
        这些内容已准备好带入输入框。实际业务页面会进入对应员工的对话，仍需你发送并确认后续操作。
      </p>
      <pre>{{ result.draft }}</pre>
    </div>
    <div class="collaboration-rules">
      <article>
        <Icon icon="lucide:layout-panel-left" aria-hidden="true" />
        <h4>放在哪里？</h4>
        <p>
          优先放在项目、工单、报告等详情页右侧；窄屏放到内容下方。有选中记录的工作台也适合。
        </p>
      </article>
      <article>
        <Icon icon="lucide:scan-text" aria-hidden="true" />
        <h4>推荐什么？</h4>
        <p>
          结合当前对象和状态，给出具体动作。比如“给林晓创建联调任务”，并说明推荐原因。
        </p>
      </article>
      <article>
        <Icon icon="lucide:link" aria-hidden="true" />
        <h4>带上什么？</h4>
        <p>
          业务编号、项目名称、负责人、当前阶段、相关问题和用户选中的需求，让下一位员工接得上。
        </p>
      </article>
    </div>
    <nav class="collaboration-examples" aria-label="体验已接入的业务页面">
      <span>在业务页面里试试：</span>
      <RouterLink to="/app/mate/employee/pmo-assistant/portfolio">
        项目详情 →
      </RouterLink>
      <RouterLink to="/app/mate/employee/ticket-assistant/my-tickets">
        工单详情 →
      </RouterLink>
      <RouterLink to="/app/mate/employee/ticket-assistant/inspection-plans">
        巡检计划 →
      </RouterLink>
      <RouterLink to="/app/mate/employee/new-review-assistant/report-review">
        报告审阅 →
      </RouterLink>
    </nav>
    <details class="collaboration-developer">
      <summary>第一次开发？把这段话交给开发 Agent</summary>
      <blockquote>
        请在这个业务详情页接入统一的 EmployeeRecommendations
        组件。根据当前记录推荐其他关联数字员工，每位员工给出推荐原因和具体操作建议。切换记录或状态时更新建议，点击后预览草稿，携带业务编号和上下文进入目标员工对话。请验证取消、切换记录和跨员工跳转，不能点击推荐就自动执行操作。
      </blockquote>
      <p>
        组件：
        <code>src/views/app/mate/components/employee-recommendations.vue</code>
        <br />
        接入示例与验收要求：
        <code>docs/Demo开发规范.md</code>
        第 4.4 节。
      </p>
    </details>
  </div>
</template>

<style scoped>
.collaboration-intro {
  max-width: 840px;
  margin: 0 0 24px;
  font-size: 16px;
  line-height: 1.9;
  color: #50647c;
}

.collaboration-intro strong {
  color: #1d577a;
}

.collaboration-playground {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
  gap: 28px;
  padding: 28px;
  background: linear-gradient(120deg, #eaf4ff, #fff6ec 60%, #eaf7ef);
  border: 1px solid #dae5ef;
  border-radius: 22px;
}

.collaboration-story {
  min-width: 0;
}

.collaboration-eyebrow {
  font-size: 12px;
  font-weight: 700;
  color: #366f9d;
}

.collaboration-story h3 {
  margin: 12px 0 20px;
  font-size: 27px;
  font-weight: 700;
  line-height: 1.5;
  color: #1f354d;
}

.collaboration-phases {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 18px;
}

.collaboration-phases button {
  min-height: 40px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d2dfe9;
  border-radius: 8px;
}

.collaboration-phases button.active {
  color: #fff;
  background: #285c88;
  border-color: #285c88;
}

.collaboration-phases button:focus-visible,
summary:focus-visible {
  outline: 3px solid #4386cc;
  outline-offset: 3px;
}

.collaboration-source {
  display: flex;
  min-height: 200px;
  overflow: hidden;
  background: white;
  border: 1px solid #c5d8e9;
  border-radius: 12px;
}

.collaboration-rail {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  width: 40px;
  padding-top: 24px;
  color: #3b78aa;
  background: #e5edf6;
}

.collaboration-rail span {
  width: 13px;
  height: 13px;
  background: #c5d3e4;
  border-radius: 4px;
}

.collaboration-source > div:last-child {
  flex: 1;
  min-width: 0;
  padding: 20px 16px;
}

.collaboration-source small {
  font-size: 11px;
  color: #6c7b8c;
}

.collaboration-source h4 {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  align-items: center;
  margin: 14px 0;
  font-size: 17px;
  font-weight: 700;
}

.collaboration-source h4 span {
  padding: 3px 5px;
  font-size: 10px;
  font-weight: 400;
  color: #7f6040;
  background: #fff3df;
  border-radius: 4px;
}

.collaboration-source p {
  font-size: 12px;
  line-height: 1.7;
  color: #5c6d81;
}

.collaboration-hint {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 16px;
  font-size: 12px;
  color: #316d9a;
}

.collaboration-source.red {
  border-color: #e7b4ae;
}

.collaboration-source.green {
  border-color: #99c7b7;
}

.collaboration-steps {
  display: grid;
  gap: 16px;
  padding: 0;
  margin: 24px 0;
  list-style: none;
}

.collaboration-steps li {
  display: flex;
  gap: 12px;
}

.collaboration-steps li > b {
  display: grid;
  flex: none;
  place-items: center;
  width: 28px;
  height: 28px;
  color: #fff;
  background: #3c7ca8;
  border-radius: 8px;
}

.collaboration-steps li:nth-child(2) > b {
  background: #c97535;
}

.collaboration-steps li:nth-child(3) > b {
  background: #2e8b73;
}

.collaboration-steps strong {
  font-size: 14px;
}

.collaboration-steps p {
  margin: 5px 0 0;
  font-size: 12px;
  color: #5d6d80;
}

.collaboration-footnote {
  font-size: 12px;
  line-height: 1.8;
  color: #657487;
}

.collaboration-result {
  padding: 24px;
  margin-top: 20px;
  background: #edf8f2;
  border: 1px solid #b9dccc;
  border-radius: 14px;
}

.collaboration-result > span {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 700;
  color: #256b55;
}

.collaboration-result p {
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.8;
}

.collaboration-result pre {
  padding: 16px;
  margin-bottom: 0;
  font: inherit;
  font-size: 12px;
  line-height: 1.9;
  overflow-wrap: anywhere;
  white-space: pre-wrap;
  background: white;
  border-radius: 8px;
}

.collaboration-rules {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  margin-top: 24px;
}

.collaboration-rules article {
  padding: 22px;
  background: #f1f6fc;
  border-top: 3px solid #4c8bcc;
  border-radius: 10px;
}

.collaboration-rules article:nth-child(2) {
  background: #fff5ed;
  border-color: #e6a160;
}

.collaboration-rules article:nth-child(3) {
  background: #edf8f1;
  border-color: #5ea887;
}

.collaboration-rules h4 {
  margin: 10px 0;
  font-size: 16px;
  font-weight: 700;
}

.collaboration-rules p {
  margin: 0;
  font-size: 13px;
  line-height: 1.9;
  color: #52667c;
}

.collaboration-developer {
  padding: 20px;
  margin-top: 20px;
  background: #f8fafc;
  border: 1px solid #dce5ef;
  border-radius: 10px;
}

.collaboration-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  align-items: center;
  margin-top: 22px;
  font-size: 13px;
}

.collaboration-examples a {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding: 0 12px;
  color: #245f8d;
  background: #edf4fa;
  border: 1px solid #d3e2ef;
  border-radius: 8px;
}

.collaboration-examples a:focus-visible {
  outline: 3px solid #4386cc;
  outline-offset: 3px;
}

.collaboration-developer summary {
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.collaboration-developer blockquote {
  padding: 16px;
  margin: 16px 0;
  font-size: 13px;
  line-height: 1.9;
  background: white;
  border-left: 3px solid #6098c1;
}

.collaboration-developer p {
  margin: 0;
  font-size: 12px;
  line-height: 1.9;
  overflow-wrap: anywhere;
}

@media (max-width: 900px) {
  .collaboration-playground {
    grid-template-columns: minmax(0, 1fr);
    padding: 18px;
  }
}

@media (max-width: 600px) {
  .collaboration-rules {
    grid-template-columns: minmax(0, 1fr);
  }

  .collaboration-story h3 {
    font-size: 23px;
  }
}
</style>
