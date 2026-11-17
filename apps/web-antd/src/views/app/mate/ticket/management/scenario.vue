<script setup lang="ts">
import type { TableColumnType } from 'ant-design-vue';

import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  DatePicker,
  Input,
  message,
  Modal,
  Progress,
  Select,
  Switch,
  Table,
  Tag,
} from 'ant-design-vue';

const router = useRouter();

/** 实施步骤定义（6 步标准流程） */
const IMPLEMENTATION_STEP_NAMES = [
  '业务要求',
  '工单信息',
  '状态流转',
  '派单规则',
  '时限提醒',
  '发布',
] as const;

type ImplementationStepName = (typeof IMPLEMENTATION_STEP_NAMES)[number];

/** 实施状态：发布后立即生效，无审核环节 */
type ImplementationStatus =
  | 'configuring' // 配置中：正在 6 步向导内配置（含配置完成未发布）
  | 'published'; // 已发布：版本已发布并立即生效

/** 发布状态：原有维度 */
type PublishStatus = 'archived' | 'draft' | 'published';

interface ImplementationStep {
  name: ImplementationStepName;
  done: boolean;
}

/** 扩展后的场景接口：包含制度、实施进度、操作人、启用状态 */
interface Scenario {
  id: string;
  name: string;
  code: string;
  description: string;

  // ===== 关联制度 =====
  regulationName: string;
  regulationCode: string;

  // ===== 实施维度 =====
  implementationStatus: ImplementationStatus;
  implementationSteps: ImplementationStep[];

  // ===== 启用状态 =====
  enabled: boolean;

  // ===== 发布维度 =====
  latestStatus: PublishStatus;
  latestVersion: string;
  lastPublishedVersion: string;

  // ===== 人员与时间 =====
  by: string; // 操作人
  updatedAt: string;
}

/** 从 implementationSteps 动态派生的计算值（避免在 Mock 数据中重复维护） */
function getStepDoneCount(s: any): number {
  return (s.implementationSteps as ImplementationStep[]).filter((x) => x.done)
    .length;
}
function getStepProgress(s: any): number {
  return calcProgress(s.implementationSteps as ImplementationStep[]);
}
function getPendingStepName(s: any): string {
  return getCurrentPendingStep(s.implementationSteps as ImplementationStep[]);
}
const TOTAL_STEPS = IMPLEMENTATION_STEP_NAMES.length;

/** 版本状态：草稿 / 生效 / 历史（发布即生效，无审核） */
type HistoryVersionStatus = 'active' | 'archived' | 'draft';

interface HistoryVersion {
  by: string;
  date: string;
  note: string;
  status: HistoryVersionStatus;
  version: string;
}

/** 构造实施步骤数组 */
function buildSteps(doneCount: number): ImplementationStep[] {
  return IMPLEMENTATION_STEP_NAMES.map((name, idx) => ({
    name,
    done: idx < doneCount,
  }));
}

/** 计算实施进度百分比 */
function calcProgress(steps: ImplementationStep[]): number {
  const done = steps.filter((s) => s.done).length;
  return Math.round((done / steps.length) * 100);
}

/** 获取当前待处理步骤名 */
function getCurrentPendingStep(steps: ImplementationStep[]): string {
  const pending = steps.find((s) => !s.done);
  return pending ? pending.name : '—';
}

// ==================== Mock 数据（3 个场景，覆盖全状态组合） ====================

const scenarios = ref<Scenario[]>([
  {
    id: 's1',
    name: '运维工单',
    code: 'ops-ticket',
    description: '面向设备运维工单：报修、派单、SLA、超时升级与闭环。',
    regulationName: '《IT 运维管理规范》',
    regulationCode: 'IT-OM-2026-003',
    implementationStatus: 'published',
    implementationSteps: buildSteps(6),
    enabled: true,
    latestStatus: 'published',
    latestVersion: 'v1.2.0',
    lastPublishedVersion: 'v1.2.0',
    by: '韩立',
    updatedAt: '2026-08-20 10:22',
  },
  {
    id: 's2',
    name: '需求工单',
    code: 'req-ticket',
    description: '需求收集与流转：提需求、评审、排期与上线跟踪。',
    regulationName: '《产品需求管理办法》',
    regulationCode: 'PM-RM-2026-001',
    implementationStatus: 'configuring',
    implementationSteps: buildSteps(3),
    enabled: true,
    latestStatus: 'draft',
    latestVersion: 'v0.5.0',
    lastPublishedVersion: 'v0.4.0',
    by: '李明哲',
    updatedAt: '2026-09-26 09:12',
  },
  {
    id: 's3',
    name: '售后工单',
    code: 'after-sales-ticket',
    description: '售后服务工单：故障受理、备件更换、维修回访与满意度评价。',
    regulationName: '《售后服务管理规范》',
    regulationCode: 'AS-SM-2026-009',
    implementationStatus: 'published',
    implementationSteps: buildSteps(6),
    enabled: false,
    latestStatus: 'published',
    latestVersion: 'v1.1.0',
    lastPublishedVersion: 'v1.1.0',
    by: '张伟',
    updatedAt: '2026-09-05 15:40',
  },
]);

/** 历史版本说明与日期模板（Demo 展示用） */
const ACTIVE_NOTE = '当前生效版本，用于新产生的工单';
const ARCHIVE_NOTES = [
  '初版发布，建立工单字段与基础流转',
  '补充派单规则与超时升级策略',
  '优化状态流转与提醒配置',
];
const ACTIVE_DATE = '2026-08-20 10:22';
const ARCHIVE_DATES = [
  '2026-07-15 18:30',
  '2026-07-01 09:00',
  '2026-06-10 14:00',
];

/** 计算上一个次版本号 */
function prevVersion(v: string): null | string {
  const [major = 0, minor = 0] = v
    .replace('v', '')
    .split('.')
    .map((p: string) => Number.parseInt(p, 10) || 0);
  if (minor > 0) return `v${major}.${minor - 1}.0`;
  if (major > 0) return `v${major - 1}.9.0`;
  return null;
}

/** 基于场景当前版本状态动态生成版本记录：草稿 / 生效 / 历史 */
function getVersionHistory(s: any): HistoryVersion[] {
  const list: HistoryVersion[] = [];
  const effective =
    s.latestStatus === 'published' ? s.latestVersion : s.lastPublishedVersion;
  const hasEffective = Boolean(effective && effective !== '—');

  // 当前编辑版本（草稿）
  if (s.latestStatus === 'draft') {
    list.push({
      version: s.latestVersion,
      date: s.updatedAt,
      by: s.by,
      status: 'draft',
      note: hasEffective
        ? `基于生效版本 ${effective} 复制，当前编辑中`
        : '初始草稿，配置完成后发布生效',
    });
  }

  // 当前生效版本
  if (hasEffective) {
    list.push({
      version: effective!,
      date: s.latestStatus === 'published' ? ACTIVE_DATE : ARCHIVE_DATES[0]!,
      by: s.by,
      status: 'active',
      note: ACTIVE_NOTE,
    });
  }

  // 历史版本：从生效版本向前推两条
  let cur = hasEffective ? prevVersion(effective!) : null;
  let idx = 0;
  while (cur && idx < 2) {
    list.push({
      version: cur,
      date: ARCHIVE_DATES[idx + 1] ?? ARCHIVE_DATES[0]!,
      by: s.by,
      status: 'archived',
      note: ARCHIVE_NOTES[idx % ARCHIVE_NOTES.length]!,
    });
    cur = prevVersion(cur);
    idx++;
  }

  return list;
}

// ==================== 搜索与筛选 ====================

const searchKeyword = ref('');
const filterImplementationStatus = ref<ImplementationStatus | undefined>(
  undefined,
);
const filterOwner = ref<string | undefined>(undefined);
const filterDateRange = ref<any>(null);

/** 可选操作人列表 */
const ownerOptions = computed(() => {
  const owners = new Set(scenarios.value.map((s) => s.by));
  return [...owners].map((o) => ({ label: o, value: o }));
});

/** 筛选后的场景列表 */
const filteredScenarios = computed(() => {
  return scenarios.value.filter((s) => {
    // 关键词：名称、编码、制度名、制度编号
    if (searchKeyword.value) {
      const kw = searchKeyword.value.toLowerCase();
      const hit =
        s.name.toLowerCase().includes(kw) ||
        s.code.toLowerCase().includes(kw) ||
        s.regulationName.toLowerCase().includes(kw) ||
        s.regulationCode.toLowerCase().includes(kw);
      if (!hit) return false;
    }
    if (
      filterImplementationStatus.value &&
      s.implementationStatus !== filterImplementationStatus.value
    )
      return false;
    if (filterOwner.value && s.by !== filterOwner.value) return false;
    // 更新时间范围筛选
    if (filterDateRange.value && Array.isArray(filterDateRange.value)) {
      const range = filterDateRange.value;
      const t = s.updatedAt;
      const start = range[0] ? String(range[0]).slice(0, 10) : null;
      const end = range[1] ? String(range[1]).slice(0, 10) : null;
      if (start && t < start) return false;
      if (end && t.slice(0, 10) > end) return false;
    }
    return true;
  });
});

/** 重置筛选 */
function resetFilters() {
  searchKeyword.value = '';
  filterImplementationStatus.value = undefined;
  filterOwner.value = undefined;
  filterDateRange.value = null;
}

// ==================== 状态映射函数 ====================

/** 场景状态开关：启用 / 禁用（禁用后不再产生新工单） */
function toggleEnabled(s: any, checked: any) {
  s.enabled = Boolean(checked);
  s.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
  message.success(
    s.enabled
      ? `场景「${s.name}」已启用`
      : `场景「${s.name}」已禁用，不再产生新工单`,
  );
}

/** 生效版本号：已发布场景取当前版本，其余取最近发布版本 */
function getEffectiveVersion(s: any): null | string {
  if (s.latestStatus === 'published') return s.latestVersion;
  return s.lastPublishedVersion === '—' ? null : s.lastPublishedVersion;
}

/** 配置中（草稿）版本号 */
function getDraftVersion(s: any): null | string {
  return s.latestStatus === 'draft' ? s.latestVersion : null;
}

// ==================== 表格列定义 ====================

const columns: TableColumnType<Scenario>[] = [
  { title: '场景', key: 'scenario', width: 180 },
  { title: '场景描述', key: 'description', width: 200 },
  { title: '配置进度', key: 'progress', width: 230 },
  { title: '版本', key: 'version', width: 170 },
  { title: '场景状态', key: 'sceneStatus', width: 100 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 150 },
  { title: '操作', key: 'action', width: 300, fixed: 'right' },
];

const pagination = { pageSize: 10, showSizeChanger: false };

// ==================== 操作函数 ====================

function openWizardForEdit(s: any) {
  if (s.latestStatus !== 'draft') {
    message.warning('当前版本已发布，无法直接编辑，请先创建新版本');
    return;
  }
  router.push({
    path: '/app/mate/apps/smart-ticket/wizard/scenario-description',
    query: { step: '1', id: s.id, mode: 'edit', version: s.latestVersion },
  });
}

function openWizardForView(s: any) {
  router.push({
    path: '/app/mate/apps/smart-ticket/wizard/scenario-description',
    query: { step: '1', id: s.id, mode: 'view', version: s.latestVersion },
  });
}

/** 基于生效版本复制生成新草稿，并进入向导继续配置 */
function createNewVersion(s: any) {
  const [major = 0, minor = 0] = s.latestVersion
    .replace('v', '')
    .split('.')
    .map((p: string) => Number.parseInt(p, 10) || 0);
  const newVersion = `v${major}.${minor + 1}.0`;
  s.lastPublishedVersion = s.latestVersion;
  s.latestVersion = newVersion;
  s.latestStatus = 'draft';
  s.updatedAt = new Date().toISOString().slice(0, 16).replace('T', ' ');
  s.by = '当前用户';
  // 新版本基于生效版本复制，实施进度重新确认
  s.implementationStatus = 'configuring';
  s.implementationSteps = buildSteps(0);
  message.success(
    `已基于生效版本 ${s.lastPublishedVersion} 复制生成 ${newVersion} 草稿，生效版本不受影响`,
  );
  router.push({
    path: '/app/mate/apps/smart-ticket/wizard/scenario-description',
    query: { step: '1', id: s.id, mode: 'edit', version: s.latestVersion },
  });
}

function openVersionHistory(s: any) {
  currentScenarioId.value = s.id;
  versionModalOpen.value = true;
}

function deleteScenario(s: any) {
  const idx = scenarios.value.findIndex((x) => x.id === s.id);
  if (idx !== -1) {
    scenarios.value.splice(idx, 1);
    message.success(`场景「${s.name}」已删除`);
  }
}

function confirmDelete(s: any) {
  Modal.confirm({
    title: '确认删除场景',
    content: `删除后无法恢复。是否删除场景「${s.name}」？`,
    okText: '删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => deleteScenario(s),
  });
}

// ==================== 新增场景 ====================

const modalOpen = ref(false);
const versionModalOpen = ref(false);
const currentScenarioId = ref('');
const form = ref({ name: '', code: '', description: '' });

/** 当前查看版本记录的场景 */
const currentScenario = computed(() =>
  scenarios.value.find((s) => s.id === currentScenarioId.value),
);

/** 版本记录：按场景版本状态动态生成（草稿 / 生效 / 历史） */
const versionHistoryList = computed(() =>
  currentScenario.value ? getVersionHistory(currentScenario.value) : [],
);

function openAdd() {
  form.value = { name: '', code: '', description: '' };
  modalOpen.value = true;
}

function startAddScenario() {
  openAdd();
}

function confirmAdd() {
  if (!form.value.name || !form.value.code) {
    message.warning('请填写场景名称与编码');
    return;
  }
  const newScenario: Scenario = {
    id: String(Date.now()),
    name: form.value.name,
    code: form.value.code,
    description: form.value.description || '新建场景，待补充配置。',
    regulationName: '未关联制度',
    regulationCode: '—',
    implementationStatus: 'configuring',
    implementationSteps: buildSteps(0),
    enabled: true,
    latestStatus: 'draft',
    latestVersion: 'v0.1.0',
    lastPublishedVersion: '—',
    by: '当前用户',
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
  };
  scenarios.value.unshift(newScenario);
  modalOpen.value = false;
  message.success(`场景「${newScenario.name}」已创建，开始 6 步配置`);
  router.push({
    path: '/app/mate/apps/smart-ticket/wizard/scenario-description',
    query: {
      step: '1',
      id: newScenario.id,
      mode: 'edit',
      version: newScenario.latestVersion,
    },
  });
}

function historyStatusTag(status: HistoryVersionStatus) {
  switch (status) {
    case 'active': {
      return { color: 'green', text: '已发布' };
    }
    case 'archived': {
      return { color: 'default', text: '历史' };
    }
    default: {
      return { color: 'orange', text: '配置中' };
    }
  }
}
</script>

<template>
  <section class="scenario-page">
    <header class="scenario-page__header">
      <div>
        <span>IMPLEMENTATION WORKSPACE</span>
        <h1>实施工作台</h1>
        <p>跟踪场景从制度关联到配置、审核、发布的全流程进度</p>
      </div>
      <div class="scenario-page__actions">
        <Button type="primary" @click="startAddScenario">
          <Icon icon="lucide:plus" />
          新增场景
        </Button>
      </div>
    </header>

    <div class="scenario-page__body">
      <!-- ========== 搜索与筛选 ========== -->
      <section class="filter-section">
        <div class="filter-section__row">
          <div class="filter-section__item filter-section__item--grow">
            <label>关键词</label>
            <Input
              v-model:value="searchKeyword"
              placeholder="搜索场景名称、编码、制度名称或编号"
              allow-clear
            >
              <template #prefix>
                <Icon icon="lucide:search" class="size-4 text-[#8ba8a0]" />
              </template>
            </Input>
          </div>

          <div class="filter-section__item">
            <label>配置状态</label>
            <Select
              v-model:value="filterImplementationStatus"
              placeholder="全部状态"
              allow-clear
              style="width: 140px"
            >
              <Select.Option value="configuring">配置中</Select.Option>
              <Select.Option value="published">已发布</Select.Option>
            </Select>
          </div>

          <div class="filter-section__item">
            <label>实施负责人</label>
            <Select
              v-model:value="filterOwner"
              placeholder="全部负责人"
              allow-clear
              style="width: 140px"
              :options="ownerOptions"
            />
          </div>

          <div class="filter-section__item">
            <label>更新时间</label>
            <DatePicker.RangePicker
              :value="filterDateRange"
              @update:value="filterDateRange = $event"
              format="YYYY-MM-DD"
              style="width: 220px"
            />
          </div>

          <div class="filter-section__item filter-section__item--actions">
            <Button @click="resetFilters">重置</Button>
          </div>
        </div>
      </section>

      <!-- ========== 场景列表 ========== -->
      <section class="list-section">
        <header class="list-section__header">
          <div>
            <Icon icon="lucide:list-todo" />
            <span>
              <h3>场景实施清单</h3>
              <p>
                共 {{ filteredScenarios.length }} /
                {{ scenarios.length }} 个场景
              </p>
            </span>
          </div>
        </header>

        <Table
          :columns="columns"
          :data-source="filteredScenarios"
          row-key="id"
          :pagination="pagination"
          size="middle"
          class="scenario-table"
        >
          <!-- 自定义列渲染 -->
          <template #bodyCell="{ column, record }">
            <!-- 场景（名称 + 编码） -->
            <template v-if="column.key === 'scenario'">
              <div class="cell-scenario">
                <div class="cell-scenario__name">{{ record.name }}</div>
                <div class="cell-scenario__code">{{ record.code }}</div>
              </div>
            </template>

            <!-- 场景描述 -->
            <template v-else-if="column.key === 'description'">
              <div class="cell-description" :title="record.description">
                {{ record.description }}
              </div>
            </template>

            <!-- 配置进度 -->
            <template v-else-if="column.key === 'progress'">
              <div class="cell-progress">
                <div class="cell-progress__header">
                  <Progress
                    :percent="getStepProgress(record)"
                    stroke-color="#10b981"
                    :show-info="false"
                    size="small"
                    class="!mb-0"
                  />
                </div>
                <div class="cell-progress__text">
                  <span class="cell-progress__count">
                    {{ getStepDoneCount(record) }}/{{ TOTAL_STEPS }} 步
                  </span>
                  <span
                    v-if="getPendingStepName(record) !== '—'"
                    class="cell-progress__pending"
                  >
                    · {{ getPendingStepName(record) }}
                  </span>
                  <span
                    v-else
                    class="cell-progress__pending cell-progress__pending--done"
                  >
                    · 已完成配置
                  </span>
                </div>
              </div>
            </template>

            <!-- 版本（生效版本 + 配置中版本） -->
            <template v-else-if="column.key === 'version'">
              <div class="cell-version">
                <div
                  v-if="getEffectiveVersion(record)"
                  class="cell-version__row"
                >
                  <span class="cell-version__num">
                    {{ getEffectiveVersion(record) }}
                  </span>
                  <Tag color="green" class="cell-version__tag">生效</Tag>
                </div>
                <span v-else class="cell-version__empty">生效版本 —</span>
                <div v-if="getDraftVersion(record)" class="cell-version__row">
                  <span class="cell-version__num">
                    {{ getDraftVersion(record) }}
                  </span>
                  <Tag color="orange" class="cell-version__tag">配置中</Tag>
                </div>
              </div>
            </template>

            <!-- 场景状态（启用开关） -->
            <template v-else-if="column.key === 'sceneStatus'">
              <Switch
                :checked="record.enabled"
                checked-children="启用"
                un-checked-children="禁用"
                @change="(checked: any) => toggleEnabled(record, checked)"
              />
            </template>

            <!-- 操作 -->
            <template v-else-if="column.key === 'action'">
              <div class="cell-actions">
                <!-- 配置中：继续配置 / 查看 / 版本记录 / 删除 -->
                <template v-if="record.implementationStatus === 'configuring'">
                  <Button
                    type="primary"
                    size="small"
                    @click="openWizardForEdit(record)"
                  >
                    <Icon icon="lucide:play" class="mr-0.5 size-3" />
                    继续配置
                  </Button>
                  <Button size="small" @click="openWizardForView(record)">
                    <Icon icon="lucide:eye" class="mr-0.5 size-3" />
                    查看
                  </Button>
                  <Button size="small" @click="openVersionHistory(record)">
                    <Icon icon="lucide:history" class="mr-0.5 size-3" />
                    版本记录
                  </Button>
                  <Button
                    size="small"
                    danger
                    type="text"
                    @click="confirmDelete(record)"
                  >
                    <Icon icon="lucide:trash-2" class="mr-0.5 size-3" />
                    删除
                  </Button>
                </template>

                <!-- 已发布：查看 / 新版本 / 版本记录 -->
                <template v-else>
                  <Button size="small" @click="openWizardForView(record)">
                    <Icon icon="lucide:eye" class="mr-0.5 size-3" />
                    查看
                  </Button>
                  <Button
                    type="primary"
                    size="small"
                    @click="createNewVersion(record)"
                  >
                    <Icon icon="lucide:git-branch" class="mr-0.5 size-3" />
                    新版本
                  </Button>
                  <Button size="small" @click="openVersionHistory(record)">
                    <Icon icon="lucide:history" class="mr-0.5 size-3" />
                    版本记录
                  </Button>
                </template>
              </div>
            </template>
          </template>
        </Table>
      </section>
    </div>

    <!-- 新增场景弹窗 -->
    <Modal
      v-model:open="modalOpen"
      title="新增场景"
      ok-text="创建并开始配置"
      @ok="confirmAdd"
    >
      <div class="space-y-4 py-2">
        <div>
          <label class="mb-1 block text-[12px] font-semibold text-[#315e55]">
            场景名称 *
          </label>
          <Input
            v-model:value="form.name"
            placeholder="如：运维工单、需求工单、上门工单"
          />
        </div>
        <div>
          <label class="mb-1 block text-[12px] font-semibold text-[#315e55]">
            场景编码 *
          </label>
          <Input
            v-model:value="form.code"
            placeholder="如 ops-ticket、req-ticket、onsite-ticket"
          />
        </div>
        <div>
          <label class="mb-1 block text-[12px] font-semibold text-[#315e55]">
            场景简介
          </label>
          <Input.TextArea
            v-model:value="form.description"
            :rows="3"
            placeholder="用一句话描述这个场景"
          />
        </div>
      </div>
    </Modal>

    <!-- 历史版本弹窗 -->
    <Modal
      v-model:open="versionModalOpen"
      :title="`历史版本 · ${currentScenario?.name ?? ''}`"
      :footer="null"
      width="720px"
    >
      <div class="overflow-hidden rounded-xl border border-[#e4edea]">
        <div
          class="grid grid-cols-[1fr_1.4fr_0.8fr_0.7fr_0.8fr] gap-3 border-b border-[#e4edea] bg-[#f6fbf9] px-4 py-3 text-[11px] font-bold text-[#5a756d]"
        >
          <span>版本号</span>
          <span>更新说明</span>
          <span>状态</span>
          <span>时间</span>
          <span>操作人</span>
        </div>
        <div
          v-for="h in versionHistoryList"
          :key="h.version"
          class="grid grid-cols-[1fr_1.4fr_0.8fr_0.7fr_0.8fr] items-center gap-3 border-b border-[#eef3f0] px-4 py-3 last:border-b-0"
        >
          <span>
            <Tag :color="historyStatusTag(h.status).color">{{ h.version }}</Tag>
          </span>
          <span class="text-[12px] leading-5 text-[#1f3b34]">{{ h.note }}</span>
          <span>
            <Tag :color="historyStatusTag(h.status).color">
              {{ historyStatusTag(h.status).text }}
            </Tag>
          </span>
          <span class="text-[12px] text-[#5a756d]">{{ h.date }}</span>
          <span class="text-[12px] text-[#1f3b34]">{{ h.by }}</span>
        </div>
      </div>
    </Modal>
  </section>
</template>

<style scoped>
/* ========== 响应式 ========== */
@media (max-width: 1400px) {
  .overview-section {
    grid-template-columns: repeat(3, 1fr);
  }

  .overview-card--total {
    grid-column: span 3;
  }
}

@media (max-width: 1024px) {
  .scenario-page__header {
    padding-right: 16px;
    padding-left: 16px;
  }

  .scenario-page__body {
    gap: 12px;
    padding: 14px;
  }

  .overview-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .overview-card--total {
    grid-column: span 2;
  }
}

.scenario-page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #f8fbfa;
  border: 1px solid #d5e4df;
  border-radius: 24px;
  box-shadow: 0 18px 44px rgb(18 57 45 / 6%);
}

/* ========== 页面头部 ========== */
.scenario-page__header {
  display: flex;
  flex: none;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
  min-height: 84px;
  padding: 15px 22px;
  background: rgb(255 255 255 / 88%);
  border-bottom: 1px solid #e0ebe7;
}

.scenario-page__header span {
  font-size: 10px;
  font-weight: 800;
  color: #0b8a73;
  letter-spacing: 0.12em;
}

.scenario-page__header h1 {
  margin: 3px 0 0;
  font-size: 22px;
  line-height: 1.2;
  color: #102e29;
}

.scenario-page__header p {
  margin: 5px 0 0;
  font-size: 12px;
  color: #6d827b;
}

.scenario-page__actions {
  display: flex;
  flex: none;
  gap: 8px;
  align-items: center;
}

/* ========== 页面主体 ========== */
.scenario-page__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 18px;
  overflow: auto;
}

/* ========== 实施概览 ========== */
.overview-section {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

.overview-card {
  position: relative;
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 16px;
  transition: all 0.2s ease;
}

.overview-card:hover {
  box-shadow: 0 6px 18px rgb(18 57 45 / 8%);
  transform: translateY(-1px);
}

.overview-card--active {
  background: linear-gradient(135deg, #f0fbf7 0%, #fff 100%);
  border-color: #0b6e65;
  box-shadow: 0 4px 14px rgb(11 110 101 / 12%);
}

.overview-card--total {
  cursor: default;
}

.overview-card--total:hover {
  box-shadow: none;
  transform: none;
}

.overview-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #fff;
  border-radius: 12px;
}

.overview-card--pending-config .overview-card__icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.overview-card--pending-review .overview-card__icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.overview-card--pending-publish .overview-card__icon {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.overview-card--completed .overview-card__icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.overview-card--total .overview-card__icon {
  background: linear-gradient(135deg, #0b6e65 0%, #095c53 100%);
}

.overview-card__icon svg,
.overview-card__icon :deep(.iconify) {
  width: 20px;
  height: 20px;
}

.overview-card__info {
  display: flex;
  flex-direction: column;
}

.overview-card__value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.1;
  color: #102e29;
}

.overview-card__label {
  margin-top: 2px;
  font-size: 12px;
  color: #6d827b;
}

.overview-card__dot {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.overview-card--pending-config .overview-card__dot {
  background: #f59e0b;
}

.overview-card--pending-review .overview-card__dot {
  background: #3b82f6;
}

.overview-card--pending-publish .overview-card__dot {
  background: #8b5cf6;
}

.overview-card--completed .overview-card__dot {
  background: #10b981;
}

/* ========== 筛选区 ========== */
.filter-section {
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 16px;
}

.filter-section__row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
}

.filter-section__item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-section__item--grow {
  flex: 1;
  min-width: 280px;
}

.filter-section__item label {
  font-size: 11px;
  font-weight: 600;
  color: #5a756d;
  letter-spacing: 0.02em;
}

.filter-section__item--actions {
  margin-left: auto;
}

/* ========== 列表区 ========== */
.list-section {
  flex: 1;
  min-height: 0;
  padding: 18px 18px 14px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #e4edea;
  border-radius: 18px;
}

.list-section__header {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.list-section__header > div {
  display: flex;
  gap: 10px;
  align-items: center;
}

.list-section__header > div > svg,
.list-section__header > div > span :deep(.iconify) {
  display: block;
  width: 20px;
  height: 20px;
  padding: 10px;
  color: #0b6e65;
  background: #e9f5f1;
  border-radius: 12px;
}

.list-section__header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #0c4a3f;
}

.list-section__header p {
  margin: 3px 0 0;
  font-size: 11px;
  color: #6d827b;
}

/* ========== 单元格样式 ========== */
.cell-scene__name {
  font-size: 13px;
  font-weight: 600;
  color: #0c4a3f;
}

.cell-scene__code {
  margin-top: 2px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: #7a948c;
}

.cell-scenario__name {
  font-size: 13px;
  font-weight: 600;
  color: #102e29;
}

.cell-scenario__code {
  margin-top: 2px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px;
  color: #7a948c;
}

.cell-description {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  font-size: 12px;
  line-height: 1.6;
  color: #536b65;
  -webkit-box-orient: vertical;
}

.cell-progress__header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.cell-progress__text {
  margin-top: 6px;
  font-size: 11px;
  color: #5a756d;
}

.cell-progress__count {
  font-weight: 600;
  color: #315e55;
}

.cell-progress__pending {
  color: #8ba8a0;
}

.cell-progress__pending--done {
  font-weight: 600;
  color: #059669;
}

.cell-version {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cell-version__row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.cell-version__num {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  font-weight: 600;
  color: #102e29;
}

.cell-version__tag {
  padding: 0 6px;
  margin: 0;
  font-size: 10px;
  line-height: 16px;
}

.cell-version__empty {
  font-size: 11px;
  color: #8ba8a0;
}

.cell-actions {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

/* ========== 表格覆盖样式 ========== */
:deep(.ant-btn-primary) {
  background: #0b6e65;
  border-color: #0b6e65;
}

:deep(.ant-table) {
  background: transparent;
}

:deep(.ant-table-thead > tr > th) {
  font-size: 12px;
  font-weight: 600;
  color: #315e55;
  background: #f6fbf9;
  border-bottom: 1px solid #e4edea;
}

:deep(.ant-table-tbody > tr > td) {
  font-size: 12px;
  color: #536b65;
  border-bottom: 1px solid #eef5f2;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f8fdfa;
}

:deep(.ant-tag) {
  margin: 0;
}

:deep(.ant-progress-inner) {
  background-color: #e4edea;
}
</style>
