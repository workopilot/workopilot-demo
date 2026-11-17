<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { mockMateEmployees } from "#/api/mock-data-mate";
import { Modal, message } from "ant-design-vue";
import { salesDb as db, addSales } from "#/api/mock-new-sales";
import type { SalesRecord } from "#/types/new-sales";
const props = defineProps<{
  deal: SalesRecord;
  stages: {
    name: string;
    color: string;
    pale: string;
    icon: string;
    probability: number;
  }[];
  actions: { agent: string; text: string; icon: string; tone: string }[];
}>();
const emit = defineEmits<{
  stage: [string];
  closeDeal: [string];
  collaborate: [{ agent: string; text: string }];
}>();
const router = useRouter();
const today = "2026-11-02";
const rename = ref(false);
const resourcePreview = ref("");
function demoResources(a: SalesRecord) {
  if (a.category === "会议") return ["会议纪要", "售前 PPT"];
  if (a.category === "历史摘要") return ["需求确认清单"];
  return [];
}
const nameInput = ref<HTMLInputElement>();
const followupText = ref("");
const followupType = ref("会议");
const composerOpen = ref(true);
const followupInput = ref<HTMLTextAreaElement>();
const employee = mockMateEmployees.find((e) => e.id === "new-sales-assistant")!;
const progressStages = computed(() =>
  props.stages.filter((s) => !["赢单", "输单"].includes(s.name)),
);
const isClosed = computed(() => ["赢单", "输单"].includes(props.deal.status));
const suggestions = computed(() => [
  `帮我给${props.deal.name}商机添加跟进`,
  `帮我预约周三和${customer.value?.name || "客户"}开演示会议`,
  `帮我梳理发送邮件给${customer.value?.contact || "联系人"}`,
]);
async function newFollowup() {
  composerOpen.value = true;
  await nextTick();
  followupInput.value?.focus();
  followupInput.value?.scrollIntoView({ block: "nearest", behavior: "smooth" });
}
function assistant(text: string) {
  void router.push({
    path: "/app/mate/employee/new-sales-assistant/sales/chat",
    query: {
      context: props.deal.customerId || "general",
      fresh: "1",
      prompt: `${text}\n商机：${props.deal.name}；客户：${customer.value?.name || "待关联"}；阶段：${props.deal.status}；预计金额：${props.deal.amount || 0}元。\n最新进展：${latestSummary.value}`,
    },
  });
}
function activityTone(a: SalesRecord) {
  return /会议/.test(a.category || "")
    ? "meeting"
    : /预约/.test(a.category || "")
      ? "appointment"
      : /邮件/.test(a.category || "")
        ? "email"
        : isFollowup(a)
          ? "followup"
          : "system";
}
const files = ref<File[]>([]);
const fileInput = ref<HTMLInputElement>();
const posting = ref(false);
const saved = ref(false);
const currentStage = computed(
  () =>
    props.stages.find((s) => s.name === props.deal.status) || props.stages[0]!,
);
const customer = computed(() =>
  db.customers.find((c) => c.id === props.deal.customerId),
);
const age = computed(() =>
  props.deal.stageEnteredAt
    ? Math.max(
        0,
        Math.floor(
          (Date.parse(today) - Date.parse(props.deal.stageEnteredAt)) /
            86400000,
        ),
      )
    : null,
);
const activityRows = computed(() =>
  db.activities
    .filter((a) => a.dealId === props.deal.id)
    .slice()
    .sort((a, b) =>
      (b.occurredAt || b.date || "").localeCompare(
        a.occurredAt || a.date || "",
      ),
    ),
);
const isFollowup = (a: SalesRecord) =>
  !["商机推进", "商机创建", "属性变更", "历史摘要"].includes(a.category || "");
const followupCount = computed(
  () => activityRows.value.filter(isFollowup).length,
);
const latestSummary = computed(
  () =>
    activityRows.value.find(isFollowup)?.note ||
    activityRows.value.find((a) => a.category === "历史摘要")?.note ||
    "暂无跟进记录",
);
const selectedType = computed(
  () =>
    props.deal.category ||
    (db.deals.some(
      (d) =>
        d.id !== props.deal.id &&
        d.customerId === props.deal.customerId &&
        d.status === "赢单" &&
        (d.date || "") <= (props.deal.date || ""),
    )
      ? "老客复购与增购"
      : "新签首单"),
);
// Preserve the previous static summary once, without inventing its occurrence date.
if (!props.deal.historyMigrated) {
  if (
    props.deal.note?.trim() &&
    !db.activities.some(
      (a) => a.dealId === props.deal.id && a.note === props.deal.note,
    )
  )
    addSales("activities", {
      name: "历史跟进摘要",
      customerId: props.deal.customerId,
      dealId: props.deal.id,
      owner: props.deal.owner,
      status: "已记录",
      category: "历史摘要",
      note: props.deal.note,
    });
  props.deal.historyMigrated = true;
}
function record(
  name: string,
  note: string,
  category: string,
  attachments?: SalesRecord["attachments"],
) {
  return addSales("activities", {
    name,
    note,
    category,
    attachments,
    customerId: props.deal.customerId,
    dealId: props.deal.id,
    owner: props.deal.owner || "韩立",
    status: "已记录",
    date: today,
    occurredAt: new Date().toISOString(),
  });
}
async function startRename() {
  rename.value = true;
  await nextTick();
  nameInput.value?.focus();
  nameInput.value?.select();
}
function commit(
  field: "name" | "amount" | "date" | "category" | "owner",
  event: Event,
) {
  const el = event.target as HTMLInputElement;
  const raw = el.value.trim();
  const value = field === "amount" ? Number(raw) : raw;
  if (
    !raw ||
    (field === "amount" && (!Number.isFinite(value) || Number(value) <= 0))
  ) {
    message.warning(
      field === "amount" ? "请输入大于 0 的金额" : "此项不能为空",
    );
    el.value = String(props.deal[field] || "");
    return;
  }
  const previous = props.deal[field];
  if (String(previous ?? "") !== String(value)) {
    const labels = {
      name: "商机名称",
      amount: "预计金额",
      date: "预计成交日",
      category: "商机类型",
      owner: "归属人",
    };
    Object.assign(props.deal, { [field]: value });
    record(
      `更新${labels[field]}`,
      `${previous || "未设置"} → ${value}`,
      "属性变更",
    );
    saved.value = true;
  }
  if (field === "name") rename.value = false;
}
function addFiles(incoming: FileList | null) {
  if (!incoming) return;
  for (const f of Array.from(incoming)) {
    if (!files.value.some((x) => x.name === f.name && x.size === f.size))
      files.value.push(f);
  }
}
function pickFiles(event: Event) {
  const el = event.target as HTMLInputElement;
  addFiles(el.files);
  el.value = "";
}
function drop(event: DragEvent) {
  addFiles(event.dataTransfer?.files || null);
}
function publish() {
  if (posting.value || (!followupText.value.trim() && !files.value.length))
    return;
  posting.value = true;
  const note = followupText.value.trim() || "补充商机附件";
  record(
    `${followupType.value}跟进`,
    note,
    followupType.value,
    files.value.map((f) => ({ name: f.name, size: f.size, type: f.type })),
  );
  props.deal.note = note;
  followupText.value = "";
  files.value = [];
  posting.value = false;
  saved.value = true;
  message.success("跟进已发布，历史记录已保留");
}
function openCustomer() {
  void router.push({
    path: "/app/mate/employee/new-sales-assistant/sales/customers",
    query: { customer: props.deal.customerId },
  });
}
function meeting() {
  emit("collaborate", {
    agent: "会议助理",
    text: `提炼本次跟进为会议纪要与下一步待办。${followupText.value ? `原始记录：${followupText.value}` : "请先收集会议原文或录音转写。"}${files.value.length ? `附件名称：${files.value.map((f) => f.name).join("、")}（当前仅记录文件信息，未转写音频）。` : ""}`,
  });
}
function iconFor(a: SalesRecord) {
  if (/会议/.test(a.category || "")) return "lucide:video";
  if (/预约/.test(a.category || "")) return "lucide:calendar-check";
  if (/邮件/.test(a.category || "")) return "lucide:mail";
  return a.category === "商机推进"
    ? "lucide:git-branch"
    : a.category === "属性变更"
      ? "lucide:pencil"
      : a.category === "商机创建"
        ? "lucide:flag"
        : a.category === "历史摘要"
          ? "lucide:history"
          : a.owner === "数字员工"
            ? "lucide:sparkles"
            : "lucide:message-square";
}
function timeLabel(a: SalesRecord) {
  if (!a.date) return "历史记录 · 时间未记录";
  return `${a.date === today ? "今天" : a.date}${a.occurredAt ? " " + new Date(a.occurredAt).toLocaleTimeString("zh-CN", { timeZone: "Asia/Shanghai", hour: "2-digit", minute: "2-digit" }) : ""}`;
}
</script>
<template>
  <div class="deal-detail">
    <main class="dd-main">
      <section class="dd-overview">
        <div class="dd-title-row">
          <input
            v-if="rename"
            ref="nameInput"
            class="dd-rename"
            aria-label="修改商机名称"
            :value="deal.name"
            @blur="commit('name', $event)"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
            @keydown.esc="rename = false"
          />
          <button
            v-else
            class="dd-title"
            title="点击修改商机名称"
            @click="startRename"
          >
            {{ deal.name }}<Icon icon="lucide:pencil" />
          </button>
          <span v-if="saved" class="dd-saved"
            ><Icon icon="lucide:check" />已保存</span
          >
        </div>
        <div class="dd-tags">
          <button @click="openCustomer">
            <Icon icon="lucide:building-2" />{{ customer?.name || "客户待关联"
            }}<Icon icon="lucide:arrow-up-right" />
          </button>
          <label
            ><Icon icon="lucide:tag" /><select
              aria-label="商机类型"
              :value="
                /复购|增购/.test(selectedType) ? '老客复购与增购' : '新签首单'
              "
              @change="commit('category', $event)"
            >
              <option>新签首单</option>
              <option>老客复购与增购</option>
            </select></label
          >
          <span title="商机随客户统一归属"
            ><Icon icon="lucide:user-round" />{{
              customer?.owner || "待分配"
            }}</span
          >
        </div>
        <div class="dd-progress-heading">
          <span
            >商机进度 ·
            <strong :class="{ lost: deal.status === '输单' }">{{
              deal.status
            }}</strong></span
          >
          <div class="dp-close-actions">
            <button
              class="won"
              :disabled="deal.status === '赢单'"
              @click="emit('closeDeal', '赢单')"
            >
              <Icon icon="lucide:trophy" />赢单
            </button>
            <button
              class="lost"
              :disabled="deal.status === '输单'"
              @click="emit('closeDeal', '输单')"
            >
              <Icon icon="lucide:x" />输单
            </button>
          </div>
        </div>
        <nav class="dd-progress" aria-label="商机阶段">
          <button
            v-for="(s, index) in progressStages"
            :key="s.name"
            :aria-current="deal.status === s.name ? 'step' : undefined"
            :class="{
              completed:
                deal.status === '赢单' ||
                (!isClosed &&
                  index <=
                    progressStages.findIndex((x) => x.name === deal.status)),
              current: deal.status === s.name,
            }"
            @click="emit('stage', s.name)"
          >
            <Icon
              v-if="
                deal.status === '赢单' ||
                index < progressStages.findIndex((x) => x.name === deal.status)
              "
              icon="lucide:check"
            />{{ s.name }}
          </button>
          <span
            :class="{
              won: deal.status === '赢单',
              lost: deal.status === '输单',
            }"
            >{{ isClosed ? deal.status : "结单" }}</span
          >
        </nav>
        <div class="dd-metrics">
          <label
            ><span><Icon icon="lucide:wallet" />预计金额（元）</span
            ><input
              type="number"
              min="0.01"
              step="0.01"
              aria-label="修改预计金额"
              :value="deal.amount"
              @blur="commit('amount', $event)"
              @keydown.enter="($event.target as HTMLInputElement).blur()"
          /></label>
          <label
            ><span><Icon icon="lucide:calendar-days" />预计成交日</span
            ><input
              type="date"
              aria-label="修改预计成交日"
              :value="deal.date"
              @blur="commit('date', $event)"
          /></label>
          <div>
            <span><Icon icon="lucide:target" />阶段参考赢率</span
            ><strong
              >{{ currentStage.probability }}%<small>{{
                age === null ? "停留待记录" : `停留 ${age} 天`
              }}</small></strong
            >
          </div>
        </div>
      </section>
      <section class="dd-activity-section">
        <header class="dd-section-heading">
          <h3>
            <i><Icon icon="lucide:messages-square" /></i>跟进动态
            <span>{{ followupCount }}</span>
          </h3>
          <button @click="newFollowup">
            <Icon icon="lucide:plus" />新增跟进
          </button>
        </header>
        <div
          v-if="composerOpen"
          class="dd-composer"
          @dragover.prevent
          @drop.prevent="drop"
        >
          <div class="dd-composer-heading">
            <strong>手动跟进</strong
            ><label
              >类型<select v-model="followupType" aria-label="跟进类型">
                <option>会议</option>
                <option>预约</option>
                <option>邮件</option>
                <option>电话</option>
                <option>拜访</option>
              </select></label
            >
          </div>
          <textarea
            ref="followupInput"
            v-model="followupText"
            aria-label="本次商机跟进"
            placeholder="输入本次沟通内容、客户反馈与下一步计划…"
            rows="3"
            @keydown.ctrl.enter.prevent="publish"
          />
          <div v-if="files.length" class="dd-attachments">
            <span v-for="(f, i) in files" :key="f.name + f.size"
              ><Icon icon="lucide:paperclip" />{{ f.name
              }}<button
                :aria-label="`移除${f.name}`"
                @click="files.splice(i, 1)"
              >
                <Icon icon="lucide:x" /></button></span
            ><small>本地附件信息 · 未上传或转写</small>
          </div>
          <footer>
            <input
              ref="fileInput"
              type="file"
              multiple
              hidden
              @change="pickFiles"
            /><button @click="fileInput?.click()">
              <Icon icon="lucide:paperclip" />附件</button
            ><button @click="meeting">
              <Icon icon="lucide:mic" />会议助理提炼</button
            ><button
              class="dd-publish"
              :disabled="posting || (!followupText.trim() && !files.length)"
              @click="publish"
            >
              发布跟进<Icon icon="lucide:arrow-up" />
            </button>
          </footer>
        </div>
        <div class="dd-timeline">
          <article
            v-for="a in activityRows"
            :key="a.id"
            :class="activityTone(a)"
          >
            <i><Icon :icon="iconFor(a)" /></i>
            <div class="dd-event">
              <header>
                <div>
                  <strong>{{ a.owner || "系统" }}</strong
                  ><time>{{ timeLabel(a) }}</time>
                </div>
                <span class="dd-category">{{ a.category || "跟进" }}</span>
              </header>
              <div class="dd-event-card">
                <p>
                  {{
                    !isFollowup(a) && a.category !== "历史摘要"
                      ? a.name + "\n"
                      : ""
                  }}{{ a.note || a.name }}
                </p>
                <div v-if="demoResources(a).length" class="dd-resource-links">
                  <button
                    v-for="resource in demoResources(a)"
                    :key="resource"
                    @click="resourcePreview = resource"
                  >
                    <Icon
                      :icon="
                        resource === '售前 PPT'
                          ? 'lucide:presentation'
                          : 'lucide:file-text'
                      "
                    />{{ resource
                    }}<Icon icon="lucide:arrow-up-right" /></button
                  ><small>演示资料</small>
                </div>
                <div v-if="a.attachments?.length" class="dd-file-records">
                  <span v-for="(f, i) in a.attachments" :key="i"
                    ><Icon icon="lucide:file" />{{ f.name
                    }}<small
                      >{{ Math.max(1, Math.round(f.size / 1024)) }} KB</small
                    ></span
                  >
                </div>
              </div>
            </div>
          </article>
          <div v-if="!activityRows.length" class="dd-empty">
            记录本单的第一次推进
          </div>
        </div>
      </section>
    </main>
    <aside class="dd-sidebar">
      <section class="dd-analysis">
        <header>
          <i><Icon icon="lucide:chart-no-axes-combined" /></i>
          <h3>商机分析</h3>
          <span>档案摘要</span>
        </header>
        <div class="dd-analysis-stage">
          <span>当前阶段</span><strong>{{ deal.status }}</strong>
        </div>
        <div class="dd-analysis-progress">
          <span :style="{ width: `${currentStage.probability}%` }" />
        </div>
        <h4>最新进展</h4>
        <p>{{ latestSummary }}</p>
        <div class="dd-next">
          <Icon icon="lucide:crosshair" />
          <div>
            <strong>下一步关注</strong>
            <p>
              {{
                isClosed
                  ? deal.status === "赢单"
                    ? "确认交付安排与客户交接。"
                    : "复盘客户反馈，记录后续重启条件。"
                  : actions[0]?.text || "确认客户需求与下一次沟通时间。"
              }}
            </p>
          </div>
        </div>
      </section>
      <section class="dd-ai">
        <header>
          <div>
            <small>AI COPILOT</small>
            <h3>AI 建议</h3>
          </div>
          <Icon icon="lucide:sparkles" />
        </header>
        <div class="dd-employee-card">
          <button
            class="dd-employee"
            @click="assistant(`继续推进${deal.name}商机`)"
          >
            <img :src="employee.avatar" alt="新销售助理" /><span
              ><strong>新销售助理</strong
              ><small>跟进客户 · 推进商机</small></span
            ><Icon icon="lucide:arrow-up-right" /></button
          ><button
            v-for="(text, i) in suggestions"
            :key="text"
            class="dd-suggestion"
            :class="{ primary: i === 0 }"
            @click="assistant(text)"
          >
            <i
              ><Icon
                :icon="
                  [
                    'lucide:message-square-plus',
                    'lucide:calendar-clock',
                    'lucide:mail',
                  ][i] || 'lucide:sparkles'
                " /></i
            ><span>{{ text }}</span
            ><Icon icon="lucide:chevron-right" />
          </button>
        </div>
      </section>
    </aside>
    <Modal
      :open="!!resourcePreview"
      :title="`${resourcePreview} · 演示预览`"
      :footer="null"
      @cancel="resourcePreview = ''"
    >
      <div class="dd-resource-preview">
        <small>{{ customer?.name }} / {{ deal.name }}</small>
        <h3>{{ resourcePreview }}</h3>
        <template v-if="resourcePreview === '售前 PPT'"
          ><p>01 · 客户场景与业务目标</p>
          <p>02 · 移动巡检与设备接口方案</p>
          <p>03 · 试点计划、验收与后续安排</p></template
        >
        <template v-else
          ><p>沟通重点：确认试点范围、设备接口与验收标准。</p>
          <p>下一步：整理接口清单，安排产品演示，确认采购流程。</p></template
        >
        <small>示例内容，仅用于展示资料关联与预览效果。</small>
      </div>
    </Modal>
  </div>
</template>
<style scoped>
.deal-detail {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 22px;
  color: #183f35;
  font-size: 13px;
  line-height: 1.6;
  color-scheme: light;
}
.deal-detail * {
  box-sizing: border-box;
}
.deal-detail svg {
  width: 16px;
  height: 16px;
  flex: none;
}
.deal-detail button {
  cursor: pointer;
  font: inherit;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.deal-detail button:focus-visible,
.deal-detail input:focus-visible,
.deal-detail textarea:focus-visible,
.deal-detail select:focus-visible {
  outline: 2px solid #078665;
  outline-offset: 3px;
}
.dd-main {
  min-width: 0;
}
.dd-overview {
  padding: 4px 0 22px;
}
.dd-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dd-title {
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  font-size: 23px !important;
  line-height: 1.4 !important;
  font-weight: 750 !important;
  color: #163d32;
}
.dd-title svg {
  color: #4d806f;
  width: 14px;
}
.dd-rename {
  width: 100%;
  padding: 6px;
  border: 1px solid #0b9674;
  border-radius: 6px;
  font-size: 21px;
}
.dd-saved {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #087f5b;
  white-space: nowrap;
  margin-left: auto;
}
.dd-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin: 15px 0 22px;
}
.dd-tags > button,
.dd-tags > label,
.dd-tags > span {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #edf5f1;
  border: 1px solid #d8e7df;
  border-radius: 6px;
  padding: 5px 8px;
  color: #345f51;
  font-size: 12px;
}
.dd-tags select {
  max-width: 135px;
  border: 0;
  background: transparent;
  color: inherit;
}
.dd-progress-heading {
  align-items: center;
  gap: 12px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 8px;
  color: #526e63;
}
.dd-progress-heading strong {
  color: #087f5b;
}
.dd-progress-heading strong.lost {
  color: #d63758;
}
.dd-progress {
  display: flex;
  gap: 3px;
  margin-bottom: 19px;
}
.dd-progress > button,
.dd-progress > span {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 8px;
  border: 0;
  border-radius: 0;
  background: #c4cbd3;
  color: #273f49;
  font-size: 11px;
  font-weight: 600;
  clip-path: polygon(
    0 0,
    calc(100% - 8px) 0,
    100% 50%,
    calc(100% - 8px) 100%,
    0 100%,
    8px 50%
  );
}
.dd-progress > :first-child {
  clip-path: polygon(
    0 0,
    calc(100% - 8px) 0,
    100% 50%,
    calc(100% - 8px) 100%,
    0 100%
  );
  border-radius: 5px 0 0 5px;
}
.dd-progress > :last-child {
  clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 8px 50%);
  border-radius: 0 5px 5px 0;
}
.dd-progress > button.completed,
.dd-progress > span.won {
  background: #008958;
  color: white;
}
.dd-progress > button.current {
  background: #00764c;
}
.dd-progress > span.lost {
  background: #d63758;
  color: white;
}
.dd-progress button:hover {
  filter: brightness(0.92);
}
.dd-progress button:focus-visible {
  outline-offset: -4px;
  outline-color: #ffcf57;
}
.dd-progress svg {
  width: 12px;
}
.dd-metrics {
  display: grid;
  grid-template-columns: 1fr 1.1fr 1fr;
  gap: 10px;
}
.dd-metrics > label,
.dd-metrics > div {
  min-width: 0;
  background: #f3f7f5;
  border: 1px solid #dce8e2;
  border-radius: 10px;
  padding: 12px;
}
.dd-metrics span {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: #547365;
  white-space: nowrap;
}
.dd-metrics input {
  display: block;
  min-width: 0;
  width: 100%;
  border: 0;
  background: transparent;
  margin-top: 7px;
  padding: 0;
  color: #164f3d;
  font-size: 19px;
  font-weight: 700;
}
.dd-metrics input[type="date"] {
  font-size: 14px;
  min-height: 30px;
}
.dd-metrics strong {
  display: flex;
  align-items: baseline;
  gap: 5px;
  color: #6d39bc;
  font-size: 22px;
  margin-top: 4px;
  flex-wrap: wrap;
}
.dd-metrics small {
  font-size: 10px;
  font-weight: 400;
  color: #61756c;
}
.dd-activity-section {
  background: #eaf6ef;
  border: 1px solid #d2e8da;
  border-radius: 13px;
  padding: 18px;
  min-height: 420px;
}
.dd-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
.dd-section-heading h3 {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}
.dd-section-heading h3 i {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  background: #008b64;
  color: white;
  border-radius: 9px;
}
.dd-section-heading h3 span {
  font-size: 12px;
  color: #18714e;
  background: #d4ecde;
  padding: 1px 7px;
  border-radius: 5px;
}
.dd-section-heading > button {
  border: 1px solid #b7dcc8;
  background: white;
  color: #087d55;
  border-radius: 7px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
}
.dd-composer {
  border: 1px solid #bcdac9;
  border-radius: 10px;
  background: white;
  overflow: hidden;
  box-shadow: 0 3px 9px #164d3210;
}
.dd-composer:focus-within {
  border-color: #079669;
}
.dd-composer-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 11px 13px 0;
}
.dd-composer-heading strong {
  font-size: 12px;
}
.dd-composer-heading label {
  display: flex;
  gap: 7px;
  align-items: center;
  font-size: 11px;
  color: #5a7568;
}
.dd-composer-heading select {
  border: 1px solid #d2e5da;
  border-radius: 5px;
  padding: 3px 7px;
  background: #f3f9f6;
  color: #176447;
}
.dd-composer textarea {
  display: block;
  width: 100%;
  border: 0;
  background: white;
  color: #234f3c;
  resize: vertical;
  font-size: 13px;
  line-height: 1.8;
  padding: 12px;
  min-height: 87px;
}
.dd-composer textarea::placeholder {
  color: #788e82;
}
.dd-composer footer {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 9px 10px;
  background: #f8fbf9;
  border-top: 1px solid #e1ece5;
}
.dd-composer footer button {
  border: 0;
  background: none;
  color: #426e59;
  font-size: 11px;
  padding: 5px;
  border-radius: 6px;
}
.dd-composer footer .dd-publish {
  background: #008b60;
  color: white;
  margin-left: auto;
  padding: 7px 10px;
}
.dd-publish:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.dd-timeline {
  margin-top: 22px;
}
.dd-timeline article {
  --event: #128763;
  --pale: #daf1e5;
  display: flex;
  gap: 12px;
  position: relative;
  padding-bottom: 22px;
}
.dd-timeline article.meeting {
  --event: #2865d8;
  --pale: #e3edff;
}
.dd-timeline article.appointment {
  --event: #7c3fd3;
  --pale: #eee4ff;
}
.dd-timeline article.email {
  --event: #db8209;
  --pale: #fff0d2;
}
.dd-timeline article.system {
  --event: #63718b;
  --pale: #e7ebf2;
}
.dd-timeline article:before {
  content: "";
  position: absolute;
  left: 16px;
  top: 32px;
  bottom: 0;
  width: 2px;
  background: #c9dfd2;
}
.dd-timeline article:last-of-type:before {
  display: none;
}
.dd-timeline article > i {
  display: grid;
  place-items: center;
  flex: none;
  width: 34px;
  height: 34px;
  background: var(--event);
  color: white;
  border-radius: 10px;
  z-index: 1;
  box-shadow: 0 3px 7px #294c3d18;
}
.dd-event {
  flex: 1;
  min-width: 0;
}
.dd-event > header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  margin-bottom: 7px;
}
.dd-event header > div {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}
.dd-event strong {
  font-size: 12px;
  color: #244e3b;
}
.dd-event time {
  font-size: 10px;
  color: #627d6d;
}
.dd-category {
  color: var(--event);
  background: var(--pale);
  font-size: 10px;
  font-weight: 650;
  padding: 2px 8px;
  border-radius: 5px;
  white-space: nowrap;
}
.dd-event-card {
  background: white;
  border: 1px solid #d7e7dd;
  border-radius: 0 10px 10px;
  padding: 12px 14px;
  box-shadow: 0 2px 5px #254e3510;
}
.dd-event-card p {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: #344e40;
  font-size: 13px;
  line-height: 1.85;
}
.dd-attachments,
.dd-file-records {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 6px 10px;
}
.dd-attachments > span,
.dd-file-records > span {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  overflow-wrap: anywhere;
}
.dd-attachments button {
  margin-left: auto;
  border: 0;
  background: none;
}
.dd-attachments small,
.dd-file-records small {
  font-size: 10px;
  color: #627d6d;
}
.dd-empty {
  padding: 30px;
  text-align: center;
  color: #547663;
}
.dd-sidebar {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 19px;
}
.dd-analysis {
  background: #fff;
  border: 1px solid #d8e4ef;
  border-radius: 13px;
  padding: 18px;
  border-top: 4px solid #3a75d6;
}
.dd-analysis header {
  display: flex;
  gap: 8px;
  align-items: center;
}
.dd-analysis header i {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  background: #e4edff;
  color: #2865ce;
  border-radius: 8px;
}
.dd-analysis h3 {
  font-size: 16px;
  margin: 0;
}
.dd-analysis header > span {
  margin-left: auto;
  font-size: 10px;
  color: #6d8196;
}
.dd-analysis-stage {
  display: flex;
  justify-content: space-between;
  margin: 18px 0 8px;
  font-size: 12px;
}
.dd-analysis-stage strong {
  color: #1c835c;
}
.dd-analysis-progress {
  height: 5px;
  border-radius: 5px;
  background: #e4ece8;
  overflow: hidden;
}
.dd-analysis-progress span {
  display: block;
  height: 100%;
  background: #08996b;
  border-radius: 5px;
}
.dd-analysis h4 {
  margin: 16px 0 6px;
  font-size: 12px;
  color: #335848;
}
.dd-analysis p {
  margin: 0;
  font-size: 12px;
  line-height: 1.8;
  color: #50695f;
  overflow-wrap: anywhere;
}
.dd-next {
  display: flex;
  gap: 8px;
  margin-top: 15px;
  padding: 12px;
  background: #eaf3ff;
  border-radius: 8px;
  color: #336bb8;
}
.dd-next strong {
  font-size: 12px;
}
.dd-next p {
  color: #446381;
  font-size: 11px;
  margin-top: 3px;
}
.dd-ai {
  border: 1px solid #c5e1d4;
  border-top: 4px solid #08a779;
  border-radius: 13px;
  padding: 18px;
  background: linear-gradient(150deg, #fff, #f1faf5);
}
.dd-ai > header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  color: #087556;
}
.dd-ai small {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.5px;
}
.dd-ai h3 {
  font-size: 22px;
  line-height: 1.3;
  margin: 3px 0 0;
  color: #123c30;
}
.dd-ai > header > svg {
  width: 25px;
  height: 25px;
  color: #079c70;
}
.dd-employee-card {
  background: linear-gradient(#e0f2e9, #fff);
  border: 1px solid #b9dfcb;
  border-radius: 12px;
  padding: 12px;
}
.dd-employee {
  width: 100%;
  border: 0;
  background: none;
  text-align: left;
  padding: 0 0 15px;
  gap: 10px !important;
}
.dd-employee img {
  width: 44px;
  height: 48px;
  object-fit: cover;
  border: 3px solid white;
  border-radius: 12px;
  box-shadow: 0 4px 9px #31534320;
}
.dd-employee > span {
  flex: 1;
}
.dd-employee strong {
  display: block;
  font-size: 15px;
  color: #153d32;
}
.dd-employee small {
  display: block;
  font-size: 10px;
  letter-spacing: 0;
  font-weight: 400;
  color: #527967;
  margin-top: 3px;
}
.dd-suggestion {
  width: 100%;
  padding: 12px 10px;
  gap: 8px !important;
  text-align: left;
  border: 1px solid #d5e5dd;
  border-radius: 9px;
  background: white;
  color: #244b3c;
  margin-top: 9px;
  font-size: 12px !important;
  line-height: 1.7 !important;
}
.dd-suggestion > i {
  display: grid;
  place-items: center;
  color: #087f5c;
}
.dd-suggestion > span {
  flex: 1;
}
.dd-suggestion > svg {
  width: 13px;
}
.dd-suggestion.primary {
  background: #087c5c;
  border-color: #087c5c;
  color: white;
}
.dd-suggestion.primary > i {
  color: #ffe28b;
}
.dd-suggestion:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px #174f3515;
}
@media (max-width: 900px) {
  .deal-detail {
    grid-template-columns: minmax(0, 1fr) 270px;
    gap: 16px;
  }
  .dd-activity-section {
    padding: 14px;
  }
  .dd-metrics {
    gap: 6px;
  }
  .dd-metrics > label,
  .dd-metrics > div {
    padding: 9px;
  }
  .dd-metrics strong {
    font-size: 18px;
  }
}
@media (max-width: 700px) {
  .deal-detail {
    grid-template-columns: 1fr;
  }
  .dd-sidebar {
    display: grid;
    grid-template-columns: 1fr;
  }
  .dd-title {
    font-size: 20px !important;
  }
  .dd-progress > button,
  .dd-progress > span {
    font-size: 10px;
    padding: 0 6px;
  }
  .dd-metrics {
    grid-template-columns: 1fr 1fr;
  }
  .dd-metrics > div {
    grid-column: 1/-1;
  }
  .dd-event header > div {
    gap: 3px;
  }
  .dd-section-heading h3 {
    font-size: 15px;
  }
}
.dd-resource-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid #edf1ef;
}
.dd-resource-links button {
  border: 1px solid #d2e1f5;
  border-radius: 6px;
  background: #edf4ff;
  color: #2764b5;
  padding: 5px 8px;
  font-size: 12px;
}
.dd-resource-links button:hover {
  background: #dfecff;
}
.dd-resource-links button svg:last-child {
  width: 12px;
  height: 12px;
}
.dd-resource-links small {
  font-size: 10px;
  color: #788c80;
}
.dd-resource-preview {
  padding: 10px 0 18px;
  color: #335747;
}
.dd-resource-preview h3 {
  margin: 16px 0;
  font-size: 19px;
}
.dd-resource-preview p {
  padding: 12px;
  background: #f0f7f3;
  border-radius: 7px;
}
.dd-resource-preview small {
  color: #738779;
}
</style>
