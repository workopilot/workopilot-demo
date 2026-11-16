<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { Button, Input } from "ant-design-vue";
import { mockMateEmployees } from "#/api/mock-data-mate";
import { reportSchemes } from "#/api/mock-new-reports";
import {
  reportChatSessions as sessions,
  replyReportChat,
} from "#/api/mock-report-chat";
import EmployeeConversationHistory from "../components/employee-conversation-history.vue";

const router = useRouter();
const employee = mockMateEmployees.find(
  (item) => item.id === "new-report-assistant",
)!;
const activeId = ref(sessions[0]?.id || "");
const active = computed(() =>
  sessions.find((item) => item.id === activeId.value),
);
const draft = ref("");
const historyVisible = ref(window.innerWidth > 760);
const pending = ref<string[]>([]);
const sending = computed(() => pending.value.includes(activeId.value));
const scroller = ref<HTMLElement>();
const enabledSchemes = computed(() =>
  reportSchemes.filter((item) => item.enabled),
);
const prompts = ["查看我的个人周报", "帮我整理下周计划", "怎么设置定时生成？"];
async function scrollBottom() {
  await nextTick();
  scroller.value?.scrollTo({ top: scroller.value.scrollHeight });
}
function createSession() {
  const id = crypto.randomUUID();
  sessions.unshift({
    id,
    employeeId: employee.id,
    title: "新对话",
    relativeTime: "刚刚",
    unread: 0,
    messages: [],
  });
  selectSession(id);
}
function selectSession(id: string) {
  if (window.innerWidth <= 760) historyVisible.value = false;
  activeId.value = id;
  draft.value = "";
  const session = sessions.find((item) => item.id === id);
  if (session) session.unread = 0;
  void scrollBottom();
}
function deleteSession(id: string) {
  const index = sessions.findIndex((item) => item.id === id);
  if (index >= 0) sessions.splice(index, 1);
  if (activeId.value === id) selectSession(sessions[0]?.id || "");
}
function clearSessions() {
  sessions.splice(0);
  selectSession("");
}
function openReports(scheme?: string) {
  void router.push({
    path: "/app/mate/employee/new-report-assistant/reports",
    query: scheme ? { scheme } : {},
  });
}
async function send(text = draft.value) {
  if (!text.trim() || sending.value) return;
  if (!active.value) createSession();
  const session = active.value!;
  const content = text.trim();
  if (!session.messages.some((item) => item.role === "user"))
    session.title = content.slice(0, 18);
  session.messages.push({
    id: crypto.randomUUID(),
    role: "user",
    content,
    time: "刚刚",
  });
  draft.value = "";
  pending.value.push(session.id);
  void scrollBottom();
  try {
    const reply = await replyReportChat(content);
    if (sessions.includes(session)) {
      session.messages.push({
        id: crypto.randomUUID(),
        role: "assistant",
        content: reply.data.content,
        time: "刚刚",
      });
      if (activeId.value !== session.id) session.unread++;
    }
  } finally {
    pending.value = pending.value.filter((id) => id !== session.id);
    void scrollBottom();
  }
}
function onEnter(event: KeyboardEvent) {
  if (!event.shiftKey && !event.isComposing && event.keyCode !== 229) {
    event.preventDefault();
    void send();
  }
}
</script>

<template>
  <section class="report-chat">
    <EmployeeConversationHistory
      v-if="historyVisible"
      :active-session-id="activeId"
      :sessions="sessions"
      @create="createSession"
      @select="selectSession"
      @delete="deleteSession"
      @clear="clearSessions"
      @toggle="historyVisible = false"
    />
    <main class="chat-main">
      <header class="chat-header">
        <div>
          <Button
            v-if="!historyVisible"
            type="text"
            aria-label="展开对话历史"
            @click="historyVisible = true"
            ><Icon icon="lucide:panel-left-open"
          /></Button>
          <img :src="employee.avatar" alt="新汇报助理" />
          <h2>新汇报助理</h2>
          <span class="online">在线</span>
        </div>
        <div>
          <Button type="text" @click="openReports()">查看汇报</Button
          ><Button type="text" aria-label="新建会话" @click="createSession"
            ><Icon icon="lucide:message-square-plus"
          /></Button>
        </div>
      </header>
      <div ref="scroller" class="chat-messages" aria-live="polite">
        <section class="welcome">
          <span>统一汇报数字员工</span>
          <h1>把工作成果，整理成一份好报告</h1>
          <p>
            和我聊聊工作进展，或选择一份报告继续处理。自动归集，人工核对，确认后再提报。
          </p>
          <div class="scheme-links">
            <button
              v-for="scheme in enabledSchemes"
              :key="scheme.id"
              @click="openReports(scheme.id)"
            >
              <Icon :icon="scheme.icon" />{{ scheme.title
              }}<Icon icon="lucide:arrow-up-right" />
            </button>
          </div>
        </section>
        <div
          v-for="item in active?.messages || []"
          :key="item.id"
          class="chat-message"
          :class="item.role"
        >
          <img v-if="item.role === 'assistant'" :src="employee.avatar" alt="" />
          <div class="message-body">
            <small
              >{{ item.role === "assistant" ? "新汇报助理" : "我" }} ·
              {{ item.time }}</small
            >
            <p>{{ item.content }}</p>
          </div>
          <span v-if="item.role === 'user'" class="user-avatar">我</span>
        </div>
        <div v-if="sending" class="thinking">
          <Icon icon="lucide:ellipsis" />正在整理回复…
        </div>
      </div>
      <footer class="chat-composer">
        <div class="prompt-list">
          <button
            v-for="prompt in prompts"
            :key="prompt"
            :disabled="sending"
            @click="send(prompt)"
          >
            {{ prompt }}
          </button>
        </div>
        <div class="input-box">
          <Input.TextArea
            v-model:value="draft"
            :auto-size="{ minRows: 2, maxRows: 5 }"
            placeholder="告诉我你想汇报什么，或描述今天的工作成果…"
            aria-label="对话内容"
            @keydown.enter="onEnter"
          /><Button
            type="primary"
            shape="circle"
            aria-label="发送消息"
            :disabled="!draft.trim() || sending"
            :loading="sending"
            @click="send()"
            ><Icon icon="lucide:arrow-up"
          /></Button>
        </div>
        <small
          >Enter 发送 · Shift + Enter 换行
          <span
            >演示回复 · 对话刷新后重置，不会自动修改报告或创建任务</span
          ></small
        >
      </footer>
    </main>
  </section>
</template>

<style scoped src="../components/employee-chat.css"></style>
