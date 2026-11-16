<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import { Button, Input, message, Upload } from 'ant-design-vue';

import {
  addWorkRecordFromConversation,
  createReportInstance,
  submitReportInstance,
} from './demo-state';
import { pendingTodoCount } from './todo-state';

const route = useRoute();
const router = useRouter();
const draft = ref('');
const messages = ref<Array<{ role: 'assistant' | 'user'; text: string }>>([]);
const thinking = ref(false);
const draftSaved = ref(false);
const reportSubmitted = ref(false);
const generatedReport = ref<null | { period: 'daily' | 'weekly'; title: string }>(
  null,
);
const generatedReportId = ref('');
const scroller = ref<HTMLElement>();

/** 已接入的数据源同步状态（汇报助理顶部面板） */
const dataSources = [
  { name: 'Git 代码', detail: '已同步 · 3 次提交', state: 'ok' },
  { name: '工单系统', detail: '已同步 · 5 条', state: 'ok' },
  { name: '任务系统', detail: '已同步 · 2 项', state: 'ok' },
  { name: 'AP 生产库', detail: '待接入标准接口', state: 'warn' },
];
const employeeId = computed(() => String(route.params.employeeId));
const config = computed(() => {
  if (employeeId.value === 'review-copilot')
    return {
      name: '审阅助理',
      eyebrow: '主管决策简报',
      intro:
        '本周已收到 10 份汇报。我建议优先看 3 份：2 个连续延期，1 个跨部门承诺脱节。',
      actions: ['开始审阅', '谁需要我介入', '查看未回应问题'],
      route: 'review',
    };
  if (employeeId.value === 'insight-copilot')
    return {
      name: '经营洞察员',
      eyebrow: '管理问题雷达',
      intro:
        '我已横向理解 25 份汇报、186 条工作记录和 4 项制度规则，本周发现 3 项需要管理者介入。',
      actions: ['本周有哪些风险', '检查跨部门承诺', '查看连续延期'],
      route: 'insights',
    };
  return {
    name: '汇报助理',
    eyebrow: '资料到汇报',
    intro:
      '你好，王天豪。我已从 Git、工单、任务等系统自动汇总今日 14 条工作记录，日报草稿已预生成，点按钮即可秒出。',
    actions: ['生成日报', '生成周报', '检查上周承诺'],
    route: 'reports',
  };
});

function scrollToEnd() {
  void nextTick(() =>
    scroller.value?.scrollTo({
      top: scroller.value.scrollHeight,
      behavior: 'smooth',
    }),
  );
}

async function send(text = draft.value) {
  if (!text.trim()) return;
  const submittedText = text.trim();
  messages.value.push({ role: 'user', text: submittedText });
  draft.value = '';
  await nextTick();
  scrollToEnd();

  // 汇报助理：生成日报 / 周报，读取已预生成草稿，秒出
  if (
    employeeId.value === 'report-copilot' &&
    /^生成(日报|周报)$/.test(submittedText)
  ) {
    const period = submittedText.endsWith('日报') ? 'daily' : 'weekly';
    draftSaved.value = false;
    reportSubmitted.value = false;
    const report = createReportInstance({
      reportType: 'personal',
      target: '我的',
      period,
      startDate: '2026-08-14',
      endDate: period === 'daily' ? '2026-08-14' : '2026-08-20',
    });
    generatedReportId.value = report.id;
    generatedReport.value = {
      period,
      title: report.title,
    };
    messages.value.push({
      role: 'assistant',
      text: `${period === 'daily' ? '日报' : '周报'}草稿已就绪（系统每日 18:00 已预生成，点按钮秒出）。我已自动汇总 Git、工单、任务等系统的工作事项，你补充确认后即可保存或提交。`,
    });
    scrollToEnd();
    return;
  }

  const shouldExtractRecord =
    employeeId.value === 'report-copilot' &&
    /完成|做完|开发完|处理完|联调完/.test(submittedText);
  const extractedRecord = shouldExtractRecord
    ? addWorkRecordFromConversation(submittedText)
    : undefined;
  thinking.value = true;
  scrollToEnd();
  setTimeout(() => {
    thinking.value = false;
    const reply = resolveReply(extractedRecord);
    messages.value.push({ role: 'assistant', text: reply });
    scrollToEnd();
  }, 650);
}

function saveDraft() {
  draftSaved.value = true;
  message.success('已保存草稿');
}

function submitReport() {
  if (generatedReportId.value) submitReportInstance(generatedReportId.value);
  reportSubmitted.value = true;
  message.success('已提交，等待审阅');
}

function resolveReply(
  extractedRecord?: ReturnType<typeof addWorkRecordFromConversation>,
): string {
  if (employeeId.value === 'report-copilot') {
    return extractedRecord
      ? `已自动拆分为工作记录："${extractedRecord.title}"，并保留了你的原始描述。你可以到"工作记录"补充附件或关联实体。`
      : '已收到。客户环境将在 8 月 14 日开放，我已将延期原因和新时间补入"问题与阻塞"，完整度由 72 分提升到 92 分。你可以查看生成后的 HTML 汇报。';
  }
  if (employeeId.value === 'review-copilot') {
    return '建议先看王天豪的 W32 汇报：客户 B 接口联调连续两周未完成，同时出现销售承诺与研发排期不一致。相关原始录音和会议视频已关联。';
  }
  return '发现一项跨部门承诺脱节：销售承诺提供批量导入功能，但研发与交付本周均没有对应安排。该事项已持续 9 天，建议召集三方确认范围与负责人。';
}

function openResult() {
  void router.push(
    `/app/mate/employee/${employeeId.value}/${config.value.route}`,
  );
}
</script>

<template>
  <div class="next-chat">
    <main ref="scroller" class="chat-stream">
      <div class="chat-intro">
        <span>{{ config.eyebrow }}</span>
        <h1>{{ config.name }}</h1>
        <p>{{ config.intro }}</p>
        <div>
          <button
            v-for="item in config.actions"
            :key="item"
            type="button"
            @click="send(item)"
          >
            {{ item }}
            <Icon icon="lucide:arrow-up-right" />
          </button>
        </div>
      </div>
      <button
        v-if="employeeId === 'report-copilot' && pendingTodoCount"
        class="mention-chat-alert"
        type="button"
        @click="router.push('/app/mate/employee/report-copilot/mentions')"
      >
        <span>
          <Icon icon="lucide:list-todo" />
          <span>
            <strong>{{ pendingTodoCount }} 项待办需要你处理</strong>
            <small>项目、成果物、审批与周报协作已统一汇总</small>
          </span>
        </span>
        <span>
          查看我的待办
          <Icon icon="lucide:arrow-right" />
        </span>
      </button>
      <div v-if="employeeId === 'report-copilot'" class="source-panel">
        <div class="source-head">
          <Icon icon="lucide:database-zap" />
          <span>
            <strong>今日已自动汇总 14 条工作事项</strong>
            <small>
              草稿已预生成 · 每日 18:00 自动更新，无需你手工组织语言
            </small>
          </span>
        </div>
        <ul class="source-list">
          <li v-for="src in dataSources" :key="src.name">
            <i :class="src.state" />
            {{ src.name }}
            <em>{{ src.detail }}</em>
          </li>
        </ul>
      </div>
      <section class="conversation">
        <article
          v-for="(item, index) in messages"
          :key="index"
          :class="item.role"
        >
          <span v-if="item.role === 'assistant'" class="bot-avatar">
            <Icon icon="lucide:sparkles" />
          </span>
          <p>{{ item.text }}</p>
        </article>
        <article v-if="thinking" class="assistant">
          <span class="bot-avatar"><Icon icon="lucide:sparkles" /></span>
          <p class="thinking">
            正在理解上下文
            <span>…</span>
          </p>
        </article>
        <div v-if="messages.length > 0 && !generatedReport" class="result-card">
          <div>
            <span>已生成可阅读结果</span>
            <strong>
              {{
                employeeId === 'report-copilot'
                  ? 'W32 个人工作汇报'
                  : employeeId === 'review-copilot'
                    ? '本周优先审阅清单'
                    : '跨部门承诺脱节事件'
              }}
            </strong>
          </div>
          <Button type="primary" @click="openResult">
            打开结果
            <Icon icon="lucide:arrow-right" />
          </Button>
        </div>
        <div v-if="generatedReport" class="generated-card">
          <header>
            <span class="gen-icon"><Icon icon="lucide:file-check-2" /></span>
            <div>
              <span>
                {{ generatedReport.period === 'daily' ? '日报' : '周报' }}已生成 ·
                秒出（草稿已预生成）
              </span>
              <strong>{{ generatedReport.title }}</strong>
            </div>
          </header>
          <ul class="gen-meta">
            <li>系统自动汇总 14 条</li>
            <li>人工补充 2 条</li>
            <li>最近同步 18:00</li>
          </ul>
          <div class="gen-actions">
            <Button @click="openResult">
              查看
              <Icon icon="lucide:arrow-right" />
            </Button>
            <Button @click="saveDraft">
              {{ draftSaved ? '已保存草稿' : '保存草稿' }}
            </Button>
            <Button
              type="primary"
              :disabled="reportSubmitted"
              @click="submitReport"
            >
              {{ reportSubmitted ? '已提交' : '提交' }}
            </Button>
          </div>
          <div v-if="reportSubmitted" class="gen-suggest">
            <span>AI 后续建议</span>
            <ul>
              <li>
                <Icon icon="lucide:file-plus-2" />
                创建工单：客户 B 接口联调
              </li>
              <li>
                <Icon icon="lucide:calendar-plus" />
                安排会议：跨部门范围确认
              </li>
              <li>
                <Icon icon="lucide:alarm-clock" />
                任务到期提醒：D4 交付验收
              </li>
            </ul>
          </div>
        </div>
      </section>
    </main>
    <footer class="composer">
      <div class="composer-box">
        <Upload
          :show-upload-list="false"
          :before-upload="
            () => {
              message.success('资料已加入上下文');
              return false;
            }
          "
        >
          <Button type="text" aria-label="上传资料">
            <Icon icon="lucide:paperclip" />
          </Button>
        </Upload>
        <Input.TextArea
          v-model:value="draft"
          :auto-size="{ minRows: 1, maxRows: 4 }"
          placeholder="直接描述、粘贴内容或上传资料…"
          @keydown.enter.exact.prevent="send()"
        />
        <Button type="primary" shape="circle" aria-label="发送" @click="send()">
          <Icon icon="lucide:arrow-up" />
        </Button>
      </div>
      <small>数字员工会引用资料并说明判断依据，重要结果由你确认后提交。</small>
    </footer>
  </div>
</template>

<style scoped>
.next-chat {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #f7faf9;
  border: 1px solid #d7e5e0;
  border-radius: 14px;
}

.chat-stream {
  flex: 1;
  padding: 34px max(24px, calc((100% - 880px) / 2));
  overflow: auto;
}

.chat-intro > span {
  font-size: 10px;
  font-weight: 800;
  color: #0b806f;
  letter-spacing: 0.14em;
}

.chat-intro h1 {
  margin: 7px 0;
  font-size: 28px;
}

.chat-intro > p {
  max-width: 680px;
  margin: 0;
  line-height: 1.7;
  color: #5d766e;
}

.chat-intro > div {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 20px;
}

.chat-intro button {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 9px 12px;
  color: #1b463c;
  cursor: pointer;
  background: #fff;
  border: 1px solid #cfe0da;
  border-radius: 8px;
  transition: 0.18s;
}

.chat-intro button:hover {
  border-color: #0b806f;
  transform: translateY(-1px);
}

.source-panel {
  display: grid;
  gap: 12px;
  padding: 15px 17px;
  margin-top: 26px;
  background: #eef6f3;
  border: 1px solid #d2e5de;
  border-radius: 10px;
}

.source-head {
  display: flex;
  gap: 10px;
  align-items: center;
}

.source-head > svg {
  font-size: 20px;
  color: #0b806f;
}

.source-head span {
  display: grid;
}

.source-head small {
  font-size: 10px;
  color: #82958f;
}

.source-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.source-list li {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding: 4px 10px;
  font-size: 12px;
  color: #1b463c;
  background: #fff;
  border: 1px solid #d2e5de;
  border-radius: 999px;
}

.source-list i {
  width: 7px;
  height: 7px;
  background: #0b806f;
  border-radius: 999px;
}

.source-list i.warn {
  background: #e0a008;
}

.source-list em {
  font-style: normal;
  color: #82958f;
}

.conversation {
  display: grid;
  gap: 14px;
  margin-top: 26px;
}

.conversation article {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.conversation p {
  max-width: 76%;
  padding: 12px 15px;
  margin: 0;
  line-height: 1.7;
  white-space: pre-line;
  border-radius: 3px 13px 13px;
}

.conversation .assistant p {
  background: #fff;
  border: 1px solid #dce7e3;
}

.conversation .user {
  justify-content: flex-end;
}

.conversation .user p {
  color: #fff;
  background: #0b6e65;
  border-radius: 13px 3px 13px 13px;
}

.bot-avatar {
  display: grid;
  flex: none;
  place-items: center;
  width: 30px;
  height: 30px;
  color: #0b806f;
  background: #dcefe9;
  border-radius: 8px;
}

.thinking {
  color: #71867f;
}

.result-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  margin-left: 40px;
  background: #fff;
  border: 1px solid #b9dace;
  border-left: 4px solid #0b806f;
  border-radius: 8px;
}

.result-card > div {
  display: grid;
}

.result-card span {
  font-size: 10px;
  color: #758b84;
}

.result-card strong {
  margin-top: 4px;
}

.generated-card {
  display: grid;
  gap: 14px;
  padding: 16px 18px;
  margin-left: 40px;
  background: #fff;
  border: 1px solid #b9dace;
  border-left: 4px solid #0b806f;
  border-radius: 8px;
}

.generated-card > header {
  display: flex;
  gap: 12px;
  align-items: center;
}

.gen-icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 34px;
  height: 34px;
  font-size: 18px;
  color: #0b806f;
  background: #dcefe9;
  border-radius: 9px;
}

.generated-card > header > div {
  display: grid;
}

.generated-card > header span {
  font-size: 10px;
  color: #758b84;
}

.generated-card > header strong {
  margin-top: 2px;
  font-size: 15px;
  color: #1c2b27;
}

.gen-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.gen-meta li {
  padding: 3px 10px;
  font-size: 12px;
  color: #44554f;
  background: #f2f8f6;
  border-radius: 999px;
}

.gen-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.gen-suggest {
  padding: 12px 14px;
  background: #f6faf9;
  border: 1px solid #dbe7e3;
  border-radius: 8px;
}

.gen-suggest > span {
  font-size: 10px;
  font-weight: 800;
  color: #0b806f;
  letter-spacing: 0.12em;
}

.gen-suggest ul {
  display: grid;
  gap: 8px;
  padding: 0;
  margin: 10px 0 0;
  list-style: none;
}

.gen-suggest li {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 13px;
  color: #2a3b36;
}

.gen-suggest li > svg {
  color: #0b806f;
}

.composer {
  padding: 12px max(20px, calc((100% - 880px) / 2)) 16px;
  background: rgb(247 250 249 / 95%);
  border-top: 1px solid #e0e9e6;
}

.composer-box {
  display: flex;
  gap: 6px;
  align-items: flex-end;
  padding: 7px;
  background: #fff;
  border: 1px solid #bdcfc9;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgb(22 67 55 / 7%);
}

.composer-box :deep(textarea) {
  border: 0 !important;
  box-shadow: none !important;
}

.composer > small {
  display: block;
  margin-top: 7px;
  color: #8a9b96;
  text-align: center;
}

@media (max-width: 800px) {
  .chat-stream {
    padding: 24px 16px;
  }

  .source-panel {
    padding: 13px 14px;
  }

  .generated-card {
    margin-left: 0;
  }

  .conversation p {
    max-width: 90%;
  }

  .composer {
    padding: 10px 14px;
  }

  .result-card {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
    margin-left: 0;
  }
}

.mention-chat-alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 48px;
  padding: 8px 12px;
  margin-top: 18px;
  color: #17483d;
  text-align: left;
  cursor: pointer;
  background: #e3f2ed;
  border: 1px solid #acd1c6;
  border-radius: 9px;
}

.mention-chat-alert > span {
  display: flex !important;
  gap: 8px;
  align-items: center;
}

.mention-chat-alert > span > svg {
  font-size: 19px;
  color: #087565;
}

.mention-chat-alert > span > span {
  display: grid !important;
}

.mention-chat-alert strong {
  font-size: 13px;
}

.mention-chat-alert small {
  font-size: 12px !important;
  color: #617970 !important;
}

.mention-chat-alert > span:last-child {
  font-size: 12px;
  font-weight: 800;
  color: #087565;
}

.mention-chat-alert:hover {
  background: #d8eee7;
  border-color: #82b8a9;
}
</style>
