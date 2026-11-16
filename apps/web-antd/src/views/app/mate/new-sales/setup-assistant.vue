<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { Icon } from "@iconify/vue";
import { Modal } from "ant-design-vue";
import { defaultSalesStages } from "./settings-store";

type Stages = typeof defaultSalesStages;
type Message = {
  role: "assistant" | "user" | "tool";
  text: string;
  result?: string;
};
const props = defineProps<{ stages: Stages }>();
const emit = defineEmits<{ apply: [Stages]; targets: []; view: [] }>();
const open = ref(false);
const messages = ref<Message[]>([]);
const transcript = ref<HTMLElement>();
const input = ref("");
const answers = ref<string[]>([]);
const stages = ref<Stages>([]);
const selected = ref<number[]>([]);
const phase = ref<"interview" | "preview" | "done">("interview");
const questions = [
  {
    text: "先了解一下，你们团队主要销售什么？",
    options: ["标准产品", "设备与软件方案", "项目型服务"],
  },
  {
    text: "报价之前，客户通常需要看演示、做评审，还是可以直接报价？",
    options: ["直接报价", "安排演示或 POC", "组织正式评审"],
  },
  {
    text: "从确认需求到签约，一笔商机通常需要多久？",
    options: ["一个月内", "一至三个月", "三个月以上"],
  },
];
const chosen = computed(() =>
  stages.value.filter((s) => selected.value.includes(s.id)),
);
const replies = computed(() => {
  if (phase.value === "done")
    return ["手动设置销售目标", "查看销售流程", "重新初始化"];
  if (phase.value === "preview") return ["确认应用", "重新回答"];
  return questions[answers.value.length]?.options ?? [];
});
async function scrollEnd() {
  await nextTick();
  if (transcript.value)
    transcript.value.scrollTop = transcript.value.scrollHeight;
}
function say(text: string) {
  messages.value.push({ role: "assistant", text });
}
function tool(text: string, result: string) {
  messages.value.push({ role: "tool", text, result });
}
function begin() {
  answers.value = [];
  stages.value = [];
  selected.value = [];
  phase.value = "interview";
  say("我来帮你配置销售流程。先看看当前设置。");
  tool("读取销售流程", props.stages.map((s) => s.name).join(" → "));
  say(questions[0]!.text);
}
function launch() {
  open.value = true;
  if (!messages.value.length) begin();
  scrollEnd();
}
function recommend() {
  const [product = "", review = "", cycle = ""] = answers.value;
  const result = defaultSalesStages.map((s) => ({ ...s }));
  if (/项目|定制/.test(product))
    result.splice(1, 0, {
      id: 5,
      name: "项目立项",
      rate: 30,
      days: 7,
      color: "#6385b5",
      required: "项目范围、预算负责人",
    });
  const assessment = result.find((s) => s.id === 2)!;
  if (/评审|评标/.test(review))
    Object.assign(assessment, {
      name: "方案评审",
      required: "评审结论、客户确认人",
    });
  const scale = /以上|半年|年左右|[4-9四五六七八九]个?月/.test(cycle)
    ? 2
    : /月内|周|星期|天/.test(cycle)
      ? 0.5
      : 1;
  stages.value = result.map((s) => ({ ...s, days: Math.ceil(s.days * scale) }));
  selected.value = stages.value
    .filter((s) => s.id !== 2 || !/直接报价|无需验证|不用演示/.test(review))
    .map((s) => s.id);
  phase.value = "preview";
  tool("生成阶段草案", chosen.value.map((s) => s.name).join(" → "));
  say(
    "我整理了下面的阶段。可以直接勾选，也可以回复“去掉商务报价”或“新增技术交流”。确认后，我会用这份草案替换当前演示流程。",
  );
}
function reviewReply(text: string) {
  if (/^(确认应用|确认|应用|可以应用|就这样)[。！!\s]*$/.test(text)) {
    if (!chosen.value.length) return say("至少选一个阶段，我才能应用流程。");
    const next = chosen.value.map((s) => ({ ...s }));
    emit("apply", next);
    tool("写入销售流程", next.map((s) => s.name).join(" → ") + " → 结单");
    phase.value = "done";
    return say("流程已经配置好了。销售目标由你填写，现在要去设置吗？");
  }
  const edit = text.match(
    /^(?:请|帮我)?(去掉|删除|取消|加上|新增|添加|恢复)\s*[「“]?(.+?)[」”。！!]*$/,
  );
  if (!edit)
    return say(
      "可以勾选下面的阶段，或告诉我要新增、去掉哪个阶段。准备好后回复“确认应用”。",
    );
  const name = edit[2]!.trim();
  if (!name || name.length > 16 || ["结单", "赢单", "输单"].includes(name))
    return say("请输入 1 到 16 个字的业务阶段名称。赢单和输单是固定结单结果。");
  let stage = stages.value.find((s) => s.name === name);
  if (["去掉", "删除", "取消"].includes(edit[1]!)) {
    if (!stage)
      return say("草案里没有找到“" + name + "”，可以直接勾选要保留的阶段。");
    selected.value = selected.value.filter((id) => id !== stage!.id);
  } else {
    if (!stage) {
      stage = {
        id: Date.now(),
        name,
        rate: 50,
        days: 7,
        color: "#6385b5",
        required: "",
      };
      stages.value.push(stage);
    }
    if (!selected.value.includes(stage.id)) selected.value.push(stage.id);
  }
  tool(
    "调整阶段草案",
    chosen.value.map((s) => s.name).join(" → ") || "尚未选择阶段",
  );
  say("草案已更新，确认后即可应用。");
}
function send(raw: string) {
  const text = raw.trim();
  if (!text) return;
  messages.value.push({ role: "user", text });
  input.value = "";
  if (text === "重新回答" || text === "重新初始化") begin();
  else if (phase.value === "interview") {
    answers.value.push(text);
    const question = questions[answers.value.length];
    if (question) say(question.text);
    else recommend();
  } else if (phase.value === "preview") reviewReply(text);
  else if (text === "手动设置销售目标") {
    open.value = false;
    emit("targets");
  } else if (text === "查看销售流程") {
    open.value = false;
    emit("view");
  } else say("你可以继续查看销售流程，或者进入销售目标页填写目标。");
  scrollEnd();
}
function keydown(event: KeyboardEvent) {
  if (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing &&
    event.keyCode !== 229
  ) {
    event.preventDefault();
    send(input.value);
  }
}
</script>
<template>
  <button class="setup-launch" @click="launch">
    <Icon icon="lucide:sparkles" />智能初始化
  </button>
  <Modal
    v-model:open="open"
    centered
    :width="690"
    :footer="null"
    :body-style="{ padding: 0 }"
    @after-open-change="scrollEnd"
  >
    <template #title
      ><div class="chat-title">
        <span class="avatar"><Icon icon="lucide:bot" /></span>
        <div>
          <strong>销售配置助理</strong><small>智能初始化 · 本地演示</small>
        </div>
      </div></template
    >
    <div class="setup-chat">
      <div
        ref="transcript"
        class="transcript"
        role="log"
        aria-label="初始化对话"
        aria-live="polite"
      >
        <template v-for="(m, i) in messages" :key="i">
          <details v-if="m.role === 'tool'" class="tool">
            <summary>
              <Icon icon="lucide:wrench" />{{ m.text }}<span>已完成</span>
            </summary>
            <p>{{ m.result }}</p>
          </details>
          <div v-else class="bubble" :class="m.role">
            <small>{{ m.role === "user" ? "你" : "销售配置助理" }}</small>
            <p>{{ m.text }}</p>
          </div>
        </template>
        <div v-if="phase === 'preview'" class="stage-list">
          <label v-for="s in stages" :key="s.id"
            ><input v-model="selected" type="checkbox" :value="s.id" />{{
              s.name
            }}<small>{{ s.rate }}% · {{ s.days }} 天预警</small></label
          >
        </div>
      </div>
      <div class="composer">
        <div class="replies">
          <button v-for="r in replies" :key="r" @click="send(r)">
            {{ r }}
          </button>
        </div>
        <div class="entry">
          <textarea
            v-model="input"
            rows="2"
            aria-label="回复销售配置助理"
            placeholder="回复销售配置助理…"
            @keydown="keydown"
          /><button
            :disabled="!input.trim()"
            aria-label="发送回复"
            @click="send(input)"
          >
            <Icon icon="lucide:arrow-up" />
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>
<style scoped>
.setup-launch,
.chat-title,
.tool summary,
.stage-list label,
.replies,
.entry {
  display: flex;
  align-items: center;
  gap: 9px;
}
.setup-launch,
.replies button {
  cursor: pointer;
  border: 1px solid #bcded1;
  color: #11634f;
  background: #edf8f2;
  border-radius: 8px;
  padding: 9px 13px;
}
.chat-title {
  padding-bottom: 8px;
}
.chat-title small,
.bubble small {
  display: block;
  font-size: 11px;
  color: #61776b;
}
.avatar,
.entry button {
  display: grid;
  place-items: center;
  background: #137960;
  color: white;
  border-radius: 10px;
  width: 36px;
  height: 36px;
  font-size: 20px;
}
.setup-chat {
  display: flex;
  flex-direction: column;
  height: min(620px, 72dvh);
  color: #234437;
}
.transcript {
  min-height: 0;
  overflow: auto;
  flex: 1;
  background: #f5f8f6;
  padding: 16px;
  border-radius: 9px;
  scrollbar-gutter: stable;
}
.bubble {
  width: fit-content;
  max-width: 86%;
  margin-bottom: 12px;
}
.bubble p {
  border: 1px solid #dae6de;
  background: white;
  border-radius: 2px 12px 12px;
  padding: 10px 13px;
  margin: 4px 0;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.user {
  margin-left: auto;
}
.user small {
  text-align: right;
}
.user p {
  background: #dcf1e6;
  border-color: #cae4d5;
  border-radius: 12px 2px 12px 12px;
}
.tool {
  margin: 0 0 12px;
  width: fit-content;
  max-width: 95%;
  border-left: 2px solid #86b79e;
  padding: 4px 9px;
  color: #526d60;
  font-size: 12px;
}
.tool summary {
  cursor: pointer;
}
.tool span {
  color: #277552;
  font-size: 11px;
}
.tool p {
  margin: 6px 0 0;
}
.stage-list {
  display: grid;
  gap: 5px;
}
.stage-list label {
  border: 1px solid #dce7df;
  background: white;
  border-radius: 7px;
  cursor: pointer;
  padding: 8px 11px;
}
.stage-list input {
  accent-color: #147959;
}
.stage-list small {
  margin-left: auto;
  color: #62756a;
}
.composer {
  padding-top: 12px;
}
.replies {
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 9px;
}
.replies button {
  font-size: 12px;
  padding: 6px 10px;
}
.entry {
  border: 1px solid #c4d9cd;
  border-radius: 10px;
  padding: 9px;
}
.entry:focus-within {
  outline: 2px solid #91c5ad;
}
.entry textarea {
  border: none;
  outline: none;
  resize: none;
  flex: 1;
  min-width: 0;
  background: transparent;
}
.entry button {
  border: 0;
  cursor: pointer;
  width: 32px;
  height: 32px;
}
.entry button:disabled {
  opacity: 0.45;
}
</style>
