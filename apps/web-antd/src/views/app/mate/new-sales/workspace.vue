<script setup lang="ts">
import { computed, reactive, ref, watch, onBeforeUnmount } from "vue";
import { mockDelay } from "#/api/mock-data";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import {
  ConfigProvider,
  Drawer,
  Dropdown,
  Menu,
  MenuItem,
  Modal,
  message,
  theme,
} from "ant-design-vue";
import { mockMateEmployees } from "#/api/mock-data-mate";
import type { SalesRecord } from "#/types/new-sales";
import {
  salesDb as db,
  addSales,
  convertLead,
  money,
} from "#/api/mock-new-sales";
import { salesRole, canManageCustomer, transferCustomer } from "./access";
import "./workspace.css";
import SalesCopilot from "./copilot.vue";
import "./customer-detail.css";
import "./customer-hub.css";
import "./pipeline.css";

const props = defineProps<{ drawerOnly?: boolean; customerId?: string }>();
const route = useRoute();
const router = useRouter();
const isHub = computed(() => route.path.endsWith("/customers"));
const today = "2026-11-02";
const role = salesRole;
const scope = ref(role.value === "sales" ? "我的客户" : "团队客户");
const tab = ref("customers");
const search = ref("");
const owner = ref("");
const region = ref("");
const grade = ref("");
const lifecycle = ref("");
const selected = ref<SalesRecord>();
const detail = ref(false);
const aiOpen = ref(!isHub.value);
const agent = ref("销售助理");
const prompt = ref("");
const reply = ref("");
const person = ref("");
const note = ref("");
const recording = ref("");
const applied = ref(false);
const converting = ref<SalesRecord>();
const createFirstDeal = ref(true);
const newDeal = ref(false);
const dealDraft = reactive({ name: "", amount: 0 });
const info: Record<
  string,
  { region: string; city: string; grade: string; last: string; it: string }
> = {
  c1: {
    region: "山东大区",
    city: "山东 · 济南",
    grade: "S",
    last: "2026-10-28",
    it: "ERP / 企业微信 / 设备网关",
  },
  c2: {
    region: "华东大区",
    city: "江苏 · 苏州",
    grade: "A",
    last: "2026-10-29",
    it: "WMS / 钉钉 / 移动工单",
  },
  c3: {
    region: "山东大区",
    city: "山东 · 青岛",
    grade: "A",
    last: "2026-10-12",
    it: "院内服务系统，待核实接口",
  },
  c4: {
    region: "华东大区",
    city: "浙江 · 杭州",
    grade: "B",
    last: "2026-10-08",
    it: "待调研",
  },
  c5: {
    region: "华东大区",
    city: "上海",
    grade: "B",
    last: "2026-10-15",
    it: "门店 POS / 企业微信",
  },
  c6: {
    region: "山东大区",
    city: "山东 · 烟台",
    grade: "S",
    last: "2026-10-23",
    it: "MES / 智能工单",
  },
};
function meta(c: SalesRecord) {
  return (
    info[c.id] || {
      region: c.owner === "林悦" ? "山东大区" : "华东大区",
      city: "待完善",
      grade: "B",
      last: today,
      it: "待调研",
    }
  );
}
function lastDate(c: SalesRecord) {
  return (
    db.activities
      .filter((a) => a.customerId === c.id)
      .map((a) => a.date || "")
      .concat(meta(c).last)
      .sort()
      .at(-1) || today
  );
}
function stale(c: SalesRecord) {
  return (Date.parse(today) - Date.parse(lastDate(c))) / 86400000 > 15;
}
const views = computed(() =>
  role.value === "director"
    ? [
        "我的客户",
        "团队客户",
        "山东大区",
        "华东大区",
        "成交老客",
        "超过15天未跟进",
      ]
    : ["我的客户", "成交老客", "超过15天未跟进"],
);
const base = computed(() =>
  db.customers.filter(
    (c) => role.value === "director" || c.owner === "韩立" || !c.owner,
  ),
);
const scoped = computed(() =>
  base.value.filter((c) =>
    scope.value === "我的客户"
      ? c.owner === "韩立"
      : scope.value === "公海客户"
        ? !c.owner
        : scope.value === "成交老客"
          ? c.status === "合作客户"
          : scope.value === "超过15天未跟进"
            ? stale(c)
            : scope.value.endsWith("大区")
              ? meta(c).region === scope.value
              : true,
  ),
);
const customers = computed(() =>
  scoped.value.filter(
    (c) =>
      (tab.value === "public" ? !c.owner : !!c.owner) &&
      (!search.value || `${c.name}${c.contact || ""}`.includes(search.value)) &&
      (!owner.value || c.owner === owner.value) &&
      (!region.value || meta(c).region === region.value) &&
      (!grade.value || meta(c).grade === grade.value) &&
      (!lifecycle.value || c.status === lifecycle.value),
  ),
);
const leadBase = computed(() =>
  db.leads.filter(
    (l) => role.value === "director" || l.owner === "韩立" || !l.owner,
  ),
);
const leadViewMatch = (l: SalesRecord, view: string) =>
  ["已转客户", "我的已转客户"].includes(view)
    ? l.status === "已转化" && (view !== "我的已转客户" || l.owner === "韩立")
    : l.status !== "已转化" &&
      (view === "待领取"
        ? !l.owner
        : view !== "我的线索" || l.owner === "韩立");
const leads = computed(() =>
  leadBase.value.filter(
    (l) =>
      leadViewMatch(l, scope.value) &&
      (!owner.value || l.owner === owner.value) &&
      (!search.value ||
        `${l.customerName}${l.name}${l.contact}${l.phone || ""}`.includes(
          search.value,
        )),
  ),
);

const hubPage = ref(1);
const hubPageSize = ref(5);
const checkedIds = ref<string[]>([]);
const hubRows = computed(() =>
  tab.value === "leads" ? leads.value : customers.value,
);
const hubPages = computed(() =>
  Math.max(1, Math.ceil(hubRows.value.length / hubPageSize.value)),
);
const hubPageRows = computed(() =>
  hubRows.value.slice(
    (hubPage.value - 1) * hubPageSize.value,
    hubPage.value * hubPageSize.value,
  ),
);
const checkedRows = computed(() =>
  hubRows.value.filter((r) => checkedIds.value.includes(r.id)),
);
const allHubChecked = computed(
  () =>
    hubPageRows.value.length > 0 &&
    hubPageRows.value.every((r) => checkedIds.value.includes(r.id)),
);
const someHubChecked = computed(
  () =>
    !allHubChecked.value &&
    hubPageRows.value.some((r) => checkedIds.value.includes(r.id)),
);
const hubEmployee = ref("new-sales-assistant");
const hubEmployees = computed(() =>
  mockMateEmployees.filter((e) =>
    ["new-sales-assistant", "meeting-assistant", "project-assistant"].includes(
      e.id,
    ),
  ),
);
const hubAssistant = computed(() =>
  hubEmployees.value.find((e) => e.id === hubEmployee.value),
);
const hubDeleteOpen = ref(false);
const hubSendOpen = ref(false);
const hubInstruction = ref("请整理这些客户的需求与下一步跟进建议。");
function toggleHubRow(id: string) {
  checkedIds.value = checkedIds.value.includes(id)
    ? checkedIds.value.filter((x) => x !== id)
    : [...checkedIds.value, id];
}
function toggleHubPage() {
  const ids = hubPageRows.value.map((r) => r.id);
  checkedIds.value = allHubChecked.value
    ? checkedIds.value.filter((id) => !ids.includes(id))
    : [...new Set([...checkedIds.value, ...ids])];
}
watch(
  [tab, scope, search, owner, region, grade, lifecycle, role, hubPageSize],
  () => {
    hubPage.value = 1;
    checkedIds.value = [];
    hubDeleteOpen.value = false;
    hubSendOpen.value = false;
  },
);
watch(
  () => hubRows.value.map((r) => r.id).join(","),
  () => {
    hubPage.value = Math.min(hubPage.value, hubPages.value);
    checkedIds.value = checkedIds.value.filter((id) =>
      hubRows.value.some((r) => r.id === id),
    );
  },
);
const canBatchSend = computed(
  () =>
    checkedRows.value.length > 0 &&
    checkedRows.value.every((r) =>
      tab.value === "leads"
        ? role.value === "director" || r.owner === "韩立"
        : canManageCustomer(r),
    ),
);
const canBatchDelete = computed(
  () =>
    canBatchSend.value &&
    checkedRows.value.every((r) =>
      tab.value === "leads"
        ? r.status !== "已转化"
        : !db.deals.some((d) => d.customerId === r.id),
    ),
);
function exportHub() {
  const cell = (v: unknown) => {
    let t = String(v ?? "");
    if (/^[=+@\-\t\r]/.test(t)) t = "'" + t;
    return '"' + t.replace(/"/g, '""') + '"';
  };
  const rows = [
    ["名称", "联系人", "电话", "行业/来源", "状态", "归属人", "需求描述"],
    ...checkedRows.value.map((r) => [
      r.customerName || r.name,
      r.contact,
      r.phone,
      r.industry || r.source,
      r.status,
      r.owner,
      r.note,
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + rows.map((r) => r.map(cell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = tab.value === "leads" ? "线索导出.csv" : "客户导出.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  message.success(`已导出 ${checkedRows.value.length} 条记录`);
}
function deleteHub() {
  if (!canBatchDelete.value) return;
  const ids = new Set(checkedRows.value.map((r) => r.id));
  const rows = tab.value === "leads" ? db.leads : db.customers;
  for (let i = rows.length - 1; i >= 0; i--)
    if (ids.has(rows[i]!.id)) rows.splice(i, 1);
  if (tab.value !== "leads") {
    for (const collection of [db.contacts, db.activities, db.tasks])
      for (let i = collection.length - 1; i >= 0; i--)
        if (ids.has(collection[i]!.customerId || "")) collection.splice(i, 1);
  }
  checkedIds.value = [];
  hubDeleteOpen.value = false;
  detail.value = false;
  selected.value = undefined;
  message.success("已删除演示记录，刷新可恢复");
}
function sendHub() {
  if (!canBatchSend.value || !hubInstruction.value.trim()) return;
  const text =
    hubInstruction.value.trim() +
    "\n\n" +
    checkedRows.value
      .map(
        (r, i) =>
          `${i + 1}. ${r.customerName || r.name}｜联系人：${r.contact || "待补充"}｜状态：${r.status}\n需求：${r.note || "待补充"}`,
      )
      .join("\n\n");
  void router.push({
    path:
      hubEmployee.value === "new-sales-assistant"
        ? "/app/mate/employee/new-sales-assistant/sales/chat"
        : `/app/mate/employee/${hubEmployee.value}/project-chat`,
    query:
      hubEmployee.value === "new-sales-assistant"
        ? { prompt: text, context: "general", fresh: "1" }
        : { prefill: text },
  });
}
const hubViews = computed(() =>
  tab.value === "leads"
    ? role.value === "sales"
      ? ["我的线索", "待领取", "我的已转客户"]
      : ["我的线索", "全部待处理", "已转客户"]
    : role.value === "sales"
      ? ["我的客户"]
      : ["我的客户", "团队客户"],
);
function switchHubTab(value: string) {
  tab.value = value;
  scope.value =
    value === "leads"
      ? role.value === "sales"
        ? "我的线索"
        : "全部待处理"
      : value === "public"
        ? "团队客户"
        : role.value === "sales"
          ? "我的客户"
          : "团队客户";
  resetFilters();
}
function claimLead(l: SalesRecord) {
  if (l.owner || l.status === "已转化") return;
  l.owner = "韩立";
  l.status = "待联系";
  message.success("已领取到我的线索");
}
async function copyLeadPhone(l: SalesRecord) {
  if (!l.phone) return;
  try {
    await navigator.clipboard.writeText(l.phone);
    message.success("电话已复制");
  } catch {
    message.warning("复制失败，请手动复制电话");
  }
}
function startConvert(l: SalesRecord) {
  if (l.status === "已转化") return;
  createFirstDeal.value = true;
  converting.value = l;
}
function showConverted(l: SalesRecord) {
  const c = db.customers.find((c) => c.id === l.customerId);
  if (c) {
    tab.value = "customers";
    scope.value = "团队客户";
    resetFilters();
    select(c, true);
  }
}
function leadIntent(l: SalesRecord) {
  const score = scores[l.id] || (l.note?.length ? 72 : 55);
  return {
    score,
    label: score >= 85 ? "高意向" : score >= 65 ? "中意向" : "待培育",
    tone: score >= 85 ? "high" : score >= 65 ? "medium" : "low",
    tag: /预算|核实/.test(l.note || "")
      ? "待核实预算"
      : /产线|门店|仓库|设备/.test(l.note || "")
        ? "需求明确"
        : "待补充信息",
  };
}
const deals = computed(() =>
  db.deals.filter((d) => scoped.value.some((c) => c.id === d.customerId)),
);
const openDeals = computed(() =>
  deals.value.filter((d) => !["赢单", "输单"].includes(d.status)),
);
const tasks = computed(() =>
  db.tasks.filter(
    (t) =>
      t.status !== "已完成" &&
      (t.date || "") <= today &&
      scoped.value.some((c) => c.id === t.customerId),
  ),
);
const won = computed(() =>
  deals.value.filter(
    (d) => d.status === "赢单" && d.date?.startsWith("2026-11"),
  ),
);
const revenue = computed(() =>
  won.value.reduce((sum, d) => sum + (d.amount || 0), 0),
);
const target = computed(() =>
  role.value === "sales" || scope.value === "我的客户"
    ? 500000
    : scope.value.endsWith("大区")
      ? 800000
      : 1600000,
);
const repeatRevenue = computed(() =>
  won.value
    .filter((d) => d.category === "复购")
    .reduce((sum, d) => sum + (d.amount || 0), 0),
);
const contacts = computed(() =>
  db.contacts.filter((p) => p.customerId === selected.value?.id),
);
const customerDeals = computed(() =>
  db.deals.filter((d) => d.customerId === selected.value?.id),
);
const timeline = computed(() =>
  db.activities
    .filter((a) => a.customerId === selected.value?.id)
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || "")),
);
const stages = ["需求确认", "方案/POC", "商务报价", "合同谈判"];
const brief = computed(() =>
  [
    ...scoped.value
      .filter((c) => c.id === "c2")
      .map((c) => ({
        customer: c,
        kind: "续费机会",
        icon: "lucide:repeat-2",
        title: "维保服务还有 15 天到期",
        desc: "远航物流 · 已有 2 个仓库在用",
        action: "生成复购商机",
        type: "renew",
      })),
    ...scoped.value
      .filter((c) => c.id === "c1")
      .map((c) => ({
        customer: c,
        kind: "商机推进",
        icon: "lucide:target",
        title: "演示前，先补齐决策链",
        desc: "华达科技 · 采购审批流程待确认",
        action: "准备沟通提纲",
        type: "message",
      })),
    ...scoped.value
      .filter((c) => stale(c))
      .slice(0, 1)
      .map((c) => ({
        customer: c,
        kind: "跟进提醒",
        icon: "lucide:clock-3",
        title: "超过 15 天没有新跟进",
        desc: `${c.name} · 上次联系 ${lastDate(c).slice(5)}`,
        action: "生成唤醒话术",
        type: "message",
      })),
  ].slice(0, 3),
);
watch(role, () => {
  scope.value =
    tab.value === "leads"
      ? role.value === "sales"
        ? "我的线索"
        : "全部待处理"
      : tab.value === "public"
        ? "团队客户"
        : role.value === "sales"
          ? "我的客户"
          : "团队客户";
  owner.value = "";
  assigning.value = undefined;
  converting.value = undefined;
  customerOpen.value = false;
  newDeal.value = false;
  selected.value = undefined;
  detail.value = false;
  reply.value = "";
});
watch(
  scope,
  () => {
    selected.value = undefined;
    detail.value = false;
    reply.value = "";
  },
  { flush: "sync" },
);
watch(isHub, () => {
  aiOpen.value = !isHub.value;
  detail.value = false;
  search.value = "";
});
watch(
  selected,
  () => {
    person.value = "";
    prompt.value = "";
  },
  { flush: "sync" },
);
watch(
  tab,
  () => {
    selected.value = undefined;
    reply.value = "";
  },
  { flush: "sync" },
);
watch([selected, agent], () => {
  reply.value = "";
  applied.value = false;
});
function select(c: SalesRecord, open = false) {
  if (!canManageCustomer(c)) {
    message.info(c.owner ? "无权访问该客户" : "请先领取客户");
    return;
  }
  selected.value = c;
  detail.value = open;
  note.value = "";
  recording.value = "";
  person.value = "";
}
function customerFor(id?: string) {
  return db.customers.find((c) => c.id === id);
}
function completeTask(t: SalesRecord) {
  t.status = "已完成";
  addSales("activities", {
    name: `完成：${t.name}`,
    customerId: t.customerId,
    owner: t.owner,
    status: "已记录",
    date: today,
    note: "销售手动完成待办",
    category: "人工跟进",
  });
  message.success("已完成，并同步到客户时间轴");
}
function openAgent(name: string, c?: SalesRecord, p = "", contact = "") {
  if (c && !canManageCustomer(c)) {
    message.info("请先领取客户");
    return;
  }
  selected.value = c;
  agent.value = name;
  aiOpen.value = true;
  prompt.value = p;
  person.value = contact;
  reply.value = "";
}
function renew(c: SalesRecord) {
  select(c, true);
  detailSection.value = "deals";
  dealDraft.name = `${c.name} · 二期增购`;
  dealDraft.amount = 0;
  newDeal.value = true;
}
function saveDeal() {
  if (
    !selected.value ||
    !dealDraft.name.trim() ||
    !Number.isFinite(Number(dealDraft.amount)) ||
    Number(dealDraft.amount) < 0
  )
    return;
  addSales("deals", {
    name: dealDraft.name.trim(),
    customerId: selected.value.id,
    owner: selected.value.owner || "韩立",
    status: "需求确认",
    amount: Number(dealDraft.amount),
    category: "复购",
    date: today,
  });
  addSales("activities", {
    name: "发起复购商机",
    customerId: selected.value.id,
    owner: "韩立",
    status: "已记录",
    date: today,
    note: dealDraft.name,
  });
  newDeal.value = false;
  message.success("复购商机已创建");
}
function confirmConvert() {
  const l = converting.value;
  if (!l) return;
  const existing = db.customers.find((c) => c.name === l.customerName);
  if (role.value === "sales" && existing && !canManageCustomer(existing)) {
    message.warning("该客户需由总监协调归属，不能直接转换");
    return;
  }
  const c = convertLead(l, createFirstDeal.value);
  converting.value = undefined;
  if (c) {
    tab.value = "customers";
    scope.value = role.value === "sales" ? "我的客户" : "团队客户";
    search.value = "";
    owner.value = "";
    region.value = "";
    grade.value = "";
    lifecycle.value = "";
    select(c, true);
    message.success(
      createFirstDeal.value
        ? "客户、联系人与首笔商机已关联"
        : "客户与联系人已关联",
    );
  }
}
function saveNote() {
  if (!selected.value || !note.value.trim()) return;
  const c = selected.value;
  const content = note.value.trim();
  const activity = addSales("activities", {
    name: "客户跟进",
    customerId: c.id,
    dealId: noteDeal.value || undefined,
    note: content,
    contact: noteContact.value || undefined,
    owner: "韩立",
    status: "已记录",
    category: "人工跟进",
    date: today,
  });
  if (syncProfile.value) {
    c.profile = content;
    confirmedProfiles[c.id] = false;
    addSales("tasks", {
      name: `跟进：${content.slice(0, 32)}`,
      customerId: c.id,
      dealId: noteDeal.value || undefined,
      owner: c.owner || "韩立",
      status: "待完成",
      date: today,
      note: content,
    });
    activityEffects[activity.id] = ["已同步客户摘要", "已创建跟进待办"];
  }
  note.value = "";
  message.success("跟进已记录");
}
function fileSelected(file?: File) {
  if (!file) return;
  if (!file.type.startsWith("audio/")) {
    message.warning("请选择录音文件");
    return;
  }
  recording.value = file.name;
  if (detail.value) {
    message.info("已选择录音，本地演示暂不转写；请填写跟进内容");
    return;
  }
  openAgent(
    "会议助理",
    selected.value,
    `整理录音「${file.name}」。请补充文字纪要：`,
  );
}
function onFile(e: Event) {
  fileSelected((e.target as HTMLInputElement).files?.[0]);
}
function onDrop(e: DragEvent) {
  fileSelected(e.dataTransfer?.files?.[0]);
}
function resetFilters() {
  search.value = "";
  owner.value = "";
  region.value = "";
  grade.value = "";
  lifecycle.value = "";
}
const scores: Record<string, number> = { l1: 92, l2: 78, l3: 65, l4: 86 };

const timelineView = ref("全部");
const noteDeal = ref("");
const noteContact = ref("");
const syncProfile = ref(false);
const confirmedProfiles = reactive<Record<string, boolean>>({});
const activityEffects = reactive<Record<string, string[]>>({});
const detailOpenDeals = computed(() =>
  customerDeals.value.filter((d) => !["赢单", "输单"].includes(d.status)),
);
const detailWonDeals = computed(() =>
  customerDeals.value.filter((d) => d.status === "赢单"),
);
const detailAmount = computed(() =>
  detailOpenDeals.value.reduce((sum, d) => sum + (d.amount || 0), 0),
);
const lifetimeAmount = computed(() =>
  detailWonDeals.value.reduce((sum, d) => sum + (d.amount || 0), 0),
);
const filteredTimeline = computed(() =>
  timeline.value.filter(
    (a) =>
      timelineView.value === "全部" ||
      (timelineView.value === "Agent 同步"
        ? a.owner === "数字员工"
        : timelineView.value === "阶段变更"
          ? a.category === "阶段变更"
          : a.owner !== "数字员工" && a.category !== "阶段变更"),
  ),
);
const daysSinceContact = computed(() =>
  selected.value
    ? Math.max(
        0,
        Math.floor(
          (Date.parse(today) - Date.parse(lastDate(selected.value))) / 86400000,
        ),
      )
    : 0,
);
const sourceRecord = computed(
  () =>
    timeline.value.find(
      (a) => selected.value?.profile && a.note === selected.value.profile,
    ) ||
    timeline.value.find((a) => a.category === "会议") ||
    timeline.value.at(-1),
);
const painTags = computed(() =>
  selected.value?.id === "c1"
    ? ["多厂区协同", "工单与台账割裂"]
    : selected.value?.id === "c2"
      ? ["跨区域派单", "移动端执行"]
      : ["业务需求梳理", "决策链待补齐"],
);
function roleTag(p: SalesRecord) {
  return p.role?.includes("技术")
    ? "技术评估"
    : p.role?.includes("采购")
      ? "商务把关"
      : p.role?.includes("总监")
        ? "业务负责人"
        : "角色待核实";
}
function stageIndex(d: SalesRecord) {
  return d.status === "赢单" ? 5 : Math.max(1, stages.indexOf(d.status) + 1);
}
function confirmProfile() {
  if (!selected.value) return;
  confirmedProfiles[selected.value.id] = true;
  addSales("activities", {
    name: "客户画像已核对",
    customerId: selected.value.id,
    owner: "韩立",
    date: today,
    status: "已记录",
    category: "人工跟进",
    note: "已核对现有痛点与需求摘要；预算、竞品及最终决策人仍待核实。",
  });
  message.success("已确认现有画像，待核实项保持标注");
}
function assignOwner(e: Event) {
  if (!selected.value || role.value !== "director") return;
  transferCustomer(selected.value, (e.target as HTMLSelectElement).value);
  message.success("客户归属已更新");
}
watch(selected, () => {
  timelineView.value = "全部";
  noteDeal.value = "";
  noteContact.value = "";
  syncProfile.value = false;
});

const detailSection = ref("profile");
const detailMenus = [
  { key: "profile", label: "画像", icon: "lucide:contact-round" },
  { key: "deals", label: "商机", icon: "lucide:handshake" },
  { key: "contacts", label: "联系人", icon: "lucide:users-round" },
  { key: "calendar", label: "跟进日历", icon: "lucide:calendar-days" },
  { key: "events", label: "事件记录", icon: "lucide:history" },
];
const calendarMonth = ref(today.slice(0, 7));
const calendarDay = ref(today);
const scheduleOpen = ref(false);
const scheduleDraft = reactive({
  name: "",
  date: today,
  time: "10:00",
  category: "会议",
  note: "",
});
const calendarItems = computed(() => [
  ...db.tasks
    .filter((t) => t.customerId === selected.value?.id)
    .map((t) => ({
      id: t.id,
      date: t.date || "",
      name: t.name,
      type: t.category || "跟进",
      status: t.status,
      owner: t.owner,
      note: t.note || "",
      planned: true,
    })),
  ...db.activities
    .filter((t) => t.customerId === selected.value?.id)
    .map((t) => ({
      id: t.id,
      date: t.date || "",
      name: t.name,
      type: t.category || "跟进",
      status: "已记录",
      owner: t.owner,
      note: t.note || "",
      planned: false,
    })),
]);
const dayItems = computed(() =>
  calendarItems.value.filter((i) => i.date === calendarDay.value),
);
const upcomingItems = computed(() =>
  calendarItems.value
    .filter((i) => i.planned && i.status !== "已完成" && i.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date)),
);
const monthLabel = computed(() => {
  const [y, m] = calendarMonth.value.split("-");
  return `${y} 年 ${Number(m)} 月`;
});
const calendarCells = computed(() => {
  const first = new Date(calendarMonth.value + "-01T00:00:00Z");
  const offset = (first.getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(first);
    date.setUTCDate(i - offset + 1);
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      day: date.getUTCDate(),
      current: key.startsWith(calendarMonth.value),
      count: calendarItems.value.filter((a) => a.date === key).length,
    };
  });
});
function changeMonth(step: number) {
  const d = new Date(calendarMonth.value + "-01T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + step);
  calendarMonth.value = d.toISOString().slice(0, 7);
  calendarDay.value = calendarMonth.value + "-01";
}
function chooseDay(day: string) {
  calendarDay.value = day;
  calendarMonth.value = day.slice(0, 7);
}
function startSchedule() {
  scheduleDraft.name = "";
  scheduleDraft.date = calendarDay.value;
  scheduleDraft.time = "10:00";
  scheduleDraft.category = "会议";
  scheduleDraft.note = "";
  scheduleOpen.value = true;
}
function saveSchedule() {
  if (!selected.value || !scheduleDraft.name.trim() || !scheduleDraft.date)
    return;
  addSales("tasks", {
    name: scheduleDraft.name.trim(),
    customerId: selected.value.id,
    owner: selected.value.owner || "韩立",
    status: "待完成",
    date: scheduleDraft.date,
    category: scheduleDraft.category,
    note: `${scheduleDraft.time} · ${scheduleDraft.note}`,
  });
  chooseDay(scheduleDraft.date);
  scheduleOpen.value = false;
  message.success("跟进安排已加入日历");
}
function finishSchedule(id: string) {
  const task = db.tasks.find((t) => t.id === id);
  if (task) completeTask(task);
}
watch(detail, (open) => {
  if (open) {
    detailSection.value = "profile";
    calendarDay.value = today;
    calendarMonth.value = today.slice(0, 7);
  }
});

const filtersOpen = ref(false);
const activeFilterCount = computed(
  () =>
    [owner.value, region.value, grade.value, lifecycle.value].filter(Boolean)
      .length,
);
const customerOpen = ref(false);
const assigning = ref<SalesRecord>();
const assignmentOwner = ref("韩立");
const customerDraft = reactive({
  name: "",
  need: "",
  opportunity: "",
  amount: 0,
  industry: "其他",
  grade: "A",
  region: "山东大区",
  city: "",
  contact: "",
  contactRole: "",
  contactEmail: "",
  phone: "",
  owner: "韩立",
});
function customerPipeline(c: SalesRecord) {
  return db.deals.filter(
    (d) => d.customerId === c.id && !["赢单", "输单"].includes(d.status),
  );
}
function primaryContact(c: SalesRecord) {
  return (
    db.contacts.find((p) => p.customerId === c.id && p.name === c.contact) ||
    db.contacts.find((p) => p.customerId === c.id)
  );
}
function latestActivity(c: SalesRecord) {
  return db.activities
    .filter((a) => a.customerId === c.id)
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];
}
function daysAway(c: SalesRecord) {
  return Math.max(
    0,
    Math.floor((Date.parse(today) - Date.parse(lastDate(c))) / 86400000),
  );
}
function avatarStyle(c: SalesRecord) {
  const palette = [
    ["#E2E8F0", "#52687d"],
    ["#FEF3C7", "#9a7835"],
    ["#CCFBF1", "#377c71"],
    ["#EDE9F4", "#7d6897"],
    ["#F6E7E1", "#a07462"],
  ];
  const map: Record<string, number> = {
    智能制造: 0,
    物流运输: 1,
    医疗健康: 2,
    能源: 3,
    零售: 4,
  };
  const i =
    map[c.industry || ""] ??
    Array.from(c.name).reduce((v, x) => v + x.charCodeAt(0), 0) % 5;
  return { background: palette[i]![0], color: palette[i]![1] };
}
function startCustomer() {
  miningRun++;
  inputMode.value = "smart";
  customerDescription.value = "";
  miningProgress.value = 0;
  miningBusy.value = false;
  miningReady.value = false;
  Object.assign(customerDraft, {
    name: "",
    need: "",
    opportunity: "",
    amount: 0,
    industry: "其他",
    grade: "A",
    region: "山东大区",
    city: "",
    contact: "",
    contactRole: "",
    contactEmail: "",
    phone: "",
    owner: "韩立",
  });
  customerOpen.value = true;
}
function saveCustomer() {
  if (!customerDraft.name.trim()) return;
  if (db.customers.some((c) => c.name === customerDraft.name.trim())) {
    message.warning("该客户已存在，请搜索已有档案");
    return;
  }
  const c = addSales("customers", {
    name: customerDraft.name.trim(),
    industry: customerDraft.industry,
    region: customerDraft.region,
    owner: role.value === "sales" ? "韩立" : customerDraft.owner,
    status: "潜在客户",
    contact: customerDraft.contact,
    phone: customerDraft.phone,
    date: today,
    source: inputMode.value === "smart" ? "智能建档（模拟）" : "手动建档",
    note: customerDraft.need,
    profile: customerDraft.need,
  });
  info[c.id] = {
    region: customerDraft.region,
    city: customerDraft.city || "待完善",
    grade: customerDraft.grade,
    last: today,
    it: "待调研",
  };
  if (customerDraft.contact.trim())
    addSales("contacts", {
      name: customerDraft.contact.trim(),
      customerId: c.id,
      phone: customerDraft.phone,
      role: customerDraft.contactRole,
      email: customerDraft.contactEmail,
      owner: c.owner,
      status: "在职",
    });
  if (customerDraft.opportunity.trim())
    addSales("deals", {
      name: customerDraft.opportunity.trim(),
      customerId: c.id,
      customerName: c.name,
      amount: Number(customerDraft.amount) || 0,
      owner: c.owner,
      status: "需求确认",
      date: today,
      note: customerDraft.need,
    });
  customerOpen.value = false;
  tab.value = "customers";
  scope.value = role.value === "sales" ? "我的客户" : "团队客户";
  resetFilters();
  message.success("客户已创建");
}
function claimCustomer(c: SalesRecord) {
  if (c.owner) return;
  transferCustomer(c, "韩立");
  message.success("已领取，客户及其商机统一归属本人");
}
function saveAssignment() {
  if (!assigning.value) return;
  transferCustomer(
    assigning.value,
    role.value === "sales" ? "韩立" : assignmentOwner.value,
  );
  assigning.value = undefined;
  message.success("销售已分配");
}

const inputMode = ref("smart");
const customerDescription = ref("");
const miningProgress = ref(0);
const miningBusy = ref(false);
const miningReady = ref(false);
const miningSteps = [
  "识别客户描述",
  "提取客户信息",
  "整理商机需求",
  "补全客户档案",
];
let miningRun = 0;
function viewCount(view: string) {
  if (tab.value === "leads")
    return leadBase.value.filter((l) => leadViewMatch(l, view)).length;
  const rows =
    tab.value === "leads"
      ? db.leads.filter(
          (c) => role.value === "director" || c.owner === "韩立" || !c.owner,
        )
      : base.value;
  return rows.filter((c) =>
    view === "我的客户"
      ? c.owner === "韩立"
      : view === "公海客户"
        ? !c.owner
        : !!c.owner,
  ).length;
}
function extractPerson(text: string) {
  const name =
    text.match(
      /(?:联系人|姓名)[：:\s]*([\u4e00-\u9fa5A-Za-z·]{2,12}?)(?=[，,；;\s\d]|$)/,
    )?.[1] ||
    text
      .trim()
      .split(/[，,；;\s]/)[0]
      ?.replace(/^(联系人|姓名)[：:]?/, "") ||
    "";
  return {
    name,
    role:
      text.match(
        /(?:采购经理|采购总监|技术总监|技术经理|总经理|信息中心主任|运营总监|项目经理|工程师|负责人|销售经理)/,
      )?.[0] || "",
    phone: text.match(/1[3-9]\d{9}|0\d{2,3}[- ]?\d{7,8}/)?.[0] || "",
    email: text.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] || "",
  };
}
async function mineCustomer() {
  const text = customerDescription.value.trim();
  if (!text || miningBusy.value) return;
  const run = ++miningRun;
  miningReady.value = false;
  miningBusy.value = true;
  miningProgress.value = 5;
  for (const step of [25, 50, 75, 95]) {
    await mockDelay(500);
    if (run !== miningRun) return;
    miningProgress.value = step;
  }
  const name =
    text.match(
      /(?:客户名称|公司名称|客户|公司)[：:]\s*([^，,。；;\n]+)/,
    )?.[1] ||
    text
      .split(/[，,。；;\n]/)[0]
      ?.replace(/^(客户是|客户叫|新增客户|帮我新增|新增|一家)/, "")
      .trim() ||
    "";
  const personText = text.match(/(?:联系人|姓名)[：:\s]*[^。\n]+/)?.[0];
  const person = personText
    ? extractPerson(personText)
    : { name: "", phone: "", role: "", email: "" };
  const amount = text.match(
    /(?:预算|金额|预计)[约为是：:\s]*(\d+(?:\.\d+)?)\s*(万元|万|元)?/,
  );
  const need = text.match(/(?:计划|希望|需要|需求[：:]?)([^。\n]+)/)?.[0] || "";
  Object.assign(customerDraft, {
    name,
    industry: /制造|工厂|巡检/.test(text)
      ? "智能制造"
      : /物流|仓储/.test(text)
        ? "物流运输"
        : /医疗|医院/.test(text)
          ? "医疗健康"
          : /能源|电力/.test(text)
            ? "能源"
            : /零售|门店/.test(text)
              ? "零售"
              : "其他",
    city:
      text.match(
        /山东济南|山东青岛|山东烟台|江苏苏州|浙江杭州|上海|北京|济南|青岛|杭州|苏州|深圳|广州/,
      )?.[0] || "",
    region: /上海|江苏|浙江|苏州|杭州/.test(text) ? "华东大区" : "山东大区",
    contact: person.name,
    contactRole: person.role,
    contactEmail: person.email,
    phone: person.phone,
    need: need || text,
    opportunity: need
      ? `${name} · ${need.replace(/^(计划|希望|需要|需求[：:]?)/, "").slice(0, 24)}`
      : "",
    amount: amount
      ? Number(amount[1]) * (amount[2]?.includes("万") ? 10000 : 1)
      : 0,
  });
  miningProgress.value = 100;
  miningReady.value = true;
  miningBusy.value = false;
}
watch(customerOpen, (open) => {
  if (!open) {
    miningRun++;
    miningBusy.value = false;
  }
});
watch(customerDescription, () => {
  if (!miningBusy.value) {
    miningReady.value = false;
    miningProgress.value = 0;
  }
});
const contactOpen = ref(false);
const contactDescription = ref("");
const contactBusy = ref(false);
const contactCandidates = ref<
  { name: string; role: string; phone: string; email: string }[]
>([]);
let contactRun = 0;
let contactCustomerId = "";
function startContacts() {
  contactCustomerId = selected.value?.id || "";
  contactDescription.value = "";
  contactCandidates.value = [];
  contactOpen.value = true;
}
async function extractContacts() {
  if (!contactDescription.value.trim() || contactBusy.value) return;
  const run = ++contactRun;
  const input = contactDescription.value;
  contactBusy.value = true;
  await mockDelay(850);
  if (run !== contactRun) return;
  contactCandidates.value = input
    .split(/[\n；;]+/)
    .map((x) => extractPerson(x.trim()))
    .filter((c) => c.name);
  contactBusy.value = false;
}
function saveContacts() {
  const customer = db.customers.find((c) => c.id === contactCustomerId);
  if (
    !customer ||
    !contactCandidates.value.length ||
    contactCandidates.value.some((c) => !c.name.trim())
  )
    return;
  let added = 0;
  for (const c of contactCandidates.value) {
    if (
      db.contacts.some(
        (p) =>
          p.customerId === customer.id &&
          (p.name === c.name.trim() || (c.phone && p.phone === c.phone)),
      )
    )
      continue;
    addSales("contacts", {
      ...c,
      name: c.name.trim(),
      customerId: customer.id,
      owner: customer.owner,
      status: "在职",
      source: "智能录入（模拟）",
    });
    added++;
  }
  if (!customer.contact && added) {
    customer.contact = contactCandidates.value[0]!.name;
    customer.phone = contactCandidates.value[0]!.phone;
  }
  message.success(
    added ? `已添加 ${added} 位联系人` : "联系人已存在，未重复添加",
  );
  contactOpen.value = false;
}
watch(contactDescription, () => {
  if (!contactBusy.value) contactCandidates.value = [];
});
watch(contactOpen, (open) => {
  if (!open) {
    contactRun++;
    contactBusy.value = false;
  }
});
onBeforeUnmount(() => {
  miningRun++;
  contactRun++;
});
watch(
  () =>
    props.customerId || (!props.drawerOnly ? route.query.customer : undefined),
  (id) => {
    if (typeof id === "string") {
      const c = db.customers.find((c) => c.id === id);
      if (c) select(c, true);
    }
  },
  { immediate: true },
);
</script>

<template>
  <ConfigProvider
    :inherit="false"
    :theme="{
      algorithm: theme.defaultAlgorithm,
      token: { colorPrimary: '#238873', borderRadius: 8 },
    }"
  >
    <section
      v-if="!props.drawerOnly"
      class="sx-shell"
      :class="{ 'ai-visible': aiOpen }"
    >
      <main class="sx-main" :class="{ 'sx-hub': isHub }">
        <header v-if="!isHub" class="sx-page-heading">
          <div>
            <span class="sx-eyebrow">{{
              isHub ? "CUSTOMER HUB" : "COMMAND CENTER"
            }}</span>
            <h1>{{ isHub ? "客户中心" : "销售工作台" }}</h1>
          </div>
          <div class="sx-actions">
            <label class="sx-role"
              ><Icon icon="lucide:users-round" /><select
                v-model="role"
                aria-label="切换演示角色"
              >
                <option value="director">销售总监</option>
                <option value="sales">销售 · 韩立</option>
              </select></label
            ><button
              class="sx-ai-toggle"
              :aria-expanded="aiOpen"
              @click="aiOpen = !aiOpen"
            >
              <Icon icon="lucide:sparkles" />AI 建议<Icon
                :icon="
                  aiOpen
                    ? 'lucide:panel-right-close'
                    : 'lucide:panel-right-open'
                "
              />
            </button>
          </div>
        </header>
        <header v-if="isHub" class="hx-heading">
          <div class="hx-title-group">
            <h1>客户中心</h1>
            <div
              class="sx-tabs hx-main-tabs"
              role="tablist"
              aria-label="客户中心分类"
            >
              <button
                v-for="item in [
                  {
                    key: 'customers',
                    label: role === 'sales' ? '我的客户' : '团队客户',
                    count: base.filter((c) => !!c.owner).length,
                    icon: 'lucide:building-2',
                  },
                  {
                    key: 'leads',
                    label: '线索池',
                    count: leadBase.length,
                    icon: 'lucide:radar',
                  },
                  {
                    key: 'public',
                    label: '客户公海',
                    count: base.filter((c) => !c.owner).length,
                    icon: 'lucide:globe-2',
                  },
                ]"
                :key="item.key"
                role="tab"
                :aria-selected="tab === item.key"
                :class="{ active: tab === item.key }"
                @click="switchHubTab(item.key)"
              >
                <Icon :icon="item.icon" />{{ item.label
                }}<small>{{ item.count }}</small>
              </button>
            </div>
          </div>
          <div class="hx-header-actions">
            <select v-model="role" aria-label="切换演示角色">
              <option value="director">销售总监</option>
              <option value="sales">销售 · 韩立</option></select
            ><button
              class="hx-ai-button"
              :aria-expanded="aiOpen"
              @click="aiOpen = !aiOpen"
            >
              <Icon icon="lucide:sparkles" />AI</button
            ><button
              v-if="tab !== 'leads'"
              class="sx-primary"
              @click="startCustomer"
            >
              <Icon icon="lucide:plus" />新建客户
            </button>
          </div>
        </header>
        <nav v-if="!isHub" class="sx-views" aria-label="保存的视图">
          <button
            v-for="v in views.filter(
              (v) =>
                tab !== 'leads' ||
                !isHub ||
                !['成交老客', '超过15天未跟进'].includes(v),
            )"
            :key="v"
            :class="{ active: scope === v }"
            :aria-pressed="scope === v"
            @click="scope = v"
          >
            {{ v }}
          </button>
        </nav>

        <template v-if="!isHub">
          <div class="sx-section-title">
            <h2><Icon icon="lucide:sparkles" />数字员工晨报</h2>
            <span>11 月 2 日 · 星期一 <i>演示数据</i></span>
          </div>
          <div class="sx-brief-grid">
            <article
              v-for="(b, i) in brief"
              :key="b.customer.id"
              class="sx-brief"
            >
              <div class="sx-brief-top">
                <span :class="['sx-mark', 'tone-' + i]"
                  ><Icon :icon="b.icon" /></span
                ><span>{{ b.kind }}</span
                ><span class="sx-dot" />
              </div>
              <h3>{{ b.title }}</h3>
              <p>{{ b.desc }}</p>
              <footer>
                <button
                  class="sx-text-button"
                  @click="
                    b.type === 'renew'
                      ? renew(b.customer)
                      : openAgent('消息助手', b.customer, b.action)
                  "
                >
                  {{ b.action }}<Icon icon="lucide:arrow-up-right" /></button
                ><button
                  v-if="b.type === 'renew'"
                  class="sx-icon-button"
                  aria-label="起草续费提醒"
                  @click="openAgent('消息助手', b.customer, '起草维保续费提醒')"
                >
                  <Icon icon="lucide:mail" />
                </button>
              </footer>
            </article>
            <div v-if="!brief.length" class="sx-empty">
              当前视图暂无高优先级建议
            </div>
          </div>
          <div class="sx-dashboard-grid">
            <section class="sx-card sx-today">
              <div class="sx-section-title">
                <h2>
                  今日聚焦 <span class="sx-count">{{ tasks.length }}</span>
                </h2>
                <button
                  class="sx-text-button"
                  @click="
                    openAgent(
                      '会议助理',
                      selected,
                      '整理刚结束的会议，提取待办',
                    )
                  "
                >
                  <Icon icon="lucide:mic" />导入会议
                </button>
              </div>
              <div v-for="t in tasks" :key="t.id" class="sx-task">
                <button
                  class="sx-check"
                  :aria-label="'完成' + t.name"
                  @click="completeTask(t)"
                >
                  <Icon icon="lucide:check" /></button
                ><button
                  class="sx-task-title"
                  @click="
                    customerFor(t.customerId) &&
                    select(customerFor(t.customerId)!, true)
                  "
                >
                  <strong>{{ t.name }}</strong
                  ><small
                    >{{ customerFor(t.customerId)?.name }} ·
                    {{ t.owner }}</small
                  ></button
                ><span
                  :class="[
                    'sx-tag',
                    (t.date || '') < today ? 'amber' : 'green',
                  ]"
                  >{{ (t.date || "") < today ? "逾期" : "今天" }}</span
                >
              </div>
              <p v-if="!tasks.length" class="sx-empty">今日待办已全部处理</p>
              <footer class="sx-card-footer">完成后自动同步客户时间轴</footer>
            </section>
            <section class="sx-card sx-target">
              <div class="sx-section-title">
                <h2>本月目标</h2>
                <span>11 月</span>
              </div>
              <div class="sx-target-number">
                {{ (revenue / 10000).toFixed(1)
                }}<small>/ {{ target / 10000 }} 万</small
                ><span>{{ Math.round((revenue / target) * 100) }}%</span>
              </div>
              <div class="sx-progress">
                <span
                  :style="{
                    width: Math.min(100, (revenue / target) * 100) + '%',
                  }"
                />
              </div>
              <div class="sx-mini-stats">
                <div>
                  <small>新签</small
                  ><strong>{{ money(revenue - repeatRevenue) }}</strong>
                </div>
                <div>
                  <small>老客复购</small
                  ><strong>{{ money(repeatRevenue) }}</strong>
                </div>
              </div>
              <div class="sx-target-note">
                {{ scope }} · 按本月已赢单金额统计
              </div>
            </section>
            <section class="sx-card sx-pipeline">
              <div class="sx-section-title">
                <h2>在途商机</h2>
                <span
                  >{{ openDeals.length }} 笔 ·
                  {{
                    money(openDeals.reduce((s, d) => s + (d.amount || 0), 0))
                  }}</span
                >
              </div>
              <div class="sx-funnel">
                <button
                  v-for="stage in stages"
                  :key="stage"
                  @click="
                    openAgent(
                      '销售助理',
                      undefined,
                      `分析${stage}阶段：${
                        openDeals
                          .filter((d) => d.status === stage)
                          .map((d) => d.name)
                          .join('、') || '暂无商机'
                      }`,
                    )
                  "
                >
                  <span>{{ stage }}</span
                  ><strong
                    >{{ openDeals.filter((d) => d.status === stage).length
                    }}<small> 笔</small></strong
                  >
                  <div
                    :style="{
                      width:
                        Math.max(
                          6,
                          (openDeals.filter((d) => d.status === stage).length /
                            Math.max(1, openDeals.length)) *
                            100,
                        ) + '%',
                    }"
                  />
                </button>
              </div>
            </section>
          </div>
        </template>

        <template v-else>
          <div class="hx-toolbar">
            <nav
              v-if="tab !== 'public'"
              class="hx-view-tabs hx-customer-tabs"
              role="tablist"
              aria-label="客户归属视图"
            >
              <button
                v-for="(v, index) in hubViews"
                :key="v"
                :class="{ active: scope === v }"
                role="tab"
                :aria-selected="scope === v"
                @click="scope = v"
              >
                <Icon
                  :icon="
                    [
                      'lucide:user-round',
                      'lucide:globe-2',
                      'lucide:building-2',
                    ][index] || 'lucide:users'
                  "
                />
                {{ v }} <span class="hx-tab-count">{{ viewCount(v) }}</span>
              </button>
            </nav>
            <div v-if="tab === 'public'" class="lh-public-heading">
              <Icon icon="lucide:globe-2" /><strong>待领取客户</strong
              ><span>{{ base.filter((c) => !c.owner).length }}</span>
            </div>
            <div class="hx-search-tools">
              <label class="sx-search"
                ><Icon icon="lucide:search" /><input
                  v-model="search"
                  placeholder="搜索客户、联系人"
                  aria-label="搜索公司或联系人" /></label
              ><button
                class="hx-filter-toggle"
                :class="{ active: filtersOpen }"
                :aria-expanded="filtersOpen"
                @click="filtersOpen = !filtersOpen"
              >
                <Icon icon="lucide:sliders-horizontal" />筛选<span
                  v-if="activeFilterCount"
                  >{{ activeFilterCount }}</span
                >
              </button>
            </div>
          </div>
          <div v-if="filtersOpen" class="sx-filters hx-expanded-filters">
            <select
              v-if="role === 'director'"
              v-model="owner"
              aria-label="归属销售"
            >
              <option value="">全部销售</option>
              <option>韩立</option>
              <option v-if="role === 'director'">林悦</option></select
            ><template v-if="tab !== 'leads'"
              ><select v-model="region" aria-label="区域">
                <option value="">全部区域</option>
                <option>山东大区</option>
                <option>华东大区</option></select
              ><select v-model="grade" aria-label="客户等级">
                <option value="">客户等级</option>
                <option>S</option>
                <option>A</option>
                <option>B</option>
                <option>C</option></select
              ><select v-model="lifecycle" aria-label="生命周期">
                <option value="">生命周期</option>
                <option>合作客户</option>
                <option>潜在客户</option>
              </select></template
            ><button
              class="sx-icon-button"
              aria-label="重置筛选"
              @click="resetFilters"
            >
              <Icon icon="lucide:rotate-ccw" />
            </button>
          </div>
          <div class="hub-table-wrap">
            <table class="hub-single-table">
              <thead>
                <tr>
                  <th class="hub-check">
                    <input
                      type="checkbox"
                      aria-label="选择本页全部记录"
                      :checked="allHubChecked"
                      :indeterminate="someHubChecked"
                      @change="toggleHubPage"
                    />
                  </th>
                  <th>{{ tab === "leads" ? "线索公司" : "客户名称" }}</th>
                  <th>{{ tab === "leads" ? "初步需求" : "行业" }}</th>
                  <th>联系人</th>
                  <th>电话</th>
                  <th>{{ tab === "leads" ? "AI 意向" : "在途商机" }}</th>
                  <th>{{ tab === "leads" ? "来源" : "生命周期" }}</th>
                  <th>{{ tab === "leads" ? "状态" : "最近跟进" }}</th>
                  <th>归属人</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="r in hubPageRows"
                  :key="r.id"
                  :class="{ 'is-checked': checkedIds.includes(r.id) }"
                >
                  <td class="hub-check">
                    <input
                      type="checkbox"
                      :aria-label="`选择${r.customerName || r.name}`"
                      :checked="checkedIds.includes(r.id)"
                      @change="toggleHubRow(r.id)"
                    />
                  </td>
                  <td>
                    <div class="hub-name">
                      <span
                        class="hub-avatar"
                        :style="
                          avatarStyle({ ...r, name: r.customerName || r.name })
                        "
                        >{{ (r.customerName || r.name).slice(0, 1) }}</span
                      ><button
                        v-if="tab !== 'leads'"
                        :title="r.name"
                        @click="select(r, true)"
                      >
                        {{ r.name }}</button
                      ><strong v-else :title="r.customerName || r.name">{{
                        r.customerName || r.name
                      }}</strong
                      ><span
                        v-if="tab !== 'leads'"
                        :class="['hx-grade', 'grade-' + meta(r).grade]"
                        >{{ meta(r).grade }}</span
                      >
                    </div>
                  </td>
                  <td :title="tab === 'leads' ? r.name : r.industry">
                    {{ tab === "leads" ? r.name : r.industry || "待完善" }}
                  </td>
                  <td>
                    {{
                      tab === "leads"
                        ? r.contact || "待补充"
                        : primaryContact(r)?.name || r.contact || "待补充"
                    }}
                  </td>
                  <td
                    class="hub-phone"
                    :title="tab === 'leads' ? '点击复制电话' : undefined"
                    @click="tab === 'leads' && copyLeadPhone(r)"
                  >
                    {{
                      tab === "leads"
                        ? r.phone || "待补充"
                        : primaryContact(r)?.phone || r.phone || "待补充"
                    }}
                  </td>
                  <td>
                    <span
                      v-if="tab === 'leads'"
                      class="lh-intent"
                      :class="leadIntent(r).tone"
                      title="演示意向评分"
                      >{{ leadIntent(r).label }} {{ leadIntent(r).score }}</span
                    ><span v-else class="hub-amount"
                      >{{
                        money(
                          customerPipeline(r).reduce(
                            (sum, d) => sum + (d.amount || 0),
                            0,
                          ),
                        )
                      }}
                      <small>({{ customerPipeline(r).length }})</small></span
                    >
                  </td>
                  <td>
                    <span v-if="tab === 'leads'">{{
                      r.source || "待补充"
                    }}</span
                    ><span
                      v-else
                      :class="[
                        'hx-lifecycle',
                        r.status === '合作客户' ? 'signed' : 'prospect',
                      ]"
                      ><i />{{
                        r.status === "合作客户"
                          ? "签约老客"
                          : customerPipeline(r).length
                            ? "商机跟进中"
                            : "潜在客户"
                      }}</span
                    >
                  </td>
                  <td>
                    <span v-if="tab === 'leads'">{{
                      r.status === "已转化" ? "已转客户" : r.status
                    }}</span
                    ><span v-else-if="stale(r)" class="hx-risk-pill"
                      >{{ daysAway(r) }}天未跟进</span
                    ><span v-else>{{
                      r.source === "手动建档" && !latestActivity(r)
                        ? "尚未跟进"
                        : daysAway(r) === 0
                          ? "今天"
                          : daysAway(r) + "天前"
                    }}</span>
                  </td>
                  <td>
                    <span v-if="r.owner">{{ r.owner }}</span
                    ><button
                      v-else
                      class="hub-claim"
                      @click="
                        tab === 'leads'
                          ? claimLead(r)
                          : role === 'sales'
                            ? claimCustomer(r)
                            : (assigning = r)
                      "
                    >
                      {{
                        role === "director" && tab !== "leads"
                          ? "分配销售"
                          : "领取"
                      }}
                    </button>
                  </td>
                  <td>
                    <button
                      v-if="tab !== 'leads'"
                      class="hub-detail"
                      @click="select(r, true)"
                    >
                      详情<Icon icon="lucide:arrow-right" /></button
                    ><button
                      v-else
                      class="hub-detail"
                      @click="
                        r.status === '已转化'
                          ? showConverted(r)
                          : startConvert(r)
                      "
                    >
                      {{ r.status === "已转化" ? "查看客户" : "转为客户" }}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="!hubRows.length" class="sx-empty">
              暂无符合条件的记录
            </div>
          </div>
          <div class="dp-pagination">
            <span>共 {{ hubRows.length }} 条</span
            ><label
              >每页<select
                v-model.number="hubPageSize"
                aria-label="每页记录数量"
              >
                <option :value="5">5</option>
                <option :value="10">10</option>
                <option :value="20">20</option></select
              >条</label
            ><button
              aria-label="上一页"
              :disabled="hubPage === 1"
              @click="hubPage--"
            >
              <Icon icon="lucide:chevron-left" /></button
            ><span>{{ hubPage }} / {{ hubPages }}</span
            ><button
              aria-label="下一页"
              :disabled="hubPage === hubPages"
              @click="hubPage++"
            >
              <Icon icon="lucide:chevron-right" />
            </button>
          </div>
          <div
            v-if="checkedRows.length"
            class="dp-batch-bar hub-batch"
            role="toolbar"
            aria-label="客户批量操作"
          >
            <div>
              <b>{{ checkedRows.length }}</b
              >条已选择
            </div>
            <button class="dp-batch-action" @click="exportHub">
              <Icon icon="lucide:download" /><span>导出</span></button
            ><button
              class="dp-batch-action danger"
              :disabled="!canBatchDelete"
              :title="
                canBatchDelete
                  ? '删除所选记录'
                  : '仅可删除有管理权限且未关联商机的客户或未转化线索'
              "
              @click="hubDeleteOpen = true"
            >
              <Icon icon="lucide:trash-2" /><span>删除</span></button
            ><span class="dp-batch-divider" /><Dropdown
              :trigger="['click']"
              placement="top"
              ><button class="dp-assistant-picker" aria-label="切换助理">
                <img :src="hubAssistant?.avatar" alt="" /><span>{{
                  hubAssistant?.name
                }}</span
                ><Icon icon="lucide:chevron-down" /></button
              ><template #overlay
                ><Menu
                  :selected-keys="[hubEmployee]"
                  @click="({ key }) => (hubEmployee = String(key))"
                  ><MenuItem v-for="e in hubEmployees" :key="e.id"
                    ><span class="dp-assistant-option"
                      ><img :src="e.avatar" alt="" />{{ e.name }}</span
                    ></MenuItem
                  ></Menu
                ></template
              ></Dropdown
            ><button
              class="dp-batch-action"
              :disabled="!canBatchSend"
              title="公海记录领取后可发送"
              @click="hubSendOpen = true"
            >
              <Icon icon="lucide:send" /><span>发送给助理</span></button
            ><button aria-label="取消选择" @click="checkedIds = []">
              <Icon icon="lucide:x" />
            </button>
          </div>
          <footer class="sx-list-footer">
            <span
              >共
              {{ (tab === "leads" ? leads : customers).length }}
              条记录</span
            ><span>本地演示 · 角色切换仅模拟数据视图</span>
          </footer>
        </template>
      </main>

      <SalesCopilot
        v-if="aiOpen && !detail"
        :selected="selected"
        :scope="scope"
        :person="person"
        :prompt="prompt"
        @close="aiOpen = false"
      />
    </section>

    <Modal
      v-model:open="hubDeleteOpen"
      title="删除所选记录"
      ok-text="删除"
      cancel-text="取消"
      :ok-button-props="{ danger: true }"
      @ok="deleteHub"
      ><p>
        删除选中的 {{ checkedRows.length }} 条演示记录，刷新后恢复。
      </p></Modal
    >
    <Modal
      v-model:open="hubSendOpen"
      title="发送给助理"
      ok-text="进入对话"
      cancel-text="取消"
      :ok-button-props="{ disabled: !hubInstruction.trim() }"
      @ok="sendHub"
      ><p>{{ hubAssistant?.name }} · 携带 {{ checkedRows.length }} 条记录</p>
      <label
        >处理要求<textarea
          v-model="hubInstruction"
          class="hub-instruction"
          rows="4"
        /></label
    ></Modal>
    <Drawer
      v-model:open="detail"
      placement="right"
      width="min(880px, calc(100vw - 24px))"
      :closable="false"
      :body-style="{ padding: 0, height: '100%', overflow: 'hidden' }"
      root-class-name="sx-customer-drawer"
      :z-index="1000"
      :destroy-on-close="true"
    >
      <div v-if="selected" class="sx-shell sx-drawer-shell sx-compact-drawer">
        <section class="sx-detail sx-detail-v3" aria-label="客户360度画像">
          <header class="sx-detail-heading">
            <div class="sx-identity">
              <span class="sx-company-avatar">{{
                selected.name.slice(0, 1)
              }}</span>
              <div class="sx-identity-text">
                <div class="sx-identity-line">
                  <h2>{{ selected.name }}</h2>
                  <span class="sx-status-badge priority"
                    ><Icon icon="lucide:gem" />{{ meta(selected).grade }} 类{{
                      ["S", "A"].includes(meta(selected).grade)
                        ? "重点"
                        : "客户"
                    }}</span
                  ><span
                    class="sx-status-badge"
                    :class="lifetimeAmount ? 'signed' : 'neutral'"
                    ><Icon
                      :icon="
                        lifetimeAmount
                          ? 'lucide:badge-check'
                          : 'lucide:building-2'
                      "
                    />{{
                      lifetimeAmount
                        ? "累计成交 " + money(lifetimeAmount)
                        : selected.status
                    }}</span
                  ><span
                    class="sx-status-badge"
                    :class="daysSinceContact > 15 ? 'warning' : 'healthy'"
                    ><Icon
                      :icon="
                        daysSinceContact > 15
                          ? 'lucide:triangle-alert'
                          : 'lucide:activity'
                      "
                    />{{
                      daysSinceContact > 15
                        ? daysSinceContact + " 天未联系"
                        : daysSinceContact === 0
                          ? "今日有互动"
                          : daysSinceContact + " 天前互动"
                    }}</span
                  >
                </div>
                <div class="sx-metadata">
                  <span
                    ><Icon icon="lucide:map-pin" />{{
                      meta(selected).city
                    }}</span
                  ><span
                    ><Icon icon="lucide:factory" />{{
                      selected.industry || "行业待补充"
                    }}</span
                  ><label
                    ><Icon icon="lucide:user-round" />归属<select
                      :value="selected.owner"
                      aria-label="客户归属"
                      :disabled="role === 'sales'"
                      @change="assignOwner"
                    >
                      <option value="">待分配</option>
                      <option>韩立</option>
                      <option>林悦</option>
                    </select></label
                  >
                </div>
              </div>
            </div>
            <div class="sx-header-actions">
              <button
                class="sx-icon-button sx-close"
                aria-label="关闭客户画像"
                @click="detail = false"
              >
                <Icon icon="lucide:x" />
              </button>
            </div>
          </header>
          <div class="sx-detail-body">
            <nav class="sx-detail-rail" aria-label="客户详情导航">
              <button
                v-for="item in detailMenus"
                :key="item.key"
                :class="{ active: detailSection === item.key }"
                :aria-pressed="detailSection === item.key"
                @click="detailSection = item.key"
              >
                <Icon :icon="item.icon" /><span>{{ item.label }}</span>
              </button>
            </nav>
            <div class="sx-detail-columns">
              <div
                v-if="['profile', 'contacts'].includes(detailSection)"
                class="sx-profile"
              >
                <section
                  v-if="detailSection === 'profile'"
                  class="sx-card sx-intelligence"
                >
                  <div class="sx-intelligence-heading">
                    <span class="sx-ai-emblem"
                      ><Icon icon="lucide:sparkles"
                    /></span>
                    <div>
                      <h3>AI 客情画像</h3>
                      <small>{{
                        sourceRecord
                          ? "依据：" +
                            sourceRecord.name +
                            " · " +
                            sourceRecord.date
                          : "依据：现有客户档案"
                      }}</small>
                    </div>
                    <button
                      class="sx-confirm"
                      :disabled="confirmedProfiles[selected.id]"
                      @click="confirmProfile"
                    >
                      <Icon icon="lucide:check" />{{
                        confirmedProfiles[selected.id] ? "已核对" : "确认画像"
                      }}
                    </button>
                  </div>
                  <div class="sx-pain">
                    <span class="sx-field-label">核心痛点</span>
                    <div class="sx-keywords">
                      <span v-for="tag in painTags" :key="tag">{{ tag }}</span>
                    </div>
                    <p>
                      {{
                        selected.profile ||
                        selected.note ||
                        "尚未记录需求，可通过访谈补齐。"
                      }}
                    </p>
                  </div>
                  <div class="sx-intel-metrics">
                    <div>
                      <span><Icon icon="lucide:wallet" />商机规模</span
                      ><strong>{{
                        detailAmount ? money(detailAmount) : "尚未获取"
                      }}</strong
                      ><small>{{
                        detailAmount
                          ? "在途预计金额 · 预算待核实"
                          : "建议在需求访谈中核实"
                      }}</small>
                    </div>
                    <div>
                      <span><Icon icon="lucide:swords" />竞争态势</span
                      ><strong>尚未识别</strong>
                    </div>
                  </div>
                  <div class="sx-next-action">
                    <span class="sx-field-label"
                      ><Icon icon="lucide:lightbulb" />建议下一步</span
                    >
                    <p>
                      联系{{
                        contacts[0]?.name || selected.contact || "客户负责人"
                      }}核实最终决策人，敲定一次联合需求访谈。
                    </p>
                    <div></div>
                  </div>
                </section>
                <section
                  v-if="detailSection === 'contacts'"
                  class="sx-card sx-decision-chain"
                >
                  <div class="sx-section-title">
                    <h3>
                      决策链联系人 <small>{{ contacts.length }} 位</small>
                    </h3>
                    <button class="sx-secondary" @click="startContacts">
                      <Icon icon="lucide:plus" />新增联系人
                    </button>
                  </div>
                  <div v-for="p in contacts" :key="p.id" class="sx-person-card">
                    <span class="sx-person-avatar">{{ p.name.slice(-1) }}</span>
                    <div>
                      <div class="sx-person-title">
                        <strong>{{ p.name }}</strong
                        ><span>{{ p.role || "职位待补充" }}</span>
                      </div>
                      <div class="sx-role-tags">
                        <span
                          :class="
                            roleTag(p) === '技术评估' ? 'tech' : 'business'
                          "
                          >{{ roleTag(p) }}</span
                        ><span>态度待核实</span>
                      </div>
                      <small>{{
                        p.phone || p.email || "联系方式待补充"
                      }}</small>
                    </div>
                  </div>
                  <div class="sx-missing-role">
                    <Icon icon="lucide:triangle-alert" /><span
                      ><strong>最终决策人尚未明确</strong
                      ><small>后续沟通中补齐决策链</small></span
                    >
                  </div>
                </section>
                <section
                  v-if="detailSection === 'profile'"
                  class="sx-card sx-firm"
                >
                  <h3>企业与 IT 底座</h3>
                  <dl>
                    <dt>所属行业</dt>
                    <dd>{{ selected.industry || "待补充" }}</dd>
                    <dt>企业规模</dt>
                    <dd>未核实</dd>
                    <dt>工商主体</dt>
                    <dd>未接入工商查询</dd>
                    <dt>IT 系统</dt>
                    <dd>{{ meta(selected).it }}</dd>
                  </dl>
                </section>
              </div>
              <div
                v-if="['deals', 'events'].includes(detailSection)"
                class="sx-dynamic"
              >
                <section
                  v-if="detailSection === 'deals'"
                  class="sx-card sx-opportunities"
                >
                  <div class="sx-section-title">
                    <h3>
                      商机快照
                      <span class="sx-count">{{ customerDeals.length }}</span>
                    </h3>
                    <button class="sx-text-button" @click="renew(selected)">
                      <Icon icon="lucide:plus" />新建 / 增购
                    </button>
                  </div>
                  <div class="sx-opportunity-totals">
                    <span
                      ><b>{{ detailOpenDeals.length }}</b> 笔在途
                      <strong>{{ money(detailAmount) }}</strong></span
                    ><span
                      >历史成交
                      <strong>{{ money(lifetimeAmount) }}</strong></span
                    >
                  </div>
                  <div class="sx-deal-grid">
                    <article
                      v-for="d in customerDeals"
                      :key="d.id"
                      class="sx-opportunity-card"
                    >
                      <div class="sx-deal-top">
                        <span
                          class="sx-stage-tag"
                          :class="
                            d.status === '赢单'
                              ? 'won'
                              : d.status === '评估验证'
                                ? 'evaluation'
                                : 'proposal'
                          "
                          >{{ d.status }}</span
                        ><span class="sx-deal-type">{{
                          d.category === "复购" ? "老客增购" : "首单新签"
                        }}</span>
                      </div>
                      <div class="sx-deal-value">
                        <h4>{{ d.name }}</h4>
                        <strong>{{ money(d.amount) }}</strong>
                      </div>
                      <div
                        class="sx-stage-track"
                        :aria-label="
                          d.status + '，第' + stageIndex(d) + '阶段，共5阶段'
                        "
                      >
                        <span
                          v-for="n in 5"
                          :key="n"
                          :class="{ filled: n <= stageIndex(d) }"
                        />
                      </div>
                      <div class="sx-stage-caption">
                        <span>{{
                          d.status === "赢单"
                            ? "已完成签约"
                            : "当前：" + d.status
                        }}</span
                        ><span
                          >{{ d.status === "赢单" ? "成交" : "预计" }}
                          {{ d.date?.slice(5) }}</span
                        >
                      </div>
                      <button
                        v-if="d.status === '赢单'"
                        class="sx-capsule"
                        @click="renew(selected)"
                      >
                        <Icon icon="lucide:repeat-2" />一键发起复购
                      </button>
                    </article>
                    <p v-if="!customerDeals.length" class="sx-muted">
                      尚无关联商机，点击「新建 / 增购」开始。
                    </p>
                  </div>
                </section>
                <section
                  v-if="detailSection === 'events'"
                  class="sx-followup-composer"
                  @dragover.prevent
                  @drop.prevent="onDrop"
                >
                  <div class="sx-note-links">
                    <label
                      ><Icon icon="lucide:at-sign" /><select
                        v-model="noteContact"
                        aria-label="提及联系人"
                      >
                        <option value="">提及联系人</option>
                        <option
                          v-for="p in contacts"
                          :key="p.id"
                          :value="p.name"
                        >
                          {{ p.name }}
                        </option>
                      </select></label
                    ><label
                      ><Icon icon="lucide:hash" /><select
                        v-model="noteDeal"
                        aria-label="关联商机"
                      >
                        <option value="">关联商机</option>
                        <option
                          v-for="d in customerDeals"
                          :key="d.id"
                          :value="d.id"
                        >
                          {{ d.name }}
                        </option>
                      </select></label
                    >
                  </div>
                  <textarea
                    v-model="note"
                    aria-label="跟进内容"
                    placeholder="记录这次沟通的重点，或拖入会议录音…"
                    @keydown.ctrl.enter.prevent="saveNote"
                  />
                  <div class="sx-note-toolbar">
                    <div>
                      <label class="sx-upload"
                        ><Icon icon="lucide:paperclip" />{{
                          recording || "传录音"
                        }}<input type="file" accept="audio/*" @change="onFile"
                      /></label>
                    </div>
                    <button
                      class="sx-primary"
                      :disabled="!note.trim()"
                      @click="saveNote"
                    >
                      发送记录<Icon icon="lucide:corner-down-left" />
                    </button>
                  </div>
                  <label class="sx-sync-option"
                    ><input
                      v-model="syncProfile"
                      type="checkbox"
                    />同时以本条记录更新画像摘要，并创建跟进待办</label
                  >
                </section>
                <section
                  v-if="detailSection === 'events'"
                  class="sx-card sx-history"
                >
                  <div class="sx-section-title">
                    <h3>
                      统一时间轴 <small>{{ timeline.length }}</small>
                    </h3>
                    <div class="sx-timeline-tabs">
                      <button
                        v-for="v in [
                          '全部',
                          '人工跟进',
                          'Agent 同步',
                          '阶段变更',
                        ]"
                        :key="v"
                        :class="{ active: timelineView === v }"
                        :aria-pressed="timelineView === v"
                        @click="timelineView = v"
                      >
                        {{ v }}
                      </button>
                    </div>
                  </div>
                  <div
                    v-for="a in filteredTimeline"
                    :key="a.id"
                    class="sx-history-item"
                  >
                    <span
                      class="sx-history-avatar"
                      :class="{ agent: a.owner === '数字员工' }"
                      ><Icon
                        :icon="
                          a.owner === '数字员工'
                            ? 'lucide:sparkles'
                            : a.category === '会议'
                              ? 'lucide:mic'
                              : 'lucide:user-round'
                        "
                    /></span>
                    <div class="sx-history-content">
                      <div class="sx-history-title">
                        <strong>{{ a.name }}</strong
                        ><time>{{ a.date }}</time>
                      </div>
                      <div class="sx-history-byline">
                        <span>{{
                          a.owner === "数字员工"
                            ? "数字员工 · 经人工确认入库"
                            : a.owner + " · " + (a.category || "业务动态")
                        }}</span
                        ><span v-if="a.dealId"
                          >#
                          {{
                            db.deals.find((d) => d.id === a.dealId)?.name
                          }}</span
                        ><span v-if="a.contact">@ {{ a.contact }}</span>
                      </div>
                      <p>{{ a.note }}</p>
                      <div v-if="activityEffects[a.id]" class="sx-effect-tags">
                        <span
                          v-for="effect in activityEffects[a.id]"
                          :key="effect"
                          ><Icon icon="lucide:check" />{{ effect }}</span
                        >
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="!filteredTimeline.length"
                    class="sx-timeline-empty"
                  >
                    <Icon icon="lucide:messages-square" />暂无{{
                      timelineView === "全部" ? "跟进" : timelineView
                    }}记录
                  </div>
                </section>
              </div>

              <section
                v-if="detailSection === 'calendar'"
                class="sx-calendar-panel"
              >
                <header class="sx-panel-title">
                  <div>
                    <h3>跟进日历</h3>
                    <small>会议、拜访与客户互动</small>
                  </div>
                  <button class="sx-primary" @click="startSchedule">
                    <Icon icon="lucide:plus" />新建安排
                  </button>
                </header>
                <section class="sx-card sx-calendar">
                  <div class="sx-calendar-toolbar">
                    <h3>{{ monthLabel }}</h3>
                    <div>
                      <button
                        class="sx-icon-button"
                        aria-label="上个月"
                        @click="changeMonth(-1)"
                      >
                        <Icon icon="lucide:chevron-left" /></button
                      ><button class="sx-text-button" @click="chooseDay(today)">
                        今天</button
                      ><button
                        class="sx-icon-button"
                        aria-label="下个月"
                        @click="changeMonth(1)"
                      >
                        <Icon icon="lucide:chevron-right" />
                      </button>
                    </div>
                  </div>
                  <div class="sx-weekdays">
                    <span
                      v-for="day in ['一', '二', '三', '四', '五', '六', '日']"
                      :key="day"
                      >{{ day }}</span
                    >
                  </div>
                  <div class="sx-calendar-grid">
                    <button
                      v-for="cell in calendarCells"
                      :key="cell.key"
                      :class="{
                        selected: calendarDay === cell.key,
                        muted: !cell.current,
                        today: cell.key === today,
                      }"
                      :aria-label="cell.key + '，' + cell.count + '条记录'"
                      :aria-pressed="calendarDay === cell.key"
                      @click="chooseDay(cell.key)"
                    >
                      <span>{{ cell.day }}</span
                      ><small v-if="cell.count">{{ cell.count }} 项</small>
                    </button>
                  </div>
                </section>
                <section class="sx-card">
                  <div class="sx-section-title">
                    <h3>
                      {{ calendarDay }} <small>{{ dayItems.length }} 项</small>
                    </h3>
                    <span>当日跟进</span>
                  </div>
                  <article
                    v-for="item in dayItems"
                    :key="item.id"
                    class="sx-agenda-item"
                  >
                    <span class="sx-agenda-icon"
                      ><Icon
                        :icon="
                          item.type === '拜访'
                            ? 'lucide:map-pin'
                            : item.type === '会议'
                              ? 'lucide:video'
                              : 'lucide:message-square'
                        "
                    /></span>
                    <div>
                      <strong>{{ item.name }}</strong
                      ><small
                        >{{ item.type }} · {{ item.owner }} ·
                        {{ item.status }}</small
                      >
                      <p v-if="item.note">{{ item.note }}</p>
                    </div>
                    <button
                      v-if="item.planned && item.status !== '已完成'"
                      class="sx-text-button"
                      @click="finishSchedule(item.id)"
                    >
                      完成
                    </button>
                  </article>
                  <p v-if="!dayItems.length" class="sx-calendar-empty">
                    当天暂无安排或跟进记录
                  </p>
                </section>
                <section class="sx-card">
                  <h3>
                    未来待跟进 <small>{{ upcomingItems.length }}</small>
                  </h3>
                  <button
                    v-for="item in upcomingItems"
                    :key="item.id"
                    class="sx-upcoming-item"
                    @click="chooseDay(item.date)"
                  >
                    <span>{{ item.date.slice(5) }}</span>
                    <div>
                      <strong>{{ item.name }}</strong
                      ><small>{{ item.type }} · {{ item.note }}</small>
                    </div>
                    <Icon icon="lucide:arrow-up-right" />
                  </button>
                  <p v-if="!upcomingItems.length" class="sx-calendar-empty">
                    暂无未来安排，可新建会议或拜访
                  </p>
                </section>
              </section>
            </div>
          </div>
        </section>
      </div>
    </Drawer>

    <Drawer
      v-model:open="customerOpen"
      title="新增客户"
      width="min(620px, calc(100vw - 24px))"
      root-class-name="sx-customer-drawer sx-intake-drawer"
      :mask-closable="!miningBusy"
    >
      <div class="intake-mode" role="tablist" aria-label="输入模式">
        <button
          role="tab"
          :aria-selected="inputMode === 'smart'"
          :class="{ active: inputMode === 'smart' }"
          :disabled="miningBusy"
          @click="inputMode = 'smart'"
        >
          <Icon icon="lucide:sparkles" /><span
            >智能模式<small>描述需求，自动补全</small></span
          >
        </button>
        <button
          role="tab"
          :aria-selected="inputMode === 'manual'"
          :class="{ active: inputMode === 'manual' }"
          :disabled="miningBusy"
          @click="inputMode = 'manual'"
        >
          <Icon icon="lucide:keyboard" /><span
            >传统模式<small>逐项填写客户资料</small></span
          >
        </button>
      </div>
      <section v-if="inputMode === 'smart'" class="intake-smart">
        <label for="customer-description">描述客户与商机</label>
        <textarea
          id="customer-description"
          v-model="customerDescription"
          :disabled="miningBusy"
          placeholder="例如：青禾科技，位于山东济南，做智能制造。联系人张宁，采购经理，13800138000。计划升级设备巡检系统，预计预算20万元。"
          rows="7"
        />
        <div class="intake-description-footer">
          <span>支持直接粘贴沟通记录</span
          ><button
            class="sx-primary"
            :disabled="!customerDescription.trim() || miningBusy"
            @click="mineCustomer"
          >
            <Icon icon="lucide:sparkles" />{{
              miningBusy
                ? "正在挖掘"
                : miningReady
                  ? "重新挖掘"
                  : "开始智能挖掘"
            }}
          </button>
        </div>
        <div
          v-if="miningProgress"
          class="intake-progress"
          role="progressbar"
          aria-label="客户信息挖掘进度"
          :aria-valuenow="miningProgress"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div>
            <strong>{{
              miningReady
                ? "资料已补全，可编辑后保存"
                : miningSteps[Math.min(3, Math.floor(miningProgress / 25))]
            }}</strong
            ><span>{{ miningProgress }}%</span>
          </div>
          <div class="intake-progress-track">
            <i :style="{ width: miningProgress + '%' }" />
          </div>
          <small>演示模拟 · 基于输入提取，未联网核验</small>
        </div>
      </section>
      <div
        v-if="inputMode === 'manual' || miningReady"
        class="sx-modal-form intake-fields"
      >
        <label
          >客户名称<input
            v-model="customerDraft.name"
            placeholder="请输入公司名称"
        /></label>
        <div class="sx-schedule-fields">
          <label
            >行业<select v-model="customerDraft.industry">
              <option>智能制造</option>
              <option>物流运输</option>
              <option>医疗健康</option>
              <option>能源</option>
              <option>零售</option>
              <option>其他</option>
            </select></label
          ><label
            >客户等级<select v-model="customerDraft.grade">
              <option>S</option>
              <option>A</option>
              <option>B</option>
              <option>C</option>
            </select></label
          >
        </div>
        <div class="sx-schedule-fields">
          <label
            >区域<select v-model="customerDraft.region">
              <option>山东大区</option>
              <option>华东大区</option>
            </select></label
          ><label
            >省市<input
              v-model="customerDraft.city"
              placeholder="例如：山东济南"
          /></label>
        </div>
        <div class="sx-schedule-fields">
          <label>联系人<input v-model="customerDraft.contact" /></label
          ><label>电话<input v-model="customerDraft.phone" /></label>
        </div>
        <div class="sx-schedule-fields">
          <label>联系人职位<input v-model="customerDraft.contactRole" /></label
          ><label>邮箱<input v-model="customerDraft.contactEmail" /></label>
        </div>
        <label
          >归属销售<select
            v-model="customerDraft.owner"
            :disabled="role === 'sales'"
          >
            <option>韩立</option>
            <option v-if="role === 'director'">林悦</option>
            <option v-if="role === 'director'" value="">待分配</option>
          </select></label
        >
        <label
          >客户需求<textarea
            v-model="customerDraft.need"
            rows="3"
            placeholder="主要需求、痛点与下一步计划"
          />
        </label>
        <div class="sx-schedule-fields">
          <label
            >商机名称<input
              v-model="customerDraft.opportunity"
              placeholder="选填，填写后同步创建商机" /></label
          ><label
            >预计金额（元）<input
              v-model.number="customerDraft.amount"
              type="number"
              min="0"
          /></label>
        </div>
      </div>

      <template #footer
        ><div class="intake-footer">
          <button class="sx-secondary" @click="customerOpen = false">
            取消</button
          ><button
            class="sx-primary"
            :disabled="
              miningBusy ||
              !customerDraft.name.trim() ||
              (inputMode === 'smart' && !miningReady)
            "
            @click="saveCustomer"
          >
            保存客户<Icon icon="lucide:arrow-right" />
          </button></div
      ></template>
    </Drawer>
    <Drawer
      v-model:open="contactOpen"
      title="新增联系人"
      width="min(520px, calc(100vw - 24px))"
      root-class-name="sx-customer-drawer sx-intake-drawer"
    >
      <div class="intake-context">
        <Icon icon="lucide:building-2" />{{ selected?.name }}
      </div>
      <section class="intake-smart">
        <label for="contact-description">粘贴或输入联系人信息</label
        ><textarea
          id="contact-description"
          v-model="contactDescription"
          :disabled="contactBusy"
          rows="7"
          placeholder="每位联系人一行，例如：张宁，采购经理，13800138000，zhang@example.com"
        />
        <div class="intake-description-footer">
          <span>支持一次添加多位联系人</span
          ><button
            class="sx-primary"
            :disabled="!contactDescription.trim() || contactBusy"
            @click="extractContacts"
          >
            <Icon icon="lucide:sparkles" />{{
              contactBusy ? "正在提取…" : "AI 提取联系人"
            }}
          </button>
        </div>
      </section>
      <div v-if="contactCandidates.length" class="intake-contact-preview">
        <h3>提取结果 <small>可直接修改</small></h3>
        <div
          v-for="(c, i) in contactCandidates"
          :key="i"
          class="intake-contact-item"
        >
          <label>姓名<input v-model="c.name" /></label
          ><label>职位<input v-model="c.role" /></label
          ><label>电话<input v-model="c.phone" /></label
          ><label>邮箱<input v-model="c.email" /></label
          ><button
            class="intake-remove"
            aria-label="移除此联系人"
            @click="contactCandidates.splice(i, 1)"
          >
            <Icon icon="lucide:x" />
          </button>
        </div>
        <small>基于输入模拟提取，保存前请核对</small>
      </div>
      <template #footer
        ><div class="intake-footer">
          <button class="sx-secondary" @click="contactOpen = false">取消</button
          ><button
            class="sx-primary"
            :disabled="
              contactBusy ||
              !contactCandidates.length ||
              contactCandidates.some((c) => !c.name.trim())
            "
            @click="saveContacts"
          >
            确认添加 {{ contactCandidates.length || "" }}
          </button>
        </div></template
      >
    </Drawer>
    <Modal
      :open="!!assigning"
      title="分配销售"
      ok-text="确认分配"
      cancel-text="取消"
      @cancel="assigning = undefined"
      @ok="saveAssignment"
      ><p>{{ assigning?.name }}</p>
      <div class="sx-modal-form">
        <label
          >负责销售<select v-model="assignmentOwner">
            <option>韩立</option>
            <option>林悦</option>
          </select></label
        >
      </div></Modal
    >
    <Modal
      v-model:open="scheduleOpen"
      title="新建跟进安排"
      ok-text="加入日历"
      cancel-text="取消"
      :ok-button-props="{
        disabled: !scheduleDraft.name.trim() || !scheduleDraft.date,
      }"
      @ok="saveSchedule"
      ><div class="sx-modal-form">
        <label
          >安排主题<input
            v-model="scheduleDraft.name"
            placeholder="例如：三厂区联合需求访谈"
        /></label>
        <div class="sx-schedule-fields">
          <label>日期<input v-model="scheduleDraft.date" type="date" /></label
          ><label>时间<input v-model="scheduleDraft.time" type="time" /></label>
        </div>
        <label
          >类型<select v-model="scheduleDraft.category">
            <option>会议</option>
            <option>拜访</option>
            <option>电话</option>
            <option>其他跟进</option>
          </select></label
        ><label
          >地点 / 备注<input
            v-model="scheduleDraft.note"
            placeholder="会议地点或沟通重点"
        /></label></div
    ></Modal>
    <Modal
      :open="!!converting"
      title="转为正式客户"
      ok-text="确认转换并打开客户抽屉 →"
      cancel-text="取消"
      :width="500"
      @ok="confirmConvert"
      @cancel="converting = undefined"
    >
      <div class="lh-conversion">
        <p>确认线索有效后，自动创建或关联以下资料</p>
        <div>
          <span class="lh-conversion-icon"
            ><Icon icon="lucide:building-2"
          /></span>
          <section>
            <small>客户主体</small
            ><strong>{{ converting?.customerName || converting?.name }}</strong>
          </section>
          <span
            v-if="db.customers.some((c) => c.name === converting?.customerName)"
            class="lh-existing"
            >关联已有</span
          >
        </div>
        <div>
          <span class="lh-conversion-icon blue"
            ><Icon icon="lucide:contact"
          /></span>
          <section>
            <small>关联联系人</small
            ><strong
              >{{ converting?.contact || "待补充"
              }}<em>{{ converting?.phone || "电话待补充" }}</em></strong
            >
          </section>
        </div>
        <label class="lh-deal-check"
          ><input v-model="createFirstDeal" type="checkbox" /><span
            ><strong>创建首笔商机，在看板中跟踪</strong
            ><small>{{ converting?.name }}</small></span
          ><Icon icon="lucide:kanban" /></label
        ><small class="lh-conversion-footnote"
          >已有同名客户和联系人将自动关联，避免重复建档。</small
        >
      </div>
    </Modal>
    <Modal
      v-model:open="newDeal"
      title="新建增购 / 复购商机"
      ok-text="创建商机"
      cancel-text="取消"
      :ok-button-props="{ disabled: !dealDraft.name.trim() }"
      @ok="saveDeal"
      ><div class="sx-modal-form">
        <label>商机名称<input v-model="dealDraft.name" /></label
        ><label
          >预计金额（元）<input
            v-model="dealDraft.amount"
            type="number"
            min="0"
        /></label></div
    ></Modal>
  </ConfigProvider>
</template>
