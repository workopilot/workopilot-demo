<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
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
import { salesDb as db, addSales, money } from "#/api/mock-new-sales";
import { mockMateEmployees } from "#/api/mock-data-mate";
import type { SalesRecord } from "#/types/new-sales";
import "./customer-detail.css";
import "./customer-hub.css";
import "./pipeline.css";
import DealDetail from "./deal-detail.vue";
import CustomerWorkspace from "./workspace.vue";
const customerDrawerId = ref("");
const customerDrawerKey = ref(0);
function openCustomerDrawer(d: SalesRecord) {
  if (!canManageDeal(d)) return;
  customerDrawerId.value = d.customerId || "";
  customerDrawerKey.value++;
}
import { salesRole, canManageCustomer, canManageDeal } from "./access";
const availableCustomers = computed(() =>
  db.customers.filter((c) => !!c.owner && canManageCustomer(c)),
);
const router = useRouter();
const stages = [
  {
    name: "需求确认",
    color: "#5d8fd5",
    pale: "#edf3fc",
    icon: "lucide:scan-search",
    probability: 20,
  },
  {
    name: "方案/POC",
    color: "#9275c7",
    pale: "#f2eef9",
    icon: "lucide:presentation",
    probability: 40,
  },
  {
    name: "商务报价",
    color: "#bd9340",
    pale: "#fbf5e8",
    icon: "lucide:receipt",
    probability: 60,
  },
  {
    name: "合同谈判",
    color: "#c78364",
    pale: "#fcf0e9",
    icon: "lucide:file-pen-line",
    probability: 80,
  },
  {
    name: "赢单",
    color: "#439c7c",
    pale: "#eaf6ef",
    icon: "lucide:trophy",
    probability: 100,
  },
  {
    name: "输单",
    color: "#ac7c87",
    pale: "#f7eef0",
    icon: "lucide:archive",
    probability: 0,
  },
];
const view = ref("kanban");
const page = ref(1);
const pageSize = ref(5);
const selectedIds = ref<string[]>([]);
const batchEmployee = ref("new-sales-assistant");
const selectedEmployee = computed(() =>
  mockMateEmployees.find((e) => e.id === batchEmployee.value),
);
const employeeAvatar = (id: string) =>
  mockMateEmployees.find((e) => e.id === id)?.avatar;
const batchEmployees = [
  {
    id: "new-sales-assistant",
    name: "新销售助理",
    path: "/app/mate/employee/new-sales-assistant/sales/chat",
  },
  {
    id: "meeting-assistant",
    name: "会议助理",
    path: "/app/mate/employee/meeting-assistant/project-chat",
  },
  {
    id: "project-assistant",
    name: "项目助理",
    path: "/app/mate/employee/project-assistant/project-chat",
  },
];
const deleteOpen = ref(false);
const batchOpen = ref(false);
const batchInstruction = ref(
  "请帮我梳理这些商机的当前进展、风险和下一步跟进计划。",
);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / pageSize.value)),
);
const pageRows = computed(() =>
  filtered.value.slice(
    (page.value - 1) * pageSize.value,
    page.value * pageSize.value,
  ),
);
const selectedRows = computed(() =>
  filtered.value.filter((d) => selectedIds.value.includes(d.id)),
);
const allPageSelected = computed(
  () =>
    pageRows.value.length > 0 &&
    pageRows.value.every((d) => selectedIds.value.includes(d.id)),
);
const somePageSelected = computed(
  () =>
    !allPageSelected.value &&
    pageRows.value.some((d) => selectedIds.value.includes(d.id)),
);
function toggleRow(id: string) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((x) => x !== id)
    : [...selectedIds.value, id];
}
function togglePage() {
  const ids = pageRows.value.map((d) => d.id);
  selectedIds.value = allPageSelected.value
    ? selectedIds.value.filter((id) => !ids.includes(id))
    : [...new Set([...selectedIds.value, ...ids])];
}
function exportSelected() {
  const cell = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[=+@\-\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  };
  const rows = [
    [
      "商机名称",
      "客户",
      "商机类型",
      "预计金额",
      "阶段",
      "归属人",
      "预计成交日",
      "描述",
    ],
    ...selectedRows.value.map((d) => [
      d.name,
      customer(d)?.name,
      typeOf(d),
      d.amount,
      d.status,
      d.owner,
      d.date,
      d.note,
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + rows.map((r) => r.map(cell).join(",")).join("\r\n")], {
      type: "text/csv;charset=utf-8",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "商机导出.csv";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  message.success(`已导出 ${selectedRows.value.length} 笔商机`);
}
function deleteSelected() {
  const ids = new Set(
    selectedRows.value.filter(canManageDeal).map((d) => d.id),
  );
  for (let i = db.deals.length - 1; i >= 0; i--)
    if (ids.has(db.deals[i]!.id)) db.deals.splice(i, 1);
  selectedIds.value = [];
  deleteOpen.value = false;
  message.success(`已删除 ${ids.size} 笔演示商机，刷新可恢复`);
}
function sendBatch() {
  if (!selectedRows.value.length || !batchInstruction.value.trim()) return;
  const employee = batchEmployees.find((e) => e.id === batchEmployee.value)!;
  const text =
    `${batchInstruction.value.trim()}\n\n` +
    selectedRows.value
      .map(
        (d, i) =>
          `${i + 1}. ${d.name}｜客户：${customer(d)?.name}｜阶段：${d.status}｜预计金额：${money(d.amount || 0)}｜预计成交：${d.date || "待定"}\n描述：${d.note || "待补充"}`,
      )
      .join("\n\n");
  void router.push({
    path: employee.path,
    query:
      employee.id === "new-sales-assistant"
        ? { prompt: text, context: "general", fresh: "1" }
        : { prefill: text },
  });
}

const kind = ref("全部");
const region = ref("");
const month = ref("");
const search = ref("");
const owner = ref("");
const dragging = ref("");
const hoverStage = ref("");
const editing = ref<SalesRecord>();
const drawerOpen = ref(false);
const createOpen = ref(false);
const closing = ref<{ deal: SalesRecord; stage: string }>();
const closingNote = ref("");
const draft = reactive({
  name: "",
  customerId: "",
  amount: 0,
  category: "新签首单",
  status: "需求确认",
  owner: "王安康",
  date: "2026-11-30",
  note: "",
});
const customer = (d: SalesRecord) =>
  db.customers.find((c) => c.id === d.customerId);
const stageOf = (d: SalesRecord) =>
  stages.find((s) => s.name === d.status) || stages[0]!;
function typeOf(d: SalesRecord) {
  return /复购|增购/.test(d.category || "") ||
    (!d.category &&
      db.deals.some(
        (other) =>
          other.id !== d.id &&
          other.customerId === d.customerId &&
          other.status === "赢单" &&
          (other.date || "") <= (d.date || ""),
      ))
    ? "老客复购与增购"
    : "新签首单";
}
function regionOf(d: SalesRecord) {
  return (
    customer(d)?.region ||
    (
      {
        c1: "山东大区",
        c2: "华东大区",
        c3: "山东大区",
        c4: "华东大区",
        c5: "华东大区",
        c6: "山东大区",
      } as Record<string, string>
    )[d.customerId || ""] ||
    "待确认"
  );
}
const filtered = computed(() =>
  db.deals.filter(
    (d) =>
      canManageDeal(d) &&
      (kind.value === "全部" || typeOf(d) === kind.value) &&
      (!region.value || regionOf(d) === region.value) &&
      (!month.value || d.date?.startsWith(month.value)) &&
      (!owner.value || d.owner === owner.value) &&
      (!search.value ||
        `${d.name}${customer(d)?.name || ""}`.includes(search.value)),
  ),
);
watch([kind, region, month, owner, search, salesRole, pageSize], () => {
  page.value = 1;
  selectedIds.value = [];
});
watch(
  () => filtered.value.map((d) => d.id).join(","),
  () => {
    page.value = Math.min(page.value, pageCount.value);
    selectedIds.value = selectedIds.value.filter((id) =>
      filtered.value.some((d) => d.id === id),
    );
  },
);
function followup(d: SalesRecord) {
  const rows = db.activities.filter(
    (a) =>
      a.dealId === d.id &&
      !["商机推进", "属性变更", "商机创建", "历史摘要"].includes(
        a.category || "",
      ),
  );
  const date = rows
    .map((a) => a.date || "")
    .filter(Boolean)
    .sort()
    .at(-1);
  const days = date
    ? Math.max(
        0,
        Math.floor((Date.parse("2026-11-02") - Date.parse(date)) / 86400000),
      )
    : null;
  return {
    count: rows.length,
    date,
    days,
    label:
      days === null ? "尚未跟进" : days === 0 ? "今天跟进" : `${days}天前跟进`,
  };
}
const inStage = (name: string) =>
  filtered.value.filter((d) => d.status === name);
const owners = computed(() => [
  ...new Set(db.deals.map((d) => d.owner).filter(Boolean)),
]);
function reset() {
  kind.value = "全部";
  region.value = "";
  month.value = "";
  search.value = "";
  owner.value = "";
}
function openDeal(d?: SalesRecord, stage = "需求确认") {
  if (d) {
    if (!canManageDeal(d)) return;
    editing.value = d;
    drawerOpen.value = true;
    return;
  }
  Object.assign(draft, {
    name: "",
    customerId: "",
    amount: 0,
    category: "新签首单",
    status: stage,
    owner: "王安康",
    date: "",
    note: "",
  });
  createOpen.value = true;
}
function logChange(d: SalesRecord, from: string, note = "") {
  addSales("activities", {
    name: `商机阶段：${from} → ${d.status}`,
    customerId: d.customerId,
    dealId: d.id,
    owner: d.owner,
    status: "已记录",
    date: "2026-11-02",
    occurredAt: new Date().toISOString(),
    category: "商机推进",
    note: note || d.name,
  });
}
function changeStage(d: SalesRecord, status: string) {
  if (d.status === status) return;
  if (["赢单", "输单"].includes(status)) {
    closing.value = { deal: d, stage: status };
    closingNote.value = "";
    return;
  }
  const previous = d.status;
  d.status = status;
  d.stageEnteredAt = "2026-11-02";
  logChange(d, previous);
  message.success(`已推进至${status}`);
}
function quickClose(d: SalesRecord, status: string) {
  if (!canManageDeal(d) || d.status === status) return;
  const previous = d.status;
  d.status = status;
  d.stageEnteredAt = "2026-11-02";
  logChange(d, previous, `标记${status}`);
  message.success(`已标记${status}`);
}
function finish() {
  if (!closing.value || !closingNote.value.trim()) return;
  const { deal, stage } = closing.value;
  const previous = deal.status;
  deal.status = stage;
  deal.stageEnteredAt = "2026-11-02";
  logChange(deal, previous, closingNote.value.trim());
  closing.value = undefined;
  message.success(`已标记${stage}`);
}
function drop(stage: string) {
  const d = db.deals.find((d) => d.id === dragging.value);
  if (d) changeStage(d, stage);
  dragging.value = "";
  hoverStage.value = "";
}
function save() {
  if (
    !draft.name.trim() ||
    !draft.customerId ||
    !Number.isFinite(draft.amount) ||
    draft.amount <= 0 ||
    !draft.date
  )
    return;
  const c = availableCustomers.value.find((c) => c.id === draft.customerId);
  if (!c) {
    message.warning("请选择有权限的客户");
    return;
  }
  const d = addSales("deals", {
    ...draft,
    name: draft.name.trim(),
    owner: c?.owner || "王安康",
    category: c?.status === "合作客户" ? "老客复购与增购" : "新签首单",
    stageEnteredAt: "2026-11-02",
    historyMigrated: true,
  });
  addSales("activities", {
    name: "创建商机",
    customerId: d.customerId,
    dealId: d.id,
    owner: d.owner,
    status: "已记录",
    date: "2026-11-02",
    occurredAt: new Date().toISOString(),
    category: "商机创建",
    note: `初始阶段：${d.status} · 预计金额：${money(d.amount || 0)}${draft.note.trim() ? "\n商机描述：" + draft.note.trim() : ""}`,
  });
  createOpen.value = false;
  message.success("商机已创建");
}
function actions(d: SalesRecord) {
  if (d.status === "方案/POC")
    return [
      {
        agent: "会议助理",
        text: "生成演示议程",
        icon: "lucide:mic",
        tone: "purple",
      },
    ];
  if (d.status === "商务报价")
    return [
      {
        agent: "制度助理",
        text: "查特批折扣政策",
        icon: "lucide:scale",
        tone: "amber",
      },
      {
        agent: "消息助手",
        text: "催促报价反馈",
        icon: "lucide:mail",
        tone: "blue",
      },
    ];
  if (d.status === "合同谈判")
    return [
      {
        agent: "销售助理",
        text: "梳理签约待办",
        icon: "lucide:file-check-2",
        tone: "orange",
      },
    ];
  if (d.status === "需求确认")
    return [
      {
        agent: "销售助理",
        text: "梳理需求与决策链",
        icon: "lucide:sparkles",
        tone: "blue",
      },
    ];
  return [];
}
const handoff = ref<{ deal: SalesRecord; agent: string; text: string }>();
function collaborate(d: SalesRecord, a: { agent: string; text: string }) {
  handoff.value = { deal: d, ...a };
}
function goChat() {
  if (!handoff.value) return;
  const { deal, agent, text } = handoff.value;
  void router.push({
    path: "/app/mate/employee/new-sales-assistant/sales/chat",
    query: {
      context: deal.customerId || "general",
      fresh: "1",
      prompt: `请协同${agent}，${text}。\n商机：${deal.name}；客户：${customer(deal)?.name || ""}；阶段：${deal.status}；金额：${money(deal.amount || 0)}；预计成交：${deal.date}。\n背景：${deal.note || "待补充"}${agent === "制度助理" ? "\n请先列出需要查阅的制度与审批信息；没有制度来源时不要虚构折扣阈值。" : ""}`,
    },
  });
}
</script>
<template>
  <ConfigProvider
    :inherit="false"
    :theme="{
      algorithm: theme.defaultAlgorithm,
      token: { colorPrimary: '#216d55', borderRadius: 10 },
    }"
  >
    <section class="dp-shell" :class="{ 'dp-list-mode': view === 'list' }">
      <header class="dp-header">
        <div class="dp-title">
          <span class="dp-title-icon"><Icon icon="lucide:kanban" /></span>
          <h1>商机</h1>
          <span class="dp-count">{{ filtered.length }} 笔</span>
        </div>
        <div class="dp-view-switch" role="tablist" aria-label="商机视图">
          <button
            role="tab"
            :aria-selected="view === 'kanban'"
            :class="{ active: view === 'kanban' }"
            @click="view = 'kanban'"
          >
            <Icon icon="lucide:columns-3" />看板视图</button
          ><button
            role="tab"
            :aria-selected="view === 'list'"
            :class="{ active: view === 'list' }"
            @click="view = 'list'"
          >
            <Icon icon="lucide:list" />列表视图
          </button>
        </div>
        <button class="dp-primary" @click="openDeal()">
          <Icon icon="lucide:plus" />新建商机
        </button>
      </header>
      <div class="dp-filters">
        <div class="dp-kind" role="group" aria-label="商机类型">
          <button
            v-for="t in ['全部', '新签首单', '老客复购与增购']"
            :key="t"
            :aria-pressed="kind === t"
            :class="{ active: kind === t }"
            @click="kind = t"
          >
            <Icon
              v-if="t !== '全部'"
              :icon="t === '新签首单' ? 'lucide:sparkle' : 'lucide:repeat-2'"
            />{{ t }}
          </button>
        </div>
        <div class="dp-filter-fields">
          <label class="dp-search"
            ><Icon icon="lucide:search" /><input
              v-model="search"
              placeholder="搜索商机或客户"
              aria-label="搜索商机或客户"
          /></label>

          <label
            ><Icon icon="lucide:map-pin" /><select
              v-model="region"
              aria-label="归属区域"
            >
              <option value="">全部区域</option>
              <option>山东大区</option>
              <option>华东大区</option>
              <option>待确认</option>
            </select></label
          ><label
            ><Icon icon="lucide:calendar-days" /><input
              v-model="month"
              type="month"
              aria-label="预计成交月份" /></label
          ><label
            ><Icon icon="lucide:user-round" /><select
              v-if="salesRole === 'director'"
              v-model="owner"
              aria-label="归属销售"
            >
              <option value="">全部销售</option>
              <option v-for="name in owners" :key="name">{{ name }}</option>
            </select></label
          ><button
            v-if="kind !== '全部' || region || month || owner || search"
            class="dp-reset"
            @click="reset"
          >
            重置
          </button>
        </div>
      </div>
      <div v-if="view === 'kanban'" class="dp-board" aria-label="商机阶段看板">
        <section
          v-for="stage in stages.filter((s) => s.name !== '输单')"
          :key="stage.name"
          class="dp-column"
          :class="{ 'is-over': hoverStage === stage.name }"
          :style="{ '--stage-color': stage.color, '--stage-pale': stage.pale }"
          @dragover.prevent="hoverStage = stage.name"
          @dragleave="hoverStage = ''"
          @drop.prevent="drop(stage.name)"
        >
          <header class="dp-column-heading">
            <div>
              <Icon :icon="stage.icon" />
              <h2>{{ stage.name }}</h2>
              <span>{{ inStage(stage.name).length }}</span
              ><button
                v-if="stage.probability > 0 && stage.probability < 100"
                :aria-label="`新增${stage.name}商机`"
                @click="openDeal(undefined, stage.name)"
              >
                <Icon icon="lucide:plus" />
              </button>
            </div>
          </header>
          <div class="dp-cards">
            <article
              v-for="d in inStage(stage.name)"
              :key="d.id"
              class="dp-card dp-card-compact"
              draggable="true"
              @dragstart="dragging = d.id"
              @dragend="
                dragging = '';
                hoverStage = '';
              "
            >
              <div class="dp-compact-title">
                <button
                  class="dp-deal-name"
                  :title="d.name"
                  @click="openDeal(d)"
                >
                  {{ d.name }}</button
                ><button
                  class="dp-more"
                  :aria-label="`查看${d.name}详情与操作`"
                  @click="openDeal(d)"
                >
                  <Icon icon="lucide:ellipsis" />
                </button>
              </div>
              <div class="dp-compact-business">
                <span class="dp-compact-client" :title="customer(d)?.name"
                  ><i :style="{ background: stage.pale, color: stage.color }">{{
                    customer(d)?.name.slice(0, 1) || "客"
                  }}</i
                  >{{ customer(d)?.name || "客户待关联" }}</span
                ><span class="dp-compact-budget"
                  ><small>预算</small>{{ money(d.amount || 0) }}</span
                >
              </div>
              <div class="dp-compact-followup">
                <span
                  ><Icon icon="lucide:messages-square" />跟进
                  <b>{{ followup(d).count }}</b> 次</span
                ><span
                  :class="{
                    'is-stale':
                      followup(d).days !== null && followup(d).days! > 15,
                  }"
                  :title="
                    followup(d).date
                      ? `上次跟进：${followup(d).date}`
                      : '暂无关联此商机的跟进记录'
                  "
                  ><Icon icon="lucide:clock-3" />{{ followup(d).label }}</span
                >
              </div>
            </article>
            <div v-if="!inStage(stage.name).length" class="dp-empty-column">
              <Icon :icon="stage.icon" /><span>暂无{{ stage.name }}商机</span
              ><button
                v-if="stage.probability > 0 && stage.probability < 100"
                @click="openDeal(undefined, stage.name)"
              >
                添加商机
              </button>
            </div>
          </div>
        </section>
      </div>
      <div v-else class="dp-list-wrap">
        <table class="dp-table">
          <thead>
            <tr>
              <th class="dp-selection-cell">
                <input
                  type="checkbox"
                  aria-label="选择本页全部商机"
                  :checked="allPageSelected"
                  :indeterminate="somePageSelected"
                  @change="togglePage"
                />
              </th>
              <th>商机名称</th>
              <th>客户</th>
              <th>商机类型</th>
              <th>预计金额</th>
              <th>当前阶段</th>
              <th>区域</th>
              <th>预计成交</th>
              <th>归属人</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="d in pageRows"
              :key="d.id"
              :class="{ 'is-selected': selectedIds.includes(d.id) }"
            >
              <td class="dp-selection-cell">
                <input
                  type="checkbox"
                  :aria-label="`选择${d.name}`"
                  :checked="selectedIds.includes(d.id)"
                  @change="toggleRow(d.id)"
                />
              </td>
              <td>
                <button class="dp-list-name" @click="openDeal(d)">
                  {{ d.name }}
                </button>
              </td>
              <td>
                <button class="dp-customer-link" @click="openCustomerDrawer(d)">
                  {{ customer(d)?.name || "待关联" }}
                </button>
              </td>
              <td>
                <span
                  class="dp-type"
                  :class="{ repeat: typeOf(d) !== '新签首单' }"
                  >{{
                    typeOf(d) === "新签首单" ? "新签首单" : "复购 / 增购"
                  }}</span
                >
              </td>
              <td class="dp-money-cell">{{ money(d.amount || 0) }}</td>
              <td>
                <select
                  class="dp-stage-select"
                  :value="d.status"
                  :style="{
                    color: stageOf(d).color,
                    background: stageOf(d).pale,
                  }"
                  :aria-label="`调整${d.name}阶段`"
                  @change="
                    changeStage(d, ($event.target as HTMLSelectElement).value)
                  "
                >
                  <option v-for="s in stages" :key="s.name">
                    {{ s.name }}
                  </option>
                </select>
              </td>
              <td>{{ regionOf(d) }}</td>
              <td>{{ d.date || "待定" }}</td>
              <td>{{ d.owner }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="!filtered.length" class="dp-list-empty">
          <Icon icon="lucide:search-x" />
          <p>没有符合条件的商机</p>
          <button @click="reset">清除筛选</button>
        </div>
      </div>
      <div v-if="view === 'list'" class="dp-pagination">
        <span>共 {{ filtered.length }} 笔</span
        ><label
          >每页<select v-model.number="pageSize" aria-label="每页商机数量">
            <option :value="5">5</option>
            <option :value="10">10</option>
            <option :value="20">20</option></select
          >笔</label
        ><button :disabled="page === 1" aria-label="上一页" @click="page--">
          <Icon icon="lucide:chevron-left" /></button
        ><span>{{ page }} / {{ pageCount }}</span
        ><button
          :disabled="page === pageCount"
          aria-label="下一页"
          @click="page++"
        >
          <Icon icon="lucide:chevron-right" />
        </button>
      </div>
      <div
        v-if="view === 'list' && selectedRows.length"
        class="dp-batch-bar"
        role="toolbar"
        aria-label="商机批量操作"
      >
        <div>
          <b>{{ selectedRows.length }}</b
          >笔商机已选择
        </div>
        <button class="dp-batch-action" @click="exportSelected">
          <Icon icon="lucide:download" /><span>导出</span>
        </button>
        <button class="dp-batch-action danger" @click="deleteOpen = true">
          <Icon icon="lucide:trash-2" /><span>删除</span>
        </button>
        <span class="dp-batch-divider" />
        <Dropdown :trigger="['click']" placement="top">
          <button
            class="dp-assistant-picker"
            aria-label="切换助理"
            aria-haspopup="menu"
          >
            <img :src="selectedEmployee?.avatar" alt="" /><span>{{
              selectedEmployee?.name
            }}</span
            ><Icon icon="lucide:chevron-down" />
          </button>
          <template #overlay
            ><Menu
              :selected-keys="[batchEmployee]"
              @click="({ key }) => (batchEmployee = String(key))"
              ><MenuItem v-for="e in batchEmployees" :key="e.id"
                ><span class="dp-assistant-option"
                  ><img :src="employeeAvatar(e.id)" alt="" />{{ e.name }}</span
                ></MenuItem
              ></Menu
            ></template
          >
        </Dropdown>
        <button class="dp-batch-action" @click="batchOpen = true">
          <Icon icon="lucide:send" /><span>发送给助理</span>
        </button>
        <button
          class="dp-batch-dismiss"
          aria-label="取消选择"
          @click="selectedIds = []"
        >
          <Icon icon="lucide:x" />
        </button>
      </div>
      <footer class="dp-footer">
        <span>{{ filtered.length }} 笔商机</span
        ><span>本地演示 · 刷新后重置</span>
      </footer>
    </section>
    <Modal
      v-model:open="deleteOpen"
      title="删除所选商机"
      ok-text="删除"
      :ok-button-props="{ danger: true }"
      cancel-text="取消"
      @ok="deleteSelected"
      ><p>
        将删除选中的
        {{ selectedRows.length }} 笔商机。当前为本地演示，刷新后恢复。
      </p></Modal
    >
    <Modal
      v-model:open="batchOpen"
      title="发送给助理"
      ok-text="进入对话"
      cancel-text="取消"
      :ok-button-props="{
        disabled: !batchInstruction.trim() || !selectedRows.length,
      }"
      @ok="sendBatch"
      ><div class="dp-form">
        <label
          >数字员工<select v-model="batchEmployee">
            <option v-for="e in batchEmployees" :key="e.id" :value="e.id">
              {{ e.name }}
            </option>
          </select></label
        >
        <p>携带 {{ selectedRows.length }} 笔商机资料进入对话</p>
        <label>处理要求<textarea v-model="batchInstruction" rows="3" /></label
        ><small>资料将填入对话输入框，由你确认发送。</small>
      </div></Modal
    >
    <Modal
      v-model:open="createOpen"
      title="新建商机"
      ok-text="创建商机"
      cancel-text="取消"
      :width="480"
      :ok-button-props="{
        disabled:
          !draft.name.trim() ||
          !draft.customerId ||
          !Number.isFinite(draft.amount) ||
          draft.amount <= 0 ||
          !draft.date,
      }"
      @ok="save"
    >
      <div class="dp-form">
        <div class="dp-create-stage">
          <Icon icon="lucide:git-branch" />初始阶段<strong>{{
            draft.status
          }}</strong>
        </div>
        <label
          >关联客户<select v-model="draft.customerId">
            <option value="" disabled>选择客户</option>
            <option v-for="c in availableCustomers" :key="c.id" :value="c.id">
              {{ c.name }}
            </option>
          </select></label
        ><label
          >商机名称<input
            v-model="draft.name"
            placeholder="例如：采购2台5系设备"
        /></label>
        <label
          >商机描述<textarea
            v-model="draft.note"
            rows="3"
            placeholder="描述客户需求、业务场景和预期目标（选填）"
          />
        </label>
        <div>
          <label
            >预计金额（元）<input
              v-model.number="draft.amount"
              type="number"
              min="0.01"
              step="0.01" /></label
          ><label>预计成交日<input v-model="draft.date" type="date" /></label>
        </div>
      </div>
    </Modal>
    <CustomerWorkspace
      v-if="customerDrawerId"
      :key="customerDrawerKey"
      drawer-only
      :customer-id="customerDrawerId"
    />
    <Drawer
      v-model:open="drawerOpen"
      title="商机详情"
      width="min(1100px, calc(100vw - 32px))"
      root-class-name="sx-customer-drawer sx-intake-drawer dp-detail-drawer"
    >
      <DealDetail
        v-if="editing && drawerOpen"
        :key="editing.id"
        :deal="editing"
        :stages="stages"
        :actions="actions(editing)"
        @stage="changeStage(editing, $event)"
        @close-deal="quickClose(editing, $event)"
        @collaborate="collaborate(editing, $event)"
      />
    </Drawer>
    <Modal
      :open="!!closing"
      :title="`确认${closing?.stage || ''}`"
      ok-text="确认结果"
      cancel-text="取消"
      :ok-button-props="{ disabled: !closingNote.trim() }"
      @ok="finish"
      @cancel="closing = undefined"
      ><div class="dp-form">
        <p>{{ closing?.deal.name }}</p>
        <label
          >{{ closing?.stage === "输单" ? "输单原因" : "成交确认说明"
          }}<textarea
            v-model="closingNote"
            rows="4"
            :placeholder="
              closing?.stage === '输单'
                ? '记录预算、竞品或时机等原因'
                : '记录成交金额确认与后续交付事项'
            "
          />
        </label></div
    ></Modal>
    <Modal
      :open="!!handoff"
      :title="`${handoff?.agent || ''}协作`"
      ok-text="进入销售助理协同"
      cancel-text="取消"
      @ok="goChat"
      @cancel="handoff = undefined"
      ><div class="dp-handoff">
        <span><Icon icon="lucide:sparkles" />{{ handoff?.text }}</span>
        <h3>{{ handoff?.deal.name }}</h3>
        <p>{{ handoff?.deal.note }}</p>
        <small>携带当前商机进入销售助理，由销售助理协同处理。</small>
      </div></Modal
    >
  </ConfigProvider>
</template>
