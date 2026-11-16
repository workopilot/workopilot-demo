<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Icon } from "@iconify/vue";
import { Modal, Switch, message } from "ant-design-vue";
import { salesSettings } from "./settings-store";
import "./settings.css";
import SetupAssistant from "./setup-assistant.vue";
import SalesOrganization from "./settings-organization.vue";

const route = useRoute();
const router = useRouter();
const tabs = [
  {
    id: "targets",
    name: "销售目标",
    icon: "lucide:target",
    desc: "区域定目标，分解到个人，统一业绩口径",
  },
  {
    id: "regions",
    name: "销售区域",
    icon: "lucide:map-pinned",
    desc: "管理销售区域、负责人和成员归属",
  },
  {
    id: "process",
    name: "销售流程",
    icon: "lucide:git-branch",
    desc: "定义商机从需求确认到结单的推进规则",
  },
  {
    id: "permissions",
    name: "团队权限",
    icon: "lucide:shield-check",
    desc: "按角色划定客户与商机的数据边界",
  },
  {
    id: "pool",
    name: "客户公海",
    icon: "lucide:waves",
    desc: "配置领取、保护与回收规则",
  },
  {
    id: "fields",
    name: "字段字典",
    icon: "lucide:list-filter",
    desc: "统一客户、线索与商机的录入口径",
  },
  {
    id: "follow",
    name: "跟进规则",
    icon: "lucide:calendar-check",
    desc: "让跟进、续费与逾期提醒有据可循",
  },
];
const active = computed(
  () =>
    tabs.find((t) => t.id === route.params.salesPage) ||
    tabs.find((t) => t.id === "process")!,
);
const draft = reactive(
  JSON.parse(JSON.stringify(salesSettings)) as typeof salesSettings,
);
const dirty = computed(
  () => JSON.stringify(draft) !== JSON.stringify(salesSettings),
);
const savedAt = ref("");
const fieldOpen = ref(false);
const fieldDraft = reactive({
  object: "客户",
  name: "",
  type: "单行文本",
  values: "",
});
function addField() {
  if (!fieldDraft.name.trim()) return message.warning("请输入字段名称");
  if (
    draft.fields.some(
      (f) =>
        f.object === fieldDraft.object && f.name === fieldDraft.name.trim(),
    )
  )
    return message.warning("此对象已有同名字段");
  if (fieldDraft.type === "单选" && !fieldDraft.values.trim())
    return message.warning("请输入可选值");
  draft.fields.push({
    ...fieldDraft,
    name: fieldDraft.name.trim(),
    id: Date.now(),
    required: false,
    locked: false,
  });
  fieldOpen.value = false;
  fieldDraft.name = "";
  fieldDraft.values = "";
}
function moveStage(i: number, offset: number) {
  const next = i + offset;
  if (next < 0 || next >= draft.stages.length) return;
  const item = draft.stages.splice(i, 1)[0]!;
  draft.stages.splice(next, 0, item);
}
function save() {
  if (
    draft.targets.some(
      (t) =>
        !Number.isFinite(t.amount) ||
        t.amount < 0 ||
        Object.values(t.allocations).some(
          (v) => !Number.isFinite(v) || v < 0,
        ) ||
        Object.values(t.allocations).reduce((a, b) => a + b, 0) >
          t.amount + 0.001,
    )
  )
    return message.warning("目标需为非负数，个人分解合计不能超过区域目标");
  if (
    draft.targets.some(
      (t) =>
        t.metric === "新增客户数" &&
        [t.amount, ...Object.values(t.allocations)].some(
          (v) => !Number.isInteger(v),
        ),
    )
  )
    return message.warning("新增客户数目标必须为整数");
  const names = draft.stages.map((s) => s.name.trim());
  if (
    names.some((n) => !n || ["赢单", "输单", "结单"].includes(n)) ||
    new Set(names).size !== names.length
  )
    return message.warning("阶段名称不能为空、重复或使用结单名称");
  if (
    draft.stages.some(
      (s) =>
        !Number.isFinite(s.rate) ||
        s.rate < 0 ||
        s.rate > 99 ||
        !Number.isInteger(s.days) ||
        s.days < 1,
    )
  )
    return message.warning("请检查赢率（0–99%）和停留天数");
  const positive = [
    draft.pool.idleDays,
    draft.pool.protectDays,
    draft.pool.limit,
    draft.pool.dailyClaim,
    draft.follow.idleDays,
    draft.follow.renewDays,
  ];
  if (positive.some((n) => !Number.isInteger(n) || n < 1) || !draft.follow.time)
    return message.warning("请填写有效的天数、数量与提醒时间");
  Object.assign(salesSettings, JSON.parse(JSON.stringify(draft)));
  savedAt.value = new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  message.success("已保存演示配置；尚未联动业务规则，刷新后重置");
}
function applyInitializedStages(stages: typeof salesSettings.stages) {
  salesSettings.stages = stages.map((stage) => ({ ...stage }));
  draft.stages = stages.map((stage) => ({ ...stage }));
  router.push("/app/mate/apps/smart-crm/settings/process");
}
function reset() {
  Object.assign(draft, JSON.parse(JSON.stringify(salesSettings)));
}
</script>

<template>
  <section class="zy-settings">
    <header class="zy-top">
      <div class="zy-brand">
        <span><Icon icon="lucide:handshake" /></span>
        <div>
          <h1>知赢 <small>销售设置</small></h1>
          <p>懂客户，把握机会，赢得信任</p>
        </div>
      </div>
      <SetupAssistant
        :stages="draft.stages"
        @view="router.push('/app/mate/apps/smart-crm/settings/process')"
        @apply="applyInitializedStages"
        @targets="router.push('/app/mate/apps/smart-crm/settings/targets')"
      />
      <nav aria-label="销售设置子菜单">
        <button
          v-for="t in tabs"
          :key="t.id"
          :class="{ active: active.id === t.id }"
          :aria-current="active.id === t.id ? 'page' : undefined"
          @click="router.push(`/app/mate/apps/smart-crm/settings/${t.id}`)"
        >
          <Icon :icon="t.icon" />{{ t.name }}
        </button>
      </nav>
    </header>
    <main class="zy-main">
      <div class="zy-heading">
        <div>
          <span class="zy-eyebrow">CRM SETTINGS</span>
          <h2>{{ active.name }}</h2>
          <p>{{ active.desc }}</p>
        </div>
        <span class="zy-mode"
          ><Icon icon="lucide:flask-conical" />配置演示</span
        >
      </div>

      <SalesOrganization
        v-if="active.id === 'regions' || active.id === 'targets'"
        :mode="active.id"
        :regions="draft.regions"
        :targets="draft.targets"
        @update:regions="draft.regions = $event"
        @update:targets="draft.targets = $event"
      />
      <template v-else-if="active.id === 'process'">
        <section class="zy-card">
          <div class="zy-card-head">
            <div>
              <h3>标准销售流程 <span class="zy-tag">默认</span></h3>
              <p>适用于新签首单、老客复购与增购</p>
            </div>
            <button
              class="zy-outline"
              @click="
                draft.stages.push({
                  id: Date.now(),
                  name: '新阶段',
                  rate: 50,
                  days: 7,
                  color: '#648fc6',
                  required: '',
                })
              "
            >
              <Icon icon="lucide:plus" />新增阶段
            </button>
          </div>
          <div class="zy-preview">
            <div
              v-for="(s, i) in draft.stages"
              :key="s.id"
              :style="{ background: s.color }"
            >
              <small>0{{ i + 1 }}</small
              >{{ s.name }}<span>{{ s.rate }}%</span>
            </div>
            <div class="zy-closed">结单<small>赢单 / 输单</small></div>
          </div>
          <div class="zy-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>顺序</th>
                  <th>销售阶段</th>
                  <th>参考赢率</th>
                  <th>停留预警</th>
                  <th>阶段完成条件</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(s, i) in draft.stages" :key="s.id">
                  <td>
                    <span class="zy-number">{{ i + 1 }}</span>
                  </td>
                  <td>
                    <div class="zy-stage-name">
                      <input
                        v-model="s.color"
                        type="color"
                        :aria-label="`${s.name}颜色`"
                      /><input
                        v-model="s.name"
                        :aria-label="`第${i + 1}阶段名称`"
                        maxlength="16"
                      />
                    </div>
                  </td>
                  <td>
                    <label class="zy-unit"
                      ><input
                        v-model.number="s.rate"
                        type="number"
                        min="0"
                        max="99"
                        :aria-label="`${s.name}参考赢率`"
                      />%</label
                    >
                  </td>
                  <td>
                    <label class="zy-unit"
                      ><input
                        v-model.number="s.days"
                        type="number"
                        min="1"
                        :aria-label="`${s.name}停留预警`"
                      />天</label
                    >
                  </td>
                  <td>
                    <input
                      v-model="s.required"
                      :aria-label="`${s.name}完成条件`"
                      placeholder="填写推进所需资料"
                    />
                  </td>
                  <td class="zy-row-actions">
                    <button
                      :disabled="i === 0"
                      :aria-label="`上移${s.name}`"
                      @click="moveStage(i, -1)"
                    >
                      <Icon icon="lucide:arrow-up" /></button
                    ><button
                      :disabled="i === draft.stages.length - 1"
                      :aria-label="`下移${s.name}`"
                      @click="moveStage(i, 1)"
                    >
                      <Icon icon="lucide:arrow-down" /></button
                    ><button
                      :disabled="draft.stages.length <= 1"
                      :aria-label="`删除${s.name}`"
                      @click="draft.stages.splice(i, 1)"
                    >
                      <Icon icon="lucide:trash-2" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="zy-outcomes">
            <span><i class="won" />赢单 <b>100%</b></span
            ><span><i class="lost" />输单 <b>0%</b></span
            ><small>结单结果固定；输单保留在列表，不显示为看板列。</small>
          </div>
        </section>
        <div class="zy-note">
          <Icon
            icon="lucide:info"
          />销售阶段就是商机看板的各个状态；销售流程定义这些阶段的顺序与推进要求。
        </div>
      </template>

      <template v-else-if="active.id === 'permissions'">
        <div class="zy-rule-banner">
          <Icon icon="lucide:lock-keyhole" />
          <div>
            <strong>一个客户，一位负责销售</strong>
            <p>客户下的商机、联系人统一跟随客户归属；移交客户时一并移交。</p>
          </div>
          <span class="zy-tag">固定规则</span>
        </div>
        <section class="zy-card">
          <div class="zy-card-head">
            <h3>角色权限矩阵</h3>
            <span class="zy-muted">数据范围与操作权限分开管理</span>
          </div>
          <table class="zy-permissions">
            <thead>
              <tr>
                <th>权限项</th>
                <th>普通销售</th>
                <th>销售总监</th>
                <th>应用管理员</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>客户 / 商机数据范围</td>
                <td><span class="zy-tag">仅本人负责</span></td>
                <td>所辖团队</td>
                <td>配置管理，不默认读取业务数据</td>
              </tr>
              <tr>
                <td>查看其他销售客户</td>
                <td>不可查看</td>
                <td>限所辖团队</td>
                <td>需另授业务角色</td>
              </tr>
              <tr>
                <td>公海领取</td>
                <td>按额度领取</td>
                <td>领取与分配</td>
                <td>配置领取规则</td>
              </tr>
              <tr>
                <td>客户移交</td>
                <td>不可操作</td>
                <td>
                  <Switch
                    v-model:checked="draft.permissions.directorTransfer"
                    aria-label="总监客户移交"
                  />
                </td>
                <td>不直接移交</td>
              </tr>
              <tr>
                <td>批量导出</td>
                <td>
                  <Switch
                    v-model:checked="draft.permissions.salesExport"
                    aria-label="销售批量导出"
                  />
                </td>
                <td>
                  <Switch
                    v-model:checked="draft.permissions.directorExport"
                    aria-label="总监批量导出"
                  />
                </td>
                <td>跟随业务角色</td>
              </tr>
              <tr>
                <td>修改销售设置</td>
                <td>不可操作</td>
                <td>只读</td>
                <td>可配置</td>
              </tr>
            </tbody>
          </table>
        </section>
        <div class="zy-note">
          <Icon
            icon="lucide:shield-check"
          />当前为管理员配置预览。正式接入时，数据权限与数字员工调用均由服务端校验。
        </div>
      </template>

      <template v-else-if="active.id === 'pool'">
        <div class="zy-grid">
          <section class="zy-card">
            <div class="zy-card-head">
              <h3><Icon icon="lucide:hand" />领取与保护</h3>
            </div>
            <label class="zy-setting"
              ><span
                >每日领取上限<small>每位销售每天可领取的客户数</small></span
              >
              <div class="zy-unit">
                <input
                  v-model.number="draft.pool.dailyClaim"
                  type="number"
                  min="1"
                />家
              </div></label
            ><label class="zy-setting"
              ><span>个人客户持有上限</span>
              <div class="zy-unit">
                <input
                  v-model.number="draft.pool.limit"
                  type="number"
                  min="1"
                />家
              </div></label
            ><label class="zy-setting"
              ><span>新领取客户保护期</span>
              <div class="zy-unit">
                <input
                  v-model.number="draft.pool.protectDays"
                  type="number"
                  min="1"
                />天
              </div></label
            >
          </section>
          <section class="zy-card">
            <div class="zy-card-head">
              <h3><Icon icon="lucide:rotate-ccw" />自动回收</h3>
              <Switch
                v-model:checked="draft.pool.reclaim"
                aria-label="自动回收"
              />
            </div>
            <label class="zy-setting"
              ><span>连续未跟进<small>保护期结束后计算回收条件</small></span>
              <div class="zy-unit">
                <input
                  v-model.number="draft.pool.idleDays"
                  :disabled="!draft.pool.reclaim"
                  type="number"
                  min="1"
                />天
              </div></label
            >
            <div class="zy-setting">
              <span>排除有在途商机的客户</span
              ><Switch
                v-model:checked="draft.pool.excludeDeals"
                :disabled="!draft.pool.reclaim"
                aria-label="排除在途商机客户"
              />
            </div>
            <div class="zy-setting">
              <span>回收前通知负责人</span><span class="zy-tag">提前 3 天</span>
            </div>
          </section>
        </div>
        <div class="zy-note">
          <Icon
            icon="lucide:info"
          />线索使用“待领取”队列；客户公海仅管理未分配或已回收的客户。
        </div>
      </template>

      <section v-else-if="active.id === 'fields'" class="zy-card">
        <div class="zy-card-head">
          <h3>业务字段与选项</h3>
          <button class="zy-outline" @click="fieldOpen = true">
            <Icon icon="lucide:plus" />新增字段
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>对象</th>
              <th>字段名称</th>
              <th>类型</th>
              <th>可选值</th>
              <th>必填</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="f in draft.fields" :key="f.id">
              <td>
                <span class="zy-tag">{{ f.object }}</span>
              </td>
              <td>
                {{ f.name }}
                <Icon
                  v-if="f.locked"
                  icon="lucide:lock-keyhole"
                  class="zy-muted"
                />
              </td>
              <td>{{ f.type }}</td>
              <td>
                <input
                  v-if="f.type === '单选'"
                  v-model="f.values"
                  :aria-label="`${f.name}选项`"
                /><span v-else class="zy-muted">—</span>
              </td>
              <td>
                <Switch
                  v-model:checked="f.required"
                  :disabled="f.locked"
                  :aria-label="`${f.name}必填`"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <template v-else-if="active.id === 'follow'">
        <section class="zy-card">
          <div class="zy-card-head">
            <h3>跟进与业务提醒</h3>
            <Switch
              v-model:checked="draft.follow.remind"
              aria-label="启用业务提醒"
            />
          </div>
          <label class="zy-setting"
            ><span>客户未跟进预警<small>在客户列表标记超期风险</small></span>
            <div class="zy-unit">
              <input
                v-model.number="draft.follow.idleDays"
                type="number"
                min="1"
              />天
            </div></label
          ><label class="zy-setting"
            ><span
              >到期续费提醒<small>合同到期前提醒负责人挖掘复购</small></span
            >
            <div class="zy-unit">
              提前<input
                v-model.number="draft.follow.renewDays"
                type="number"
                min="1"
              />天
            </div></label
          >
          <div class="zy-setting">
            <span>会议 / 拜访逾期提醒</span
            ><Switch
              v-model:checked="draft.follow.overdue"
              aria-label="逾期提醒"
            />
          </div>
          <label class="zy-setting"
            ><span>每日提醒时间</span
            ><input v-model="draft.follow.time" type="time" /></label
          ><label class="zy-setting"
            ><span>通知方式</span
            ><select v-model="draft.follow.channel">
              <option>站内消息</option>
              <option>数字员工晨报</option>
            </select></label
          >
        </section>
      </template>

      <footer class="zy-save">
        <span
          ><i :class="{ dirty }" />{{
            dirty
              ? "有未保存的修改"
              : savedAt
                ? `已保存 · ${savedAt}`
                : "本地演示 · 保存仅当前会话有效，未联动业务"
          }}</span
        >
        <div>
          <button class="zy-outline" :disabled="!dirty" @click="reset">
            撤销修改</button
          ><button class="zy-primary" :disabled="!dirty" @click="save">
            <Icon icon="lucide:check" />保存配置
          </button>
        </div>
      </footer>
    </main>
    <Modal
      v-model:open="fieldOpen"
      title="新增业务字段"
      ok-text="添加字段"
      cancel-text="取消"
      @ok="addField"
      ><div class="zy-field-form">
        <label
          >业务对象<select v-model="fieldDraft.object">
            <option>客户</option>
            <option>线索</option>
            <option>商机</option>
          </select></label
        ><label
          >字段名称<input v-model="fieldDraft.name" maxlength="20" /></label
        ><label
          >字段类型<select v-model="fieldDraft.type">
            <option>单行文本</option>
            <option>单选</option>
            <option>数字</option>
            <option>日期</option>
          </select></label
        ><label v-if="fieldDraft.type === '单选'"
          >可选值<input v-model="fieldDraft.values" placeholder="用顿号分隔"
        /></label></div
    ></Modal>
  </section>
</template>
