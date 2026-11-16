<script setup lang="ts">
import type { ReportPeriod, ReportType } from './demo-state';

import { computed, ref } from 'vue';

import { Icon } from '@iconify/vue';
import {
  Button,
  Empty,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Switch,
  Tabs,
  Tag,
  TimePicker,
} from 'ant-design-vue';

import {
  addMyApproval,
  contactRelationColors,
  mateContactOptions,
  mockMyApprovals,
  removeMyApproval,
  reportPeriodLabels,
  reportTypeIcons,
  reportTypeLabels,
} from './demo-state';

const activeTab = ref<'approvals' | 'config' | 'tasks'>('tasks');

// ===== 计划任务 =====
const weekly = ref({
  enabled: true,
  generateDay: 5,
  generateTime: '18:00',
  submitMode: 'notify' as 'draft' | 'notify' | 'submit',
});

const daily = ref({
  enabled: true,
  frequency: 'workday' as 'daily' | 'workday',
  submitTime: '18:30',
  notifyEnabled: true,
  allowViewContent: true,
});

const weekdayOptions = [
  '周一',
  '周二',
  '周三',
  '周四',
  '周五',
  '周六',
  '周日',
].map((label, index) => ({ label, value: index + 1 }));
const frequencyOptions = [
  { label: '工作日', value: 'workday' },
  { label: '每天', value: 'daily' },
];
const submitModeOptions = [
  { label: '通知', value: 'notify' },
  { label: '生成草稿', value: 'draft' },
  { label: '直接提交', value: 'submit' },
];

const scheduleTasks = computed(() => [
  {
    id: 'task-weekly',
    name: '周报',
    icon: 'lucide:notebook-pen',
    scheduleLabel: `${weekdayOptions.find((w) => w.value === weekly.value.generateDay)?.label} ${weekly.value.generateTime}`,
    desc: `提交方式：${submitModeOptions.find((s) => s.value === weekly.value.submitMode)?.label}`,
    enabled: weekly.value.enabled,
    type: 'weekly' as const,
  },
  {
    id: 'task-daily',
    name: '日报',
    icon: 'lucide:calendar-check',
    scheduleLabel: `${frequencyOptions.find((f) => f.value === daily.value.frequency)?.label} ${daily.value.submitTime}`,
    desc: `${daily.value.notifyEnabled ? '通知' : '不通知'} · ${daily.value.allowViewContent ? '允许可见' : '禁止可见'}`,
    enabled: daily.value.enabled,
    type: 'daily' as const,
  },
]);

const taskModalOpen = ref(false);
const editingTaskType = ref<'daily' | 'weekly'>('weekly');

function openTaskEdit(type: 'daily' | 'weekly') {
  editingTaskType.value = type;
  taskModalOpen.value = true;
}

function openTaskCreate() {
  editingTaskType.value = 'weekly';
  taskModalOpen.value = true;
  message.info('当前仅支持周报与日报计划任务');
}

function deleteTask(id: string) {
  if (id === 'task-weekly') weekly.value.enabled = false;
  else daily.value.enabled = false;
  message.success('已停用该计划任务');
}

function runTask(name: string) {
  message.success(`已手动触发「${name}」计划任务`);
}

// ===== 我能审批的人 =====
const reportTypeFilterOptions = computed(() => [
  { label: '全部类型', value: 'all' },
  ...(Object.keys(reportTypeLabels) as ReportType[]).map((value) => ({
    label: reportTypeLabels[value],
    value,
  })),
]);

const personReportTypeOptions = (
  Object.keys(reportTypeLabels) as ReportType[]
).map((value) => ({ label: reportTypeLabels[value], value }));

function toggleTask(type: 'daily' | 'weekly', checked: boolean) {
  if (type === 'weekly') weekly.value.enabled = checked;
  else daily.value.enabled = checked;
}

// 我能审批的人
const approvalTypeFilter = ref<'all' | ReportType>('all');
const approvalNameSearch = ref('');
const filteredApprovals = computed(() =>
  mockMyApprovals.value.filter((e) => {
    if (
      approvalTypeFilter.value !== 'all' &&
      e.reportType !== approvalTypeFilter.value
    )
      return false;
    if (
      approvalNameSearch.value.trim() &&
      !e.name.includes(approvalNameSearch.value.trim())
    )
      return false;
    return true;
  }),
);

// 新增人员弹窗
const personModalOpen = ref(false);
const newPerson = ref({
  personIds: [] as string[],
  reportType: 'personal' as ReportType,
});

function openPersonModal() {
  newPerson.value = { personIds: [], reportType: 'personal' };
  personModalOpen.value = true;
}

function submitPerson() {
  if (newPerson.value.personIds.length === 0) {
    message.warning('请选择联系人');
    return;
  }
  const { reportType } = newPerson.value;
  let added = 0;
  let skipped = 0;
  for (const pid of newPerson.value.personIds) {
    const contact = mateContactOptions.find((item) => item.value === pid);
    const name = contact?.label.split('（')[0] || pid;
    const org = contact?.label.match(/（(.+?)）/)?.[1] || '';
    const ok = addMyApproval({ name, org, position: '—', reportType });
    if (ok) added++;
    else skipped++;
  }
  if (added === 0) {
    message.warning('所选人员已存在相同报告类型');
    return;
  }
  personModalOpen.value = false;
  message.success(
    `已添加 ${added} 位审批人${skipped ? `（${skipped} 人已存在）` : ''}`,
  );
}

function handleRemovePerson(id: string) {
  removeMyApproval(id);
  message.success('已移除');
}

// ===== 报告配置 =====
// 管理员在此统一维护数据源与报告类型；配置后由对应业务助理发起生成。
interface DataSourceConfig {
  id: string;
  name: string;
  method: string;
  endpoint?: string;
}

interface ReportTypeConfig {
  id: string;
  name: string;
  period: ReportPeriod;
  reportType: ReportType;
  sourceIds: string[];
  approver: string[];
  prompt: string;
}

const dataSourceMethods = [
  { label: '标准接口（MCP 推送）', value: 'MCP' },
  { label: 'Git Webhook', value: 'Git' },
  { label: '工单系统 API', value: 'Ticket' },
  { label: '数据库直连', value: 'DB' },
  { label: '手动导入', value: 'Manual' },
];

const methodLabelMap: Record<string, string> = {
  MCP: '标准接口（MCP 推送）',
  Git: 'Git Webhook',
  Ticket: '工单系统 API',
  DB: '数据库直连',
  Manual: '手动导入',
};

const dataSourceConfigs = ref<DataSourceConfig[]>([
  {
    id: 'ds-git',
    name: 'Git 仓库',
    method: 'Git',
    endpoint: 'https://git.woke.com/webhook',
  },
  {
    id: 'ds-ticket',
    name: '工单系统',
    method: 'Ticket',
    endpoint: 'https://ticket.woke.com/open-api',
  },
  {
    id: 'ds-task',
    name: '任务中心',
    method: 'MCP',
    endpoint: 'mcp://task-center',
  },
  {
    id: 'ds-ap',
    name: 'AP / U8 财务',
    method: 'DB',
    endpoint: 'mysql://u8-prod/ledger',
  },
]);

const sourceOptions = computed(() =>
  dataSourceConfigs.value.map((ds) => ({ label: ds.name, value: ds.id })),
);

const sourceNameMap = computed(() =>
  Object.fromEntries(dataSourceConfigs.value.map((ds) => [ds.id, ds.name])),
);

const approverOptions = [
  { label: '直属主管', value: '直属主管' },
  { label: '项目经理', value: '项目经理' },
  { label: '产品经理', value: '产品经理' },
  { label: '部门负责人', value: '部门负责人' },
];

const reportPeriodOptions = (
  Object.keys(reportPeriodLabels) as ReportPeriod[]
).map((value) => ({ label: reportPeriodLabels[value], value }));

const reportTypeConfigs = ref<ReportTypeConfig[]>([
  {
    id: 'rc-personal-daily',
    name: '个人日报',
    period: 'daily',
    reportType: 'personal',
    sourceIds: ['ds-git', 'ds-ticket', 'ds-task'],
    approver: ['直属主管'],
    prompt: '汇总当日代码提交、工单处理与任务进展，突出阻塞项与明日计划。',
  },
  {
    id: 'rc-personal-weekly',
    name: '个人周报',
    period: 'weekly',
    reportType: 'personal',
    sourceIds: ['ds-git', 'ds-ticket', 'ds-task', 'ds-ap'],
    approver: ['直属主管'],
    prompt: '按项目维度归并本周工作，给出风险与下周计划。',
  },
  {
    id: 'rc-project-weekly',
    name: '项目周报',
    period: 'weekly',
    reportType: 'project',
    sourceIds: ['ds-task', 'ds-ticket'],
    approver: ['项目经理', '产品经理'],
    prompt: '按里程碑汇总进度、延期项与跨部门依赖。',
  },
  {
    id: 'rc-department-monthly',
    name: '部门月报',
    period: 'monthly',
    reportType: 'department',
    sourceIds: ['ds-ap'],
    approver: ['部门负责人'],
    prompt: '汇总部门目标达成、人力投入与下月重点。',
  },
]);

// 已配置过的「报告类型」不可重复选择，避免重复发起同业务类型
const availableReportTypeOptions = computed(() =>
  (Object.keys(reportTypeLabels) as ReportType[])
    .filter(
      (value) =>
        !reportTypeConfigs.value.some((cfg) => cfg.reportType === value),
    )
    .map((value) => ({ label: reportTypeLabels[value], value })),
);

const sourceModalOpen = ref(false);
const newSource = ref<DataSourceConfig>({
  id: '',
  name: '',
  method: 'MCP',
});

function openSourceModal() {
  newSource.value = { id: '', name: '', method: 'MCP' };
  sourceModalOpen.value = true;
}

function submitSource() {
  const form = newSource.value;
  if (!form.name.trim()) {
    message.warning('请填写数据源名称');
    return;
  }
  dataSourceConfigs.value.push({
    id: `ds-${Date.now()}`,
    name: form.name.trim(),
    method: form.method,
  });
  sourceModalOpen.value = false;
  message.success('已新增数据源');
}

const reportTypeModalOpen = ref(false);
const newReportType = ref<ReportTypeConfig>({
  id: '',
  name: '',
  period: 'weekly',
  reportType: 'personal',
  sourceIds: [],
  approver: [],
  prompt: '',
});

function openReportTypeModal() {
  newReportType.value = {
    id: '',
    name: '',
    period: 'weekly',
    reportType: availableReportTypeOptions.value[0]?.value ?? 'personal',
    sourceIds: [],
    approver: [],
    prompt: '',
  };
  reportTypeModalOpen.value = true;
}

function submitReportType() {
  const form = newReportType.value;
  if (!form.reportType) {
    message.warning('请选择报告类型');
    return;
  }
  if (form.sourceIds.length === 0) {
    message.warning('请至少选择一个数据源');
    return;
  }
  if (form.approver.length === 0) {
    message.warning('请至少选择一位审批人');
    return;
  }
  const typeLabel = reportTypeLabels[form.reportType];
  const periodLabel = reportPeriodLabels[form.period];
  reportTypeConfigs.value.push({
    ...form,
    id: `rc-${Date.now()}`,
    name: `${typeLabel}${periodLabel}`,
    prompt: form.prompt.trim() || '按默认口径汇总本期工作。',
  });
  reportTypeModalOpen.value = false;
  message.success('已新增报告类型');
}

function handleRemoveReportType(config: ReportTypeConfig) {
  const index = reportTypeConfigs.value.findIndex((item) => item.id === config.id);
  if (index < 0) return;
  reportTypeConfigs.value.splice(index, 1);
  message.success(`已删除「${config.name}」`);
}
</script>

<template>
  <div class="settings-page">
    <div class="settings-body">
      <Tabs v-model:active-key="activeTab" class="settings-tabs">
        <!-- 计划任务 -->
        <Tabs.TabPane key="tasks" tab="计划任务">
          <div class="tab-toolbar">
            <div class="toolbar-title">
              <Icon icon="lucide:calendar-clock" />
              <span>定时生成与通知</span>
            </div>
            <Button type="primary" size="small" @click="openTaskCreate">
              <Icon icon="lucide:plus" />
              新建计划任务
            </Button>
          </div>
          <div class="task-grid">
            <div
              v-for="task in scheduleTasks"
              :key="task.id"
              class="task-card"
              :class="{ 'is-inactive': !task.enabled }"
            >
              <div class="task-card__info">
                <div class="task-card__header">
                  <span
                    class="status-dot"
                    :class="task.enabled ? 'is-active' : 'is-inactive'"
                  ></span>
                  <h3 class="task-card__title">
                    <Icon :icon="task.icon" />
                    {{ task.name }}
                  </h3>
                  <span class="cron-badge">{{ task.scheduleLabel }}</span>
                </div>
                <p class="task-card__desc">{{ task.desc }}</p>
              </div>
              <div class="task-card__actions">
                <div class="task-toggle">
                  <span>{{ task.enabled ? '启用' : '停用' }}</span>
                  <Switch
                    :checked="task.enabled"
                    size="small"
                    @change="(v) => toggleTask(task.type, !!v)"
                  />
                </div>
                <button
                  type="button"
                  class="btn-icon btn-icon-primary"
                  title="立即运行"
                  @click="runTask(task.name)"
                >
                  <Icon icon="lucide:play" />
                </button>
                <button
                  type="button"
                  class="btn-icon"
                  title="编辑"
                  @click="openTaskEdit(task.type)"
                >
                  <Icon icon="lucide:edit-3" />
                </button>
                <Popconfirm
                  title="确认停用该计划任务？"
                  @confirm="deleteTask(task.id)"
                >
                  <button
                    type="button"
                    class="btn-icon btn-icon-danger"
                    title="停用"
                  >
                    <Icon icon="lucide:trash-2" />
                  </button>
                </Popconfirm>
              </div>
            </div>
          </div>
        </Tabs.TabPane>

        <!-- 我能审批的人 -->
        <Tabs.TabPane key="approvals" tab="我能审批的人">
          <div class="filter-bar">
            <Select
              v-model:value="approvalTypeFilter"
              :options="reportTypeFilterOptions"
              size="middle"
              style="width: 160px"
            />
            <Input.Search
              v-model:value="approvalNameSearch"
              placeholder="人员名称模糊查询"
              allow-clear
              style="width: 240px"
            />
            <Button
              type="primary"
              size="middle"
              @click="openPersonModal()"
            >
              <Icon icon="lucide:plus" />
              新增
            </Button>
          </div>
          <div class="person-grid">
            <article
              v-for="entry in filteredApprovals"
              :key="entry.id"
              class="person-card"
            >
              <header class="person-card__head">
                <span class="person-avatar">{{ entry.name.charAt(0) }}</span>
                <div>
                  <strong>{{ entry.name }}</strong>
                  <small>{{ entry.org }}</small>
                </div>
              </header>
              <div class="person-card__body">
                <div class="person-field">
                  <span>岗位</span>
                  <b>{{ entry.position }}</b>
                </div>
                <div class="person-field">
                  <span>报告类型</span>
                  <Tag :color="contactRelationColors.approver">
                    <Icon :icon="reportTypeIcons[entry.reportType]" />
                    {{ reportTypeLabels[entry.reportType] }}
                  </Tag>
                </div>
              </div>
              <footer class="person-card__foot">
                <Popconfirm
                  title="确认移除？"
                  @confirm="handleRemovePerson(entry.id)"
                >
                  <Button size="small" type="text" danger>
                    <Icon icon="lucide:trash-2" />
                    删除
                  </Button>
                </Popconfirm>
              </footer>
            </article>
            <Empty
              v-if="filteredApprovals.length === 0"
              description="暂无审批人"
              class="grid-empty"
            />
          </div>
        </Tabs.TabPane>

        <!-- 报告配置 -->
        <Tabs.TabPane key="config" tab="报告配置">
          <div class="tab-toolbar">
            <div class="toolbar-title">
              <Icon icon="lucide:sliders-horizontal" />
              <span>报告类型与数据源</span>
            </div>
            <span class="config-hint">
              <Icon icon="lucide:info" />
               报告类型支持新增和删除；数据源在此统一配置
            </span>
          </div>

          <!-- 数据源配置 -->
          <section class="config-block">
            <header class="block-head">
              <div>
                <h3>数据源</h3>
                <p>配置后可在新增报告类型时选择，系统将定时自动汇总这些数据源。</p>
              </div>
              <Button size="small" @click="openSourceModal">
                <Icon icon="lucide:plug" />
                新增数据源
              </Button>
            </header>
            <div class="source-list">
              <div
                v-for="ds in dataSourceConfigs"
                :key="ds.id"
                class="source-chip"
              >
                <span class="source-name">{{ ds.name }}</span>
                <span class="source-method">{{ methodLabelMap[ds.method] }}</span>
                <span v-if="ds.endpoint" class="source-endpoint">
                  {{ ds.endpoint }}
                </span>
              </div>
            </div>
          </section>

          <!-- 报告类型配置 -->
          <section class="config-block">
            <header class="block-head">
              <div>
                <h3>报告类型</h3>
                <p>定义报告的生成频率、数据源、审批人与生成提示词。</p>
              </div>
              <Button size="small" type="primary" @click="openReportTypeModal">
                <Icon icon="lucide:plus" />
                新增报告类型
              </Button>
            </header>
            <div class="report-config-grid">
              <article
                v-for="cfg in reportTypeConfigs"
                :key="cfg.id"
                class="report-config-card"
              >
                <header>
                  <strong>{{ cfg.name }}</strong>
                  <Tag color="green">{{ reportPeriodLabels[cfg.period] }}</Tag>
                </header>
                <dl>
                  <div>
                    <dt>数据源</dt>
                    <dd>
                      <span
                        v-for="sid in cfg.sourceIds"
                        :key="sid"
                        class="source-tag"
                      >
                        {{ sourceNameMap[sid] }}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>审批人</dt>
                    <dd>{{ cfg.approver.join('、') }}</dd>
                  </div>
                </dl>
                <p class="config-prompt">{{ cfg.prompt }}</p>
                <footer class="config-card-foot">
                  <Popconfirm
                    :title="`确认删除「${cfg.name}」？历史报告不受影响。`"
                    ok-text="删除"
                    cancel-text="取消"
                    @confirm="handleRemoveReportType(cfg)"
                  >
                    <Button size="small" type="text" danger>
                      <Icon icon="lucide:trash-2" />
                      删除
                    </Button>
                  </Popconfirm>
                </footer>
              </article>
              <Empty
                v-if="reportTypeConfigs.length === 0"
                description="暂无报告类型"
                class="grid-empty"
              />
            </div>
          </section>

          <p class="config-note">
            <Icon icon="lucide:shield-check" />
            删除报告类型只影响后续发起配置，不影响已经生成的历史报告。
          </p>
        </Tabs.TabPane>
      </Tabs>
    </div>

    <!-- 计划任务编辑弹窗 -->
    <Modal
      v-model:open="taskModalOpen"
      :title="`${editingTaskType === 'weekly' ? '周报' : '日报'}计划任务`"
      :width="520"
      destroy-on-close
    >
      <div v-if="editingTaskType === 'weekly'" class="modal-form">
        <label class="modal-row">
          <span>启用</span>
          <Switch
            v-model:checked="weekly.enabled"
            checked-children="启用"
            un-checked-children="停用"
          />
        </label>
        <label class="modal-row">
          <span>生成星期</span>
          <Select
            v-model:value="weekly.generateDay"
            :options="weekdayOptions"
            :disabled="!weekly.enabled"
          />
        </label>
        <label class="modal-row">
          <span>生成时间</span>
          <TimePicker
            v-model:value="weekly.generateTime"
            value-format="HH:mm"
            format="HH:mm"
            :disabled="!weekly.enabled"
          />
        </label>
        <label class="modal-row">
          <span>提交方式</span>
          <Select
            v-model:value="weekly.submitMode"
            :options="submitModeOptions"
            :disabled="!weekly.enabled"
          />
        </label>
      </div>
      <div v-else class="modal-form">
        <label class="modal-row">
          <span>启用</span>
          <Switch
            v-model:checked="daily.enabled"
            checked-children="启用"
            un-checked-children="停用"
          />
        </label>
        <label class="modal-row">
          <span>是否通知</span>
          <Switch
            v-model:checked="daily.notifyEnabled"
            checked-children="通知"
            un-checked-children="不通知"
            :disabled="!daily.enabled"
          />
        </label>
        <label class="modal-row">
          <span>通知频率</span>
          <Select
            v-model:value="daily.frequency"
            :options="frequencyOptions"
            :disabled="!daily.enabled || !daily.notifyEnabled"
          />
        </label>
        <label class="modal-row">
          <span>通知时间</span>
          <TimePicker
            v-model:value="daily.submitTime"
            value-format="HH:mm"
            format="HH:mm"
            :disabled="!daily.enabled || !daily.notifyEnabled"
          />
        </label>
        <label class="modal-row">
          <span>是否允许对方看到日报内容</span>
          <Switch
            v-model:checked="daily.allowViewContent"
            checked-children="允许"
            un-checked-children="禁止"
            :disabled="!daily.enabled"
          />
        </label>
      </div>
    </Modal>

    <!-- 新增人员弹窗 -->
    <Modal
      v-model:open="personModalOpen"
      title="新增审批人"
      :width="480"
      destroy-on-close
      @ok="submitPerson"
    >
      <div class="modal-form">
        <label class="modal-row">
          <span>联系人（可多选）</span>
          <Select
            v-model:value="newPerson.personIds"
            mode="multiple"
            :options="mateContactOptions"
            placeholder="选择联系人"
            :max-tag-count="3"
          />
        </label>
        <label class="modal-row">
          <span>报告类型</span>
          <Select
            v-model:value="newPerson.reportType"
            :options="personReportTypeOptions"
          />
        </label>
      </div>
    </Modal>

    <!-- 新增数据源弹窗 -->
    <Modal
      v-model:open="sourceModalOpen"
      title="新增数据源"
      :width="480"
      destroy-on-close
      @ok="submitSource"
    >
      <div class="modal-form">
        <label class="modal-row">
          <span>数据源名称</span>
          <Input v-model:value="newSource.name" placeholder="如：畅捷通 T+" />
        </label>
        <label class="modal-row">
          <span>接入方式</span>
          <Select v-model:value="newSource.method" :options="dataSourceMethods" />
        </label>
      </div>
    </Modal>

    <!-- 新增报告类型弹窗 -->
    <Modal
      v-model:open="reportTypeModalOpen"
      title="新增报告类型"
      :width="560"
      destroy-on-close
      @ok="submitReportType"
    >
      <div class="modal-form">
        <label class="modal-row">
          <span>报告类型</span>
          <Select
            v-model:value="newReportType.reportType"
            :options="availableReportTypeOptions"
            placeholder="选择业务类型（已配置的不可重复）"
            :disabled="availableReportTypeOptions.length === 0"
          />
        </label>
        <p v-if="availableReportTypeOptions.length === 0" class="modal-tip">
          <Icon icon="lucide:info" />
          个人、项目、产品、部门 4 种业务类型均已配置，无需重复新增。
        </p>
        <label class="modal-row">
          <span>生成频率</span>
          <Select
            v-model:value="newReportType.period"
            :options="reportPeriodOptions"
          />
        </label>
        <label class="modal-row">
          <span>数据源（可多选）</span>
          <Select
            v-model:value="newReportType.sourceIds"
            mode="multiple"
            :options="sourceOptions"
            placeholder="从上方「数据源」中选择"
            :max-tag-count="4"
          />
        </label>
        <label class="modal-row">
          <span>审批人（可多选）</span>
          <Select
            v-model:value="newReportType.approver"
            mode="tags"
            :options="approverOptions"
            placeholder="选择或输入审批角色"
            :max-tag-count="4"
          />
        </label>
        <label class="modal-row">
          <span>生成提示词</span>
          <Input.TextArea
            v-model:value="newReportType.prompt"
            :auto-size="{ minRows: 3, maxRows: 5 }"
            placeholder="描述该报告的生成口径与重点关注项"
          />
        </label>
        <p class="modal-tip">
          <Icon icon="lucide:info" />
          配置后由对应业务助理通过能力接口发起生成，个人报告在报告中心本页发起。
        </p>
      </div>
    </Modal>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  color: #163f35;
  background: #f1f6f4;
  border: 1px solid #d4e3de;
  border-radius: 14px;
}

.settings-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: space-between;
  min-height: 82px;
  padding: 14px 22px;
  background: #fff;
  border-bottom: 1px solid #dbe7e3;
}

.header-left {
  min-width: 0;
}
.header-eyebrow {
  font-size: 12px;
  font-weight: 800;
  color: #087565;
  letter-spacing: 0.13em;
}
.settings-header h1 {
  display: inline;
  margin: 0 10px 0 0;
  font-size: 24px;
  color: #163f35;
}
.settings-header p {
  display: inline;
  margin: 0;
  font-size: 12px;
  color: #6f847d;
}
.save-primary {
  flex: none;
}

.settings-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 22px 22px;
}

.settings-tabs :deep(.ant-tabs-content) {
  padding-top: 8px;
}

.tab-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.toolbar-title {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  font-weight: 700;
  color: #174e42;
}

.toolbar-title svg {
  font-size: 18px;
  color: #087565;
}

/* 计划任务卡片（仿 automation.vue） */
.task-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 16px;
}

.task-card {
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid #d3e4de;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgb(18 57 45 / 5%);
  transition: 0.18s ease;
}

.task-card:hover {
  border-color: #9cc9bd;
  box-shadow: 0 8px 22px rgb(18 57 45 / 9%);
}

.task-card.is-inactive {
  opacity: 0.6;
}

.task-card__info {
  min-width: 0;
  flex: 1;
}

.task-card__header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex: none;
}

.status-dot.is-active {
  background: #10b981;
  box-shadow: 0 0 0 3px #d1fae5;
}
.status-dot.is-inactive {
  background: #cbd5e1;
}

.task-card__title {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #163f35;
}

.cron-badge {
  margin-left: auto;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
  color: #087565;
  background: #e8f5f0;
  border-radius: 999px;
}

.task-card__desc {
  margin: 8px 0 0;
  font-size: 12px;
  color: #6f847d;
}

.task-card__actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex: none;
}

.task-toggle {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: #6f847d;
  padding-right: 8px;
  border-right: 1px solid #edf3f0;
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  background: #f7fbf9;
  border: 1px solid #dceae4;
  border-radius: 8px;
  transition: 0.15s ease;
}

.btn-icon:hover {
  color: #087565;
  border-color: #9cc9bd;
  background: #eef6f3;
}
.btn-icon-primary {
  color: #087565;
}
.btn-icon-primary:hover {
  color: #fff;
  background: #0b6e65;
  border-color: #0b6e65;
}
.btn-icon-danger {
  color: #dc2626;
}
.btn-icon-danger:hover {
  color: #fff;
  background: #dc2626;
  border-color: #dc2626;
}

/* 筛选条 */
.filter-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 16px;
}

/* 人员卡片网格（仿 review.vue approval-grid） */
.person-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 14px;
}

.person-card {
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #d3e4de;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgb(18 57 45 / 4%);
  transition: 0.18s ease;
}

.person-card:hover {
  border-color: #9cc9bd;
  box-shadow: 0 8px 22px rgb(18 57 45 / 8%);
}

.person-card__head {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #edf3f0;
}

.person-avatar {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 14px;
  font-weight: 700;
  font-style: normal;
  color: #0b6e65;
  background: #d8efe8;
  border-radius: 50%;
}

.person-card__head strong {
  display: block;
  font-size: 14px;
  color: #0f2925;
}
.person-card__head small {
  display: block;
  font-size: 11px;
  color: #759087;
}

.person-card__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.person-field {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 12px;
}

.person-field span {
  color: #94a3b8;
  width: 60px;
  flex: none;
}
.person-field b {
  font-size: 13px;
  color: #2d4a44;
  font-weight: 600;
}

.person-card__foot {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #edf3f0;
}

.grid-empty {
  grid-column: 1 / -1;
  padding: 40px 0;
}

/* 待我处理 */
.incoming-card {
  padding: 16px 18px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #d3e4de;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgb(18 57 45 / 5%);
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-eyebrow {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  font-size: 12px;
  font-weight: 650;
  color: #176b5c;
}

.card-head p {
  margin: 6px 0 0;
  font-size: 12px;
  color: #58736c;
}

.incoming-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.incoming-item {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #fffbeb;
  border: 1px solid #fde8b8;
  border-radius: 8px;
}

.incoming-main {
  display: flex;
  gap: 10px;
  align-items: center;
  flex: 1;
  min-width: 0;
}
.incoming-main strong {
  display: block;
  font-size: 13px;
  color: #0f2925;
}
.incoming-main small {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #94a3b8;
}
.incoming-ops {
  display: flex;
  gap: 6px;
  flex: none;
}

/* 报告配置 */
.config-hint {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  font-size: 12px;
  color: #6f847d;
}

.config-hint svg {
  color: #0b806f;
}

.config-block {
  padding: 16px 18px;
  margin-bottom: 16px;
  background: #fff;
  border: 1px solid #d3e4de;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgb(18 57 45 / 5%);
}

.block-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.block-head h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #163f35;
}

.block-head p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #6f847d;
}

.source-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-chip {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 12px;
  background: #f6faf9;
  border: 1px solid #e2ece8;
  border-radius: 8px;
}

.source-name {
  flex: none;
  min-width: 96px;
  font-size: 13px;
  font-weight: 600;
  color: #0f2925;
}

.source-method {
  flex: none;
  padding: 2px 8px;
  font-size: 11px;
  color: #0b6e65;
  background: #e8f5f0;
  border-radius: 999px;
}

.source-endpoint {
  overflow: hidden;
  font-size: 12px;
  color: #8a9a94;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.report-config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 12px;
}

.report-config-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: #f6faf9;
  border: 1px solid #e2ece8;
  border-radius: 10px;
}

.report-config-card > header {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
}

.report-config-card > header strong {
  font-size: 14px;
  color: #0f2925;
}

.report-config-card dl {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
}

.report-config-card dl > div {
  display: flex;
  gap: 8px;
  align-items: baseline;
  font-size: 12px;
}

.report-config-card dt {
  flex: none;
  width: 56px;
  color: #94a3b8;
}

.report-config-card dd {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin: 0;
  font-weight: 600;
  color: #2d4a44;
}

.source-tag {
  padding: 1px 8px;
  font-size: 11px;
  font-weight: 500;
  color: #0b6e65;
  background: #e8f5f0;
  border-radius: 999px;
}

.config-prompt {
  margin: 0;
  padding-top: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #6f847d;
  border-top: 1px dashed #e2ece8;
}

.config-card-foot {
  display: flex;
  justify-content: flex-end;
  padding-top: 2px;
  margin-top: auto;
  border-top: 1px solid #e2ece8;
}

.config-note {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 2px 0 0;
  font-size: 12px;
  color: #8a9a94;
}

.config-note svg {
  color: #0b806f;
}

.modal-tip {
  display: flex;
  gap: 6px;
  align-items: center;
  margin: 0;
  font-size: 12px;
  color: #8a9a94;
}

.modal-tip svg {
  color: #0b806f;
}

/* 弹窗表单 */
.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
}

@media (max-width: 960px) {
  .settings-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  .task-grid {
    grid-template-columns: 1fr;
  }
  .person-grid {
    grid-template-columns: 1fr;
  }
}
</style>
