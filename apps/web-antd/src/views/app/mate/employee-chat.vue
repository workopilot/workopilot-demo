<!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
<script setup lang="ts">
/* eslint-disable unicorn/no-await-expression-member */
import type { MateChatSession, MateMessage } from '#/types/mate';

import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, message, Modal } from 'ant-design-vue';

import {
  clearMateChatSessionsApi,
  createMateChatSessionApi,
  deleteMateChatSessionApi,
  getMateChatSessionsApi,
  getMateSessionMessagesApi,
  sendMateMessageApi,
} from '#/api/mate';
import { mockMateEmployees } from '#/api/mock-data-mate';

import EmployeeChatComposer from './components/employee-chat-composer.vue';
import EmployeeChatHeader from './components/employee-chat-header.vue';
import EmployeeConsoleToolbar from './components/employee-console-toolbar.vue';
import EmployeeConversationHistory from './components/employee-conversation-history.vue';
import EmployeeMessageList from './components/employee-message-list.vue';

const route = useRoute();
const router = useRouter();
const employeeId = computed(() => String(route.params.employeeId || ''));
const employee = computed(
  () =>
    mockMateEmployees.find((item) => item.id === employeeId.value) ||
    mockMateEmployees[0]!,
);
const activeMenuKey = ref('chat');
const sessions = ref<MateChatSession[]>([]);
const activeSessionId = ref('');
const messages = ref<MateMessage[]>([]);
const historyVisible = ref(true);
const loading = ref(false);
const sending = ref(false);
const draft = ref('');
const detailMessage = ref<MateMessage>();
const detailOpen = ref(false);

const activeMenu = computed(
  () =>
    employee.value.menus.find((item) => item.key === activeMenuKey.value) ||
    employee.value.menus[0]!,
);

async function loadSessionMessages(sessionId: string) {
  activeSessionId.value = sessionId;
  loading.value = true;
  try {
    messages.value = (
      await getMateSessionMessagesApi(employee.value.id, sessionId)
    ).data;
  } finally {
    loading.value = false;
  }
}

async function loadSessions(preferredSessionId = '') {
  loading.value = true;
  try {
    sessions.value = (await getMateChatSessionsApi(employee.value.id)).data;
    const nextId =
      preferredSessionId ||
      (sessions.value.some((item) => item.id === activeSessionId.value)
        ? activeSessionId.value
        : sessions.value[0]?.id || '');
    if (nextId) {
      await loadSessionMessages(nextId);
    } else {
      activeSessionId.value = '';
      messages.value = [];
    }
  } finally {
    loading.value = false;
  }
}

async function createSession() {
  const created = (await createMateChatSessionApi(employee.value.id)).data;
  await loadSessions(created.id);
}

async function deleteSession(sessionId: string) {
  await deleteMateChatSessionApi(employee.value.id, sessionId);
  await loadSessions();
}

async function clearSessions() {
  await clearMateChatSessionsApi(employee.value.id);
  await loadSessions();
  message.success('对话历史已清空');
}

async function send() {
  const content = draft.value.trim();
  if (!content || sending.value) return;
  if (!activeSessionId.value) await createSession();
  const userMessage: MateMessage = {
    id: `user-${Date.now()}`,
    role: 'user',
    content,
    time: '刚刚',
  };
  messages.value.push(userMessage);
  const session = sessions.value.find(
    (item) => item.id === activeSessionId.value,
  );
  if (session) {
    session.messages = messages.value;
    if (session.title === '新对话') session.title = content.slice(0, 18);
    session.relativeTime = '刚刚';
  }
  draft.value = '';
  sending.value = true;
  try {
    const reply = (
      await sendMateMessageApi(
        employee.value.id,
        content,
        activeSessionId.value,
      )
    ).data;
    messages.value.push(reply);
  } catch {
    message.error('模拟回复生成失败，请稍后重试');
  } finally {
    sending.value = false;
  }
}

function selectMenu(key: string) {
  activeMenuKey.value = key;
}

function showDemoNotice(label: string) {
  message.info(`${label}为前端 Demo 展示，暂未接入真实服务。`);
}

function showCardDetail(item: MateMessage) {
  detailMessage.value = item;
  detailOpen.value = true;
}

watch(
  employeeId,
  async (id) => {
    if (!mockMateEmployees.some((item) => item.id === id)) {
      const fallback = mockMateEmployees[0];
      if (fallback) {
        message.warning('未找到对应数字员工，已切换到默认员工');
        await router.replace(`/app/mate/employee/${fallback.id}`);
      }
      return;
    }
    activeMenuKey.value = 'chat';
    activeSessionId.value = '';
    await loadSessions();
  },
  { immediate: true },
);
</script>

<template>
  <!-- eslint-disable vue/html-closing-bracket-newline, vue/multiline-html-element-content-newline -->
  <div class="employee-role-console">
    <EmployeeConsoleToolbar
      :employee="employee"
      :active-key="activeMenuKey"
      @select="selectMenu"
    />

    <section v-if="activeMenuKey === 'chat'" class="employee-workspace">
      <EmployeeConversationHistory
        v-if="historyVisible"
        :sessions="sessions"
        :active-session-id="activeSessionId"
        @clear="clearSessions"
        @create="createSession"
        @delete="deleteSession"
        @select="loadSessionMessages"
        @toggle="historyVisible = false"
      />
      <main class="employee-chat-main">
        <EmployeeChatHeader
          :employee="employee"
          :history-visible="historyVisible"
          @files="showDemoNotice('历史文件')"
          @new-session="createSession"
          @toggle-history="historyVisible = !historyVisible"
          @voice="showDemoNotice('语音通话')"
        />
        <EmployeeMessageList
          :employee="employee"
          :loading="loading"
          :messages="messages"
          :sending="sending"
          @view-card="showCardDetail"
        />
        <EmployeeChatComposer
          v-model="draft"
          :disabled="loading"
          :prompts="employee.quickPrompts"
          :sending="sending"
          @attach="showDemoNotice('附件上传')"
          @send="send"
          @voice="showDemoNotice('语音输入')"
        />
      </main>
    </section>

    <section v-else class="employee-menu-panel">
      <div class="employee-menu-panel__icon">
        <Icon :icon="activeMenu.icon" />
      </div>
      <div>
        <span>EMPLOYEE WORKSPACE</span>
        <h2>{{ activeMenu.title }}</h2>
        <p>{{ activeMenu.summary }}</p>
        <Button type="primary" @click="activeMenuKey = 'chat'">
          返回数字员工会话
        </Button>
      </div>
    </section>

    <Modal
      v-model:open="detailOpen"
      title="合作分析详情"
      :footer="null"
      width="620px"
    >
      <div v-if="detailMessage?.card" class="employee-card-detail">
        <span>{{ detailMessage.card.tag }}</span>
        <h3>{{ detailMessage.card.title }}</h3>
        <p>{{ detailMessage.card.summary }}</p>
        <ul>
          <li v-for="item in detailMessage.card.details" :key="item">
            {{ item }}
          </li>
        </ul>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.employee-role-console {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.employee-workspace {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d3e4de;
  border-radius: 30px;
  box-shadow: 0 24px 58px rgb(18 57 45 / 8%);
}

.employee-chat-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: rgb(255 255 255 / 76%);
}

.employee-menu-panel {
  display: flex;
  flex: 1;
  gap: 20px;
  align-items: center;
  justify-content: center;
  min-height: 0;
  padding: 40px;
  background: #fff;
  border: 1px solid #d3e4de;
  border-radius: 30px;
  box-shadow: 0 24px 58px rgb(18 57 45 / 8%);
}

.employee-menu-panel__icon {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  font-size: 32px;
  color: #0b6e65;
  background: #e5f2ed;
  border-radius: 22px;
}

.employee-menu-panel span,
.employee-card-detail > span {
  font-size: 10px;
  font-weight: 800;
  color: #0b8a73;
  letter-spacing: 0.12em;
}

.employee-menu-panel h2 {
  margin: 8px 0;
  font-size: 24px;
  color: #0f2925;
}

.employee-menu-panel p {
  margin: 0 0 18px;
  color: #58736c;
}

.employee-menu-panel :deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}

.employee-card-detail h3 {
  margin: 10px 0;
  font-size: 18px;
  color: #0f2925;
}

.employee-card-detail p,
.employee-card-detail li {
  font-size: 13px;
  line-height: 1.8;
  color: #58736c;
}

.employee-card-detail ul {
  padding-left: 20px;
  margin: 16px 0 0;
}

@media (max-width: 1120px) {
  .employee-workspace {
    border-radius: 22px;
  }
}
</style>
