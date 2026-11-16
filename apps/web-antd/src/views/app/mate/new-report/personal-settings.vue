<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import Icon from './SettingsIcon.vue';
import {
  Button,
  ConfigProvider,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  Table,
  theme,
  message,
} from 'ant-design-vue';
import { zhijiSchemes, zhijiPeople } from '#/api/mock-zhiji';
import {
  personalReportSettingTypes,
  personalReportSettings,
  defaultPersonalReportSetting,
  personalScheduleLabel,
  savePersonalReportSettings,
} from '#/api/mock-personal-report-settings';
import type { PersonalReportSetting } from '#/api/mock-personal-report-settings';
const tab = ref('schedule');
const types = computed(() =>
  personalReportSettingTypes.filter((type) =>
    zhijiSchemes.some(
      (scheme) => scheme.id === type.schemeId && scheme.status === 'published',
    ),
  ),
);
function initialSetting(
  type: (typeof personalReportSettingTypes)[number],
): PersonalReportSetting {
  const config = zhijiSchemes.find((item) => item.id === type.schemeId);
  const saved = personalReportSettings[type.key];
  const value: PersonalReportSetting = saved
    ? JSON.parse(JSON.stringify(saved))
    : {
        ...defaultPersonalReportSetting(type.kind),
        enabled: config?.autoGenerate ?? false,
        time: config?.generateTime ?? '09:00',
        weekday: Math.max(1, Math.min(7, config?.generateDay ?? 6)),
        monthDay: Math.max(1, Math.min(28, config?.generateDay ?? 1)),
        recipients: [...(config?.recipients ?? [])],
        reviewers:
          type.kind === 'customer' ? ['杨总'] : [...(config?.reviewers ?? [])],
      };
  value.recipientIds =
    value.recipientIds ??
    zhijiPeople
      .filter((person) => value.recipients.includes(person.label))
      .map((person) => person.value);
  value.reviewerIds =
    value.reviewerIds ??
    zhijiPeople
      .filter((person) => value.reviewers.includes(person.label))
      .map((person) => person.value);
  value.recipients = zhijiPeople
    .filter((person) => value.recipientIds!.includes(person.value))
    .map((person) => person.label);
  value.reviewers = zhijiPeople
    .filter((person) => value.reviewerIds!.includes(person.value))
    .map((person) => person.label);
  value.approvalEnabled = value.reviewers.length > 0;
  return value;
}
const drafts = reactive<Record<string, PersonalReportSetting>>(
  Object.fromEntries(
    types.value.map((type) => [type.key, initialSetting(type)]),
  ),
);
const saveStates = reactive<Record<string, string>>({});
const versions: Record<string, number> = {};
const saving = computed(() => Object.values(saveStates).includes('saving'));
const failed = computed(() => Object.values(saveStates).includes('error'));
async function updateSetting(
  key: string,
  patch: Partial<PersonalReportSetting>,
) {
  const next = { ...drafts[key]!, ...patch };
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(next.time)) return;
  drafts[key] = next;
  const version = (versions[key] = (versions[key] ?? 0) + 1);
  saveStates[key] = 'saving';
  try {
    const response = await savePersonalReportSettings({ [key]: next });
    if (versions[key] === version) {
      drafts[key] = response.data[key]!;
      saveStates[key] = 'saved';
    }
  } catch {
    if (versions[key] === version) saveStates[key] = 'error';
  }
}
function retry() {
  for (const key of Object.keys(saveStates))
    if (saveStates[key] === 'error') void updateSetting(key, {});
}
const editKey = ref('');
const scheduleOpen = ref(false);
const editingType = computed(() =>
  types.value.find((type) => type.key === editKey.value),
);
const editingSetting = computed(() => drafts[editKey.value]);
function editSchedule(key: string) {
  editKey.value = key;
  scheduleOpen.value = true;
}
const weekdays = ['一', '二', '三', '四', '五', '六', '日'].map(
  (name, index) => ({ label: `周${name}`, value: index + 1 }),
);
const pickerOpen = ref(false);
const pickerKey = ref('');
const pickerMode = ref<'recipients' | 'reviewers'>('recipients');
const department = ref('all');
const search = ref('');
const page = ref(1);
const pickerType = computed(() =>
  types.value.find((type) => type.key === pickerKey.value),
);
const pickerIds = ref<string[]>([]);
const applying = ref(false);
const departments = [
  ...new Set(zhijiPeople.map((person) => person.department)),
].map((value) => ({ value, label: value }));
const people = computed(() =>
  zhijiPeople.filter(
    (person) =>
      (department.value === 'all' || person.department === department.value) &&
      `${person.label} ${person.number}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase()),
  ),
);
watch([department, search], () => (page.value = 1));
function openPicker(key: string, mode: 'recipients' | 'reviewers') {
  pickerKey.value = key;
  pickerMode.value = mode;
  pickerIds.value = [];
  department.value = 'all';
  search.value = '';
  page.value = 1;
  pickerOpen.value = true;
}
function selectedPeople(keys: (string | number)[]) {
  pickerIds.value = keys
    .map(String)
    .filter((id) => zhijiPeople.some((person) => person.value === id));
}
const selection = computed(() => ({
  selectedRowKeys: pickerIds.value,
  preserveSelectedRowKeys: true,
  onChange: selectedPeople,
}));
function peopleFor(key: string, mode: string) {
  const ids =
    drafts[key]?.[mode === 'recipients' ? 'recipientIds' : 'reviewerIds'] ?? [];
  return zhijiPeople.filter((person) => ids.includes(person.value));
}
function peoplePatch(
  mode: string,
  ids: string[],
): Partial<PersonalReportSetting> {
  const uniqueIds = [...new Set(ids)];
  const names = zhijiPeople
    .filter((person) => uniqueIds.includes(person.value))
    .map((person) => person.label);
  return mode === 'recipients'
    ? { recipientIds: uniqueIds, recipients: names }
    : {
        reviewerIds: uniqueIds,
        reviewers: names,
        approvalEnabled: uniqueIds.length > 0,
      };
}
async function applyPeople(all = false) {
  if (applying.value || !pickerIds.value.length) return;
  applying.value = true;
  const targets = types.value.filter(
    (type) => !locked(type.key) && (all || type.key === pickerKey.value),
  );
  try {
    await Promise.all(
      targets.map((type) => {
        const existing =
          drafts[type.key]?.[
            pickerMode.value === 'recipients' ? 'recipientIds' : 'reviewerIds'
          ] ?? [];
        return updateSetting(
          type.key,
          peoplePatch(pickerMode.value, [...existing, ...pickerIds.value]),
        );
      }),
    );
    if (targets.some((type) => saveStates[type.key] === 'error')) return;
    pickerOpen.value = false;
    message.success(
      all
        ? `已添加到 ${targets.length} 个报告类型，重复人员已去重`
        : '已应用，重复人员不会重复添加',
    );
  } finally {
    applying.value = false;
  }
}
function removePerson(key: string, mode: string, id: string) {
  if (locked(key)) return;
  const existing =
    drafts[key]?.[mode === 'recipients' ? 'recipientIds' : 'reviewerIds'] ?? [];
  void updateSetting(
    key,
    peoplePatch(
      mode,
      existing.filter((value) => value !== id),
    ),
  );
}
const peopleColumns = [
  { title: '姓名', dataIndex: 'label', key: 'label', width: 180 },
  { title: '工号', dataIndex: 'number', width: 140 },
  { title: '部门', dataIndex: 'department' },
];
const authorizationColumns = [
  { title: '报告类型', key: 'type', width: 180 },
  { title: '分享 · 谁可以看我的', key: 'recipients', width: 330 },
  { title: '审批 · 谁可以审批我的', key: 'reviewers', width: 330 },
];
function locked(key: string) {
  return (
    zhijiSchemes.find(
      (scheme) =>
        scheme.id === types.value.find((type) => type.key === key)?.schemeId,
    )?.allowAdjustRecipients === false
  );
}
</script>
<template>
  <ConfigProvider
    :theme="{
      inherit: false,
      algorithm: theme.defaultAlgorithm,
      token: {
        colorPrimary: '#247d69',
        colorText: '#294638',
        colorBgContainer: '#ffffff',
        colorBgElevated: '#ffffff',
        borderRadius: 8,
      },
    }"
  >
    <section class="personal-report-settings">
      <div class="settings-tabs" role="tablist" aria-label="个人设置分类">
        <button
          id="schedule-tab"
          role="tab"
          :aria-selected="tab === 'schedule'"
          aria-controls="schedule-panel"
          :class="{ active: tab === 'schedule' }"
          @click="tab = 'schedule'"
        >
          <Icon icon="lucide:calendar-clock" />计划任务</button
        ><button
          id="authorization-tab"
          role="tab"
          :aria-selected="tab === 'authorization'"
          aria-controls="authorization-panel"
          :class="{ active: tab === 'authorization' }"
          @click="tab = 'authorization'"
        >
          <Icon icon="lucide:users-round" />汇报授权
        </button>
        <span v-if="saving || failed" class="save-indicator" role="status"
          ><Icon
            :icon="saving ? 'lucide:loader-circle' : 'lucide:circle-alert'"
            :class="{ spinning: saving }"
          />{{ saving ? '正在保存' : '保存失败'
          }}<Button v-if="failed" type="link" size="small" @click="retry"
            >重试</Button
          ></span
        >
      </div>
      <div
        v-if="tab === 'schedule'"
        id="schedule-panel"
        role="tabpanel"
        aria-labelledby="schedule-tab"
        class="settings-panel"
      >
        <div class="section-heading">
          <h2><Icon icon="lucide:calendar-clock" />定时生成与通知</h2>
          <span>北京时间 · 只生成草稿，由我确认后提交</span>
        </div>
        <div class="schedule-grid">
          <article
            v-for="type in types"
            :key="type.key"
            class="schedule-card"
            :class="`report-kind-${type.kind}`"
          >
            <div class="schedule-card-body">
              <span class="report-type-icon"><Icon :icon="type.icon" /></span>
              <div>
                <h3>
                  {{ type.title }}
                </h3>
                <p>
                  {{
                    type.kind === 'personal'
                      ? '整理我的工作记录'
                      : type.kind === 'project'
                        ? '按已添加项目分别生成'
                        : '按已添加客户分别生成'
                  }}
                </p>
              </div>
            </div>
            <div class="schedule-card-actions">
              <span
                class="schedule-badge"
                :class="{ inactive: !drafts[type.key]?.enabled }"
                ><Icon icon="lucide:clock-3" />{{
                  drafts[type.key]?.enabled
                    ? personalScheduleLabel(
                        drafts[type.key],
                        type.period,
                      )?.replace('（北京时间）生成草稿', '')
                    : '未启用'
                }}</span
              ><span class="enable-label">启用</span
              ><Switch
                size="small"
                :checked="drafts[type.key]?.enabled"
                :aria-label="`启用${type.title}定时生成`"
                @change="
                  (value) =>
                    updateSetting(type.key, { enabled: Boolean(value) })
                "
              /><Button
                class="schedule-edit"
                :aria-label="`编辑${type.title}计划任务`"
                :title="`编辑${type.title}计划任务`"
                @click="editSchedule(type.key)"
                ><Icon icon="lucide:pencil-line" /><span>编辑</span></Button
              >
            </div>
          </article>
        </div>
        <p class="section-note">
          自动生成不会自动提交、分享或创建任务。生成范围沿用项目、客户列表中已添加的对象。当前为本地演示配置。
        </p>
      </div>
      <div
        v-else
        id="authorization-panel"
        role="tabpanel"
        aria-labelledby="authorization-tab"
        class="settings-panel"
      >
        <Table
          class="authorization-table"
          bordered
          :columns="authorizationColumns"
          :data-source="types"
          row-key="key"
          :pagination="false"
          :scroll="{ x: 840 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'type'"
              ><div class="type-label" :class="`report-kind-${record.kind}`">
                <span class="report-type-icon"
                  ><Icon :icon="record.icon" /></span
                ><strong>{{ record.title }}</strong>
              </div></template
            >
            <template
              v-else-if="
                column.key === 'recipients' || column.key === 'reviewers'
              "
            >
              <div class="authorized-people">
                <span
                  v-for="person in peopleFor(record.key, column.key)"
                  :key="person.value"
                  class="person-chip"
                  :title="`${person.label} · ${person.department} · ${person.number}`"
                  ><span class="person-avatar">{{
                    person.label.slice(0, 1)
                  }}</span
                  ><span>{{ person.label }}</span
                  ><button
                    v-if="!locked(record.key)"
                    type="button"
                    class="person-remove"
                    :title="`移除${person.label}`"
                    :aria-label="`移除${person.label}的${column.key === 'recipients' ? '查看' : '审批'}授权`"
                    @click="removePerson(record.key, column.key, person.value)"
                  >
                    <Icon icon="lucide:x" /></button
                ></span>
                <span
                  v-if="!peopleFor(record.key, column.key).length"
                  class="empty-people"
                  >{{
                    locked(record.key) ? '管理员统一配置' : '未添加人员'
                  }}</span
                >
                <Button
                  class="people-picker-trigger"
                  type="text"
                  :disabled="locked(record.key)"
                  :aria-label="`为${record.title}添加${column.key === 'recipients' ? '分享人员' : '审批人'}`"
                  @click="openPicker(record.key, column.key)"
                  ><Icon icon="lucide:plus" />添加</Button
                >
              </div>
              <small
                v-if="column.key === 'reviewers' && record.kind === 'customer'"
                class="policy-note"
                >运维负责人审批由系统保留，可添加额外审批人</small
              >
              <small
                v-if="column.key === 'recipients' && record.kind === 'project'"
                class="policy-note"
                >系统仍按既定规则向 PMO 提报</small
              >
            </template>
          </template>
        </Table>
      </div>
      <Modal
        :open="scheduleOpen"
        :title="`${editingType?.title ?? ''} · 计划任务`"
        :width="520"
        :footer="null"
        @cancel="scheduleOpen = false"
        ><div v-if="editingType && editingSetting" class="schedule-form">
          <p>修改后自动保存，无需提交。</p>
          <label v-if="editingType.period === 'week'"
            >生成日期<Select
              :value="editingSetting.weekday"
              :options="weekdays"
              @change="
                (value) => updateSetting(editKey, { weekday: Number(value) })
              " /></label
          ><label v-else-if="editingType.period === 'month'"
            >每月生成日<InputNumber
              :value="editingSetting.monthDay"
              :min="1"
              :max="28"
              :precision="0"
              @change="
                (value) => {
                  if (typeof value === 'number' && value >= 1 && value <= 28)
                    updateSetting(editKey, { monthDay: value });
                }
              " /></label
          ><label v-else
            >生成日期<Select
              :value="editingSetting.workdaysOnly ? 'workdays' : 'everyday'"
              :options="[
                { value: 'workdays', label: '工作日（周一至周五）' },
                { value: 'everyday', label: '每天' },
              ]"
              @change="
                (value) =>
                  updateSetting(editKey, { workdaysOnly: value === 'workdays' })
              " /></label
          ><label
            >生成时间<Input
              :value="editingSetting.time"
              type="time"
              @change="
                (event) =>
                  updateSetting(editKey, { time: event.target.value ?? '' })
              "
          /></label>
          <div class="schedule-description">
            <Icon icon="lucide:clock-3" />{{
              personalScheduleLabel(
                { ...editingSetting, enabled: true },
                editingType.period,
              )
            }}
          </div>
          <small
            >{{
              editingType.period === 'day'
                ? '整理当日生成时刻前的记录'
                : '汇总上一完整报告周期的素材'
            }}。开启后按计划生成草稿，不会自动提交。</small
          >
        </div></Modal
      >
      <Modal
        :open="pickerOpen"
        :title="`${pickerType?.title ?? ''} · ${pickerMode === 'recipients' ? '添加分享人员' : '添加审批人'}`"
        :width="800"
        @cancel="pickerOpen = false"
      >
        <div class="people-picker">
          <p>
            选择后点击“应用”追加到当前报告类型，或“应用到所有报告类型”。重复人员不会重复添加，翻页保留本次勾选。
          </p>
          <div class="people-query">
            <Select
              v-model:value="department"
              :options="[{ value: 'all', label: '全部部门' }, ...departments]"
              aria-label="按部门筛选人员"
            /><Input
              v-model:value="search"
              placeholder="搜索姓名或工号"
              aria-label="搜索姓名或工号"
              allow-clear
              ><template #prefix><Icon icon="lucide:search" /></template
            ></Input>
          </div>
          <div class="people-selection-summary">
            <span>本次已选 {{ pickerIds.length }} 人</span
            ><span>应用时自动去重</span>
          </div>
          <Table
            size="middle"
            row-key="value"
            :columns="peopleColumns"
            :data-source="people"
            :locale="{ emptyText: '暂无符合条件的人员' }"
            :row-selection="selection"
            :scroll="{ x: 600, y: 340 }"
            :pagination="{
              current: page,
              pageSize: 8,
              total: people.length,
              showSizeChanger: false,
              showTotal: (total) => `共 ${total} 人`,
            }"
            @change="(pagination) => (page = pagination.current ?? 1)"
          />
        </div>
        <template #footer
          ><div class="people-picker-footer">
            <span>仅追加所选人员，保留已有授权</span
            ><Button :disabled="applying" @click="pickerOpen = false"
              >取消</Button
            ><Button
              :loading="applying"
              :disabled="!pickerIds.length"
              @click="applyPeople(true)"
              >应用到所有报告类型</Button
            ><Button
              type="primary"
              :loading="applying"
              :disabled="!pickerIds.length"
              @click="applyPeople(false)"
              >应用</Button
            >
          </div></template
        >
      </Modal>
    </section>
  </ConfigProvider>
</template>
<style scoped>
.personal-report-settings {
  flex: 1;
  min-height: 0;
  min-width: 0;
  overflow: auto;
  padding: 24px;
  background: #fff;
  color: #294638;
}
.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
}
h1 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 7px;
}
.settings-header p {
  font-size: 13px;
  color: #839489;
  margin: 0;
}
.save-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b917d;
  white-space: nowrap;
}
.settings-tabs {
  display: flex;
  gap: 24px;
  border-bottom: 1px solid #dce7e0;
  margin-bottom: 24px;
}
.settings-tabs button {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 12px 2px;
  border: 0;
  border-bottom: 2px solid transparent;
  color: #61776a;
  background: none;
  font-size: 14px;
  cursor: pointer;
}
.settings-tabs button.active {
  color: #247d69;
  font-weight: 600;
  border-bottom-color: #247d69;
}
.settings-tabs button:focus-visible {
  outline: 2px solid #5a9b82;
  outline-offset: 2px;
}
.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
}
.section-heading h2 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}
.section-heading > span {
  color: #6b7e72;
  font-size: 12px;
}
.schedule-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}
.schedule-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  padding: 20px;
  border: 1px solid #dee8e2;
  border-radius: 14px;
  background: linear-gradient(115deg, var(--type-soft) 0%, #fff 48%);
  box-shadow: 0 3px 12px #28533a06;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease;
}
.schedule-card:hover {
  border-color: var(--type-border);
  box-shadow: 0 6px 20px #28533a0d;
}
.report-kind-personal {
  --type-color: #216d53;
  --type-soft: #edf7f1;
  --type-border: #bbd9c7;
}
.report-kind-project {
  --type-color: #2c6091;
  --type-soft: #eef5fc;
  --type-border: #bfd4e8;
}
.report-kind-customer {
  --type-color: #a25c20;
  --type-soft: #fff5e9;
  --type-border: #efd4b3;
}
.schedule-card-body {
  display: flex;
  align-items: center;
  gap: 13px;
}
.report-type-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 12px;
  color: var(--type-color);
  background: var(--type-soft);
  border: 1px solid var(--type-border);
}
.report-type-icon :deep(svg) {
  color: var(--type-color);
  width: 21px;
  height: 21px;
}
.schedule-card h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  margin: 0;
}
.schedule-card h3 i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #b9c7be;
}
.schedule-card h3 i.enabled {
  background: #22b385;
  box-shadow: 0 0 0 4px #e1f6ed;
}
.schedule-card p {
  font-size: 12px;
  color: #657a6d;
  margin: 6px 0 0;
}
.schedule-card-actions {
  display: flex;
  align-items: center;
  gap: 9px;
  flex-wrap: wrap;
}
.schedule-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: var(--type-color);
  background: var(--type-soft);
  padding: 6px 9px;
  border-radius: 7px;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
.schedule-badge.inactive {
  color: #6e7c74;
  background: #f0f3f1;
}
.enable-label {
  font-size: 11px;
  color: #64796c;
}
.schedule-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 32px;
  padding: 0 10px;
  border-radius: 8px;
  color: #315f4c !important;
  background: #edf5f0 !important;
  border-color: #c7dacf !important;
  font-size: 12px;
  box-shadow: none;
}
.schedule-edit :deep(svg),
.schedule-edit :deep(span) {
  color: #315f4c !important;
}
.schedule-edit:hover {
  background: #deeee4 !important;
  border-color: #83ad95 !important;
}
.schedule-edit:focus-visible {
  outline: 2px solid #39856a;
  outline-offset: 3px;
}
.section-note,
.authorization-help {
  font-size: 12px;
  color: #87988c;
  line-height: 1.8;
  margin: 16px 0;
}
.authorization-table {
  padding: 8px 20px 0;
  background: white;
  border: 1px solid #e1eae4;
  border-radius: 12px;
}
.authorization-table :deep(.ant-table-thead > tr > th) {
  color: #7f9285;
  background: #f7faf8;
  font-size: 12px;
}
.authorization-table :deep(.ant-table-tbody > tr > td) {
  padding: 20px 16px;
}
.type-label {
  display: flex;
  align-items: center;
  gap: 11px;
  font-size: 13px;
}
.type-label > svg {
  color: #749b86;
  font-size: 19px;
}
.type-label strong {
  font-weight: 600;
}
.authorized-people {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.person-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: #f1f6f3;
  color: #5e806b;
  padding: 4px 7px;
  border-radius: 6px;
  font-size: 12px;
}
.person-chip svg {
  font-size: 12px;
}
.empty-people,
.more-people {
  font-size: 12px;
  color: #9aa89f;
}
.people-picker-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  margin-top: 8px;
  height: 25px;
  font-size: 12px;
}
.policy-note {
  display: block;
  font-size: 10px;
  color: #9aa89e;
  margin-top: 3px;
}
.schedule-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  color: #54725f;
}
.schedule-form p,
.people-picker > p {
  color: #8a9b8f;
  font-size: 12px;
  line-height: 1.8;
  margin: 8px 0 12px;
}
.schedule-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 13px;
}
.schedule-form small {
  color: #92a095;
  line-height: 1.8;
}
.schedule-description {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 12px;
  background: #f1f7f3;
  border-radius: 8px;
  font-size: 12px;
}
.people-query {
  display: flex;
  gap: 10px;
}
.people-query :deep(.ant-select) {
  flex-shrink: 0;
  width: 180px;
}
.people-selection-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 14px 0;
  font-size: 12px;
  color: #76907f;
}
.people-picker :deep(.ant-table-thead > tr > th) {
  background: #f5f8f6;
  font-size: 12px;
  color: #7d9284;
}
.people-picker :deep(.ant-table-tbody > tr > td) {
  font-size: 13px;
}
.mandatory-note {
  padding: 8px 10px;
  background: #faf6ea;
  border-radius: 6px;
}
@keyframes setting-spin {
  to {
    transform: rotate(360deg);
  }
}
.spinning {
  animation: setting-spin 1s linear infinite;
}
@media (max-width: 1050px) {
  .schedule-grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 650px) {
  .personal-report-settings {
    padding: 16px;
  }
  .settings-header {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .people-query {
    flex-wrap: wrap;
  }
  .people-query :deep(.ant-select) {
    width: 100%;
  }
}
@media (prefers-reduced-motion: reduce) {
  .spinning {
    animation: none;
  }
}

.personal-report-settings {
  padding-top: 8px;
}
.save-indicator {
  margin-left: auto;
}
.authorization-table {
  padding: 0;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #dfe8e2;
}
.authorization-table :deep(.ant-table-container) {
  border: 0 !important;
}
.authorization-table :deep(.ant-table-thead > tr > th) {
  background: #f1f6f3;
  color: #214f3b;
  font-weight: 600;
  font-size: 12px;
  padding: 15px 18px;
}
.authorization-table :deep(.ant-table-tbody > tr > td) {
  padding: 19px 18px;
  border-color: #e7eee9;
}
.authorization-table :deep(.ant-table-tbody > tr:last-child > td) {
  border-bottom: 0;
}
.authorization-table :deep(.ant-table-tbody > tr:hover > td) {
  background: #fbfdfb;
}
.person-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 5px 3px 4px;
  background: #f3f7f4;
  border: 1px solid #e4ece6;
  border-radius: 20px;
  color: #526f5b;
  font-size: 12px;
  transition: background 160ms ease;
}
.person-chip:hover,
.person-chip:focus-within {
  background: #eaf3ed;
}
.person-avatar {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  background: #79a38b;
  color: white;
  font-size: 10px;
  border-radius: 50%;
}
.person-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  opacity: 0;
  background: transparent;
  color: #7d9183;
  cursor: pointer;
}
.person-chip:hover .person-remove,
.person-chip:focus-within .person-remove {
  opacity: 1;
}
.person-remove:hover {
  background: #d9e7dd;
  color: #805d51;
}
.person-remove:focus-visible {
  outline: 2px solid #5d9275;
  outline-offset: 2px;
  opacity: 1;
}
.person-chip .person-remove svg {
  font-size: 12px;
}
.people-picker-trigger {
  margin: 0;
  padding: 3px 8px;
  height: 29px;
  border: 1px dashed #cfddd3;
  border-radius: 16px;
  font-size: 12px;
  color: #648570;
}
.people-picker-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-wrap: wrap;
}
.people-picker-footer > span {
  margin-right: auto;
  color: #94a094;
  font-size: 11px;
}
@media (hover: none) {
  .person-remove {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .person-chip {
    transition: none;
  }
  .schedule-card {
    transition: none;
  }
}
</style>
