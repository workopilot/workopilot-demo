<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { Icon } from "@iconify/vue";
import { Drawer, message } from "ant-design-vue";
import {
  salesPeople,
  type SalesRegion,
  type SalesTarget,
} from "./settings-store";
import "./settings-organization.css";

const props = defineProps<{
  mode: string;
  regions: SalesRegion[];
  targets: SalesTarget[];
}>();
const emit = defineEmits<{
  "update:regions": [SalesRegion[]];
  "update:targets": [SalesTarget[]];
}>();
const editing = ref(false);
const regionDraft = reactive<SalesRegion>({
  id: "",
  name: "",
  coverage: "",
  manager: "",
  members: [],
});
const year = ref("2027");
const cycle = ref("年度");
const quarter = ref("Q1");
const month = ref("01");
const metric = ref("赢单金额");
const perspective = ref("区域");
const selectedRegion = ref("all");
const period = computed(() =>
  cycle.value === "年度"
    ? year.value
    : `${year.value}-${cycle.value === "季度" ? quarter.value : month.value}`,
);
const unit = computed(() => (metric.value === "新增客户数" ? "家" : "万元"));
const visibleRegions = computed(() =>
  props.regions.filter(
    (r) => selectedRegion.value === "all" || r.id === selectedRegion.value,
  ),
);
const currentTargets = computed(() =>
  props.targets.filter(
    (t) =>
      t.period === period.value &&
      t.metric === metric.value &&
      visibleRegions.value.some((r) => r.id === t.regionId),
  ),
);
const total = computed(() =>
  currentTargets.value.reduce((sum, t) => sum + t.amount, 0),
);
const allocated = computed(() =>
  currentTargets.value.reduce((sum, t) => sum + allocationTotal(t), 0),
);
const unset = computed(
  () => visibleRegions.value.filter((r) => !target(r.id)).length,
);
const personalRows = computed(() =>
  visibleRegions.value.flatMap((r) =>
    r.members.map((name) => ({ region: r, name })),
  ),
);
function format(n: number) {
  return n.toLocaleString("zh-CN", { maximumFractionDigits: 2 });
}
function target(id: string) {
  return currentTargets.value.find((t) => t.regionId === id);
}
function allocationTotal(t?: SalesTarget) {
  return t ? Object.values(t.allocations).reduce((sum, n) => sum + n, 0) : 0;
}
function memberRegion(person: string) {
  return props.regions.find(
    (r) => r.id !== regionDraft.id && r.members.includes(person),
  );
}
function editRegion(r?: SalesRegion) {
  Object.assign(
    regionDraft,
    r
      ? JSON.parse(JSON.stringify(r))
      : { id: "", name: "", coverage: "", manager: "", members: [] },
  );
  editing.value = true;
}
function applyRegion() {
  if (
    !regionDraft.name.trim() ||
    !regionDraft.manager ||
    !regionDraft.coverage.trim()
  )
    return message.warning("请填写区域名称、覆盖范围并指定负责人");
  if (
    props.regions.some(
      (r) => r.id !== regionDraft.id && r.name === regionDraft.name.trim(),
    )
  )
    return message.warning("区域名称不能重复");
  if (regionDraft.members.some((p) => memberRegion(p)))
    return message.warning("一个销售只能归属一个区域");
  const previous = props.regions.find((r) => r.id === regionDraft.id);
  const removed =
    previous?.members.filter((p) => !regionDraft.members.includes(p)) || [];
  if (
    props.targets.some(
      (t) =>
        t.regionId === regionDraft.id &&
        removed.some((p) => (t.allocations[p] || 0) > 0),
    )
  )
    return message.warning("被移除成员仍有目标，请先清零其个人目标再调整归属");
  const next = {
    ...JSON.parse(JSON.stringify(regionDraft)),
    id: regionDraft.id || `region-${Date.now()}`,
    name: regionDraft.name.trim(),
  } as SalesRegion;
  emit(
    "update:regions",
    previous
      ? props.regions.map((r) => (r.id === next.id ? next : r))
      : [...props.regions, next],
  );
  editing.value = false;
}
function setAmount(regionId: string, raw: string, person?: string) {
  const value = raw === "" ? 0 : Number(raw);
  if (
    !Number.isFinite(value) ||
    value < 0 ||
    (metric.value === "新增客户数" && !Number.isInteger(value))
  )
    return message.warning("请输入有效的非负目标值");
  const next = JSON.parse(JSON.stringify(props.targets)) as SalesTarget[];
  let record = next.find(
    (t) =>
      t.regionId === regionId &&
      t.period === period.value &&
      t.metric === metric.value,
  );
  if (!record) {
    record = {
      regionId,
      period: period.value,
      metric: metric.value,
      amount: 0,
      allocations: {},
    };
    next.push(record);
  }
  if (person) record.allocations[person] = value;
  else record.amount = value;
  emit("update:targets", next);
}
function evenSplit(r: SalesRegion) {
  const t = target(r.id);
  if (!t || !t.amount || !r.members.length)
    return message.warning("请先设置区域目标并添加成员");
  const scale = metric.value === "新增客户数" ? 1 : 100;
  const cents = Math.round(t.amount * scale),
    base = Math.floor(cents / r.members.length),
    rest = cents - base * r.members.length;
  const allocations = Object.fromEntries(
    r.members.map((p, i) => [p, (base + (i < rest ? 1 : 0)) / scale]),
  );
  emit(
    "update:targets",
    props.targets.map((v) => (v === t ? { ...v, allocations } : v)),
  );
}
</script>

<template>
  <div v-if="mode === 'regions'">
    <div class="zo-toolbar">
      <div class="zo-summary">
        <b>{{ regions.length }}</b> 个销售区域 <span>·</span>
        <b>{{ regions.reduce((s, r) => s + r.members.length, 0) }}</b>
        位销售成员
      </div>
      <button class="zy-primary" @click="editRegion()">
        <Icon icon="lucide:plus" />新建区域
      </button>
    </div>
    <div class="zo-regions">
      <section
        v-for="(r, i) in regions"
        :key="r.id"
        class="zy-card zo-region"
        :class="{ blue: i % 2 }"
      >
        <div class="zo-region-head">
          <span class="zo-region-icon"><Icon icon="lucide:map-pinned" /></span>
          <div>
            <h3>{{ r.name }}</h3>
            <p>{{ r.coverage }}</p>
          </div>
          <button class="zy-outline" @click="editRegion(r)">
            <Icon icon="lucide:pencil" />编辑
          </button>
        </div>
        <div class="zo-manager">
          <span class="zo-avatar">{{ r.manager.slice(0, 1) }}</span>
          <div>
            <small>区域负责人</small><strong>{{ r.manager }}</strong>
          </div>
          <span class="zy-tag">所辖区域</span>
        </div>
        <div class="zo-members">
          <div>
            <strong>销售成员</strong><span>{{ r.members.length }} 人</span>
          </div>
          <div class="zo-person-chips">
            <span v-for="p in r.members" :key="p"
              ><i>{{ p.slice(0, 1) }}</i
              >{{ p }}</span
            ><span v-if="!r.members.length" class="zy-muted">尚未添加成员</span>
          </div>
        </div>
        <footer>
          <Icon icon="lucide:lock-keyhole" />成员仅查看自己的客户与商机
        </footer>
      </section>
    </div>
    <div class="zy-note">
      <Icon
        icon="lucide:info"
      />负责人管理本区域；成员唯一归属一个区域。负责人如承担个人指标，需同时加入销售成员。
    </div>
  </div>

  <div v-else>
    <section class="zy-card zo-plan">
      <div class="zo-plan-title">
        <span class="zo-target-icon"><Icon icon="lucide:target" /></span>
        <div>
          <h3>{{ period }} · {{ metric }}</h3>
          <p>
            {{
              metric === "赢单金额"
                ? "以赢单日期归期，按商机最终金额统计"
                : metric === "回款金额"
                  ? "以实际到账日期归期，按实收金额统计"
                  : "以客户创建日期归期，同一客户仅计一次"
            }}
          </p>
        </div>
        <span class="zy-tag">目标编制</span>
      </div>
      <div class="zo-filters">
        <label
          >年份<select v-model="year">
            <option>2026</option>
            <option>2027</option>
            <option>2028</option>
          </select></label
        ><label
          >周期<select v-model="cycle">
            <option>年度</option>
            <option>季度</option>
            <option>月度</option>
          </select></label
        ><label v-if="cycle === '季度'"
          >季度<select v-model="quarter">
            <option>Q1</option>
            <option>Q2</option>
            <option>Q3</option>
            <option>Q4</option>
          </select></label
        ><label v-if="cycle === '月度'"
          >月份<select v-model="month">
            <option
              v-for="n in 12"
              :key="n"
              :value="String(n).padStart(2, '0')"
            >
              {{ n }} 月
            </option>
          </select></label
        ><label
          >考核指标<select v-model="metric">
            <option>赢单金额</option>
            <option>回款金额</option>
            <option>新增客户数</option>
          </select></label
        ><label
          >销售区域<select v-model="selectedRegion">
            <option value="all">全部区域</option>
            <option v-for="r in regions" :key="r.id" :value="r.id">
              {{ r.name }}
            </option>
          </select></label
        >
      </div>
    </section>
    <div class="zo-metrics">
      <div>
        <span>区域目标合计</span
        ><strong
          >{{ format(total) }} <small>{{ unit }}</small></strong
        >
      </div>
      <div>
        <span>已分解至个人</span
        ><strong
          >{{ format(allocated) }} <small>{{ unit }}</small></strong
        >
      </div>
      <div :class="{ warning: total !== allocated }">
        <span>{{ allocated > total ? "超额分解" : "待分解额度" }}</span
        ><strong
          >{{ format(Math.abs(total - allocated)) }}
          <small>{{ unit }}</small></strong
        >
      </div>
      <div>
        <span>尚未设置区域</span
        ><strong
          >{{ unset }} <small>/ {{ visibleRegions.length }} 个</small></strong
        >
      </div>
    </div>
    <section class="zy-card">
      <div class="zy-card-head">
        <div class="zo-view" role="tablist" aria-label="目标查看维度">
          <button
            v-for="view in ['区域', '人员']"
            :key="view"
            role="tab"
            :aria-selected="perspective === view"
            :class="{ active: perspective === view }"
            @click="perspective = view"
          >
            <Icon :icon="view === '区域' ? 'lucide:map' : 'lucide:users'" />按{{
              view
            }}
          </button>
        </div>
        <span class="zy-muted">单位：{{ unit }} · 两种视图共享目标</span>
      </div>
      <template v-if="perspective === '区域'">
        <div v-for="r in visibleRegions" :key="r.id" class="zo-allocation">
          <div class="zo-allocation-head">
            <div>
              <strong>{{ r.name }}</strong
              ><small
                >负责人 {{ r.manager }} · {{ r.members.length }} 位成员</small
              >
            </div>
            <label
              >区域目标
              <input
                :key="`${period}-${metric}-${r.id}`"
                type="number"
                min="0"
                :step="metric === '新增客户数' ? 1 : 0.01"
                :value="target(r.id)?.amount ?? ''"
                placeholder="未设置"
                :aria-label="`${r.name}区域目标`"
                @input="
                  setAmount(r.id, ($event.target as HTMLInputElement).value)
                "
              /><span>{{ unit }}</span></label
            ><button
              class="zy-outline"
              :disabled="!target(r.id)?.amount || !r.members.length"
              @click="evenSplit(r)"
            >
              平均分配
            </button>
          </div>
          <div class="zo-allocation-members">
            <label v-for="p in r.members" :key="p"
              ><span class="zo-avatar">{{ p.slice(0, 1) }}</span
              ><strong>{{ p }}</strong
              ><input
                :key="`${period}-${metric}-${r.id}-${p}`"
                type="number"
                min="0"
                :step="metric === '新增客户数' ? 1 : 0.01"
                :value="target(r.id)?.allocations[p] ?? ''"
                placeholder="未分配"
                :aria-label="`${p}个人目标`"
                @input="
                  setAmount(r.id, ($event.target as HTMLInputElement).value, p)
                "
              /><small>{{ unit }}</small></label
            >
            <p v-if="!r.members.length" class="zy-muted">
              请先在销售区域中添加成员
            </p>
          </div>
          <div
            class="zo-allocation-footer"
            :class="{
              over: allocationTotal(target(r.id)) > (target(r.id)?.amount || 0),
            }"
          >
            <span
              >已分解 {{ format(allocationTotal(target(r.id))) }} /
              {{ format(target(r.id)?.amount || 0) }} {{ unit }}</span
            >
            <div class="zo-bar">
              <i
                :style="{
                  width: `${Math.min(100, (allocationTotal(target(r.id)) / (target(r.id)?.amount || 1)) * 100)}%`,
                }"
              />
            </div>
            <strong>{{
              !target(r.id)
                ? "待设置"
                : allocationTotal(target(r.id)) > (target(r.id)?.amount || 0)
                  ? "超额分解，请调整"
                  : allocationTotal(target(r.id)) ===
                      (target(r.id)?.amount || 0)
                    ? "分解完成"
                    : `待分解 ${format((target(r.id)?.amount || 0) - allocationTotal(target(r.id)))} ${unit}`
            }}</strong>
          </div>
        </div>
      </template>
      <table v-else class="zo-people-table">
        <thead>
          <tr>
            <th>销售成员</th>
            <th>所属区域</th>
            <th>区域负责人</th>
            <th>个人目标（{{ unit }}）</th>
            <th>区域占比</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in personalRows" :key="row.region.id + row.name">
            <td>
              <span class="zo-avatar">{{ row.name.slice(0, 1) }}</span
              >{{ row.name }}
            </td>
            <td>{{ row.region.name }}</td>
            <td>{{ row.region.manager }}</td>
            <td>
              <input
                type="number"
                min="0"
                :step="metric === '新增客户数' ? 1 : 0.01"
                :value="target(row.region.id)?.allocations[row.name] ?? ''"
                :aria-label="`${row.name}个人目标`"
                placeholder="未分配"
                @input="
                  setAmount(
                    row.region.id,
                    ($event.target as HTMLInputElement).value,
                    row.name,
                  )
                "
              />
            </td>
            <td>
              {{
                target(row.region.id)?.amount
                  ? Math.round(
                      ((target(row.region.id)?.allocations[row.name] || 0) /
                        target(row.region.id)!.amount) *
                        100,
                    ) + "%"
                  : "—"
              }}
            </td>
          </tr>
          <tr v-if="!personalRows.length">
            <td colspan="5">暂无销售成员，请先设置区域成员。</td>
          </tr>
        </tbody>
      </table>
    </section>
    <div class="zy-note">
      <Icon
        icon="lucide:info"
      />区域目标与个人分解不重复累加；年、季、月分别编制，未设置的周期保持为空。
    </div>
  </div>
  <Drawer
    v-model:open="editing"
    :title="regionDraft.id ? '编辑销售区域' : '新建销售区域'"
    :width="520"
    class="zo-drawer"
    ><div class="zy-field-form">
      <label
        >区域名称<input
          v-model="regionDraft.name"
          maxlength="20"
          placeholder="例如：华南大区" /></label
      ><label
        >覆盖范围<input
          v-model="regionDraft.coverage"
          maxlength="80"
          placeholder="例如：广东、广西、海南" /></label
      ><label
        >区域负责人<select v-model="regionDraft.manager">
          <option disabled value="">请选择负责人</option>
          <option v-for="p in salesPeople" :key="p">{{ p }}</option>
        </select></label
      >
      <div class="zo-member-picker">
        <h4>
          销售成员 <small>已选 {{ regionDraft.members.length }} 人</small>
        </h4>
        <label
          v-for="p in salesPeople"
          :key="p"
          :class="{ unavailable: memberRegion(p) }"
          ><input
            v-model="regionDraft.members"
            type="checkbox"
            :value="p"
            :disabled="!!memberRegion(p)"
          /><span class="zo-avatar">{{ p.slice(0, 1) }}</span
          >{{ p
          }}<small v-if="memberRegion(p)">{{ memberRegion(p)?.name }}</small
          ><small v-else-if="p === regionDraft.manager">负责人</small></label
        >
      </div>
      <p class="zy-muted">仅调整组织配置，不自动转移现有客户与商机。</p>
    </div>
    <template #footer
      ><div class="zo-drawer-actions">
        <button class="zy-outline" @click="editing = false">取消</button
        ><button class="zy-primary" @click="applyRegion">确认区域</button>
      </div></template
    ></Drawer
  >
</template>
