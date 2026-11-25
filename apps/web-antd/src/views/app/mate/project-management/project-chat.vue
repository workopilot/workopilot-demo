<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Tag } from 'ant-design-vue';

import { useProjectManagementDemoStore } from '#/store/project-management-demo';
import { managedProjects } from '#/api/mock-project-management';
import { projectRecommendations } from '#/utils/project-recommendations';

import ContractBusinessPanel from '../contract-assistant/components/contract-business-panel.vue';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  title?: string;
  actions?: { action: string; label: string }[];
}

interface ChatSession {
  id: string;
  title: string;
  preview: string;
  time: string;
  project: string;
  opening: string;
}

const route = useRoute();
const router = useRouter();
const store = useProjectManagementDemoStore();
const input = ref('');
const receivedContext = ref('');
const historyKeyword = ref('');
const employeeId = computed(() => String(route.params.employeeId));
const isManager = computed(() => employeeId.value === 'pmo-assistant');
const isMeetingAssistant = computed(
  () => employeeId.value === 'meeting-assistant',
);
const assistantName = computed(() => {
  if (isManager.value) return '交付项目 PMO';
  return isMeetingAssistant.value ? '会议助理' : '项目助理';
});

const managerSessions: ChatSession[] = [
  {
    id: 'pmo-risk',
    title: '客户 B 交付风险分析',
    preview: '接口联调成果物临期，按期概率下降',
    time: '10 分钟前',
    project: '客户 B 集成交付',
    opening:
      '我已结合项目 O/KR、W31/W32 周报和附件检查当前进度。接口联调成果物临期，但尚未发现可验收版本。',
  },
  {
    id: 'pmo-focus',
    title: '本周管理介入建议',
    preview: '按影响和紧迫度排出三项管理动作',
    time: '今天 09:20',
    project: '跨项目',
    opening:
      '本周建议优先介入客户 B 联调、华达打印观察期和报价平台 V2 测试资源。客户 B 的风险最紧迫。',
  },
  {
    id: 'pmo-huada',
    title: '华达项目试运行观察',
    preview: '打印卷曲问题缓解，仍需连续数据',
    time: '昨天',
    project: '华达智能打印',
    opening:
      '打印卷曲问题已经缓解，但还缺少连续一周的稳定性数据，当前维持“需关注”。',
  },
  {
    id: 'pmo-quote',
    title: '报价平台 V2 资源确认',
    preview: '回归测试可能受到测试资源影响',
    time: '8 月 28 日',
    project: '报价平台 V2',
    opening:
      '报价平台 V2 当前进度正常，但回归测试资源尚未最终确认，建议本周完成资源锁定。',
  },
];

const executorSessions: ChatSession[] = [
  {
    id: 'executor-next',
    title: '客户 B 联调下一步',
    preview: '先补齐联调测试报告，再确认客户环境',
    time: '10 分钟前',
    project: '客户 B 集成交付',
    opening:
      '我已结合项目目标、成果物和当前依赖检查进度。建议先补齐联调测试报告，并同步确认客户测试环境。',
  },
  {
    id: 'executor-report',
    title: '检查联调测试报告',
    preview: '报告还缺少三项验收内容',
    time: '今天 09:05',
    project: '客户 B 集成交付',
    opening: '联调测试报告还缺少接口覆盖范围、遗留问题分级和双方确认记录。',
  },
  {
    id: 'executor-weekly',
    title: '把项目进展写入周报',
    preview: '已识别 KR2.1 的周报候选证据',
    time: '昨天',
    project: '客户 B 集成交付',
    opening:
      '我找到了 3 条工作记录和 2 份附件，可以生成周报草稿并建议关联到 KR2.1。',
  },
];

const sessions = computed(() =>
  isManager.value ? managerSessions : executorSessions,
);
const filteredSessions = computed(() => {
  const query = historyKeyword.value.trim().toLowerCase();
  return query
    ? sessions.value.filter((item) =>
        `${item.title}${item.preview}${item.project}`
          .toLowerCase()
          .includes(query),
      )
    : sessions.value;
});
const activeSessionId = ref(managerSessions[0]!.id);
const activeSession = computed(() =>
  sessions.value.find((item) => item.id === activeSessionId.value),
);

function seedMessage(session: ChatSession): ChatMessage {
  return {
    id: `welcome-${session.id}`,
    role: 'assistant',
    title: session.title,
    content: session.opening,
    actions: session.id.includes('weekly')
      ? [{ label: '查看本周周报', action: 'weekly-report' }]
      : [
          { label: '查看项目 Context', action: 'project' },
          { label: '查看判断依据', action: 'evidence' },
        ],
  };
}

const messages = ref<ChatMessage[]>([seedMessage(managerSessions[0]!)]);
const quickPrompts = computed(() => {
  if (isManager.value)
    return [
      '今天我最该介入哪三件事',
      '客户 B 为什么有风险',
      '生成升级会议议程',
    ];
  if (isMeetingAssistant.value)
    return ['生成项目例会议程', '整理会议纪要', '提取会后跟进任务'];
  return ['我今天应该先做什么', '检查联调测试报告', '把进展写入周报'];
});

function resetRole() {
  const first = sessions.value[0]!;
  activeSessionId.value = first.id;
  messages.value = [seedMessage(first)];
  historyKeyword.value = '';
  input.value = '';
  receivedContext.value = '';
}

watch(employeeId, resetRole, { immediate: true });

watch(
  () => [route.query.prefill, route.params.employeeId, route.query.businessId],
  () => {
    const prefill = route.query.prefill;
    input.value = typeof prefill === 'string' ? prefill : '';
    receivedContext.value = '';
    if (input.value && route.query.source && route.query.businessId) {
      receivedContext.value =
        input.value.split('\n')[0]?.replace(/^来源：/, '') || '关联业务';
      activeSessionId.value = 'handoff';
      messages.value = [
        {
          id: `handoff-${String(route.query.businessId)}`,
          role: 'assistant',
          title: '已接收关联业务上下文',
          content: `来自${receivedContext.value}的需求已放入下方输入框。请核对后发送，当前尚未预约会议或创建任务。`,
        },
      ];
    }
  },
  { immediate: true },
);

function selectSession(session: ChatSession) {
  receivedContext.value = '';
  input.value = '';
  activeSessionId.value = session.id;
  messages.value = [seedMessage(session)];
}

function newConversation() {
  receivedContext.value = '';
  activeSessionId.value = 'new';
  let title = '新的项目对话';
  let content = '你可以询问下一步、检查成果物，或让我协助生成工作材料。';
  if (isManager.value) {
    title = '新的管理对话';
    content = '你可以询问项目风险、管理建议，或让我生成干预材料。';
  } else if (isMeetingAssistant.value) {
    title = '新的项目会议';
    content = '你可以让我基于当前项目上下文准备议程、整理纪要或提取会后任务。';
  }
  messages.value = [
    {
      id: `new-${Date.now()}`,
      role: 'assistant',
      title,
      content,
    },
  ];
  input.value = '';
}

function assistantReply(prompt: string): ChatMessage {
  if (receivedContext.value) {
    const request = prompt.split('当前需求：').at(-1)?.trim() || prompt;
    const project = managedProjects.find(
      (item) => item.id === route.query.projectId,
    );
    let title = '协作需求已接收';
    let content = `当前范围：${receivedContext.value}\n需求：${request}\n请确认需要处理的具体记录和完成标准，我会先准备草稿。当前尚未修改业务状态。`;
    if (isMeetingAssistant.value) {
      title = '会议安排草稿 · 待补充时间与参会人';
      content = `当前范围：${receivedContext.value}\n会议需求：${request}\n建议议程：核对当前进展、讨论待协调事项、明确下一步负责人和反馈时间。\n请补充会议时间、时长和参会人；当前仅准备草稿，尚未预约或发送邀请。`;
    } else if (project && /查询.*延期/.test(request)) {
      const overdue = projectRecommendations(
        project,
        employeeId.value,
      ).overdueTasks;
      title = `${project.name} · 延期任务查询`;
      content =
        overdue.length > 0
          ? `按当前项目记录，以下 ${overdue.length} 项未验收任务已过截止日期：\n${overdue.map((task) => `• ${task.title}｜负责人：${task.owner}｜截止：${task.dueDate}｜编号：${task.id}`).join('\n')}\n以上仅查询当前项目，未修改任务状态；阻塞原因需向负责人进一步核实。`
          : `当前项目“${project.name}”没有查到已过截止日期且未验收的任务，未修改任何记录。`;
    } else if (/任务/.test(request)) {
      title = '任务跟进草稿 · 待核对';
      content = `当前范围：${receivedContext.value}\n任务需求：${request}\n请先核对已有任务是否覆盖，再确认负责人、截止时间和验收标准。当前仅准备需求草稿，尚未创建、修改或分派任务。`;
    }
    return { id: `assistant-${Date.now()}`, role: 'assistant', title, content };
  }
  if (isMeetingAssistant.value && prompt.includes('纪要'))
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      title: '会议纪要整理框架已准备',
      content:
        '我会按会议结论、待确认事项、责任人、截止时间和项目风险五部分整理。你可以继续粘贴会议原文或上传录音转写。',
      actions: [{ label: '查看项目 Context', action: 'project' }],
    };
  if (isMeetingAssistant.value && prompt.includes('任务'))
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      title: '会后跟进任务已提取',
      content:
        '已按当前项目阶段生成责任人、截止时间和关联目标字段。确认后可同步为项目跟进任务。',
      actions: [{ label: '查看项目 Context', action: 'project' }],
    };
  if (prompt.includes('三件事'))
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      title: '今日建议介入 3 件事',
      content:
        '1. 客户 B 联调成果物临期；2. 华达打印项目仍在观察期；3. 报价平台 V2 回归测试需要确认资源。客户 B 的按期概率最低，建议优先处理。',
      actions: [
        { label: '打开管理驾驶舱', action: 'cockpit' },
        { label: '查看风险升级', action: 'risks' },
      ],
    };
  if (prompt.includes('为什么') || prompt.includes('风险')) {
    store.setStage(3);
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      title: '风险来自成果缺失，而不是手填进度',
      content:
        '接口联调报告已逾期 2 天；连续两周周报都有完成承诺；客户环境问题没有形成正式说明。基于三项证据，按期概率降至 39%。',
      actions: [
        { label: '查看完整证据链', action: 'project' },
        { label: '要求补充说明', action: 'recovery' },
      ],
    };
  }
  if (prompt.includes('议程')) {
    store.confirmEscalation();
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      title: '升级会议议程草稿已生成',
      content:
        '已整理会议目标、双方责任人、环境就绪决策、重新排期与客户确认项。草稿尚未发送，等待你确认参会人和时间。',
      actions: [{ label: '查看升级流程', action: 'risks' }],
    };
  }
  if (prompt.includes('检查')) {
    store.setStage(2);
    store.generateArtifact('成果物验收清单');
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      title: '联调测试报告缺少 3 项验收内容',
      content:
        '当前附件没有接口覆盖范围、遗留问题分级和双方确认记录。我已按项目制度生成验收清单，可直接用于补齐报告。',
      actions: [
        { label: '打开成果物', action: 'deliverables' },
        { label: '查看项目 O/KR', action: 'project' },
      ],
    };
  }
  if (prompt.includes('周报')) {
    store.confirmWeeklyLink();
    store.generateArtifact('周报草稿');
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      title: '周报草稿已生成并关联 KR2.1',
      content:
        '我引用了联调记录、客户环境沟通和最新补救计划。关联仍可在提交前修改。',
      actions: [
        { label: '查看本周周报', action: 'weekly-report' },
        { label: '查看成果物', action: 'deliverables' },
      ],
    };
  }
  return {
    id: `assistant-${Date.now()}`,
    role: 'assistant',
    title: '建议先处理联调成果物',
    content:
      '你当前最有价值的动作是补齐联调测试报告。它将在 3 天后到期，并直接影响 O2 是否可以进入 UAT。',
    actions: [
      { label: '开始处理成果物', action: 'deliverables' },
      { label: '查看今天安排', action: 'today' },
    ],
  };
}

function send(text = input.value) {
  const value = text.trim();
  if (!value) return;
  messages.value.push(
    { id: `user-${Date.now()}`, role: 'user', content: value },
    assistantReply(value),
  );
  input.value = '';
}

function act(action: string) {
  const employeeId = String(route.params.employeeId);
  const paths: Record<string, string> = {
    cockpit: `/app/mate/employee/${employeeId}/cockpit`,
    deliverables: `/app/mate/employee/${employeeId}/deliverables`,
    project: `/app/mate/employee/${employeeId}/project/customer-b-delivery`,
    risks: `/app/mate/employee/${employeeId}/risks`,
    today: `/app/mate/employee/${employeeId}/today`,
    'weekly-report': '/app/mate/employee/report-copilot/current-report',
  };
  if (action === 'evidence')
    return void router.push(`${paths.project}?tab=evidence`);
  if (action === 'recovery') {
    store.generateArtifact('补救计划');
    message.success('补救计划草稿已生成，等待负责人确认');
    return;
  }
  if (paths[action]) void router.push(paths[action]);
}
</script>

<template>
  <section class="project-chat-page">
    <div class="project-chat-layout">
      <aside class="chat-history">
        <header>
          <div>
            <span>CONVERSATIONS</span>
            <h2>对话历史</h2>
          </div>
          <Button
            type="primary"
            shape="circle"
            aria-label="新建对话"
            @click="newConversation"
          >
            <Icon icon="lucide:plus" />
          </Button>
        </header>
        <Input
          v-model:value="historyKeyword"
          allow-clear
          placeholder="搜索对话"
          aria-label="搜索对话历史"
        >
          <template #prefix><Icon icon="lucide:search" /></template>
        </Input>
        <div class="history-label">最近</div>
        <div v-if="filteredSessions.length > 0" class="history-list">
          <button
            v-for="session in filteredSessions"
            :key="session.id"
            type="button"
            :class="{ 'is-active': activeSessionId === session.id }"
            :aria-pressed="activeSessionId === session.id"
            @click="selectSession(session)"
          >
            <span class="history-icon">
              <Icon icon="lucide:message-square-text" />
            </span>
            <span>
              <strong>{{ session.title }}</strong>
              <small>{{ session.preview }}</small>
              <em>{{ session.project }} · {{ session.time }}</em>
            </span>
          </button>
        </div>
        <div v-else class="history-empty">没有找到相关对话</div>
      </aside>

      <main class="chat-main">
        <header class="chat-header">
          <div class="assistant-identity">
            <span>
              <Icon icon="lucide:bot" />
              <i></i>
            </span>
            <div>
              <strong>{{ assistantName }}</strong>
              <small>
                {{ receivedContext || activeSession?.project || '新对话' }} · AI
                已就绪
              </small>
            </div>
          </div>
          <div>
            <Tag color="green">O/KR 已连接</Tag>
            <Button type="text" aria-label="新建会话" @click="newConversation">
              <Icon icon="lucide:message-square-plus" />
            </Button>
          </div>
        </header>
        <div v-if="receivedContext" class="chat-context">
          <Tag color="blue">{{ receivedContext }}</Tag>
          <Tag>
            {{ input.trim() ? '已带入草稿 · 发送前请核对' : '关联业务对话' }}
          </Tag>
        </div>
        <div v-else class="chat-context">
          <Tag color="green">客户 B 集成交付</Tag>
          <Tag>O2 · 接口联调</Tag>
          <Tag
            :color="store.activeStage.health === 'healthy' ? 'green' : 'orange'"
          >
            {{ store.activeStage.healthLabel }}
          </Tag>
        </div>
        <div class="chat-messages" aria-live="polite">
          <ContractBusinessPanel
            v-if="isManager && typeof route.query.contractId === 'string'"
            :contract-id="String(route.query.contractId)"
            type="project"
          />
          <article
            v-for="item in messages"
            :key="item.id"
            :class="`is-${item.role}`"
          >
            <div v-if="item.role === 'assistant'" class="message-avatar">
              <Icon icon="lucide:bot" />
            </div>
            <div class="message-bubble">
              <small>
                {{ item.role === 'assistant' ? assistantName : '你' }}
              </small>
              <h2 v-if="item.title">{{ item.title }}</h2>
              <p>{{ item.content }}</p>
              <footer v-if="item.actions">
                <Button
                  v-for="(button, index) in item.actions"
                  :key="button.action"
                  :type="index === 0 ? 'primary' : 'default'"
                  size="small"
                  @click="act(button.action)"
                >
                  {{ button.label }}
                </Button>
              </footer>
            </div>
          </article>
        </div>
        <div class="quick-prompts">
          <button
            v-for="prompt in quickPrompts"
            :key="prompt"
            type="button"
            @click="send(prompt)"
          >
            <Icon icon="lucide:sparkles" />
            {{ prompt }}
          </button>
        </div>
        <div class="chat-composer">
          <Button type="text" aria-label="添加附件">
            <Icon icon="lucide:paperclip" />
          </Button>
          <Input.TextArea
            v-model:value="input"
            :auto-size="{ minRows: 2, maxRows: 8 }"
            aria-label="对话输入"
            :placeholder="
              isManager
                ? '询问项目风险、管理建议或生成干预材料'
                : isMeetingAssistant
                  ? '生成议程、整理纪要或提取会后任务'
                  : '询问下一步、检查成果物或生成工作材料'
            "
            @keydown.ctrl.enter.prevent="send()"
          />
          <Button
            type="primary"
            shape="circle"
            :disabled="!input.trim()"
            aria-label="发送消息"
            @click="send()"
          >
            <Icon icon="lucide:arrow-up" />
          </Button>
        </div>
      </main>
    </div>
  </section>
</template>

<style scoped>
.project-chat-page {
  display: grid;
  grid-template-rows: minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-height: 0;
}

.project-chat-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d5e4df;
  border-radius: 16px;
  box-shadow: 0 18px 44px rgb(18 57 45/6%);
}

.chat-history {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 14px 12px;
  background: linear-gradient(180deg, #eef6f2, #f8fbf9);
  border-right: 1px solid #e1ebe8;
}

.chat-history header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 48px;
  padding: 0 5px 10px;
}

.chat-history header span {
  font-size: 9px;
  font-weight: 800;
  color: #0b806f;
  letter-spacing: 0.12em;
}

.chat-history h2 {
  margin: 2px 0 0;
  font-size: 16px;
  color: #102e29;
}

.chat-history :deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}

.history-label {
  padding: 14px 8px 7px;
  font-size: 10px;
  font-weight: 700;
  color: #768b83;
}

.history-list {
  display: grid;
  gap: 5px;
  overflow-y: auto;
}

.history-list button {
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  gap: 9px;
  min-height: 76px;
  padding: 10px;
  color: #557067;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  transition: 180ms ease;
}

.history-list button:hover {
  background: rgb(255 255 255/65%);
}

.history-list button:focus-visible {
  outline: 3px solid rgb(11 128 111/22%);
  outline-offset: 1px;
}

.history-list button.is-active {
  color: #102e29;
  background: #fff;
  border-color: #d7e6e1;
  box-shadow: 0 4px 14px rgb(18 57 45/7%);
}

.history-icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  color: #0b806f;
  background: #dff0ea;
  border-radius: 9px;
}

.history-list button > span:last-child {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.history-list strong,
.history-list small,
.history-list em {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-list strong {
  font-size: 11px;
}

.history-list small {
  font-size: 9px;
  color: #6f837c;
}

.history-list em {
  font-size: 9px;
  font-style: normal;
  color: #91a19c;
}

.history-empty {
  padding: 32px 12px;
  font-size: 11px;
  color: #82958e;
  text-align: center;
}

.chat-main {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto auto;
  min-width: 0;
  min-height: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 62px;
  padding: 0 18px;
  border-bottom: 1px solid #e4eee9;
}

.chat-header > div,
.assistant-identity {
  display: flex;
  gap: 9px;
  align-items: center;
}

.assistant-identity > span {
  position: relative;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  font-size: 17px;
  color: #0b806f;
  background: #e4f1ed;
  border-radius: 10px;
}

.assistant-identity > span i {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 9px;
  height: 9px;
  background: #16a36d;
  border: 2px solid #fff;
  border-radius: 50%;
}

.assistant-identity > div {
  display: grid;
  gap: 2px;
}

.assistant-identity strong {
  font-size: 13px;
  color: #173b33;
}

.assistant-identity small {
  font-size: 9px;
  color: #71857e;
}

.chat-context {
  display: flex;
  gap: 6px;
  padding: 9px 20px;
  background: #f8fbfa;
  border-bottom: 1px solid #e7efec;
}

.chat-messages {
  padding: 22px;
  overflow-y: auto;
  background: #fbfdfc;
}

.chat-messages article {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  margin-bottom: 16px;
}

.chat-messages article.is-user {
  justify-content: flex-end;
}

.message-avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 36px;
  height: 36px;
  color: #0b806f;
  background: #e4f1ed;
  border-radius: 10px;
}

.message-bubble {
  max-width: min(670px, 86%);
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #dae7e2;
  border-radius: 4px 16px 16px;
  box-shadow: 0 6px 18px rgb(18 57 45/5%);
}

.is-user .message-bubble {
  color: #fff;
  background: #0f5a4f;
  border-color: #0f5a4f;
  border-radius: 16px 4px 16px 16px;
}

.message-bubble small {
  font-size: 9px;
  font-weight: 700;
  color: #0b806f;
}

.is-user .message-bubble small,
.is-user .message-bubble p {
  color: #dceee9;
}

.message-bubble h2 {
  margin: 5px 0 7px;
  font-size: 14px;
  color: #173b33;
}

.message-bubble p {
  margin: 0;
  font-size: 12px;
  line-height: 1.75;
  color: #597168;
  white-space: pre-line;
}

.message-bubble footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 11px;
  margin-top: 12px;
  border-top: 1px solid #e8efec;
}

.quick-prompts {
  display: flex;
  gap: 7px;
  padding: 8px 16px;
  overflow-x: auto;
  background: #f7faf9;
  border-top: 1px solid #e5eeea;
}

.quick-prompts button {
  display: inline-flex;
  flex: none;
  gap: 5px;
  align-items: center;
  min-height: 32px;
  padding: 5px 10px;
  font-size: 10px;
  color: #0b6e65;
  cursor: pointer;
  background: #fff;
  border: 1px solid #d2e3dd;
  border-radius: 999px;
}

.quick-prompts button:hover {
  border-color: #77b7a7;
}

.chat-composer {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 7px;
  align-items: center;
  padding: 11px 14px 14px;
  background: #fff;
  border-top: 1px solid #e1ebe7;
}

.chat-composer :deep(.ant-input) {
  min-height: 42px;
  border-color: #d8e6e1;
}

.chat-main :deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}

@media (max-width: 900px) {
  .project-chat-layout {
    grid-template-columns: 220px minmax(0, 1fr);
  }
}

@media (max-width: 680px) {
  .project-chat-layout {
    grid-template-columns: 1fr;
    overflow: auto;
  }

  .chat-history {
    max-height: 250px;
    border-right: 0;
    border-bottom: 1px solid #e1ebe8;
  }

  .chat-main {
    min-height: 560px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .history-list button {
    transition: none;
  }
}
</style>
