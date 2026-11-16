<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Icon } from "@iconify/vue";
import type { MateChatSession } from "#/types/mate";
import {
  salesChatSessions as sessions,
  addSales,
  generateSalesAdvice,
  salesDb,
  salesToday,
  uid,
} from "#/api/mock-new-sales";
import { Button, Input, Select } from "ant-design-vue";
import { mockMateEmployees } from "#/api/mock-data-mate";
import EmployeeConversationHistory from "../components/employee-conversation-history.vue";
import { canManageCustomer } from "./access";
const allowedCustomers = computed(() =>
  salesDb.customers.filter(canManageCustomer),
);
const route = useRoute();
const employee = mockMateEmployees.find(
  (item) => item.id === "new-sales-assistant",
)!;
const prompts = [
  "挖掘客户画像",
  "整理下一步跟进",
  "分析客户需求",
  "生成客户方案",
];

const activeId = ref(sessions[0]?.id || "");
const active = computed(() => sessions.find((s) => s.id === activeId.value));
const draft = ref(String(route.query.prompt || ""));
const context = ref(String(route.query.context || "c1"));
const historyVisible = ref(window.innerWidth > 760);
const sending = ref(false);
const scroller = ref<HTMLElement>();
const latestResult = ref("");
const resultCustomer = ref("");
watch([context, activeId], () => {
  latestResult.value = "";
});
const applied = ref(false);
function create() {
  const s: MateChatSession = {
    id: uid(),
    employeeId: "new-sales-assistant",
    title: "新对话",
    relativeTime: "刚刚",
    unread: 0,
    messages: [],
  };
  sessions.unshift(s);
  activeId.value = s.id;
  latestResult.value = "";
}
async function send(text = draft.value) {
  if (!text.trim() || sending.value) return;
  if (!active.value) create();
  const session = active.value!;
  const customer = allowedCustomers.value.find((c) => c.id === context.value);

  session.title = session.messages.length ? session.title : text.slice(0, 20);
  session.messages.push({
    id: uid(),
    role: "user",
    content: text,
    time: "刚刚",
  });
  draft.value = "";
  sending.value = true;
  applied.value = false;
  try {
    const result = customer
      ? await generateSalesAdvice("customers", customer, text)
      : {
          data: {
            text:
              context.value === "new"
                ? `已收到建档资料：\n${text}\n\n建议先核对企业全称、行业、区域和联系人，再补充客户需求、来源与归属销售。请提供缺失信息，确认后可回到客户中心创建档案。`
                : `已收到你的销售协作需求：\n${text}\n\n请补充目标客户与期望结果，我会协助梳理资料和下一步行动。`,
            source: "当前页面传入的信息",
          },
        };
    session.messages.push({
      id: uid(),
      role: "assistant",
      content: result.data.text,
      time: "刚刚",
      closing: `依据：${result.data.source} · 本地演示生成`,
    });
    if (activeId.value === session.id) {
      latestResult.value = result.data.text;
      resultCustomer.value = customer?.id || "";
    }
  } catch {
    session.messages.push({
      id: uid(),
      role: "assistant",
      content: "本次生成失败，请重试。",
      time: "刚刚",
    });
  } finally {
    sending.value = false;
    await nextTick();
    scroller.value?.scrollTo({
      top: scroller.value.scrollHeight,
      behavior: "smooth",
    });
  }
}
function saveTask() {
  addSales("tasks", {
    name: `跟进 ${salesDb.customers.find((c) => c.id === resultCustomer.value)?.name}`,
    customerId: resultCustomer.value,
    status: "待完成",
    owner: "王安康",
    date: salesToday,
    note: latestResult.value,
    category: "电话",
  });
  applied.value = true;
}
function onEnter(event: KeyboardEvent) {
  if (!event.shiftKey && !event.isComposing && event.keyCode !== 229) {
    event.preventDefault();
    void send();
  }
}
function selectSession(id: string) {
  activeId.value = id;
  latestResult.value = "";
  if (window.innerWidth <= 760) historyVisible.value = false;
}
function deleteSession(id: string) {
  const index = sessions.findIndex((s) => s.id === id);
  if (index >= 0) sessions.splice(index, 1);
  if (!active.value) activeId.value = sessions[0]?.id || "";
}
watch(
  () => route.query,
  (query) => {
    if (query.fresh === "1") {
      create();
      context.value = String(query.context || "general");
      draft.value = String(query.prompt || "");
    }
  },
  { immediate: true },
);
</script>
<template>
  <section class="report-chat">
    <EmployeeConversationHistory
      v-if="historyVisible"
      :sessions="sessions"
      :active-session-id="activeId"
      @create="create"
      @select="selectSession"
      @delete="deleteSession"
      @clear="
        sessions.splice(0);
        activeId = '';
      "
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
          <img :src="employee.avatar" alt="新销售助理" />
          <h2>新销售助理</h2>
          <span class="online">在线</span>
        </div>
        <div>
          <Button type="text" aria-label="新建会话" @click="create"
            ><Icon icon="lucide:message-square-plus"
          /></Button>
        </div>
      </header>
      <div ref="scroller" class="chat-messages" aria-live="polite">
        <section class="welcome">
          <span>销售数字员工</span>
          <h1>懂客户，让每一次沟通更有方向</h1>
          <p>和我聊聊客户需求，一起梳理下一步跟进。</p>
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
              >{{ item.role === "assistant" ? "新销售助理" : "我" }} ·
              {{ item.time }}</small
            >
            <p>{{ item.content }}</p>
            <small v-if="item.closing">{{ item.closing }}</small>
          </div>
          <span v-if="item.role === 'user'" class="user-avatar">我</span>
        </div>
        <div v-if="sending" class="thinking">
          <Icon icon="lucide:ellipsis" />正在整理回复…
        </div>
        <Button
          v-if="latestResult && resultCustomer"
          :disabled="applied"
          @click="saveTask"
          >{{ applied ? "已创建任务" : "创建跟进任务" }}</Button
        >
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
        <div class="customer-context">
          <label for="sales-chat-customer">关联客户</label
          ><Select
            id="sales-chat-customer"
            v-model:value="context"
            :disabled="sending"
            :options="[
              { value: 'new', label: '新客户 · 待建档' },
              { value: 'general', label: '当前销售视图' },
              ...allowedCustomers.map((c) => ({ value: c.id, label: c.name })),
            ]"
          />
        </div>
        <div class="input-box">
          <Input.TextArea
            v-model:value="draft"
            :auto-size="{ minRows: 2, maxRows: 5 }"
            placeholder="告诉我客户的情况，或描述你想推进的事情…"
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
          >Enter 发送 · Shift + Enter 换行<span
            >演示回复 · 对话刷新后重置</span
          ></small
        >
      </footer>
    </main>
  </section>
</template>
<style scoped src="../components/employee-chat.css"></style>
<style scoped>
.customer-context {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 12px;
  color: #58736c;
}
.customer-context :deep(.ant-select) {
  width: 220px;
  max-width: 75%;
}
</style>
