<script setup lang="ts">
import type { EntityRecognitionLog, ReportEntity } from './demo-state';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Icon } from '@iconify/vue';
import {
  Button,
  Drawer,
  Input,
  message,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Table,
  Tabs,
  Tag,
} from 'ant-design-vue';

import {
  addReportEntity,
  computeEntityUsageStats,
  ensureReportEntityLogs,
  entityLogActionMeta,
  entityLogsFor,
  entityPeriodPresets,
  entityPeriodRange,
  entityRecognitionLogs,
  filterEntityLogsByRange,
  markEntityLogsUnmapped,
  mergeReportEntities,
  removeEntityAlias,
  removeReportEntity,
  reportArchive,
  reportAuthorOf,
  reportEntityDictionary,
  reportEntityTypeMeta,
  reportsUsingEntity,
  updateReportEntity,
} from './demo-state';

const router = useRouter();

// 进入页面时为缺失识别流水的报告按正文自动补算（幂等）
onMounted(() => {
  for (const report of reportArchive) {
    ensureReportEntityLogs(report);
  }
});

// ===== 通用周期筛选 =====
type PresetKey = 'all' | 'half-year' | 'one-month' | 'two-weeks';
const preset = ref<PresetKey>('one-month');
const range = computed(() => entityPeriodRange(preset.value));
const allLogs = computed(() => entityRecognitionLogs.value);
const logsInRange = computed(() =>
  filterEntityLogsByRange(allLogs.value, ...range.value),
);

// ===== Tab 1：使用统计 =====
const statsTypeFilter = ref<ReportEntity['type'][]>([]);
const statsRows = computed(() =>
  computeEntityUsageStats(
    logsInRange.value,
    reportEntityDictionary.value,
  ).filter(
    (row) =>
      statsTypeFilter.value.length === 0 ||
      statsTypeFilter.value.includes(row.entity.type),
  ),
);
const statSummary = computed(() => {
  const reportIds = new Set(logsInRange.value.map((log) => log.reportId));
  return {
    entityCount: statsRows.value.length,
    hitCount: logsInRange.value.filter((log) => log.entityId).length,
    reportCount: reportIds.size,
  };
});

// 查看「哪些报告用到了该实体」
const drawerOpen = ref(false);
const drawerEntity = ref<null | ReportEntity>(null);
const drawerLogs = computed(() =>
  drawerEntity.value ? entityLogsFor(drawerEntity.value.id) : [],
);
const drawerReports = computed(() =>
  drawerEntity.value ? reportsUsingEntity(drawerEntity.value.id) : [],
);
function openReportsDrawer(entity: ReportEntity) {
  drawerEntity.value = entity;
  drawerOpen.value = true;
}
function gotoReport(reportId: string) {
  void router.push({ name: 'MateNextReviewReport', query: { reportId } });
}

// ===== Tab 2：识别流水 =====
const logEntityFilter = ref<string | undefined>(undefined);
const logRows = computed(() => {
  const rows = logsInRange.value.filter(
    (log) => !logEntityFilter.value || log.entityId === logEntityFilter.value,
  );
  return rows.toSorted((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
});
const entityOptions = computed(() =>
  reportEntityDictionary.value.map((e) => ({
    label: `${e.name}（${e.type}）`,
    value: e.id,
  })),
);
function resolveEntity(log: EntityRecognitionLog) {
  if (!log.entityId) return null; // 未归一化
  return (
    reportEntityDictionary.value.find((e) => e.id === log.entityId) ?? undefined
  ); // undefined = 已删除
}
const logColumns = [
  { dataIndex: 'createdAt', key: 'createdAt', title: '时间', width: 110 },
  { dataIndex: 'mention', key: 'mention', title: '原始提及' },
  { key: 'author', title: '汇报人', width: 100 },
  { dataIndex: 'type', key: 'type', title: '类型', width: 90 },
  { dataIndex: 'action', key: 'action', title: '动作', width: 100 },
  { dataIndex: 'confidence', key: 'confidence', title: '置信度', width: 90 },
  { key: 'report', title: '报告' },
];

// ===== Tab 3：实体治理 =====
const keyword = ref('');
const dictRows = computed(() => {
  const kw = keyword.value.trim();
  const rows = reportEntityDictionary.value;
  if (!kw) return rows;
  return rows.filter(
    (e) =>
      e.name.includes(kw) ||
      (e.description || '').includes(kw) ||
      (e.aliases || []).some((a) => a.includes(kw)),
  );
});
const entityTypeOptions = (
  Object.keys(reportEntityTypeMeta) as Array<keyof typeof reportEntityTypeMeta>
).map((key) => ({ label: reportEntityTypeMeta[key].label, value: key }));

// 编辑 / 新增
const editOpen = ref(false);
const editForm = ref<null | ReportEntity>(null);
const editAliasesText = ref('');
function openCreate() {
  editForm.value = { description: '', id: '', name: '', type: '产品' };
  editAliasesText.value = '';
  editOpen.value = true;
}
function openEdit(entity: ReportEntity) {
  editForm.value = { ...entity };
  editAliasesText.value = (entity.aliases || []).join('，');
  editOpen.value = true;
}
function saveEntity() {
  const form = editForm.value;
  if (!form) return;
  const aliases = editAliasesText.value
    .split(/[,，、\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!form.name.trim()) {
    message.warning('请填写实体名称');
    return;
  }
  if (form.id) {
    updateReportEntity(form.id, {
      aliases,
      description: form.description,
      name: form.name,
      type: form.type,
    });
    message.success('实体已更新');
  } else {
    const ok = addReportEntity({
      aliases,
      description: form.description,
      name: form.name,
      type: form.type,
    });
    if (!ok) {
      message.warning('已存在同名同类型实体');
      return;
    }
    message.success('实体已创建');
  }
  editOpen.value = false;
}

// 合并
const mergeOpen = ref(false);
const mergeSource = ref<null | ReportEntity>(null);
const mergeTargetId = ref<string | undefined>(undefined);
const mergeCandidates = computed(() =>
  reportEntityDictionary.value
    .filter((e) => e.id !== mergeSource.value?.id)
    .map((e) => ({ label: `${e.name}（${e.type}）`, value: e.id })),
);
const mergePreview = computed(() => {
  const source = mergeSource.value;
  const target = reportEntityDictionary.value.find(
    (e) => e.id === mergeTargetId.value,
  );
  if (!source || !target) return [];
  return [
    ...(target.aliases || []),
    source.name,
    ...(source.aliases || []),
  ].filter(
    (alias, index, arr) =>
      alias && alias !== target.name && arr.indexOf(alias) === index,
  );
});
function openMerge(entity: ReportEntity) {
  mergeSource.value = entity;
  mergeTargetId.value = undefined;
  mergeOpen.value = true;
}
function confirmMerge() {
  if (!mergeSource.value || !mergeTargetId.value) {
    message.warning('请选择要并入的目标实体');
    return;
  }
  if (mergeReportEntities(mergeSource.value.id, mergeTargetId.value)) {
    message.success(
      `已将「${mergeSource.value.name}」并入「${
        reportEntityDictionary.value.find((e) => e.id === mergeTargetId.value)
          ?.name
      }」`,
    );
  }
  mergeOpen.value = false;
}

// 删除（兜底：词典移除 + 流水标记未归一化）
function deleteEntity(entity: ReportEntity) {
  removeReportEntity(entity.id);
  markEntityLogsUnmapped(entity.id);
  if (drawerEntity.value?.id === entity.id) drawerOpen.value = false;
  message.success(`已删除「${entity.name}」，相关流水标记为未归一化`);
}

function usageCountOf(entityId: string) {
  return allLogs.value.filter((log) => log.entityId === entityId).length;
}

const reportStatusMeta: Record<string, { color: string; label: string }> = {
  draft: { color: 'default', label: '草稿' },
  reviewed: { color: 'green', label: '已审阅' },
  submitted: { color: 'blue', label: '待审阅' },
};

// Table 插槽 record 为 Record<string, any>，模板索引用宽松版元数据
type EntityTypeMeta = (typeof reportEntityTypeMeta)[ReportEntity['type']];
const typeMetaLoose = reportEntityTypeMeta as Record<string, EntityTypeMeta>;
const actionMetaLoose = entityLogActionMeta as Record<
  string,
  { color: string; label: string }
>;

// 表格列
const statsColumns = [
  { dataIndex: 'name', key: 'name', title: '实体' },
  { dataIndex: 'type', key: 'type', title: '类型', width: 90 },
  { dataIndex: 'count', key: 'count', title: '使用次数', width: 120 },
  { dataIndex: 'lastUsedAt', key: 'lastUsedAt', title: '最近使用', width: 110 },
  { key: 'actions', title: '操作', width: 110 },
];
const dictColumns = [
  { dataIndex: 'name', key: 'name', title: '实体' },
  { dataIndex: 'type', key: 'type', title: '类型', width: 90 },
  { dataIndex: 'aliases', key: 'aliases', title: '别名' },
  { key: 'usage', title: '累计使用', width: 90 },
  { key: 'actions', title: '操作', width: 200 },
];
</script>

<template>
  <section class="entity-page">
    <Tabs class="entity-tabs">
      <!-- ===== 使用统计 ===== -->
      <Tabs.TabPane key="stats" tab="使用统计">
        <div class="toolbar">
          <Radio.Group v-model:value="preset" option-type="button">
            <Radio.Button
              v-for="item in entityPeriodPresets"
              :key="item.key"
              :value="item.key"
            >
              {{ item.label }}
            </Radio.Button>
          </Radio.Group>
          <Select
            v-model:value="statsTypeFilter"
            :options="entityTypeOptions"
            allow-clear
            class="entity-select"
            mode="multiple"
            placeholder="按实体类型筛选"
          />
          <span class="toolbar-hint">
            统计范围：{{ range[0] || '最早' }} ~ {{ range[1] || '至今' }}
          </span>
        </div>
        <div class="summary-grid">
          <article>
            <strong>{{ statSummary.entityCount }}</strong>
            <span>在用实体</span>
          </article>
          <article>
            <strong>{{ statSummary.hitCount }}</strong>
            <span>识别次数</span>
          </article>
          <article>
            <strong>{{ statSummary.reportCount }}</strong>
            <span>覆盖报告</span>
          </article>
        </div>
        <Table
          :columns="statsColumns"
          :data-source="statsRows"
          :pagination="{ pageSize: 8 }"
          row-key="entity.id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div class="entity-cell">
                <span
                  class="entity-dot"
                  :style="{
                    background: typeMetaLoose[record.entity.type].bg,
                    color: typeMetaLoose[record.entity.type].color,
                  }"
                >
                  <Icon :icon="typeMetaLoose[record.entity.type].icon" />
                </span>
                <div>
                  <strong>{{ record.entity.name }}</strong>
                  <p v-if="record.entity.aliases?.length" class="entity-alias">
                    {{ record.entity.aliases.join('、') }}
                  </p>
                </div>
              </div>
            </template>
            <template v-else-if="column.key === 'type'">
              <Tag :color="typeMetaLoose[record.entity.type].color">
                {{ record.entity.type }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'count'">
              <div class="count-cell">
                <strong>{{ record.count }}</strong>
                <span class="count-bar">
                  <i
                    :style="{
                      width: `${Math.min(100, (record.count / Math.max(1, statsRows[0]?.count || 1)) * 100)}%`,
                    }"
                  ></i>
                </span>
              </div>
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                type="link"
                size="small"
                @click="openReportsDrawer(record.entity)"
              >
                查看报告
              </Button>
            </template>
          </template>
        </Table>
      </Tabs.TabPane>

      <!-- ===== 识别流水 ===== -->
      <Tabs.TabPane key="logs" tab="识别流水">
        <div class="toolbar">
          <Radio.Group v-model:value="preset" option-type="button">
            <Radio.Button
              v-for="item in entityPeriodPresets"
              :key="item.key"
              :value="item.key"
            >
              {{ item.label }}
            </Radio.Button>
          </Radio.Group>
          <Select
            v-model:value="logEntityFilter"
            :options="entityOptions"
            allow-clear
            class="entity-select"
            placeholder="按实体筛选"
          />
        </div>
        <Table
          :columns="logColumns"
          :data-source="logRows"
          :pagination="{ pageSize: 10 }"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'author'">
              {{ reportAuthorOf(record.reportId) }}
            </template>
            <template v-else-if="column.key === 'type'">
              <Tag
                v-if="resolveEntity(record as EntityRecognitionLog)"
                :color="
                  typeMetaLoose[
                    resolveEntity(record as EntityRecognitionLog)?.type ?? ''
                  ].color
                "
              >
                {{ resolveEntity(record as EntityRecognitionLog)?.type }}
              </Tag>
              <span v-else class="text-muted-foreground">—</span>
            </template>
            <template v-else-if="column.key === 'action'">
              <Tag :color="actionMetaLoose[record.action].color">
                {{ actionMetaLoose[record.action].label }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'confidence'">
              {{ Math.round(record.confidence * 100) }}%
            </template>
            <template v-else-if="column.key === 'report'">
              {{
                reportArchive.find((r) => r.id === record.reportId)?.title ||
                record.reportId
              }}
            </template>
          </template>
        </Table>
      </Tabs.TabPane>

      <!-- ===== 实体治理 ===== -->
      <Tabs.TabPane key="governance" tab="实体治理">
        <div class="toolbar">
          <Input.Search
            v-model:value="keyword"
            class="keyword-input"
            placeholder="搜索实体名称 / 别名 / 描述"
          />
          <Button type="primary" @click="openCreate">
            <Icon icon="lucide:plus" />
            新增实体
          </Button>
        </div>
        <Table
          :columns="dictColumns"
          :data-source="dictRows"
          :pagination="{ pageSize: 10 }"
          row-key="id"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <div>
                <strong>{{ record.name }}</strong>
                <p v-if="record.description" class="entity-desc">
                  {{ record.description }}
                </p>
              </div>
            </template>
            <template v-else-if="column.key === 'type'">
              <Tag :color="typeMetaLoose[record.type].color">
                {{ record.type }}
              </Tag>
            </template>
            <template v-else-if="column.key === 'aliases'">
              <template v-if="record.aliases?.length">
                <Tag
                  v-for="alias in record.aliases"
                  :key="alias"
                  closable
                  @close="removeEntityAlias(record.id, alias)"
                >
                  {{ alias }}
                </Tag>
              </template>
              <Button
                v-if="record.aliases?.length"
                size="small"
                type="text"
                @click="openEdit(record as ReportEntity)"
              >
                管理
              </Button>
              <Button
                v-else
                size="small"
                type="text"
                @click="openEdit(record as ReportEntity)"
              >
                添加别名
              </Button>
            </template>
            <template v-else-if="column.key === 'usage'">
              {{ usageCountOf(record.id) }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <Button
                type="link"
                size="small"
                @click="openEdit(record as ReportEntity)"
              >
                编辑
              </Button>
              <Button
                type="link"
                size="small"
                @click="openMerge(record as ReportEntity)"
              >
                合并
              </Button>
              <Popconfirm
                title="删除该实体？"
                description="相关识别流水将标记为「未归一化」"
                @confirm="deleteEntity(record as ReportEntity)"
              >
                <Button danger type="link" size="small">删除</Button>
              </Popconfirm>
            </template>
          </template>
        </Table>
      </Tabs.TabPane>
    </Tabs>

    <!-- 报告使用抽屉 -->
    <Drawer
      :open="drawerOpen"
      :title="`用到「${drawerEntity?.name}」的报告`"
      width="420"
      @close="drawerOpen = false"
    >
      <div class="drawer-stats">
        累计识别
        <strong>{{ drawerLogs.length }}</strong>
        次 · 覆盖
        <strong>{{ drawerReports.length }}</strong>
        份报告
      </div>
      <article
        v-for="report in drawerReports"
        :key="report.id"
        class="report-row"
      >
        <div>
          <strong>{{ report.title }}</strong>
          <p>
            {{ report.startDate }} ~ {{ report.endDate }}
            <Tag :color="reportStatusMeta[report.status]?.color">
              {{ reportStatusMeta[report.status]?.label }}
            </Tag>
          </p>
        </div>
        <Button size="small" @click="gotoReport(report.id)">查看</Button>
      </article>
    </Drawer>

    <!-- 编辑 / 新增实体 -->
    <Modal
      v-model:open="editOpen"
      :title="editForm?.id ? '编辑实体' : '新增实体'"
      ok-text="保存"
      @ok="saveEntity"
    >
      <div class="form-grid">
        <label>
          名称
          <Input v-model:value="editForm!.name" placeholder="实体名称" />
        </label>
        <label>
          类型
          <Select
            v-model:value="editForm!.type"
            :options="entityTypeOptions"
            class="w-full"
          />
        </label>
        <label class="form-span">
          描述
          <Input.TextArea
            v-model:value="editForm!.description"
            :rows="2"
            placeholder="实体描述"
          />
        </label>
        <label class="form-span">
          别名（逗号分隔，报告中命中这些称呼会自动归一化）
          <Input v-model:value="editAliasesText" placeholder="如：王工，老王" />
        </label>
      </div>
    </Modal>

    <!-- 合并实体 -->
    <Modal
      v-model:open="mergeOpen"
      title="合并重复实体"
      ok-text="确认合并"
      @ok="confirmMerge"
    >
      <p class="merge-desc">
        将「
        <strong>{{ mergeSource?.name }}</strong>
        」并入目标实体：其别名会合并到目标，历史识别流水改指向目标，自身从词典中删除。
      </p>
      <Select
        v-model:value="mergeTargetId"
        :options="mergeCandidates"
        class="w-full"
        placeholder="选择要保留的目标实体"
        show-search
        option-filter-prop="label"
      />
      <div v-if="mergePreview.length > 0" class="merge-preview">
        合并后别名：
        <Tag v-for="alias in mergePreview" :key="alias">{{ alias }}</Tag>
      </div>
    </Modal>
  </section>
</template>

<style scoped>
.entity-page {
  width: 100%;
  height: 100%;
  padding: 26px;
  overflow: auto;
  background: #f6f9f8;
  border: 1px solid #d7e4df;
  border-radius: 14px;
}

.entity-tabs {
  margin-top: 18px;
}

.toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 14px;
}

.toolbar-hint {
  font-size: 12px;
  color: #8aa39b;
}

.entity-select {
  width: 240px;
}

.keyword-input {
  width: 300px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 14px;
}

.summary-grid article {
  padding: 14px 16px;
  background: #fff;
  border: 1px solid #e3eeea;
  border-radius: 12px;
}

.summary-grid strong {
  display: block;
  font-size: 22px;
  color: #0d6853;
}

.summary-grid span {
  font-size: 12px;
  color: #687f77;
}

.entity-cell {
  display: flex;
  gap: 10px;
  align-items: center;
}

.entity-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 16px;
  border-radius: 9px;
}

.entity-alias {
  margin: 2px 0 0;
  font-size: 12px;
  color: #8aa39b;
}

.entity-desc {
  margin: 2px 0 0;
  font-size: 12px;
  color: #8aa39b;
}

.count-cell {
  display: flex;
  gap: 8px;
  align-items: center;
}

.count-cell strong {
  min-width: 18px;
  color: #0d6853;
}

.count-bar {
  display: inline-block;
  width: 60px;
  height: 6px;
  overflow: hidden;
  background: #e3eeea;
  border-radius: 3px;
}

.count-bar i {
  display: block;
  height: 100%;
  background: #0d6853;
  border-radius: 3px;
}

.drawer-stats {
  padding: 10px 12px;
  margin-bottom: 14px;
  font-size: 13px;
  color: #687f77;
  background: #f0f7f4;
  border-radius: 10px;
}

.drawer-stats strong {
  color: #0d6853;
}

.report-row {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #edf3f0;
}

.report-row p {
  margin: 4px 0 0;
  font-size: 12px;
  color: #8aa39b;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  color: #4d635c;
}

.form-span {
  grid-column: span 2;
}

.merge-desc {
  margin-bottom: 12px;
  line-height: 1.7;
  color: #4d635c;
}

.merge-preview {
  padding: 10px 12px;
  margin-top: 12px;
  background: #f0f7f4;
  border-radius: 10px;
}
</style>
