<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { Button, Input, Modal, Select, Table, message } from 'ant-design-vue';
import type { ReviewReport } from '#/api/mock-new-review';
import { reviewKey } from '#/api/mock-new-review';
import { zhijiPeople } from '#/api/mock-zhiji';
import { shareReviewReport } from '#/api/mock-review-sharing';

const props = defineProps<{
  entry: ReviewReport;
  open: boolean;
  employeeId: string;
}>();
const emit = defineEmits<{ close: [] }>();
const router = useRouter();
const search = ref('');
const department = ref('all');
const page = ref(1);
const selected = ref<string[]>([]);
const saving = ref(false);
const existing = computed(() => [
  ...new Set([
    ...props.entry.report.recipients,
    ...props.entry.report.reviewers,
    props.entry.author,
  ]),
]);
const departments = [
  { label: '全部部门', value: 'all' },
  ...[...new Set(zhijiPeople.map((person) => person.department))].map(
    (value) => ({ label: value, value }),
  ),
];
const people = computed(() =>
  zhijiPeople.filter(
    (person) =>
      (department.value === 'all' || person.department === department.value) &&
      `${person.label} ${person.number}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase()),
  ),
);
const chosen = computed(() =>
  zhijiPeople.filter((person) => selected.value.includes(person.value)),
);
const columns = [
  { title: '姓名', dataIndex: 'label', key: 'name', width: 150 },
  { title: '部门', dataIndex: 'department', key: 'department' },
  { title: '工号', dataIndex: 'number', key: 'number', width: 105 },
  { title: '可见状态', key: 'access', width: 85 },
];
const selection = computed(() => ({
  selectedRowKeys: selected.value,
  preserveSelectedRowKeys: true,
  onChange: (keys: (string | number)[]) => {
    selected.value = keys.map(String);
  },
  getCheckboxProps: () => ({ disabled: saving.value }),
}));
const shareUrl = computed(
  () =>
    new URL(
      router.resolve({
        name: 'NewReviewAssistantReportDetail',
        params: { employeeId: props.employeeId },
        query: {
          report: props.entry.id,
          version: String(props.entry.report.version),
          share: '1',
        },
      }).href,
      window.location.origin,
    ).href,
);
watch([() => props.open, () => reviewKey(props.entry)], () => {
  search.value = '';
  department.value = 'all';
  page.value = 1;
  selected.value = [];
});
watch([search, department], () => {
  page.value = 1;
});
async function confirmShare() {
  if (saving.value || !selected.value.length) return;
  saving.value = true;
  try {
    const result = await shareReviewReport(
      props.entry.id,
      props.entry.report.version,
      selected.value,
    );
    message.success(
      result.data.added
        ? `已增加 ${result.data.added} 位只读分享人员，未发送真实通知`
        : '所选人员已可见，未重复添加',
    );
    selected.value = [];
  } catch (error) {
    message.error(error instanceof Error ? error.message : '分享失败，请重试');
  } finally {
    saving.value = false;
  }
}
async function copyLink() {
  try {
    if (!navigator.clipboard) {
      message.info('请在链接框中手动复制');
      return;
    }
    await navigator.clipboard.writeText(shareUrl.value);
    message.success('已复制只读报告链接');
  } catch {
    message.info('暂时无法自动复制，请手动复制链接');
  }
}
</script>

<template>
  <Modal
    :open="open"
    title="分享报告"
    :width="700"
    :footer="null"
    :closable="!saving"
    :mask-closable="!saving"
    :keyboard="!saving"
    @cancel="emit('close')"
  >
    <div class="review-sharing">
      <div class="sharing-summary">
        <span class="sharing-icon"><Icon icon="lucide:share-2" /></span>
        <div>
          <b>{{ entry.report.title }}</b>
          <p>
            {{ entry.report.start }} — {{ entry.report.end }} · V{{
              entry.report.version
            }}
          </p>
        </div>
        <span class="sharing-readonly"
          ><Icon icon="lucide:lock-keyhole" />只读分享</span
        >
      </div>
      <p class="sharing-hint">分享人员可以查看报告，不会加入审批人名单。</p>
      <div class="existing-people">
        <span>当前可见</span>
        <div>
          <span v-for="name in existing" :key="name">{{ name }}</span>
        </div>
      </div>
      <div class="sharing-query">
        <Select
          v-model:value="department"
          :options="departments"
          :disabled="saving"
          aria-label="按部门筛选分享人员"
        /><Input
          v-model:value="search"
          allow-clear
          :disabled="saving"
          placeholder="搜索姓名或工号"
          aria-label="搜索分享人员"
          ><template #prefix><Icon icon="lucide:search" /></template
        ></Input>
      </div>
      <Table
        size="small"
        bordered
        :columns="columns"
        :data-source="people"
        row-key="value"
        :row-selection="selection"
        :scroll="{ x: 510 }"
        :pagination="{
          current: page,
          pageSize: 6,
          showSizeChanger: false,
          showTotal: (total: number) => `共 ${total} 人`,
          onChange: (value: number) => (page = value),
        }"
        ><template #bodyCell="{ column, record }"
          ><span v-if="column.key === 'name'" class="sharing-person"
            ><i>{{ record.label.slice(0, 1) }}</i
            >{{ record.label }}</span
          ><span
            v-else-if="column.key === 'access'"
            class="access-label"
            :class="{ visible: existing.includes(record.label) }"
            >{{ existing.includes(record.label) ? '已可见' : '未分享' }}</span
          ></template
        ></Table
      >
      <div v-if="chosen.length" class="sharing-chosen">
        <span>已选 {{ chosen.length }} 人</span>
        <div>
          <button
            v-for="person in chosen"
            :key="person.value"
            type="button"
            :disabled="saving"
            :aria-label="`移除${person.label}`"
            @click="selected = selected.filter((id) => id !== person.value)"
          >
            {{ person.label }}<Icon icon="lucide:x" />
          </button>
        </div>
      </div>
      <div class="sharing-actions">
        <Button :disabled="saving" @click="emit('close')">完成</Button
        ><Button
          type="primary"
          :loading="saving"
          :disabled="!selected.length"
          @click="confirmShare"
          ><Icon icon="lucide:share-2" />确认分享<span v-if="selected.length"
            >（{{ selected.length }}）</span
          ></Button
        >
      </div>
      <div class="sharing-link">
        <label for="review-share-url">只读报告链接</label>
        <div>
          <Input
            id="review-share-url"
            :value="shareUrl"
            readonly
            aria-label="只读报告链接"
          /><Button @click="copyLink"
            ><Icon icon="lucide:copy" />复制链接</Button
          >
        </div>
      </div>
      <p class="sharing-footnote">
        当前为前端演示，分享记录刷新后重置，不发送真实通知。
      </p>
    </div>
  </Modal>
</template>

<style scoped>
.review-sharing {
  color: #3c5c46;
  padding-top: 7px;
}
.sharing-summary {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 14px;
  background: #f0f7f2;
  border: 1px solid #dce9df;
  border-radius: 11px;
}
.sharing-icon {
  display: grid;
  place-items: center;
  width: 35px;
  height: 35px;
  flex: 0 0 35px;
  border-radius: 10px;
  background: #dceee2;
  color: #4d8a64;
  font-size: 19px;
}
.sharing-summary > div {
  flex: 1;
  min-width: 0;
}
.sharing-summary b {
  font-weight: 600;
  font-size: 14px;
  color: #345d40;
}
.sharing-summary p {
  font-size: 12px;
  color: #809786;
  margin: 5px 0 0;
}
.sharing-readonly {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  color: #6c927b;
  white-space: nowrap;
}
.sharing-hint {
  font-size: 12px;
  color: #6c8574;
  line-height: 1.8;
  margin: 13px 0;
}
.existing-people {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  font-size: 12px;
  color: #86998c;
}
.existing-people > span {
  flex-shrink: 0;
  padding-top: 4px;
}
.existing-people > div {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  max-height: 80px;
  overflow: auto;
}
.existing-people > div > span {
  background: #f4f7f4;
  border: 1px solid #e4ece6;
  border-radius: 5px;
  padding: 3px 8px;
  color: #6d8775;
}
.sharing-query {
  display: flex;
  gap: 9px;
  margin-bottom: 14px;
}
.sharing-query :deep(.ant-select) {
  width: 165px;
  flex-shrink: 0;
}
.review-sharing :deep(.ant-table-thead > tr > th) {
  background: #eff6f1;
  color: #41664d;
  font-size: 12px;
  font-weight: 600;
}
.review-sharing :deep(.ant-table-tbody > tr > td) {
  font-size: 12px;
  padding: 8px;
}
.sharing-person {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}
.sharing-person i {
  display: grid;
  place-items: center;
  height: 24px;
  width: 24px;
  border-radius: 50%;
  background: #eaf2ec;
  color: #6b9076;
  font-size: 12px;
  font-style: normal;
}
.access-label {
  color: #97a59b;
  font-size: 12px;
}
.access-label.visible {
  color: #5f9571;
}
.sharing-chosen {
  display: flex;
  gap: 9px;
  align-items: flex-start;
  margin: 12px 0;
  font-size: 12px;
  color: #83988a;
}
.sharing-chosen > span {
  flex-shrink: 0;
  padding-top: 4px;
}
.sharing-chosen > div {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.sharing-chosen button {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: 1px solid #d8e7dc;
  border-radius: 15px;
  padding: 4px 9px;
  background: #f0f7f2;
  color: #5d8469;
  font-size: 12px;
  cursor: pointer;
}
.sharing-actions {
  display: flex;
  justify-content: flex-end;
  gap: 9px;
  margin: 15px 0;
}
.review-sharing :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  font-size: 12px;
}
.sharing-link {
  border-top: 1px solid #e2eae4;
  padding-top: 15px;
}
.sharing-link > label {
  display: block;
  color: #6e8977;
  font-size: 12px;
  margin-bottom: 8px;
}
.sharing-link > div {
  display: flex;
  gap: 8px;
}
.sharing-link :deep(.ant-input) {
  font-size: 12px;
  color: #809889;
}
.sharing-footnote {
  font-size: 12px;
  color: #94a499;
  margin: 10px 0 0;
  line-height: 1.7;
}
@media (max-width: 600px) {
  .sharing-query {
    flex-wrap: wrap;
  }
  .sharing-query :deep(.ant-select) {
    width: 100%;
  }
  .sharing-summary {
    flex-wrap: wrap;
  }
  .sharing-readonly {
    margin-left: 46px;
  }
  .sharing-actions :deep(.ant-btn) {
    min-height: 40px;
  }
}
</style>
