<script setup lang="ts">
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { message } from 'ant-design-vue';

type SuggestedEmployee = {
  avatar: string;
  employeeId: string;
  name: string;
  path: string;
  reason: string;
  role: string;
  script: string;
};

const props = defineProps<{
  /** 报告周期描述，如「8月 · 第 34 周」 */
  periodLabel: string;
  /** 联系数字员工时带入的汇报人姓名 */
  reporterName: string;
  reportId: string;
  /** 来源标识，写进入数字员工会话的 query */
  source: string;
}>();

const router = useRouter();

const avatarUrl = (name: string) =>
  `${import.meta.env.BASE_URL}images/ai-employee/${name}`;

const suggestedEmployees: SuggestedEmployee[] = [
  {
    employeeId: 'project-assistant',
    name: '项目助理',
    role: '任务拆解与执行推进',
    avatar: '产品经理.jpg',
    path: '/app/mate/employee/project-assistant/project-chat',
    reason:
      '附件技能缺少测试负责人、截止时间和验收标准，需要形成可跟踪的闭环计划。',
    script:
      '请根据这份周报，把“附件分类、附件审核技能”的测试工作拆成闭环任务，补充负责人、最晚完成时间、验收标准和风险升级条件。',
  },
  {
    employeeId: 'meeting-assistant',
    name: '会议助理',
    role: '跨部门澄清与会议跟进',
    avatar: '项目经理.jpg',
    path: '/app/mate/employee/meeting-assistant/project-chat',
    reason:
      '业务场景、量化收益和实施边界需要产品、销售、交付共同确认，适合快速形成决策纪要。',
    script:
      '请根据这份周报审阅结论，帮我准备一次产品、销售、交付三方确认会，重点确认指令功能首个业务场景、量化收益口径和记忆模块实施边界，并生成议程与待确认事项。',
  },
];

function copyEmployeeScript(employee: SuggestedEmployee) {
  void navigator.clipboard?.writeText(employee.script);
  message.success(`已复制联系${employee.name}的话术`);
}
function contactSuggestedEmployee(employee: SuggestedEmployee) {
  const context = [
    `请协助处理 ${props.reporterName} 的${props.periodLabel}汇报审阅事项。`,
    'AI 审阅结论：本周成果整体清晰，但测试验证闭环和业务价值说明仍需补充。',
    '',
    `当前需求：${employee.script}`,
  ].join('\n');
  void router.push({
    path: employee.path,
    query: {
      prefill: context,
      reportId: props.reportId,
      source: props.source,
    },
  });
}
</script>

<template>
  <div class="audit-collaboration">
    <header>
      <span>
        <Icon icon="lucide:users-round" />
        <b>建议协同数字员工</b>
      </span>
      <em>{{ suggestedEmployees.length }} 位</em>
    </header>
    <article
      v-for="employee in suggestedEmployees"
      :key="employee.employeeId"
      class="audit-employee-card"
    >
      <div class="audit-employee-head">
        <img :src="avatarUrl(employee.avatar)" :alt="employee.name" />
        <span>
          <b>{{ employee.name }}</b>
          <small>{{ employee.role }}</small>
        </span>
      </div>
      <p class="audit-employee-reason">
        <b>为什么联系</b>
        {{ employee.reason }}
      </p>
      <div class="audit-employee-script">
        <span>
          <Icon icon="lucide:message-square-quote" />
          推荐话术
        </span>
        <p>{{ employee.script }}</p>
      </div>
      <footer>
        <button
          type="button"
          :aria-label="`复制联系${employee.name}的话术`"
          @click="copyEmployeeScript(employee)"
        >
          <Icon icon="lucide:copy" />
          复制话术
        </button>
        <button
          type="button"
          class="primary"
          :aria-label="`带话术联系${employee.name}`"
          @click="contactSuggestedEmployee(employee)"
        >
          联系数字员工
          <Icon icon="lucide:arrow-up-right" />
        </button>
      </footer>
    </article>
    <p class="audit-collaboration-note">
      <Icon icon="lucide:paperclip" />
      联系时会自动带入当前汇报人、报告周期和 AI 审阅结论。
    </p>
  </div>
</template>

<style scoped>
.audit-collaboration {
  padding: 16px 18px 18px;
  background: #f7faf9;
  border: 1px solid #d8e8e3;
  border-radius: 10px;
}

.audit-collaboration > header,
.audit-collaboration > header span,
.audit-employee-head,
.audit-employee-card footer,
.audit-collaboration-note {
  display: flex;
  align-items: center;
}

.audit-collaboration > header {
  justify-content: space-between;
  margin-bottom: 10px;
}

.audit-collaboration > header span {
  gap: 7px;
  color: #174d42;
}

.audit-collaboration > header span svg {
  color: #087565;
}

.audit-collaboration > header b {
  font-size: 14px;
}

.audit-collaboration > header em {
  padding: 3px 7px;
  font-size: 11px;
  font-style: normal;
  color: #087565;
  background: #dff2ec;
  border-radius: 999px;
}

.audit-employee-card {
  padding: 12px;
  margin-top: 9px;
  background: #fff;
  border: 1px solid #d6e4df;
  border-radius: 9px;
}

.audit-employee-head {
  gap: 9px;
}

.audit-employee-head img {
  width: 34px;
  height: 34px;
  object-fit: cover;
  border: 1px solid #c9ded7;
  border-radius: 9px;
}

.audit-employee-head span {
  display: grid;
  min-width: 0;
}

.audit-employee-head b {
  font-size: 13px;
  color: #183f36;
}

.audit-employee-head small {
  margin-top: 2px;
  font-size: 11px;
  color: #70847e;
}

.audit-employee-reason {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #526d65;
}

.audit-employee-reason b {
  margin-right: 5px;
  color: #31584e;
}

.audit-employee-script {
  padding: 9px 10px;
  margin-top: 9px;
  background: #f1f7f5;
  border-radius: 7px;
}

.audit-employee-script > span {
  display: flex;
  gap: 5px;
  align-items: center;
  font-size: 11px;
  font-weight: 800;
  color: #427064;
}

.audit-employee-script p {
  margin: 5px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: #31584e;
}

.audit-employee-card footer {
  gap: 8px;
  justify-content: flex-end;
  margin-top: 10px;
}

.audit-employee-card footer button {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 700;
  color: #31584e;
  cursor: pointer;
  background: #fff;
  border: 1px solid #c5d9d2;
  border-radius: 6px;
}

.audit-employee-card footer button:hover {
  background: #edf6f3;
  border-color: #8bb7aa;
}

.audit-employee-card footer button.primary {
  color: #fff;
  background: #087565;
  border-color: #087565;
}

.audit-employee-card footer button.primary:hover {
  background: #075f53;
  border-color: #075f53;
}

.audit-collaboration-note {
  gap: 6px;
  margin: 11px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: #72857f;
}

.audit-collaboration-note svg {
  flex: none;
}

@media (max-width: 520px) {
  .audit-employee-card footer {
    align-items: stretch;
    flex-direction: column;
  }

  .audit-employee-card footer button {
    width: 100%;
  }
}
</style>
